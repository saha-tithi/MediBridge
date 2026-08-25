/* =========================================
   ADDRESSES PAGE
========================================= */


/* =========================================
   ELEMENTS
========================================= */

const addressesList =
    document.getElementById("addressesList");

const addressesLoading =
    document.getElementById("addressesLoading");

const addressesEmpty =
    document.getElementById("addressesEmpty");

const addressError =
    document.getElementById("addressError");

const addressFormCard =
    document.getElementById("addressFormCard");

const addressForm =
    document.getElementById("addressForm");

const addressFormTitle =
    document.getElementById("addressFormTitle");

const addAddressButton =
    document.getElementById("addAddressButton");

const emptyAddAddressButton =
    document.getElementById(
        "emptyAddAddressButton"
    );

const cancelAddressButton =
    document.getElementById(
        "cancelAddressButton"
    );

const saveAddressButton =
    document.getElementById(
        "saveAddressButton"
    );

const addressLabel =
    document.getElementById("addressLabel");

const fullName =
    document.getElementById("fullName");

const phoneNumber =
    document.getElementById("phoneNumber");

const addressInput =
    document.getElementById("address");

const city =
    document.getElementById("city");

const pincode =
    document.getElementById("pincode");


/* =========================================
   DELETE MODAL ELEMENTS
========================================= */

const deleteModal =
    document.getElementById("deleteModal");

const cancelDeleteButton =
    document.getElementById(
        "cancelDeleteButton"
    );

const confirmDeleteButton =
    document.getElementById(
        "confirmDeleteButton"
    );


/* =========================================
   STATE
========================================= */

let addresses = [];

let addressToDelete = null;


/* =========================================
   LOAD ADDRESSES
========================================= */

async function loadAddresses() {

    try {

        clearAddressError();


        addressesLoading.style.display =
            "block";


        addressesEmpty.style.display =
            "none";


        const response =
            await apiRequest(
                "/addresses/",
                {
                    method: "GET"
                }
            );


        addresses =
            Array.isArray(response)
                ? response
                : response.data || [];


        renderAddresses();


    } catch (error) {

        console.error(
            "Address loading error:",
            error
        );


        showAddressError(
            error.message ||
            "Unable to load your addresses."
        );


    } finally {

        addressesLoading.style.display =
            "none";

    }

}


/* =========================================
   RENDER ADDRESSES
========================================= */

function renderAddresses() {

    if (
        !addresses ||
        addresses.length === 0
    ) {

        addressesList.innerHTML =
            "";

        addressesEmpty.style.display =
            "block";

        return;

    }


    addressesEmpty.style.display =
        "none";


    addressesList.innerHTML =
        addresses
            .map(
                function (address) {

                    return `

                        <article
                            class="address-item"
                            data-id="${address.id}"
                        >

                            <div
                                class="address-item-header"
                            >

                                <div>

                                    <span
                                        class="address-label"
                                    >

                                        ${getAddressIcon(
                                            address.label
                                        )}

                                        ${escapeHTML(
                                            getAddressLabel(
                                                address.label
                                            )
                                        )}

                                    </span>


                                    ${
                                        address.is_default
                                            ? `
                                                <span
                                                    class="default-text"
                                                >
                                                    Default
                                                </span>
                                            `
                                            : ""
                                    }

                                </div>


                                <div
                                    class="address-actions"
                                >

                                    <button
                                        type="button"
                                        class="edit-address-button"
                                        data-id="${address.id}"
                                    >
                                        Edit
                                    </button>


                                    <button
                                        type="button"
                                        class="delete-address-button"
                                        data-id="${address.id}"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </div>


                            <div
                                class="address-details"
                            >

                                <strong>
                                    ${escapeHTML(
                                        address.full_name
                                    )}
                                </strong>


                                <p>
                                    ${escapeHTML(
                                        address.address
                                    )}
                                </p>


                                <p>
                                    ${escapeHTML(
                                        address.city
                                    )}
                                    -
                                    ${escapeHTML(
                                        address.pincode
                                    )}
                                </p>


                                <p>
                                    Phone:
                                    ${escapeHTML(
                                        address.phone_number
                                    )}
                                </p>

                            </div>


                            ${
                                !address.is_default
                                    ? `
                                        <button
                                            type="button"
                                            class="default-address-button"
                                            data-id="${address.id}"
                                        >
                                            Set as Default
                                        </button>
                                    `
                                    : ""
                            }

                        </article>

                    `;

                }
            )
            .join("");


    attachAddressActions();

}


