/* =========================================
   UPLOAD PRESCRIPTION
========================================= */


/* =========================================
   ELEMENTS
========================================= */

const prescriptionFile =
    document.getElementById(
        "prescriptionFile"
    );

const uploadButton =
    document.getElementById(
        "uploadButton"
    );

const uploadArea =
    document.getElementById(
        "uploadArea"
    );

const selectedFile =
    document.getElementById(
        "selectedFile"
    );

const selectedFileName =
    document.getElementById(
        "selectedFileName"
    );

const selectedFileSize =
    document.getElementById(
        "selectedFileSize"
    );

const removeFileButton =
    document.getElementById(
        "removeFileButton"
    );

const uploadStatus =
    document.getElementById(
        "uploadStatus"
    );

const prescriptionError =
    document.getElementById(
        "prescriptionError"
    );

const uploadedPrescription =
    document.getElementById(
        "uploadedPrescription"
    );

const uploadedFileName =
    document.getElementById(
        "uploadedFileName"
    );

const extractButton =
    document.getElementById(
        "extractButton"
    );

const extractStatus =
    document.getElementById(
        "extractStatus"
    );

const ocrResult =
    document.getElementById(
        "ocrResult"
    );

const ocrText =
    document.getElementById(
        "ocrText"
    );

const extractedMedicinesCard =
    document.getElementById(
        "extractedMedicinesCard"
    );

const extractedMedicines =
    document.getElementById(
        "extractedMedicines"
    );


/* =========================================
   STATE
========================================= */

let selectedPrescription = null;

let uploadedPrescriptionId = null;


/* =========================================
   FILE SELECT
========================================= */

prescriptionFile.addEventListener(
    "change",
    function () {

        const file =
            this.files[0];


        if (!file) {

            return;

        }


        validateSelectedFile(file);

    }
);


/* =========================================
   VALIDATE FILE
========================================= */

function validateSelectedFile(file) {

    clearPrescriptionError();


    const allowedTypes = [

        "image/jpeg",

        "image/png",

        "application/pdf"

    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        showPrescriptionError(
            "Please select a JPG, PNG, or PDF file."
        );


        resetFileSelection();

        return;

    }


    const maxSize =
        10 * 1024 * 1024;


    if (
        file.size > maxSize
    ) {

        showPrescriptionError(
            "Prescription file must be smaller than 10 MB."
        );


        resetFileSelection();

        return;

    }


    selectedPrescription =
        file;


    showSelectedFile(file);

}


/* =========================================
   SHOW SELECTED FILE
========================================= */

function showSelectedFile(file) {

    selectedFileName.textContent =
        file.name;


    selectedFileSize.textContent =
        formatFileSize(
            file.size
        );


    selectedFile.style.display =
        "flex";


    uploadButton.disabled =
        false;

}


/* =========================================
   REMOVE FILE
========================================= */

removeFileButton.addEventListener(
    "click",
    function () {

        resetFileSelection();

    }
);


function resetFileSelection() {

    selectedPrescription =
        null;


    prescriptionFile.value =
        "";


    selectedFile.style.display =
        "none";


    uploadButton.disabled =
        true;

}


/* =========================================
   UPLOAD
========================================= */

uploadButton.addEventListener(
    "click",
    async function () {

        if (
            !selectedPrescription
        ) {

            return;

        }


        clearPrescriptionError();


        uploadButton.disabled =
            true;


        uploadStatus.style.display =
            "flex";


        const formData =
            new FormData();


        formData.append(
            "prescription",
            selectedPrescription
        );


        try {

            const response =
                await apiRequest(
                    "/prescriptions/upload/",
                    {
                        method: "POST",

                        body: formData
                    }
                );


            const prescription =
                response.data ||
                response;


            uploadedPrescriptionId =
                prescription.id;


            uploadedFileName.textContent =
                selectedPrescription.name;


            uploadedPrescription.style.display =
                "block";


            uploadStatus.style.display =
                "none";


            uploadArea.style.display =
                "none";


            selectedFile.style.display =
                "none";


            selectedPrescription =
                null;


            uploadedPrescription.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });


        } catch (error) {

            console.error(
                "Prescription upload error:",
                error
            );


            uploadStatus.style.display =
                "none";


            uploadButton.disabled =
                false;


            showPrescriptionError(
                error.message ||
                "Unable to upload prescription."
            );

        }

    }
);


/* =========================================
   EXTRACT MEDICINES
========================================= */

extractButton.addEventListener(
    "click",
    async function () {

        if (
            !uploadedPrescriptionId
        ) {

            return;

        }


        clearPrescriptionError();


        extractButton.disabled =
            true;


        extractStatus.style.display =
            "flex";


        try {

            const response =
                await apiRequest(
                    `/prescriptions/${uploadedPrescriptionId}/extract/`,
                    {
                        method: "POST"
                    }
                );


            const result =
                response.data ||
                response;


            /*
             * Backend response:
             *
             * {
             *     extracted_text: "...",
             *     medicines: [...]
             * }
             */


            /* ================================
               SHOW RAW OCR TEXT
            ================================= */

            ocrText.textContent =
                result.extracted_text ||
                "No text could be extracted.";


            ocrResult.style.display =
                "block";


            /* ================================
               STOP EXTRACTION LOADING
            ================================= */

            extractStatus.style.display =
                "none";


            /* ================================
               SHOW MEDICINES
            ================================= */

            renderExtractedMedicines(
                result.medicines ||
                []
            );


        } catch (error) {

            console.error(
                "Prescription extraction error:",
                error
            );


            extractStatus.style.display =
                "none";


            extractButton.disabled =
                false;


            showPrescriptionError(
                error.message ||
                "Unable to identify medicines."
            );

        }

    }
);


