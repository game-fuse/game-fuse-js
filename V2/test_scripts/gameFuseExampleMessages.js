const Test = GameFuseTestingUtilities;
const currentUser = () => GameFuseUser.CurrentUser;

class GameFuseExampleMessages {

    constructor() {
    }

    async run() {

        Test.performTestLogic(this, async () => {
            // sign up 3 users
            for (let userNumber = 1; userNumber <= 3; userNumber++) {
                this[`user${userNumber}`] = await Test.createUser(() => console.log(`created user ${userNumber}`));
            }

            await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => console.log('signed in user1'));

            await Test.test('User1 sends a message to user2 (thereby creating a new chat)', async () => {
                // Send a message to user2, using the user object method; check that the chat data is there.
                await this.user2.sendMessage('Hello, my name is Michael.', () => {
                    console.log('Sent a message to user2 (userObj.sendMessage)')
                });

                let chats = currentUser().getDirectChats();

                Test.expect(chats.length).toEqual(1, 'There should be 1 chat');

                let messages = chats[0].getMessages();

                Test.expect(messages.length).toEqual(1, 'There should be 1 message in that chat');
                Test.expect(messages[0].getText()).toEqual('Hello, my name is Michael.', 'The message text in that chat should be the same as what we set it to above in Chat.sendMessage');
            })

            await Test.test('User1 sends another message to user2 (replying to the existing chat)', async () => {
                // Send another message to the chat, check that the data is there
                let chat = currentUser().getDirectChats()[0];

                await chat.sendMessage('I am replying :)', () => {
                    console.log('chat.sendMessage(message)')
                });

                let chats = currentUser().getDirectChats();

                Test.expect(chats.length).toEqual(1, 'User1 Should still have 1 chat');
                chat = chats[0];

                let messages = chat.getMessages();

                Test.expect(messages.length).toEqual(2, 'Now there should be 2 messages in the chat');
                Test.expect(messages[0].getText()).toEqual('I am replying :)', 'The message text of the first message should be the text of the most recent message we sent');
                Test.expect(messages.every(msg => msg.getIsFromMe() === true)).toEqual(true, 'Both messages should show up as from me');
            })

            await Test.test('Expect the chat data for user2 to be accurate', async () => {//async (resolve, reject) => {
                await GameFuse.signIn(this.user2.getTestEmail(), 'password', () => {
                });
                let messages = currentUser().getDirectChats()[0].getMessages();

                Test.expect(messages.every(msg => msg.getIsFromMe() === false)).toEqual(true, 'Neither message should show up as from me');

                let otherUserMessage = messages[0];

                Test.expect(otherUserMessage.getUser() instanceof GameFuseUser).toEqual(true, 'the other user should be inside the message');
                Test.expect(otherUserMessage.getUser().getUsername()).toEqual(this.user1.getUsername(), "the other user's username should be user1's username");
            })

            await Test.describe('start a chat in an actual group', async () => {
                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => console.log('signed in user1'));

                let options = {name: 'My Group 1', canAutoJoin: true, isInviteOnly: false, maxGroupSize: 20}
                await GameFuseGroup.create(options, () => console.log('group created'));

                let createdGroup = currentUser().getGroups()[0];

                await GameFuse.signIn(this.user2.getTestEmail(), 'password', () => console.log('signed in user2'));
                await createdGroup.join(() => console.log('user2 joined the group'));

                await createdGroup.sendMessage('some message', () => console.log('user2 sends a message to the group'));
                const expectations = () => {
                    let groupChats = currentUser().getGroupChats();

                    Test.expect(groupChats.length).toEqual(1, 'there should be one group chat associated with this user');

                    let firstChatMessages = groupChats[0].getMessages();

                    Test.expect(firstChatMessages.length).toEqual(1, 'the group chat should have 1 message');
                    Test.expect(firstChatMessages[0].getText()).toEqual('some message', 'the message text should be what we set it to');
                }

                expectations();

                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => console.log('signed in user1 again'));

                expectations();
            });

            await Test.test('User1 starts a group chat with user2 and user3', async () => {
                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {
                });
                await GameFuseChat.sendMessage([this.user3.getUsername(), this.user2.getUsername()], 'Hello, my friends :)', () => {
                    console.log('create group chat with user3 and user2, using usernames')
                });

                let chats = currentUser().getDirectChats();
                Test.expect(chats.length).toEqual(2, 'there should now be 2 chats for user 1');

                let groupChat = chats[0]; // the most recent chat should now be the first one.
                let groupMessages = groupChat.getMessages();
                Test.expect(groupMessages.length).toEqual(1, 'the group chat should have 1 message');

                let participants = groupChat.getParticipants();
                Test.expect(participants.length).toEqual(3, 'the group chat should have 3 participants');

                let actualChatUsernames = participants.map(part => part.getUsername()).sort()
                let expectedChatUsernames = [this.user1.getUsername(), this.user2.getUsername(), this.user3.getUsername()].sort()
                Test.expect(actualChatUsernames).toEqualObject(expectedChatUsernames, 'the participants should have user1, 2, and 3 usernames inside of GameFuseUser objects');
            })

            await Test.test('User3 sends 30 messages to the group chat', async () => {
                let groupChat = currentUser().getDirectChats()[0];
                for (let i = 0; i < 30; i++) {
                    await groupChat.sendMessage(`This is message number ${i + 1}`, () => {
                    });
                }

                Test.expect(groupChat.getMessages().length).toEqual(31, 'the group chat should now have 31 messages (because it was being added to after each message)');
            })

            await Test.test('Expect pagination to work correctly when User3 signs in', async () => {
                await GameFuse.signIn(this.user3.getTestEmail(), 'password', () => {
                });
                let groupChat = currentUser().getDirectChats()[0];
                Test.expect(groupChat.getMessages().length).toEqual(25, 'The group chat should only have 25 messages in it (due to the pagination feature)')
            })

            await Test.test('Get the 2nd page of messages from the API', async () => {
                let groupChat = currentUser().getDirectChats()[0];
                await groupChat.getOlderMessages(2, () => {
                    console.log('got the 2nd page of messages')
                });
                Test.expect(groupChat.getMessages().length).toEqual(31, 'The group chat should now have all 31 messages in it');
            })

            await Test.describe('Get 2nd page of older chats', async () => {

                await Test.test('25 different users create chats with user1 (to test pagination)', async () => {
                    for (let userNumber = 4; userNumber <= 28; userNumber++) {
                        this[`user${userNumber}`] = await Test.createUser(() => console.log(`signed up user ${userNumber}`));
                        await GameFuse.signIn(this[`user${userNumber}`].getTestEmail(), 'password', () => console.log(`signed in user ${userNumber}`));
                        // test with both user object and username. If odd, pass username, if even, pass user object

                        let objToPass = userNumber % 2 === 0 ? this.user1 : this.user1.getUsername();
                        await GameFuseChat.sendMessage(objToPass, `message ${userNumber} in loop`, () => {
                            console.log(`created chat+message ${userNumber}`)
                        });
                    }
                })

                await GameFuse.signIn(this.user1.getTestEmail(), 'password', () => {
                });
                Test.expect(currentUser().getDirectChats().length).toEqual(25, 'expect 25 of the chats to be in the array, but not all 27 of them due to pagination.');

                await GameFuseChat.getOlderChats(2, () => {
                    console.log('got the 2nd page of chats')
                });

                Test.expect(currentUser().getDirectChats().length).toEqual(27, 'There should now be all 27 chats in the array after getting the rest of the chats from the API');
            })
        });
    }
}

new GameFuseExampleMessages().run();
