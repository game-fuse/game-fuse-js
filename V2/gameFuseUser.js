﻿// V2
class GameFuseUser {
    constructor(signedIn = false, numberOfLogins = 0, lastLogin = undefined, authenticationToken = "",
        username = "", score = 0, credits = 0, id = 0, attributes = {}, purchasedStoreItems = [],
        leaderboardEntries = [], friendshipId = undefined, isOtherUser = false) {
        this.signedIn = signedIn;
        this.numberOfLogins = numberOfLogins;
        this.lastLogin = lastLogin;
        this.authenticationToken = authenticationToken;
        this.username = username;
        this.score = score;
        this.credits = credits;
        this.id = id;
        this.attributes = attributes;
        this.dirtyAttributes = {};
        this.purchasedStoreItems = purchasedStoreItems;
        this.leaderboardEntries = leaderboardEntries;
        this.friends = [];
        this.outgoingFriendRequests = []; // only the ones that you've sent
        this.incomingFriendRequests = []; // only the ones that you need to respond to
        this.isOtherUser = isOtherUser;
        this.friendshipId = friendshipId;
        this.chats = [];
    }   

    static get CurrentUser() {
        if (!this._instance) {
            this._instance = new GameFuseUser();
        }
        return this._instance;
    }

    static resetCurrentUser() {
        this._instance = new GameFuseUser();
    }

    static get UserCache() {
        if (!this._userCache) {
            this._userCache = {}
        }
        return this._userCache;
    }

