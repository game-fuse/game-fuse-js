class GameFuse {
    static request;

    constructor() {
        this.id = "";
        this.token = "";
        this.name = "";
        this.description = "";
        this.verboseLogging = false;
        this.store = [];
        this.leaderboardEntries = [];
    }

    static get Instance() {
        if (!this._instance) {
            this._instance = new GameFuse();
        }
        return this._instance;
    }

    static getBaseURL() {
        return "https://gamefuse.co/api/v1";
    }

    static getGameId() {
        return this.Instance.id;
    }

    static getGameName() {
        return this.Instance.name;
    }

    static getGameDescription() {
        return this.Instance.description;
    }

    static getGameToken() {
        return this.Instance.token;
    }

    static getVerboseLogging() {
        return this.Instance.verboseLogging;
    }

    static setVerboseLogging(_verboseLogging) {
        this.Instance.verboseLogging = _verboseLogging;
    }

    static Log(log) {
        if (this.getVerboseLogging()) {
            console.log(`%c ${log}`, `color=green`);
        }
    }

    Log(log) {
        GameFuse.Log(log)
    }

    static setUpGame(gameId, token, callback = undefined, extraData={}) {
        this.Log(`GameFuse Setting Up Game: ${gameId}: ${token}`);
        this.Instance.setUpGamePrivate(gameId, token, callback, extraData);
    }

    setUpGamePrivate(gameId, token, callback = undefined, extraData={}) {
        this.setUpGameRoutine(gameId, token, callback, extraData);
    }

    async setUpGameRoutine(gameId, token, callback = undefined, extraData={}) {
        var body = `game_id=${gameId}&game_token=${token}`;
        if (extraData.seedStore == "seedStore") {
            body += "&seed_store=true";
        }
        this.Log(`GameFuse Setting Up Game Sending Request: ${GameFuse.getBaseURL()}/games/verify?${body}`);
        const response = await GameFuseUtilities.processRequest(`${GameFuse.getBaseURL()}/games/verify?${body}`);

        if (!response.data.error) {
            this.Log(`GameFuse Setting Up Game Received Request Success: ${gameId}: ${token}`);
            this.id = response.data.id.toString();
            this.name = response.data.name;
            this.description = response.data.description;
            this.token = response.data.token;
            this.downloadStoreItemsPrivate(callback);
        } else {
            this.Log(`GameFuse Setting Up Game Received Request Failure: ${gameId}: ${token}`);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Game has failed to set up!", callback, false);
        }
    }

    downloadStoreItemsPrivate(callback = undefined) {
        this.downloadStoreItemsRoutine(callback);
    }

    async downloadStoreItemsRoutine(callback = undefined) {
        this.Log("GameFuse Downloading Store Items");
        const body = `game_id=${this.id}&game_token=${this.token}`;
        const response = await GameFuseUtilities.processRequest(`${GameFuse.getBaseURL()}/games/store_items?${body}`);

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
            this.Log("GameFuse Downloading Store Items Success");
            this.Log(response.data.store_items)
            this.store = response.data.store_items.map(storeItem => new GameFuseStoreItem(
                storeItem.name,
                storeItem.category,
                storeItem.description,
                parseInt(storeItem.cost),
                parseInt(storeItem.id),
                storeItem.icon_url
            ));
        } else {
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Game has failed to set up!", callback, false);
            this.Log("GameFuse Downloading Store Items Failed");
        }
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Game has been set up!", callback, true);
    }

    static getStoreItems() {
        return this.Instance.store;
    }

    static signIn(email, password, callback = undefined) {
        this.Instance.signInPrivate(email, password, callback);
    }

    async signInPrivate(email, password, callback = undefined) {
        await this.signInRoutine(email, password, callback);
    }

    async signInRoutine(email, password, callback = undefined) {
        this.Log(`GameFuse Sign In: ${email}`);
        if (GameFuse.getGameId() == null) {
            throw new Error("Please set up your game with PainLessAuth.SetUpGame before signing in users");
        }
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        formData.append("game_id", GameFuse.getGameId());
        const response = await GameFuseUtilities.processRequest(`${GameFuse.getBaseURL()}/sessions`, {
            method: "POST",
            body: formData
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
            this.Log(`GameFuse Sign In Success: ${email}`);
            GameFuseUser.CurrentUser.setSignedInInternal();
            GameFuseUser.CurrentUser.setScoreInternal(parseInt(response.data.score));
            GameFuseUser.CurrentUser.setCreditsInternal(parseInt(response.data.credits));
            GameFuseUser.CurrentUser.setUsernameInternal(response.data.username);
            GameFuseUser.CurrentUser.setLastLoginInternal(new Date(response.data.last_login));
            GameFuseUser.CurrentUser.setNumberOfLoginsInternal(parseInt(response.data.number_of_logins));
            GameFuseUser.CurrentUser.setAuthenticationTokenInternal(response.data.authentication_token);
            GameFuseUser.CurrentUser.setIDInternal(parseInt(response.data.id));
            GameFuseUser.CurrentUser.downloadAttributes(true, callback); // Chain next request - download users attributes
        } else {
            this.Log(`GameFuse Sign In Failure: ${email}`);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "User has been signed in successfully", callback, true);
        }
    }

    static signUp(email, password, password_confirmation, username, callback = undefined) {
        this.Instance.signUpPrivate(email, password, password_confirmation, username, callback);
    }

    signUpPrivate(email, password, password_confirmation, username, callback = undefined) {
        this.signUpRoutine(email, password, password_confirmation, username, callback);
    }

    async signUpRoutine(email, password, password_confirmation, username, callback = undefined) {
        console.log("GameFuse Sign Up: " + email);
        if (GameFuse.getGameId() == null)
            throw new GameFuseException("Please set up your game with PainLessAuth.SetUpGame before signing up users");

        const form = new FormData();
        form.append("email", email);
        form.append("password", password);
        form.append("password_confirmation", password_confirmation);
        form.append("username", username);
        form.append("game_id", GameFuse.getGameId());
        form.append("game_token", GameFuse.getGameToken());

        try {
            const response = await GameFuseUtilities.processRequest(GameFuse.getBaseURL() + "/users", {
                method: "POST",
                body: form
            });
            if (GameFuseUtilities.RequestIsSuccessful(response)) {
                console.log("GameFuse Sign Up Success: " + email);

                GameFuseUser.CurrentUser.setSignedInInternal();
                GameFuseUser.CurrentUser.setScoreInternal(parseInt(response.data.score));
                GameFuseUser.CurrentUser.setCreditsInternal(parseInt(response.data.credits));
                GameFuseUser.CurrentUser.setUsernameInternal(response.data.username);
                GameFuseUser.CurrentUser.setLastLoginInternal(new Date(response.data.last_login));
                GameFuseUser.CurrentUser.setNumberOfLoginsInternal(parseInt(response.data.number_of_logins));
                GameFuseUser.CurrentUser.setAuthenticationTokenInternal(response.data.authentication_token);
                GameFuseUser.CurrentUser.setIDInternal(parseInt(response.data.id));
                await GameFuseUser.CurrentUser.downloadAttributes(true, callback); // Chain next request - download users attributes
            } else {
                console.log("GameFuse Sign Up Failure: " + email);
                await GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "User could not sign up: " + response.error, callback, false);
            }
        } catch (error) {
            console.error("GameFuse Sign Up Error: " + error);
            if (callback !== null)
                callback("An unknown error occurred: " + error, true);
        }
    }


    getLeaderboard(limit, onePerUser, LeaderboardName, callback) {
        this.getLeaderboardRoutine(limit, onePerUser, LeaderboardName, callback);
    }

    async getLeaderboardRoutine(limit, onePerUser, LeaderboardName, callback) {
        try {
            GameFuse.Log("GameFuse Get Leaderboard: " + limit.toString());

            if (GameFuse.getGameId() == null) {
                throw new GameFuseException("Please set up your game with GameFuse.SetUpGame before modifying users");
            }

            const parameters = "?authentication_token=" + GameFuseUser.CurrentUser.getAuthenticationToken() + "&limit=" + limit.toString() + "&one_per_user=" + onePerUser.toString() + "&leaderboard_name=" + LeaderboardName.toString();
            const url = GameFuse.getBaseURL() + "/games/" + GameFuse.getGameId() + "/leaderboard_entries" + parameters;

            const response = await GameFuseUtilities.processRequest(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
                }
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response)
            if (responseOk) {
                GameFuse.Log("GameFuse Get Leaderboard Success: : " + limit.toString());

                const storeItems = response.data.leaderboard_entries;
                GameFuse.Instance.leaderboardEntries = [];
                for (const storeItem of storeItems) {
                    GameFuse.Instance.leaderboardEntries.push(new GameFuseLeaderboardEntry(
                        storeItem.username,
                        parseInt(storeItem.score),
                        storeItem.leaderboard_name,
                        storeItem.extra_attributes,
                        parseInt(storeItem.game_user_id),
                        storeItem["created_at"]
                    ));
                }
            }

            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Leaderboard recieved", callback, true);
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false);
        }
    }


}


