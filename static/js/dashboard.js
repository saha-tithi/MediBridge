const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "/login/";
} else {
    document.getElementById("userName").textContent =
        `Welcome, ${user.username}`;
}


document
    .getElementById("logoutButton")
    .addEventListener("click", function () {

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        window.location.href = "/login/";
    });