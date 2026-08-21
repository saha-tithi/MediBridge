/* =========================================
   CHECKOUT ELEMENTS
========================================= */

const addressList =
    document.getElementById("addressList");

const addAddressButton =
    document.getElementById("addAddressButton");

const newAddressForm =
    document.getElementById("newAddressForm");

const cancelAddressButton =
    document.getElementById("cancelAddressButton");

const cancelAddressButtonBottom =
    document.getElementById(
        "cancelAddressButtonBottom"
    );

const saveAddressButton =
    document.getElementById(
        "saveAddressButton"
    );

const proceedButton =
    document.getElementById(
        "proceedButton"
    );

const addressFormError =
    document.getElementById(
        "addressFormError"
    );



/* =========================================
   STATE
========================================= */

let addresses = [];

let selectedAddressId = null;

let editingAddressId = null;



/* =========================================
   LOAD ADDRESSES
========================================= */

async function loadAddresses() {

    addressList.innerHTML = `

        <div class="address-loading">

            <div class="loading-circle"></div>

            <p>
                Loading addresses...
            </p>

        </div>

    `;


    try {

        const response =
            await apiRequest(
                "/addresses/",
                {
                    method: "GET"
                }
            );


        addresses = response;


        const defaultAddress =
            addresses.find(
                function (address) {

                    return address.is_default;

                }
            );


        if (defaultAddress) {

            selectedAddressId =
                defaultAddress.id;

        }

        else if (addresses.length > 0) {

            selectedAddressId =
                addresses[0].id;

        }


        renderAddresses();


    } catch (error) {

        console.error(
            "Address loading error:",
            error
        );


        addressList.innerHTML = `

            <div class="address-error">

                <p>
                    Unable to load your saved addresses.
                </p>

                <small>
                    ${escapeHTML(
                        error.message
                    )}
                </small>

            </div>

        `;


        proceedButton.disabled = true;

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

        addressList.innerHTML = `

            <div class="no-addresses">

                <div class="no-address-icon">
                    +
                </div>

                <p>
                    You don't have any saved addresses yet.
                </p>

            </div>

        `;


        proceedButton.disabled = true;

        return;

    }


    addressList.innerHTML =
        addresses
            .map(
                function (address) {

                    return createAddressHTML(
                        address
                    );

                }
            )
            .join("");


    updateProceedButton();

}



/* =========================================
   CREATE ADDRESS HTML
========================================= */

function createAddressHTML(address) {

    const isSelected =
        String(address.id) ===
        String(selectedAddressId);


    return `

        <article
            class="
                address-card
                ${isSelected ? "selected" : ""}
            "
            data-address-id="${address.id}"
        >

            <label class="address-select">

                <input
                    type="radio"
                    name="selectedAddress"
                    value="${address.id}"
                    ${isSelected ? "checked" : ""}
                >

                <span class="custom-radio"></span>


                <div class="address-content">

                    <div class="address-title-row">

                        <strong>
                            ${escapeHTML(
                                getAddressLabel(
                                    address.label
                                )
                            )}
                        </strong>

                    </div>


                    <p>
                        ${escapeHTML(
                            address.full_name
                        )}
                    </p>


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
                        ${escapeHTML(
                            address.phone_number
                        )}
                    </p>

                </div>

            </label>


            <div class="address-actions">

                <button
                    type="button"
                    class="edit-address"
                    data-address-id="${address.id}"
                >
                    Edit
                </button>


                <button
                    type="button"
                    class="delete-address"
                    data-address-id="${address.id}"
                >
                    Delete
                </button>

            </div>

        </article>

    `;

}



/* =========================================
   ADDRESS LABEL
========================================= */

function getAddressLabel(label) {

    const labels = {

        HOME: "Home",

        WORK: "Work",

        OTHER: "Other"

    };


    return labels[label] || label;

}



/* =========================================
   SELECT ADDRESS
========================================= */

addressList.addEventListener(
    "change",
    function (event) {

        if (
            event.target.name !==
            "selectedAddress"
        ) {

            return;

        }


        selectedAddressId =
            event.target.value;


        renderAddresses();

    }
);



/* =========================================
   ADDRESS ACTIONS
========================================= */

addressList.addEventListener(
    "click",
    function (event) {

        const deleteButton =
            event.target.closest(
                ".delete-address"
            );


        if (deleteButton) {

            deleteAddress(
                deleteButton.dataset.addressId
            );

            return;

        }


        const editButton =
            event.target.closest(
                ".edit-address"
            );


        if (editButton) {

            editAddress(
                editButton.dataset.addressId
            );

        }

    }
);



/* =========================================
   SHOW ADD ADDRESS FORM
========================================= */

function showAddressForm() {

    editingAddressId = null;


    newAddressForm.style.display =
        "block";


    addAddressButton.style.display =
        "none";


    addressFormError.style.display =
        "none";


    /*
     * Make sure this is a fresh
     * Add Address form.
     */

    clearAddressForm();

}



/* =========================================
   HIDE ADDRESS FORM
========================================= */

function hideAddressForm() {

    newAddressForm.style.display =
        "none";


    addAddressButton.style.display =
        "flex";


    clearAddressForm();

}



/* =========================================
   CLEAR FORM
========================================= */

function clearAddressForm() {

    document.getElementById(
        "fullName"
    ).value = "";


    document.getElementById(
        "phoneNumber"
    ).value = "";


    document.getElementById(
        "deliveryAddress"
    ).value = "";


    document.getElementById(
        "city"
    ).value = "";


    document.getElementById(
        "pincode"
    ).value = "";


    document.getElementById(
        "isDefaultAddress"
    ).checked = false;


    const homeOption =
        document.querySelector(
            'input[name="address_label"][value="Home"]'
        );


    if (homeOption) {

        homeOption.checked = true;

    }


    addressFormError.style.display =
        "none";

}



