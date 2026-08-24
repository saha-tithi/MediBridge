/* =========================================
   ORDERS PAGE ELEMENTS
========================================= */

const ordersList =
    document.getElementById("ordersList");

const ordersLoading =
    document.getElementById("ordersLoading");

const ordersEmpty =
    document.getElementById("ordersEmpty");

const ordersError =
    document.getElementById("ordersError");



/* =========================================
   LOAD ORDERS
========================================= */

async function loadOrders() {

    try {

        ordersLoading.style.display =
            "block";

        ordersList.innerHTML = "";

        ordersEmpty.style.display =
            "none";

        ordersError.style.display =
            "none";


        /* ==============================
           FETCH CUSTOMER ORDERS
        ============================== */

        const response =
            await apiRequest(
                "/orders/",
                {
                    method: "GET"
                }
            );


        console.log(
            "Orders response:",
            response
        );


        const orders =
            response.data || [];


        ordersLoading.style.display =
            "none";


        /* ==============================
           EMPTY ORDERS
        ============================== */

        if (
            !orders ||
            orders.length === 0
        ) {

            ordersEmpty.style.display =
                "block";

            return;

        }


        /* ==============================
           RENDER ORDERS
        ============================== */

        ordersList.innerHTML =
            orders
                .map(
                    function (order) {

                        return renderOrderCard(
                            order
                        );

                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "Orders page error:",
            error
        );


        ordersLoading.style.display =
            "none";


        ordersError.textContent =
            error.message ||
            "Unable to load your orders.";


        ordersError.style.display =
            "block";

    }

}



/* =========================================
   ORDER CARD
========================================= */

function renderOrderCard(order) {

    const orderId =
        order.id || "";


    const total =
        order.total_amount || "0.00";


    const status =
        order.status || "PLACED";


    const paymentStatus =
        order.payment_status || "PENDING";


    const items =
        order.items || [];


    const itemCount =
        items.length;


    return `

        <article class="order-card">


            <!-- =========================
                 HEADER
            ========================== -->

            <div class="order-card-header">

                <div>

                    <span class="order-label">
                        Order
                    </span>

                    <h2>
                        #${escapeHTML(orderId)}
                    </h2>

                </div>


                <span
                    class="order-status
                    status-${status.toLowerCase()}"
                >

                    ${formatStatus(status)}

                </span>

            </div>



            <!-- =========================
                 CONTENT
            ========================== -->

            <div class="order-card-content">


                <div class="order-items-preview">

                    ${renderItemPreview(items)}

                </div>



                <div class="order-summary">


                    <div>

                        <span>
                            Items
                        </span>

                        <strong>
                            ${itemCount}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Payment
                        </span>

                        <strong>
                            ${formatPaymentStatus(
                                paymentStatus
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Total
                        </span>

                        <strong>
                            ₹${escapeHTML(total)}
                        </strong>

                    </div>


                </div>


            </div>



            <!-- =========================
                 FOOTER
            ========================== -->

            <div class="order-card-footer">


                <span>
                    ${formatDate(
                        order.created_at
                    )}
                </span>


                <a
                    href="/orders/${orderId}/"
                    class="view-order-button"
                >
                    View Order →
                </a>


            </div>


        </article>

    `;

}



/* =========================================
   ITEM PREVIEW
========================================= */

function renderItemPreview(items) {

    if (
        !items ||
        items.length === 0
    ) {

        return `
            <p class="no-items">
                No items found.
            </p>
        `;

    }


    return items
        .slice(0, 2)
        .map(
            function (item) {

                return `

                    <div class="order-item-preview">

                        <div class="order-item-icon">

                            <div class="review-pill">
                            </div>

                        </div>


                        <div>

                            <strong>
                                ${escapeHTML(
                                    item.medicine_name ||
                                    "Medicine"
                                )}
                            </strong>


                            <span>

                                ₹${escapeHTML(
                                    item.unit_price ||
                                    "0.00"
                                )}

                                ×

                                ${item.quantity || 0}

                            </span>

                        </div>

                    </div>

                `;

            }
        )
        .join("");

}



/* =========================================
   ORDER STATUS
========================================= */

function formatStatus(status) {

    const labels = {

        PLACED:
            "Placed",

        PROCESSING:
            "Processing",

        PACKED:
            "Packed",

        SHIPPED:
            "Shipped",

        DELIVERED:
            "Delivered",

        CANCELLED:
            "Cancelled"

    };


    return labels[status] ||
        status;

}



/* =========================================
   PAYMENT STATUS
========================================= */

function formatPaymentStatus(status) {

    const labels = {

        PENDING:
            "Pending",

        PAID:
            "Paid",

        FAILED:
            "Failed"

    };


    return labels[status] ||
        status;

}



/* =========================================
   DATE
========================================= */

function formatDate(dateString) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(dateString);


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

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

loadOrders();