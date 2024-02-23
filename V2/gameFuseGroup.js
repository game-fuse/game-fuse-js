class GameFuseGroup {
    constructor(name, category, description, cost, id, icon_url) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.cost = cost;
        this.id = id;
        this.icon_url = icon_url;
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

    getIconUrl() {
        return this.icon_url;
    }
}