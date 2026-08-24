/* =========================================
   ORDER DETAIL PAGE
========================================= */


/* =========================================
   ELEMENTS
========================================= */

const orderIdElement =
    document.getElementById("orderId");

const orderDateElement =
    document.getElementById("orderDate");

const orderError =
    document.getElementById("orderError");

const orderItems =
    document.getElementById("orderItems");

const orderTotal =
    document.getElementById("orderTotal");

const shippingAddress =
    document.getElementById("shippingAddress");

const paymentMethod =
    document.getElementById("paymentMethod");

const paymentStatus =
    document.getElementById("paymentStatus");

const paymentTotal =
    document.getElementById("paymentTotal");

const statusMessage =
    document.getElementById("statusMessage");


/* =========================================
   LOAD ORDER
========================================= */

async function loadOrder() {

    try {

        if (!ORDER_ID) {

            throw new Error(
                "Order ID is missing."
            );

        }


        const response =
            await apiRequest(
                `/orders/${ORDER_ID}/`,
                {
                    method: "GET"
                }
            );


        const order =
            response.data;


        if (!order) {

            throw new Error(
                "Order could not be found."
            );

        }


        console.log(
            "Order details:",
            order
        );


        renderOrder(order);


    } catch (error) {

        console.error(
            "Order detail error:",
            error
        );


        showOrderError(
            error.message ||
            "Unable to load order details."
        );

    }

}


/* =========================================
   RENDER ORDER
========================================= */

function renderOrder(order) {

    orderIdElement.textContent =
        `Order #${order.id}`;


    orderDateElement.textContent =
        formatDate(order.created_at);


    orderTotal.textContent =
        `₹${order.total_amount}`;


    paymentTotal.textContent =
        `₹${order.total_amount}`;


    paymentMethod.textContent =
        formatPaymentMethod(
            order.payment_method
        );


    paymentStatus.textContent =
        formatPaymentStatus(
            order.payment_status
        );


    shippingAddress.textContent =
        order.shipping_address ||
        "Delivery address unavailable.";


    renderOrderItems(
        order.items
    );


    updateStatusTracker(
        order.status
    );


    updateStatusMessage(
        order.status
    );

}


/* =========================================
   RENDER ORDER ITEMS
========================================= */

function renderOrderItems(items) {

    if (
        !items ||
        items.length === 0
    ) {

        orderItems.innerHTML = `
            <p class="empty-order-items">
                No items found in this order.
            </p>
        `;

        return;

    }


    orderItems.innerHTML =
        items
            .map(
                function (item) {

                    return `

                        <article
                            class="order-item"
                            data-medicine-id="${escapeHTML(
                                item.medicine_id
                            )}"
                        >

                            <div
                                class="order-item-image"
                            >

                                <div
                                    class="order-item-pill"
                                ></div>

                            </div>


                            <div
                                class="order-item-info"
                            >

                                <strong>
                                    ${escapeHTML(
                                        item.medicine_name
                                    )}
                                </strong>


                                <span>
                                    ₹${escapeHTML(
                                        item.unit_price
                                    )}
                                    ×
                                    ${escapeHTML(
                                        item.quantity
                                    )}
                                </span>


                                ${
                                    item.is_prescription_item
                                        ? `
                                            <small>
                                                Prescription medicine
                                            </small>
                                        `
                                        : ""
                                }

                            </div>


                            <strong
                                class="order-item-price"
                            >
                                ₹${escapeHTML(
                                    item.subtotal
                                )}
                            </strong>

                        </article>

                    `;

                }
            )
            .join("");


    /*
     * Medicine navigation
     */

    document
        .querySelectorAll(
            ".order-item"
        )
        .forEach(
            function (itemElement) {

                itemElement.addEventListener(
                    "click",
                    function () {

                        const medicineId =
                            this.dataset.medicineId;


                        if (!medicineId) {

                            return;

                        }


                        window.location.href =
                            `/medicine/${medicineId}/`;

                    }
                );

            }
        );

}


/* =========================================
   STATUS TRACKER
========================================= */

function updateStatusTracker(status) {

    const statusOrder = [

        "PLACED",

        "PACKED",

        "SHIPPED",

        "DELIVERED"

    ];


    const currentIndex =
        statusOrder.indexOf(
            status
        );


    document
        .querySelectorAll(
            ".status-step"
        )
        .forEach(
            function (step) {

                const stepStatus =
                    step.dataset.status;


                const stepIndex =
                    statusOrder.indexOf(
                        stepStatus
                    );


                step.classList.remove(
                    "completed"
                );

                step.classList.remove(
                    "active"
                );


                if (
                    stepIndex <
                    currentIndex
                ) {

                    step.classList.add(
                        "completed"
                    );

                }


                if (
                    stepIndex ===
                    currentIndex
                ) {

                    step.classList.add(
                        "active"
                    );

                }

            }
        );


    document
        .querySelectorAll(
            ".status-line"
        )
        .forEach(
            function (line, index) {

                line.classList.remove(
                    "completed"
                );


                if (
                    index <
                    currentIndex
                ) {

                    line.classList.add(
                        "completed"
                    );

                }

            }
        );

}


/* =========================================
   STATUS MESSAGE
========================================= */

function updateStatusMessage(status) {

    const messages = {

        PLACED:
            "Your order has been placed successfully.",

        PACKED:
            "Your medicines have been packed.",

        SHIPPED:
            "Your order is on its way.",

        DELIVERED:
            "Your order has been delivered successfully."

    };


    statusMessage.textContent =
        messages[status] ||
        "Your order is being processed.";

}


/* =========================================
   PAYMENT METHOD
========================================= */

function formatPaymentMethod(method) {

    const methods = {

        ONLINE:
            "Online Payment",

        COD:
            "Cash on Delivery"

    };


    return methods[method] ||
        method ||
        "-";

}


/* =========================================
   PAYMENT STATUS
========================================= */

function formatPaymentStatus(status) {

    const statuses = {

        PENDING:
            "Payment Pending",

        PAID:
            "Paid",

        FAILED:
            "Payment Failed"

    };


    return statuses[status] ||
        status ||
        "-";

}


/* =========================================
   DATE
========================================= */

function formatDate(dateString) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            dateString
        );


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================
   ERROR
========================================= */

function showOrderError(message) {

    orderError.textContent =
        message;

    orderError.style.display =
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

loadOrder();