class GameFuseLeaderboardEntry {
    constructor(username, score, leaderboard_name, extra_attributes, game_user_id, created_at) {
        this.username = username;
        this.score = score;
        this.leaderboard_name = leaderboard_name;
        this.extra_attributes = extra_attributes;
        this.game_user_id = game_user_id;
        this.created_at = created_at;

    }

    getUsername() {
        return this.username;
    }

    getScore() {
        return this.score;
    }

    getLeaderboardName() {
        return this.leaderboard_name;
    }

    getTimestamp(){
        return this.created_at
    }

    getExtraAttributes() {
        const dictionary = this.extra_attributes
            .replace("\\", "")
            .replace("{", "")
            .replace("}", "")
            .replace(", ", ",")
            .replace(": ", ":")
            .split(",")
            .map(part => part.split(":"))
            .filter(part => part.length === 2)
            .reduce((acc, [key, value]) => {
                acc[key.replace("\"", "")] = value.replace("\"", "");
                return acc;
            }, {});
        return dictionary;
    }
}


class GameFuseStoreItem {
    constructor(name, category, description, cost, id, icon_url) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.cost = cost;
        this.id = id;
        this.icon_url = icon_url;
    }

    getName() {
        return this.name;
    }

    getCategory() {
        return this.category;
    }

    getDescription() {
        return this.description;
    }

    getCost() {
        return this.cost;
    }

    getId() {
        return this.id;
    }

    getIconUrl() {
        return this.icon_url;
    }
}

