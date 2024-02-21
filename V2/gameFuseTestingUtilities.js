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

        return [username, email, GameFuseUser.CurrentUser.getID()]
    }

    static expect(thing1, thing2, thingWeAreChecking) {
        if(thing1 !== thing2){
            throw(`The following expectation failed: ${thingWeAreChecking}`);
        } else {
            console.log(`Success: ${thingWeAreChecking}`)
        }
    }

    // Use this for a normal action that doesn't need a callback
    static takeAction(action, obj, method, ...args){
        console.log(action)
        return obj[method](...args)
    }

    // Use this for an action that requires a callback inside of it
    static async takeActionWithCallback(action, obj, method, ...args){
        return await new Promise((resolve, reject) => {
            args.push((message, _hasError) => { resolve(message) })
            this.takeAction(action, obj, method, ...args)
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
