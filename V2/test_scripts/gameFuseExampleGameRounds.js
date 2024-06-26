const Test = GameFuseTestingUtilities;
const currentUser = () => GameFuseUser.CurrentUser;

class GameFuseExampleGameRounds {
    constructor() {
        // nothing to see here...
    }

    async run() {
        Test.performTestLogic(this, async () => {
            // Sign up 3 users
            for (let userNumber = 1; userNumber <= 3; userNumber++) {
                this[`user${userNumber}`] = await Test.createUser(() => console.log(`signed up user${userNumber}`));
            }

            await Test.describe('Sign in, expect basic data arrays', async () => {
                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => console.log('signed in user1'));
                this.user1 = currentUser();
                Test.expect(this.user1.getGameRounds().length).toEqual(0, 'game rounds should be empty');
            })

            await Test.describe('Create game round, expect methods and attributes', async () => {
                let createOptions = {
                    multiplayer: false,
                    gameType: 'Capture The Flag',
                    gameUserID: currentUser().getID(),
                    metadata: { aliensKilled: 0 }
                };

                await Test.test('GameFuseGameRound.create(createOptions) FOR SINGLE-PLAYER', async () => {
                    await GameFuseGameRound.create(createOptions, () => console.log('created a game round for myself'));
                });

                let gameRounds = this.user1.getGameRounds();
                Test.expect(gameRounds.length).toEqual(1, 'Now I should have 1 game round');

                let gameRound = gameRounds[0];
                Test.expect(gameRound.getGameID()).toEqual(this.gameID, 'game round should pertain to the current game');
                Test.expect(gameRound.getMultiplayerGameRoundID()).toBeBlank('there should be no multiplayer ID');
                Test.expect(gameRound.getGameType()).toEqual('Capture The Flag', 'game type should be what we set it to (capture the flag)');
                Test.expect(gameRound.getStartTime()).toBePresent('Start time should be set');
                Test.expect(gameRound.getEndTime()).toBeBlank('End time should not yet be set');
                Test.expect(gameRound.getScore()).toBeBlank('Score should not yet be set');
                Test.expect(gameRound.getPlace()).toBeBlank('Place should not yet be set');
                Test.expect(gameRound.getMetadata()).toEqualObject({ aliensKilled: 0 }, 'Metadata should be set exactly to what we passed in');
                Test.expect(gameRound.isMultiplayer()).toEqual(false, 'This game round should be marked as NOT multiplayer');

                // attempt to add a player to this single-player round, expect it to raise an error with a specific message
                Test.expect(() => gameRound.addPlayer(this.user2, () => {})).toRaiseError('Cannot add another player to a single player round!', 'Should not allow adding another player to a single player round');
            });

            await Test.describe('Update game round, expect updated methods and attributes', async () => {
                let gameRound = this.user1.getGameRounds()[0];

                let endTime = new Date(gameRound.getStartTime().getTime() + 10.34 * 1000); // add 10.34 seconds to it, such that the final duration should be 10.34

                let updateOptions = {
                    score: 3.96,
                    endTime: endTime,
                    metadata: { aliensKilled: 10 }
                }

                await Test.test('gameRound.update(updateOptions)', async () => {
                    await gameRound.update(updateOptions, () => console.log('updated game round with end-of-round data'));
                });

                Test.expect(gameRound.getScore()).toEqual(3.96, 'the score should be what we set it to');
                Test.expect(gameRound.getEndTime()).toEqualObject(endTime, 'the end time should be what we set it to');
                Test.expect(gameRound.getMetadata()).toEqualObject({ aliensKilled: 10 }, 'the metadata should be what we set it to');

                Test.expect(gameRound.getDuration()).toEqual(10.34, 'The duration should be 10.34');
            });

            await Test.describe('Destroy game round, expect updated methods/attributes', async () => {
                let gameRound = this.user1.getGameRounds()[0];
                await Test.test('gameRound.destroy()', async () => {
                    await gameRound.destroy(() => console.log('Game round destroyed!'));
                });

                Test.expect(this.user1.getGameRounds().length).toEqual(0, 'there should no longer be any game rounds for this user');
            });


            await Test.describe('Create multiplayer game round, expect methods/attributes', async () => {
                let createOptions = {
                    multiplayer: true,
                    gameType: 'Pineapple Swimming',
                    gameUserID: currentUser().getID(),
                    metadata: { aliensKilled: 0 }
                };

                await Test.test('GameFuseGameRound.create(createOptions) FOR MULTIPLAYER', async () => {
                    await GameFuseGameRound.create(createOptions, () => console.log('created a multiplayer game!'));
                })

                let gameRounds = this.user1.getGameRounds();
                Test.expect(gameRounds.length).toEqual(1, 'there should be 1 game round (the multiplayer one we just created)');

                let multiplayerGameRound = gameRounds[0];

                Test.expect(multiplayerGameRound.isMultiplayer()).toEqual(true, 'this game round should indeed be marked as multiplayer');
                Test.expect(multiplayerGameRound.getNumberOfPlayers()).toEqual(1, 'there should be 1 player in the game round');

                let rankings = multiplayerGameRound.getRankings();
                Test.expect(rankings.length).toEqual(1, 'there should only be one player results in the rankings array');
                let myRanking = rankings[0];

                Test.expect(myRanking.score).toBeBlank('I should not have a score yet');
                Test.expect(myRanking.place).toBeBlank('I should not have a place yet');
                Test.expect(myRanking.startTime).toBePresent('I should have a start time');
                Test.expect(myRanking.user instanceof GameFuseUser).toEqual(true, 'a user object should be in the user attribute');
                Test.expect(myRanking.user).toEqual(currentUser(), 'The user should be the current user from the UserCache');
            });

            await Test.describe('Add players to the multi player game, expect appropriate multiplayer data structures', async () => {
                let multiplayerRound = this.user1.getGameRounds()[0];

                await Test.test('gameRound.addPlayer(userObj) FOR MULTIPLAYER ONLY', async () => {
                    await multiplayerRound.addPlayer(this.user2, { aliensKilled: 0 }, () => console.log('added player2'));
                    await multiplayerRound.addPlayer(this.user3, null, () => console.log('added player3'));
                });

                let rankings = multiplayerRound.getRankings();
                Test.expect(rankings.length).toEqual(3, 'there should be 3 players in the rankings array');

                Test.expect(rankings.every(ranking => ranking.user instanceof GameFuseUser)).toEqual(true, 'All of the ranking objects should have a GameFuseUser object');
            })

            await Test.describe('sign in as user2, fetch game rounds for user1, expect them to be populated', async () => {
                await GameFuse.signIn(this.user2.getTestEmail(), 'password', () => console.log('signed in as user2'));
                this.user1.gameRounds = []; // reset the array so that we can prove that the downloading works.

                await Test.test('user1.downloadFullData()', async () => {
                    await this.user1.downloadFullData(() => console.log('downloaded game rounds for user1'), []);
                });

                let user1GameRounds = this.user1.getGameRounds();
                Test.expect(user1GameRounds.length).toEqual(1, 'there should be 1 game round in there');

                let firstGameRound = user1GameRounds[0];
                Test.expect(firstGameRound.isMultiplayer()).toEqual(true, 'It should be a multiplayer round');
                Test.expect(firstGameRound.getRankings().length).toEqual(3, 'there should be 3 players in the multiplayer round');
                Test.expect(firstGameRound.getRankings().every(ranking => ranking.user instanceof GameFuseUser)).toEqual(true, 'All of the ranking objects should have a GameFuseUser object');
            });
        })
    }
}

new GameFuseExampleGameRounds().run();
