class GameFuseUtilities {
    static async HandleCallback(response, responseMessage, callback = undefined, success=true) {
        try {
            if (!success){
                callback(responseMessage,true)
            }
            else if (response == null && callback != null) {
                callback(responseMessage, true)
            }
            else if (response.status >= 400) {
                console.error(`Request (${response.url}) had error: ` + response.data);
                if (callback != null)
                    callback("An unknown error occurred: " + response.data, true);
            } else if (response.status === 299) {
                var errorString = response.data
                if (errorString.includes("has already been taken"))
                    errorString = "Username or email already taken";

                if (callback != null)
                    callback(errorString, true);
            } else {
                if (callback != null)
                    callback(responseMessage, false);
            }
        } catch (error) {
            console.error("response had error: ");
            console.log(error)
            if (callback != null)
                callback("An unknown error occurred: " + error, true);
        }
    }

    static RequestIsSuccessful(response) {
        return response.status.toString()[0] ===  "2"
    }

    // TODO: instead of forcing each method to build out its own headers hash, build the headers hash here.
    //    It is exactly the same in just about every place it is built.
    static async processRequest(url, options) {
        const response = await fetch(url, options);
        let data;
        if (GameFuseUtilities.RequestIsSuccessful(response)) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        response.data = data;

        return response;
    }

    static async requestIsOk(response){
        if (response.status.toString()[0] !==  "2") {
            return false;
        }
        return response.ok
    }
}