/* =========================================
   RENDER EXTRACTED MEDICINES
========================================= */

function renderExtractedMedicines(
    medicines
) {

    extractedMedicines.innerHTML =
        "";


    /* =====================================
       NO MEDICINES
    ====================================== */

    if (
        !medicines ||
        medicines.length === 0
    ) {

        extractedMedicines.innerHTML = `

            <div class="extracted-medicine">

                <div class="medicine-result-info">

                    <strong>
                        No medicines were identified.
                    </strong>

                    <p>
                        The prescription text could not
                        be matched with medicines in the
                        MediBridge database.
                    </p>

                </div>

            </div>

        `;


        extractedMedicinesCard.style.display =
            "block";


        extractedMedicinesCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        return;

    }


    /* =====================================
       MEDICINE RESULTS
    ====================================== */

    extractedMedicines.innerHTML =
        medicines
            .map(
                function (medicine) {

                    /*
                     * Backward compatibility
                     * if backend returns a string.
                     */

                    if (
                        typeof medicine ===
                        "string"
                    ) {

                        return `

                            <article
                                class="extracted-medicine"
                            >

                                <div
                                    class="medicine-result-info"
                                >

                                    <strong>
                                        ${escapeHTML(
                                            medicine
                                        )}
                                    </strong>

                                </div>

                            </article>

                        `;

                    }


                    const medicineId =
                        medicine.medicine_id ||
                        "";


                    const brandName =
                        medicine.brand_name ||
                        "";


                    const genericName =
                        medicine.generic_name ||
                        "";


                    const strength =
                        medicine.strength ||
                        "";


                    const confidence =
                        medicine.confidence ??
                        0;


                    /*
                     * Availability will be
                     * supplied by the backend
                     * once inventory checking
                     * is implemented.
                     *
                     * For now, if backend does
                     * not send it, we treat it
                     * as NOT_AVAILABLE.
                     */

                    const availability =
                        medicine.availability ||
                        "NOT_AVAILABLE";


                    let availabilityText =
                        "Not available at MediBridge";


                    let availabilityClass =
                        "availability-not-available";


                    let canSelect =
                        false;


                    /* =================================
                       AVAILABLE
                    ================================= */

                    if (
                        availability ===
                        "AVAILABLE"
                    ) {

                        availabilityText =
                            "Available";


                        availabilityClass =
                            "availability-available";


                        canSelect =
                            true;

                    }


                    /* =================================
                       OUT OF STOCK
                    ================================= */

                    else if (
                        availability ===
                        "OUT_OF_STOCK"
                    ) {

                        availabilityText =
                            "Currently out of stock";


                        availabilityClass =
                            "availability-out-of-stock";

                    }


                    /* =================================
                       NOT AVAILABLE
                    ================================= */

                    else {

                        availabilityText =
                            "Not available at MediBridge";


                        availabilityClass =
                            "availability-not-available";

                    }


                    return `

                        <article
                            class="
                                extracted-medicine
                                ${availabilityClass}
                            "
                            data-medicine-id="${escapeHTML(
                                medicineId
                            )}"
                        >

                            <div
                                class="medicine-result-info"
                            >

                                <strong>
                                    ${escapeHTML(
                                        brandName ||
                                        genericName ||
                                        "Unknown medicine"
                                    )}
                                </strong>


                                ${
                                    genericName
                                        ? `
                                            <span>
                                                ${escapeHTML(
                                                    genericName
                                                )}
                                            </span>
                                        `
                                        : ""
                                }


                                ${
                                    strength
                                        ? `
                                            <small>
                                                ${escapeHTML(
                                                    strength
                                                )}
                                            </small>
                                        `
                                        : ""
                                }


                                <small>
                                    Match confidence:
                                    ${escapeHTML(
                                        confidence
                                    )}%
                                </small>


                                <span
                                    class="
                                        medicine-availability
                                        ${availabilityClass}
                                    "
                                >
                                    ${availabilityText}
                                </span>

                            </div>


                            ${
                                canSelect
                                    ? `

                                        <label
                                            class="medicine-select"
                                        >

                                            <input
                                                type="checkbox"
                                                class="medicine-checkbox"
                                                value="${escapeHTML(
                                                    medicineId
                                                )}"
                                            >

                                            <span>
                                                Select
                                            </span>

                                        </label>

                                    `
                                    : `

                                        <span
                                            class="
                                                medicine-unavailable-label
                                            "
                                        >
                                            Unavailable
                                        </span>

                                    `
                            }

                        </article>

                    `;

                }
            )
            .join("");


    extractedMedicinesCard.style.display =
        "block";


    extractedMedicinesCard.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* =========================================
   FILE SIZE
========================================= */

function formatFileSize(bytes) {

    if (
        bytes < 1024
    ) {

        return `${bytes} B`;

    }


    if (
        bytes < 1024 * 1024
    ) {

        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;

    }


    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(1)} MB`;

}


/* =========================================
   ERROR
========================================= */

function showPrescriptionError(
    message
) {

    prescriptionError.textContent =
        message;


    prescriptionError.style.display =
        "block";

}


function clearPrescriptionError() {

    prescriptionError.textContent =
        "";


    prescriptionError.style.display =
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