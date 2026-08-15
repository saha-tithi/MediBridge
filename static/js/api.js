const API_BASE_URL = "/api/v1";


async function apiRequest(endpoint, options = {}) {

    const token = localStorage.getItem("access_token");

    const headers = {
        ...options.headers
    };


    // Add JSON content type
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }


    // Add authentication token when required
    if (token && options.auth !== false) {
        headers["Authorization"] = `Bearer ${token}`;
    }


    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );


    const contentType = response.headers.get("content-type");

    const data =
        contentType &&
        contentType.includes("application/json")
            ? await response.json()
            : {};


    if (!response.ok) {

        let errorMessage = "Request failed. Please try again.";


        /*
         * Django API validation errors
         *
         * Example:
         *
         * errors: {
         *     email: [
         *         "An account with this email already exists."
         *     ]
         * }
         */

        if (data.errors && typeof data.errors === "object") {

            const messages = [];


            Object.values(data.errors).forEach(function (errors) {

                if (Array.isArray(errors)) {

                    errors.forEach(function (message) {

                        if (typeof message === "string") {
                            messages.push(message);
                        }

                    });

                }

                else if (typeof errors === "string") {

                    messages.push(errors);

                }

            });


            if (messages.length > 0) {
                errorMessage = messages.join(" ");
            }

        }


        /*
         * Use API message only when
         * there are no detailed validation errors.
         */

        else if (data.message) {

            errorMessage = data.message;

        }


        throw new Error(errorMessage);
    }


    return data;
}