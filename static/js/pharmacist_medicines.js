/* =========================================================
   PHARMACIST MEDICINES
========================================================= */

let medicinesData = [];


/* =========================================================
   ELEMENTS
========================================================= */

const medicineSearch =
    document.getElementById("medicineSearch");

const medicineCategoryFilter =
    document.getElementById("medicineCategoryFilter");

const medicinePrescriptionFilter =
    document.getElementById("medicinePrescriptionFilter");

const medicineStatusFilter =
    document.getElementById("medicineStatusFilter");

const medicineTableBody =
    document.getElementById("medicineTableBody");

const medicineTableWrapper =
    document.getElementById("medicineTableWrapper");

const medicineLoading =
    document.getElementById("medicineLoading");

const medicineError =
    document.getElementById("medicineError");

const medicineEmpty =
    document.getElementById("medicineEmpty");

const medicineResults =
    document.getElementById("medicineResults");

const totalMedicines =
    document.getElementById("totalMedicines");

const enabledMedicines =
    document.getElementById("enabledMedicines");

const disabledMedicines =
    document.getElementById("disabledMedicines");

const prescriptionMedicines =
    document.getElementById("prescriptionMedicines");


/* =========================================================
   LOAD MEDICINES
========================================================= */

async function loadMedicines() {

    showMedicineLoading();

    try {

        const response =
            await apiRequest(
                "/medicine/pharmacist/medicines/"
            );

        medicinesData =
            extractMedicineData(response);

        updateMedicineStatistics();

        populateCategoryFilter();

        renderMedicines();

        hideMedicineLoading();

    } catch (error) {

        hideMedicineLoading();

        showMedicineError(
            error.message ||
            "Unable to load medicines."
        );
    }
}


/* =========================================================
   EXTRACT API DATA
========================================================= */

function extractMedicineData(response) {

    if (Array.isArray(response)) {

        return response;
    }


    if (
        response &&
        Array.isArray(response.data)
    ) {

        return response.data;
    }


    if (
        response &&
        response.data &&
        Array.isArray(response.data.results)
    ) {

        return response.data.results;
    }


    if (
        response &&
        Array.isArray(response.results)
    ) {

        return response.results;
    }


    return [];
}


/* =========================================================
   LOADING STATE
========================================================= */

function showMedicineLoading() {

    medicineLoading.style.display =
        "flex";

    medicineError.style.display =
        "none";

    medicineEmpty.style.display =
        "none";

    medicineTableWrapper.style.display =
        "none";

    medicineResults.style.display =
        "none";
}


function hideMedicineLoading() {

    medicineLoading.style.display =
        "none";
}


/* =========================================================
   ERROR STATE
========================================================= */

function showMedicineError(message) {

    medicineError.textContent =
        message;

    medicineError.style.display =
        "block";

    medicineTableWrapper.style.display =
        "none";

    medicineEmpty.style.display =
        "none";

    medicineResults.style.display =
        "none";
}


/* =========================================================
   STATISTICS
========================================================= */

function updateMedicineStatistics() {

    const total =
        medicinesData.length;


    const enabled =
        medicinesData.filter(
            function (medicine) {

                return medicine.is_active === true;
            }
        ).length;


    const disabled =
        medicinesData.filter(
            function (medicine) {

                return medicine.is_active === false;
            }
        ).length;


    const prescriptionRequired =
        medicinesData.filter(
            function (medicine) {

                return (
                    medicine.requires_prescription === true
                );
            }
        ).length;


    totalMedicines.textContent =
        total;

    enabledMedicines.textContent =
        enabled;

    disabledMedicines.textContent =
        disabled;

    prescriptionMedicines.textContent =
        prescriptionRequired;
}


/* =========================================================
   CATEGORY FILTER
========================================================= */

