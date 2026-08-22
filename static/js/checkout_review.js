/* =========================================
   REVIEW PAGE ELEMENTS
========================================= */

const selectedAddressElement =
    document.getElementById("selectedAddress");

const reviewItems =
    document.getElementById("reviewItems");

const itemsTotal =
    document.getElementById("itemsTotal");

const grandTotal =
    document.getElementById("grandTotal");

const placeOrderButton =
    document.getElementById("placeOrderButton");

const reviewError =
    document.getElementById("reviewError");



/* =========================================
   STATE
========================================= */

let selectedAddressId =
    sessionStorage.getItem(
        "selectedAddressId"
    );

let currentCart = null;



/* =========================================
   LOAD REVIEW DATA
========================================= */

async function loadReviewPage() {

    try {

        if (!selectedAddressId) {

            showReviewError(
                "Please select a delivery address first."
            );

            placeOrderButton.disabled = true;

            return;

        }


        /*
         * Load address and cart together.
         */

        const results =
            await Promise.all([

                apiRequest(
                    "/addresses/",
                    {
                        method: "GET"
                    }
                ),

                apiRequest(
                    "/cart/",
                    {
                        method: "GET"
                    }
                )

            ]);


        const addresses =
            results[0];

        const cartResponse =
            results[1];


        /*
         * Find selected address.
         */

        const selectedAddress =
            addresses.find(
                function (address) {

                    return String(address.id) ===
                        String(selectedAddressId);

                }
            );


        if (!selectedAddress) {

            showReviewError(
                "The selected address could not be found."
            );

            placeOrderButton.disabled = true;

            return;

        }


        /*
         * Cart response.
         */

        currentCart =
            cartResponse.data;


        if (
            !currentCart ||
            !currentCart.items ||
            currentCart.items.length === 0
        ) {

            showReviewError(
                "Your cart is empty."
            );

            placeOrderButton.disabled = true;

            return;

        }


        renderSelectedAddress(
            selectedAddress
        );


        renderReviewItems(
            currentCart
        );


    } catch (error) {

        console.error(
            "Review page error:",
            error
        );


        showReviewError(
            error.message ||
            "Unable to load your order."
        );


        placeOrderButton.disabled =
            true;

    }

}



/* =========================================
   RENDER ADDRESS
========================================= */

function renderSelectedAddress(address) {

    const icon =
        address.label === "HOME"
            ? "🏠"
            : address.label === "WORK"
                ? "💼"
                : "📍";


    selectedAddressElement.innerHTML = `

        <div class="selected-address-icon">

            ${icon}

        </div>


        <div class="selected-address-content">

            <div class="selected-address-title">

                <strong>
                    ${escapeHTML(
                        getAddressLabel(
                            address.label
                        )
                    )}
                </strong>

            </div>


            <p>
                ${escapeHTML(
                    address.full_name
                )}
            </p>


            <p>
                ${escapeHTML(
                    address.address
                )}
            </p>


            <p>

                ${escapeHTML(
                    address.city
                )}

                -

                ${escapeHTML(
                    address.pincode
                )}

            </p>


            <p>

                Phone:

                ${escapeHTML(
                    address.phone_number
                )}

            </p>

        </div>

    `;

}



/* =========================================
   RENDER ORDER ITEMS
========================================= */

function renderReviewItems(cart) {

    reviewItems.innerHTML =
        cart.items
            .map(
                function (item) {

                    return `

                        <article
                            class="review-item"
                        >

                            <div
                                class="review-item-image"
                            >

                                <div
                                    class="review-pill"
                                ></div>

                            </div>


                            <div
                                class="review-item-info"
                            >

                                <strong>

                                    ${escapeHTML(
                                        item.medicine_name
                                    )}

                                </strong>


                                <span>

                                    ₹${item.unit_price}
                                    ×
                                    ${item.quantity}

                                </span>

                            </div>


                            <strong
                                class="review-item-price"
                            >

                                ₹${item.subtotal}

                            </strong>

                        </article>

                    `;

                }
            )
            .join("");


    /*
     * Cart total comes from backend.
     */

    itemsTotal.textContent =
        `₹${cart.total}`;


    grandTotal.textContent =
        `₹${cart.total}`;

}



/* =========================================
   PAYMENT METHOD
========================================= */

const paymentOptions =
    document.querySelectorAll(
        'input[name="payment_method"]'
    );


paymentOptions.forEach(
    function (input) {

        input.addEventListener(
            "change",
            function () {

                document
                    .querySelectorAll(
                        ".payment-option"
                    )
                    .forEach(
                        function (option) {

                            option.classList.remove(
                                "selected"
                            );

                        }
                    );


                this
                    .closest(
                        ".payment-option"
                    )
                    .classList.add(
                        "selected"
                    );

            }
        );

    }
);



/* =========================================
   PLACE ORDER
========================================= */

placeOrderButton.addEventListener(
    "click",
    async function () {

        if (
            !selectedAddressId ||
            !currentCart
        ) {

            return;

        }


        const selectedPayment =
            document.querySelector(
                'input[name="payment_method"]:checked'
            );


        if (!selectedPayment) {

            showReviewError(
                "Please select a payment method."
            );

            return;

        }


        const paymentMethod =
            selectedPayment.value;


        placeOrderButton.disabled =
            true;


        placeOrderButton.textContent =
            "Placing Order...";


        try {

            /*
             * Order API connection will be
             * added after we verify the
             * exact Orders API payload.
             */

            console.log(
                "Order details:",
                {
                    address_id:
                        selectedAddressId,

                    payment_method:
                        paymentMethod,

                    cart:
                        currentCart
                }
            );


            /*
             * Temporary success message.
             *
             * We will replace this with
             * the real Orders API call next.
             */

            alert(
                "Review completed successfully."
            );


        } catch (error) {

            console.error(
                "Place order error:",
                error
            );


            showReviewError(
                error.message ||
                "Unable to place your order."
            );


            placeOrderButton.disabled =
                false;


            placeOrderButton.textContent =
                "Place Order";

        }

    }
);



/* =========================================
   ADDRESS LABEL
========================================= */

function getAddressLabel(label) {

    const labels = {

        HOME: "Home",

        WORK: "Work",

        OTHER: "Other"

    };


    return labels[label] || label;

}



/* =========================================
   ERROR
========================================= */

function showReviewError(message) {

    reviewError.textContent =
        message;

    reviewError.style.display =
        "block";

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



/* =========================================
   INITIAL LOAD
========================================= */

loadReviewPage();