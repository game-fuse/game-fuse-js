class GameFuseFriendRequest {
    constructor(friendshipId, requestedAt, otherUser) {
        this.friendshipId = friendshipId
        this.requestedAt = requestedAt;
        this.otherUser = otherUser;
    }

    getOtherUser() {
        return this.otherUser;
    }

    getFriendshipID() {
        return this.friendshipId;
    }

    getRequestedAt() {
        return this.requestedAt;
    }

    // Send a friend request
    static async send(username, callback = undefined) {
        try {
            if(GameFuseUser.CurrentUser.getUsername() === username) {
                throw('Cannot send a friend request to yourself!')
            }

            GameFuse.Log("GameFuseUser sending friend request");

            const url = GameFuse.getBaseURL() + "/friendships"
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken() // this one not working
                },
                body: JSON.stringify({ username: username, authentication_token: GameFuseUser.CurrentUser.getAuthenticationToken() })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response)
            if (responseOk) {
                GameFuse.Log("GameFuseUser Get Friends Success");

                // add this friend request to the beginning of the friend requests array
                GameFuseUser.CurrentUser.outgoingFriendRequests.unshift(
                    GameFuseUtilities.convertJsonTo('GameFuseFriendRequest', response.data)
                );

                GameFuseUtilities.HandleCallback(
                    response,
                    "friend request has been sent successfully",
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

    // Delete a friend request
    async delete(callback) {
        try {
            GameFuse.Log(`GameFuseFriendRequest Delete Friend Request with the user of username ${this.getOtherUser().getUsername()}`);
            const url = GameFuse.getBaseURL() + "/friendships/" + this.getFriendshipID();

            const response = await GameFuseUtilities.processRequest(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                body: JSON.stringify({ authentication_token: GameFuseUser.CurrentUser.getAuthenticationToken() })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);

            if (responseOk) {
                GameFuse.Log("GameFuseUser Delete Friend Request Success");

                // remove this friendship from the friend requests list
                GameFuseUser.CurrentUser.outgoingFriendRequests = GameFuseUser.CurrentUser.outgoingFriendRequests.filter(friendReq => friendReq.getFriendshipID() !== this.getFriendshipID())

                GameFuseUtilities.HandleCallback(
                    response,
                    `friend request has been deleted successfully`,
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
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // Accept a friend request
    async accept(callback) {
        return this.respond('accepted', callback);
    }

    // Decline a friend request
    async decline(callback) {
        return this.respond('rejected', callback);
    }

    // Private internal method that responds to a friend request (either accepting or declining)
    async respond(acceptedOrRejected, callback) {
        try {
            GameFuse.Log(`GameFuseFriendRequest Accept Request for user with username ${this.getOtherUser().getUsername()}`);
            const url = GameFuse.getBaseURL() + "/friendships/" + this.getFriendshipID();
            const data = {
                friendship: {
                    status: acceptedOrRejected
                },
                authentication_token: GameFuseUser.CurrentUser.getAuthenticationToken()
            };

            const response = await GameFuseUtilities.processRequest(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                body: JSON.stringify(data)
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log("GameFuseUser Get Friends Success");
                // remove from friend requests
                GameFuseUser.CurrentUser.incomingFriendRequests = GameFuseUser.CurrentUser.incomingFriendRequests.filter(friendReq => friendReq.getFriendshipID() !== this.getFriendshipID());

                if(acceptedOrRejected === 'accepted'){
                    // add the user to the friends list, at the beginning
                    GameFuseUser.CurrentUser.friends.unshift(this.getOtherUser()); // otherUser is a reference to the UserCache object
                }

                GameFuseUtilities.HandleCallback(
                    response,
                    `friend request has been ${acceptedOrRejected} successfully`,
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
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }
}
