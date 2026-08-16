const registerForm = document.getElementById("registerForm");
const registerButton = document.getElementById("registerButton");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document
        .getElementById("username")
        .value
        .trim();

    const email = document
        .getElementById("email")
        .value
        .trim();

    const phoneNumber = document
        .getElementById("phone_number")
        .value
        .trim();

    const password = document.getElementById("password").value;

    const confirmPassword = document
        .getElementById("confirm_password")
        .value;


    registerMessage.textContent = "";

    registerButton.disabled = true;
    registerButton.textContent = "Creating account...";


    try {

       const data = await apiRequest(
    "/auth/register/",
    {
        method: "POST",

        auth: false,

        body: JSON.stringify({
            username: username,
            email: email,
            phone_number: phoneNumber,
            password: password,
            confirm_password: confirmPassword
        })
    }
);


        registerMessage.style.color = "#438f89";

        registerMessage.textContent =
            "Account created successfully. Redirecting...";


        setTimeout(function () {

            window.location.href = "/login/";

        }, 1000);


    } catch (error) {

        registerMessage.style.color = "#d05b5b";

        registerMessage.textContent = getRegisterErrorMessage(
            error
        );


    } finally {

        registerButton.disabled = false;

        registerButton.textContent = "Create account";

    }

});

function getRegisterErrorMessage(error) {

    if (!error) {
        return "Registration failed. Please try again.";
    }


    if (typeof error.message === "string") {

        return error.message;

    }


    return "Registration failed. Please check your information.";

}