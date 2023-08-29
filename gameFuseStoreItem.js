class GameFuseStoreItem {
    constructor(name, category, description, cost, id) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.cost = cost;
        this.id = id;
    }

    getName() {
        return this.name;
    }

    getCategory() {
        return this.category;
    }

    getDescription() {
        return this.description;
    }

    getCost() {
        return this.cost;
    }

    getId() {
        return this.id;
    }
}