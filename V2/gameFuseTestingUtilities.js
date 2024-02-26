class GameFuseTestingUtilities {

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

    static expect(actual) {
        return {
            toEqual: (expected, optionalLog = '') => {
                if (actual === expected) {
                    console.log(`   - Test passed! ${optionalLog}`);
                } else {
                    throw(`   - TEST FAILED${optionalLog ? ` (${optionalLog}) ` : ''} : expected ${actual} to equal ${expected}`);
                }
            },
            notToEqual: (expected, optionalLog = '') => {
                if (actual !== expected) {
                    console.log(`   - Test passed! ${optionalLog}`);
                } else {
                    throw(`   - TEST FAILED${optionalLog ? ` (${optionalLog}) ` : ''} : expected ${actual} to equal ${expected}`);
                }
            }
        };
    }

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

    static describe(thingWeAreDescribing, callback) {
        return this.test(thingWeAreDescribing, callback)
    }

    static async test(whatWeAreTesting, callback) {
        console.log(whatWeAreTesting);

        // note: only need to return this promise below if we don't call this method async. Otherwise it implicitly returns a promise that gets resolved by the returned value of the method.
        // return new Promise((resolve, reject) => {
        //     callback(resolve, reject);
        //     before we passed in resolve/reject so that the callback could resolve the promise,
        //     since we are using async/await, the promise gets resolved implicitly by the return value so
        //     there's no need to manually resolve it.
        // });
        return callback()
    }

    static async signUpUser(){
        let random = Math.floor(Math.random() * 1000000000000);
        let username = `user${random}`;
        let email = `${username}@mundo.com`;

        await GameFuse.signUp(email, "password", "password", username, () => { })

        return new GameFuseUser(false, 0, undefined, undefined, username, 0, 0, GameFuseUser.CurrentUser.getID(), {}, [], [], undefined, true)
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