/* =========================================
   SAVE ADDRESS
========================================= */

async function saveAddress() {

    const fullName =
        document.getElementById(
            "fullName"
        ).value.trim();


    const phoneNumber =
        document.getElementById(
            "phoneNumber"
        ).value.trim();


    const address =
        document.getElementById(
            "deliveryAddress"
        ).value.trim();


    const city =
        document.getElementById(
            "city"
        ).value.trim();


    const pincode =
        document.getElementById(
            "pincode"
        ).value.trim();


    const isDefault =
        document.getElementById(
            "isDefaultAddress"
        ).checked;


    const selectedLabel =
        document.querySelector(
            'input[name="address_label"]:checked'
        ).value;



    /* =====================================
       VALIDATION
    ===================================== */

    if (
        !fullName ||
        !phoneNumber ||
        !address ||
        !city ||
        !pincode
    ) {

        showAddressError(
            "Please fill in all address details."
        );

        return;

    }


    if (
        !/^\d{6}$/.test(pincode)
    ) {

        showAddressError(
            "Please enter a valid 6-digit pincode."
        );

        return;

    }



    /* =====================================
       PREPARE DATA
    ===================================== */

    const addressData = {

        label:
            selectedLabel === "Home"
                ? "HOME"
                : selectedLabel === "Work"
                    ? "WORK"
                    : "OTHER",

        full_name:
            fullName,

        phone_number:
            phoneNumber,

        address:
            address,

        city:
            city,

        pincode:
            pincode,

        is_default:
            isDefault

    };



    /* =====================================
       BUTTON STATE
    ===================================== */

    saveAddressButton.disabled =
        true;


    saveAddressButton.textContent =
        editingAddressId
            ? "Saving Changes..."
            : "Saving...";



    try {

        let response;



        /* =================================
           EDIT EXISTING ADDRESS
        ================================= */

        if (editingAddressId) {

            response =
                await apiRequest(
                    `/addresses/${editingAddressId}/`,
                    {
                        method: "PATCH",

                        body:
                            JSON.stringify(
                                addressData
                            )
                    }
                );


            addresses =
                addresses.map(
                    function (address) {

                        if (
                            String(address.id) ===
                            String(editingAddressId)
                        ) {

                            return response;

                        }

                        return address;

                    }
                );


            selectedAddressId =
                response.id;


            console.log(
                "Address updated:",
                response
            );

        }



        /* =================================
           CREATE NEW ADDRESS
        ================================= */

        else {

            response =
                await apiRequest(
                    "/addresses/",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                addressData
                            )
                    }
                );


            addresses.push(
                response
            );


            selectedAddressId =
                response.id;


            console.log(
                "Address created:",
                response
            );

        }



        /* =================================
           RESET EDIT MODE
        ================================= */

        editingAddressId =
            null;


        hideAddressForm();

        renderAddresses();


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



/* =========================================
   DELETE ADDRESS
========================================= */

async function deleteAddress(addressId) {

    try {

        await apiRequest(
            `/addresses/${addressId}/`,
            {
                method: "DELETE"
            }
        );


        addresses =
            addresses.filter(
                function (address) {

                    return String(address.id) !==
                        String(addressId);

                }
            );


        if (
            String(selectedAddressId) ===
            String(addressId)
        ) {

            selectedAddressId = null;

        }


        renderAddresses();


    } catch (error) {

        console.error(
            "Delete address error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete address."
        );

    }

}



/* =========================================
   EDIT ADDRESS
========================================= */

function editAddress(addressId) {

    const address =
        addresses.find(
            function (item) {

                return String(item.id) ===
                    String(addressId);

            }
        );


    if (!address) {

        return;

    }


    /*
     * IMPORTANT:
     * Set edit mode AFTER opening the form.
     */

    newAddressForm.style.display =
        "block";


    addAddressButton.style.display =
        "none";


    addressFormError.style.display =
        "none";


    editingAddressId =
        address.id;



    /* =====================================
       FILL EXISTING DATA
    ===================================== */

    document.getElementById(
        "fullName"
    ).value =
        address.full_name;


    document.getElementById(
        "phoneNumber"
    ).value =
        address.phone_number;


    document.getElementById(
        "deliveryAddress"
    ).value =
        address.address;


    document.getElementById(
        "city"
    ).value =
        address.city;


    document.getElementById(
        "pincode"
    ).value =
        address.pincode;



    const label =
        getAddressLabel(
            address.label
        );


    const labelInput =
        document.querySelector(
            `input[name="address_label"][value="${label}"]`
        );


    if (labelInput) {

        labelInput.checked = true;

    }


    document.getElementById(
        "isDefaultAddress"
    ).checked =
        address.is_default;

}



/* =========================================
   PROCEED
========================================= */

proceedButton.addEventListener(
    "click",
    function () {

        if (!selectedAddressId) {

            return;

        }


        window.location.href =
            "/checkout/review/";

    }
);



/* =========================================
   FORM BUTTONS
========================================= */

addAddressButton.addEventListener(
    "click",
    function () {

        showAddressForm();

    }
);


cancelAddressButton.addEventListener(
    "click",
    function () {

        hideAddressForm();

    }
);


cancelAddressButtonBottom.addEventListener(
    "click",
    function () {

        hideAddressForm();

    }
);


saveAddressButton.addEventListener(
    "click",
    function () {

        saveAddress();

    }
);



/* =========================================
   PROCEED STATE
========================================= */

function updateProceedButton() {

    proceedButton.disabled =
        !selectedAddressId;

}



/* =========================================
   ERROR
========================================= */

function showAddressError(message) {

    addressFormError.textContent =
        message;


    addressFormError.style.display =
        "block";

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