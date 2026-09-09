/* =========================================================
   PHARMACIST MEDICINE DETAIL
========================================================= */

let medicineDetailData = null;


/* =========================================================
   GET MEDICINE ID FROM URL
========================================================= */

function getMedicineIdFromUrl() {

    const pathParts =
        window.location.pathname
            .split("/")
            .filter(Boolean);


    /*
     * Expected URL:
     *
     * /pharmacist/medicines/<uuid>/
     *
     * The UUID is the last part.
     */

    return pathParts[pathParts.length - 1];
}


/* =========================================================
   ELEMENTS
========================================================= */

const medicineDetailName =
    document.getElementById(
        "medicineDetailName"
    );

const medicineDetailSubtitle =
    document.getElementById(
        "medicineDetailSubtitle"
    );

const medicineDetailStatus =
    document.getElementById(
        "medicineDetailStatus"
    );

const medicineDetailLoading =
    document.getElementById(
        "medicineDetailLoading"
    );

const medicineDetailError =
    document.getElementById(
        "medicineDetailError"
    );

const medicineDetailContent =
    document.getElementById(
        "medicineDetailContent"
    );

const medicineDetailImage =
    document.getElementById(
        "medicineDetailImage"
    );

const detailBrandName =
    document.getElementById(
        "detailBrandName"
    );

const detailGenericName =
    document.getElementById(
        "detailGenericName"
    );

const detailStrength =
    document.getElementById(
        "detailStrength"
    );

const detailManufacturer =
    document.getElementById(
        "detailManufacturer"
    );

const detailCategory =
    document.getElementById(
        "detailCategory"
    );

const detailPrescription =
    document.getElementById(
        "detailPrescription"
    );

const medicineDetailDescriptionWrapper =
    document.getElementById(
        "medicineDetailDescriptionWrapper"
    );

const medicineDetailDescription =
    document.getElementById(
        "medicineDetailDescription"
    );

const detailTotalStock =
    document.getElementById(
        "detailTotalStock"
    );

const detailActiveBatches =
    document.getElementById(
        "detailActiveBatches"
    );

const detailExpiringSoon =
    document.getElementById(
        "detailExpiringSoon"
    );

const editMedicineButton =
    document.getElementById(
        "editMedicineButton"
    );

const toggleMedicineButton =
    document.getElementById(
        "toggleMedicineButton"
    );


/* =========================================================
   LOAD MEDICINE
========================================================= */

async function loadMedicineDetail() {

    const medicineId =
        getMedicineIdFromUrl();


    if (!medicineId) {

        showMedicineDetailError(
            "Invalid medicine."
        );

        return;
    }


    showMedicineDetailLoading();


    try {

        const response =
            await apiRequest(
                `/medicine/pharmacist/medicines/${medicineId}/`
            );


        medicineDetailData =
            extractMedicineDetailData(
                response
            );


        if (!medicineDetailData) {

            throw new Error(
                "Medicine details were not found."
            );
        }


        renderMedicineDetail(
            medicineDetailData
        );


        hideMedicineDetailLoading();

    } catch (error) {

        hideMedicineDetailLoading();

        showMedicineDetailError(
            error.message ||
            "Unable to load medicine details."
        );
    }
}


/* =========================================================
   EXTRACT API DATA
========================================================= */

function extractMedicineDetailData(
    response
) {

    if (
        response &&
        response.data &&
        !Array.isArray(response.data)
    ) {

        return response.data;
    }


    if (
        response &&
        response.data &&
        Array.isArray(response.data)
    ) {

        return response.data[0] || null;
    }


    if (
        response &&
        response.id
    ) {

        return response;
    }


    return null;
}


/* =========================================================
   LOADING STATE
========================================================= */

function showMedicineDetailLoading() {

    medicineDetailLoading.style.display =
        "block";

    medicineDetailError.style.display =
        "none";

    medicineDetailContent.style.display =
        "none";
}


function hideMedicineDetailLoading() {

    medicineDetailLoading.style.display =
        "none";
}


/* =========================================================
   ERROR STATE
========================================================= */

function showMedicineDetailError(
    message
) {

    medicineDetailLoading.style.display =
        "none";

    medicineDetailContent.style.display =
        "none";

    medicineDetailError.textContent =
        message;

    medicineDetailError.style.display =
        "block";
}


/* =========================================================
   RENDER MEDICINE DETAIL
========================================================= */