class GameFuseUser { 

    constructor(signedIn = false, numberOfLogins = 0, lastLogin = undefined, authenticationToken = "",
        username = "", score = 0, credits = 0, id = 0, attributes = {}, purchasedStoreItems = []) {
        this.signedIn = signedIn;
        this.numberOfLogins = numberOfLogins;
        this.lastLogin = lastLogin;
        this.authenticationToken = authenticationToken;
        this.username = username;
        this.score = score;
        this.credits = credits;
        this.id = id;
        this.attributes = attributes;
        this.purchasedStoreItems = purchasedStoreItems;
    }   

    static get CurrentUser() {
        if (!this._instance) {
            this._instance = new GameFuseUser();
        }
        return this._instance;
    }

    // instance setters
    setSignedInInternal() {
        this.signedIn = true;
    }

    setNumberOfLoginsInternal(numberOfLogins) {
        this.numberOfLogins = numberOfLogins;
    }

    setLastLoginInternal(lastLogin) {
        this.lastLogin = lastLogin;
    }

    setAuthenticationTokenInternal(authenticationToken) {
        this.authenticationToken = authenticationToken;
    }

    setUsernameInternal(username) {
        this.username = username;
    }

    setScoreInternal(score) {
        this.score = score;
    }

    setCreditsInternal(credits) {
        this.credits = credits;
    }

    setIDInternal(id) {
        this.id = id;
    }

    // instance getters
    IsSignedIn() {
        return this.signedIn;
    }

    getNumberOfLogins() {
        return this.numberOfLogins;
    }

    getLastLogin() {
        return this.lastLogin;
    }

    getAuthenticationToken() {
        return this.authenticationToken;
    }

    getUsername() {
        return this.username;
    }

    getScore() {
        return this.score;
    }

    getCredits() {
        return this.credits;
    }

    getID() {
        return this.id;
    }

