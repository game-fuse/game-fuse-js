class GameFuseJsonHelper {
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
            userId !== GameFuseUser.CurrentUser.getID() // will be 'true' (otherUser) if they are not equal.
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
                return GameFuseJsonHelper.convertJsonTo('GameFuseUser', userData);
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

    static convertJsonToGameFuseGroup(groupData) {
        return new GameFuseGroup(
            groupData.id,
            groupData.name,
            groupData.can_auto_join,
            groupData.is_invite_only,
            groupData.max_group_size
        )
    }

    static convertJsonToGameFuseGroupInvite(groupInviteData) {
        // if this is inside of a user, the user data will be omitted.
        // if it is inside of a group, the group data will be omitted.
        return new GameFuseGroupInvite(
            groupInviteData.id,
            groupInviteData.user ? this.convertJsonToGameFuseUser(groupInviteData.user) : null,
            groupInviteData.group ? this.convertJsonToGameFuseGroup(groupInviteData.group) : null,
            this.convertJsonToGameFuseUser(groupInviteData.inviter)
        )
    }

    static convertJsonToGameFuseGroupJoinRequest(groupJoinRequestData) {
        // if this is inside of a user, the user data will be omitted.
        // if it is inside of a group, the group data will be omitted.
        return new GameFuseGroupJoinRequest(
            groupJoinRequestData.id,
            groupJoinRequestData.user ? this.convertJsonToGameFuseUser(groupJoinRequestData.user) : null,
            groupJoinRequestData.group ? this.convertJsonToGameFuseGroup(groupJoinRequestData.group) : null
        )
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
                return GameFuseJsonHelper.convertJsonTo('GameFuseUser', friendData)
            });
        }

        if(incomingFriendReqData != null) {
            GameFuseUser.CurrentUser.incomingFriendRequests = incomingFriendReqData.map(friendReqData => {
                return GameFuseJsonHelper.convertJsonTo('GameFuseFriendRequest', friendReqData);
            })
        }

        if(outgoingFriendReqData != null) {
            GameFuseUser.CurrentUser.outgoingFriendRequests = outgoingFriendReqData.map(friendReqData => {
                return GameFuseJsonHelper.convertJsonTo('GameFuseFriendRequest', friendReqData);
            })
        }

        if(chatsData != null){
            GameFuseUser.CurrentUser.chats = chatsData.map(chatData => {
                return GameFuseJsonHelper.convertJsonTo('GameFuseChat', chatData)
            });
        }

        if(groupsData != null){
            GameFuseUser.CurrentUser.groups = groupsData.map(groupData => {
                return GameFuseJsonHelper.convertJsonTo('GameFuseGroup')
            })
        }

        if(groupInvitesData != null){
            GameFuseUser.CurrentUser.groupInvites = groupInvitesData.map(groupData => {
                return GameFuseJsonHelper.convertJsonTo('GameFuseGroupInvite')
            })
        }

        if(groupJoinRequestsData != null){
            GameFuseUser.CurrentUser.groupJoinRequests = groupJoinRequestsData.map(groupData => {
                return GameFuseJsonHelper.convertJsonTo('GameFuseGroupJoinRequest')
            })
        }
    }
}