function renderMedicineDetail(
    medicine
) {

    /* =====================================================
       HEADER
    ====================================================== */

    medicineDetailName.textContent =
        medicine.brand_name ||
        "—";


    medicineDetailSubtitle.textContent =
        `${medicine.generic_name || ""}${
            medicine.strength
                ? " · " + medicine.strength
                : ""
        }`;


    /* =====================================================
       STATUS
    ====================================================== */

    if (medicine.is_active) {

        medicineDetailStatus.textContent =
            "Enabled";

        medicineDetailStatus.classList.remove(
            "disabled"
        );

    } else {

        medicineDetailStatus.textContent =
            "Disabled";

        medicineDetailStatus.classList.add(
            "disabled"
        );
    }


    /* =====================================================
       BASIC INFORMATION
    ====================================================== */

    detailBrandName.textContent =
        medicine.brand_name ||
        "—";


    detailGenericName.textContent =
        medicine.generic_name ||
        "—";


    detailStrength.textContent =
        medicine.strength ||
        "—";


    detailManufacturer.textContent =
        medicine.manufacturer ||
        "—";


    detailCategory.textContent =
        medicine.category &&
        medicine.category.name
            ? medicine.category.name
            : "—";


    detailPrescription.textContent =
        medicine.requires_prescription
            ? "Prescription Required"
            : "OTC";


    /* =====================================================
       IMAGE
    ====================================================== */

    medicineDetailImage.innerHTML =
        "";


    if (medicine.image) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            medicine.image;

        image.alt =
            medicine.brand_name ||
            "Medicine";


        medicineDetailImage.appendChild(
            image
        );

    } else {

        const placeholder =
            document.createElement(
                "div"
            );


        placeholder.className =
            "medicine-detail-image-placeholder";


        placeholder.textContent =
            "💊";


        medicineDetailImage.appendChild(
            placeholder
        );
    }


    /* =====================================================
       DESCRIPTION
    ====================================================== */

    if (
        medicine.description &&
        medicine.description.trim()
    ) {

        medicineDetailDescription.textContent =
            medicine.description;


        medicineDetailDescriptionWrapper.style.display =
            "block";

    } else {

        medicineDetailDescriptionWrapper.style.display =
            "none";
    }


    /* =====================================================
       INVENTORY SUMMARY
    ====================================================== */

    const inventories =
        Array.isArray(
            medicine.inventories
        )
            ? medicine.inventories
            : [];


    const totalStock =
        inventories.reduce(
            function (total, inventory) {

                return (
                    total +
                    (Number(
                        inventory.stock
                    ) || 0)
                );
            },
            0
        );


    const activeBatches =
        inventories.filter(
            function (inventory) {

                return (
                    inventory.is_available === true &&
                    Number(inventory.stock) > 0
                );
            }
        ).length;


    const expiringSoon =
        getExpiringSoonCount(
            inventories
        );


    detailTotalStock.textContent =
        totalStock;


    detailActiveBatches.textContent =
        activeBatches;


    detailExpiringSoon.textContent =
        expiringSoon;


    /* =====================================================
       TOGGLE BUTTON
    ====================================================== */

    if (medicine.is_active) {

        toggleMedicineButton.textContent =
            "Disable Medicine";

        toggleMedicineButton.classList.remove(
            "enable"
        );

    } else {

        toggleMedicineButton.textContent =
            "Enable Medicine";

        toggleMedicineButton.classList.add(
            "enable"
        );
    }


    /* =====================================================
       SHOW CONTENT
    ====================================================== */

    medicineDetailContent.style.display =
        "block";
}


/* =========================================================
   EXPIRING SOON
========================================================= */

function getExpiringSoonCount(
    inventories
) {

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const thirtyDaysFromNow =
        new Date(
            today
        );


    thirtyDaysFromNow.setDate(
        thirtyDaysFromNow.getDate() +
        30
    );


    return inventories.filter(
        function (inventory) {

            if (
                !inventory.expiry_date
            ) {

                return false;
            }


            if (
                Number(
                    inventory.stock
                ) <= 0
            ) {

                return false;
            }


            const expiryDate =
                new Date(
                    inventory.expiry_date
                );


            expiryDate.setHours(
                0,
                0,
                0,
                0
            );


            return (
                expiryDate >= today &&
                expiryDate <= thirtyDaysFromNow
            );
        }
    ).length;
}


/* =========================================================
   ENABLE / DISABLE MEDICINE
========================================================= */

toggleMedicineButton.addEventListener(
    "click",
    async function () {

        if (!medicineDetailData) {

            return;
        }


        const currentlyActive =
            medicineDetailData.is_active === true;


        const newStatus =
            !currentlyActive;


        const actionText =
            newStatus
                ? "enable"
                : "disable";


        const confirmed =
            window.confirm(
                `Are you sure you want to ${actionText} this medicine?`
            );


        if (!confirmed) {

            return;
        }


        toggleMedicineButton.disabled =
            true;


        toggleMedicineButton.textContent =
            newStatus
                ? "Enabling..."
                : "Disabling...";


        try {

            const medicineId =
                getMedicineIdFromUrl();


            await apiRequest(
                `/medicine/pharmacist/medicines/${medicineId}/update/`,
                {
                    method: "PATCH",

                    body: JSON.stringify({

                        is_active:
                            newStatus
                    })
                }
            );


            /*
             * Reload the medicine details
             * so the status and button reflect
             * the actual backend value.
             */

            await loadMedicineDetail();


        } catch (error) {

            window.alert(
                error.message ||
                `Unable to ${actionText} medicine.`
            );


            toggleMedicineButton.disabled =
                false;


            toggleMedicineButton.textContent =
                currentlyActive
                    ? "Disable Medicine"
                    : "Enable Medicine";
        }

    }
);


/* =========================================================
   INITIAL LOAD
========================================================= */

loadMedicineDetail();