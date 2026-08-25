/* =========================================
   PROFILE PAGE
========================================= */


/* =========================================
   ELEMENTS
========================================= */

const profileForm =
    document.getElementById("profileForm");

const usernameInput =
    document.getElementById("username");

const emailInput =
    document.getElementById("email");

const phoneInput =
    document.getElementById("phone_number");

const accountRole =
    document.getElementById("accountRole");

const accountCreated =
    document.getElementById("accountCreated");

const profileError =
    document.getElementById("profileError");

const editProfileButton =
    document.getElementById("editProfileButton");

const profileActions =
    document.getElementById("profileActions");

const cancelEditButton =
    document.getElementById("cancelEditButton");

const saveProfileButton =
    document.getElementById("saveProfileButton");

const logoutButton =
    document.getElementById("logoutButton");


/* =========================================
   STATE
========================================= */

let currentProfile = null;


/* =========================================
   LOAD PROFILE
========================================= */

async function loadProfile() {

    try {

        const response =
            await apiRequest(
                "/auth/profile/",
                {
                    method: "GET"
                }
            );


        const profile =
            response.data;


        if (!profile) {

            throw new Error(
                "Unable to load profile."
            );

        }


        currentProfile = profile;


        renderProfile(profile);


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        showProfileError(
            error.message ||
            "Unable to load your profile."
        );

    }

}


/* =========================================
   RENDER PROFILE
========================================= */

function renderProfile(profile) {

    usernameInput.value =
        profile.username || "";

    emailInput.value =
        profile.email || "";

    phoneInput.value =
        profile.phone_number || "";


    accountRole.textContent =
        formatRole(profile.role);


    accountCreated.textContent =
        formatDate(profile.created_at);

}


/* =========================================
   EDIT PROFILE
========================================= */

editProfileButton.addEventListener(
    "click",
    function () {

        enableEditing();

    }
);


/* =========================================
   ENABLE EDITING
========================================= */

function enableEditing() {

    usernameInput.disabled = false;
    emailInput.disabled = false;
    phoneInput.disabled = false;


    profileActions.style.display =
        "flex";


    editProfileButton.style.display =
        "none";


    usernameInput.focus();

}


/* =========================================
   CANCEL EDIT
========================================= */

cancelEditButton.addEventListener(
    "click",
    function () {

        if (currentProfile) {

            renderProfile(
                currentProfile
            );

        }


        disableEditing();

    }
);


/* =========================================
   DISABLE EDITING
========================================= */

function disableEditing() {

    usernameInput.disabled = true;
    emailInput.disabled = true;
    phoneInput.disabled = true;


    profileActions.style.display =
        "none";


    editProfileButton.style.display =
        "inline-flex";

}


/* =========================================
   SAVE PROFILE
========================================= */

profileForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        clearProfileError();


        const username =
            usernameInput.value.trim();

        const email =
            emailInput.value.trim();

        const phoneNumber =
            phoneInput.value.trim();


        if (!username) {

            showProfileError(
                "Username cannot be empty."
            );

            return;

        }


        if (!email) {

            showProfileError(
                "Email cannot be empty."
            );

            return;

        }


        saveProfileButton.disabled =
            true;

        saveProfileButton.textContent =
            "Saving...";


        try {

            const response =
                await apiRequest(
                    "/auth/profile/",
                    {
                        method: "PATCH",

                        body:
                            JSON.stringify({

                                username:
                                    username,

                                email:
                                    email,

                                phone_number:
                                    phoneNumber

                            })
                    }
                );


            const updatedProfile =
                response.data;


            if (!updatedProfile) {

                throw new Error(
                    "Profile could not be updated."
                );

            }


            currentProfile =
                updatedProfile;


            renderProfile(
                updatedProfile
            );


            disableEditing();


        } catch (error) {

            console.error(
                "Profile update error:",
                error
            );


            showProfileError(
                error.message ||
                "Unable to update your profile."
            );

        } finally {

            saveProfileButton.disabled =
                false;

            saveProfileButton.textContent =
                "Save Changes";

        }

    }
);


/* =========================================
   LOGOUT
========================================= */

/* =========================================
   LOGOUT
========================================= */

logoutButton.addEventListener(
    "click",
    function () {

        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "refresh_token"
        );

        window.location.href =
            "/login/";

    }
);


/* =========================================
   FORMAT ROLE
========================================= */

function formatRole(role) {

    if (!role) {

        return "-";

    }


    const roles = {

        CUSTOMER:
            "Customer",

        PHARMACIST:
            "Pharmacist",

        ADMIN:
            "Administrator"

    };


    return roles[role] ||
        role;

}


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(dateString) {

    if (!dateString) {

        return "-";

    }


    const date =
        new Date(
            dateString
        );


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


/* =========================================
   ERROR
========================================= */

function showProfileError(message) {

    profileError.textContent =
        message;

    profileError.style.display =
        "block";

}


function clearProfileError() {

    profileError.textContent =
        "";

    profileError.style.display =
        "none";

}


/* =========================================
   INITIAL LOAD
========================================= */

loadProfile();