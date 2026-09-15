
let medicineDetailData = null;



function getMedicineIdFromUrl() {

    const pathParts =
        window.location.pathname
            .split("/")
            .filter(Boolean);

  
    return pathParts[pathParts.length - 1];
}



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


const editMedicineModal =
    document.getElementById(
        "editMedicineModal"
    );

const editMedicineModalOverlay =
    document.getElementById(
        "editMedicineModalOverlay"
    );

const closeEditMedicineButton =
    document.getElementById(
        "closeEditMedicineButton"
    );

const cancelEditMedicineButton =
    document.getElementById(
        "cancelEditMedicineButton"
    );

const editMedicineForm =
    document.getElementById(
        "editMedicineForm"
    );

const editBrandName =
    document.getElementById(
        "editBrandName"
    );

const editGenericName =
    document.getElementById(
        "editGenericName"
    );

const editStrength =
    document.getElementById(
        "editStrength"
    );

const editManufacturer =
    document.getElementById(
        "editManufacturer"
    );

const editCategory =
    document.getElementById(
        "editCategory"
    );

const editPrescription =
    document.getElementById(
        "editPrescription"
    );

const editDescription =
    document.getElementById(
        "editDescription"
    );

const editMedicineMessage =
    document.getElementById(
        "editMedicineMessage"
    );

const saveMedicineButton =
    document.getElementById(
        "saveMedicineButton"
    );


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



function renderMedicineDetail(
    medicine
) {

    medicineDetailName.textContent =
        medicine.brand_name ||
        "—";

    medicineDetailSubtitle.textContent =
        `${medicine.generic_name || ""}${
            medicine.strength
                ? " · " + medicine.strength
                : ""
        }`;



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
                    (
                        Number(
                            inventory.stock
                        ) || 0
                    )
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


    
    medicineDetailContent.style.display =
        "block";
}



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


function openEditMedicineModal() {

    if (!medicineDetailData) {

        return;
    }


    editBrandName.value =
        medicineDetailData.brand_name ||
        "";

    editGenericName.value =
        medicineDetailData.generic_name ||
        "";

    editStrength.value =
        medicineDetailData.strength ||
        "";

    editManufacturer.value =
        medicineDetailData.manufacturer ||
        "";

    editDescription.value =
        medicineDetailData.description ||
        "";

    editPrescription.value =
        medicineDetailData.requires_prescription
            ? "true"
            : "false";


    loadEditCategories();


    editMedicineMessage.textContent =
        "";

    editMedicineMessage.style.display =
        "none";

    editMedicineMessage.classList.remove(
        "error"
    );


    editMedicineModal.style.display =
        "flex";

    document.body.style.overflow =
        "hidden";
}



function closeEditMedicineModal() {

    editMedicineModal.style.display =
        "none";

    document.body.style.overflow =
        "";
}


async function loadEditCategories() {

    editCategory.innerHTML = `
        <option value="">
            Loading categories...
        </option>
    `;

    editCategory.disabled =
        true;

    try {

        const response =
            await apiRequest(
                "/medicine/categories/"
            );

        const categories =
            extractCategoryData(
                response
            );

        editCategory.innerHTML = `
            <option value="">
                Select category
            </option>
        `;

        categories.forEach(
            function (category) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    category.id;

                option.textContent =
                    category.name;

                editCategory.appendChild(
                    option
                );
            }
        );


        if (
            medicineDetailData.category &&
            medicineDetailData.category.id
        ) {

            editCategory.value =
                medicineDetailData.category.id;
        }

        editCategory.disabled =
            false;

    } catch (error) {

        editCategory.innerHTML = `
            <option value="">
                Unable to load categories
            </option>
        `;

        editCategory.disabled =
            true;

        showEditMedicineMessage(
            error.message ||
            "Unable to load categories.",
            true
        );
    }
}



function extractCategoryData(
    response
) {

    if (
        response &&
        Array.isArray(response.data)
    ) {

        return response.data;
    }

    if (
        Array.isArray(response)
    ) {

        return response;
    }

    return [];
}


