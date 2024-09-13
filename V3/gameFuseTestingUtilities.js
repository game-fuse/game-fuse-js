class GameFuseTestingUtilities {

    // static sleep(delay) {
    //     return new Promise((resolve) => setTimeout(resolve, delay) )
    // }

    static async performTestLogic(testClassInstance, testLogic) {
        let success = null; // used in the `finally` block.

        try {
            await this.setupTest(testClassInstance);
            await testLogic();
            success = true;
        } catch (error) {
            console.log(error);
            success = false;
        } finally {
            await this.cleanUpTest(testClassInstance, () => console.log('Cleaned up test data'))

            if(success){
                // Hallelujah!
                let className = testClassInstance.constructor.name;
                if(className.startsWith('GameFuseExample')){
                    className = className.substring('GameFuseExample'.length);
                }
                console.log(`Hallelujah! SUCCESS! WE MADE IT TO THE END OF OF THE ${className.toUpperCase()} TEST SCRIPT WITH NO ERRORS.`);
            }
        }
    }

    static async setupTest(testClassInstance){
        await Test.setupTestGame(testClassInstance, () => console.log('created game and set values'))

        if (testClassInstance.gameToken && testClassInstance.gameID) {
            console.log("GameFuse start");

            GameFuse.setVerboseLogging(false);
            await GameFuse.setUpGame(testClassInstance.gameID, testClassInstance.gameToken, () => console.log('finished setting up game'));

            console.log('ready to rip!')
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
        const handleResult = (condition, expectedStatement, optionalLog = '') => {
            if(condition) {
                console.log(`   - Test passed! ${optionalLog}`);
            } else {
                // throw(`   - TEST FAILED${optionalLog ? ` (${optionalLog})` : ''} : expected ${actual} to ${expectedStatement}`);
                alert(`   - TEST FAILED${optionalLog && ` (${optionalLog})`}: expected ${actual} to ${expectedStatement}`);
                throw(`   - TEST FAILED${optionalLog && ` (${optionalLog})`}: expected ${actual} to ${expectedStatement}`);
            }
        };

        return {
            toEqual: (expected, optionalLog = '') => {
                handleResult(actual === expected, `equal ${expected}`, optionalLog);
            },
            notToEqual: (expected, optionalLog = '') => {
                handleResult(actual !== expected, `not equal ${expected}`, optionalLog);
            },
            toEqualObject: (expected, optionalLog = '') => {
                let stringifiedActual = JSON.stringify(actual);
                let stringifiedExpected = JSON.stringify(expected);

                handleResult(stringifiedActual === stringifiedExpected, `equal ${stringifiedExpected}`, optionalLog);
            },
            toBePresent: (optionalLog = '') => {
                handleResult(actual != null, 'be present', optionalLog);
            },
            toBeBlank: (optionalLog = '') => {
                handleResult(actual == null, 'be blank (null or undefined)', optionalLog);
            },
            toRaiseError: async (expectedMessage, optionalLog = '') => {
                try {
                    // in this case, 'actual' is a function that needs to be resolved by executing it.
                    await actual()

                    throw('No error occurred!!!!') // if we make it here, then no error occurred, which is the opposite of what we expect.
                } catch (e) {
                    Test.expect(e).toEqual(expectedMessage, optionalLog)
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

    static async createUser(gameID, callback = undefined) {
        try {
            let random = Math.floor(Math.random() * 1000000000000);
            let username = `user${random}`;
            let email = `${username}@mundo.com`;

            let data = {
                email: email,
                username: username
            }

            GameFuse.Log('Setting up game');

            const url = `${GameFuse.getBaseURL()}/test_suite/create_user?game_id=${gameID}`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'service-key-token': ENV.serviceKeyToken,
                    'service-key-name': ENV.serviceKeyName
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
                    'service-key-token': ENV.serviceKeyToken,
                    'service-key-name': ENV.serviceKeyName
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

            const url = `${GameFuse.getBaseURL()}/test_suite/clean_up_test?game_id=${testClassInstance.gameID}`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'service-key-token': ENV.serviceKeyToken,
                    'service-key-name': ENV.serviceKeyName
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
