class GameFuseMessage {
    constructor(text, createdAt, user) {
        this.text = text;
        this.createdAt = createdAt;
        this.isFromMe = GameFuseUser.CurrentUser.getID() === user.getID();
        this.user = user
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
}