document.addEventListener("DOMContentLoaded", () => {

    const prescriptionFile =
        document.getElementById("prescriptionFile");

    const selectedFile =
        document.getElementById("selectedFile");

    const selectedFileName =
        document.getElementById("selectedFileName");

    const selectedFileSize =
        document.getElementById("selectedFileSize");

    const removeFileButton =
        document.getElementById("removeFileButton");

    const uploadButton =
        document.getElementById("uploadButton");

    const uploadButtonText =
        document.getElementById("uploadButtonText");

    const uploadSpinner =
        document.getElementById("uploadSpinner");

    const uploadStatus =
        document.getElementById("uploadStatus");

    const prescriptionError =
        document.getElementById("prescriptionError");


    let selectedPrescription = null;


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ];

    const maxFileSize = 10 * 1024 * 1024;


    /* -----------------------------
       ERROR
    ----------------------------- */

    function showError(message) {

        if (!prescriptionError) {
            return;
        }

        prescriptionError.textContent = message;
        prescriptionError.style.display = "block";
    }


    function hideError() {

        if (!prescriptionError) {
            return;
        }

        prescriptionError.textContent = "";
        prescriptionError.style.display = "none";
    }


    /* -----------------------------
       FILE SIZE
    ----------------------------- */

    function formatFileSize(bytes) {

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }


    /* -----------------------------
       RESET FILE
    ----------------------------- */

    function resetFile() {

        selectedPrescription = null;

        if (prescriptionFile) {
            prescriptionFile.value = "";
        }

        if (selectedFile) {
            selectedFile.style.display = "none";
        }

        if (uploadButton) {
            uploadButton.disabled = true;
        }

        hideError();
    }


    /* -----------------------------
       FILE SELECTION
    ----------------------------- */

    if (prescriptionFile) {

        prescriptionFile.addEventListener(
            "change",
            () => {

                hideError();

                const file =
                    prescriptionFile.files[0];


                if (!file) {
                    resetFile();
                    return;
                }


                if (!allowedTypes.includes(file.type)) {

                    showError(
                        "Please upload a JPG, PNG, or PDF file."
                    );

                    resetFile();
                    return;
                }


                if (file.size > maxFileSize) {

                    showError(
                        "The file is too large. Maximum file size is 10 MB."
                    );

                    resetFile();
                    return;
                }


                selectedPrescription = file;


                if (selectedFileName) {
                    selectedFileName.textContent =
                        file.name;
                }


                if (selectedFileSize) {
                    selectedFileSize.textContent =
                        formatFileSize(file.size);
                }


                if (selectedFile) {
                    selectedFile.style.display = "flex";
                }


                if (uploadButton) {
                    uploadButton.disabled = false;
                }

            }
        );
    }


    /* -----------------------------
       REMOVE FILE
    ----------------------------- */

    if (removeFileButton) {

        removeFileButton.addEventListener(
            "click",
            () => {
                resetFile();
            }
        );
    }


    /* -----------------------------
       UPLOAD + IDENTIFY
    ----------------------------- */

    if (uploadButton) {

        uploadButton.addEventListener(
            "click",
            async () => {

                if (!selectedPrescription) {

                    showError(
                        "Please choose a prescription first."
                    );

                    return;
                }


                hideError();

                uploadButton.disabled = true;


                if (uploadButtonText) {
                    uploadButtonText.textContent =
                        "Uploading...";
                }


                if (uploadSpinner) {
                    uploadSpinner.style.display =
                        "inline-block";
                }


                if (uploadStatus) {
                    uploadStatus.style.display =
                        "flex";
                }


                try {

                    /* -----------------------------
                       STEP 1 — UPLOAD
                    ----------------------------- */

                    const formData =
                        new FormData();

                    formData.append(
                        "prescription",
                        selectedPrescription
                    );


                    const uploadResult =
                        await apiRequest(
                            "/prescriptions/upload/",
                            {
                                method: "POST",
                                body: formData
                            }
                        );


                    console.log(
                        "Upload result:",
                        uploadResult
                    );


                    /*
                     * Your upload API may return the ID
                     * either directly or inside data.
                     */

                    const prescriptionId =
                        uploadResult.data?.id ||
                        uploadResult.id ||
                        uploadResult.prescription_id;


                    if (!prescriptionId) {

                        throw new Error(
                            "Prescription was uploaded, but its ID was not returned."
                        );
                    }


                    /* -----------------------------
                       STEP 2 — IDENTIFY MEDICINES
                    ----------------------------- */

                    if (uploadButtonText) {
                        uploadButtonText.textContent =
                            "Identifying medicines...";
                    }


                    const extractResult =
                        await apiRequest(
                            `/prescriptions/${prescriptionId}/extract/`,
                            {
                                method: "POST"
                            }
                        );


                    console.log(
                        "Extraction result:",
                        extractResult
                    );


                    /* -----------------------------
                       STEP 3 — RESULTS PAGE
                    ----------------------------- */

                    window.location.href =
                        `/prescription-results/${prescriptionId}/`;

                }
                catch (error) {

                    console.error(
                        "Prescription processing error:",
                        error
                    );


                    showError(
                        error.message ||
                        "Something went wrong while processing your prescription."
                    );


                    uploadButton.disabled = false;


                    if (uploadButtonText) {
                        uploadButtonText.textContent =
                            "Upload & Identify";
                    }


                    if (uploadSpinner) {
                        uploadSpinner.style.display =
                            "none";
                    }


                    if (uploadStatus) {
                        uploadStatus.style.display =
                            "none";
                    }

                }

            }
        );
    }

});