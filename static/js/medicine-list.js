const medicineList = document.getElementById("medicineList");
const medicineSearch = document.getElementById("medicineSearch");

let searchTimeout = null;


/* =========================================================
   LOAD MEDICINES
   ========================================================= */

async function loadMedicines(search = "") {

    medicineList.innerHTML = `
        <div class="medicine-loading">

            <div class="loading-pill"></div>

            <p>Loading medicines...</p>

        </div>
    `;


    try {

        let endpoint = "/medicine/";


        if (search.trim()) {

            endpoint +=
                `?search=${encodeURIComponent(search.trim())}`;

        }


        const medicines = await apiRequest(
            endpoint,
            {
                method: "GET",
                auth: false
            }
        );


        renderMedicines(medicines);


    } catch (error) {

        console.error(
            "Medicine loading error:",
            error
        );


        medicineList.innerHTML = `
            <div class="medicine-empty">

                <h3>
                    Unable to load medicines
                </h3>

                <p>
                    Please try again later.
                </p>

            </div>
        `;

    }

}


/* =========================================================
   RENDER MEDICINES
   ========================================================= */

function renderMedicines(medicines) {

    if (!medicines || medicines.length === 0) {

        medicineList.innerHTML = `
            <div class="medicine-empty">

                <h3>
                    No medicines found
                </h3>

                <p>
                    Try searching with a different medicine,
                    generic name or brand.
                </p>

            </div>
        `;

        return;
    }


    medicineList.innerHTML = medicines
        .map(function (medicine) {

            /* -----------------------------------------
               IMAGE
            ----------------------------------------- */

            const imageHTML = medicine.image

                ? `
                    <img
                        src="${escapeHTML(medicine.image)}"
                        alt="${escapeHTML(medicine.brand_name)}"
                    >
                `

                : `
                    <div class="medicine-pill"></div>
                `;


            /* -----------------------------------------
               PRESCRIPTION BADGE
            ----------------------------------------- */

            const prescriptionHTML =
                medicine.requires_prescription

                    ? `
                        <div class="prescription-badge">

                            <span class="prescription-icon">
                                ▣
                            </span>

                            Prescription required

                        </div>
                    `

                    : "";


            /* -----------------------------------------
               CARD
            ----------------------------------------- */

            return `
                <a
                    href="/medicines/${encodeURIComponent(medicine.id)}/"
                    class="medicine-card"
                    aria-label="View ${escapeHTML(medicine.brand_name)} details"
                >

                    <div class="medicine-card-image">

                        ${imageHTML}

                    </div>


                    <p class="medicine-category">
                        ${escapeHTML(
                            medicine.category || "Medicine"
                        )}
                    </p>


                    <h2>
                        ${escapeHTML(
                            medicine.brand_name
                        )}
                    </h2>


                    <p class="medicine-generic">

                        ${escapeHTML(
                            medicine.generic_name || ""
                        )}

                        ${
                            medicine.strength
                                ? ` ${escapeHTML(medicine.strength)}`
                                : ""
                        }

                    </p>


                    ${
                        medicine.strength

                            ? `
                                <div class="medicine-strength">
                                    ${escapeHTML(
                                        medicine.strength
                                    )}
                                </div>
                            `

                            : ""
                    }


                    ${prescriptionHTML}


                    <div class="medicine-card-footer">

                        <span class="medicine-manufacturer">

                            ${escapeHTML(
                                medicine.manufacturer || ""
                            )}

                        </span>

                    </div>

                </a>
            `;

        })
        .join("");
}


/* =========================================================
   SEARCH
   ========================================================= */

if (medicineSearch) {

    medicineSearch.addEventListener(
        "input",
        function () {

            clearTimeout(searchTimeout);


            searchTimeout = setTimeout(
                function () {

                    loadMedicines(
                        medicineSearch.value
                    );

                },
                350
            );

        }
    );
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   INITIAL LOAD
   ========================================================= */

loadMedicines();