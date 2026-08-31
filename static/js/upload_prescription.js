/* =========================================
   MEDIBRIDGE
   PRESCRIPTION IDENTIFICATION
========================================= */


/* =========================================
   ELEMENT HELPER
========================================= */

function getElement(id) {
    return document.getElementById(id);
}


/* =========================================
   ELEMENTS
========================================= */

const prescriptionFile =
    getElement("prescriptionFile");

const uploadButton =
    getElement("uploadButton");

const uploadArea =
    getElement("uploadArea");

const selectedFile =
    getElement("selectedFile");

const selectedFileName =
    getElement("selectedFileName");

const selectedFileSize =
    getElement("selectedFileSize");

const removeFileButton =
    getElement("removeFileButton");

const uploadStatus =
    getElement("uploadStatus");

const prescriptionError =
    getElement("prescriptionError");

const uploadedPrescription =
    getElement("uploadedPrescription");

const uploadedFileName =
    getElement("uploadedFileName");

const extractButton =
    getElement("extractButton");

const extractStatus =
    getElement("extractStatus");

const extractedMedicinesCard =
    getElement("extractedMedicinesCard");

const extractedMedicines =
    getElement("extractedMedicines");


/* =========================================
   STATE
========================================= */

let selectedPrescription = null;

let uploadedPrescriptionId = null;


/* =========================================
   CHECK PAGE ELEMENTS
========================================= */

console.log(
    "MediBridge prescription page loaded."
);

console.log(
    "Prescription file:",
    prescriptionFile
);

console.log(
    "Upload button:",
    uploadButton
);

console.log(
    "Extract button:",
    extractButton
);

console.log(
    "Medicines container:",
    extractedMedicines
);


/* =========================================
   FILE SELECTION
========================================= */

if (prescriptionFile) {

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

}


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

    if (selectedFileName) {

        selectedFileName.textContent =
            file.name;
    }


    if (selectedFileSize) {

        selectedFileSize.textContent =
            formatFileSize(
                file.size
            );
    }


    if (selectedFile) {

        selectedFile.style.display =
            "flex";
    }


    if (uploadButton) {

        uploadButton.disabled =
            false;
    }

}


/* =========================================
   REMOVE FILE
========================================= */

if (removeFileButton) {

    removeFileButton.addEventListener(
        "click",
        function () {

            resetFileSelection();

        }
    );

}


function resetFileSelection() {

    selectedPrescription =
        null;


    if (prescriptionFile) {

        prescriptionFile.value =
            "";
    }


    if (selectedFile) {

        selectedFile.style.display =
            "none";
    }


    if (uploadButton) {

        uploadButton.disabled =
            true;
    }

}


/* =========================================
   UPLOAD PRESCRIPTION
========================================= */

if (uploadButton) {

    uploadButton.addEventListener(
        "click",
        async function () {

            if (!selectedPrescription) {

                return;
            }


            clearPrescriptionError();


            uploadButton.disabled =
                true;


            if (uploadStatus) {

                uploadStatus.style.display =
                    "flex";
            }


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


                console.log(
                    "UPLOAD RESPONSE:",
                    response
                );


                /*
                 * Depending on apiRequest(),
                 * response may be:
                 *
                 * {
                 *     id: "..."
                 * }
                 *
                 * OR:
                 *
                 * {
                 *     data: {
                 *         id: "..."
                 *     }
                 * }
                 */


                const prescription =
                    response &&
                    response.data
                        ? response.data
                        : response;


                if (
                    !prescription ||
                    !prescription.id
                ) {

                    throw new Error(
                        "Upload succeeded, but no prescription ID was returned."
                    );
                }


                uploadedPrescriptionId =
                    prescription.id;


                if (uploadedFileName) {

                    uploadedFileName.textContent =
                        selectedPrescription.name;
                }


                if (uploadedPrescription) {

                    uploadedPrescription.style.display =
                        "block";
                }


                if (uploadStatus) {

                    uploadStatus.style.display =
                        "none";
                }


                if (uploadArea) {

                    uploadArea.style.display =
                        "none";
                }


                if (selectedFile) {

                    selectedFile.style.display =
                        "none";
                }


                selectedPrescription =
                    null;


                if (uploadedPrescription) {

                    uploadedPrescription.scrollIntoView({

                        behavior: "smooth",

                        block: "center"

                    });

                }


            } catch (error) {

                console.error(
                    "UPLOAD ERROR:",
                    error
                );


                if (uploadStatus) {

                    uploadStatus.style.display =
                        "none";
                }


                uploadButton.disabled =
                    false;


                showPrescriptionError(
                    error.message ||
                    "Unable to upload prescription."
                );

            }

        }
    );

}