/* =========================================
   ADDRESS ACTIONS
========================================= */

function attachAddressActions() {


    /* =====================================
       EDIT
    ===================================== */

    document
        .querySelectorAll(
            ".edit-address-button"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            Number(
                                this.dataset.id
                            );


                        startEditingAddress(id);

                    }
                );

            }
        );


    /* =====================================
       DELETE
    ===================================== */

    document
        .querySelectorAll(
            ".delete-address-button"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            Number(
                                this.dataset.id
                            );


                        deleteAddress(id);

                    }
                );

            }
        );


    /* =====================================
       SET DEFAULT
    ===================================== */

    document
        .querySelectorAll(
            ".default-address-button"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            Number(
                                this.dataset.id
                            );


                        setDefaultAddress(id);

                    }
                );

            }
        );

}


/* =========================================
   OPEN ADD FORM
========================================= */

addAddressButton.addEventListener(
    "click",
    function () {

        openAddForm();

    }
);


emptyAddAddressButton.addEventListener(
    "click",
    function () {

        openAddForm();

    }
);


/* =========================================
   OPEN ADD FORM
========================================= */

function openAddForm() {

    addressFormTitle.textContent =
        "Add New Address";


    addressForm.reset();


    addressLabel.value =
        "HOME";


    addressFormCard.style.display =
        "block";


    addressFormCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =========================================
   EDIT ADDRESS INLINE
========================================= */

function startEditingAddress(id) {

    const address =
        addresses.find(
            function (item) {

                return Number(item.id) === id;

            }
        );


    if (!address) {

        return;

    }


    const addressElement =
        document.querySelector(
            `.address-item[data-id="${id}"]`
        );


    if (!addressElement) {

        return;

    }


    addressElement.innerHTML = `

        <form
            class="inline-edit-form"
            id="inlineEditForm-${id}"
        >

            <div class="inline-edit-header">

                <h3>
                    Edit Address
                </h3>

            </div>


            <div class="inline-edit-grid">


                <!-- ADDRESS LABEL -->

                <div class="form-group">

                    <label
                        for="editLabel-${id}"
                    >
                        Address Label
                    </label>

                    <select
                        id="editLabel-${id}"
                        required
                    >

                        <option
                            value="HOME"
                            ${
                                address.label === "HOME"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Home
                        </option>

                        <option
                            value="WORK"
                            ${
                                address.label === "WORK"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Work
                        </option>

                        <option
                            value="OTHER"
                            ${
                                address.label === "OTHER"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Other
                        </option>

                    </select>

                </div>


                <!-- FULL NAME -->

                <div class="form-group">

                    <label
                        for="editFullName-${id}"
                    >
                        Full Name
                    </label>

                    <input
                        type="text"
                        id="editFullName-${id}"
                        value="${escapeHTML(
                            address.full_name
                        )}"
                        required
                    >

                </div>


                <!-- PHONE -->

                <div class="form-group">

                    <label
                        for="editPhone-${id}"
                    >
                        Phone Number
                    </label>

                    <input
                        type="tel"
                        id="editPhone-${id}"
                        value="${escapeHTML(
                            address.phone_number
                        )}"
                        required
                    >

                </div>


                <!-- ADDRESS -->

                <div
                    class="form-group form-group-wide"
                >

                    <label
                        for="editAddress-${id}"
                    >
                        Address
                    </label>

                    <textarea
                        id="editAddress-${id}"
                        rows="3"
                        required
                    >${escapeHTML(
                        address.address
                    )}</textarea>

                </div>


                <!-- CITY -->

                <div class="form-group">

                    <label
                        for="editCity-${id}"
                    >
                        City
                    </label>

                    <input
                        type="text"
                        id="editCity-${id}"
                        value="${escapeHTML(
                            address.city
                        )}"
                        required
                    >

                </div>


                <!-- PINCODE -->

                <div class="form-group">

                    <label
                        for="editPincode-${id}"
                    >
                        Pincode
                    </label>

                    <input
                        type="text"
                        id="editPincode-${id}"
                        value="${escapeHTML(
                            address.pincode
                        )}"
                        required
                    >

                </div>

            </div>


            <div class="inline-edit-actions">

                <button
                    type="button"
                    class="inline-edit-cancel"
                    onclick="cancelInlineEdit(${id})"
                >
                    Cancel
                </button>


                <button
                    type="submit"
                    class="inline-edit-save"
                >
                    Update Address
                </button>

            </div>

        </form>

    `;


    const editForm =
        document.getElementById(
            `inlineEditForm-${id}`
        );


    editForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            saveInlineEdit(id);

        }
    );


    /*
     * Bring the edited card into view
     * without moving it underneath navbar.
     */

    addressElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* =========================================
   SAVE INLINE EDIT
