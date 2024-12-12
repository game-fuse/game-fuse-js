const Test = GameFuseTestingUtilities;
const currentUser = () => GameFuseUser.CurrentUser;
// import GameFuseExampleGroups from "./gameFuseExampleGroups.js";

class GameFuseFullTestRun {

    constructor() {
        // nothing to see here...
    }

    async run() {
        // RUN ALL OF THE TESTS, ONE BY ONE.
        
        var testScripts = [new GameFuseExampleFriendships(), new GameFuseExampleGameRounds(), new GameFuseExampleGroups(), new GameFuseExampleMessages()]; // new GameFuseExampleGoogleOauth()

        document.body.innerHTML += "<h3>starting test runs!</h3>"

        for(let i = 0; i <= testScripts.length - 1; i++){
            let testScript = testScripts[i];
            
            await testScript.run()

            document.body.innerHTML += `<h3> Finished with ${testScript.constructor.name}. ${testScripts.length - i - 1} more to go. Next up: ${testScripts[i+1]?.constructor?.name || 'None! We are DONE!'} </h3>`;
        }
        
        document.body.innerHTML += "<h1>WE MADE IT TO THE END!</h1>"
    }
}

new GameFuseFullTestRun().run()
