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

        let attributes = userData.game_user_attributes && this.formatUserAttributes(userData.game_user_attributes);
        const purchasedStoreItems = userData.game_user_store_items && userData.game_user_attributes.map(item => this.convertJsonToStoreItem(item));
        const leaderboardEntries = userData.leaderboard_entries && userData.leaderboard_entries.map(entryData => this.convertJsonToLeaderboardEntry(entryData));

        let userObj = new GameFuseUser(
            false,
            undefined,
            undefined,
            undefined,
            userData.username,
            userData.score,
            userData.credits,
            userData.id,
            attributes,
            purchasedStoreItems,
            leaderboardEntries,
            userData.friendship_id,
            userData.id !== GameFuseUser.CurrentUser.getID() // will be 'true' (otherUser) if they are not equal.
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
            this.convertJsonToUser(friendReqData)
        )
    }

    static convertJsonToChat(chatData) {
        return new GameFuseChat(
            chatData.id,
            chatData.participants.map(userData => {
                return GameFuseJsonHelper.convertJsonToUser(userData);
            }),
            chatData.messages.map(messageData => {
                return this.convertJsonToMessage(messageData);
            }),
        );
    }

    static convertJsonToMessage(messageData) {
        return new GameFuseMessage(
            messageData.text,
            messageData.created_at,
            GameFuseUser.UserCache[messageData.user_id] // the participants' user object will already be in the cache since participants get built/added before the messages.
        )
    }

    static convertJsonToGroup(groupData) {
        // TODO: don't override the members array if only the top-level attributes have changed. ex. update, show.
        return new GameFuseGroup(
            groupData.id,
            groupData.name,
            groupData.can_auto_join,
            groupData.is_invite_only,
            groupData.max_group_size,
            groupData.member_count,
            groupData.members == null ? [] : groupData.members.map(memberData => {
                return this.convertJsonToUser(memberData);
            }),
            groupData.admins == null ? [] : groupData.admins.map(adminData => {
                return this.convertJsonToUser(adminData);
            }),
            groupData.joinRequests == null ? [] : groupData.joinRequests.map(joinRequestData => {
                return this.convertJsonToGroupJoinRequest(joinRequestData, null, null);
            }),
            groupData.invites == null ? [] : groupData.invites.map(inviteData => {
                return this.convertJsonToGroupInvite(inviteData, null, null)
            })
        )
    }

    static convertJsonToGroupInvite(groupInviteData, groupObj, userInvitedObj, inviterObj) {
        // TODO: DOES THE BELOW COMMENTARY STILL APPLY?
        // if this is inside of a user, the user data will be omitted.
        // if it is inside of a group, the group data will be omitted.

        if(groupObj){
            // this means the objects are passed in manually, since we already have them.
            return new GameFuseGroupInvite(
                groupInviteData.id,
                groupObj,
                userInvitedObj,
                inviterObj
            )
        } else {
            // this means the data is passed in from the API. As of now, from the sign-in method.
            return new GameFuseGroupInvite(
                groupInviteData.id,
                this.convertJsonToGroup(groupInviteData.group),
                this.convertJsonToUser(groupInviteData.user, false),
                this.convertJsonToUser(groupInviteData.inviter, false)
            )
        }
    }

    static convertJsonToGroupJoinRequest(groupJoinRequestData, groupObj, userObj) {
        // TODO: DOES THE BELOW COMMENTARY STILL APPLY?
        // if this is inside of a user, the user data will be omitted.
        // if it is inside of a group, the group data will be omitted.
        if(groupObj){
            // this means the objects are passed in manually, since we already have them.
            return new GameFuseGroupJoinRequest(
                groupJoinRequestData.id,
                groupObj,
                userObj
            )
        } else {
            // this means the data is passed in from the API. As of now, from the sign-in method.
            return new GameFuseGroupInvite(
                groupJoinRequestData.id,
                this.convertJsonToGroup(groupJoinRequestData.group),
                this.convertJsonToUser(groupJoinRequestData.user, false)
            )
        }
    }

    static setRelationalDataInternal(apiData){
        let friendsData = apiData.friends;
        let incomingFriendReqData = apiData.incoming_friend_requests;
        let outgoingFriendReqData = apiData.outgoing_friend_requests
        let chatsData = apiData.chats;
        let groupsData = apiData.groups;
        let groupInvitesData = apiData.group_invites;
        let groupJoinRequestsData = apiData.group_join_requests;

        if(friendsData != null) {
            GameFuseUser.CurrentUser.friends = friendsData.map(friendData => {
                return GameFuseJsonHelper.convertJsonToUser(friendData);
            });
        }

        if(incomingFriendReqData != null) {
            GameFuseUser.CurrentUser.incomingFriendRequests = incomingFriendReqData.map(friendReqData => {
                return GameFuseJsonHelper.convertJsonToFriendRequest(friendReqData);
            })
        }

        if(outgoingFriendReqData != null) {
            GameFuseUser.CurrentUser.outgoingFriendRequests = outgoingFriendReqData.map(friendReqData => {
                return GameFuseJsonHelper.convertJsonToFriendRequest(friendReqData);
            })
        }

        if(chatsData != null){
            GameFuseUser.CurrentUser.chats = chatsData.map(chatData => {
                return GameFuseJsonHelper.convertJsonToChat(chatData);
            });
        }

        if(groupsData != null){
            GameFuseUser.CurrentUser.groups = groupsData.map(groupData => {
                return GameFuseJsonHelper.convertJsonToGroup(groupData);
            })
        }

        if(groupInvitesData != null){
            GameFuseUser.CurrentUser.groupInvites = groupInvitesData.map(groupInviteData => {
                return GameFuseJsonHelper.convertJsonToGroupInvite(groupInviteData);
            })
        }

        if(groupJoinRequestsData != null){
            GameFuseUser.CurrentUser.groupJoinRequests = groupJoinRequestsData.map(groupJoinRequestData => {
                return GameFuseJsonHelper.convertJsonToGroupJoinRequest(groupJoinRequestData);
            })
        }
    }
}