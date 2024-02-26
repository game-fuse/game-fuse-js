class GameFuseGroup {
    constructor(id, name, options) {
        this.id = id;
        this.name = name;
        this.canAutoJoin = options.canAutoJoin;
        this.isInviteOnly = options.isInviteOnly;
        this.maxGroupSize = options.maxGroupSize;
    }

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
}