/* =========================================
   IDENTIFY MEDICINES
========================================= */

if (extractButton) {

    extractButton.addEventListener(
        "click",
        async function () {

            if (!uploadedPrescriptionId) {

                showPrescriptionError(
                    "Prescription ID is missing."
                );

                return;
            }


            clearPrescriptionError();


            extractButton.disabled =
                true;


            if (extractStatus) {

                extractStatus.style.display =
                    "flex";
            }


            try {

                console.log(
                    "Starting medicine identification..."
                );


                const response =
                    await apiRequest(
                        `/prescriptions/${uploadedPrescriptionId}/extract/`,
                        {
                            method: "POST"
                        }
                    );


                console.log(
                    "EXTRACTION RESPONSE:",
                    response
                );


                /* =================================
                   GET ACTUAL DATA
                ================================= */


                let result =
                    response;


                /*
                 * Our backend returns:
                 *
                 * {
                 *     success: true,
                 *     message: "...",
                 *     data: {
                 *         extracted_text: "...",
                 *         medicines: [...]
                 *     }
                 * }
                 *
                 * So if data exists, use it.
                 */

                if (
                    response &&
                    response.data
                ) {

                    result =
                        response.data;
                }


                console.log(
                    "ACTUAL RESULT:",
                    result
                );


                /* =================================
                   EXTRACTED TEXT
                ================================= */

                const extractedText =
                    result &&
                    result.extracted_text
                        ? result.extracted_text
                        : "No medicine text could be extracted.";


                /*
                 * IMPORTANT:
                 *
                 * Check the element before
                 * setting textContent.
                 */

                if (ocrTextExists()) {

                    const textElement =
                        getElement("ocrText");


                    textElement.textContent =
                        extractedText;


                    const resultCard =
                        getElement("ocrResult");


                    if (resultCard) {

                        resultCard.style.display =
                            "block";
                    }

                }


                /* =================================
                   MEDICINES
                ================================= */

                const medicines =
                    result &&
                    Array.isArray(
                        result.medicines
                    )
                        ? result.medicines
                        : [];


                console.log(
                    "MEDICINES:",
                    medicines
                );


                renderExtractedMedicines(
                    medicines
                );


                /* =================================
                   STOP LOADING
                ================================= */

                if (extractStatus) {

                    extractStatus.style.display =
                        "none";
                }


            } catch (error) {

                console.error(
                    "EXTRACTION ERROR:",
                    error
                );


                if (extractStatus) {

                    extractStatus.style.display =
                        "none";
                }


                extractButton.disabled =
                    false;


                showPrescriptionError(
                    error.message ||
                    "Unable to identify medicines."
                );

            }

        }
    );

}


/* =========================================
   CHECK OCR ELEMENT
========================================= */

function ocrTextExists() {

    const element =
        getElement("ocrText");


    if (!element) {

        console.warn(
            "ocrText element was not found."
        );

        return false;
    }


    return true;
}


/* =========================================
   RENDER MEDICINES
========================================= */

