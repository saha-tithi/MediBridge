document.addEventListener("DOMContentLoaded", async () => {

    const prescriptionId = window.location.pathname
        .split("/")
        .filter(Boolean)
        .pop();


    const loadingState =
        document.getElementById("loadingState");

    const medicinesContainer =
        document.getElementById("medicinesContainer");

    const emptyState =
        document.getElementById("emptyState");

    const resultsError =
        document.getElementById("resultsError");

    const cartAction =
        document.getElementById("cartAction");

    const addToCartButton =
        document.getElementById("addToCartButton");

    const selectionMessage =
        document.getElementById("selectionMessage");


    let availableMedicines = [];


    /* -----------------------------
       ERROR
    ----------------------------- */

    function showError(message) {

        if (resultsError) {
            resultsError.textContent = message;
            resultsError.style.display = "block";
        }

        if (loadingState) {
            loadingState.style.display = "none";
        }
    }


    /* -----------------------------
       LOAD RESULTS
    ----------------------------- */

    async function loadResults() {

        try {

            if (!prescriptionId) {
                throw new Error(
                    "Prescription could not be found."
                );
            }


            /*
             * apiRequest() already:
             *
             * 1. Adds the access token
             * 2. Sends the request
             * 3. Parses JSON
             * 4. Handles HTTP errors
             *
             * So we DO NOT use response.json()
             * or response.ok here.
             */

            const result = await apiRequest(
                `/prescriptions/${prescriptionId}/`
            );


            console.log(
                "Prescription result:",
                result
            );


            /*
             * Depending on your serializer,
             * the data may be returned directly
             * or inside "data".
             */

            const prescription =
                result.data || result;


            const medicines =
                prescription.extracted_medicines ||
                prescription.medicines ||
                [];


            if (loadingState) {
                loadingState.style.display = "none";
            }


            if (!medicines.length) {

                if (emptyState) {
                    emptyState.style.display = "block";
                }

                return;
            }


            renderMedicines(medicines);

        }
        catch (error) {

            console.error(
                "Prescription results error:",
                error
            );


            showError(
                error.message ||
                "Unable to load prescription results."
            );
        }
    }


    /* -----------------------------
       RENDER MEDICINES
    ----------------------------- */

    function renderMedicines(medicines) {

        medicinesContainer.innerHTML = "";

        availableMedicines = [];


        medicines.forEach((item, index) => {

            if (
                item.status === "matched" &&
                item.matched_medicine
            ) {

                const medicine =
                    item.matched_medicine;


                availableMedicines.push({
                    id: medicine.id,
                    name: medicine.brand_name
                });


                const card =
                    createMatchedCard(
                        item,
                        medicine,
                        index
                    );


                medicinesContainer.appendChild(card);

            }
            else {

                const card =
                    createUnavailableCard(
                        item
                    );


                medicinesContainer.appendChild(card);
            }

        });


        medicinesContainer.style.display = "flex";


        if (availableMedicines.length > 0) {

            cartAction.style.display = "block";

            updateCartButton();
        }
    }


    /* -----------------------------
       MATCHED MEDICINE CARD
    ----------------------------- */

    function createMatchedCard(
        item,
        medicine,
        index
    ) {

        const card =
            document.createElement("div");


        card.className =
            "medicine-card available";


        card.dataset.medicineId =
            medicine.id;


        card.innerHTML = `

            <div class="medicine-info">

                <div class="medicine-icon">
                    💊
                </div>


                <div class="medicine-details">

                    <h3 class="medicine-name">
                        ${escapeHtml(
                            medicine.brand_name
                        )}
                    </h3>


                    <div class="medicine-meta">

                        <span>
                            ${escapeHtml(
                                medicine.generic_name ||
                                "Medicine"
                            )}
                        </span>


                        <span>
                            ${escapeHtml(
                                medicine.strength ||
                                "—"
                            )}
                        </span>


                        <span>
                            ${escapeHtml(
                                medicine.manufacturer ||
                                "—"
                            )}
                        </span>

                    </div>

                </div>

            </div>


            <div class="medicine-status">

                <span
                    class="status-text status-available"
                >
                    Available
                </span>


                <input
                    type="checkbox"
                    class="medicine-checkbox"
                    data-index="${index}"
                    data-medicine-id="${escapeHtml(
                        medicine.id
                    )}"
                    aria-label="Select ${escapeHtml(
                        medicine.brand_name
                    )}"
                >

            </div>
        `;


        const checkbox =
            card.querySelector(
                ".medicine-checkbox"
            );


        /* Checkbox */

        checkbox.addEventListener(
            "change",
            () => {

                card.classList.toggle(
                    "selected",
                    checkbox.checked
                );

                updateCartButton();
            }
        );


        /* Card click */

        card.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === checkbox
                ) {
                    return;
                }


                checkbox.checked =
                    !checkbox.checked;


                card.classList.toggle(
                    "selected",
                    checkbox.checked
                );


                updateCartButton();
            }
        );


        return card;
    }


    /* -----------------------------
       UNAVAILABLE CARD
    ----------------------------- */

    function createUnavailableCard(item) {

        const card =
            document.createElement("div");


        card.className =
            "medicine-card unavailable";


        const name =
            item.written_name ||
            item.normalized_name ||
            item.medicine_name ||
            "Unknown medicine";


        let statusMessage =
            "Not available at MediBridge";


        if (
            item.status === "possible_match"
        ) {

            statusMessage =
                "Needs verification";
        }


        card.innerHTML = `

            <div class="medicine-info">

                <div class="medicine-icon">
                    !
                </div>


                <div class="medicine-details">

                    <h3 class="medicine-name">
                        ${escapeHtml(name)}
                    </h3>


                    <div class="medicine-meta">

                        <span>
                            ${escapeHtml(
                                item.confidence ||
                                "low"
                            )} confidence
                        </span>

                    </div>

                </div>

            </div>


            <div class="medicine-status">

                <span
                    class="status-text status-unavailable"
                >
                    ${escapeHtml(statusMessage)}
                </span>

            </div>
        `;


        return card;
    }


    /* -----------------------------
       UPDATE CART BUTTON
    ----------------------------- */

    function updateCartButton() {

        const selected =
            document.querySelectorAll(
                ".medicine-checkbox:checked"
            );


        const count =
            selected.length;


        addToCartButton.disabled =
            count === 0;


        if (count === 0) {

            selectionMessage.textContent =
                "Select an available medicine to continue.";

        }
        else {

            selectionMessage.textContent =
                `${count} medicine${
                    count > 1 ? "s" : ""
                } selected.`;
        }
    }


    /* -----------------------------
       ADD TO CART
    ----------------------------- */

    if (addToCartButton) {

        addToCartButton.addEventListener(
            "click",
            async () => {

                const selected =
                    document.querySelectorAll(
                        ".medicine-checkbox:checked"
                    );


                if (!selected.length) {
                    return;
                }


                addToCartButton.disabled = true;

                addToCartButton.textContent =
                    "Adding to Cart...";


                try {

                    for (const checkbox of selected) {

                        const medicineId =
                            checkbox.dataset.medicineId;


                        await apiRequest(
                            "/cart/items/",
                            {
                                method: "POST",

                                body: JSON.stringify({
                                    medicine_id:
                                        medicineId,

                                    quantity: 1
                                })
                            }
                        );
                    }


                    /*
                     * All selected medicines were
                     * successfully added.
                     */

                    window.location.href =
                        "/cart/";

                }
                catch (error) {

                    console.error(
                        "Add to cart error:",
                        error
                    );


                    showError(
                        error.message ||
                        "Unable to add the selected medicines to cart."
                    );


                    addToCartButton.disabled =
                        false;


                    addToCartButton.textContent =
                        "Add Selected to Cart";


                    updateCartButton();
                }

            }
        );
    }


    /* -----------------------------
       HTML ESCAPE
    ----------------------------- */

    function escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent =
            value ?? "";

        return div.innerHTML;
    }


    /* -----------------------------
       START
    ----------------------------- */

    await loadResults();

});