class GameFuseUtilities {
    static async HandleCallback(response, successString, callback = undefined) {
        try {

            if (response.status >= 400) {
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
                    callback(successString, false);
            }
        } catch (error) {
            console.error("response had error: ");
            console.log(error)
            if (callback !== null)
                callback("An unknown error occurred: " + error, true);
        }
    }

    static RequestIsSuccessful(response) {
        return (
            response.status !== 0 &&
            response.status !== 404 &&
            response.status !== 500
        );
    }


    static async processRequest(url, options) {
      const response = await fetch(url, options);
      const data = await response.json();

      response.data = data;
      return response;
    }


    static async requestIsOk(response){
        const data = response.data
        if (data && data.error) {
            return false
        }
        return response.ok
    }

}