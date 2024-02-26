const Test = GameFuseTestingUtilities;
const currentUser = () => GameFuseUser.CurrentUser;

class GameFuseExampleGroups {
    constructor(token, id) {
        this.gameToken = token;
        this.gameID = id;

        // TODO: consider declaring some empty variables up here (or just make them) to show what you're working with.
        //          This could even be the seed bank up here. Instead of creating the objects down there.
        //          Or maybe create some of them down there to show that behavior, but at least define the main ones up here
        //          so that it's clear what this class/script/flow of events works with.
    }

    start() {
        GameFuseTestingUtilities.startTest(this.testGroups.bind(this), this)
    }


    // TODO QUESTIONS:
    //    "group leader" should be referred to as "group admin"?

    async testGroups() {
        console.log('WE ARE UP AND RUNNING BABY')
        // 1. Create a new group (pass in options, like name, invite only, auto-join vs acceptance, max group size, etc.??)
        for (let i = 7; i >= 1; i--) {
            this[`user${i}`] = await Test.signUpUser(() => { console.log(`signed up user ${i}`)});
        }

        await Test.describe('CREATE GROUP', async() => {
            let options = { name: 'My Group 1', canAutoJoin: false, isInviteOnly: true, maxGroupSize: 20 }

            await Test.test('GameFuseGroup.create(options)', async () => {
                // TODO: do we need some way to keep this object up to date?
                this.group1 = await GameFuseGroup.create(options, () => console.log('group1 created'));
            })

            // get it through the current user to make sure the relations are working correctly
            let createdGroup = currentUser().getGroups()[0];
            Test.expect(createdGroup.getName()).toEqual('My Group 1');
            Test.expect(createdGroup.getCanAutoJoin()).toEqual(false);
            Test.expect(createdGroup.getIsInviteOnly()).toEqual(true);
            Test.expect(createdGroup.getMaxGroupSize()).toEqual(20);

            // TODO: is this the right way to access whether someone is the group leader??
            let meAsMember = createdGroup.getMembers()[0];
            Test.expect(meAsMember.getIsGroupLeader()).toEqual(0, 'I should be marked as the group leader');
        });

        await Test.describe('UPDATE GROUP', async() => {
            let options = { name: 'My Cool Group 1', canAutoJoin: true, isInviteOnly: false, maxGroupSize: 10 }
            let existingGroup = this.group1;

            await Test.test('group.update(options)', async () => {
                await existingGroup.update(options, () => console.log('group1 updated'));
            })

            // TODO: shouldn't have to re-get this object, should be referencing a memory object and thus updated here too, but check.
            // existingGroup = currentUser().getGroups()[0];
            Test.expect(existingGroup.getName()).toEqual('My Cool Group 1');
            Test.expect(existingGroup.getCanAutoJoin()).toEqual(true);
            Test.expect(existingGroup.getIsInviteOnly()).toEqual(false);
            Test.expect(existingGroup.getMaxGroupSize()).toEqual(10);
        });

        await Test.describe('REQUEST TO JOIN GROUP', async() => {
            let existingGroup = currentUser().getGroups()[0];
            await existingGroup.update( { canAutoJoin: false }, () => console.log('group1 set to not be auto-joinable, must request invite'));
            await GameFuse.signIn(this.user2.getTestEmail(), 'password', () => console.log('user2 signed in'));

            await Test.test('group.requestToJoin', async() => {
                await existingGroup.requestToJoin(() => console.log('user2 requested to join group1'));
            })

            let pendingGroupJoinRequests = currentUser().getPendingGroupJoinRequests();
            Test.expect(pendingGroupJoinRequests.length).toEqual(1, 'user2 should have 1 pending group join request');
            Test.expect(pendingGroupJoinRequests.getGroup().getName()).toEqual('My Cool Group 1');
        });

        await Test.describe('ACCEPT GROUP JOIN REQUEST', async() => {
            await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {})
            let pendingJoinRequests = currentUser().getGroups()[0].getPendingJoinRequests();
            Test.expect(pendingJoinRequests.length).toEqual(1, 'there should be 1 pending join request inside of group1 when the leader is signed in');

            await Test.test('groupJoinRequest.accept()', async() => {
                await pendingJoinRequests[0].accept(() => console.log('user1 group leader accepted user2 join request'));
            })

            let refreshedGroup = currentUser().getGroups()[0];
            Test.expect(refreshedGroup.getPendingJoinRequests().length).toEqual(0);
            let groupMembers = refreshedGroup.getMembers();
            Test.expect(groupMembers.length).toEqual(2);

            let actualMembers = JSON.stringify(groupMembers.map(member => member.getName()).sort());
            let expectedMembers = JSON.stringify([this.user1.getUsername(), this.user2.getUsername()]).sort();

            Test.expect(actualMembers).toEqual(expectedMembers);

            let user2AsMember = refreshedGroup.getMembers().find(member => member.getName() == this.user2.getName());
            Test.expect(user2AsMember.getIsGroupLeader()).toEqual(false, 'this newly accepted member should not be marked as the group leader')
        });