function populateCategoryFilter() {

    const categories = [];


    medicinesData.forEach(
        function (medicine) {

            if (
                medicine.category &&
                medicine.category.id !== undefined
            ) {

                const categoryId =
                    String(
                        medicine.category.id
                    );


                const categoryName =
                    medicine.category.name ||
                    "Unknown";


                const alreadyExists =
                    categories.some(
                        function (category) {

                            return (
                                category.id ===
                                categoryId
                            );
                        }
                    );


                if (!alreadyExists) {

                    categories.push({
                        id: categoryId,
                        name: categoryName
                    });
                }
            }
        }
    );


    categories.sort(
        function (a, b) {

            return a.name.localeCompare(
                b.name
            );
        }
    );


    const currentValue =
        medicineCategoryFilter.value;


    medicineCategoryFilter.innerHTML = `
        <option value="ALL">
            All Categories
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


            medicineCategoryFilter.appendChild(
                option
            );
        }
    );


    const categoryStillExists =
        categories.some(
            function (category) {

                return (
                    category.id ===
                    currentValue
                );
            }
        );


    if (
        currentValue !== "ALL" &&
        categoryStillExists
    ) {

        medicineCategoryFilter.value =
            currentValue;
    }
}


/* =========================================================
   RENDER MEDICINES
========================================================= */

function renderMedicines() {

    const searchTerm =
        medicineSearch.value
            .trim()
            .toLowerCase();


    const categoryFilter =
        medicineCategoryFilter.value;


    const prescriptionFilter =
        medicinePrescriptionFilter.value;


    const statusFilter =
        medicineStatusFilter.value;


    const filteredMedicines =
        medicinesData.filter(
            function (medicine) {

                const brandName =
                    String(
                        medicine.brand_name || ""
                    ).toLowerCase();


                const genericName =
                    String(
                        medicine.generic_name || ""
                    ).toLowerCase();


                const manufacturer =
                    String(
                        medicine.manufacturer || ""
                    ).toLowerCase();


                const strength =
                    String(
                        medicine.strength || ""
                    ).toLowerCase();


                const matchesSearch =
                    brandName.includes(searchTerm) ||
                    genericName.includes(searchTerm) ||
                    manufacturer.includes(searchTerm) ||
                    strength.includes(searchTerm);


                let matchesCategory =
                    true;


                if (
                    categoryFilter !== "ALL"
                ) {

                    matchesCategory =
                        medicine.category &&
                        String(
                            medicine.category.id
                        ) ===
                        String(
                            categoryFilter
                        );
                }


                let matchesPrescription =
                    true;


                if (
                    prescriptionFilter ===
                    "PRESCRIPTION"
                ) {

                    matchesPrescription =
                        medicine.requires_prescription === true;

                } else if (
                    prescriptionFilter ===
                    "OTC"
                ) {

                    matchesPrescription =
                        medicine.requires_prescription === false;
                }


                let matchesStatus =
                    true;


                if (
                    statusFilter ===
                    "ENABLED"
                ) {

                    matchesStatus =
                        medicine.is_active === true;

                } else if (
                    statusFilter ===
                    "DISABLED"
                ) {

                    matchesStatus =
                        medicine.is_active === false;
                }


                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesPrescription &&
                    matchesStatus
                );
            }
        );


    medicineTableBody.innerHTML =
        "";


    if (
        filteredMedicines.length === 0
    ) {

        medicineTableWrapper.style.display =
            "none";

        medicineEmpty.style.display =
            "block";

        medicineResults.style.display =
            "none";

        return;
    }


    medicineEmpty.style.display =
        "none";

    medicineTableWrapper.style.display =
        "block";

    medicineResults.style.display =
        "block";


    filteredMedicines.forEach(
        function (medicine) {

            const row =
                document.createElement("tr");


            const stock =
                Number(
                    medicine.available_stock || 0
                );


            let stockClass =
                "medicine-stock-value";


            if (stock === 0) {

                stockClass +=
                    " out";
            }


            const prescriptionHtml =
                medicine.requires_prescription
                    ? `
                        <span
                            class="medicine-prescription-badge required"
                        >
                            Required
                        </span>
                    `
                    : `
                        <span
                            class="medicine-prescription-badge otc"
                        >
                            OTC
                        </span>
                    `;


            const statusHtml =
                medicine.is_active
                    ? `
                        <span
                            class="medicine-status enabled"
                        >
                            Enabled
                        </span>
                    `
                    : `
                        <span
                            class="medicine-status disabled"
                        >
                            Disabled
                        </span>
                    `;


            row.innerHTML = `

                <td>

                    <div
                        class="pharmacist-medicine-table-info"
                    >

                        <strong>
                            ${escapeMedicineHtml(
                                medicine.brand_name ||
                                "—"
                            )}
                        </strong>

                        <span>

                            ${escapeMedicineHtml(
                                medicine.generic_name ||
                                ""
                            )}

                            ${
                                medicine.strength
                                    ? " · " +
                                      escapeMedicineHtml(
                                          medicine.strength
                                      )
                                    : ""
                            }

                        </span>

                    </div>

                </td>


                <td>

                    <span
                        class="medicine-category-text"
                    >
                        ${escapeMedicineHtml(
                            medicine.category &&
                            medicine.category.name
                                ? medicine.category.name
                                : "—"
                        )}
                    </span>

                </td>


                <td>

                    ${prescriptionHtml}

                </td>


                <td>

                    <span
                        class="${stockClass}"
                    >
                        ${stock}
                    </span>

                </td>


                <td>

                    ${statusHtml}

                </td>


                <td>

                    <button
                        type="button"
                        class="medicine-view-button"
                        data-id="${medicine.id}"
                    >
                        View
                    </button>

                </td>

            `;


            medicineTableBody.appendChild(
                row
            );
        }
    );


    /* =====================================================
       VIEW MEDICINE
    ====================================================== */

    document
        .querySelectorAll(
            ".medicine-view-button"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const medicineId =
                            button.dataset.id;


                        if (!medicineId) {

                            return;
                        }


                        window.location.href =
                            `/pharmacist/medicines/${medicineId}/`;
                    }
                );
            }
        );


    medicineResults.textContent =
        `${filteredMedicines.length} medicine${
            filteredMedicines.length === 1
                ? ""
                : "s"
        } found`;
}


/* =========================================================
   SEARCH / FILTER EVENTS
========================================================= */

medicineSearch.addEventListener(
    "input",
    renderMedicines
);


medicineCategoryFilter.addEventListener(
    "change",
    renderMedicines
);


medicinePrescriptionFilter.addEventListener(
    "change",
    renderMedicines
);


medicineStatusFilter.addEventListener(
    "change",
    renderMedicines
);


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeMedicineHtml(value) {

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


/* =========================================================
   INITIAL LOAD
========================================================= */

loadMedicines();