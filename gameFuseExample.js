class GameFuseExample {
   

    constructor(token, id) {
       this.gameToken = token;
       this.gameID = id;
       this.userEmail = "tom@mundo.com";
       this.username = "tommundo";
    }

    start() {
        const random = Math.floor(Math.random() * 10000).toString();
        this.userEmail = `tom${random}@mundo.com`;
        this.username = `tommundo${random}`;
        let self = this
        if (this.gameToken === "" || this.gameID === "") {
            console.log(
                "Add ID and Token",
                "Please add your token and ID, if you do not have one, you can create a free account from gamefuse.co",
                "OK"
            );
            throw new Error("Token and ID Invalid");
        } else {
            console.log("GameFuse start");
            GameFuse.setVerboseLogging(true);
            GameFuse.setUpGame(this.gameID, this.gameToken, function(message,hasError){self.applicationSetUp(message,hasError)}, true);
        }
    }

    applicationSetUp(message, hasError) {
        let self = this

        if (hasError) {
            console.log("error setting application");
            console.log(message);
        } else {
            console.log(`<color=yellow>GAME CONNECTED!! ${GameFuse.getGameId()}</color>`);
            console.log("Store Items:");
            for (const storeItem of GameFuse.getStoreItems()) {
                console.log(`      ${storeItem.getName()}: ${storeItem.getCost()}`);
            }
            console.log("*****************************************");
            console.log("*****************************************");

            console.log("Signing Up");
            GameFuse.signUp(this.userEmail, "password", "password", this.username, function(message,hasError){self.signedUp(message,hasError)});
        }
    }

    signedUp(message, hasError) {
        let self = this

        if (hasError) {
            console.log("Error signing up: " + message);
        } else {
            console.log("signed up!");
            console.log("<color=yellow>Adding credits!</color>");

            console.log("Before Credits: " + GameFuseUser.CurrentUser.getCredits());
            GameFuseUser.CurrentUser.addCredits(50,  function(message,hasError){self.addCreditsCallback(message,hasError)} );
        }
    }

    addCreditsCallback(message, hasError) {
        let self = this;

        if (hasError) {
            console.log("Error adding credits: " + message);
        } else {
            console.log("After Credits: " + GameFuseUser.CurrentUser.getCredits());
            console.log(
                "currently attribute color is null?" +
                    (GameFuseUser.CurrentUser.getAttributeValue("Color") === null).toString()
            );
            console.log("<color=yellow>Setting attribute color = blue</color>");
            GameFuseUser.CurrentUser.setAttribute("Color", "Blue", function(message,hasError){self.setAttributeCallback(message,hasError)} );
        }
    }

    setAttributeCallback(message, hasError) {
        let self = this;
        if (hasError) {
            console.log("Error adding attribute: " + message);
        } else {
            console.log(
                "currently attribute color is null?" +
                    (GameFuseUser.CurrentUser.getAttributeValue("Color") === null).toString()
            );
            console.log("currently attribute color " + GameFuseUser.CurrentUser.getAttributeValue("Color"));
            const item = GameFuse.getStoreItems()[0];
            console.log("Purchase Store Item: " + item.getName() + ": " + item.getCost());

            GameFuseUser.CurrentUser.purchaseStoreItem(item, function(message,hasError){self.purchasedItem(message,hasError)});
        }
    }

    purchasedItem(message, hasError) {
        let self = this

        if (hasError) {
            console.log("Error purchasing item: " + message);
        } else {
            console.log("Purchased Item");
            console.log("Current Credits: " + GameFuseUser.CurrentUser.getCredits());
        }

        const extraAttributes = {};
        extraAttributes["deaths"] = "15";
        extraAttributes["Jewels"] = "12";

        GameFuseUser.CurrentUser.addLeaderboardEntry("TimeRound", 10, extraAttributes, function(message,hasError){self.leaderboardEntryAdded(message,hasError)} );
    }

    leaderboardEntryAdded(message, hasError) {
        let self = this

        if (hasError) {
            console.log("Error adding leaderboard entry: " + message);
        } else {
            console.log("Set Leaderboard Entry 2");
            const extraAttributes = {};
            extraAttributes["deaths"] = "25";
            extraAttributes["Jewels"] = "15";

            GameFuseUser.CurrentUser.addLeaderboardEntry("TimeRound", 7, extraAttributes, function(message,hasError){self.leaderboardEntryAdded2(message,hasError)} );
        }
    }

    leaderboardEntryAdded2(message, hasError) {
        let self = this

        if (hasError) {
            console.log("Error adding leaderboard entry 2: " + message);
        } else {
            console.log("Set Leaderboard Entry 2");
            GameFuseUser.CurrentUser.getLeaderboard(5, true,  function(message,hasError){self.leaderboardEntriesRetrieved(message,hasError)});
        }
    }

    leaderboardEntriesRetrieved(message, hasError) {
        let self = this

        if (hasError) {
            console.log("Error loading leaderboard entries: " + message);
        } else {
            console.log("Got leaderboard entries for specific user!");
            for (const entry of GameFuse.Instance.leaderboardEntries) {
                console.log(entry.getUsername() + ": " + entry.getScore().toString() + ": " + entry.getLeaderboardName());
                const extraAttributes = entry.getExtraAttributes();
                for (const key in extraAttributes) { 
                    console.log(key + ": " + extraAttributes[key]); 
                }

            }
            GameFuse.Instance.getLeaderboard(5, true, "TimeRound", function(message,hasError){self.leaderboardEntriesRetrievedAll(message,hasError)});
        }
    }

    leaderboardEntriesRetrievedAll(message, hasError) {
        let self = this

        if (hasError) {
            console.log("Error loading leaderboard entries: " + message);
        } else {
            console.log("Got leaderboard entries for whole game!");
            for (const entry of GameFuse.Instance.leaderboardEntries) {
                console.log(entry.getUsername() + ": " + entry.getScore().toString() + ": " + entry.getLeaderboardName());
                const extraAttributes = entry.getExtraAttributes();
                for (const key in extraAttributes) { 
                    console.log(key + ": " + extraAttributes[key]); 
                }
            }
        }
        console.log("GameFuse Test Complete");
    }
}




const example = new GameFuseExample(ENV.gameToken, ENV.gameId);

example.start()