        await Test.describe('DECLINE GROUP JOIN REQUEST', async() => {
            await GameFuse.signIn(this.user3.getTestEmail(), 'password', () => {})
            await this.group1.requestToJoin(() => console.log('user3 requested to join group1'));
            await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {})
            let pendingJoinRequests = currentUser().getGroups()[0].getPendingJoinRequests();
            Test.expect(pendingJoinRequests.length).toEqual(1);

            await Test.test('groupJoinRequest.decline()', async() => {
                await pendingJoinRequests[0].decline(() => console.log('user1 group leader declined user3 join request'));
            })

            let refreshedGroup = currentUser().getGroups()[0];
            Test.expect(refreshedGroup.getPendingJoinRequests().length).toEqual(0);
            let groupMembers = refreshedGroup.getMembers();
            Test.expect(groupMembers.length).toEqual(2);
            Test.expect(JSON.stringify(groupMembers.map(member => member.getName()).sort())).toEqual(JSON.stringify([this.user1.getUsername(), this.user2.getUsername()].sort()), 'The same 2 group members should still be there, without user3')
        });


        await Test.describe('CANCEL GROUP JOIN REQUEST', async() => {
            await GameFuse.signIn(this.user4.getTestEmail(), 'password', () => {})
            await this.group1.requestToJoin(() => console.log('user4 requested to join group1'));
            // TODO: discuss if this is the right way to access this object? Or should it be through the group somehow...?
            let pendingJoinRequests = currentUser().getPendingGroupJoinRequests();

            await Test.test('groupJoinRequest.cancel()', async() => {
                await pendingJoinRequests[0].cancel(() => console.log('user4 cancelled their own join request'));
            });

            Test.expect(currentUser().getPendingGroupJoinRequests().length).toEqual(0, 'The pending group join request should be gone for user4');

            await GameFuse.signIn(this.user4.getTestEmail(), 'password', () => {});
            Test.expect(currentUser().getGroups()[0].getPendingJoinRequests().length).toEqual(0, 'The group leader should no longer see any join requests.');
        });

        await Test.describe('INVITE SOMEONE TO JOIN GROUP', async() => {
            await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {})

            await Test.test('group.invite(user5)', async() => {
                await this.group1.invite(this.user5, () => console.log('group 1 leader invites user5'))
            })

            let groupInvitations = currentUser().getGroups()[0].getPendingInvitations();
            Test.expect(groupInvitations.length).toEqual(1);

            await GameFuse.signIn(this.user5.getTestEmail(), 'password', () => console.log('user5 signed in'));
            let myPendingInvitations = currentUser().getPendingGroupInvitations();
            Test.expect(myPendingInvitations.length).toEqual(0, 'User5 should have 1 group invite waiting');
            Test.expect(groupInvitations[0].group.getName()).toEqual('My Cool Group 1', 'it should be for the correct group');
        });

        await Test.describe('ACCEPT GROUP INVITE', async() => {
            let pendingInvite = currentUser().getPendingGroupInvitations()[0];

            Test.test('groupInvite.accept()', async() => {
                await pendingInvite.accept(() => console.log('user5 accepts group1 invite'));
            })

            Test.expect(currentUser().getPendingGroupInvitations().length).toEqual(0, 'there should not be any group invitations to respond to');
            let myGroups = currentUser().getGroups();
            Test.expect(myGroups.length).toEqual(1, 'I should now have 1 group in my list');
            Test.expect(myGroups[0].getName()).toEqual('My Cool Group 1'); // TODO: we should be able to refer to this name globally

            let meAsMember = myGroups[0].getMembers().find(member => member.getUsername() === this.user5.getID());
            Test.expect(meAsMember.getIsGroupLeader()).toEqual(false, 'I should not be a group leader');
        });

        await Test.describe('DECLINE GROUP INVITE', async() => {
            await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => console.log('user1 signed in'));
            await this.group1.invite(this.user6, ()=> console.log('user6 gets invited') );
            await GameFuse.signIn(this.user6.getTestEmail(), 'password', () => {})
            let pendingInvitation = currentUser().getPendingGroupInvitations()[0]

            await Test.test('groupInvite.decline()', async() => {
                await pendingInvitation.decline(() => console.log('user6 declines the group invite'));
            })

            Test.expect(currentUser().getGroups().length).toEqual(1, () => console.log('user6 should have no groups'));
            await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => console.log('user1 signed in'));
            Test.expect(currentUser().getGroups()[0].getPendingInvitations().length).toEqual(0, 'there should be no pending invitations for the group');
        });

        await Test.describe('CANCEL GROUP INVITE', async() => {
            let group = currentUser().getGroups()[0];

            // user1 invites user7
            await group.invite(this.user7, () => console.log('user1 invited user7 to group1'));

            // group now has 1 pending invite
            Test.expect(group.getPendingGroupInvitations().length).toEqual(1, 'the group should now have 1 pending invitation');

            // user1 cancels the invite
            let groupInvite = group.getPendingGroupInvitations()[0];

            await Test.test('groupInvite.cancel()', async () => {
                await groupInvite.cancel(() => console.log('user1 cancels the group invite'));
            })

            // group no longer has any pending invites
            Test.expect(group.getPendingInvitations().length).toEqual(0, 'The group should no longer have any pending invitations')
        });

        await Test.describe('LEAVE GROUP', async() => {
            // expect/ensure that user2 is currently in the group
            let group = currentUser().getGroups()[0];
            Test.expect(group.getMembers().find(member => member.getUsername() === this.user2.getUsername()));

            // user2 signs in and leaves
            await GameFuse.signIn(this.user2.getTestEmail(), 'password', () => {});
            Test.expect(currentUser.getGroups()[0].getName).toEqual('My Cool Group 1', 'make sure they still are in the group.');
            await Test.test('group.leave()', async() => {
                await group.leave(() => console.log('user2 leaves the group'));
            })

            // user2 doesn't have that group in their groups anymore
            Test.expect(currentUser().getGroups().length).toEqual(0, 'user2 should not have anymore groups');

            // user1 signs in and doesn't see user2 in the members array
            await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {});
            group = currentUser().getGroups()[0]
            Test.expect(group.getMembers().find(member => member.getUsername() === this.user2.getUsername())).toEqual(undefined, 'User2 should no longer show up in the group members array');
        });

        await Test.describe('REMOVE SOMEONE FROM A GROUP', async() => {
            const findUser5 = (members) => members.find(member => member.getUsername() === this.user5.getUsername());

            // expect/ensure user5 is in the group
            Test.expect(findUser5(group.getMembers())).notToEqual(undefined, 'Check/ensure that user5 is currently in group1');

            await Test.test('group.removeMember(user2)', async() => {
                // user1 removes them
                await group.removeMember(this.user5, () => console.log('user1 group leader removes user2 from the group'));
            })

            // expect them to no longer be there as user1
            Test.expect(findUser5(group.getMembers())).toEqual(undefined, 'check/ensure that user2 has been successfully removed from the group');

            // sign in user5 and expect them to no longer be in that group.
            await GameFuse.signIn(this.user5.getTestEmail(), 'password', () => {});
            Test.expect(currentUser().getGroups().length).toEqual(0, 'User5 should no longer be in group 1');
        });

        // TODO: should we make sure that user2 can't re-join once removed...? are we creating too many edge cases for ourselves without having a real application?

        await Test.describe('JOIN A GROUP (auto-joinable group, no invite required)', async() => {
            // sign in user1
            await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {});
            // update the group to auto joinable
            let group = currentUser().getGroups[0];
            await group.update( { canAutoJoin: true }, () => console.log('update group 1 to be auto-joinable'));
            Test.expect(group.getCanAutoJoin()).toEqual(true)

            // sign in as user 4
            GameFuse.signIn(this.user4.getTestEmail(), 'password', () => {});

            // join
            await Test.test('group.join(userObj)', async() => {
                await group.join(this.user4, () => console.log('User4 just auto-joined'));
            })

            // expect it to be in their groups
            Test.expect(currentUser().getGroups()[0].getName()).toEqual('My Cool Group 1', 'User4 should now have this group in their data');
            // sign in user1
            GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {});
            // expect them to be in there as a non-group leader.
            let group4Member = currentUser().getGroups()[0].getMembers().find(member => member.getUsername() === this.user4.getUsername());
            Test.expect(group4Member).notToEqual(undefined, 'User4 should be a full-fledged group member');
            Test.expect(group4member.getIsGroupLeader()).toEqual(false, 'User4 should be a non-leader');
        })

        // TODO: IS THIS NECESSARY? will we already have the group data?
        //      ===> no, we shouldn't. Like for examplle if we have a list of available groups, we might need to call this one to see further groups.
        await Test.describe('SHOW GROUP', async() => {

        });

        // TODO: shouldn't this just be in a data dump of 'showGroup' where we download shell objects? Are we really ever going to want to download all of group member data specifically? I think we should only download 1 user's 'full data' at a time.
        await Test.describe('GET GROUP MEMBERS', async() => {

        });

        // TODO: move this into a test script for users, it doesn't quite belong here.
        await Test.describe('LIST AVAILABLE GROUPS (paginated)', async() => {
            // create 5 groups

            // sign in as a different user

            // hit the groups index endpoint

            // expect there to be 5 groups in some sort of data cache array

            // DON'T TEST PAGINATION HERE, I feel like that's a backend thing...? maybe it isn't though. maybe this is a good time to create mock objects for endpoints like this.
        });

        await Test.describe('DESTROY GROUP', async() => {

        });





        // this.group1 = await this.createGroup({ name: 'My Cool Group', inviteOnly: true, autoJoin: false, maxGroupSize: undefined });
        //
        // let user1Groups = currentUser().getGroups();
        // Test.expect(user1Groups.length).toEqual(1, 'There should be 1 group for user1');
        // let firstGroup = user1Groups[0];
        // Test.expect(firstGroup.getName()).toEqual('My Cool Group', "The group should be called 'My Cool Group'");
        // Test.expect(firstGroup.getMaxGroupSize()).toEqual(undefined, 'There should be no max group size');
        // Test.expect(firstGroup.getIsInviteOnly()).toEqual(true, 'The group should not be invite only');
        // Test.expect(firstGroup.canAutoJoin()).toEqual(false, 'The group should be joinable without needing acceptance from the group leader');
        //
        // // TODO: decide whether it might be best to just set these options in a hash and pass it into an update function so that
        // // game developers can have like a "settings" page and update all the attributes at once.
        //
        // // 2. Change group to invite only (retroactively, after creating)
        // await firstGroup.setInviteOnly(false, () => {console.log('set group to invite only: false')})
        // firstGroup = currentUser().getGroups()[0];
        // Test.expect(firstGroup.getIsInviteOnly()).toEqual(false, 'The group should now be invite only');
        //
        // // 3. Change group to be auto-joinable
        // await firstGroup.setAutoJoinable(true, () => { console.log('set group to be auto joinable') });
        // firstGroup = currentUser().getGroups()[0];
        // Test.expect(firstGroup.getCanAutojoin()).toEqual(true, 'The group should now not require acceptance before joining');
        //
        // // 4. Change max group size (retroactively)
        // await firstGroup.setMaxGroupSize(4, () => { console.log('Set max group size') });
        // firstGroup = currentUser().getGroups()[0];
        // Test.expect(firstGroup.getMaxGroupSize()).toEqual(4, 'The group should now be set to a max group size of 4');
        //
        // // 5. Group leader invites someone, both by user object and by username
        // await firstGroup.inviteUser(this.user2.getUsername(), () => console.log('user1 invites user2 to their group by username'));
        // await firstGroup.inviteUser(this.user3, () => console.log('user1 invites user3 to their group by user object'));
        // await firstGroup.inviteUser(this.user4, () => console.log('user1 invites user4 to their group'));
        //
        // let pendingInvitations = currentUser().getGroups()[0].getPendingInvitations();
        // Test.expect(pendingInvitations[0].getUser().getUsername(), this.user4.getUsername()) // the first one should be the newest one
        // Test.expect(pendingInvitations[1].getUser().getUsername(), this.user3.getUsername()) // the first one should be the newest one
        // Test.expect(pendingInvitations[2].getUser().getUsername(), this.user2.getUsername()) // the last one should be the oldest one
        //
        // // 6. group leader can cancel an invite
        // await pendingInvitations[0].cancel(() => console.log('group leader cancels an invite they sent'));
        // Test.expect(currentUser().getGroups()[0].getPendingInvitations().length).toEqual(2, 'now there should only be 2 pending invitations');
        //
        // // 7. People can accept an invite
        // await GameFuse.signIn(this.user2.getTestEmail(), 'password', () => console.log('signed in user2'));
        // let groupInvite = currentUser.getPendingGroupInvitations()[0];
        // await groupInvite.accept(() => console.log('user2 accepts the invite'));
        // Test.expect(currentUser().getPendingGroupInvitations().length).toEqual(0, 'there should no longer be any pending invites for user2');
        // let myGroups = currentUser().getGroups();
        // Test.expect(myGroups.length).toEqual(1, 'user2 should have 1 group');
        // Test.expect(myGroups[0].getName()).toEqual('My Cool Group', 'The group they belong to should have the right group name');
        //
        // // 8. people can decline an invite
        // await GameFuse.signIn(this.user3.getTestEmail(), 'password', () => console.log('sign back in as user3'));
        // groupInvite = currentUser.getPendingGroupInvitations()[0];
        // await groupInvite.decline(() => console.log('user3 declines the invite'));
        // Test.expect(currentUser().getPendingGroupInvitations().length).toEqual(0, 'there should no longer be any pending invites for user3');
        // myGroups = currentUser().getGroups();
        // Test.expect(myGroups.length).toEqual(0, 'user3 should have no groups');
        //
        // // 9. someone can join the group without waiting for acceptance if set to auto-join
        // // TODO: is this realistic??
        // await firstGroup.join(() => console.log('user3 joins the group'));
        // myGroups = currentUser().getGroups();
        // Test.expect(myGroups[0].getName()).toEqual('My Cool Group', 'User3 should now be in the cool group');
        //
        // // 10. you can leave the group.
        // await firstGroup.leave(() => console.log('user3 leaves the group'));
        // myGroups = currentUser().getGroups();
        // Test.expect(myGroups.length).toEqual(0, 'User3 should no longer have any groups');
        //
        // // 11. if group is invite only, they can't join the group automatically.
        // await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => console.log('user1 signed in'));
        // await firstGroup.setInviteOnly(true, () => console.log('set group to be invite only'));
        // Test.expect(firstGroup.getCanAutoJoin()).toEqual(false, 'Setting to invite only should update the auto-joinable attribute to false');
        // await GameFuse.signIn(this.user3.getTestEmail(), 'password', () => console.log('sign back in as user3'));
        // await firstGroup.join(() => console.log('Attempt to join an invite-only group'));
        // Test.expect(currentUser().getGroups().length, 0).toEqual('The action should not have been successful since you cannot directly join an invite-only group');
        //
        // // 11. Another someone can request to join a new group that is not invite only and also not auto-joinable
        // await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => console.log('user1 signed in'));
        // await firstGroup.setInviteOnly(false, () => console.log('set group to be not invite only'));
        //
        // await GameFuse.signIn(this.user3.getTestEmail(), 'password', () => console.log('user3 signed in'));
        // await firstGroup.requestToJoin(() => console.log('user3 requests to join a group'))
        // await GameFuse.signIn(this.user5.getTestEmail(), 'password', () => console.log('user5 signed in'));
        // await firstGroup.requestToJoin(() => console.log('user5 requests to join a group'));
        //
        //
        // // 8. The group leader can accept their invite and now they are part of the group
        // await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => console.log('user1 signed in'));
        // firstGroup = currentUser().getGroups()[0];
        // let groupJoinRequests = firstGroup.getPendingJoinRequests();
        // let user5JoinRequest =  groupJoinRequests[0]; // newest one first
        // let user3JoinRequest = groupJoinRequests[1]; // oldest one last
        // await user3JoinRequest.accept(() => console.log('Accept user3 join request'));
        // await user5JoinRequest.decline(() => console.log('Decline user5 join request'));
        //
        // // 9. A group member can see a list of group users
        // let groupMembers = firstGroup.getMembers();
        // Test.expect(groupMembers.length).toEqual(3, 'there should be 3 members');
        // let expectedGroupMembers = JSON.stringify([this.user1, this.user2, this.user3].map(user => user.getUsername()));
        // let actualGroupMembers = JSON.stringify(groupMembers.map(member => member.getUsername()));
        // Test.expect(actualGroupMembers).toEqual(expectedGroupMembers, 'The users in the group should be user1, user2, and user3 (NOT user5)')

        // 10. Group can have leaderboard entries.....??????

        // 11. Random user can get a list of existing groups that aren't private...

        // 12. getAttributes????

        // 13. getLeaderboardEntries...????????

        // 14. getFullData of a user.

        // 15. Check that if you try to add someone to a group above the max size, that it does not let you.

        // 16. doesn't let you invite someone if you aren't the group leader???????
    }
}

const example = new GameFuseExampleGroups(ENV.gameToken, ENV.gameId);

example.start()
