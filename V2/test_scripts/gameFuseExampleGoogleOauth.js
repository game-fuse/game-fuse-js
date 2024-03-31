const Test = GameFuseTestingUtilities;
const currentUser = () => GameFuseUser.CurrentUser;

class GameFuseExampleGameRounds {
    constructor() {
        // nothing to see here...
    }

    async run() {
        
        // Test.performTestLogic(this, async () => {
        //     // Sign up 3 users
        //     for (let userNumber = 1; userNumber <= 3; userNumber++) {
        //         this[`user${userNumber}`] = await Test.createUser(() => console.log(`signed up user${userNumber}`));
        //     }
        //
        // });
    }
}

new GameFuseExampleGameRounds().run();
