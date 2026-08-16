const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");


loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const identifier = document
        .getElementById("identifier")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;


    loginMessage.textContent = "";
    loginMessage.style.color = "#d05b5b";


    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";


    try {

        const data = await apiRequest(
            "/auth/login/",
            {
                method: "POST",

                auth: false,

                body: JSON.stringify({
                    identifier: identifier,
                    password: password
                })
            }
        );


        localStorage.setItem(
            "access_token",
            data.data.tokens.access
        );

        localStorage.setItem(
            "refresh_token",
            data.data.tokens.refresh
        );

        localStorage.setItem(
            "user",
            JSON.stringify(data.data.user)
        );


        loginMessage.style.color = "#438f89";

        loginMessage.textContent =
            "Login successful. Redirecting...";


        setTimeout(function () {

            window.location.href = "/medicines/";

        }, 500);


    } catch (error) {

        loginMessage.style.color = "#d05b5b";

        loginMessage.textContent =
            getLoginErrorMessage(error);

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "Login";

    }

});


function getLoginErrorMessage(error) {

    if (!error) {
        return "Login failed. Please try again.";
    }


    if (typeof error.message === "string") {
        return error.message;
    }


    return "Login failed. Please check your credentials.";

}