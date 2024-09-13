class GameFuseMessage {
    constructor(id, text, createdAt, user, isRead, readBy) {
        this.id = id;
        this.text = text;
        this.createdAt = createdAt;
        this.isFromMe = GameFuseUser.CurrentUser.getID() === user.getID();
        this.user = user
        this.isRead = isRead
        this.readBy = readBy
    }

    getText() {
        return this.text;
    }

    getCreatedAt() {
        return this.createdAt;
    }

    getUserID() {
        return this.userId;
    }

    getUser() {
        return this.user;
    }

    getIsFromMe() {
        return this.isFromMe;
    }
    
    getIsRead() {
        return this.isRead;
    }
    
    getReadBy() {
        return this.readBy;
    }
    
    getID() {
        return this.id;
    }
    
    async markAsRead(callback = undefined) {
        try {
            const currentUser = GameFuseUser.CurrentUser;
            const url = `${GameFuse.getBaseURL()}/messages/${this.getID()}/mark_as_read`;
    
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                }
            });
    
            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseMessage markAsRead success');
                if (!this.getReadBy().includes(currentUser.getID())) {
                    this.getReadBy().push(currentUser.getID());
                }
                this.isRead = true
            }
    
            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Message marked as read successfully` : response.data,
                callback,
                !!responseOk
            );
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(
                typeof response !== 'undefined' ? response : undefined,
                error.message,
                callback,
                false
            );
        }
    }
}
