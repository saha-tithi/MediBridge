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

let selectedAddressId =sessionStorage.getItem("selectedAddressId");
let currentCart = null;
let selectedAddressForPayment = null;



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

            /* =================================
               GET SELECTED ADDRESS
            ================================= */

            const addresses =
                await apiRequest(
                    "/addresses/",
                    {
                        method: "GET"
                    }
                );


            const selectedAddress =
                addresses.find(
                    function (address) {

                        return String(address.id) ===
                            String(selectedAddressId);

                    }
                );


            if (!selectedAddress) {

                throw new Error(
                    "Selected delivery address could not be found."
                );

            }
            selectedAddressForPayment = selectedAddress;

 
            /* =================================
               BUILD SHIPPING ADDRESS
            ================================= */

            const shippingAddress =
                [
                    selectedAddress.full_name,
                    selectedAddress.address,
                    selectedAddress.city,
                    selectedAddress.pincode,
                    `Phone: ${selectedAddress.phone_number}`
                ]
                .filter(Boolean)
                .join(", ");



            /* =================================
               CREATE MEDIBRIDGE ORDER
            ================================= */

            const orderResponse =
                await apiRequest(
                    "/orders/create/",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({

                                shipping_address:
                                    shippingAddress,

                                payment_method:
                                    paymentMethod

                            })
                    }
                );


            const order =
                orderResponse.data;


            if (
                !order ||
                !order.id
            ) {

                throw new Error(
                    "Unable to create your order."
                );

            }


            console.log(
                "MediBridge order created:",
                order
            );



            /* =================================
               COD
            ================================= */

            if (
                paymentMethod === "COD"
            ) {

                sessionStorage.setItem(
                    "lastOrderId",
                    order.id
                );


                window.location.href =
                    `/orders/success/${order.id}/`;


                return;

            }



            /* =================================
               ONLINE PAYMENT
            ================================= */

            if (
                paymentMethod === "ONLINE"
            ) {

                await startRazorpayPayment(
                    order
                );

            }

        } catch (error) {

            console.error(
                "Order creation error:",
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
   START RAZORPAY PAYMENT
========================================= */

async function startRazorpayPayment(order) {

    try {

        placeOrderButton.textContent =
            "Opening Payment...";


        /* =================================
           CREATE RAZORPAY ORDER
        ================================= */

        const response =
            await apiRequest(
                `/orders/${order.id}/razorpay/create/`,
                {
                    method: "POST"
                }
            );


        const razorpayData =
            response.data;


        if (
            !razorpayData ||
            !razorpayData.razorpay_order_id
        ) {

            throw new Error(
                "Unable to initialize online payment."
            );

        }


        /* =================================
           RAZORPAY CHECKOUT OPTIONS
        ================================= */

        const options = {

            key:
                razorpayData.key_id,

            amount:
                razorpayData.amount,

            currency:
                razorpayData.currency,

            name:
                "MediBridge",

            description:
                "Medicine Order",

            order_id:
                razorpayData.razorpay_order_id,


            /* ==============================
               PAYMENT SUCCESS
            ============================== */

            handler:
                async function (
                    paymentResponse
                ) {

                    try {

                        placeOrderButton.textContent =
                            "Verifying Payment...";


                        const verificationResponse =
                            await apiRequest(
                                `/orders/${order.id}/razorpay/verify/`,
                                {
                                    method: "POST",

                                    body:
                                        JSON.stringify({

                                            razorpay_order_id:
                                                paymentResponse.razorpay_order_id,

                                            razorpay_payment_id:
                                                paymentResponse.razorpay_payment_id,

                                            razorpay_signature:
                                                paymentResponse.razorpay_signature

                                        })
                                }
                            );


                        console.log(
                            "Payment verified:",
                            verificationResponse
                        );


                        sessionStorage.setItem(
                            "lastOrderId",
                            order.id
                        );


                        window.location.href =
                            `/orders/success/${order.id}/`;

                    } catch (error) {

                        console.error(
                            "Payment verification error:",
                            error
                        );


                        showReviewError(
                            error.message ||
                            "Payment verification failed."
                        );


                        placeOrderButton.disabled =
                            false;


                        placeOrderButton.textContent =
                            "Place Order";

                    }

                },


            /* ==============================
               PREFILL CUSTOMER
            ============================== */

            prefill: {

                name:
                    selectedAddressForPayment.full_name,

                contact:
                    selectedAddressForPayment.phone_number

            },


            /* ==============================
               THEME
            ============================== */

            theme: {

                color:
                    "#438f89"

            }

        };


        /* =================================
           OPEN RAZORPAY
        ================================= */

        const razorpay =
            new Razorpay(
                options
            );


        razorpay.on(
            "payment.failed",
            function (
                response
            ) {

                console.error(
                    "Razorpay payment failed:",
                    response
                );


                showReviewError(
                    "Payment failed. Please try again."
                );


                placeOrderButton.disabled =
                    false;


                placeOrderButton.textContent =
                    "Place Order";

            }
        );


        razorpay.open();


    } catch (error) {

        console.error(
            "Razorpay error:",
            error
        );


        showReviewError(
            error.message ||
            "Unable to open payment."
        );


        placeOrderButton.disabled =
            false;


        placeOrderButton.textContent =
            "Place Order";

    }

}

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