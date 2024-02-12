class GameFuseFriendRequestExample {
    constructor(token, id) {
        this.gameToken = token;
        this.gameID = id;
    }

    start() {
        const random = Math.floor(Math.random() * 10000).toString();
        this.user1Email = `user1${random}@mundo.com`;
        this.user1name = `user1${random}`;
        this.user2Email = `user2${random}@mundo.com`;
        this.user2name = `user2${random}`;
        this.user3Email = `user3${random}@mundo.com`;
        this.user3name = `user3${random}`;
        let self = this
        if (this.gameToken === "" || this.gameID === "") {
            console.log(
                "Add ID and Token",
                "Please add your token and ID, if you do not have one, you can create a free account from gamefuse.co",
                "OK"
            );
            throw new Error("Token and ID Invalid");
        } else {
            console.log("GameFuse start");

            GameFuse.setVerboseLogging(true);
            GameFuse.setUpGame(this.gameID, this.gameToken, function(message,hasError){self.testFriendships(message,hasError)}, true);
        }
    }

    async testFriendships(message, hasError) {
        let self = this
        console.log('about to sign user1 up')
        await new Promise((resolve, reject) => {
            GameFuse.signUp(self.user1Email, "password", "password", self.user1name, (message, hasError) => {
                resolve(message)
            });
        });

        console.log('sign up user2')
        await new Promise((resolve, reject) => {
            GameFuse.signUp(self.user2Email, "password", "password", self.user2name, (message, hasError) => {
                resolve(message)
            });
        });

        console.log('user2 requests a friendship of user1')
        await new Promise((resolve, reject) => {
            GameFuseUser.CurrentUser.sendFriendRequest(self.user1name, (message, hasError) => {
                resolve(message)
            });
        });

        console.log("check that user2's outgoing friendships has user1")

        if(!GameFuseUser.CurrentUser.getOutgoingFriendRequests()[0].getOtherUser().getUsername() === self.user1name){
            throw('FAILED: user2 did not have user1 in their outgoing friend requests')
        }

        console.log('sign up user3')
        await new Promise((resolve, reject) => {
            GameFuse.signUp(self.user3Email, "password", "password", self.user3name, (message, hasError) => {
                resolve(message)
            });
        });

        console.log('user3 requests a friendship of user1')
        await new Promise((resolve, reject) => {
            GameFuseUser.CurrentUser.sendFriendRequest(self.user1name, (message, hasError) => {
                resolve(message)
            });
        });

        console.log('signIn user1')
        await new Promise((resolve, reject) => {
            GameFuse.signIn(self.user1Email, 'password', (message, hasError) => {
                resolve(message)
            });
        });

        console.log("check that user1's incoming friendships have both user1 and user2, and 0 outgoing friend requests.")
        let incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests().map(friendRequest => friendRequest.getOtherUser().getUsername()).sort()
        let expectedUsernames = [self.user2name, self.user3name].sort()
        if(JSON.stringify(incomingFriendRequests.sort()) !== JSON.stringify(expectedUsernames)){
            throw('FAILED FROM LINE 84')
        }

        console.log("accept user2's friend request")
        let user2FriendRequest = GameFuseUser.CurrentUser.getIncomingFriendRequests().find(friendRequest => friendRequest.otherUser.getUsername() === self.user2name);
        await new Promise((resolve, reject) => {
            user2FriendRequest.acceptFriendRequest((message, hasError) => {
                resolve(message);
            })
        });

        console.log("reject user3's friend request")
        let user3FriendRequest = GameFuseUser.CurrentUser.getIncomingFriendRequests().find(friendRequest => friendRequest.otherUser.getUsername() === self.user3name);
        await new Promise((resolve, reject) => {
            user3FriendRequest.declineFriendRequest((message, hasError) => {
                resolve(message);
            })
        });

        console.log("check that user1 has 1 friends in their friends list, and 0 friend requests")
        let friends = GameFuseUser.CurrentUser.getFriends();
        incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests();
        let outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
        if(friends.length !== 1 || incomingFriendRequests.length !== 0 || outgoingFriendRequests.length !== 0){
            throw('ERROR: There were not exactly 0 friend requests and 1 friend in the data for user1')
        }
        if(friends[0].getUsername() !== self.user2name){
            throw('The friend in our friend list was NOT user2, so something went wrong')
        }

        console.log("signIn user3")
        await new Promise((resolve, reject) => {
            GameFuse.signIn(self.user3Email, 'password', (message, hasError) => {
                resolve(message)
            });
        });

        console.log("make sure they have 0 friends and 0 requests")
        friends = GameFuseUser.CurrentUser.getFriends();
        incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests();
        outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
        if(friends.length !== 0 || incomingFriendRequests.length !== 0 || outgoingFriendRequests.length !== 0){
            throw('ERROR: There were not exactly 0 friend requests and 0 friends in the data for user3')
        }

        // TODO:
        console.log('user3 requests a friendship of user2')
        await new Promise((resolve, reject) => {
            GameFuseUser.CurrentUser.sendFriendRequest(self.user2name, (message, hasError) => {
                resolve(message)
            });
        });

        console.log("check that user3's friend request is in their outgoing friend requests")
        outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
        let friendRequestToDelete = outgoingFriendRequests[0]
        if(outgoingFriendRequests.length !== 1 || friendRequestToDelete.getOtherUser().getUsername() !== self.user2name){
            throw("User3's outgoing friend request list is not as it should be")
        }

        console.log("user3 deletes that friend request")
        await new Promise((resolve, reject) => {
            friendRequestToDelete.deleteFriendRequest((message, hasError) => {
                resolve(message)
            });
        });

        console.log("check that there are no longer any friend requests in user3's outgoing friend request list");
        outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
        if(outgoingFriendRequests.length !== 0){
            throw("There are friend requests in user3's outgoing friend requests list that should not be there!!")
        }

        console.log("signIn user2")
        await new Promise((resolve, reject) => {
            GameFuse.signIn(self.user2Email, 'password', (message, hasError) => {
                resolve(message)
            });
        });

        console.log("make sure user2 has 1 friend (user1) and 0 requests.")
        friends = GameFuseUser.CurrentUser.getFriends();
        incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests();
        outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();

        if(friends.length !== 1 || incomingFriendRequests.length !== 0 || outgoingFriendRequests.length !== 0){
            throw('ERROR: There were not exactly 0 friend requests and 0 friends in the data for user2')
        }
        if(friends[0].getUsername() !== self.user1name){
            throw('The friend in our friend list was NOT user1, so something went wrong')
        }

        console.log("user2 removes friend")
        await new Promise((resolve, reject) => {
            friends[0].unfriend((message, hasError) => {
                resolve(message);
            })
        });

        console.log("make sure user2 has 0 friends")
        friends = GameFuseUser.CurrentUser.getFriends();
        if(friends.length !== 0){
            throw('ERROR: There were not exactly 0 friends in the data for user2')
        }

        console.log("signIn user1")
        await new Promise((resolve, reject) => {
            GameFuse.signIn(self.user3Email, 'password', (message, hasError) => {
                resolve(message)
            });
        });

        console.log("make sure user1 has 0 friends")
        friends = GameFuseUser.CurrentUser.getFriends();
        if(friends.length !== 0){
            throw('ERROR: There were not exactly 0 friends in the data for user1')
        }

        console.log("SUCCESS!! WE MADE IT TO THE END OF OF THE FRIENDSHIP TEST SCRIPT WITH NO ERRORS.")
    }
}

const example = new GameFuseFriendRequestExample(ENV.gameToken, ENV.gameId);

example.start()

//

