class GameFuseGameRound {

    constructor(id, gameID, gameType, startTime, endTime, score, place, metadata, multiplayerGameRoundID, rankings = null) {
        this.id = id;
        this.gameID = gameID;
        this.gameType = gameType;
        this.startTime = startTime;
        this.endTime = endTime;
        this.score = score;
        this.place = place;
        this.metadata = metadata;
        this.multiplayerGameRoundID = multiplayerGameRoundID;
        this.rankings = rankings;
    }

    getID() {
        return this.id;
    }

    getGameID() {
        return this.gameID;
    }

    getGameType() {
        return this.gameType;
    }

    getStartTime() {
        return this.startTime;
    }

    getEndTime() {
        return this.endTime;
    }

    getDuration() {
        if(this.getEndTime() == null || this.getStartTime() == null){
            return undefined;
        } else {
            return (this.getEndTime().getTime() - this.getStartTime().getTime()) / 1000
        }
    }

    getScore() {
        return this.score;
    }

    getPlace() {
        return this.place;
    }

    getMetadata() {
        return this.metadata;
    }

    getMultiplayerGameRoundID() {
        return this.multiplayerGameRoundID;
    }

    isMultiplayer() {
        // if there is an ID, this should return true.
        // if it is null, this should return false.
        return this.multiplayerGameRoundID != null
    }

    getRankings() {
        return this.rankings;
    }

    getNumberOfPlayers() {
        if(this.isMultiplayer()){
            return this.getRankings().length; // multiplayer games have 1 entry for each player in the `rankings` array.
        } else {
            return 1; // single player games have only 1 player
        }
    }

    static async create(createOptions, callback = null, otherUserObj = null, originalRound = null) { // otherUserObj is 3rd parameter because it will not be used by game developers
        try {
            GameFuse.Log('Creating a game round')

            let allowedKeys = ['gameType', 'gameUserID', 'metadata', 'startTime', 'endTime', 'multiplayer', 'multiplayerGameRoundID', 'place', 'score'];
            let requiredKeys = ['gameType', 'gameUserID']
            let actualKeys = Object.keys(createOptions);

            let notAllowedKeys = actualKeys.filter(key => !allowedKeys.includes(key));
            let missingKeys = requiredKeys.filter(requiredKey => !actualKeys.includes(requiredKey));

            if(notAllowedKeys.length > 0) {
                throw(`the following keys are not allowed in the options hash for creating a game round: ${notAllowedKeys.join(', ')}`)
            } else if (missingKeys.length > 0) {
                throw(`The options hash is missing the following required keys: ${missingKeys.join(', ')}`);
            }

            let isForMultiplayer = !!(createOptions.multiplayer || createOptions.multiplayerGameRoundID);

            // we can use all the keys in the createOptions hash at this point, since we verified that there were no disallowed keys above.
            // however, we will skip over 'multiplayer', since it is handled above and is not an explicit attribute of the game round that belongs in createDataHash.

            let createDataHash = {};
            for (let camelCaseKey in createOptions) {
                if(camelCaseKey === 'multiplayer') { continue }
                let snakeCaseKey = this.gameRoundOptionsKeyMapping()[camelCaseKey];
                createDataHash[snakeCaseKey] = createOptions[camelCaseKey];
            }

            let data = { game_round: createDataHash, multiplayer: isForMultiplayer }
            const url = `${GameFuse.getBaseURL()}/game_rounds`;

            let currentUser = GameFuseUser.CurrentUser;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                },
                body: JSON.stringify(data)
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);

