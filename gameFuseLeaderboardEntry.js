class GameFuseLeaderboardEntry {
    constructor(username, score, leaderboard_name, extra_attributes, game_user_id) {
        this.username = username;
        this.score = score;
        this.leaderboard_name = leaderboard_name;
        this.extra_attributes = extra_attributes;
        this.game_user_id = game_user_id;
    }

    getUsername() {
        return this.username;
    }

    getScore() {
        return this.score;
    }

    getLeaderboardName() {
        return this.leaderboard_name;
    }

    getExtraAttributes() {
        const dictionary = this.extra_attributes
            .replace("\\", "")
            .replace("{", "")
            .replace("}", "")
            .replace(", ", ",")
            .replace(": ", ":")
            .split(",")
            .map(part => part.split(":"))
            .filter(part => part.length === 2)
            .reduce((acc, [key, value]) => {
                acc[key.replace("\"", "")] = value.replace("\"", "");
                return acc;
            }, {});
        return dictionary;
    }
}