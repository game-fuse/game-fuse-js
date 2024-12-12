class GameFuseGroup {
    constructor(id, name, groupType, canAutoJoin, isInviteOnly, maxGroupSize, memberCount, members = [], admins = [], joinRequests = [], invites = [], admins_only_can_create_attributes = true) {
        this.id = id;
        this.name = name;
        this.groupType = groupType;
        this.canAutoJoin = canAutoJoin;
        this.isInviteOnly = isInviteOnly;
        this.maxGroupSize = maxGroupSize;
        this.memberCount = memberCount;
        this.members = members; // should include everyone, including admins.
        this.admins = admins;
        this.invites = joinRequests;
        this.joinRequests = invites;
        this.attributes = [];
        this.admins_only_can_create_attributes = admins_only_can_create_attributes;
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
        // TODO: if the members aren't downloaded yet, should this download them...? No...
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
    
    getGroupType() {
        return this.groupType;
    }

    static async downloadAvailableGroups(callback = undefined) {
        try {
            GameFuse.Log('Downloading available group');
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
                response.data.groups.forEach((groupData) => {
                    currentUser.downloadedAvailableGroups.push(GameFuseJsonHelper.convertJsonToGroup(groupData));
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
                throw(`The attributes hash is missing the following keys: ${missingKeys.join(', ')}`);
            }

            const url = `${GameFuse.getBaseURL()}/groups`;
            const data = {
                name: attributes.name,
                max_group_size: attributes.maxGroupSize,
                can_auto_join: attributes.canAutoJoin,
                is_invite_only: attributes.isInviteOnly,
                admins_only_can_create_attributes: attributes.admins_only_can_create_attributes,
                group_type: attributes.groupType || 'default'
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

    async userIsAdmin(user){
        let admins = this.getAdmins();
        if(admins.length === 0){
            // this means we need to download full data.
            await this.downloadFullData(() => console.log(`downloaded full data for group '${this.getName()}'`));
            admins = this.getAdmins();
        }

        return admins.find(admin => admin.getID() === user.getID());
    }

    async update(attributesToUpdate, callback = undefined) {
        try {
            GameFuse.Log(`Updating group with name ${this.getName()}`);
            let currentUser = GameFuseUser.CurrentUser;

            if(!(await this.userIsAdmin(currentUser))) {
                throw('You must be an admin to update a group!')
            }

            let allowedKeys = ['name', 'maxGroupSize', 'canAutoJoin', 'isInviteOnly'];
            let actualKeys = Object.keys(attributesToUpdate);
            let notAllowedKeys = actualKeys.filter(key => !allowedKeys.includes(key))

            if(notAllowedKeys.length > 0) {
                throw(`The following keys are not allowed in the attributesToUpdate hash for updating a group: ${notAllowedKeys.join(', ')}`);
            } else if (actualKeys.length === 0) {
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
            let updateParams = {};
            for (let key in attributesToUpdate) {
                let snakeCaseKey = keyMapping[key];
                updateParams[snakeCaseKey] = attributesToUpdate[key];
            }
            
            let data = {group: updateParams}
            const url = `${GameFuse.getBaseURL()}/groups/${this.getID()}`;
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

                // update the group object with the response data from the API
                this.assignAttributes(response.data);
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
            if(!(await this.userIsAdmin(currentUser))){
                throw('You must be an admin to destroy a group!');
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

                this.assignAttributes(data);

                // Handle join requests and invites after assigning the above attributes so that we can pass in the updated object instance to create these objects.
                // Note that this data will not be returned from the API if the current user isn't an admin of the group.
                if(data.join_requests) { this.joinRequests = data.join_requests.map(joinRequestData => GameFuseJsonHelper.convertJsonToGroupJoinRequest(joinRequestData, this, null)); }
                if(data.invites) { this.invites = data.invites.map(inviteData => GameFuseJsonHelper.convertJsonToGroupInvite(inviteData, this, null, null)); }
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
                if(response.data.status === 'accepted'){
                    GameFuse.Log('GameFuseGroup requestToJoin ==> led to an actual join due to the group being auto joinable.');
                    // this means that the group was auto-joinable, so the person was automatically made a member.
                    this.members.unshift(currentUser); // add current user to the members list
                    currentUser.groups.unshift(this); // add this group to the current user's group list
                    this.memberCount += 1; // bump the memberCount by 1
                } else {
                    GameFuse.Log('GameFuseGroup requestToJoin Success.');
                    // This is the expected behavior. Make a join request object and add it to their join requests.
                    currentUser.groupJoinRequests.unshift(GameFuseJsonHelper.convertJsonToGroupJoinRequest(response.data, this, currentUser));
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

                // add the invite to the group.
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

            const url = `${GameFuse.getBaseURL()}/group_connections/leave/${this.getID()}`;
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
                this.members = this.members.filter(member => member.getID() !== currentUser.getID())
                this.admins = this.admins.filter(admin => admin.getID() !== currentUser.getID())
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
                this.members = this.members.filter(member => member.getID() !== userToRemove.getID());
                this.memberCount -= 1;
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

    async sendMessage(message, callback = undefined) {
        return GameFuseChat.sendMessage(this, message, callback)
    }

    assignAttributes(updatedAttributes) {
        Object.assign(this, {
            id: updatedAttributes.id,
            name: updatedAttributes.name,
            canAutoJoin: updatedAttributes.can_auto_join,
            isInviteOnly: updatedAttributes.is_invite_only,
            maxGroupSize: updatedAttributes.max_group_size,
            memberCount: updatedAttributes.member_count,
            members: updatedAttributes.members ? updatedAttributes.members.map(memberData => GameFuseJsonHelper.convertJsonToUser(memberData)) : this.members,
            admins: updatedAttributes.admins ? updatedAttributes.admins.map(adminData => GameFuseJsonHelper.convertJsonToUser(adminData)) : this.admins
        });
    }

    /**
     * Get all attributes of the group
     */
    async getAttributes(callback = undefined) {
        try {
            GameFuse.Log(`Fetching attributes for group with name ${this.getName()}`);
            const url = `${GameFuse.getBaseURL()}/groups/${this.getID()}/attributes`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken(),
                },
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup getAttributes success');
                this.attributes = response.data.map(attr => ({
                    key: attr.key,
                    value: attr.value,
                    others_can_edit: attr.others_can_edit,
                }));
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Successfully fetched attributes for group ${this.getName()}` : response.data,
                callback,
                !!responseOk
            );
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(undefined, error.message, callback, false);
        }
    }

    /**
     * Create a new attribute for the group
     */
    async createAttribute(attribute, callback = undefined) {
        try {
            GameFuse.Log(`Creating a new attribute for group ${this.getName()}`);
            const url = `${GameFuse.getBaseURL()}/groups/${this.getID()}/add_attribute`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken(),
                },
                body: JSON.stringify({
                    attributes: [attribute],
                }),
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup createAttribute success');
                this.attributes.push(attribute);
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Successfully created attribute '${attribute.key}' for group ${this.getName()}` : response.data,
                callback,
                !!responseOk
            );
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(undefined, error.message, callback, false);
        }
    }

    /**
     * Modify an existing attribute of the group
     */
    async modifyAttribute(key, newValue, callback = undefined) {
        try {
            GameFuse.Log(`Modifying attribute '${key}' for group ${this.getName()}`);
            const url = `${GameFuse.getBaseURL()}/groups/${this.getID()}/modify_attribute`;
            const response = await GameFuseUtilities.processRequest(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'authentication-token': GameFuseUser.CurrentUser.getAuthenticationToken(),
                },
                body: JSON.stringify({
                    key: key,
                    value: newValue,
                }),
            });

            const responseOk = await GameFuseUtilities.requestIsOk(response);
            if (responseOk) {
                GameFuse.Log('GameFuseGroup modifyAttribute success');
                const attribute = this.attributes.find(attr => attr.key === key);
                if (attribute) {
                    attribute.value = newValue;
                }
            }

            GameFuseUtilities.HandleCallback(
                response,
                responseOk ? `Successfully modified attribute '${key}' for group ${this.getName()}` : response.data,
                callback,
                !!responseOk
            );
        } catch (error) {
            console.log(error);
            GameFuseUtilities.HandleCallback(undefined, error.message, callback, false);
        }
    }
}