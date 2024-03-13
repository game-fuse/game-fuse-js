class GameFuseChat {
    constructor(id, participants, messages){
        // NOTE: the participants parameter must come before messages so that the messages can access the participant user data in the UserCache.
        // See GameFuseJsonHelper.convertJsonToChat, and then see GameFuseJsonHelper.convertJsonToMessage
        this.id = id;
        this.participants = participants;
        this.messages = messages;
    }

    getID() {
        return this.id;
    }

    getMessages() {
        return this.messages;
    }

    getParticipants() {
        return this.participants;
    }

    // Use this method to create a new chat object and add a message to it. It will first search for an existing chat object before creating a new one.
    // recipients => array of usernames, user objects, or a group. Can be multiple in an array or a single object, the method will handle either appropriately.
    static async sendMessage(recipients, firstMessage, callback = undefined){
        try {
            recipients = Array.isArray(recipients) ? recipients : [recipients]
            let usernames, groupId;
            if (recipients.every(recipient => typeof (recipient) === 'string')) {
                usernames = recipients;
            } else if (recipients.every(recipient => recipient instanceof GameFuseUser)) {
                // note: we could use userIDs here, but seemed easier to have just usernames or groupID, without the backend needing to handle the added case of userIds.
                usernames = recipients.map(user => user.getUsername());
            } else if (recipients.every(recipient => recipient instanceof GameFuseGroup)) {
                groupId = recipients[0].getID();
            } else {
                throw('Recipients parameter must all be of the same type: IDs, usernames, GameFuseUser objects, or a GameFuseGroup object')
            }

            // NOTE: current user's username gets added on the backend if it is not already in the recipients parameter.
            let body;
            if(usernames != null){
                // for a direct chat between 2 or more users
                body = {
                    text: firstMessage,
                    usernames: usernames,
                }
            } else {
                // for a chat within an existing group
                body = {
                    text: firstMessage,
                    group_id: groupId
                }
            }
            let currentUser = GameFuseUser.CurrentUser;
            const url = `${GameFuse.getBaseURL()}/chats`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                },
                body: JSON.stringify(body)
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);

            if (responseOk) {
                GameFuse.Log("GameFuseUser sendMessage Success");

                // Add (and replace, if applicable) the chat to the front of the chats array (newest chats go first).
                // Even if it's an existing chat, we want to replace it since the new chat data from the API will be the most up-to-date version.
                let chatObject = GameFuseJsonHelper.convertJsonToChat(response.data);
                if(response.data.creator_type === 'Group'){
                    // group chat
                    currentUser.groupChats = currentUser.groupChats.filter(chat => chat.getID() !== chatObject.getID());
                    currentUser.groupChats.unshift(chatObject);
                } else {
                    // direct chat
                    currentUser.directChats = currentUser.directChats.filter(chat => chat.getID() !== chatObject.getID());
                    currentUser.directChats.unshift(chatObject);
                }
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? 'Chat and message added!' : response.data, // message from the api
                callback,
                !!responseOk
            )


        } catch (error) {
            console.log(error)
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // Use this method to send a message to an existing chat
    async sendMessage(messageText, callback = undefined){
        try {
            if(messageText == null || typeof messageText !== 'string' || messageText === ''){
                throw('message text must be a string of at least one character!')
            }

            let body = {
                message: {
                    chat_id: this.getID(),
                    text: messageText
                },
            }
            const url = `${GameFuse.getBaseURL()}/messages`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                body: JSON.stringify(body)
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);

            if (responseOk) {
                GameFuse.Log("GameFuseChat sendMessage success");
                // add the message to the front of the chat object messages array (newest messages go first)
                this.messages.unshift(GameFuseJsonHelper.convertJsonToMessage(response.data));
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? 'Message sent!' : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error)
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // Use this method to fetch older messages beyond the default 25 per chat that the API sends back.
    async getOlderMessages(page = 2, callback = undefined){
        try {
            if(typeof page !== 'number' || page < 2){
                throw('page parameter must be a number of 2 or more! page 1 comes back with the default data on sign in.');
            }

            const url = `${GameFuse.getBaseURL()}/messages/page/${page}?chat_id=${this.getID()}`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                }
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);

            if (responseOk) {
                GameFuse.Log("GameFuseChat getOlderMessages success");

                // loop over these older messages and add them to the end of the messages array, since they are older.
                // For this to be accurate, the game developer must call this method in order of page number i.e. page 2, then page 3, then page 4, etc., not out of order.
                response.data.forEach(messageJson => {
                    this.messages.push(GameFuseJsonHelper.convertJsonToMessage(messageJson));
                })
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Page ${page} of messages received!` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error)
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // get chat objects from API, passing a "page number" to get chats other than the most recent 25.
    static async getOlderChats(page = 2, callback = undefined) {
        try {
            if (typeof page !== 'number' || page < 2) {
                throw ('Page parameter must be a number that is 2 or greater!')
            }

            let currentUser = GameFuseUser.CurrentUser;

            const url = GameFuse.getBaseURL() + `/chats/page/${page}`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                }
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);

            if (responseOk) {
                GameFuse.Log("GameFuseChat getOlderChats success");

                // loop over the new chats and add them to the chats array, at the end of the array since they are older.
                response.data.direct_chats.forEach(chatJson => {
                    currentUser.directChats.push(GameFuseJsonHelper.convertJsonToChat(chatJson));
                })

                response.data.group_chats.forEach(chatJson => {
                    currentUser.groupChats.push(GameFuseJsonHelper.convertJsonToChat(chatJson));
                })
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Page ${page} of chats received!` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error)
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }
}