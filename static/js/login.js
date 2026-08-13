const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const identifier = document
        .getElementById("identifier")
        .value
        .trim();

    const password = document.getElementById("password").value;

    loginMessage.textContent = "";
    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";

    try {
        const data = await apiRequest(
            "/auth/login/",
            {
                method: "POST",
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

        window.location.href = "/dashboard/";

    } catch (error) {
        loginMessage.textContent = error.message;
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }
});