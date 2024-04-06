const Test = GameFuseTestingUtilities;
const currentUser = () => GameFuseUser.CurrentUser;

class GameFuseExampleGroups {
    constructor() {
        // nothing to see here...
    }

    async run() {
        Test.performTestLogic(this, async () => {
            console.log('WE ARE UP AND RUNNING BABY')

            for (let userNumber = 6; userNumber >= 1; userNumber--) {
                this[`user${userNumber}`] = await Test.createUser(this.gameID, () => {
                    console.log(`signed up user ${userNumber}`)
                });
            }
            
            await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => console.log('user1 signed in'));
            
            await Test.describe('CREATE GROUP', async () => {
                let options = {name: 'My Group 1', canAutoJoin: false, isInviteOnly: true, maxGroupSize: 20}
                
                await Test.test('GameFuseGroup.create(options)', async () => {
                    await GameFuseGroup.create(options, () => console.log('group1 created'));
                })

                // get it through the current user to make sure the relations are working correctly
                let createdGroup = currentUser().getGroups()[0];

                Test.expect(createdGroup.getName()).toEqual('My Group 1');
                Test.expect(createdGroup.getCanAutoJoin()).toEqual(false, 'auto join should be false');
                Test.expect(createdGroup.getIsInviteOnly()).toEqual(true, 'invite only should be true');
                Test.expect(createdGroup.getMaxGroupSize()).toEqual(20, 'max group size should be 20');
                Test.expect(createdGroup.getMemberCount()).toEqual(1, 'member count should be 1');

                let meAsMember = createdGroup.getMembers()[0];
                Test.expect(meAsMember.getID()).toEqual(this.user1.getID(), 'I should be a member of the group');

                let meAsAdmin = createdGroup.getAdmins()[0];
                Test.expect(meAsAdmin.getID()).toEqual(this.user1.getID(), 'I should be an admin of the group');
            });

            await Test.describe('UPDATE GROUP', async () => {
                let existingGroup = currentUser().getGroups()[0];

                let options = {name: 'My Cool Group 1', canAutoJoin: true, isInviteOnly: false, maxGroupSize: 10}
                
                await Test.test('group.update(options)', async () => {
                    await existingGroup.update(options, () => console.log('group1 updated'));
                })

                Test.expect(existingGroup.getName()).toEqual('My Cool Group 1', 'the new name should be my cool group 1');
                Test.expect(existingGroup.getCanAutoJoin()).toEqual(true, 'auto join should now be true');
                Test.expect(existingGroup.getIsInviteOnly()).toEqual(false, 'invite only should now be false');
                Test.expect(existingGroup.getMaxGroupSize()).toEqual(10, 'max group size should now be 10');
                Test.expect(existingGroup.getMembers().length).toEqual(1, 'there should still be data in the members array (should not have been wiped out)');
                Test.expect(existingGroup.getAdmins().length).toEqual(1, 'there should still be data in the admins array (should not have been wiped out)');
            });

            await Test.describe('REQUEST TO JOIN GROUP', async () => {
                let existingGroup = currentUser().getGroups()[0];
                await existingGroup.update({canAutoJoin: false}, () => console.log('group1 set to not be auto-joinable, must request invite'));
                await GameFuse.signIn(this.user2.getTestEmail(), 'password', () => console.log('user2 signed in'));

                await Test.test('group.requestToJoin', async () => {
                    await existingGroup.requestToJoin(() => console.log('user2 requested to join group1'));
                })

                let groupJoinRequests = currentUser().getGroupJoinRequests();
                Test.expect(groupJoinRequests.length).toEqual(1, 'user2 should have 1 pending group join request');
                Test.expect(groupJoinRequests[0].getGroup().getName()).toEqual('My Cool Group 1');
            });

            await Test.describe('ACCEPT GROUP JOIN REQUEST', async () => {
                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {
                })
                // we have to first download the full data, as the group admin, to get the join request / invite info.
                let group = currentUser().getGroups()[0];
                await group.downloadFullData(() => console.log('downloaded full data for the group'));

                let joinRequests = group.getJoinRequests();
                Test.expect(joinRequests.length).toEqual(1, 'there should be 1 pending join request inside of group1 when the admin is signed in');

                await Test.test('groupJoinRequest.accept()', async () => {
                    await joinRequests[0].accept(() => console.log('user1 group admin accepted user2 join request'));
                })

                Test.expect(group.getJoinRequests().length).toEqual(0, 'the group should not have any join requests in it');

                let groupMembers = group.getMembers();
                Test.expect(groupMembers.length).toEqual(2, 'there should be 2 members');
                Test.expect(group.getMemberCount()).toEqual(2, 'member count should be 2');

                let actualMembers = groupMembers.map(member => member.getID()).sort();
                let expectedMembers = [this.user1.getID(), this.user2.getID()].sort();

                Test.expect(actualMembers).toEqualObject(expectedMembers, 'the members in the group should be users 1 and 2');

                const findUser2 = (users) => users.find(user => user.getID() === this.user2.getID());

                let user2AsMember = findUser2(group.getMembers());
                Test.expect(user2AsMember).notToEqual(undefined, 'user2 should now be a member');

                let user2AsAdmin = findUser2(group.getAdmins());
                Test.expect(user2AsAdmin).toEqual(undefined, 'user2 should not be an admin');
            });

            await Test.describe('DECLINE GROUP JOIN REQUEST', async () => {
                let group = currentUser().getGroups()[0];

                await GameFuse.signIn(this.user3.getTestEmail(), 'password', () => {
                })

                await group.requestToJoin(() => console.log('user3 requested to join group1'));
                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {
                })
                await group.downloadFullData(() => console.log('downloaded full data for the group'));

                let joinRequests = group.getJoinRequests();

                Test.expect(joinRequests.length).toEqual(1, 'there should now be 1 join request in the group');

                await Test.test('groupJoinRequest.decline()', async () => {
                    await joinRequests[0].decline(() => console.log('user1 group admin declined user3 join request'));
                })

                Test.expect(group.getJoinRequests().length).toEqual(0, 'there should be no join requests in the group');
                let groupMembers = group.getMembers();
                Test.expect(groupMembers.length).toEqual(2, 'there should be 2 members in the group');
                Test.expect(group.getMemberCount()).toEqual(2, 'the memberCount should be 2');
                Test.expect(groupMembers.map(member => member.getID()).sort()).toEqualObject([this.user1.getID(), this.user2.getID()].sort(), 'The same 2 group members should still be there, without user3')
            });

