document.addEventListener("DOMContentLoaded", function () {

    const container = document.getElementById("prescriptionsContainer");
    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyState");
    const errorState = document.getElementById("errorState");
    const errorMessage = document.getElementById("errorMessage");
    const retryBtn = document.getElementById("retryBtn");


    // =========================
    // Load Prescriptions
    // =========================

    async function loadPrescriptions() {

        showLoading();

        try {
            const result = await apiRequest("/prescriptions/");

            const prescriptions = result.data || result;

            if (!Array.isArray(prescriptions) || prescriptions.length === 0) {
                showEmpty();
                return;
            }

            renderPrescriptions(prescriptions);

        } catch (error) {
            console.error("Unable to load prescriptions:", error);

            showError(
                error.message || "Unable to load your prescriptions."
            );
        }
    }


    // =========================
    // Render Prescriptions
    // =========================

    function renderPrescriptions(prescriptions) {

        container.innerHTML = "";

        prescriptions.forEach(function (prescription) {

            const card = document.createElement("article");
            card.className = "prescription-card";

            card.dataset.id = prescription.id;

            card.innerHTML = `
                <div class="prescription-file-icon">
                    📄
                </div>

                <div class="prescription-info">
                    <h3 class="prescription-title">
                        Prescription
                    </h3>

                    <p class="prescription-date">
                        ${formatDate(prescription.uploaded_at)}
                    </p>
                </div>

                <button
                    type="button"
                    class="prescription-download"
                    aria-label="Download prescription"
                    title="Download prescription"
                >
                    ↓
                </button>
            `;


            // =========================
            // Open Prescription
            // =========================

            card.addEventListener("click", function () {
                openPrescription(prescription.id);
            });


            // =========================
            // Download Prescription
            // =========================

            const downloadButton =
                card.querySelector(".prescription-download");

            downloadButton.addEventListener("click", function (event) {

                event.stopPropagation();

                downloadPrescription(prescription.id);
            });


            container.appendChild(card);
        });


        loadingState.classList.add("hidden");
        emptyState.classList.add("hidden");
        errorState.classList.add("hidden");
        container.classList.remove("hidden");
    }


    // =========================
    // Open Original File
    // =========================

    async function openPrescription(id) {

        try {

            const result = await apiRequest(
                `/prescriptions/${id}/`
            );

            const prescription = result.data || result;

            if (!prescription.prescription) {
                throw new Error(
                    "Prescription file could not be found."
                );
            }

            window.open(
                prescription.prescription,
                "_blank"
            );

        } catch (error) {

            console.error(
                "Unable to open prescription:",
                error
            );

            alert(
                error.message ||
                "Unable to open the prescription."
            );
        }
    }


    // =========================
    // Download Original File
    // =========================

    async function downloadPrescription(id) {

        try {

            const result = await apiRequest(
                `/prescriptions/${id}/`
            );

            const prescription = result.data || result;

            if (!prescription.prescription) {
                throw new Error(
                    "Prescription file could not be found."
                );
            }

            const response = await fetch(
                prescription.prescription
            );

            if (!response.ok) {
                throw new Error(
                    "Unable to download the prescription."
                );
            }

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;

            link.download = getFileName(
                prescription.prescription,
                id
            );

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (error) {

            console.error(
                "Unable to download prescription:",
                error
            );

            alert(
                error.message ||
                "Unable to download the prescription."
            );
        }
    }


    // =========================
    // File Name
    // =========================

    function getFileName(fileUrl, id) {

        try {

            const url = new URL(fileUrl);

            const pathname = url.pathname;

            const fileName =
                pathname.split("/").pop();

            if (fileName) {
                return fileName;
            }

        } catch (error) {
            console.warn(
                "Could not determine file name."
            );
        }

        return `prescription-${id}`;
    }


    // =========================
    // Format Date
    // =========================

    function formatDate(dateString) {

        if (!dateString) {
            return "Date unavailable";
        }

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
    }


    // =========================
    // UI States
    // =========================

    function showLoading() {

        container.innerHTML = "";

        container.classList.add("hidden");

        loadingState.classList.remove("hidden");
        emptyState.classList.add("hidden");
        errorState.classList.add("hidden");
    }


    function showEmpty() {

        container.innerHTML = "";

        container.classList.add("hidden");

        loadingState.classList.add("hidden");
        emptyState.classList.remove("hidden");
        errorState.classList.add("hidden");
    }


    function showError(message) {

        container.innerHTML = "";

        container.classList.add("hidden");

        loadingState.classList.add("hidden");
        emptyState.classList.add("hidden");
        errorState.classList.remove("hidden");

        errorMessage.textContent = message;
    }


    // =========================
    // Retry
    // =========================

    retryBtn.addEventListener(
        "click",
        loadPrescriptions
    );


    // =========================
    // Initial Load
    // =========================

    loadPrescriptions();

});