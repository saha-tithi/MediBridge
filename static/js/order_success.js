/* =========================================
   ORDER SUCCESS
========================================= */

const orderDetails =
    document.getElementById(
        "orderDetails"
    );


/* =========================================
   ORDER ID
========================================= */

const pathParts =
    window.location.pathname
        .split("/")
        .filter(Boolean);


const orderId =
    pathParts[pathParts.length - 1];



/* =========================================
   LOAD ORDER
========================================= */

async function loadOrder() {

    try {

        const response =
            await apiRequest(
                `/orders/${orderId}/`,
                {
                    method: "GET"
                }
            );


        const order =
            response.data;


        if (!order) {

            throw new Error(
                "Order details could not be found."
            );

        }


        renderOrder(
            order
        );


    } catch (error) {

        console.error(
            "Order loading error:",
            error
        );


        orderDetails.innerHTML = `

            <div class="order-error">

                Unable to load your order details.

            </div>

        `;

    }

}



/* =========================================
   RENDER ORDER
========================================= */

function renderOrder(order) {

    const paymentMethod =
        order.payment_method === "COD"
            ? "Cash on Delivery"
            : "Online Payment";


    const paymentStatus =
        order.payment_status === "PAID"
            ? "Paid"
            : "Payment Pending";


    orderDetails.innerHTML = `

        <div class="order-detail-row">

            <span>
                Order ID
            </span>

            <strong>
                ${escapeHTML(order.id)}
            </strong>

        </div>


        <div class="order-detail-row">

            <span>
                Total Amount
            </span>

            <strong>
                ₹${escapeHTML(
                    order.total_amount
                )}
            </strong>

        </div>


        <div class="order-detail-row">

            <span>
                Payment
            </span>

            <strong>
                ${paymentMethod}
            </strong>

        </div>


        <div class="order-detail-row">

            <span>
                Payment Status
            </span>

            <strong>
                ${paymentStatus}
            </strong>

        </div>


        <div class="order-detail-row">

            <span>
                Order Status
            </span>

            <strong class="order-status">

                ${escapeHTML(
                    order.status
                )}

            </strong>

        </div>

    `;

}



/* =========================================
   ESCAPE HTML
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