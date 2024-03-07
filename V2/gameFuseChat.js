class GameFuseChat {
    constructor(id, participants, messages){
        this.id = id
        this.participants = participants; // participants must be before messages so that the messages can access the participant user data in the UserCache
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

    // Use this method to create a new chat object (although it will add to the existing chat appropriately if the chat already exists).
    // recipients => array of either usernames, user objects, or a group
    static async sendMessage(recipients, firstMessage, callback = undefined){
        try {
            recipients = Array.isArray(recipients) ? recipients : [recipients]
            let usernames, groupId;
            if (recipients.every(recipient => typeof (recipient) === 'string')) {
                usernames = recipients;
            } else if (recipients.every(recipient => recipient instanceof GameFuseUser)) {
                usernames = recipients.map(user => user.getUsername());
            } else if (recipients.every(recipient => recipient instanceof GameFuseGroup)) {
                groupId = recipients[0].getID();
            } else {
                throw('All recipients passed must be of the same type: IDs, usernames, or GameFuseUser objects')
            }

            // NOTE: current user's username gets added on the backend if it is not already in the recipients parameter.
            let body;
            if(usernames !== undefined){
                body = {
                    text: firstMessage,
                    usernames: usernames,
                }
            } else {
                // for a group
                body = {
                    text: firstMessage,
                    group_id: groupId
                }
            }
            let currentUser = GameFuseUser.CurrentUser;
            const url = GameFuse.getBaseURL() + "/chats";
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

                // Add (or replace) the chat to the beginning of the chats array (newest chats go first)
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

    // use this method to send a message to an existing chat
    async sendMessage(messageText, callback = undefined){
        try {
            if(messageText === undefined || typeof messageText !== 'string' || messageText.length === 0){
                throw('message text must be a string of at least one character!')
            }

            let body = {
                message: {
                    chat_id: this.getID(),
                    text: messageText
                },
            }
            const url = GameFuse.getBaseURL() + "/messages";
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
                // add the message to the beginning of the chat object messages array (newest messages go first)
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

    // Use this method to fetch older messages beyond the default 25 that the API sends back.
    async getOlderMessages(page = 2, callback = undefined){
        try {
            if(typeof page !== 'number' || page < 2){
                throw('page parameter must be a number of 2 or more! page 1 comes back with the default data on sign in.');
            }

            const url = GameFuse.getBaseURL() + `/messages/page/${page}?chat_id=${this.getID()}`;
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
}