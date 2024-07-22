class GameFuseJsonHelper {
    static formatUserAttributes(attributesArray){
        const attributes = {};
        for (const attribute of attributesArray) {
            attributes[attribute.key] = attribute.value;
        }
        return attributes
    }

    static convertJsonToUser(userData, overrideCache = false) {
        // if we don't want to override the cache, and this user object is already in the cache, then just return the cache object.
        if(!overrideCache && GameFuseUser.UserCache[userData.id]){
            return GameFuseUser.UserCache[userData.id]
        }

        let userObj = new GameFuseUser(
            false,
            undefined,
            undefined,
            undefined,
            userData.username,
            userData.score,
            userData.credits,
            userData.id,
            userData.id !== GameFuseUser.CurrentUser?.getID() // will be 'true' if they are not equal (that is, isOtherUser => true)
        );

        GameFuseUser.UserCache[userData.id] = userObj;

        return userObj;
    }

    static convertJsonToLeaderboardEntry(leaderboardEntryData){
        return new GameFuseLeaderboardEntry(
            username,
            entry.score,
            entry.leaderboard_name,
            entry.extra_attributes,
            userID,
            entry.created_at
        )
    }

    static convertJsonToStoreItem(storeItemData){
        return new GameFuseStoreItem(
            item.name,
            item.category,
            item.description,
            parseInt(item.cost),
            parseInt(item.id),
            item.icon_url
        )
    }

    static convertJsonToFriendRequest(friendReqData){
        return new GameFuseFriendRequest(
            friendReqData.friendship_id,
            friendReqData.requested_at,
            this.convertJsonToUser(friendReqData, false)
        )
    }

    static convertJsonToChat(chatData) {
        return new GameFuseChat(
            chatData.id,
            chatData.participants.map(userData => {
                // this adds the user to the UserCache, guaranteeing that convertJsonToMessage has access to a user object from the cache (see: convertJsonToMessage).
                return GameFuseJsonHelper.convertJsonToUser(userData, false);
            }),
            chatData.messages.map(messageData => {
                return this.convertJsonToMessage(messageData);
            }),
        );
    }

    static convertJsonToMessage(messageData) {
        return new GameFuseMessage(
            messageData.id,
            messageData.text,
            messageData.created_at,
            // the user object will already be in the UserCache, given that it's either the current user, or it's a chat participant, which is built before message (See convertJsonToChat),
            GameFuseUser.UserCache[messageData.user_id],
            messageData.read,
            messageData.read_by,
        )
    }

    static convertJsonToGroup(groupData) {
        if(GameFuseUser.GroupCache[groupData.id]){
            return GameFuseUser.GroupCache[groupData.id]
        }

        let gameFuseGroup = new GameFuseGroup(
            groupData.id,
            groupData.name,
            groupData.group_type,
            groupData.can_auto_join,
            groupData.is_invite_only,
            groupData.max_group_size,
            groupData.member_count,
            groupData.members == null ? [] : groupData.members.map(memberData => {
                return this.convertJsonToUser(memberData, false);
            }),
            groupData.admins == null ? [] : groupData.admins.map(adminData => {
                return this.convertJsonToUser(adminData, false);
            })
        );

        // do this here after instantiating the object so that we can pass in the group object
        gameFuseGroup.joinRequests = groupData.join_requests == null ? [] : groupData.join_requests.map(joinRequestData => {
            return this.convertJsonToGroupJoinRequest(joinRequestData, gameFuseGroup, null);
        })

        groupData.invites = groupData.invites == null ? [] : groupData.invites.map(inviteData => {
            return this.convertJsonToGroupInvite(inviteData, gameFuseGroup, null)
        });

        GameFuseUser.GroupCache[groupData.id] = gameFuseGroup;

        return gameFuseGroup;
    }

    static convertJsonToGroupInvite(groupInviteData, groupObj, userInvitedObj, inviterObj) {
        // sometimes the objects are passed in manually, since we already have them. sometimes data is from the api, like sign-in method and group.downloadFullData.
        return new GameFuseGroupInvite(
            groupInviteData.id,
            groupObj == null ? this.convertJsonToGroup(groupInviteData.group) : groupObj,
            userInvitedObj == null ? this.convertJsonToUser(groupInviteData.user, false) : userInvitedObj,
            inviterObj == null ? this.convertJsonToUser(groupInviteData.inviter, false) : inviterObj
        )
    }

    static convertJsonToGroupJoinRequest(groupJoinRequestData, groupObj, userObj) {
        // sometimes the objects are passed in manually, since we already have them.
        // Ex. group.requestToJoin, we already have the current user and the group, so we pass it in.
        // sometimes the data is passed in from the API. ex. the sign-in response, or downloadFullData.
        return new GameFuseGroupJoinRequest(
            groupJoinRequestData.id,
            groupObj == null ? this.convertJsonToGroup(groupJoinRequestData.group) : groupObj,
            userObj == null ? this.convertJsonToUser(groupJoinRequestData.user, false) : userObj
        )
    }

    static convertJsonToGameRound(gameRoundData, userObj = null) {
        return new GameFuseGameRound(
            gameRoundData.id,
            gameRoundData.game_id,
            gameRoundData.game_type,
            gameRoundData.start_time && new Date(gameRoundData.start_time),
            gameRoundData.end_time && new Date(gameRoundData),
            gameRoundData.score,
            gameRoundData.place,
            gameRoundData.metadata,
            gameRoundData.multiplayer_game_round_id,
            gameRoundData.multiplayer_game_round_id && GameFuseGameRound.buildRankings(gameRoundData.rankings)
        );
    }

    // on sign-in and on downloadFullUserData, takes the response and sets all attributes on the user object.
    static setFullUserData(apiData, userObj){
        let friendsData = apiData.friends;
        let incomingFriendReqData = apiData.incoming_friend_requests;
        let outgoingFriendReqData = apiData.outgoing_friend_requests
        let directChats = apiData.direct_chats;
        let groupChats = apiData.group_chats;
        let groupsData = apiData.groups;
        let groupInvitesData = apiData.group_invites;
        let groupJoinRequestsData = apiData.group_join_requests;
        let gameRoundsData = apiData.game_rounds;

        if(friendsData != null) {
            userObj.friends = friendsData.map(friendData => {
                return GameFuseJsonHelper.convertJsonToUser(friendData);
            });
        }

        if(incomingFriendReqData != null) {
            userObj.incomingFriendRequests = incomingFriendReqData.map(friendReqData => {
                return GameFuseJsonHelper.convertJsonToFriendRequest(friendReqData);
            })
        }

        if(outgoingFriendReqData != null) {
            userObj.outgoingFriendRequests = outgoingFriendReqData.map(friendReqData => {
                return GameFuseJsonHelper.convertJsonToFriendRequest(friendReqData);
            })
        }

        if(directChats != null) {
            userObj.directChats = directChats.map(chatData => {
                return GameFuseJsonHelper.convertJsonToChat(chatData);
            });
        }

        if(groupChats != null) {
            userObj.groupChats = groupChats.map(chatData => {
                return GameFuseJsonHelper.convertJsonToChat(chatData);
            });
        }

        if(groupsData != null) {
            userObj.groups = groupsData.map(groupData => {
                return GameFuseJsonHelper.convertJsonToGroup(groupData);
            })
        }

        if(groupInvitesData != null) {
            userObj.groupInvites = groupInvitesData.map(groupInviteData => {
                return GameFuseJsonHelper.convertJsonToGroupInvite(groupInviteData);
            })
        }

        if(groupJoinRequestsData != null) {
            userObj.groupJoinRequests = groupJoinRequestsData.map(groupJoinRequestData => {
                return GameFuseJsonHelper.convertJsonToGroupJoinRequest(groupJoinRequestData);
            })
        }

        if(gameRoundsData != null) {
            userObj.gameRounds = gameRoundsData.map(gameRoundData => {
                return GameFuseJsonHelper.convertJsonToGameRound(gameRoundData);
            })
        }
    }
}