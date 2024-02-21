const Test = GameFuseTestingUtilities;
const currentUser = () => GameFuseUser.CurrentUser;

class GameFuseExampleFriendships {
    constructor(token, id) {
        this.gameToken = token;
        this.gameID = id;
    }

    start() {
        GameFuseTestingUtilities.startTest(this.testFriendships.bind(this), this)
    }

    async testFriendships() {
        // 1. Sign up 2 users
        [this.user1name, this.user1email, this.user1ID] = await Test.takeAction('signing up user1', Test, 'signUpUser');
        [this.user2name, this.user2email, this.user2ID] = await Test.takeAction('signing up user2', Test, 'signUpUser');

        // 2. Send a friend request
        await Test.takeActionWithCallback('user2 requests a friendship of user1', GameFuseFriendRequest, 'send', this.user1name);
        Test.expect(GameFuseUser.CurrentUser.getOutgoingFriendRequests()[0].getOtherUser().getUsername(), this.user1name, 'user2 should have user1 in their outgoing friend requests');

        // 3. Sign up a third user and request another friendship of user1, invoking it on a shell of a user1 object
        [this.user3name, this.user3email, this.user3ID] = await Test.takeAction('signing up user3', Test, 'signUpUser');
        let user1Object = new GameFuseUser(false, 0, undefined, undefined, this.user1name, 0, 0, this.user1ID, {}, [], [], undefined, true)
        await Test.takeActionWithCallback('user3 requests a friendship of user1, using the user object approach', user1Object, 'sendFriendRequest');

        // 4. Sign back in with user1 and expect things from them
        await Test.takeActionWithCallback('sign in user1', GameFuse, 'signIn', this.user1email, 'password');
        let incomingFriendRequestUsernames = JSON.stringify(GameFuseUser.CurrentUser.getIncomingFriendRequests().map(friendRequest => friendRequest.getOtherUser().getUsername()).sort());
        let expectedUsernames = JSON.stringify([this.user2name, this.user3name].sort());
        Test.expect(incomingFriendRequestUsernames, expectedUsernames, "check that user3's incoming friend requests have both user1 and user2")
        Test.expect(currentUser().getOutgoingFriendRequests().length, 0, 'check that user3 has no outgoing friend requests.')

        // 5. Ensure that the friend requests come back from the API in the right order.
        let incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests();
        let user3FriendRequest = incomingFriendRequests[0] // user3 should be the newest one.
        let user2FriendRequest = incomingFriendRequests[1]; // user2 should be the oldest one.
        Test.expect(user3FriendRequest.getOtherUser().getID(), this.user3ID, 'the first friend request should be the newest one (user3)')
        Test.expect(user2FriendRequest.getOtherUser().getID(), this.user2ID, 'the last friend request should be the oldest one (user2)')

        // 6. Accept one friend request and reject another, then expect appropriate data. Newest friend request should be first.
        await Test.takeActionWithCallback("accept user2's friend request", user2FriendRequest, 'accept');
        await Test.takeActionWithCallback("reject user3's friend request", user3FriendRequest, 'decline');
        let friends = GameFuseUser.CurrentUser.getFriends();
        incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests();
        let outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
        Test.expect(friends.length, 1, 'User1 should have 1 friend');
        Test.expect(friends[0].getUsername(), this.user2name, 'User1 should have user2 in their friend list');
        Test.expect(incomingFriendRequests.length, 0, 'User1 should have 0 incoming friend requests');
        Test.expect(outgoingFriendRequests.length, 0, 'User1 should have 0 outgoing friend requests');

        // 7. Sign in as user3 and expect appropriate data
        await Test.takeActionWithCallback('sign in user3', GameFuse, 'signIn', this.user3email, 'password');
        friends = GameFuseUser.CurrentUser.getFriends();
        incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests();
        outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
        Test.expect(friends.length, 0, 'User3 should have 0 friends');
        Test.expect(incomingFriendRequests.length, 0, 'User3 should have 0 incoming friend requests');
        Test.expect(outgoingFriendRequests.length, 0, 'User3 should have 0 outgoing friend requests');

        // 8. Have user3 request a friendship with user2, then expect appropriate data
        await Test.takeActionWithCallback('user3 requests a friendship of user2', GameFuseFriendRequest, 'send', this.user2name);
        console.log("check that user3's friend request is in their outgoing friend requests")
        outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
        let friendRequestToDelete = outgoingFriendRequests[0]
        Test.expect(outgoingFriendRequests.length, 1, 'user3 should now have 1 outgoing friend request');
        Test.expect(friendRequestToDelete.getOtherUser().getUsername(), this.user2name, 'The friend request to delete should be with user2')

        // 9. Have user3 delete the friend request with user2
        await Test.takeActionWithCallback('user3 deletes friend request with user2', friendRequestToDelete, 'delete');
        outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
        Test.expect(outgoingFriendRequests.length, 0, "check that there are no longer any friend requests in user3's outgoing friend request list");

        // 10. Sign in as user2 and expect appropriate data.
        await Test.takeActionWithCallback('Sign in user2', GameFuse, 'signIn', this.user2email, 'password')
        friends = GameFuseUser.CurrentUser.getFriends();
        incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests();
        outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
        Test.expect(friends.length, 1, 'User2 should have 1 friend');
        Test.expect(incomingFriendRequests.length, 0, 'user2 should have no incoming friend requests');
        Test.expect(outgoingFriendRequests.length, 0, 'user2 should have no outgoing friend requests');
        Test.expect(friends[0].getUsername(), this.user1name, 'user2 should have user1 in their friends list');

        // 11. Have user2 remove user1 from friends list and expect appropriate data
        await Test.takeActionWithCallback('user2 removes user1 as a friend', friends[0], 'unfriend')
        friends = GameFuseUser.CurrentUser.getFriends();
        Test.expect(friends.length, 0, 'User2 should have 0 friends');

        // 12. Sign in as user1 and expect appropriate data
        await Test.takeActionWithCallback('sign in user1', GameFuse, 'signIn', this.user3email, 'password');
        Test.expect(friends.length, 0, 'user1 should have 0 friends');

        // We've made it. Hallelujah!
        console.log("SUCCESS!! WE MADE IT TO THE END OF OF THE FRIENDSHIP TEST SCRIPT WITH NO ERRORS.")
    }
}

const example = new GameFuseExampleFriendships(ENV.gameToken, ENV.gameId);

example.start()
