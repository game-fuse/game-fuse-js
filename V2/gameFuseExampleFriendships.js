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
        [this.user1name, this.user1email, this.user1ID] = await Test.takeAction('signing up user1', Test, 'signUpUser', [1]);
        [this.user2name, this.user2email, this.user2ID] = await Test.takeAction('signing up user2', Test, 'signUpUser', [2]);

        await Test.takeActionWithCallback('user2 requests a friendship of user1', currentUser(), 'sendFriendRequest', [this.user1name]);

        Test.expect(GameFuseUser.CurrentUser.getOutgoingFriendRequests()[0].getOtherUser().getUsername(), this.user1name, 'user2 should have user1 in their outgoing friend requests');

        [this.user3name, this.user3email] = await Test.takeAction('signing up user3', Test, 'signUpUser', [3]);

        await Test.takeActionWithCallback('user3 requests a friendship of user1', currentUser(), 'sendFriendRequest', [this.user1ID]);

        await Test.takeActionWithCallback('sign in user1', GameFuse, 'signIn', [this.user1email, 'password']);

        let incomingFriendRequestUsernames = JSON.stringify(GameFuseUser.CurrentUser.getIncomingFriendRequests().map(friendRequest => friendRequest.getOtherUser().getUsername()).sort());
        let expectedUsernames = JSON.stringify([this.user2name, this.user3name].sort());

        Test.expect(incomingFriendRequestUsernames, expectedUsernames, "check that user3's incoming friend requests have both user1 and user2")
        Test.expect(currentUser().getOutgoingFriendRequests().length, 0, 'check that user3 has no outgoing friend requests.')

        let user2FriendRequest = GameFuseUser.CurrentUser.getIncomingFriendRequests().find(friendRequest => friendRequest.otherUser.getUsername() === this.user2name);
        await Test.takeActionWithCallback("accept user2's friend request", user2FriendRequest, 'acceptFriendRequest', []);

        let user3FriendRequest = GameFuseUser.CurrentUser.getIncomingFriendRequests().find(friendRequest => friendRequest.otherUser.getUsername() === this.user3name);

        await Test.takeActionWithCallback("reject user3's friend request", user3FriendRequest, 'declineFriendRequest', []);

        let friends = GameFuseUser.CurrentUser.getFriends();
        let incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests();
        let outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();

        Test.expect(friends.length, 1, 'User1 should have 1 friend');
        Test.expect(friends[0].getUsername(), this.user2name, 'User1 should have user2 in their friend list');
        Test.expect(incomingFriendRequests.length, 0, 'User1 should have 0 incoming friend requests');
        Test.expect(outgoingFriendRequests.length, 0, 'User1 should have 0 outgoing friend requests');

        await Test.takeActionWithCallback('sign in user3', GameFuse, 'signIn', [this.user3email, 'password']);

        friends = GameFuseUser.CurrentUser.getFriends();
        incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests();
        outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
        Test.expect(friends.length, 0, 'User3 should have 0 friends');
        Test.expect(incomingFriendRequests.length, 0, 'User3 should have 0 incoming friend requests');
        Test.expect(outgoingFriendRequests.length, 0, 'User3 should have 0 outgoing friend requests');

        await Test.takeActionWithCallback('user3 requests a friendship of user2', currentUser(), 'sendFriendRequest', [this.user2name]);

        console.log("check that user3's friend request is in their outgoing friend requests")
        outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
        let friendRequestToDelete = outgoingFriendRequests[0]
        Test.expect(outgoingFriendRequests.length, 1, 'user3 should now have 1 outgoing friend request');
        Test.expect(friendRequestToDelete.getOtherUser().getUsername(), this.user2name, 'The friend request to delete should be with user2')

        await Test.takeActionWithCallback('user3 deletes friend request with user2', friendRequestToDelete, 'deleteFriendRequest', []);

        outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
        Test.expect(outgoingFriendRequests.length, 0, "check that there are no longer any friend requests in user3's outgoing friend request list");

        await Test.takeActionWithCallback('Sign in user2', GameFuse, 'signIn', [this.user2email, 'password'])

        friends = GameFuseUser.CurrentUser.getFriends();
        incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests();
        outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
        Test.expect(friends.length, 1, 'User2 should have 1 friend');
        Test.expect(incomingFriendRequests.length, 0, 'user2 should have no incoming friend requests');
        Test.expect(outgoingFriendRequests.length, 0, 'user2 should have no outgoing friend requests');

        Test.expect(friends[0].getUsername(), this.user1name, 'user2 should have user1 in their friends list');

        await Test.takeActionWithCallback('user2 removes user1 as a friend', friends[0], 'unfriend', [])

        friends = GameFuseUser.CurrentUser.getFriends();
        Test.expect(friends.length, 0, 'User2 should have 0 friends');

        await Test.takeActionWithCallback('sign in user1', GameFuse, 'signIn', [this.user3email, 'password']);

        Test.expect(friends.length, 0, 'user1 should have 0 friends');

        console.log("SUCCESS!! WE MADE IT TO THE END OF OF THE FRIENDSHIP TEST SCRIPT WITH NO ERRORS.")
    }
}

const example = new GameFuseExampleFriendships(ENV.gameToken, ENV.gameId);

example.start()