function renderExtractedMedicines(
    medicines
) {

    const container =
        getElement(
            "extractedMedicines"
        );


    const card =
        getElement(
            "extractedMedicinesCard"
        );


    if (!container) {

        console.error(
            "ERROR: extractedMedicines element not found."
        );

        return;
    }


    if (!card) {

        console.error(
            "ERROR: extractedMedicinesCard element not found."
        );

        return;
    }


    container.innerHTML =
        "";


    /* =====================================
       NO RESULTS
    ====================================== */

    if (
        !medicines ||
        medicines.length === 0
    ) {

        container.innerHTML = `

            <div class="extracted-medicine">

                <div class="medicine-result-info">

                    <strong>
                        No medicines were identified.
                    </strong>

                    <span>
                        We could not identify any medicines
                        from the uploaded prescription.
                    </span>

                </div>

            </div>

        `;


        card.style.display =
            "block";


        scrollToResults();

        return;
    }


    /* =====================================
       LOOP THROUGH MEDICINES
    ====================================== */

    medicines.forEach(
        function (medicine) {

            if (!medicine) {

                return;
            }


            const status =
                medicine.status ||
                "not_available";


            const confidence =
                medicine.confidence ||
                "low";


            const writtenName =
                medicine.written_name ||
                "Unknown medicine";


            /* =================================
               MATCHED
            ================================= */

            if (
                status === "matched" &&
                medicine.matched_medicine
            ) {

                renderMatchedMedicine(
                    container,
                    medicine
                );

                return;
            }


            /* =================================
               POSSIBLE MATCH
            ================================= */

            if (
                status === "possible_match"
            ) {

                renderPossibleMedicine(
                    container,
                    medicine
                );

                return;
            }


            /* =================================
               MULTIPLE MATCHES
            ================================= */

            if (
                status === "multiple_matches"
            ) {

                renderMultipleMatches(
                    container,
                    medicine
                );

                return;
            }


            /* =================================
               NOT AVAILABLE
            ================================= */

            renderUnavailableMedicine(
                container,
                medicine
            );

        }
    );


    card.style.display =
        "block";


    scrollToResults();
}


/* =========================================
   MATCHED MEDICINE
========================================= */

function renderMatchedMedicine(
    container,
    medicine
) {

    const matched =
        medicine.matched_medicine;


    const medicineId =
        matched.id ||
        "";


    const brandName =
        matched.brand_name ||
        medicine.written_name ||
        "Unknown medicine";


    const genericName =
        matched.generic_name ||
        "";


    const strength =
        matched.strength ||
        "";


    const manufacturer =
        matched.manufacturer ||
        "";


    const requiresPrescription =
        matched.requires_prescription;


    const confidence =
        medicine.confidence ||
        "low";


    const writtenName =
        medicine.written_name ||
        brandName;


    let prescriptionText =
        "No prescription required";


    if (
        requiresPrescription
    ) {

        prescriptionText =
            "Prescription required";
    }


    container.innerHTML += `

        <article
            class="
                extracted-medicine
                availability-available
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
                        brandName
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


                ${
                    manufacturer
                        ? `
                            <small>
                                Manufacturer:
                                ${escapeHTML(
                                    manufacturer
                                )}
                            </small>
                        `
                        : ""
                }


                <small>
                    Written as:
                    ${escapeHTML(
                        writtenName
                    )}
                </small>


                <small>
                    AI confidence:
                    ${escapeHTML(
                        confidence
                    )}
                </small>


                <span
                    class="
                        medicine-availability
                        availability-available
                    "
                >
                    Available at MediBridge
                </span>


                <small>
                    ${escapeHTML(
                        prescriptionText
                    )}
                </small>

            </div>


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

        </article>

    `;
}


/* =========================================
   POSSIBLE MATCH
========================================= */