            if (responseOk) {
                GameFuse.Log("GameFuseGameRound create Success");
                // add this to the user's game rounds array
                let userToModify = otherUserObj || currentUser;
                let createdGameRound = GameFuseJsonHelper.convertJsonToGameRound(response.data);

                userToModify.gameRounds.unshift(createdGameRound);

                if(createOptions.multiplayerGameRoundID){
                    // this means that we are adding a player to an originalRound object, so we must update the rankings attribute on the original object.
                    originalRound.rankings = createdGameRound.rankings;
                }
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? 'Game round created!' : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    addPlayer(userObj, extraMetadata = null, callback = null) {
        if(!this.isMultiplayer()){
            throw('Cannot add another player to a single player round!');
        }

        let createOptions = {
            multiplayer: true,
            multiplayerGameRoundID: this.getMultiplayerGameRoundID(),
            gameUserID: userObj.getID(),
            metadata: extraMetadata,
            gameType: this.getGameType()
        }

        return this.constructor.create(createOptions, callback, userObj, this);
    }

    async update(updateOptions, callback = undefined) {
        try {
            GameFuse.Log('Creating a game round')

            // a more limited set of keys than the create endpoint
            let allowedKeys = ['metadata', 'startTime', 'endTime', 'place', 'score'];
            let actualKeys = Object.keys(updateOptions);

            let notAllowedKeys = actualKeys.filter(key => !allowedKeys.includes(key));

            if (notAllowedKeys.length > 0) {
                throw (`the following keys are not allowed in the options hash for creating a game round: ${notAllowedKeys.join(', ')}`)
            }

            // we can use all the keys in the updateOptions hash at this point, since we verified that there were no disallowed keys above.
            let updateDataHash = {};
            for (let camelCaseKey in updateOptions) {
                let snakeCaseKey = this.constructor.gameRoundOptionsKeyMapping()[camelCaseKey];
                updateDataHash[snakeCaseKey] = updateOptions[camelCaseKey];
            }

            let data = {game_round: updateDataHash}

            const url = `${GameFuse.getBaseURL()}/game_rounds/${this.getID()}`;

            const response = await GameFuseUtilities.processRequest(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                body: JSON.stringify(data)
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);

            if (responseOk) {
                GameFuse.Log("GameFuseGameRound update Success");

                // update the game round object with the response data returned from the API
                let updatedAttributes = response.data;
                Object.assign(this, {
                    id: updatedAttributes.id,
                    gameID: updatedAttributes.game_id,
                    gameType: updatedAttributes.game_type,
                    startTime: updatedAttributes.start_time && new Date(updatedAttributes.start_time),
                    endTime: updatedAttributes.end_time && new Date(updatedAttributes.end_time),
                    score: updatedAttributes.score,
                    place: updatedAttributes.place,
                    metadata: updatedAttributes.metadata,
                    multiplayerGameRoundID: updatedAttributes.multiplayer_game_round_id,
                    rankings: updatedAttributes.multiplayer_game_round_id == null ? [] : this.constructor.buildRankings(updatedAttributes.rankings)
                })
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? 'game round has been created successfully' : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }


    async destroy(callback = undefined) {
        try {
            GameFuse.Log('Destroying game round');

            const url = `${GameFuse.getBaseURL()}/game_rounds/${this.getID()}`;
            let currentUser = GameFuseUser.CurrentUser;

            const response = await GameFuseUtilities.processRequest(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                }
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGameRound destroy game round success');

                // remove the object from the state.
                currentUser.gameRounds = currentUser.gameRounds.filter(gameRound => gameRound.getID() !== this.getID());
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? 'Game Round destroyed successfully' : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    static gameRoundOptionsKeyMapping() {
        return {
            gameId: 'game_id',
            gameUserID: 'game_user_id',
            multiplayerGameRoundID: 'multiplayer_game_round_id',
            gameType: 'game_type',
            place: 'place',
            score: 'score',
            startTime: 'start_time',
            endTime: 'end_time',
            metadata: 'metadata'
        }
    }

    static buildRankings(apiData) {
        return apiData.map(rankingData => {
            return {
                score: rankingData.score,
                place: rankingData.place,
                startTime: rankingData.start_time && new Date(rankingData.start_time),
                endTime: rankingData.end_time && new Date(rankingData.end_time),
                user: GameFuseJsonHelper.convertJsonToUser(rankingData.user)
            }
        })
    }
}