function showEditMedicineMessage(
    message,
    isError = false
) {

    editMedicineMessage.textContent =
        message;

    editMedicineMessage.style.display =
        "block";

    if (isError) {

        editMedicineMessage.classList.add(
            "error"
        );

    } else {

        editMedicineMessage.classList.remove(
            "error"
        );
    }
}



async function saveMedicineChanges() {

    if (!medicineDetailData) {

        return;
    }

    const medicineId =
        getMedicineIdFromUrl();

    if (!medicineId) {

        showEditMedicineMessage(
            "Invalid medicine.",
            true
        );

        return;
    }


    const requestData = {

        category:
            editCategory.value,

        brand_name:
            editBrandName.value.trim(),

        generic_name:
            editGenericName.value.trim(),

        strength:
            editStrength.value.trim(),

        manufacturer:
            editManufacturer.value.trim(),

        description:
            editDescription.value.trim(),

        requires_prescription:
            editPrescription.value === "true"
    };


  
    if (!requestData.category) {

        showEditMedicineMessage(
            "Please select a category.",
            true
        );

        return;
    }

    if (!requestData.brand_name) {

        showEditMedicineMessage(
            "Brand name is required.",
            true
        );

        return;
    }

    if (!requestData.generic_name) {

        showEditMedicineMessage(
            "Generic name is required.",
            true
        );

        return;
    }

    if (!requestData.strength) {

        showEditMedicineMessage(
            "Strength is required.",
            true
        );

        return;
    }

    if (!requestData.manufacturer) {

        showEditMedicineMessage(
            "Manufacturer is required.",
            true
        );

        return;
    }


   
    saveMedicineButton.disabled =
        true;

    cancelEditMedicineButton.disabled =
        true;

    closeEditMedicineButton.disabled =
        true;

    saveMedicineButton.textContent =
        "Saving...";

    editMedicineMessage.style.display =
        "none";


    try {

        const response =
            await apiRequest(
                `/medicine/pharmacist/medicines/${medicineId}/update/`,
                {
                    method: "PATCH",

                    body:
                        JSON.stringify(
                            requestData
                        )
                }
            );


        const updatedMedicine =
            extractMedicineDetailData(
                response
            );


        if (updatedMedicine) {

            medicineDetailData =
                updatedMedicine;
        }


        closeEditMedicineModal();


        await loadMedicineDetail();


        
        showMedicineToast(
            "Medicine updated successfully.",
            "success"
        );


    } catch (error) {

        showEditMedicineMessage(
            error.message ||
            "Unable to update medicine.",
            true
        );

    } finally {

        saveMedicineButton.disabled =
            false;

        cancelEditMedicineButton.disabled =
            false;

        closeEditMedicineButton.disabled =
            false;

        saveMedicineButton.textContent =
            "Save Changes";
    }
}



editMedicineButton.addEventListener(
    "click",
    function () {

        openEditMedicineModal();

    }
);



closeEditMedicineButton.addEventListener(
    "click",
    function () {

        closeEditMedicineModal();

    }
);


cancelEditMedicineButton.addEventListener(
    "click",
    function () {

        closeEditMedicineModal();

    }
);



editMedicineModalOverlay.addEventListener(
    "click",
    function () {

        closeEditMedicineModal();

    }
);



document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            editMedicineModal.style.display === "flex"
        ) {

            closeEditMedicineModal();
        }
    }
);



editMedicineForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        saveMedicineChanges();

    }
);



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
            await showMedicineConfirm(
                newStatus
                    ? "Enable Medicine?"
                    : "Disable Medicine?",
                newStatus
                    ? "This medicine will become available to customers again."
                    : "This medicine will no longer be visible to customers."
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


            await loadMedicineDetail();


            showMedicineToast(
                newStatus
                    ? "Medicine enabled successfully."
                    : "Medicine disabled successfully.",
                "success"
            );


        } catch (error) {

            showMedicineToast(
                error.message ||
                `Unable to ${actionText} medicine.`,
                "error"
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



function showMedicineConfirm(
    title,
    message
) {

    return new Promise(
        function (resolve) {

            const existingDialog =
                document.getElementById(
                    "medicineConfirmDialog"
                );

            if (existingDialog) {

                existingDialog.remove();
            }


            const dialog =
                document.createElement(
                    "div"
                );

            dialog.id =
                "medicineConfirmDialog";

            dialog.className =
                "medicine-confirm-dialog";


            dialog.innerHTML = `

                <div class="medicine-confirm-overlay"></div>

                <div
                    class="medicine-confirm-card"
                    role="dialog"
                    aria-modal="true"
                >

                    <div class="medicine-confirm-icon">
                        <span>!</span>
                    </div>

                    <div class="medicine-confirm-content">

                        <h3>
                            ${escapeMedicineHtml(title)}
                        </h3>

                        <p>
                            ${escapeMedicineHtml(message)}
                        </p>

                    </div>

                    <div class="medicine-confirm-actions">

                        <button
                            type="button"
                            class="medicine-confirm-cancel"
                            id="medicineConfirmCancel"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            class="medicine-confirm-primary"
                            id="medicineConfirmProceed"
                        >
                            Confirm
                        </button>

                    </div>

                </div>
            `;


            document.body.appendChild(
                dialog
            );


            document.body.style.overflow =
                "hidden";


            const cancelButton =
                document.getElementById(
                    "medicineConfirmCancel"
                );

            const proceedButton =
                document.getElementById(
                    "medicineConfirmProceed"
                );

            const overlay =
                dialog.querySelector(
                    ".medicine-confirm-overlay"
                );


            function finish(
                result
            ) {

                dialog.remove();

                document.body.style.overflow =
                    "";

                resolve(result);
            }


            cancelButton.addEventListener(
                "click",
                function () {

                    finish(false);

                }
            );


            proceedButton.addEventListener(
                "click",
                function () {

                    finish(true);

                }
            );


            overlay.addEventListener(
                "click",
                function () {

                    finish(false);

                }
            );


            function handleEscape(
                event
            ) {

                if (
                    event.key === "Escape"
                ) {

                    document.removeEventListener(
                        "keydown",
                        handleEscape
                    );

                    finish(false);
                }
            }


            document.addEventListener(
                "keydown",
                handleEscape
            );


            proceedButton.focus();
        }
    );
}



function showMedicineToast(
    message,
    type = "success"
) {

    const existingToast =
        document.getElementById(
            "medicineToast"
        );

    if (existingToast) {

        existingToast.remove();
    }


    const toast =
        document.createElement(
            "div"
        );

    toast.id =
        "medicineToast";

    toast.className =
        `medicine-toast ${type}`;


    const icon =
        type === "success"
            ? "✓"
            : "×";


    toast.innerHTML = `

        <span class="medicine-toast-icon">
            ${icon}
        </span>

        <span class="medicine-toast-message">
            ${escapeMedicineHtml(message)}
        </span>

        <button
            type="button"
            class="medicine-toast-close"
            aria-label="Close notification"
        >
            ×
        </button>

    `;


    document.body.appendChild(
        toast
    );


    requestAnimationFrame(
        function () {

            toast.classList.add(
                "show"
            );

        }
    );


    const closeButton =
        toast.querySelector(
            ".medicine-toast-close"
        );


    closeButton.addEventListener(
        "click",
        function () {

            removeMedicineToast(
                toast
            );

        }
    );


    setTimeout(
        function () {

            removeMedicineToast(
                toast
            );

        },
        3500
    );
}



function removeMedicineToast(
    toast
) {

    if (!toast) {

        return;
    }


    toast.classList.remove(
        "show"
    );


    setTimeout(
        function () {

            if (toast.parentNode) {

                toast.remove();
            }

        },
        250
    );
}


function escapeMedicineHtml(
    value
) {

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



loadMedicineDetail();