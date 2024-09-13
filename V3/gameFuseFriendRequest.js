class GameFuseFriendRequest { // ==> refers to the Friendship rails model
    constructor(id, requestedAt, otherUser) {
        this.id = id
        this.requestedAt = requestedAt;
        this.otherUser = otherUser;
    }

    getOtherUser() {
        return this.otherUser;
    }

    getID() {
        return this.id;
    }

    getRequestedAt() {
        return this.requestedAt;
    }

    // Send a friend request
    static async send(username, callback = undefined) {
        try {
            let currentUser = GameFuseUser.CurrentUser;

            if(currentUser.getUsername() === username) {
                throw('Cannot send a friend request to yourself!');
            }

            GameFuse.Log("GameFuseUser sending friend request");

            const url = `${GameFuse.getBaseURL()}/friendships`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                },
                body: JSON.stringify({ username: username })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response)
            if (responseOk) {
                GameFuse.Log('GameFuseFriendRequest Send friend request Success!');

                // add this friend request to the front of the friend requests array
                currentUser.outgoingFriendRequests.unshift(
                    GameFuseJsonHelper.convertJsonToFriendRequest(response.data)
                );
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? 'friend request has been sent successfully' : response.data,
                callback,
                responseOk
            )
        } catch (error) {
            console.log(error)
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // cancel a friend request
    async cancel(callback) {
        try {
            GameFuse.Log(`GameFuseFriendRequest Cancel Friend Request with the user of username ${this.getOtherUser()?.getUsername()}`);
            const url = `${GameFuse.getBaseURL()}/friendships/${this.getID()}`;
            let currentUser = GameFuseUser.CurrentUser;

            const response = await GameFuseUtilities.processRequest(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                }
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);

            if (responseOk) {
                GameFuse.Log("GameFuseUser Cancel Friend Request Success");

                // remove this friendship from the friend requests list
                currentUser.outgoingFriendRequests = currentUser.outgoingFriendRequests.filter(friendReq => friendReq.getID() !== this.getID())
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? 'Friend request has been cancelled successfully' : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // Accept a friend request
    accept(callback) {
        return this.respond('accepted', callback);
    }

    // Decline a friend request
    decline(callback) {
        return this.respond('declined', callback);
    }

    // Private internal method that responds to a friend request (either accepting or declining)
    async respond(acceptedOrDeclined, callback) {
        try {
            if(!(['accepted', 'declined'].includes(acceptedOrDeclined))){
                throw("first parameter must be 'accepted' or 'declined'");
            }

            GameFuse.Log(`GameFuseFriendRequest Accept Request for user with username ${this.getOtherUser()?.getUsername()}`);
            const url = `${GameFuse.getBaseURL()}/friendships/${this.getID()}`;
            const data = {
                friendship: {
                    status: acceptedOrDeclined
                }
            };

            let currentUser = GameFuseUser.CurrentUser;

            const response = await GameFuseUtilities.processRequest(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                },
                body: JSON.stringify(data)
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log("GameFuseUser Get Friends Success");
                // remove from friend requests
                currentUser.incomingFriendRequests = currentUser.incomingFriendRequests.filter(friendReq => friendReq.getID() !== this.getID());

                if(acceptedOrDeclined === 'accepted'){
                    // add the user to the front of the friends list
                    currentUser.friends.unshift(this.getOtherUser()); // otherUser is a reference to the UserCache object
                }
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `friend request has been ${acceptedOrDeclined} successfully` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }
}
