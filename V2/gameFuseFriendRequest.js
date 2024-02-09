class GameFuseFriendRequest {
    constructor(friendshipId, requestedAt, otherUser) {
        this.friendshipId = friendshipId
        this.requestedAt = requestedAt;
        this.otherUser = otherUser;
    }

    getOtherUser() {
        return this.otherUser;
    }

    getFriendshipId() {
        return this.friendshipId;
    }

    getRequestedAt() {
        return this.requestedAt;
    }

    async processFriendRequest(acceptedOrRejected, callback) {
        try {
            GameFuse.Log(`GameFuseFriendRequest Accept Request for user with username ${this.getOtherUser().getUsername()}`);
            const url = GameFuse.getBaseURL() + "/friendships/" + this.getFriendshipId();
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
                GameFuseUser.CurrentUser.setFriendshipData(response.data.friends, response.data.incoming_friend_requests, response.data.outgoing_friend_requests);
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

    async acceptFriendRequest(callback) {
        return this.processFriendRequest('accepted', callback);
    }

    async declineFriendRequest(callback) {
        return this.processFriendRequest('rejected', callback);
    }

    async deleteFriendRequest(callback) {
        try {
            GameFuse.Log(`GameFuseFriendRequest Delete Friend Request with the user of username ${this.getOtherUser().getUsername()}`);
            const url = GameFuse.getBaseURL() + "/friendships/" + this.getFriendshipId();

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
                GameFuseUser.CurrentUser.setFriendshipData(response.data.friends, response.data.incoming_friend_requests, response.data.outgoing_friend_requests);
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
}
