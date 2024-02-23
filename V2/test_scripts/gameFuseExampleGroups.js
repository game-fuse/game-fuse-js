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

    async testGroups() {
        console.log('WE ARE UP AND RUNNING BABY')
        // 1. Create a new group (pass in options, like max group size, invite only, auto-join vs acceptance, etc.??)

        // 2. Change group to invite only (retroactively, after creating)

        // 3. Change group to auto-join vs. by acceptance from group leader (retroactively)

        // 4. Change max group size (retroactively)

        // 5. Group leader invites someone

        // 6. That someone can accept the invite

        // 7. Another someone can request to join a new group

        // 8. The group leader can accept their invite and now they are part of the group

        // 9. A group member can see a list of group users (all data including game user attributes?? Or do we wait until they click on a specific user??)

        // 10. Group can have leaderboard entries.....??????

        // 11. Random user can get a list of existing groups that aren't private...

        // 12. getAttributes????

        // 13. getLeaderboardEntries...????????

        // 14. getFullData of a user.
    }
}

const example = new GameFuseExampleGroups(ENV.gameToken, ENV.gameId);

example.start()
