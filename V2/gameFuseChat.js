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

    // Use this method to fetch older messages beyond the default 50 that the API sends back.
    async getPage(page = 2, callback = undefined){

    }
}