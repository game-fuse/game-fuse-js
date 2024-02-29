class GameFuseGroupJoinRequest {

    constructor(id, user, group) {
        this.id = id;
        this.user = user;
        this.group = group;
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

    async update(status, callback = undefined) {
        if(!this.currentUserIsAdmin()){
            throw('Only group admins can accept or reject group join requests')
        }

        try {
            GameFuse.Log(`updating group join request to ${status}`);

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
                    connection_type: 'join_request'
                })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log("GameFuseGroup update group connection successful");

                // regardless of whether status is 'accepted' or 'declined', remove invite from group.
                let group = GameFuseUser.CurrentUser.getGroups().find(group => group.getID() === this.getGroup().getID());
                group.joinRequests = group.joinRequests.filter(joinRequest => joinRequest.getID() !== this.getID());
                if(status === 'accepted'){
                    // add the user to the group members state array
                    group.members.unshift(group.getUser());
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

    async cancel(status, callback = undefined) {
        let currentUserID = GameFuseUser.CurrentUser.getID();
        if(currentUserID !== this.getUser().getID()) {
            throw('Only the person who sent this join request can cancel it!')
        }

        try {
            GameFuse.Log(`canceling group join request`);

            const url = `${GameFuse.getBaseURL()}/group_connections/${this.getID()}`
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                body: JSON.stringify({
                    connection_type: 'join_request'
                })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroupJoinRequest deleted successfully');

                // remove join request from user's array
                GameFuseUser.CurrentUser.joinRequests = GameFuseUser.CurrentUser.joinRequests.filter(joinRequest => joinRequest.getID() !== this.getID());
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

    currentUserIsAdmin() {
        let adminIDs = this.getGroup().getAdmins().map(admin => admin.getID());
        let currentUserID = GameFuseUser.CurrentUser.getID();

        return adminIDs.includes(currentUserID)
    }
}