class GameFuseTestingUtilities {
    static async signUpUser(){
        let random = Math.floor(Math.random() * 1000000000000);
        let username = `user${random}`;
        let email = `${username}@mundo.com`;

        await new Promise((resolve, reject) => {
            GameFuse.signUp(email, "password", "password", username, (message, hasError) => {
                resolve(message)
            });
        });

        return new GameFuseUser(false, 0, undefined, undefined, username, 0, 0, GameFuseUser.CurrentUser.getID(), {}, [], [], undefined, true)
    }

    static sleep(delay) {
        return new Promise((resolve) => setTimeout(resolve, delay) )
    }

    static myNormalMethod() {
        console.log(1)
        return this.someAsyncMethod();
    }

    static async someAsyncMethod(){
        for(let i = 0; i < 200; i++){
            console.log(i);
        }
    }

    // describe(description, callback) {
    //     console.log(`\n${description}:`);
    //     callback();
    // }
    //
    // async context(description, callback) {
    //     console.log(`   - ${description}:`);
    //     callback();
    // }
    //
    // // Define an `it` function that takes a description and a callback
    // it(description, callback) {
    //     console.log(`     - ${description}`);
    //     callback();
    // }

    static expect(actual) {
        return {
            toEqual: (expected, optionalLog = '') => {
                if (actual === expected) {
                    console.log(`   - Test passed! ${optionalLog}`);
                } else {
                    throw(`   - TEST FAILED${optionalLog ? ` (${optionalLog}) ` : ''} : expected ${actual} to equal ${expected}`);
                }
            }
        };
    }

    static describe(thingWeAreDescribing, callback) {
        return this.test(thingWeAreDescribing, callback)
    }

    static async test(whatWeAreTesting, callback) {
        console.log(whatWeAreTesting);
        return new Promise((resolve, reject) => {
            callback(resolve, reject);
        });
    }

    static startTest(testMethod, testClassInstance){
        if (testClassInstance.gameToken === "" || testClassInstance.gameID === "") {
            console.log(
                "Add ID and Token",
                "Please add your token and ID, if you do not have one, you can create a free account from gamefuse.co",
                "OK"
            );
            throw new Error("Token and ID Invalid");
        } else {
            console.log("GameFuse start");

            GameFuse.setVerboseLogging(false);
            GameFuse.setUpGame(testClassInstance.gameID, testClassInstance.gameToken, testMethod, true);
        }
    }
}