function renderPossibleMedicine(
    container,
    medicine
) {

    const writtenName =
        medicine.written_name ||
        "Unknown medicine";


    const confidence =
        medicine.confidence ||
        "low";


    const possibleMatches =
        medicine.possible_matches ||
        [];


    let matchesHTML =
        "";


    possibleMatches.forEach(
        function (match) {

            matchesHTML += `

                <div
                    class="possible-match"
                >

                    <strong>
                        ${escapeHTML(
                            match.brand_name ||
                            "Unknown"
                        )}
                    </strong>


                    ${
                        match.generic_name
                            ? `
                                <span>
                                    ${escapeHTML(
                                        match.generic_name
                                    )}
                                </span>
                            `
                            : ""
                    }


                    ${
                        match.score !== undefined
                            ? `
                                <small>
                                    ${escapeHTML(
                                        match.score
                                    )}%
                                </small>
                            `
                            : ""
                    }

                </div>

            `;
        }
    );


    container.innerHTML += `

        <article
            class="
                extracted-medicine
                availability-out-of-stock
            "
        >

            <div
                class="medicine-result-info"
            >

                <strong>
                    ${escapeHTML(
                        writtenName
                    )}
                </strong>


                <small>
                    AI confidence:
                    ${escapeHTML(
                        confidence
                    )}
                </small>


                <span
                    class="medicine-availability"
                >
                    Possible match
                </span>


                ${
                    matchesHTML
                        ? `
                            <div
                                class="possible-matches"
                            >

                                <small>
                                    Possible matches:
                                </small>

                                ${matchesHTML}

                            </div>
                        `
                        : ""
                }

            </div>


            <span
                class="medicine-unavailable-label"
            >
                Review
            </span>

        </article>

    `;
}


/* =========================================
   MULTIPLE MATCHES
========================================= */

function renderMultipleMatches(
    container,
    medicine
) {

    const writtenName =
        medicine.written_name ||
        "Unknown medicine";


    const possibleMatches =
        medicine.possible_matches ||
        [];


    let matchesHTML =
        "";


    possibleMatches.forEach(
        function (match) {

            matchesHTML += `

                <div
                    class="possible-match"
                >

                    <strong>
                        ${escapeHTML(
                            match.brand_name ||
                            "Unknown"
                        )}
                    </strong>


                    ${
                        match.generic_name
                            ? `
                                <span>
                                    ${escapeHTML(
                                        match.generic_name
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>

            `;
        }
    );


    container.innerHTML += `

        <article
            class="
                extracted-medicine
                availability-out-of-stock
            "
        >

            <div
                class="medicine-result-info"
            >

                <strong>
                    ${escapeHTML(
                        writtenName
                    )}
                </strong>


                <small>
                    Multiple medicines in
                    MediBridge match this name.
                </small>


                ${
                    matchesHTML
                        ? `
                            <div
                                class="possible-matches"
                            >

                                ${matchesHTML}

                            </div>
                        `
                        : ""
                }

            </div>


            <span
                class="medicine-unavailable-label"
            >
                Review
            </span>

        </article>

    `;
}


/* =========================================
   UNAVAILABLE MEDICINE
========================================= */

function renderUnavailableMedicine(
    container,
    medicine
) {

    const writtenName =
        medicine.written_name ||
        "Unknown medicine";


    const confidence =
        medicine.confidence ||
        "low";


    container.innerHTML += `

        <article
            class="
                extracted-medicine
                availability-not-available
            "
        >

            <div
                class="medicine-result-info"
            >

                <strong>
                    ${escapeHTML(
                        writtenName
                    )}
                </strong>


                <small>
                    AI confidence:
                    ${escapeHTML(
                        confidence
                    )}
                </small>


                <span
                    class="medicine-availability"
                >
                    Not available at MediBridge
                </span>

            </div>


            <span
                class="medicine-unavailable-label"
            >
                Unavailable
            </span>

        </article>

    `;
}


/* =========================================
   SCROLL TO RESULTS
========================================= */

function scrollToResults() {

    const card =
        getElement(
            "extractedMedicinesCard"
        );


    if (!card) {

        return;
    }


    setTimeout(
        function () {

            card.scrollIntoView({

                behavior: "smooth",

                block: "center"

            });

        },
        100
    );

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

    const errorElement =
        getElement(
            "prescriptionError"
        );


    if (!errorElement) {

        console.error(
            "Prescription error:",
            message
        );

        return;
    }


    errorElement.textContent =
        message;


    errorElement.style.display =
        "block";
}


function clearPrescriptionError() {

    const errorElement =
        getElement(
            "prescriptionError"
        );


    if (!errorElement) {

        return;
    }


    errorElement.textContent =
        "";


    errorElement.style.display =
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