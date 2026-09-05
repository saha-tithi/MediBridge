document.addEventListener("DOMContentLoaded", function () {

    const ordersList = document.getElementById("ordersList");
    const ordersLoading = document.getElementById("ordersLoading");
    const ordersEmpty = document.getElementById("ordersEmpty");
    const ordersError = document.getElementById("ordersError");

    const ordersTotal = document.getElementById("ordersTotal");
    const ordersResultCount = document.getElementById("ordersResultCount");

    const orderSearch = document.getElementById("orderSearch");
    const statusFilter = document.getElementById("statusFilter");
    const paymentFilter = document.getElementById("paymentFilter");

    let allOrders = [];


    /* =====================================================
       LOAD ORDERS
       ===================================================== */

    async function loadOrders() {

        showLoading();

        try {

            const response = await apiRequest(
                "/orders/pharmacist/",
                {
                    method: "GET"
                }
            );

            allOrders = response.data || [];

            ordersTotal.textContent = allOrders.length;

            renderOrders();

        } catch (error) {

            console.error("Failed to load pharmacist orders:", error);

            hideLoading();

            ordersList.innerHTML = "";

            ordersError.textContent =
                error.message ||
                "Unable to load orders. Please try again.";

            ordersError.style.display = "block";

        }
    }


    /* =====================================================
       RENDER ORDERS
       ===================================================== */

    function renderOrders() {

        hideLoading();

        ordersError.style.display = "none";

        const searchValue =
            orderSearch.value
                .trim()
                .toLowerCase();

        const selectedStatus =
            statusFilter.value;

        const selectedPayment =
            paymentFilter.value;


        const filteredOrders = allOrders.filter(function (order) {

            const orderId =
                String(order.id || "")
                    .toLowerCase();

            const matchesSearch =
                !searchValue ||
                orderId.includes(searchValue);


            const matchesStatus =
                selectedStatus === "ALL" ||
                order.status === selectedStatus;


            const matchesPayment =
                selectedPayment === "ALL" ||
                order.payment_status === selectedPayment;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesPayment
            );

        });


        ordersResultCount.textContent =
            filteredOrders.length +
            (
                filteredOrders.length === 1
                    ? " order"
                    : " orders"
            );


        if (filteredOrders.length === 0) {

            ordersList.innerHTML = "";

            ordersEmpty.style.display = "flex";

            return;
        }


        ordersEmpty.style.display = "none";


        ordersList.innerHTML =
            filteredOrders
                .map(function (order) {
                    return createOrderRow(order);
                })
                .join("");
    }


    /* =====================================================
       CREATE ORDER ROW
       ===================================================== */

    function createOrderRow(order) {

        const orderId =
            String(order.id || "")
                .toUpperCase();


        const shortOrderId =
            orderId.length > 8
                ? orderId.substring(0, 8)
                : orderId;


        const orderDate =
            formatDate(order.created_at);


        const itemCount =
            Array.isArray(order.items)
                ? order.items.length
                : 0;


        const hasPrescription =
            Array.isArray(order.items) &&
            order.items.some(function (item) {
                return (
                    item.is_prescription_item === true ||
                    item.prescription !== null
                );
            });


        const statusClass =
            getStatusClass(order.status);


        const paymentClass =
            getPaymentClass(order.payment_status);


        const statusText =
            formatStatus(order.status);


        const paymentText =
            formatPaymentStatus(order.payment_status);


        return `
            <a
                href="/pharmacist/orders/${order.id}/"
                class="order-row"
            >

                <div class="order-main">

                    <span class="order-id">
                        #${shortOrderId}
                    </span>

                    <span class="order-date">
                        ${orderDate}
                    </span>

                </div>


                <div class="order-meta">

                    <span class="order-meta-label">
                        Items
                    </span>

                    <span class="order-meta-value">
                        ${itemCount}
                        ${itemCount === 1 ? "item" : "items"}
                    </span>

                </div>


                <div class="order-prescription">

                    <span class="order-meta-label">
                        Prescription
                    </span>

                    ${
                        hasPrescription
                            ? `
                                <span class="prescription-indicator">
                                    <span class="prescription-dot"></span>
                                    Required
                                </span>
                            `
                            : `
                                <span class="prescription-indicator none">
                                    <span class="prescription-dot"></span>
                                    Not required
                                </span>
                            `
                    }

                </div>


                <div class="order-status-block">

                    <span class="order-meta-label">
                        Status
                    </span>

                    <span class="order-status ${statusClass}">
                        ${statusText}
                    </span>

                    <span class="payment-status ${paymentClass}">
                        ${paymentText}
                    </span>

                </div>


                <div class="order-action">

                    View order

                    <span>→</span>

                </div>

            </a>
        `;
    }


    /* =====================================================
       DATE FORMAT
       ===================================================== */

    function formatDate(dateValue) {

        if (!dateValue) {
            return "Date unavailable";
        }


        const date =
            new Date(dateValue);


        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    /* =====================================================
       STATUS HELPERS
       ===================================================== */

    function getStatusClass(status) {

        switch (status) {

            case "PLACED":
                return "status-placed";

            case "PROCESSING":
                return "status-processing";

            case "PACKED":
                return "status-packed";

            case "SHIPPED":
                return "status-shipped";

            case "DELIVERED":
                return "status-delivered";

            case "CANCELLED":
                return "status-cancelled";

            default:
                return "";
        }
    }


    function formatStatus(status) {

        switch (status) {

            case "PLACED":
                return "Placed";

            case "PROCESSING":
                return "Processing";

            case "PACKED":
                return "Packed";

            case "SHIPPED":
                return "Shipped";

            case "DELIVERED":
                return "Delivered";

            case "CANCELLED":
                return "Cancelled";

            default:
                return status || "Unknown";
        }
    }


    /* =====================================================
       PAYMENT HELPERS
       ===================================================== */

    function getPaymentClass(paymentStatus) {

        switch (paymentStatus) {

            case "PENDING":
                return "payment-pending";

            case "PAID":
                return "payment-paid";

            case "FAILED":
                return "payment-failed";

            default:
                return "";
        }
    }


    function formatPaymentStatus(paymentStatus) {

        switch (paymentStatus) {

            case "PENDING":
                return "Payment pending";

            case "PAID":
                return "Payment paid";

            case "FAILED":
                return "Payment failed";

            default:
                return paymentStatus || "Payment unknown";
        }
    }


    /* =====================================================
       LOADING STATE
       ===================================================== */

    function showLoading() {

        ordersLoading.style.display = "block";

        ordersEmpty.style.display = "none";

        ordersError.style.display = "none";

        ordersList.innerHTML = "";
    }


    function hideLoading() {

        ordersLoading.style.display = "none";
    }


    /* =====================================================
       SEARCH
       ===================================================== */

    orderSearch.addEventListener(
        "input",
        function () {
            renderOrders();
        }
    );


    /* =====================================================
       FILTERS
       ===================================================== */

    statusFilter.addEventListener(
        "change",
        function () {
            renderOrders();
        }
    );


    paymentFilter.addEventListener(
        "change",
        function () {
            renderOrders();
        }
    );


    /* =====================================================
       START
       ===================================================== */

    loadOrders();

});