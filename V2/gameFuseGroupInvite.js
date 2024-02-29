class GameFuseGroupInvite {

    constructor(id, user, group, inviter){
        this.id = id;
        this.user = user;
        this.group = group;
        this.inviter = inviter;
    }
    getID() {
        return this.id;
    }

    // TODO: if we are inside of the user, this data will be omitted, so figure out how to get it from here.
    getUser() {
        return this.user;
    }

    // TODO: if we are inside of the group, this data will be omitted, so figure out how to get it from here.
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

        }

        try {
            GameFuse.Log(`updating group invite to ${status}`);

            const url = `${GameFuse.getBaseURL()}/group_connections/${this.getID()}`
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                data: JSON.stringify({
                    group_connection: {
                        status: status
                    },
                    connection_type: 'invite'
                })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log("GameFuseGroup update group invite successful");

                // regardless of whether status is 'accepted' or 'rejected', remove invite from the user.
                GameFuseUser.CurrentUser.groupInvites = GameFuseUser.CurrentUser.groupInvites.filter(invite => invite.getID() !== this.getID());
                if(status === 'accepted'){
                    // if they accepted the invite, add this group to their groups array in state.
                    GameFuseUser.CurrentUser.groups.unshift(this.getGroup());
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
        let currentUserID = GameFuseUser.CurrentUser.getID();
        if (this.getInviter().getID() !== currentUserID) {
            throw ('Only the user who invited this person can cancel the invite!')
        }

        try {
            GameFuse.Log(`canceling group invite`);

            const url = `${GameFuse.getBaseURL()}/group_connections/${this.getID()}`
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                body: JSON.stringify({
                    connection_type: 'invite'
                })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroupInvite deleted successfully');

                // remove the invite from the group's array
                let group = GameFuseUser.CurrentUser.getGroups().find(group => group.getID() === this.getGroup().getID());
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