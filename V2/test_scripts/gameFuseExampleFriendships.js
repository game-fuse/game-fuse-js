class GameFuseExampleFriendships {
    constructor() {
        // nothing to see here...
    }

    async run() {
        await Test.performTestLogic(this, async () => {

            // Sign up 5 users
            for (let userNumber = 1; userNumber <= 5; userNumber++) {
                this[`user${userNumber}`] = await Test.createUser(this.gameID, () => console.log(`signed up user ${userNumber}`));
            }
            await Test.describe('SENDING FRIEND REQUESTS', async () => {
                await Test.test('2: USER 2 FRIEND REQUESTS USER 1 (USERNAME METHOD)', async () => {
                    await GameFuse.signIn(this.user2.getTestEmail(), 'password', () => {
                        console.log('SIGNED IN USER 2')
                    })
                    await GameFuseFriendRequest.send(this.user1.getUsername(), () => console.log('USER2 FRIEND REQUESTS USER 1'));

                    let friendName = currentUser().getOutgoingFriendRequests()[0].getOtherUser().getUsername()
                    Test.expect(friendName).toEqual(this.user1.getUsername(), 'user2 should have user1 in their outgoing friend requests');
                });

                await Test.test('3: USER3 FRIEND REQUESTS USER 1 (USER OBJECT METHOD)', async () => {
                    await GameFuse.signIn(this.user3.getTestEmail(), 'password', () => {
                        console.log('SIGNED IN USER 3')
                    })
                    await this.user1.sendFriendRequest(() => {
                        console.log('user3 sent friend request to user 1')
                    })
                });

                await Test.test('4: USER1 SHOULD HAVE APPROPRIATE DATA IN THEIR STATE', async () => {
                    await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {
                        console.log('User1 signed in')
                    })
                    let incomingFriendRequestUsernames = GameFuseUser.CurrentUser.getIncomingFriendRequests().map(friendRequest => friendRequest.getOtherUser().getUsername()).sort();
                    let expectedUsernames = [this.user2.getUsername(), this.user3.getUsername()].sort();
                    Test.expect(incomingFriendRequestUsernames).toEqualObject(expectedUsernames, "user1's incoming friend requests should have both user1 and user2");
                    Test.expect(currentUser().getOutgoingFriendRequests().length).toEqual(0, 'check that user1 has no outgoing friend requests.');
                });
            })

            await Test.describe('ACCEPTING AND DECLINING FRIEND REQUESTS', async () => {
                await Test.test('5: USER1 ACCEPTS AND REJECTS FRIEND REQUESTS', async () => {
                    let incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests();
                    let user3FriendRequest = incomingFriendRequests[0] // user3 should be the newest one.
                    let user2FriendRequest = incomingFriendRequests[1]; // user2 should be the oldest one.
                    Test.expect(user3FriendRequest.getOtherUser().getID()).toEqual(this.user3.getID(), 'the first friend request should be the newest one (user3)')
                    Test.expect(user2FriendRequest.getOtherUser().getID()).toEqual(this.user2.getID(), 'the last friend request should be the oldest one (user2)')

                    await user2FriendRequest.accept(() => {
                        console.log('user2 friend request accepted')
                    });
                    await user3FriendRequest.decline(() => {
                        console.log('user3 friend request declined')
                    });

                    let friends = GameFuseUser.CurrentUser.getFriends();
                    incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests();
                    let outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();

                    Test.expect(friends.length).toEqual(1, 'User1 should have 1 friend');
                    Test.expect(friends[0].getUsername()).toEqual(this.user2.getUsername(), 'User1 should have user2 in their friend list');
                    Test.expect(incomingFriendRequests.length).toEqual(0, 'User1 should have 0 incoming friend requests');
                    Test.expect(outgoingFriendRequests.length).toEqual(0, 'User1 should have 0 outgoing friend requests');
                });

                await Test.test('6: USER3 SHOULD HAVE APPROPRIATE STATE DATA', async () => {
                    // 7. Sign in as user3 and expect appropriate data
                    await GameFuse.signIn(this.user3.getTestEmail(), 'password', () => {
                        console.log('user3 signed in')
                    });
                    let friends = GameFuseUser.CurrentUser.getFriends();
                    let incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests();
                    let outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
                    Test.expect(friends.length).toEqual(0, 'User3 should have 0 friends');
                    Test.expect(incomingFriendRequests.length).toEqual(0, 'User3 should have 0 incoming friend requests');
                    Test.expect(outgoingFriendRequests.length).toEqual(0, 'User3 should have 0 outgoing friend requests');
                });
            })

            await Test.describe('CANCELLING A FRIEND REQUEST', async () => {
                await GameFuseFriendRequest.send(this.user2.getUsername(), () => {
                    console.log('user3 requested friendship of user2')
                });

                let outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
                let friendRequestToCancel = outgoingFriendRequests[0]
                Test.expect(outgoingFriendRequests.length).toEqual(1, 'user3 should now have 1 outgoing friend request');
                Test.expect(friendRequestToCancel.getOtherUser().getUsername()).toEqual(this.user2.getUsername(), 'The friend request to cancel should be with user2');

                await friendRequestToCancel.cancel(() => {
                    console.log('user3 cancels friend request with user2')
                });

                outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
                Test.expect(outgoingFriendRequests.length).toEqual(0, "check that there are no longer any friend requests in user3's outgoing friend request list");
            });

            await Test.describe('UNFRIENDING SOMEONE', async () => {

                await GameFuse.signIn(this.user2.getTestEmail(), 'password', () => {
                    console.log('user2 signed in')
                })

                let friends = GameFuseUser.CurrentUser.getFriends();
                let incomingFriendRequests = GameFuseUser.CurrentUser.getIncomingFriendRequests();
                let outgoingFriendRequests = GameFuseUser.CurrentUser.getOutgoingFriendRequests();
                Test.expect(friends.length).toEqual(1, 'User2 should have 1 friend');
                Test.expect(incomingFriendRequests.length).toEqual(0, 'user2 should have no incoming friend requests');
                Test.expect(outgoingFriendRequests.length).toEqual(0, 'user2 should have no outgoing friend requests');
                Test.expect(friends[0].getUsername()).toEqual(this.user1.getUsername(), 'user2 should have user1 in their friends list');

                await friends[0].unfriend(() => {
                    console.log('user2 removes user1 from friends list')
                })

                friends = GameFuseUser.CurrentUser.getFriends();
                Test.expect(friends.length).toEqual(0, 'User2 should have 0 friends');

                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => console.log('Signed in user1'));
                friends = GameFuseUser.CurrentUser.getFriends();
                Test.expect(friends.length).toEqual(0, 'user1 should have 0 friends');
            })
        })
    }
}
