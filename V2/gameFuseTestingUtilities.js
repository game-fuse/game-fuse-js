class GameFuseTestingUtilities {

    // static sleep(delay) {
    //     return new Promise((resolve) => setTimeout(resolve, delay) )
    // }

    static async performTestLogic(testClassInstance, testLogic) {
        try {
            // await this.setupTestGame(testClassInstance, () => console.log('created game and set values'))
            await testLogic();
        } catch (error) {
            console.log(error);
        } finally {
            this.cleanUpTest(testClassInstance, () => console.log('HALLELUJAH! we have made it to the end of the test.'))
        }
    }

    static async startTest(testMethod, testClassInstance){
        await Test.setupTestGame(testClassInstance, () => console.log('created game and set values'))

        if (testClassInstance.gameToken && testClassInstance.gameID) {
            console.log("GameFuse start");

            GameFuse.setVerboseLogging(false);
            GameFuse.setUpGame(testClassInstance.gameID, testClassInstance.gameToken, testMethod, true);
        } else {
            console.log(
                "Add ID and Token",
                "Please add your token and ID, if you do not have one, you can create a free account from gamefuse.co",
                "OK"
            );
            throw new Error("Token and ID Invalid");
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

    static async createUser(callback = undefined) {
        try {
            let random = Math.floor(Math.random() * 1000000000000);
            let username = `user${random}`;
            let email = `${username}@mundo.com`;

            let data = {
                email: email,
                username: username
            }

            GameFuse.Log('Setting up game');

            const url = `${GameFuse.getBaseURL()}/test_suite/create_user`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'service-key': ENV.serviceToken
                },
                body: JSON.stringify(data)
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response)
            if (responseOk) {
                callback();
                return GameFuseJsonHelper.convertJsonToUser(response.data, true);;
            } else {
                throw('something went wrong while creating this user!')
            }
        } catch (error) {
            console.log(error)
        }
    }

    static async setupTestGame(testClassInstance, callback) {
        try {
            GameFuse.Log('Setting up game');

            const url = `${GameFuse.getBaseURL()}/test_suite/create_game`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'service-key': ENV.serviceToken
                }
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response)
            if (responseOk) {
                GameFuse.Log("GameFuseUser create game success");
                testClassInstance.gameID = response.data.id;
                testClassInstance.gameToken = response.data.token;
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? 'Game setup successfully' : response.data,
                callback,
                responseOk
            )
        } catch (error) {
            console.log(error)
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    static async cleanUpTest(testClassInstance, callback) {
        try {
            GameFuse.Log('Setting up game');

            const url = `${GameFuse.getBaseURL()}/test_suite/clean_up_test`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'service-key': ENV.serviceToken
                }
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response)
            if (responseOk) {
                GameFuse.Log("Cleaned up test data");
                testClassInstance.gameID = null;
                testClassInstance.gameToken = null;
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? 'Cleaned up test data' : response.data,
                callback,
                responseOk
            )
        } catch (error) {
            console.log(error)
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }
}
