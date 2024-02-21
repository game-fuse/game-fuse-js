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
                console.error(`Request (${response.url}) had error: ` + response.data);
                if (callback !== null)
                    callback("An unknown error occurred: " + response.data, true);
            } else if (response.status === 299) {
                var errorString = response.data
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
        return response.status.toString()[0] ===  "2"
    }

    static async processRequest(url, options) {
      const response = await fetch(url, options);
      let data;
      if (GameFuseUtilities.RequestIsSuccessful(response)){
        data = await response.json();
      } else {
        data = await response.text();
      }
      response.data = data;
      return response;
    }

    static async requestIsOk(response){
        if (response.status.toString()[0] !==  "2") {
            return false
        }
        return response.ok
    }

    static formatUserAttributes(attributesArray){
        const attributes = {};
        for (const attribute of attributesArray) {
            attributes[attribute.key] = attribute.value;
        }
        return attributes
    }

    static convertJsonTo(modelName, data){
        return this[`convertJsonTo${modelName}`](data)
    }

    static convertJsonToGameFuseUser(userData) {
        let attributes = this.formatUserAttributes(userData.game_user_attributes)

        const purchasedStoreItems = userData.game_user_store_items.map(item =>
            new GameFuseStoreItem(
                item.name,
                item.category,
                item.description,
                parseInt(item.cost),
                parseInt(item.id),
                item.icon_url
            )
        );

        let username = userData.username;
        let userId = userData.id;

        const leaderboardEntries = userData.leaderboard_entries.map(entry => {
            new GameFuseLeaderboardEntry(
                username,
                entry.score,
                entry.leaderboard_name,
                entry.extra_attributes,
                userId,
                entry.created_at
            )
        })

        let userObj = new GameFuseUser(
            false,
            undefined,
            undefined,
            undefined,
            username,
            userData.score,
            userData.credits,
            userId,
            attributes,
            purchasedStoreItems,
            leaderboardEntries,
            userData.friendship_id,
            true
        );

        GameFuseUser.UserCache[userData.id] = userObj;

        return userObj;
    }

    static convertJsonToGameFuseFriendRequest(friendReqData){
        return new GameFuseFriendRequest(
            friendReqData.friendship_id,
            friendReqData.requested_at,
            this.convertJsonTo('GameFuseUser', friendReqData)
        )
    }

    static convertJsonToGameFuseChat(chatData) {
        return new GameFuseChat(
            chatData.id,
            chatData.participants.map(userData => {
                return GameFuseUtilities.convertJsonTo('GameFuseUser', userData);
            }),
            chatData.messages.map(messageData => {
                return this.convertJsonTo('GameFuseMessage', messageData);
            }),
        );
    }

    static convertJsonToGameFuseMessage(messageData) {
        return new GameFuseMessage(
            messageData.text,
            messageData.created_at,
            GameFuseUser.UserCache[messageData.user_id] // the participants' user object will already be in the cache since participants get built/added before the messages.
        );
    }
}