            await Test.describe('CANCEL GROUP JOIN REQUEST', async () => {
                let group = currentUser().getGroups()[0];
                await GameFuse.signIn(this.user4.getTestEmail(), 'password', () => {
                })
                await group.requestToJoin(() => console.log('user4 requested to join group1'));

                let joinRequests = currentUser().getGroupJoinRequests();

                await Test.test('groupJoinRequest.cancel()', async () => {
                    await joinRequests[0].cancel(() => console.log('user4 cancelled their own join request'));
                });

                Test.expect(currentUser().getGroupJoinRequests().length).toEqual(0, 'The pending group join request should be gone for user4');
                Test.expect(currentUser().getGroups().length).toEqual(0, 'User4 should not be part of any groups')

                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {
                })

                await group.downloadFullData(() => console.log('downloaded full data for group1'));
                Test.expect(group.getJoinRequests().length).toEqual(0, 'The group admin should no longer see any join requests in group 1.');
            });

            await Test.describe('INVITE SOMEONE TO JOIN GROUP', async () => {
                let group = currentUser().getGroups()[0];
                await Test.test('group.invite(user5)', async () => {
                    await group.invite(this.user5, () => console.log('group 1 admin invites user5 by user object'))
                    await group.invite(this.user6.getUsername(), () => console.log('group 1 admin invites user6 by username'))
                });

                let groupInvites = currentUser().getGroups()[0].getInvites();
                Test.expect(groupInvites.length).toEqual(2, 'there should be 2 invites');

                // test for users 5 and 6
                for (let userNumber of [5, 6]) {
                    await GameFuse.signIn(this[`user${userNumber}`].getTestEmail(), 'password', () => console.log(`user${userNumber} signed in`));
                    let myPendingInvites = currentUser().getGroupInvites();

                    Test.expect(myPendingInvites.length).toEqual(1, `User${userNumber} should have 1 group invite waiting`);
                    Test.expect(groupInvites[0].group.getName()).toEqual('My Cool Group 1', 'it should be for the correct group');
                }
            });

            await Test.describe('CANCEL GROUP INVITE', async () => {
                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {
                });

                let group = currentUser().getGroups()[0];
                await group.downloadFullData(() => console.log('downloaded full data for group 1'));

                let invites = group.getInvites()
                Test.expect(invites.length).toEqual(2, 'the group should have 2 pending invites');
                let user6Invite = group.getInvites().find(invite => invite.getUser().getID() === this.user6.getID());

                await Test.test('groupInvite.cancel()', async () => {
                    await user6Invite.cancel(() => console.log('user1 cancels the group invite to user 6'));
                })

                Test.expect(group.getInvites().length).toEqual(1, 'The group should now only have 1 pending invite (the one for user 5)')
            });

            await Test.describe('ACCEPT GROUP INVITE', async () => {
                await GameFuse.signIn(this.user5.getTestEmail(), 'password', () => {
                });

                let pendingInvite = currentUser().getGroupInvites()[0];

                await Test.test('groupInvite.accept()', async () => {
                    await pendingInvite.accept(() => console.log('user5 accepts group1 invite'));
                })

                Test.expect(currentUser().getGroupInvites().length).toEqual(0, 'there should not be any group invites to respond to');
                let myGroups = currentUser().getGroups();
                Test.expect(myGroups.length).toEqual(1, 'I should now have 1 group in my list');
                Test.expect(myGroups[0].getName()).toEqual('My Cool Group 1');

                const findUser5 = (users) => users.find(user => user.getID() === this.user5.getID());
                let user5AsMember = findUser5(myGroups[0].getMembers());
                Test.expect(user5AsMember).notToEqual(undefined, 'user5 should now be a group member');

                let user5AsAdmin = findUser5(myGroups[0].getAdmins());
                Test.expect(user5AsAdmin).toEqual(undefined, 'User5 should not be a group admin');
            });

            await Test.describe('DECLINE GROUP INVITE', async () => {
                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => console.log('user1 signed in'));
                let group = currentUser().getGroups()[0];
                await group.invite(this.user6, () => console.log('user6 gets invited'));
                await GameFuse.signIn(this.user6.getTestEmail(), 'password', () => {
                })
                let pendingInvite = currentUser().getGroupInvites()[0]

                await Test.test('groupInvite.decline()', async () => {
                    await pendingInvite.decline(() => console.log('user6 declines the group invite'));
                })

                Test.expect(currentUser().getGroups().length).toEqual(0, 'user6 should have no groups');
                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => console.log('user1 signed in'));
                Test.expect(currentUser().getGroups()[0].getInvites().length).toEqual(0, 'there should be no pending invites for the group');
            });

            await Test.describe('LEAVE GROUP', async () => {
                // expect/ensure that user2 is currently in the group
                let group = currentUser().getGroups()[0];
                await group.downloadFullData(() => console.log('downloaded full data for group'));
                const findUser2 = (users) => users.find(user => user.getID() === this.user2.getID());

                Test.expect(findUser2(group.getMembers())).notToEqual(undefined, 'User 2 should be a member of the group')

                // user2 signs in and leaves
                await GameFuse.signIn(this.user2.getTestEmail(), 'password', () => {
                });
                Test.expect(currentUser().getGroups()[0].getName()).toEqual('My Cool Group 1', 'make sure they still are in the group.');
                await Test.test('group.leave()', async () => {
                    await group.leave(() => console.log('user2 leaves the group'));
                })

                // user2 doesn't have that group in their groups anymore
                Test.expect(currentUser().getGroups().length).toEqual(0, 'user2 should not have anymore groups');

                // user1 signs in and doesn't see user2 in the members array
                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {
                });
                group = currentUser().getGroups()[0]
                await group.downloadFullData(() => console.log('downloaded full data for group'));
                Test.expect(findUser2(group.getMembers())).toEqual(undefined, 'User2 should no longer show up in the group members array');
            });

            await Test.describe('JOIN A GROUP (auto-joinable group, no invite required)', async () => {
                // update the group to auto joinable
                let group = currentUser().getGroups()[0];

                await group.update({canAutoJoin: true}, () => console.log('update group 1 to be auto-joinable'));
                Test.expect(group.getCanAutoJoin()).toEqual(true, 'the group should now be auto-joinable')

                await GameFuse.signIn(this.user4.getTestEmail(), 'password', () => {
                });

                await Test.test('group.join()', async () => {
                    await group.join(() => console.log('User4 just auto-joined'));
                });

                // expect it to be in their groups
                Test.expect(currentUser().getGroups()[0].getName()).toEqual('My Cool Group 1', 'User4 should now have this group in their data');

                // sign in user1, expect them to be in there as a non-group leader.
                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {
                });

                const findUser4 = (users) => users.find(user => user.getID() === this.user4.getID());

                let group4Member = findUser4(group.getMembers());
                Test.expect(group4Member).notToEqual(undefined, 'User4 should be a full-fledged group member');

                let group4Admin = findUser4(group.getAdmins());
                Test.expect(group4Admin).toEqual(undefined, 'User4 should not be an admin');
            });

            await Test.describe('MAKING A MEMBER AN ADMIN', async () => {
                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {
                });
                let group = currentUser().getGroups()[0]

                await Test.test('group.makeMemberAdmin(user)', async () => {
                    await group.makeMemberAdmin(this.user4);
                });

                Test.expect(group.getAdmins().map(user => user.getID()).includes(this.user4.getID())).toEqual(true, 'User4 should now be an admin');
            });

            await Test.describe('REMOVE SOMEONE FROM A GROUP', async () => {
                const findUser5 = (members) => members.find(member => member.getID() === this.user5.getID());
                let group = currentUser().getGroups()[0];
                await group.downloadFullData(() => console.log('downloaded full data for group1'));
                // expect/ensure user5 is in the group
                Test.expect(findUser5(group.getMembers())).notToEqual(undefined, 'Check/ensure that user5 is currently in group1');

                await Test.test('group.removeMember(user5)', async () => {
                    // user1 removes them
                    await group.removeMember(this.user5, () => console.log('user1 group admin removes user5 from the group'));
                })

                // expect them to no longer be there as user1
                Test.expect(findUser5(group.getMembers())).toEqual(undefined, 'check/ensure that user2 has been successfully removed from the group');

                // sign in user5 and expect them to no longer be in that group.
                await GameFuse.signIn(this.user5.getTestEmail(), 'password', () => {
                });
                Test.expect(currentUser().getGroups().length).toEqual(0, 'User5 should no longer be in group 1');
            });

            await Test.describe('ATTEMPTING TO JOIN A GROUP AFTER BEING REMOVED (SHOULD NOT LET YOU JOIN)', async () => {
                await GameFuse.signIn(this.user5.getTestEmail(), 'password', () => {
                });
                await GameFuseGroup.downloadAvailableGroups(() => console.log('downloaded available groups'));
                let group = currentUser().getDownloadedAvailableGroups()[0];

                await Test.test('group.join()', async () => {
                    await group.join(() => console.log('user5 attempts to re-join group1 after being removed'));
                });

                Test.expect(currentUser().getGroups().length).toEqual(0, 'User5 should not be in any groups (i.e. the action should have been unsuccessful)');
                let user5AsMember = group.getMembers().find(member => member.getID() === this.user5.getID())
                Test.expect(user5AsMember).toEqual(undefined, 'group1 should not contain user5 in its members array');
            });

            await Test.describe('LIST AVAILABLE GROUPS', async () => {
                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {
                })

                // create 5 groups
                for (let num = 2; num <= 6; num++) {
                    let options = {name: `My Group ${num}`, canAutoJoin: false, isInviteOnly: true, maxGroupSize: 5 * num}
                    await GameFuseGroup.create(options, () => console.log(`group ${num} created`))
                }

                await GameFuse.signIn(this.user6.getTestEmail(), 'password', () => {
                });

                await Test.test('GameFuseGroup.downloadAvailableGroups()', async () => {
                    await GameFuseGroup.downloadAvailableGroups(() => console.log('got available groups from the API'));
                })

                let downloadedAvailableGroups = GameFuseUser.CurrentUser.getDownloadedAvailableGroups();

                Test.expect(downloadedAvailableGroups.length).toEqual(6, 'All 6 groups should be in the array');

                let oneSuchGroup = downloadedAvailableGroups.find(group => group.getName() === 'My Group 3');

                Test.expect(oneSuchGroup.getMembers().length).toEqual(0, 'The downloaded data should not include any user info, yet');
            });

            await Test.describe('SHOW GROUP', async () => {
                let downloadedAvailableGroups = GameFuseUser.CurrentUser.getDownloadedAvailableGroups();
                let someGroup3 = downloadedAvailableGroups.find(group => group.getName() === 'My Group 3');
                await Test.test('group.downloadFullData()', async () => {
                    await someGroup3.downloadFullData(() => console.log('got full data for this group 3'));
                })
                Test.expect(someGroup3.getMembers().length).toEqual(1, 'Now, after downloading the data, there should be 1 group member in there');
            });

            await Test.describe('DESTROY GROUP', async () => {
                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {});
                let group = currentUser().getGroups()[0];
                let groupID = group.getID();

                await Test.test('group.destroy()', async () => {
                    await group.destroy(() => console.log('group 1 destroyed'));
                });

                let group1InState = currentUser().getGroups().find(group => group.getID() === groupID)

                Test.expect(group1InState).toEqual(undefined, 'This group should no longer exist in my group info since we just destroyed it.')
            });
        });

        // TODO: move this into a test script for users, it doesn't quite belong here.
        // TEST USER DOWNLOAD FULL DATA
    }
}

new GameFuseExampleGroups().run();
