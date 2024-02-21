const Test = GameFuseTestingUtilities;
const currentUser = () => GameFuseUser.CurrentUser;

class GameFuseExampleMessages {

    constructor(token, id) {
        this.gameToken = token;
        this.gameID = id;
    }

    start() {
        GameFuseTestingUtilities.startTest(this.testMessaging.bind(this), this)
    }

    async testMessaging(message, hasError) {

        // 1. sign up user1 and user2
        [this.user2name, this.user2email, this.user2ID] = await Test.takeAction('signing up user2', Test, 'signUpUser', 2);
        [this.user1name, this.user1email, this.user1ID] = await Test.takeAction('signing up user1', Test, 'signUpUser', 1);
        Test.expect(currentUser().getChats().length, 0, 'expect to have no chats');

        // 2. send a message to user2, using the user object method, check that the chat data is there.
        let user2Object = new GameFuseUser(false, 0, undefined, undefined, this.user2name, 0, 0, this.user2ID, {}, [], [], undefined, true)
        await Test.takeActionWithCallback('Creating a chat with user2, passing username', user2Object, 'sendMessage', 'Hello, my name is Michael.');
        let chats = currentUser().getChats();
        Test.expect(chats.length, 1, 'There should be 1 chat');
        let messages = chats[0].getMessages();
        Test.expect(messages.length, 1, 'There should be 1 message in that chat');
        Test.expect(messages[0].getText(), 'Hello, my name is Michael.', 'The message text in that chat should be the same as what we set it to above in Chat.sendMessage');

        // 3. Send another message to the chat, check that the data is there
        let chat = chats[0];
        await Test.takeActionWithCallback('send another message (reply to the chat)', chat, 'sendMessage', 'I am replying :)');
        chats = currentUser().getChats();
        Test.expect(chats.length, 1, 'Should still have 1 chat');
        chat = chats[0];
        messages = chat.getMessages();
        Test.expect(messages.length, 2, 'Now there should be 2 messages in the chat');
        Test.expect(messages[0].getText(), 'I am replying :)', 'The message text of the first message should be the text of the most recent message we sent');
        Test.expect(messages.every(msg => msg.getIsFromMe() === true), true, 'Both messages should show up as from Me');

        // 4. sign in as user2, expect chat data to be accurate
        await Test.takeActionWithCallback('sign in as user2', GameFuse, 'signIn', this.user2email, 'password');
        messages = currentUser().getChats()[0].getMessages();
        Test.expect(messages.every(msg => msg.getIsFromMe() === false),true, 'Neither message should show up as from me');
        let otherUserMessage = messages[0];
        Test.expect(otherUserMessage.getUser() instanceof GameFuseUser, true, 'the other user should be inside the message');
        Test.expect(otherUserMessage.getUser().getUsername(), this.user1name, "the other user's username should be user1's username");

        // 5. sign up user3
        [this.user3name, this.user3email, this.user3ID] = await Test.takeAction('signing up a 3rd user', Test, 'signUpUser', 3);

        // 6. Create a group chat with user3 and user2 as user1
        await Test.takeActionWithCallback('sign back in as user1', GameFuse, 'signIn', this.user1email, 'password');
        await Test.takeActionWithCallback('create group chat with user3 and user2, using userIDs', GameFuseChat, 'sendMessage', [this.user3name, this.user2name], 'Hello, my friends :)');
        chats = currentUser().getChats();
        Test.expect(chats.length, 2, 'there should now be 2 chats for user 1');
        let groupChat = chats[0]; // the most recent chat should now be the first one.
        let groupMessages = groupChat.getMessages();
        Test.expect(groupMessages.length, 1, 'the group chat should have 1 message');
        let participants = groupChat.getParticipants();
        Test.expect(participants.length, 3, 'the group chat should have 3 participants');
        Test.expect(JSON.stringify(participants.map(part => part.getUsername()).sort()), JSON.stringify([this.user1name, this.user2name, this.user3name].sort()), 'the participants should have user1, 2, and 3 usernames inside of GameFuseUser objects');

        // 7. create 30 messages with user3
        console.log('About to send 30 messages to the group chat (spamming much??)')
        for(let i = 0; i < 30; i++) {
            await Test.takeActionWithCallback(`message ${i+1}`, groupChat, 'sendMessage', `This is message number ${i+1}`);
        }

        Test.expect(currentUser().getChats()[0].getMessages().length, 31, 'the group chat should now have 31 messages (because it was being added to after each message)');

        // 8. sign in as user3, expect there to be less messages to check that pagination is working correctly.
        await Test.takeActionWithCallback('sign in as user3', GameFuse, 'signIn', this.user3email, 'password');
        groupChat = currentUser().getChats()[0];
        Test.expect(groupChat.getMessages().length, 25, 'The group chat should only have 25 messages in it (due to the pagination feature)')

        // 9. Get the 2nd page of chats, expect them to be there
        await Test.takeActionWithCallback('Fetching the 2nd page of chats', groupChat, 'getOlderMessages', 2);
        Test.expect(groupChat.getMessages().length, 31, 'The group chat should now have all 31 messages in it');

        // 10. create 25 other chats, all with user1, coming from 25 different users.
        for(let i = 0; i < 25; i++) {
            await Test.takeAction('', Test, 'signUpUser', i);
            await Test.takeActionWithCallback('', GameFuseChat, 'sendMessage', this.user1name, `message ${i} in loop`);
        }

        // 11. sign in with user1, expect 25 of the chats to be in the array, but not all 27 of them due to pagination.
        await Test.takeActionWithCallback('sign in as user1', GameFuse, 'signIn', this.user1email, 'password');
        Test.expect(currentUser().getChats().length, 25, 'There should only be 25 chats in the chats array');

        // 12. Get the 2nd page of chats and expect them all to be there.
        await Test.takeActionWithCallback('get the 2nd page of chats', currentUser(), 'getOlderChats', 2);
        Test.expect(currentUser().getChats().length, 27, 'There should now be all 28 chats in the array after getting the rest of the chats from the API');

        console.log("SUCCESS!! WE MADE IT TO THE END OF OF THE FRIENDSHIP TEST SCRIPT WITH NO ERRORS.")
    }
}

const example = new GameFuseExampleMessages(ENV.gameToken, ENV.gameId);

example.start()
