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

    // recipients => array of user objects with whom the chat should be.
    // Can also just be a user object.
    // Can also be a clan. Or some other type of "group"
    static async sendMessage(recipients, firstMessage, callback = undefined){
        try {
            recipients = Array.isArray(recipients) ? recipients : [recipients]

            // TODO: should we allow all these different ways to pass the recipients? Or should we force them to send it as one specific way?
            let userIds, usernames;
            if (recipients.every(recipient => typeof (recipient) === 'number')) {
                userIds = recipients;
            } else if (recipients.every(recipient => recipient instanceof GameFuseUser)) {
                userIds = recipients.map(user => user.getID());
            } else if (recipients.every(recipient => typeof (recipient) === 'string')) {
                usernames = recipients;
            } else {
                throw('All recipients passed must be of the same type: IDs, usernames, or GameFuseUser objects')
            }

            let body;
            let currentUser = GameFuseUser.CurrentUser;
            if(userIds !== undefined){
                // use IDs. First append the current user.
                userIds.push(currentUser.getID());
                body = {
                    text: firstMessage,
                    user_ids: userIds,
                }
            } else {
                // use usernames. First append the current user.
                usernames.push(currentUser.getUsername());
                body = {
                    text: firstMessage,
                    usernames: usernames
                }
            }

            body['authentication_token'] = GameFuseUser.CurrentUser.getAuthenticationToken();

            const url = GameFuse.getBaseURL() + "/chats"

            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                body: JSON.stringify(body)
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);

            if (responseOk) {
                GameFuse.Log("GameFuseUser createChat Success");
                // Add or replace the chat to the array, regardless of whether it's an existing chat or a new chat,
                // since the new chat object from the API will be the most up-to-date version.
                let chatObject = GameFuseUtilities.convertJsonTo('GameFuseChat', response.data);
                currentUser.chats = currentUser.chats.filter(chat => chat.getID() !== chatObject.getID());
                currentUser.chats.push(chatObject);

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

    // use this method to send a message to chat
    async reply(messageText, callback = undefined){
        try {
            if(messageText === undefined || typeof messageText !== 'string' || messageText.length === 0){
                throw('message text must be a string of at least one character!')
            }

            let body = {
                message: {
                    chat_id: this.getID(),
                    text: messageText
                },
                authentication_token: GameFuseUser.CurrentUser.getAuthenticationToken()
            }
            const url = GameFuse.getBaseURL() + "/messages";
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                body: JSON.stringify(body)
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);

            if (responseOk) {
                GameFuse.Log("GameFuseChat reply success");
                // add the message to the chat object messages array
                this.messages.push(GameFuseUtilities.convertJsonTo('GameFuseMessage', response.data));
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

            const url = GameFuse.getBaseURL() + `/messages/page/${page}?chat_id=${this.getID()}&authentication_token=${GameFuseUser.CurrentUser.getAuthenticationToken()}`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken() // TODO: not working
                }
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);

            if (responseOk) {
                GameFuse.Log("GameFuseChat getOlderMessages success");

                // loop over the new messages and add them to the messages array
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