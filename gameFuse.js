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
            GameFuseUtilities.HandleCallback(response, "Game has failed to set up!", callback);
        }
    }

    downloadStoreItemsPrivate(callback = undefined) {
        this.downloadStoreItemsRoutine(callback);
    }

    async downloadStoreItemsRoutine(callback = undefined) {
        this.Log("GameFuse Downloading Store Items");
        const body = `game_id=${this.id}&game_token=${this.token}`;
        const response = await GameFuseUtilities.processRequest(`${GameFuse.getBaseURL()}/games/store_items?${body}`);

        if (response.ok) {
            this.Log("GameFuse Downloading Store Items Success");
            this.Log(response.data.store_items)
            this.store = response.data.store_items.map(storeItem => new GameFuseStoreItem(
                storeItem.name,
                storeItem.category,
                storeItem.description,
                parseInt(storeItem.cost),
                parseInt(storeItem.id)
            ));
        } else {
            GameFuseUtilities.HandleCallback(response, "Game has failed to set up!", callback);
            this.Log("GameFuse Downloading Store Items Failed");
        }
        GameFuseUtilities.HandleCallback(response, "Game has been set up!", callback);
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

        if (response.ok) {
            this.Log(`GameFuse Sign In Success: ${email}`);
            GameFuseUser.CurrentUser.setSignedInInternal();
            GameFuseUser.CurrentUser.setScoreInternal(parseInt(response.data.score));
            GameFuseUser.CurrentUser.setCreditsInternal(parseInt(response.data.credits));
            GameFuseUser.CurrentUser.setUsernameInternal(response.data.username);
            GameFuseUser.CurrentUser.setLastLoginInternal(new Date(response.data.last_login));
            GameFuseUser.CurrentUser.setNumberOfLoginsInternal(parseInt(response.data.number_of_logins));
            GameFuseUser.CurrentUser.setAuthenticationTokenInternal(response.data.authentication_token);
            GameFuseUser.CurrentUser.setIDInternal(parseInt(response.data.id));
            GameFuseUser.CurrentUser.DownloadAttributes(true, callback); // Chain next request - download users attributes
        } else {
            this.Log(`GameFuse Sign In Failure: ${email}`);
            GameFuseUtilities.HandleCallback(response, "User has been signed in successfully", callback);
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
                await GameFuseUtilities.HandleCallback(response, "User could not sign up: " + response.error, callback);
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

            if (response.ok) {
                GameFuse.Log("GameFuse Get Leaderboard Success: : " + limit.toString());

                const storeItems = response.data.leaderboard_entries;
                GameFuse.Instance.leaderboardEntries = [];
                for (const storeItem of storeItems) {
                    GameFuse.Instance.leaderboardEntries.push(new GameFuseLeaderboardEntry(
                        storeItem.username,
                        parseInt(storeItem.score),
                        storeItem.leaderboard_name,
                        storeItem.extra_attributes,
                        parseInt(storeItem.game_user_id)
                    ));
                }
            }

            GameFuseUtilities.HandleCallback(response, "Leaderboard recieved", callback);
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(response, error.message, callback);
        }
    }


}


