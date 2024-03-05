class GameFuseGroupInvite {

    constructor(id, group, user, inviter){
        this.id = id;
        this.group = group;
        this.user = user;
        this.inviter = inviter;
    }
    getID() {
        return this.id;
    }

    // TODO: if we are inside of the user, this data will be omitted, so figure out how to get it from here.
    // TODO: go through the places where this object is constructed and verify if the above statement is true or not.
    getUser() {
        return this.user;
    }

    // TODO: if we are inside of the group, this data will be omitted, so figure out how to get it from here.
    // TODO: go through the places where this object is constructed and verify if the above statement is true or not.
    getGroup() {
        return this.group;
    }

    getInviter() {
        return this.inviter;
    }

    async update(status, callback = undefined) {
        if(!this.inviteIsForCurrentUser()){
            throw('Only the user who was invited can accept or reject this group invite')
        }
        if(!['accepted', 'declined'].includes(status)){
            throw("Status must be either 'accepted' or 'declined'")
        }

        try {
            GameFuse.Log(`updating group invite to ${status}`);
            let currentUser = GameFuseUser.CurrentUser;
            const url = `${GameFuse.getBaseURL()}/group_connections/${this.getID()}`
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                },
                body: JSON.stringify({
                    group_connection: {
                        status: status,
                        action_type: 'update'
                    },
                    connection_type: 'invite'
                })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log("GameFuseGroup update group invite successful");

                // regardless of whether status is 'accepted' or 'rejected', remove invite from the user and the group.
                let group = this.getGroup();
                currentUser.groupInvites = currentUser.groupInvites.filter(invite => invite.getID() !== this.getID());
                group.invites = group.invites.filter(invite => invite.getID() !== this.getID());
                if(status === 'accepted'){
                    currentUser.groups.unshift(group); // add this group to the current user's group array
                    group.members.unshift(currentUser); // add this current user to the group's members array
                    group.memberCount += 1; // bump the member count by 1
                }
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Successfully updated group join request status to ${status} for the user with username ${this.getUser().getUsername()}` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    accept(callback = undefined) {
        return this.update('accepted', callback)
    }

    decline(callback = undefined) {
        return this.update('declined', callback)
    }

    async cancel(callback = undefined) {
        let currentUser = GameFuseUser.CurrentUser;
        if (this.getInviter().getID() !== currentUser.getID()) {
            throw ('Only the user who invited this person can cancel the invite!')
        }

        try {
            GameFuse.Log(`canceling group invite`);

            const url = `${GameFuse.getBaseURL()}/group_connections/cancel/${this.getID()}`
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                },
                body: JSON.stringify({
                    connection_type: 'invite'
                })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroupInvite cancelled successfully');

                // remove the invite from the group's array
                let group = this.getGroup(); // TODO: will this group object always be the same one that is in the other arrays??
                group.invites = group.invites.filter(invite => invite.getID() !== this.getID());
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Successfully updated group join request status to ${status} for the user with username ${this.getUser().getUsername()}` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    inviteIsForCurrentUser() {
        let inviteUserID = this.getUser().getID()
        let currentUserID = GameFuseUser.CurrentUser.getID();

        return inviteUserID === currentUserID;
    }
}