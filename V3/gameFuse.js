﻿// V3
class GameFuse {
    static request;

    constructor() {
        this.id = "";
        this.token = "";
        this.name = "";
        this.description = "";
        this.verboseLogging = false;
        this.authenticationCompleteCallback = undefined; // gets set via GameFuse.setAuthenticationCompleteCallback(callback);
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
        return ENV?.baseUrl || "https://gamefuse.co/api/v3";
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

    static getGameVariables() {
        return this.Instance.game_variables;
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
        return this.Instance.setUpGamePrivate(gameId, token, callback, extraData);
    }

    setUpGamePrivate(gameId, token, callback = undefined, extraData={}) {
        return this.setUpGameRoutine(gameId, token, callback, extraData);
    }

    async setUpGameRoutine(gameId, token, callback = undefined, extraData={}) {
        var body = `client_from_library=js&game_id=${gameId}&game_token=${token}`;
        if (extraData.seedStore == "seedStore") {
            body += "&seed_store=true";
        }
        this.Log(`GameFuse Setting Up Game Sending Request: ${GameFuse.getBaseURL()}/games/verify?${body}`);
        const response = await GameFuseUtilities.processRequest(`${GameFuse.getBaseURL()}/games/verify?${body}`);

        let requestIsOk = await GameFuseUtilities.requestIsOk(response)
        if (requestIsOk) {
            this.Log(`GameFuse Setting Up Game Received Request Success: ${gameId}: ${token}`);
            this.id = response.data.id.toString();
            this.name = response.data.name;
            this.description = response.data.description;
            this.token = response.data.token;
            this.game_variables = response.data.game_variables
            this.downloadStoreItemsPrivate(callback);
        } else {
            this.Log(`GameFuse Setting Up Game Received Request Failure: ${gameId}: ${token}`);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Game has failed to set up!", callback, false);
        }
    }

    static fetchGameVariables(gameId, token, callback = undefined, extraData={}) {
        this.Instance.fetchGameVariablesPrivate(gameId, token, callback, extraData);
    }

    fetchGameVariablesPrivate(gameId, token, callback = undefined, extraData={}) {
        this.fetchGameVariablesRoutine(gameId, token, callback, extraData);
    }

    async fetchGameVariablesRoutine(gameId, token, callback = undefined, extraData={}) {
        var body = `game_id=${gameId}&game_token=${token}`;
        if (extraData.seedStore == "seedStore") {
            body += "&seed_store=true";
        }
        this.Log(`GameFuse Setting Up Game Sending Request: ${GameFuse.getBaseURL()}/games/fetch_game_variables?${body}`);
        const response = await GameFuseUtilities.processRequest(`${GameFuse.getBaseURL()}/games/fetch_game_variables?${body}`);

        if (GameFuseUtilities.RequestIsSuccessful(response)) {
            this.Log(`GameFuse Setting Up Game Received Request Success: ${gameId}: ${token}`);
            this.id = response.data.id.toString();
            this.name = response.data.name;
            this.description = response.data.description;
            this.token = response.data.token;
            this.game_variables = response.data.game_variables
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
            
            // figure out if this is coming from oauth - if so, sign them in.
            let tempOauthTransferToken = new URLSearchParams(window.location.search).get('temp_oauth_transfer_token');
            if(tempOauthTransferToken){
                GameFuse.signIn(null, null, callback, tempOauthTransferToken);
            } else {
                GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Game has been set up!", callback, true);
            }
            
        } else {
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Game has failed to set up!", callback, false);
            this.Log("GameFuse Downloading Store Items Failed");
        }
    }

    static getStoreItems() {
        return this.Instance.store;
    }

    static signIn(email, password, callback = undefined, tempOauthTransferToken = undefined) {
        return this.Instance.signInPrivate(email, password, callback, tempOauthTransferToken);
    }

    async signInPrivate(email, password, callback = undefined, tempOauthTransferToken = undefined) {
        await this.signInRoutine(email, password, callback, tempOauthTransferToken);
    }

    async signInRoutine(email, password, callback = undefined, tempOauthTransferToken = undefined) {
        this.Log(`GameFuse Sign In: ${email}`);
        if (GameFuse.getGameId() == null) {
            throw new Error("Please set up your game with GameFuse.SetUpGame before signing in users");
        }
        const formData = new FormData();
        formData.append("game_id", GameFuse.getGameId());
        if (tempOauthTransferToken) {
            formData.append("temp_oauth_transfer_token", tempOauthTransferToken);
        } else {
            formData.append("email", email);
            formData.append("password", password);
        }

        const response = await GameFuseUtilities.processRequest(`${GameFuse.getBaseURL()}/sessions`, {
            method: "POST",
            body: formData
        });
        const responseOk = await GameFuseUtilities.requestIsOk(response)
        let responseMsg;
        if (responseOk) {
            this.Log(`GameFuse Sign In Success: ${email}`);

            GameFuse.resetGlobalVariables();
            let currentUser = GameFuseUser.CurrentUser;
            currentUser.setSignedInInternal();
            currentUser.setScoreInternal(parseInt(response.data.score));
            currentUser.setCreditsInternal(parseInt(response.data.credits));
            currentUser.setUsernameInternal(response.data.username);
            currentUser.setLastLoginInternal(response.data.last_login && new Date(response.data.last_login));
            currentUser.setNumberOfLoginsInternal(parseInt(response.data.number_of_logins));
            currentUser.setAuthenticationTokenInternal(response.data.authentication_token);
            currentUser.setIDInternal(parseInt(response.data.id));
            
            currentUser.isNewUser = response.data.is_new_user;
            
            GameFuseJsonHelper.setFullUserData(response.data, currentUser);

            // add the current user to the UserCache.
            GameFuseUser.UserCache[GameFuseUser.CurrentUser.getID()] = GameFuseUser.CurrentUser;
            
            responseMsg = tempOauthTransferToken ? 'Game setup AND OAuth user has been authenticated' : 'User has been signed in successfully';
        } else {
            this.Log(`GameFuse Sign In Failure: ${email}`);
            
            responseMsg = tempOauthTransferToken ? 'Game setup, but OAuth authentication failed' : 'ERROR: user has not been signed in successfully';
        }
        GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, responseMsg, callback, !!responseOk);
    }

