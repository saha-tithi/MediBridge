const medicineList = document.getElementById("medicineList");


async function loadMedicines() {

    try {

        const data = await apiRequest(
            "/medicine/",
            {
                method: "GET",
                auth: false
            }
        );


        console.log("Medicine API response:", data);


        medicineList.innerHTML = "";


        if (!data || data.length === 0) {

            medicineList.innerHTML = `
                <div class="medicine-empty">

                    <h3>
                        No medicines available
                    </h3>

                    <p>
                        There are currently no medicines available.
                    </p>

                </div>
            `;

            return;
        }


        data.forEach(function (medicine) {

            const card = document.createElement("article");

            card.className = "medicine-card";


            card.innerHTML = `

                <!-- Medicine Image -->

                <div class="medicine-card-image">

                    ${
                        medicine.image
                            ? `
                                <img
                                    src="${medicine.image}"
                                    alt="${medicine.brand_name}"
                                >
                              `
                            : `
                                <div class="medicine-card-image-placeholder">
                                    💊
                                </div>
                              `
                    }

                </div>


                <!-- Medicine Information -->

                <p class="medicine-category">
                    ${medicine.category}
                </p>


                <h2>
                    ${medicine.brand_name}
                </h2>


                <p class="medicine-generic">
                    ${medicine.generic_name}
                </p>


                <span class="medicine-strength">
                    ${medicine.strength}
                </span>


                <!-- Footer -->

                <div class="medicine-card-footer">

                    <span class="medicine-manufacturer">
                        ${medicine.manufacturer}
                    </span>


                    ${
                        medicine.requires_prescription
                            ? `
                                <span class="prescription-badge">
                                    Prescription required
                                </span>
                              `
                            : ""
                    }

                </div>

            `;


            /*
             * Clicking the medicine card
             * will open the detail page.
             */

            card.style.cursor = "pointer";

            card.addEventListener("click", function () {

                window.location.href =
                    `/medicines/${medicine.id}/`;

            });


            medicineList.appendChild(card);

        });


    } catch (error) {

        console.error(
            "Failed to load medicines:",
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


loadMedicines();