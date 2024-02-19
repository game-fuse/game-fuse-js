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

        [this.user2name, this.user2email, this.user2ID] = await Test.takeAction('signing up user2', Test, 'signUpUser', [2]);
        [this.user1name, this.user1email, this.user1ID] = await Test.takeAction('signing up user1', Test, 'signUpUser', [1]);

        console.log('we are signed in as user 1');

        Test.expect(currentUser().getChats().length, 0, 'expect to have no chats');

        // sendMessage...?
        await Test.takeActionWithCallback('Creating a chat with user2, passing username', currentUser(), 'createChat', [this.user2name, 'Hello, my name is Michael.']);
        // ======> that should add to the chats array

        let chats = currentUser().getChats();
        Test.expect(chats.length, 1, 'There should be 1 chat');
        let messages = chats[0].getMessages();
        Test.expect(messages.length, 1, 'There should be 1 message in that chat');
        Test.expect(messages[0].getText(), 'Hello, my name is Michael.', 'The message text in that chat should be the same as what we set it to above in createChat');

        let chat = chats[0];
        await Test.takeActionWithCallback('send another message (reply to the chat)', chat, 'reply', ['I am replying :)']);
        // ======> that should add to end of the messages array

        chats = currentUser().getChats();
        Test.expect(chats.length, 1, 'Should still have 1 chat');
        chat = chats[0];
        messages = chat.getMessages();
        Test.expect(messages.length, 2, 'Now there should be 2 messages in the chat');
        Test.expect(messages[1].getText(), 'I am replying :)', 'The message text of the last message should be the text of the most recent message we sent');

        Test.expect(messages.every(msg => msg.getIsFromMe() === true), true, 'Both messages should show up as from Me');

        await Test.takeActionWithCallback('sign in as user2', GameFuse, 'signIn', [this.user2email, 'password']);

        messages = currentUser().getChats()[0].getMessages();

        Test.expect(messages.every(msg => msg.getIsFromMe() === false),true, 'Neither message should show up as from me');

        let otherUserMessage = messages[0];

        Test.expect(otherUserMessage.getUser() instanceof GameFuseUser, true, 'the other user should be inside the message');
        Test.expect(otherUserMessage.getUser().getUsername(), this.user1name, "the other user's username should be user1's username");

        [this.user3name, this.user3email, this.user3ID] = await Test.takeAction('signing up a 3rd user', Test, 'signUpUser', [3]);
        await Test.takeActionWithCallback('sign back in as user1', GameFuse, 'signIn', [this.user1email, 'password']);

        await Test.takeActionWithCallback('create group chat with user3 and user2, using userIDs', currentUser(), 'createChat', [[this.user3ID, this.user2ID], 'Hello, my friends :)']);

        chats = currentUser().getChats();
        Test.expect(chats.length, 2, 'there should now be 2 chats for user 1');
        let groupChat = chats[1];
        let groupMessages = groupChat.getMessages();
        Test.expect(groupMessages.length, 1, 'the group chat should have 1 message');
        let participants = groupChat.getParticipants();
        Test.expect(participants.length, 3, 'the group chat should have 3 participants');
        Test.expect(JSON.stringify(participants.map(part => part.getUsername()).sort()), JSON.stringify([this.user1name, this.user2name, this.user3name].sort()), 'the participants should have user1, 2, and 3 usernames inside of GameFuseUser objects');

        // create 30 messages with user3
        // expect the CurrentUser.messages array to have 31 messages (because it was being added to after each message)
        // call resetCurrentUser()
        // sign in again as user2....???
        // expect to only have 25 messages in that chat with user3
        // call chat.getPage(2)
        // expect all 31 messages to be in the array now

        // create a new chat with user3 again (or rather, try to)
        // expect that your chat still has only 2 chats (i.e. that it didn't create a new one), and/or expect some appropriate informational text?!?!

        // somehow create 25 other chats
        // expect them all to be in the chats array
        // refresh the user's data
        // expect there to now only be 25 chats
        // call user.getChats(2)
        // expect there to now be all in the chats array

        console.log("SUCCESS!! WE MADE IT TO THE END OF OF THE FRIENDSHIP TEST SCRIPT WITH NO ERRORS.")
    }
}

const example = new GameFuseExampleMessages(ENV.gameToken, ENV.gameId);

example.start()