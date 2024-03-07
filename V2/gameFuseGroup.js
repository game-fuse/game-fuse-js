class GameFuseGroup {
    constructor(id, name, canAutoJoin, isInviteOnly, maxGroupSize, memberCount, members = [], admins = [], joinRequests = [], invites = []) {
        this.id = id;
        this.name = name;
        this.canAutoJoin = canAutoJoin;
        this.isInviteOnly = isInviteOnly;
        this.maxGroupSize = maxGroupSize;
        this.memberCount = memberCount;
        this.members = members; // should include everyone, including admins.
        this.admins = admins;
        this.invites = joinRequests;
        this.joinRequests = invites;
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

    static async downloadAvailableGroups(callback = undefined) {
        try {
            GameFuse.Log('Downloading available group')
            let currentUser = GameFuseUser.CurrentUser;

            const url = `${GameFuse.getBaseURL()}/groups`
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                }
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log("GameFuseGroup download available groups success");

                // add all the groups to the available groups array
                response.data.forEach((groupData) => {
                    let groupObject = GameFuseJsonHelper.convertJsonToGroup(groupData);
                    currentUser.downloadedAvailableGroups.push(groupObject);
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

    static async create(attributes, callback = undefined) {
        try {
            GameFuse.Log('Creating a group')

            let expectedKeys = ['name', 'maxGroupSize', 'canAutoJoin', 'isInviteOnly'];
            let actualKeys = Object.keys(attributes)

            let missingKeys = expectedKeys.filter(expectedKey => !actualKeys.includes(expectedKey))
            if(missingKeys.length > 0){
                throw(`The attributes hash is missing the following keys: ${missingKeys}`);
            }

            const url = `${GameFuse.getBaseURL()}/groups`;
            const data = {
                name: attributes.name,
                max_group_size: attributes.maxGroupSize,
                can_auto_join: attributes.canAutoJoin,
                is_invite_only: attributes.isInviteOnly
            };

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

            let groupObject; // have to declare it up here for it to be present in the HandleCallback function.
            if (responseOk) {
                GameFuse.Log("GameFuseGroup create Success");
                // add this group to the user's groups array
                groupObject = GameFuseJsonHelper.convertJsonToGroup(response.data);
                currentUser.groups.unshift(groupObject);
                currentUser.downloadedAvailableGroups.unshift(groupObject);
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `group with name ${groupObject.getName()} has been created successfully` : response.data, // message from the api
                callback,
                !!responseOk
            )
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(typeof response !== 'undefined' ? response : undefined, error.message, callback, false)
        }
    }

    async update(attributesToUpdate, callback = undefined) {
        try {
            GameFuse.Log(`Updating group with name ${this.getName()}`);
            let currentUser = GameFuseUser.CurrentUser;
            let currentUserIsAdmin = this.getAdmins().map(user => user.getID()).includes(currentUser.getID())
            if(!currentUserIsAdmin){
                throw('You must be an admin to update a group!')
            }

            let allowedKeys = ['name', 'maxGroupSize', 'canAutoJoin', 'isInviteOnly'];
            let actualKeys = Object.keys(attributesToUpdate);
            let notAllowedKeys = actualKeys.filter(key => !allowedKeys.includes(key))

            if(notAllowedKeys.length > 0){
                throw(`The following keys are not allowed in the attributesToUpdate hash for updating a group: ${notAllowedKeys}`);
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
            for (let key in attributesToUpdate) {
                let snakeCaseKey = keyMapping[key];
                updateDataHash[snakeCaseKey] = attributesToUpdate[key];
            }

            let data = { group: updateDataHash }
            const url = `${GameFuse.getBaseURL()}/groups/${this.getID()}`
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                },
                body: JSON.stringify(data)
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup update Success');

                // update the group object object
                for (let key in attributesToUpdate) {
                    let snakeCaseKey = keyMapping[key];
                    this[key] = response.data[snakeCaseKey]
                }
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

    async destroy(callback = undefined) {
        try {
            GameFuse.Log(`Destroying group with name ${this.getName()}`);
            let currentUser = GameFuseUser.CurrentUser;
            let currentUserIsAdmin = this.getAdmins().map(user => user.getID()).includes(currentUser.getID())
            if(!currentUserIsAdmin){
                throw('You must be an admin to destroy a group!')
            }

            const url = `${GameFuse.getBaseURL()}/groups/${this.getID()}`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                }
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup destroy group success');
                // remove the object from the state.
                currentUser.groups = currentUser.groups.filter(group => group.getID() !== this.getID());
                currentUser.downloadedAvailableGroups = currentUser.downloadedAvailableGroups.filter(group => group.getID() !== this.getID());
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

    async downloadFullData(callback = undefined) {
        try {
            GameFuse.Log(`Getting full data for group with name ${this.getName()}`);

            let currentUser = GameFuseUser.CurrentUser;
            const url = `${GameFuse.getBaseURL()}/groups/${this.getID()}`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                },
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup downloadFullData success');
                // instead of creating a new object, update this object, so that the game developer can continue using the reference they already have from the GroupCache.
                let data = response.data;
                Object.assign(this, {
                    id: data.id,
                    name: data.name,
                    canAutoJoin: data.can_auto_join,
                    isInviteOnly: data.is_invite_only,
                    maxGroupSize: data.max_group_size,
                    memberCount: data.member_count,
                    members: data.members.map(memberData => GameFuseJsonHelper.convertJsonToUser(memberData)),
                    admins: data.admins.map(adminData => GameFuseJsonHelper.convertJsonToUser(adminData))
                });

                // handle join requests and invites after assigning the above attributes so that we can pass in the updated object instance to create these objects
                this.joinRequests = data.join_requests.map(joinRequestData => GameFuseJsonHelper.convertJsonToGroupJoinRequest(joinRequestData, this, null));
                this.invites = data.invites.map(inviteData => GameFuseJsonHelper.convertJsonToGroupInvite(inviteData, this, null));
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

    async join(callback = undefined) {
        try {
            // don't do the validations here (ex. auto-joinable, etc.), let the backend do it in case something has changed since the group data was pulled.
            GameFuse.Log(`Current user is attempting to join the group with name ${this.getName()}`);
            let currentUser = GameFuseUser.CurrentUser;

            // TODO: figure out if this is the right URL. It should probably be through the group_connections model...?
            const url = `${GameFuse.getBaseURL()}/group_connections`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                },
                body: JSON.stringify(
                    {
                        group_connection: {
                            group_id: this.getID(),
                            user_id: currentUser.getID(),
                            status: 'accepted',
                            action_type: 'join'
                        },
                    }
                )
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup join success');
                this.members.unshift(currentUser); // add current user to the members list
                currentUser.groups.unshift(this); // add this group to the current user's group list
                this.memberCount += 1; // bump the memberCount by 1
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

    async requestToJoin(callback = undefined) {
        try {
            // don't do the validations here (ex. auto-joinable, etc.), let the backend do it in case something has changed since the group data was pulled.
            GameFuse.Log(`Current user is requesting to join the group with name ${this.getName()}`);
            let currentUser = GameFuseUser.CurrentUser;

            // TODO: figure out if this is the right URL. It should probably be through the group_connections model...?
            const url = `${GameFuse.getBaseURL()}/group_connections`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                },
                body: JSON.stringify({
                    group_connection: {
                        group_id: this.getID(),
                        user_id: currentUser.getID(),
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
                    currentUser.groups.unshift(this)
                } else {
                    // This is the expected behavior. Make a join request object and add it to their join requests.
                    let groupJoinRequest = GameFuseJsonHelper.convertJsonToGroupJoinRequest(response.data, this, currentUser);
                    currentUser.groupJoinRequests.unshift(groupJoinRequest);
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

    async invite(userOrUsername, callback = undefined) {
        try {
            let username = (userOrUsername instanceof GameFuseUser) ? userOrUsername.getUsername() : userOrUsername;

            let currentUser = GameFuseUser.CurrentUser;
            GameFuse.Log(`The current user with username ${currentUser.getUsername()} is inviting user with username ${username} to the group with name ${this.getName()}`);

            // TODO: figure out if this is the right URL. Should probably be through the group connections model...?
            const url = `${GameFuse.getBaseURL()}/group_connections`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                },
                body: JSON.stringify({
                    group_connection: {
                        group_id: this.getID(),
                        inviter_id: currentUser.getID(),
                        status: 'pending',
                        action_type: 'invite'
                    },
                    username: username
                })
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup invite sent with success');
                let personInvitedObj;
                if(userOrUsername instanceof GameFuseUser){
                    personInvitedObj = userOrUsername;
                } else {
                    // create the data from the api response
                    personInvitedObj = GameFuseJsonHelper.convertJsonToUser(response.data.user);
                }

                let groupInvite = GameFuseJsonHelper.convertJsonToGroupInvite(response.data, this, personInvitedObj, currentUser);

                // add the invite to the group in state
                // TODO: can we just update 'this'? I think so.
                this.invites.unshift(groupInvite);
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

    async leave(callback = undefined) {
        try {
            let currentUser = GameFuseUser.CurrentUser;
            GameFuse.Log(`The current user with username ${currentUser.getUsername()} is leaving group ${this.getName()}`);

            const url = `${GameFuse.getBaseURL()}/group_connections/leave_group/${this.getID()}`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': currentUser.getAuthenticationToken()
                }
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup leave success');
                currentUser.groups = currentUser.groups.filter(group => group.getID() !== this.getID());  // remove the group from myGroups
                this.memberCount -= 1;
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

    async removeMember(userToRemove, callback = undefined) {
        try {
            GameFuse.Log(`Removing user with username ${userToRemove?.getUsername()} from group with name ${this.getName()}`);

            // TODO: figure out if this is the right URL. Should probably be through the group connections model...?
            const url = `${GameFuse.getBaseURL()}/group_connections/remove_member/${userToRemove?.getID()}`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'PUT',
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
                GameFuse.Log('GameFuseGroup removeMember success');
                this.members = this.members.filter(member => member.getID() !== userToRemove.getID()) // remove this user from the members
                this.memberCount -= 1; // decrease the memberCount by 1
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

    async makeMemberAdmin(userObj, callback = undefined) {
        try {
            GameFuse.Log(`Making user with username ${userObj?.getUsername()} an admin for the group with name ${this.getName()}`);

            const url = `${GameFuse.getBaseURL()}/group_connections/make_admin/${userObj?.getID()}`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'PUT',
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
                GameFuse.Log('GameFuseGroup makeMemberAdmin success');

                // add this user to the admins list
                this.admins.unshift(userObj);
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