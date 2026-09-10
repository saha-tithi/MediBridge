document.addEventListener("DOMContentLoaded", function () {

    const profileAvatar = document.getElementById("profileAvatar");
    const profileName = document.getElementById("profileName");
    const profileRole = document.getElementById("profileRole");

    const profileUsername =
        document.getElementById("profileUsername");

    const profileEmail =
        document.getElementById("profileEmail");

    const profilePhone =
        document.getElementById("profilePhone");

    const profileRoleDetail =
        document.getElementById("profileRoleDetail");

    const profileAccessLevel =
        document.getElementById("profileAccessLevel");

    const logoutButton =
        document.getElementById("logoutButton");


    function formatRole(role) {

        if (!role) {
            return "—";
        }

        if (role === "PHARMACIST") {
            return "Pharmacist";
        }

        if (role === "ADMIN") {
            return "Administrator";
        }

        return role;
    }


    function getInitials(user) {

        const firstName = user.first_name || "";
        const lastName = user.last_name || "";

        if (firstName || lastName) {

            return (
                (firstName.charAt(0) || "") +
                (lastName.charAt(0) || "")
            ).toUpperCase();

        }

        const username = user.username || "";

        return username
            .charAt(0)
            .toUpperCase() || "U";
    }


    function loadProfile() {

        const storedUser =
            localStorage.getItem("user");

        if (!storedUser) {
            window.location.href = "/login/";
            return;
        }

        let user;

        try {

            user = JSON.parse(storedUser);

        } catch (error) {

            localStorage.removeItem("user");
            window.location.href = "/login/";
            return;
        }


        const role = user.role;


        if (role !== "PHARMACIST" && role !== "ADMIN") {

            window.location.href = "/medicines/";
            return;
        }


        const fullName = [
            user.first_name,
            user.last_name
        ]
            .filter(Boolean)
            .join(" ");


        const displayName =
            fullName ||
            user.username ||
            "User";


        profileAvatar.textContent =
            getInitials(user);

        profileName.textContent =
            displayName;

        profileRole.textContent =
            formatRole(role);


        profileUsername.textContent =
            user.username || "—";

        profileEmail.textContent =
            user.email || "—";

        profilePhone.textContent =
            user.phone_number || "Not provided";

        profileRoleDetail.textContent =
            formatRole(role);

        profileAccessLevel.textContent =
            role === "ADMIN"
                ? "Full Pharmacy Access"
                : "Pharmacist Access";
    }


    function logout() {

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        window.location.href = "/login/";
    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }


    loadProfile();

});