    static signUp(email, password, password_confirmation, username, callback = undefined) {
        return this.Instance.signUpPrivate(email, password, password_confirmation, username, callback);
    }

    signUpPrivate(email, password, password_confirmation, username, callback = undefined) {
        return this.signUpRoutine(email, password, password_confirmation, username, callback);
    }

    async signUpRoutine(email, password, password_confirmation, username, callback = undefined) {
        console.log("GameFuse Sign Up: " + email);
        if (GameFuse.getGameId() == null)
            throw new GameFuseException("Please set up your game with GameFuse.SetUpGame before signing up users");

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

                GameFuse.resetGlobalVariables();
                let currentUser = GameFuseUser.CurrentUser;
                currentUser.setSignedInInternal();
                currentUser.setScoreInternal(parseInt(response.data.score));
                currentUser.setCreditsInternal(parseInt(response.data.credits));
                currentUser.setUsernameInternal(response.data.username);
                currentUser.setLastLoginInternal(new Date(response.data.last_login));
                currentUser.setNumberOfLoginsInternal(parseInt(response.data.number_of_logins));
                currentUser.setAuthenticationTokenInternal(response.data.authentication_token);
                currentUser.setIDInternal(parseInt(response.data.id));

                currentUser.isNewUser = response.data.is_new_user;

                // add the current user to the UserCache
                GameFuseUser.UserCache[currentUser.getID()] = currentUser;
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

    static resetGlobalVariables() {
        GameFuseUser.resetCurrentUser();
        GameFuseUser.resetUserCache();
        GameFuseUser.resetGroupCache();
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

            const parameters = "?limit=" + limit.toString() + "&one_per_user=" + onePerUser.toString() + "&leaderboard_name=" + LeaderboardName.toString();
            const url = GameFuse.getBaseURL() + "/games/" + GameFuse.getGameId() + "/leaderboard_entries" + parameters;

            const response = await GameFuseUtilities.processRequest(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
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
                        storeItem.created_at
                    ));
                }
            }

            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, "Leaderboard recieved", callback, true);
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false);
        }
    }


    static sendPasswordResetEmail(email, callback = undefined) {
        this.Instance.sendPasswordResetEmailPrivate(email, callback);
    }

    async sendPasswordResetEmailPrivate(email, callback = undefined) {
        await this.sendPasswordResetEmailRoutine(email, callback);
    }

    async sendPasswordResetEmailRoutine(email, callback = undefined) {
        this.Log(`GameFuse Send Password Reset: ${email}`);
        if (GameFuse.getGameId() == null) {
            throw new Error("Please set up your game with GameFuse.SetUpGame before signing in users");
        }
        const parameters = "?game_token=" + GameFuse.getGameToken() + "&game_id=" + GameFuse.getGameId().toString() + "&email=" + email;
        const url = GameFuse.getBaseURL() + "/games/" + GameFuse.getGameId() + "/forget_password" + parameters;

        const response = await GameFuseUtilities.processRequest(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
            }
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response)
        if (responseOk) {
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, undefined, callback);
        } else {
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : "undefined", "an error occured", callback, false);
        }
    }
}