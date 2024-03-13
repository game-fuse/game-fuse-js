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

    // method to get a user's full profile data
    // NOTE: this is the start of this method, its implementation is not yet done. We will add this on an upcoming PR.
    // This will be an instance method inside of GameFuseUser, with usage such as userObject.downloadFullUserData();
    // async downloadFullUserData() {
    //     // provide all data that we get for friends for a user (hit the show endpoint)
    //
    //     try {
    //         GameFuse.Log("GameFuseUser get user profile");
    //
    //         const url = GameFuse.getBaseURL() + "/users/" + gameUserId + parameters;
    //
    //         const response = await GameFuseUtilities.processRequest(url, {
    //             method: 'GET',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
    //             }
    //         });
    //
    //         const responseOk = await GameFuseUtilities.requestIsOk(response)
    //         if (responseOk) {
    //             GameFuse.Log("GameFuseUser Get Attributes Success");
    //             this.attributes = GameFuseJsonHelper.formatUserAttributes(response.data.game_user_attributes);
    //         } else {
    //             GameFuseUtilities.HandleCallback(
    //                 response,
    //                 chainedFromLogin ? "Users have been signed in successfully" : "User attributes have been downloaded",
    //                 callback,
    //                 true
    //             );
    //         }
    //     } catch (error) {
    //         console.log(error)
    //         GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
    //     }
    //     // this.user = userObject
    //
    //     // return this.user
    // }
}

