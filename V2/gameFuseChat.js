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
    // recipients => array of either usernames or user objects with whom the chat should be, or a group (coming soon).
    // TODO: can also be a group. Or some other type of "group". this will come once we have groups.
    //      it will be an instance method on group, called sendMessage, which will call this method with Group as the recipient.
    static async sendMessage(recipients, firstMessage, callback = undefined){
        try {
            recipients = Array.isArray(recipients) ? recipients : [recipients]
            let usernames, groupId;
            if (recipients.every(recipient => typeof (recipient) === 'string')) {
                usernames = recipients;
            } else if (recipients.every(recipient => recipient instanceof GameFuseUser)) {
                usernames = recipients.map(user => user.getUsername());
            // } else if (recipients.every(recipient => recipient instanceof GameFuseGroup)) {
            //     TODO: THIS BLOCK COMING SOON
            //     groupId = recipients[0].getId();
            } else {
                throw('All recipients passed must be of the same type: IDs, usernames, or GameFuseUser objects')
            }

            // NOTE: current user's username gets added on the backend if it is not already in the recipients parameter.
            
            // let body;
            // if(usernames !== undefined){ //
            let body = {
                text: firstMessage,
                usernames: usernames,
            }
            // TODO: this block coming soon
            // } else {
            //     // for a group.
            //     body = {
            //         text: firstMessage,
            //         group_id: groupId
            //     }
            // }

            const url = GameFuse.getBaseURL() + "/chats";
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
                GameFuse.Log("GameFuseUser sendMessage Success");

                // Add (or replace) the chat to the beginning of the chats array (newest chats go first)
                // Even if it's an existing chat, we want to replace it since the new chat data from the API will be the most up-to-date version.
                let currentUser = GameFuseUser.CurrentUser;
                let chatObject = GameFuseUtilities.convertJsonTo('GameFuseChat', response.data);
                currentUser.chats = currentUser.chats.filter(chat => chat.getID() !== chatObject.getID());
                currentUser.chats.unshift(chatObject);

                GameFuseUtilities.HandleCallback(
                    response,
                    `Chat and message added!`,
                    callback,
                    true
                );
            } else {
                GameFuseUtilities.HandleCallback(
                    response,
                    response.data, // message from the API
                    callback,
                    false
                );
            }
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
                this.messages.unshift(GameFuseUtilities.convertJsonTo('GameFuseMessage', response.data));
                GameFuseUtilities.HandleCallback(
                    response,
                    `Message sent!`,
                    callback,
                    true
                );
            } else {
                GameFuseUtilities.HandleCallback(
                    response,
                    response.data, // message from the API
                    callback,
                    false
                );
            }
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
                    this.messages.push(GameFuseUtilities.convertJsonTo('GameFuseMessage', messageJson));
                })

                GameFuseUtilities.HandleCallback(
                    response,
                    `Page ${page} of messages received!`,
                    callback,
                    true
                );
            } else {
                GameFuseUtilities.HandleCallback(
                    response,
                    response.data, // message from the API
                    callback,
                    false
                );
            }
        } catch (error) {
            console.log(error)
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }
}