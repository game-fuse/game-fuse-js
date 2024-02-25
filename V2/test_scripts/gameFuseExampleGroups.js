const Test = GameFuseTestingUtilities;
const currentUser = () => GameFuseUser.CurrentUser;

class GameFuseExampleGroups {
    constructor(token, id) {
        this.gameToken = token;
        this.gameID = id;
    }

    start() {
        GameFuseTestingUtilities.startTest(this.testGroups.bind(this), this)
    }

    createUser() {
        return Test.takeAction('signing up user1', 'Test.signUpUser()');
    }

    async createGroup(options) {
        await Test.takeActionWithCallback('Creating a group', GameFuseGroup, 'create', options);
    }

    async testGroups() {
        console.log('WE ARE UP AND RUNNING BABY')
        // 1. Create a new group (pass in options, like name, invite only, auto-join vs acceptance, max group size, etc.??)

        this.user1 = await this.createUser();
        this.group1 = await this.createGroup({ name: 'My Cool Group', inviteOnly: true, autoJoin: false, maxGroupSize: undefined });


        let user1Groups = currentUser().getGroups();
        Test.expect(user1Groups.length, 1, 'There should be 1 group for user1');
        let firstGroup = user1Groups[0];
        Test.expect(firstGroup.getName(), 'My Cool Group', "The group should be called 'My Cool Group'");
        Test.expect(firstGroup.getMaxGroupSize(), undefined, 'There should be no max group size');
        Test.expect(firstGroup.getIsInviteOnly(), true, 'The group should not be invite only');
        Test.expect(firstGroup.canAutoJoin(), false, 'The group should be joinable without needing acceptance from the group leader');

        // TODO: decide whether it might be best to just set these options in a hash and pass it into an update function so that
        // game developers can have like a "settings" page and update all the attributes at once.

        // 2. Change group to invite only (retroactively, after creating)
        await Test.takeActionWithCallback('set group to invite only: false', firstGroup, 'setInviteOnly', false);
        firstGroup = currentUser().getGroups()[0];
        Test.expect(firstGroup.getIsInviteOnly(), false, 'The group should now be invite only');

        // 3. Change group to be auto-joinable
        await Test.takeActionWithCallback('set group to be auto joinable', firstGroup, 'setAutoJoinable', true);
        firstGroup = currentUser().getGroups()[0];
        Test.expect(firstGroup.getCanAutojoin(), true, 'The group should now not require acceptance before joining');

        // 4. Change max group size (retroactively)
        await Test.takeActionWithCallback('Set max group size', firstGroup, 'setMaxGroupSize', 4);
        firstGroup = currentUser().getGroups()[0];
        Test.expect(firstGroup.getMaxGroupSize(), 4, 'The group should now be set to a max group size of 4');

        // 5. Group leader invites someone, both by user object and by username
        this.user2 = await Test.takeAction('signing up user2', Test, 'signUpUser');
        this.user3 = await Test.takeAction('signing up user3', Test, 'signUpUser');
        this.user4 = await Test.takeAction('signing up user4', Test, 'signUpUser');
        this.user5 = await Test.takeAction('signing up user4', Test, 'signUpUser');
        await Test.takeActionWithCallback('sign back in as user1', GameFuse, 'signIn', this.user1.getTestEmail(), 'password');
        await Test.takeActionWithCallback('user1 invites user2 to their group by username', firstGroup, 'inviteUser', this.user2.getUsername());
        await Test.takeActionWithCallback('user1 invites user3 to their group by user object', firstGroup, 'inviteUser', this.user3);
        await Test.takeActionWithCallback('user1 invites user4 to their group', firstGroup, 'inviteUser', this.user4);

        let pendingInvitations = currentUser().getGroups()[0].getPendingInvitations();
        Test.expect(pendingInvitations[0].getUser().getUsername(), this.user4.getUsername()) // the first one should be the newest one
        Test.expect(pendingInvitations[1].getUser().getUsername(), this.user3.getUsername()) // the first one should be the newest one
        Test.expect(pendingInvitations[2].getUser().getUsername(), this.user2.getUsername()) // the last one should be the oldest one

        // 6. group leader can cancel an invite
        await Test.takeActionWithCallback('group leader cancels an invite they sent', pendingInvitations[0], 'cancel');
        Test.expect(currentUser().getGroups()[0].getPendingInvitations().length, 2, 'now there should only be 2 pending invitations');

        // 7. People can accept an invite
        await Test.takeActionWithCallback('sign in as user2', GameFuse, 'signIn', this.user2.getTestEmail(), 'password');
        let groupInvite = currentUser.getPendingGroupInvitations()[0];
        await Test.takeActionWithCallback('user2 accepts the invite', groupInvite, 'accept');
        Test.expect(currentUser().getPendingGroupInvitations().length, 0, 'there should no longer be any pending invites for user2');
        let myGroups = currentUser().getGroups();
        Test.expect(myGroups.length, 1, 'user2 should have 1 group');
        Test.expect(myGroups[0].getName(), 'My Cool Group', 'The group they belong to should have the right group name');

        // 8. people can decline an invite
        await Test.takeActionWithCallback('sign back in as user3', GameFuse, 'signIn', this.user3.getTestEmail(), 'password');
        groupInvite = currentUser.getPendingGroupInvitations()[0];
        await Test.takeActionWithCallback('user3 declines the invite', groupInvite, 'decline');
        Test.expect(currentUser().getPendingGroupInvitations().length, 0, 'there should no longer be any pending invites for user3');
        myGroups = currentUser().getGroups();
        Test.expect(myGroups.length, 0, 'user3 should have no groups');

        // 9. someone can join the group without waiting for acceptance if set to auto-join
        // TODO: is this realistic??
        await Test.takeActionWithCallback('user3 joins the group', firstGroup, 'join', currentUser());
        myGroups = currentUser().getGroups();
        Test.expect(myGroups[0].getName(), 'My Cool Group', 'User3 should now be in the cool group');

        // 10. you can leave the group.
        await Test.takeActionWithCallback('user3 leaves the group', firstGroup, 'leave', currentUser());
        myGroups = currentUser().getGroups();
        Test.expect(myGroups.length, 0, 'User3 should no longer have any groups');

        // 11. if group is invite only, they can't join the group automatically.
        await Test.takeActionWithCallback('sign in as user1', GameFuse, 'signIn', this.user1.getTestEmail(), 'password');
        await Test.takeActionWithCallback('set group to be invite only', firstGroup, 'setInviteOnly', true);
        Test.expect(firstGroup.getCanAutoJoin(), false, 'Setting to invite only should update the auto-joinable attribute to false');
        await Test.takeActionWithCallback('sign back in as user3', GameFuse, 'signIn', this.user3.getTestEmail(), 'password');
        await Test.takeActionWithCallback('Attempt to join an invite-only group', firstGroup, 'join', currentUser());
        Test.expect(currentUser().getGroups().length, 0, 'The action should not have been successful since you cannot directly join an invite-only group');

        // 11. Another someone can request to join a new group that is not invite only and also not auto-joinable
        await Test.takeActionWithCallback('sign in as user1', GameFuse, 'signIn', this.user1.getTestEmail(), 'password');
        await Test.takeActionWithCallback('set group to be not invite only', firstGroup, 'setInviteOnly', false);

        await Test.takeActionWithCallback('sign in as user3', GameFuse, 'signIn', this.user3.getTestEmail(), 'password');
        await Test.takeActionWithCallback('request an invite', firstGroup, 'requestToJoin', currentUser());
        await Test.takeActionWithCallback('sign in as user5', GameFuse, 'signIn', this.user5.getTestEmail(), 'password');
        await Test.takeActionWithCallback('request an invite', firstGroup, 'requestToJoin', currentUser());


        // 8. The group leader can accept their invite and now they are part of the group
        await Test.takeActionWithCallback('sign in as user1', GameFuse, 'signIn', this.user1.getTestEmail(), 'password');
        firstGroup = currentUser().getGroups()[0];
        let groupJoinRequests = firstGroup.getPendingJoinRequests();
        let user5JoinRequest =  groupJoinRequests[0]; // newest one first
        let user3JoinRequest = groupJoinRequests[1]; // oldest one last
        await Test.takeActionWithCallback('Accept user3 join request', user3JoinRequest, 'accept')
        await Test.takeActionWithCallback('Decline user5 join request', user5JoinRequest, 'decline')

        // 9. A group member can see a list of group users
        let groupMembers = firstGroup.getMembers();
        Test.expect(groupMembers.length, 3, 'there should be 3 members');
        let expectedGroupMembers = JSON.stringify([this.user1, this.user2, this.user3].map(user => user.getUsername()));
        let actualGroupMembers = JSON.stringify(groupMembers.map(member => member.getUsername()));
        Test.expect(actualGroupMembers, expectedGroupMembers, 'The users in the group should be user1, user2, and user3 (NOT user5)')


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