========================================= */

async function saveInlineEdit(id) {

    const label =
        document.getElementById(
            `editLabel-${id}`
        ).value;


    const fullName =
        document.getElementById(
            `editFullName-${id}`
        ).value.trim();


    const phoneNumber =
        document.getElementById(
            `editPhone-${id}`
        ).value.trim();


    const address =
        document.getElementById(
            `editAddress-${id}`
        ).value.trim();


    const city =
        document.getElementById(
            `editCity-${id}`
        ).value.trim();


    const pincode =
        document.getElementById(
            `editPincode-${id}`
        ).value.trim();


    if (
        !fullName ||
        !phoneNumber ||
        !address ||
        !city ||
        !pincode
    ) {

        showAddressError(
            "Please fill in all address fields."
        );

        return;

    }


    const saveButton =
        document.querySelector(
            `#inlineEditForm-${id} .inline-edit-save`
        );


    saveButton.disabled =
        true;


    saveButton.textContent =
        "Updating...";


    try {

        clearAddressError();


        await apiRequest(
            `/addresses/${id}/`,
            {
                method: "PATCH",

                body:
                    JSON.stringify({

                        label:
                            label,

                        full_name:
                            fullName,

                        phone_number:
                            phoneNumber,

                        address:
                            address,

                        city:
                            city,

                        pincode:
                            pincode

                    })
            }
        );


        /*
         * Reload from backend.
         *
         * This restores the normal
         * address card automatically.
         */

        await loadAddresses();


    } catch (error) {

        console.error(
            "Inline address update error:",
            error
        );


        showAddressError(
            error.message ||
            "Unable to update address."
        );


        saveButton.disabled =
            false;


        saveButton.textContent =
            "Update Address";

    }

}


/* =========================================
   CANCEL INLINE EDIT
========================================= */

function cancelInlineEdit(id) {

    /*
     * Re-render the addresses.
     *
     * This removes the edit form and
     * restores the original address card.
     */

    renderAddresses();

}


/* =========================================
   CANCEL ADD ADDRESS FORM
========================================= */

cancelAddressButton.addEventListener(
    "click",
    function () {

        closeAddressForm();

    }
);


function closeAddressForm() {

    addressForm.reset();


    addressLabel.value =
        "HOME";


    addressFormCard.style.display =
        "none";

}


/* =========================================
   SAVE NEW ADDRESS
========================================= */

addressForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        clearAddressError();


        const data = {

            label:
                addressLabel.value,

            full_name:
                fullName.value.trim(),

            phone_number:
                phoneNumber.value.trim(),

            address:
                addressInput.value.trim(),

            city:
                city.value.trim(),

            pincode:
                pincode.value.trim()

        };


        /* =================================
           BASIC VALIDATION
        ================================= */

        if (
            !data.full_name ||
            !data.phone_number ||
            !data.address ||
            !data.city ||
            !data.pincode
        ) {

            showAddressError(
                "Please fill in all address fields."
            );

            return;

        }


        saveAddressButton.disabled =
            true;


        saveAddressButton.textContent =
            "Saving...";


        try {

            await apiRequest(
                "/addresses/",
                {
                    method: "POST",

                    body:
                        JSON.stringify(data)
                }
            );


            /*
             * Reload addresses from backend.
             */

            await loadAddresses();


            closeAddressForm();


        } catch (error) {

            console.error(
                "Address save error:",
                error
            );


            showAddressError(
                error.message ||
                "Unable to save address."
            );

        } finally {

            saveAddressButton.disabled =
                false;


            saveAddressButton.textContent =
                "Save Address";

        }

    }
);


/* =========================================
   SET DEFAULT ADDRESS
========================================= */

async function setDefaultAddress(id) {

    try {

        clearAddressError();


        await apiRequest(
            `/addresses/${id}/`,
            {
                method: "PATCH",

                body:
                    JSON.stringify({
                        is_default: true
                    })
            }
        );


        await loadAddresses();


    } catch (error) {

        console.error(
            "Default address error:",
            error
        );


        showAddressError(
            error.message ||
            "Unable to set default address."
        );

    }

}


/* =========================================
   OPEN DELETE MODAL
========================================= */

function deleteAddress(id) {

    addressToDelete =
        id;


    deleteModal.style.display =
        "flex";

}


/* =========================================
   CANCEL DELETE
========================================= */

cancelDeleteButton.addEventListener(
    "click",
    function () {

        closeDeleteModal();

    }
);


/* =========================================
   CONFIRM DELETE
========================================= */

confirmDeleteButton.addEventListener(
    "click",
    async function () {

        if (!addressToDelete) {

            return;

        }


        confirmDeleteButton.disabled =
            true;


        confirmDeleteButton.textContent =
            "Deleting...";


        try {

            clearAddressError();


            await apiRequest(
                `/addresses/${addressToDelete}/`,
                {
                    method: "DELETE"
                }
            );


            closeDeleteModal();


            await loadAddresses();


        } catch (error) {

            console.error(
                "Address delete error:",
                error
            );


            closeDeleteModal();


            showAddressError(
                error.message ||
                "Unable to delete address."
            );

        } finally {

            confirmDeleteButton.disabled =
                false;


            confirmDeleteButton.textContent =
                "Delete Address";

        }

    }
);


/* =========================================
   CLOSE DELETE MODAL
========================================= */

function closeDeleteModal() {

    addressToDelete =
        null;


    deleteModal.style.display =
        "none";

}


/* =========================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================= */

deleteModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            deleteModal
        ) {

            closeDeleteModal();

        }

    }
);


/* =========================================
   CLOSE MODAL WITH ESCAPE
========================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            deleteModal.style.display === "flex"
        ) {

            closeDeleteModal();

        }

    }
);


/* =========================================
   ADDRESS LABEL
========================================= */

function getAddressLabel(label) {

    const labels = {

        HOME:
            "Home",

        WORK:
            "Work",

        OTHER:
            "Other"

    };


    return labels[label] ||
        label ||
        "Address";

}


/* =========================================
   ADDRESS ICON
========================================= */

function getAddressIcon(label) {

    if (label === "HOME") {

        return "🏠";

    }


    if (label === "WORK") {

        return "💼";

    }


    return "📍";

}


/* =========================================
   SHOW ERROR
========================================= */

function showAddressError(message) {

    addressError.textContent =
        message;


    addressError.style.display =
        "block";

}


/* =========================================
   CLEAR ERROR
========================================= */

function clearAddressError() {

    addressError.textContent =
        "";


    addressError.style.display =
        "none";

}


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================
   INITIAL LOAD
========================================= */

loadAddresses();