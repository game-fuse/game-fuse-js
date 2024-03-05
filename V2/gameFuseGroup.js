class GameFuseGroup {
    // TODO: have a group cache somewhere.
    constructor(id, name, canAutoJoin, isInviteOnly, maxGroupSize, memberCount, members = [], admins = [], joinRequests = [], invites = []) {
        this.id = id;
        this.name = name;
        this.canAutoJoin = canAutoJoin;
        this.isInviteOnly = isInviteOnly;
        this.maxGroupSize = maxGroupSize;
        this.memberCount = memberCount;
        this.members = members; // should include everyone, including admins.
        this.admins = admins;
        this.invites = [];
        this.joinRequests = [];
    };

    getID() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getCanAutoJoin() {
        return this.canAutoJoin;
    }

    getIsInviteOnly() {
        return this.isInviteOnly;
    }

    getMaxGroupSize() {
        return this.maxGroupSize;
    }

    getMemberCount() {
        return this.memberCount;
    }

    // TODO: without a specific member object, how are we going to be able to include things like joinedAt?
    getMembers() {
        return this.members;
    }

    getAdmins() {
        return this.admins;
    }

    getJoinRequests() {
        return this.joinRequests;
    }

    getInvites() {
        return this.invites;
    }


    // JSON RESPONSE WRITTEN (todo: remove)
    static async downloadAvailableGroups(callback = undefined) {
        try {
            GameFuse.Log('Downloading available group')

            const url = `${GameFuse.getBaseURL()}/groups`

            const response = await GameFuseUtilities.processRequest(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                }
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log("GameFuseGroup download available groups success");

                // add all the groups to the available groups array
                response.data.forEach((groupData) => {
                    let groupObject = GameFuseJsonHelper.convertJsonToGroup(groupData); // TODO
                    GameFuseUser.CurrentUser.downloadedAvailableGroups.push(groupObject);
                });
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Successfully downloaded data for ${response.data.length} different groups` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // JSON RESPONSE WRITTEN (todo: remove)
    static async create(attributes, callback = undefined) {
        try {
            GameFuse.Log('Creating a group')

            let expectedKeys = ['name', 'maxGroupSize', 'canAutoJoin', 'isInviteOnly'];
            let actualKeys = Object.keys(attributes)

            let missingKeys = expectedKeys.filter(expectedKey => !actualKeys.includes(expectedKey))
            if(missingKeys.length > 0){
                throw(`The attributes hash is missing the following keys: ${missingKeys}`);
            }

            const url = `${GameFuse.getBaseURL()}/groups`
            const data = {
                name: attributes.name,
                max_group_size: attributes.maxGroupSize,
                can_auto_join: attributes.canAutoJoin,
                is_invite_only: attributes.isInviteOnly
            }
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                body: JSON.stringify(data)
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log("GameFuseGroup create Success");
                // add this group to the user's groups array
                let groupObject = GameFuseJsonHelper.convertJsonToGroup(response.data);
                GameFuseUser.CurrentUser.groups.unshift(groupObject)
                GameFuseUser.CurrentUser.downloadedAvailableGroups.unshift(groupObject);
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `group with name ${this.getName()} has been created successfully` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // JSON RESPONSE WRITTEN (todo: remove)
    async update(attributes, callback = undefined) {
        try {
            GameFuse.Log(`Updating group with name ${this.getName()}`);
            debugger;
            // TODO: in subsequent requests, the current user isn't being treated as an admin because the update action is wiping clean the users array. this is what we were thinking about earlier.
            let currentUserIsAdmin = this.getAdmins().map(user => user.getID()).includes(currentUser().getID())
            if(!currentUserIsAdmin){
                throw('You must be an admin to update a group!')
            }

            let allowedKeys = ['name', 'maxGroupSize', 'canAutoJoin', 'isInviteOnly'];
            let actualKeys = Object.keys(attributes);
            let notAllowedKeys = actualKeys.filter(key => !allowedKeys.includes(key))

            if(notAllowedKeys.length > 0){
                throw(`The following keys are not allowed in the attributes hash for updating a group: ${notAllowedKeys}`);
            } else if(actualKeys.length === 0) {
                throw('You must pass at least one updatable key. See docs.')
            }

            // we could dynamically convert these to snake case using something like str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);,
            // but it seems much clearer/more readable to simply create a map like below.
            let keyMapping = {
                name: 'name',
                maxGroupSize: 'max_group_size',
                canAutoJoin: 'can_auto_join',
                isInviteOnly: 'is_invite_only'
            }

            // we can use all the keys in the attributes hash, since we verified that there were no disallowed keys above.
            let updateDataHash = {};
            for (const [key, value] of Object.entries(attributes)) {
                let snakeCaseKey = keyMapping[key];
                updateDataHash[snakeCaseKey] = value;
            }

            let data = { group: updateDataHash }
            const url = `${GameFuse.getBaseURL()}/groups/${this.getID()}`
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
                GameFuse.Log('GameFuseGroup update Success');
                // replace the updated object in the myGroups array and in the downloadedAvailableGroups array
                // TODO: have a group cache that point back to the same group object.
                // ====> TODO: [related to the above cache] if you update a group for which you've already downloaded the members, don't wipe out the members array, just update the top-level attributes!!!!
                let groupObject = GameFuseJsonHelper.convertJsonToGroup(response.data); // TODO

                GameFuseUser.CurrentUser.groups = GameFuseUser.CurrentUser.groups.filter(group => group.getID() !== this.getID());
                GameFuseUser.CurrentUser.groups.unshift(groupObject);

                GameFuseUser.CurrentUser.downloadedAvailableGroups = GameFuseUser.CurrentUser.downloadedAvailableGroups.filter(group => group.getID() !== this.getID());
                GameFuseUser.CurrentUser.downloadedAvailableGroups.unshift(groupObject);
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `group with name ${this.getName()} has been updated successfully` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // JSON RESPONSE WRITTEN (todo: remove)
    async destroy(callback = undefined) {
        try {
            GameFuse.Log(`Destroying group with name ${this.getName()}`);
            let currentUserIsAdmin = this.getAdmins().map(user => user.getID()).includes(currentUser().getID())
            if(!currentUserIsAdmin){
                throw('You must be an admin to destroy a group!')
            }

            const url = `${GameFuse.getBaseURL()}/groups/${this.getID()}`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                }
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup destroy group success');
                // remove the object from the state.
                GameFuseUser.CurrentUser.groups = GameFuseUser.CurrentUser.groups.filter(group => group.getID() !== this.getID());
                GameFuseUser.CurrentUser.downloadedAvailableGroups = GameFuseUser.CurrentUser.downloadedAvailableGroups.filter(group => group.getID() !== this.getID());
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `group with name ${this.getName()} has been destroyed successfully` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // JSON RESPONSE WRITTEN (todo: remove)
    async downloadFullData(callback = undefined) {
        try {
            GameFuse.Log(`Getting full data for group with name ${this.getName()}`);

            const url = `${GameFuse.getBaseURL()}/groups/${this.getID()}`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup downloadFullData success');
                // replace the object in the state with the new one.
                let groupObject = GameFuseJsonHelper.convertJsonToGroup(response.data, true); // override cache = true
                GameFuseUser.CurrentUser.groups = GameFuseUser.CurrentUser.groups.filter(group => group.getID() !== this.getID());
                GameFuseUser.CurrentUser.groups.unshift(groupObject);
                GameFuseUser.CurrentUser.downloadedAvailableGroups = GameFuseUser.CurrentUser.downloadedAvailableGroups.filter(group => group.getID() !== this.getID());
                GameFuseUser.CurrentUser.downloadedAvailableGroups.unshift(groupObject);
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Full data retrieved successfully for the group with name ${this.getName()}` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // JSON RESPONSE WRITTEN (todo: remove)
    async join(callback = undefined) {
        try {
            // don't do the validations here (ex. auto-joinable, etc.), let the backend do it in case something has changed since the group data was pulled.
            GameFuse.Log(`Current user is attempting to join the group with name ${this.getName()}`);

            // TODO: figure out if this is the right URL. It should probably be through the group_connections model...?
            const url = `${GameFuse.getBaseURL()}/group_connections`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                body: JSON.stringify(
                    {
                        group_connection: {
                            group_id: this.getID(),
                            user_id: GameFuse.CurrentUser.getID(),
                            status: 'accepted',
                            action_type: 'join'
                        },
                    }
                )
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup join success');
                // add the group to myGroups
                GameFuseUser.CurrentUser.groups.unshift(this);
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Successfully joined the group with name ${this.getName()}` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // JSON RESPONSE WRITTEN (todo: remove)
    async requestToJoin(callback = undefined) {
        try {
            // don't do the validations here (ex. auto-joinable, etc.), let the backend do it in case something has changed since the group data was pulled.
            GameFuse.Log(`Current user is requesting to join the group with name ${this.getName()}`);

            // TODO: figure out if this is the right URL. It should probably be through the group_connections model...?
            const url = `${GameFuse.getBaseURL()}/group_connections`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                body: JSON.stringify({
                    group_connection: {
                        group_id: this.getID(),
                        user_id: GameFuseUser.CurrentUser.getID(),
                        status: 'pending',
                        action_type: 'join_request'
                    },
                })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup requestToJoin success');
                if(response.data.status === 'accepted'){
                    // this means that the group was auto-joinable, so the person was automatically made a member. Add this group to their groups.
                    GameFuseUser.CurrentUser.groups.unshift(this)
                } else {
                    // This is the expected behavior. Make a join request object and add it to their join requests.
                    let groupJoinRequest = GameFuseJsonHelper.convertJsonToGroupJoinRequest(response.data, this, GameFuseUser.CurrentUser);
                    GameFuseUser.CurrentUser.groupJoinRequests.unshift(groupJoinRequest);
                }
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Successfully joined the group with name ${this.getName()}` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // JSON RESPONSE WRITTEN (todo: remove)
    async invite(userOrUsername, callback = undefined) {
        try {
            let username = (userOrUsername instanceof GameFuseUser) ? userOrUsername.getUsername() : userOrUsername;

            GameFuse.Log(`The current user with username ${GameFuseUser.CurrentUser.getUsername()} is inviting user with username ${username} to the group with name ${this.getName()}`);

            // TODO: figure out if this is the right URL. Should probably be through the group connections model...?
            const url = `${GameFuse.getBaseURL()}/group_connections`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                data: JSON.stringify({
                    group_connection: {
                        group_id: this.getID(),
                        inviter_id: GameFuseUser.CurrentUser.getID(),
                        status: 'pending',
                        action_type: 'invite'
                    },
                    username: username
                })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup invite sent with success');
                let personInvitedObj = userOrUsername instanceof GameFuseUser ? userOrUsername : null;
                let inviterObj = GameFuseUser.CurrentUser;
                let groupInvite = GameFuseJsonHelper.convertJsonToGroupInvite(response.data, this, personInvitedObj, inviterObj);

                // add the invite to the group in state
                let group = GameFuseUser.CurrentUser.getGroups().find(group => group.getID() === this.getID());
                group.invites.unshift(groupInvite);
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Successfully invited user ${username} to the group ${this.getName()}` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // JSON RESPONSE WRITTEN (todo: remove)
    async leave(callback = undefined) {
        try {
            GameFuse.Log(`The current user with username ${GameFuseUser.CurrentUser.getUsername()} is leaving group ${this.getName()}`);

            const url = `${GameFuse.getBaseURL()}/leave_group`
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                body: JSON.stringify({
                    group_id: this.getID()
                })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup leave success');
                // remove the group from myGroups
                GameFuseUser.CurrentUser.groups = GameFuseUser.CurrentUser.groups.filter(group => group.getID() !== this.getID());
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Successfully left the group with name ${this.getName()}` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // JSON RESPONSE WRITTEN (todo: remove)
    async removeMember(userToRemove, callback = undefined) {
        try {
            GameFuse.Log(`Removing user with username ${userToRemove?.getUsername()} from group with name ${this.getName()}`);

            // TODO: figure out if this is the right URL. Should probably be through the group connections model...?
            const url = `${GameFuse.getBaseURL()}/remove_member`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                data: JSON.stringify({
                    group_id: this.getID(),
                    user_id: userToRemove?.getID()
                })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup removeMember success');
                // remove the group from myGroups
                let groupToModify = GameFuseUser.CurrentUser.getGroups().find(group => group.getID() === this.getID());
                groupToModify.members = groupToModify.members.filter(member => member.getID() !== userToRemove.getID())
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Successfully removed user ${userToRemove?.getUsername()} from the group with name ${this.getName()}` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    // JSON RESPONSE WRITTEN (todo: remove)
    async makeMemberAdmin(userObj, callback = undefined) {
        try {
            GameFuse.Log(`Making user with username ${userObj?.getUsername()} an admin for the group with name ${this.getName()}`);

            const url = `${GameFuse.getBaseURL()}/make_group_member_admin`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken()
                },
                data: JSON.stringify({
                    group_id: this.getID(),
                    user_id: userObj?.getID()
                })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup makeMemberAdmin success');
                // add this user to the admins list
                let groupToModify = GameFuseUser.CurrentUser.getGroups().find(group => group.getID() === this.getID());
                groupToModify.admins.unshift(userObj);
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Successfully made user with username ${userObj?.getUsername()} an admin for the group with name ${this.getName()}` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }
}