    async addCredits(credits, callback = undefined) {
      try {
        GameFuse.Log("GameFuseUser Add Credits: " + credits.toString());
        if (GameFuse.getGameId() == null) {
          throw new GameFuseException(
            "Please set up your game with GameFuse.SetUpGame before modifying users"
          );
        }

        const url = GameFuse.getBaseURL() + "/users/" + GameFuseUser.CurrentUser.id + "/add_credits";
        const data = {
          authentication_token: GameFuseUser.CurrentUser.getAuthenticationToken(),
          credits: credits
        };

        const response = await GameFuseUtilities.processRequest(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
          },
          body: JSON.stringify(data)
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
          GameFuse.Log("GameFuseUser Add Credits Success: " + credits.toString());
          this.setCreditsInternal(parseInt(response.data.credits));
          GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Credits Added!", callback, true);
        } else {
          GameFuse.Log("GameFuseUser Add Credits Failure: " + credits.toString());
          GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Credits Failed To Add!", callback, false);
        }
      } catch (error) {
        console.log(error)
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false);
      }
    }

    async setCredits(credits, callback = undefined) {
      try {
        GameFuse.Log("GameFuseUser Set Credits: " + credits.toString());
        if (GameFuse.getGameId() == null) {
          throw new GameFuseException(
            "Please set up your game with GameFuse.SetUpGame before modifying users"
          );
        }

        const url = GameFuse.getBaseURL() + "/users/" + GameFuseUser.CurrentUser.id + "/set_credits";
        const data = {
          authentication_token: GameFuseUser.CurrentUser.getAuthenticationToken(),
          credits: credits
        };

        const response = await GameFuseUtilities.processRequest(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
          },
          body: JSON.stringify(data)
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
          GameFuse.Log("GameFuseUser Set Credits Success: " + credits.toString());

          
          this.setCreditsInternal(parseInt(json.credits));
        } else {
          GameFuse.Log("GameFuseUser Set Credits Failure: " + credits.toString());
        }
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Credits Added!", callback, true);
      } catch (error) {
        console.log(error)
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false);
      }
    }

    async addScore(score, callback = undefined) {
      try {
        GameFuse.Log("GameFuseUser Add Score: " + score.toString());
        if (GameFuse.getGameId() == null) {
          throw new GameFuseException(
            "Please set up your game with GameFuse.SetUpGame before modifying users"
          );
        }

        const url = GameFuse.getBaseURL() + "/users/" + GameFuseUser.CurrentUser.id + "/add_score";
        const data = {
          authentication_token: GameFuseUser.CurrentUser.getAuthenticationToken(),
          score: score
        };

        const response = await GameFuseUtilities.processRequest(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
          },
          body: JSON.stringify(data)
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
          GameFuse.Log("GameFuseUser Add Score Succcess: " + score.toString());

          this.SetScoreInternal(parseInt(response.data.score));
        }
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Score has been added to user", callback, true);
      } catch (error) {
        console.log(error)
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false);
      }
    }

    async setScore(score, callback=undefined) {
      try {
        GameFuse.Log("GameFuseUser Set Score: " + score.toString());
        if (GameFuse.getGameId() == null) {
          throw new GameFuseException(
            "Please set up your game with GameFuse.SetUpGame before modifying users"
          );
        }

        const url = GameFuse.getBaseURL() + "/users/" + GameFuseUser.CurrentUser.id + "/set_score";
        const data = {
          authentication_token: GameFuseUser.CurrentUser.getAuthenticationToken(),
          score: score
        };

        const response = await GameFuseUtilities.processRequest(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
          },
          body: JSON.stringify(data)
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
          GameFuse.Log("GameFuseUser Set Score Success: " + score.toString());

          this.SetScoreInternal(parseInt(response.data.score));
        }
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined,"Score has been set for user", callback, true);
      } catch (error) {
        console.log(error)
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
      }
    }


    async downloadAttributes(chainedFromLogin, callback=undefined) {
      try {
        GameFuse.Log("GameFuseUser get Attributes");

        if (GameFuse.getGameId() == null) {
          throw new GameFuseException(
            "Please set up your game with GameFuse.SetUpGame before modifying users"
          );
        }

        const parameters = "?authentication_token=" + GameFuseUser.CurrentUser.getAuthenticationToken();
        const url = GameFuse.getBaseURL() + "/users/" + this.id + "/game_user_attributes" + parameters;

        const response = await GameFuseUtilities.processRequest(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
          }
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
          GameFuse.Log("GameFuseUser Get Attributes Success");
          const game_user_attributes = response.data.game_user_attributes;
          this.attributes = {};
          for (const attribute of game_user_attributes) {
            this.attributes[attribute.key] = attribute.value;
          }
          await this.downloadStoreItems(chainedFromLogin, callback);
        } else {
          GameFuseUtilities.HandleCallback(
            response,
            chainedFromLogin ? "Users have been signed in successfully" : "User attributes have been downloaded",
            callback,
            true
          );
        }
      } catch (error) {
        console.log(error) 
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
      }
    }

    getAttributes() {
      return this.attributes;
    }

    getAttributesKeys() {
      return this.attributes.keys();
    }

    getAttributeValue(key) {
      if (this.attributes[key]) {
        return this.attributes[key];
      } else {
        return "";
      }
    }

    async setAttribute(key, value, callback=undefined) {
      try {
        GameFuse.Log("GameFuseUser Set Attributes: " + key);

        if (GameFuse.getGameId() == null) {
          throw new GameFuseException(
            "Please set up your game with GameFuse.SetUpGame before modifying users"
          );
        }

        const url = GameFuse.getBaseURL() + "/users/" + GameFuseUser.CurrentUser.id + "/add_game_user_attribute";
        const data = {
          authentication_token: GameFuseUser.CurrentUser.getAuthenticationToken(),
          key: key,
          value: value
        };

        const response = await GameFuseUtilities.processRequest(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
          },
          body: JSON.stringify(data)
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
          GameFuse.Log("GameFuseUser Set Attributes Success: " + key);
          this.attributes[key] = value;
          for (const [attributeKey, attributeValue] of Object.entries(this.attributes)) {
            console.log(attributeKey + "," + attributeValue);
          }
        }

        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined,"Attribute has been added to user", callback, true);
      } catch (error) {
        console.log(error)
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
      }
    }

    async removeAttribute(key, callback=undefined) {
      try {
        GameFuse.Log("GameFuseUser Remove Attributes: " + key);

        if (GameFuse.getGameId() == null) {
          throw new GameFuseException(
            "Please set up your game with GameFuse.SetUpGame before modifying users"
          );
        }

        const parameters = "?authentication_token=" + GameFuseUser.CurrentUser.getAuthenticationToken() + "&game_user_attribute_key=" + key;
        const url = GameFuse.getBaseURL() + "/users/" + GameFuseUser.CurrentUser.id + "/remove_game_user_attributes" + parameters;

        const response = await GameFuseUtilities.processRequest(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
          }
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
          GameFuse.Log("GameFuseUser Remove Attributes Success: " + key);

          const game_user_attributes = response.data.game_user_attributes;

          this.attributes = {}
          for (const attribute of game_user_attributes) {
            attributes.set(attribute.key, attribute.value);
          }
        }

        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined,"Attribute has been removed", callback, true);
      } catch (error) {
        console.log(error)
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
      }
    }

    async downloadStoreItems(chainedFromLogin, callback=undefined) {
      try {
        GameFuse.Log("GameFuseUser Download Store Items");

        if (GameFuse.getGameId() == null) {
          throw new GameFuseException(
            "Please set up your game with GameFuse.SetUpGame before modifying users"
          );
        }

        const parameters = "?authentication_token=" + GameFuseUser.CurrentUser.getAuthenticationToken();
        const url = GameFuse.getBaseURL() + "/users/" + GameFuseUser.CurrentUser.id + "/game_user_store_items" + parameters;

        const response = await GameFuseUtilities.processRequest(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
          }
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
          GameFuse.Log("GameFuseUser Download Store Items Success");

          const game_user_store_items = response.data.game_user_store_items;

          this.purchasedStoreItems = []
          for (const item of game_user_store_items) {
            this.purchasedStoreItems.push(new GameFuseStoreItem(
              item.name,
              item.category,
              item.description,
              parseInt(item.cost),
              parseInt(item.id),
              item.icon_url
            ));
          }
        }

        GameFuseUtilities.HandleCallback(
          response,
          chainedFromLogin ? "Users have been signed in successfully" : "User store items have been downloaded",
          callback,
          true
        );
      } catch (error) {
        console.log(error)
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
      }
    }


    getPurchasedStoreItems() {
      return this.purchasedStoreItems;
    }

    purchaseStoreItem(storeItem, callback = undefined) {
      if (storeItem instanceof GameFuseStoreItem) {
        this.purchaseStoreItemRoutine(storeItem.getId(), callback);
      } else {
        this.purchaseStoreItemRoutine(storeItem, callback);
      }
    }

    async purchaseStoreItemRoutine(storeItemId, callback = undefined) {
      try {
        GameFuse.Log("GameFuseUser Purchase Store Items: ");

        if (GameFuse.getGameId() == null) {
          throw new GameFuseException(
            "Please set up your game with GameFuse.SetUpGame before modifying users"
          );
        }

        const form = new FormData();
        form.append("authentication_token", GameFuseUser.CurrentUser.getAuthenticationToken());
        form.append("store_item_id", storeItemId.toString());

        const url =
          GameFuse.getBaseURL() + "/users/" + GameFuseUser.CurrentUser.id + "/purchase_game_user_store_item";

        const response = await GameFuseUtilities.processRequest(url, {
          method: 'POST',
          headers: {
            'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
          },
          body: form
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
          GameFuse.Log("GameFuseUser Purchase Store Items Success: ");


          const game_user_store_items = response.data["game_user_store_items"];
          this.setCreditsInternal(parseInt(response.data["credits"]));
          this.purchasedStoreItems = []

          for (const item of game_user_store_items) {
            this.purchasedStoreItems.push(new GameFuseStoreItem(
              item["name"],
              item["category"],
              item["description"],
              parseInt(item["cost"]),
              parseInt(item["id"]),
              item["icon_url"]
            ));
          }
        }

        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Store Item has been purchased by user", callback, true);
      } catch (error) {
        console.log(error)
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
      }
    }

    removeStoreItem(storeItemID, reimburseUser, callback = undefined) {
      if (storeItemID instanceof GameFuseStoreItem) {
        removeStoreItemRoutine(storeItemID.getId(), reimburseUser, callback);
      } else {
        removeStoreItemRoutine(storeItemID, reimburseUser, callback);
      }
    }

    async removeStoreItemRoutine(storeItemID, reimburseUser, callback = undefined) {
      try {
        GameFuse.Log("GameFuseUser Remove Store Item: " + storeItemID);

        if (GameFuse.getGameId() == null) {
          throw new GameFuseException(
            "Please set up your game with GameFuse.SetUpGame before modifying users"
          );
        }

        const parameters =
          "?authentication_token=" +
          GameFuseUser.CurrentUser.getAuthenticationToken() +
          "&store_item_id=" +
          storeItemID +
          "&reimburse=" +
          reimburseUser.toString();
        const url =
          GameFuse.getBaseURL() +
          "/users/" +
          GameFuseUser.CurrentUser.id +
          "/remove_game_user_store_item" +
          parameters;

        const response = await GameFuseUtilities.processRequest(url, {
          method: 'GET',
          headers: {
            'authentication_token':GameFuseUser.CurrentUser.getAuthenticationToken()
          }
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
          GameFuse.Log("GameFuseUser Remove Store Item Success: " + storeItemID);

          this.setCreditsInternal(parseInt(response.data["credits"]));
          const game_user_store_items = response.data["game_user_store_items"];
          this.purchasedStoreItems = []

          for (const item of game_user_store_items) {
            this.purchasedStoreItems.push(new GameFuseStoreItem(
              item["name"],
              item["category"],
              item["description"],
              parseInt(item["cost"]),
              parseInt(item["id"]),
              item["icon_url"]
            ));
          }
        }

        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Store Item has been removed", callback, true);
      } catch (error) {
        console.log(error)
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
      }
    }

    addLeaderboardEntry(leaderboardName, score, extraAttributes = null, callback = undefined) {
      this.addLeaderboardEntryRoutine(leaderboardName, score, extraAttributes, callback);
    }

    async addLeaderboardEntryRoutine(leaderboardName, score, extraAttributes, callback = undefined) {
      try {
        GameFuse.Log("GameFuseUser Adding Leaderboard Entry: " + leaderboardName + ": " + score.toString());

        if (GameFuse.getGameId() == null) {
          throw new GameFuseException(
            "Please set up your game with GameFuse.SetUpGame before modifying users"
          );
        }

        const extraAttributesList = [];
        for (const [key, value] of Object.entries(extraAttributes)) {
          extraAttributesList.push(`"${key.toString()}": ${value.toString()}`);
        }
        const extraAttributesJson = `{${extraAttributesList.join(", ")}}`;

        const form = new FormData();
        form.append("authentication_token", GameFuseUser.CurrentUser.getAuthenticationToken());
        form.append("leaderboard_name", leaderboardName);
        form.append("extra_attributes", extraAttributesJson);
        form.append("score", score);

        const url = GameFuse.getBaseURL() + "/users/" + GameFuseUser.CurrentUser.id + "/add_leaderboard_entry";

        const response = await GameFuseUtilities.processRequest(url, {
          method: 'POST',
          headers: {
            'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
          },
          body: form
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
          GameFuse.Log("GameFuseUser Add Leaderboard Entry: " + leaderboardName + ": " + score);
        }

        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Leaderboard Entry Has Been Added", callback, true);
      } catch (error) {
        console.log(error)
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
      }
    }

    clearLeaderboardEntries(leaderboardName, callback = undefined) {
      clearLeaderboardEntriesRoutine(leaderboardName, callback);
    }

    async clearLeaderboardEntriesRoutine(leaderboardName, callback = undefined) {
      try {
        GameFuse.Log("GameFuseUser Clearing Leaderboard Entry: " + leaderboardName);

        if (GameFuse.getGameId() == null) {
          throw new GameFuseException(
            "Please set up your game with GameFuse.SetUpGame before modifying users"
          );
        }

        const form = new FormData();
        form.append("authentication_token", GameFuseUser.CurrentUser.getAuthenticationToken());
        form.append("leaderboard_name", leaderboardName);

        const url = GameFuse.getBaseURL() + "/users/" + GameFuseUser.CurrentUser.id + "/clear_my_leaderboard_entries";

        const response = await GameFuseUtilities.processRequest(url, {
          method: 'POST',
          headers: {
            'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
          },
          body: form
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
          GameFuse.Log("GameFuseUser Clear Leaderboard Entry: " + leaderboardName);
        }

        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Leaderboard Entries Have Been Cleared", callback, true);
      } catch (error) {
        console.log(error)
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
      }
    }

    getLeaderboard(limit, onePerUser, callback = undefined) {
      this.getLeaderboardRoutine(limit, onePerUser, callback);
    }

    async getLeaderboardRoutine(limit, onePerUser, callback = undefined) {
      try {
        GameFuse.Log("GameFuseUser Get Leaderboard: " + limit.toString());

        if (GameFuse.getGameId() == null) {
          throw new GameFuseException(
            "Please set up your game with GameFuse.SetUpGame before modifying users"
          );
        }

        const parameters =
          "?authentication_token=" +
          GameFuseUser.CurrentUser.getAuthenticationToken() +
          "&limit=" +
          limit.toString() +
          "&one_per_user=" +
          onePerUser.toString();

        const url =
          GameFuse.getBaseURL() +
          "/users/" +
          GameFuseUser.CurrentUser.id +
          "/leaderboard_entries" +
          parameters;

        const response = await GameFuseUtilities.processRequest(url, {
          method: 'GET',
          headers: {
            'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
          }
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
          GameFuse.Log("GameFuseUser Get Leaderboard Success: : " + limit.toString());
          GameFuse.Instance.leaderboardEntries = [];

          for (const storeItem of response.data["leaderboard_entries"]) {
            GameFuse.Instance.leaderboardEntries.push(new GameFuseLeaderboardEntry(
              storeItem["username"],
              parseInt(storeItem["score"]),
              storeItem["leaderboard_name"],
              storeItem["extra_attributes"],
              parseInt(storeItem["game_user_id"]),
              storeItem["created_at"]
            ));
          }
        }

        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Store Item has been removed", callback, true);
      } catch (error) {
        console.log(error)
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
      }
    }

}


class GameFuseUtilities {
    static async HandleCallback(response, responseMessage, callback = undefined, success=true) {
        try {
            if (!success){
                callback(responseMessage,true)
            }
            else if (response == undefined) {
                callback(responseMessage, true)
            }
            else if (response.status >= 400) {
                console.error(`Request (${response.url}) had error: ` + response.statusText);
                if (callback !== null)
                    callback("An unknown error occurred: " + response.statusText, true);
            } else if (response.status === 299) {
                const data = response.data
                let errorString = data.error;

                if (errorString.includes("has already been taken"))
                    errorString = "Username or email already taken";

                if (callback !== null)
                    callback(errorString, true);
            } else {
                if (callback !== null)
                    callback(responseMessage, false);
            }
        } catch (error) {
            console.error("response had error: ");
            console.log(error)
            if (callback !== null)
                callback("An unknown error occurred: " + error, true);
        }
    }

    static RequestIsSuccessful(response) {
        if (response.data && response.data.error && response.data.error.length > 0){
            return false;
        }
        return response.status.toString()[0] ==  "2"
    }


    static async processRequest(url, options) {
      const response = await fetch(url, options);
      const data = await response.json();

      response.data = data;
      return response;
    }


    static async requestIsOk(response){
        const data = response.data
        if (data && data.error && data.error.length > 0) {
            return false
        }
        return response.ok
    }
}