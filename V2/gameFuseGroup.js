class GameFuseGroup {
    constructor(id, name, options) {
        this.id = id;
        this.name = name;
        this.canAutoJoin = options.canAutoJoin;
        this.isInviteOnly = options.isInviteOnly;
        this.maxGroupSize = options.maxGroupSize;
        this.members = [] // should include everyone, including admins.
        this.admins = []
    }

    getID() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getMembers() {
        return this.members;
    }

    getAdmins() {
        return this.admins;
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
}