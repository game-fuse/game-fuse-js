class GameFuseUtilities {
    static async HandleCallback(response, responseMessage, callback = undefined, success=true) {
        try {
            if (!success){
                callback(responseMessage,true)
            }
            else if (response == undefined) {
                callback(responseMessage, true)
            }
            else if (response.status >= 400) {
                console.error(`Request (${response.url}) had error: ` + response.statusText);
                if (callback !== null)
                    callback("An unknown error occurred: " + response.statusText, true);
            } else if (response.status === 299) {
                const data = response.data
                let errorString = data.error;

                if (errorString.includes("has already been taken"))
                    errorString = "Username or email already taken";

                if (callback !== null)
                    callback(errorString, true);
            } else {
                if (callback !== null)
                    callback(responseMessage, false);
            }
        } catch (error) {
            console.error("response had error: ");
            console.log(error)
            if (callback !== null)
                callback("An unknown error occurred: " + error, true);
        }
    }

    static RequestIsSuccessful(response) {
        if (response.data && response.data.error && response.data.error.length > 0){
            return false;
        }
        return response.status.toString()[0] ==  "2"
    }


    static async processRequest(url, options) {
      const response = await fetch(url, options);
      const data = await response.json();

      response.data = data;
      return response;
    }


    static async requestIsOk(response){
        const data = response.data
        if (data && data.error && data.error.length > 0) {
            return false
        }
        return response.ok
    }
}