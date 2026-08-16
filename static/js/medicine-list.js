/* ========================================
   MediBridge
   Medicine List
======================================== */


/* ========================================
   ELEMENTS
======================================== */

const medicineList =
    document.getElementById("medicineList");

const searchInput =
    document.getElementById("medicineSearch");



/* ========================================
   LOAD MEDICINES
======================================== */

async function loadMedicines(search = "") {

    try {

        medicineList.innerHTML = `
            <div class="medicine-loading">
                Loading medicines...
            </div>
        `;


        let endpoint = "/medicine/";


        /*
         * Add search query only
         * when user has entered something.
         */

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


        /*
         * No medicines found
         */

        if (!medicines.length) {

            medicineList.innerHTML = `

                <div class="medicine-empty">

                    <h3>
                        No medicines found
                    </h3>

                    <p>
                        Try searching with another medicine,
                        generic name or brand.
                    </p>

                </div>

            `;

            return;
        }



        /*
         * Create medicine cards
         */

        medicineList.innerHTML = medicines
            .map(function (medicine) {


                /* ==========================
                   MEDICINE IMAGE
                =========================== */

                const image =
                    medicine.image

                    ?

                    `
                        <img
                            src="${medicine.image}"
                            alt="${medicine.brand_name}"
                            loading="lazy"
                        >
                    `

                    :

                    `
                        <div
                            class="medicine-card-image-placeholder"
                        >
                            💊
                        </div>
                    `;



                /* ==========================
                   PRESCRIPTION BADGE
                =========================== */

                const prescriptionBadge =
                    medicine.requires_prescription

                    ?

                    `
                        <span
                            class="prescription-badge"
                        >
                            Prescription required
                        </span>
                    `

                    :

                    "";



                /* ==========================
                   CARD
                =========================== */

                return `

                    <a
                        href="/medicines/${medicine.id}/"
                        class="medicine-card"
                    >


                        <!-- IMAGE -->

                        <div
                            class="medicine-card-image"
                        >

                            ${image}

                        </div>



                        <!-- CONTENT -->

                        <div
                            class="medicine-card-content"
                        >


                            <!-- CATEGORY -->

                            <p
                                class="medicine-category"
                            >
                                ${medicine.category}
                            </p>



                            <!-- BRAND NAME -->

                            <h2>
                                ${medicine.brand_name}
                            </h2>



                            <!-- GENERIC NAME -->

                            <p
                                class="medicine-generic"
                            >
                                ${medicine.generic_name}
                            </p>



                            <!-- STRENGTH -->

                            <span
                                class="medicine-strength"
                            >
                                ${medicine.strength}
                            </span>



                            <!-- FOOTER -->

                            <div
                                class="medicine-card-footer"
                            >


                                <span
                                    class="medicine-manufacturer"
                                    title="${medicine.manufacturer}"
                                >
                                    ${medicine.manufacturer}
                                </span>


                                ${prescriptionBadge}


                            </div>


                        </div>


                    </a>

                `;

            })
            .join("");


    }


    catch (error) {

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
                    Please try again in a moment.
                </p>

            </div>

        `;

    }

}



/* ========================================
   INITIAL LOAD
======================================== */

loadMedicines();



/* ========================================
   SEARCH
======================================== */

let searchTimeout;


searchInput.addEventListener(
    "input",
    function () {


        clearTimeout(searchTimeout);


        searchTimeout = setTimeout(
            function () {

                loadMedicines(
                    searchInput.value
                );

            },
            350
        );

    }
);