    static resetUserCache() {
        this._userCache = {}
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

    getFriends() {
        return this.friends;
    }

    getIncomingFriendRequests() {
        return this.incomingFriendRequests;
    }

    getOutgoingFriendRequests() {
        return this.outgoingFriendRequests;
    }

    getIsOtherUser() {
        return this.isOtherUser;
    }

    getLeaderboardEntries() {
        return this.leaderboardEntries;
    }

    getFriendshipID() {
        return this.friendshipId;
    }

    getChats() {
        return this.chats;
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
            'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken() // this one not working
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
          this.attributes = GameFuseUtilities.formatUserAttributes(response.data.game_user_attributes);
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

    setRelationalDataInternal(apiData){
        if(this.getID() !== GameFuseUser.CurrentUser.getID()){
            throw('this method can only be called on the CurrentUser object')
        }

        let friendsData = apiData.friends;
        let incomingFriendReqData = apiData.incoming_friend_requests;
        let outgoingFriendReqData = apiData.outgoing_friend_requests
        let chatsData = apiData.chats;
        // TODO: let clansData = apiData.clans;

        if(friendsData !== undefined) {
            this.friends = friendsData.map(friendData => {
                return GameFuseUtilities.convertJsonTo('GameFuseUser', friendData)
            });
        }

        if(incomingFriendReqData !== undefined) {
            this.incomingFriendRequests = incomingFriendReqData.map(friendReqData => {
                return GameFuseUtilities.convertJsonTo('GameFuseFriendRequest', friendReqData);
            })
        }

        if(outgoingFriendReqData !== undefined) {
            this.outgoingFriendRequests = outgoingFriendReqData.map(friendReqData => {
                return GameFuseUtilities.convertJsonTo('GameFuseFriendRequest', friendReqData);
            })
        }

        if(chatsData !== undefined){
            this.chats = chatsData.map(chatData => {
                return GameFuseUtilities.convertJsonTo('GameFuseChat', chatData)
            });
        }
    }

    async sendFriendRequest(callback= undefined) {
        if(!this.getIsOtherUser()){
            throw('Cannot send a friend request to yourself, must send to another user!')
        }

        return GameFuseFriendRequest.send(this.getUsername(), callback);
    }

    async unfriend(callback) {
        try {
            if(!this.getIsOtherUser()){
                throw('You can only remove other users from the friends list, not yourself!')
            }

            GameFuse.Log("GameFuseFriendRequest unfriend user with username " + this.getUsername());

            const url = GameFuse.getBaseURL() + "/unfriend"
            const data = {
                authentication_token: GameFuseUser.CurrentUser.getAuthenticationToken(),
                user_id: this.getID()
            }

            const response = await GameFuseUtilities.processRequest(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                body: JSON.stringify(data)
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);

            if (responseOk) {
                GameFuse.Log("GameFuseUser Unfriending Success");

                // delete the friend from the friends array. Leave them in the UserCache in case they have a chat with them...
                GameFuseUser.CurrentUser.friends = GameFuseUser.CurrentUser.friends.filter(user => user.getID() !== this.getID())

                GameFuseUtilities.HandleCallback(
                    response,
                    `friendship with user ${this.getUsername()} has been deleted successfully`,
                    callback,
                    true
                );
            } else {
                GameFuseUtilities.HandleCallback(
                    response,
                    response.data, // message from the API
                    callback,
                    false
                );
            }
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // get chat objects from API, passing a "page number" to get chats other than the most recent 25.
    async getOlderChats(page = 2, callback = undefined) {
        try {
            if (this.getIsOtherUser()) {
                throw ('Cannot get older chats for other users')
            }
            if (typeof page !== 'number' || page < 2) {
                throw ('Page parameter must be a number that is 2 or greater!')
            }

            const url = GameFuse.getBaseURL() + `/chats/page/${page}?authentication_token=${GameFuseUser.CurrentUser.getAuthenticationToken()}`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken() // TODO: not working
                }
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);

            if (responseOk) {
                GameFuse.Log("GameFuseChat getOlderChats success");

                // loop over the new chats and add them to the chats array, at the end of the array since they are older.
                response.data.forEach(chatJson => {
                    this.chats.push(GameFuseUtilities.convertJsonTo('GameFuseChat', chatJson));
                })

                GameFuseUtilities.HandleCallback(
                    response,
                    `Page ${page} of chats received!`,
                    callback,
                    true
                );
            } else {
                GameFuseUtilities.HandleCallback(
                    response,
                    response.data, // message from the API
                    callback,
                    false
                );
            }
        } catch (error) {
            console.log(error)
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    sendMessage(firstMessage, callback = undefined) {
        if(!this.getIsOtherUser()){
            throw('Cannot send a message to yourself!');
        }

        return GameFuseChat.sendMessage(this.getUsername(), firstMessage, callback)
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

    setAttributeLocal(key, val){
      if (this.attributes.hasOwnProperty(key)) {
        delete this.attributes[key];
      }
      if (this.dirtyAttributes.hasOwnProperty(key)) {
        delete this.dirtyAttributes[key];
      }
      this.attributes[key] = val;
      this.dirtyAttributes[key] = val;
    }

    async syncLocalAttributes(callback=undefined)
    {
      this.setAttributes(this.attributes, callback, true);
    }

    getDirtyAttributes(){
      return this.dirtyAttributes;
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

    async setAttributes(newAttributes, callback = undefined, isFromSync = false) {

      try {

        if (GameFuse.getGameId() == null) {
          throw new GameFuseException(
            "Please set up your game with GameFuse.SetUpGame before modifying users"
          );
        }

        const url = GameFuse.getBaseURL() + "/users/" + GameFuseUser.CurrentUser.id + "/add_game_user_attribute";
        const data = {
          authentication_token: GameFuseUser.CurrentUser.getAuthenticationToken()
        };

        const preparedAttributes = Object.entries(this.attributes).map(([key, value]) => ({ key, value }));
        const body = JSON.stringify({"attributes": preparedAttributes, authentication_token: GameFuseUser.CurrentUser.getAuthenticationToken()});

        const response = await GameFuseUtilities.processRequest(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authentication_token': GameFuseUser.CurrentUser.getAuthenticationToken(),
          },
          body: body,
        });

        const responseOk = await GameFuseUtilities.requestIsOk(response);
        if (responseOk) {

          for (const [key, value] of Object.entries(newAttributes)) {
            this.attributes[key] = value;
          }

          for (const [attributeKey, attributeValue] of Object.entries(this.attributes)) {
            console.log(attributeKey + "," + attributeValue);
          }

          if (isFromSync){
              this.dirtyAttributes = {}
          }
        }

        GameFuseUtilities.HandleCallback(response, "Attribute has been added to user", callback, true);
      } catch (error) {
        console.log(error);
        GameFuseUtilities.HandleCallback(undefined, error.message, callback, false);
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

          this.attributes = GameFuseUtilities.formatUserAttributes(response.data.game_user_attributes);
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