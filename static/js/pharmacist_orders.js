document.addEventListener("DOMContentLoaded", function () {

    const ordersList = document.getElementById("ordersList");
    const ordersLoading = document.getElementById("ordersLoading");
    const ordersEmpty = document.getElementById("ordersEmpty");
    const ordersError = document.getElementById("ordersError");

    const ordersTotal = document.getElementById("ordersTotal");
    const ordersResultCount =
        document.getElementById("ordersResultCount");

    const orderSearch =
        document.getElementById("orderSearch");

    const statusFilter =
        document.getElementById("statusFilter");

    const paymentFilter =
        document.getElementById("paymentFilter");


    /* =====================================================
       ACTIVE ORDERS ELEMENTS
       ===================================================== */

    const activeOrdersList =
        document.getElementById("activeOrdersList");

    const activeOrdersLoading =
        document.getElementById("activeOrdersLoading");

    const activeOrdersEmpty =
        document.getElementById("activeOrdersEmpty");

    const activeOrdersError =
        document.getElementById("activeOrdersError");

    const activeOrdersCount =
        document.getElementById("activeOrdersCount");


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

            ordersTotal.textContent =
                allOrders.length;

            renderOrders();

            renderActiveOrders();

        } catch (error) {

            console.error(
                "Failed to load pharmacist orders:",
                error
            );

            hideLoading();

            ordersList.innerHTML = "";

            ordersError.textContent =
                error.message ||
                "Unable to load orders. Please try again.";

            ordersError.style.display = "block";

            showActiveOrdersError(
                error.message ||
                "Unable to load active orders."
            );
        }
    }


    /* =====================================================
       RENDER ALL ORDERS
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


        const filteredOrders =
            allOrders.filter(function (order) {

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
       RENDER ACTIVE ORDERS
       ===================================================== */

    function renderActiveOrders() {

        if (!activeOrdersList) {
            return;
        }


        hideActiveOrdersLoading();

        hideActiveOrdersError();


        const activeOrders =
            allOrders
                .filter(function (order) {

                    return (
                        order.status === "PACKED" ||
                        order.status === "SHIPPED"
                    );

                })
                .sort(function (a, b) {

                    const dateA =
                        new Date(
                            a.updated_at ||
                            a.created_at ||
                            0
                        );

                    const dateB =
                        new Date(
                            b.updated_at ||
                            b.created_at ||
                            0
                        );

                    return dateA - dateB;
                });


        activeOrdersCount.textContent =
            activeOrders.length;


        if (activeOrders.length === 0) {

            activeOrdersList.innerHTML = "";

            activeOrdersList.style.display =
                "none";

            activeOrdersEmpty.style.display =
                "flex";

            return;
        }


        activeOrdersEmpty.style.display =
            "none";

        activeOrdersList.style.display =
            "block";


        activeOrdersList.innerHTML =
            activeOrders
                .map(function (order) {
                    return createActiveOrderItem(order);
                })
                .join("");
    }


    /* =====================================================
       CREATE ACTIVE ORDER ITEM
       ===================================================== */

    function createActiveOrderItem(order) {

        const orderId =
            String(order.id || "")
                .toUpperCase();


        const shortOrderId =
            orderId.length > 8
                ? orderId.substring(0, 8)
                : orderId;


        const statusClass =
            order.status === "PACKED"
                ? "status-packed"
                : "status-shipped";


        const statusText =
            order.status === "PACKED"
                ? "Packed"
                : "Shipped";


        const amount =
            order.total_amount !== undefined &&
            order.total_amount !== null
                ? `₹${order.total_amount}`
                : "—";


        const activityDate =
            order.updated_at ||
            order.created_at;


        const activityTime =
            formatRelativeTime(activityDate);


        return `
            <a
                href="/pharmacist/orders/${order.id}/"
                class="active-order-item"
            >

                <div class="active-order-top">

                    <span class="active-order-id">
                        #${shortOrderId}
                    </span>

                    <span
                        class="active-order-status ${statusClass}"
                    >
                        ${statusText}
                    </span>

                </div>


                <div class="active-order-customer">
                    ${getCustomerName(order)}
                </div>


                <div class="active-order-meta">

                    <span class="active-order-time">
                        ${activityTime}
                    </span>

                    <span class="active-order-amount">
                        ${amount}
                        <span class="active-order-arrow">
                            →
                        </span>
                    </span>

                </div>

            </a>
        `;
    }


    /* =====================================================
       CUSTOMER NAME
       ===================================================== */

    function getCustomerName(order) {

        if (order.customer_name) {
            return escapeHtml(
                order.customer_name
            );
        }


        if (
            order.customer &&
            typeof order.customer === "object"
        ) {

            const customer =
                order.customer;


            const fullName = [
                customer.first_name,
                customer.last_name
            ]
                .filter(Boolean)
                .join(" ");


            if (fullName) {
                return escapeHtml(fullName);
            }


            if (customer.username) {
                return escapeHtml(
                    customer.username
                );
            }

        }


        return "Customer order";
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
            getPaymentClass(
                order.payment_status
            );


        const statusText =
            formatStatus(order.status);


        const paymentText =
            formatPaymentStatus(
                order.payment_status
            );


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
                        ${itemCount === 1
                            ? "item"
                            : "items"}
                    </span>

                </div>


                <div class="order-prescription">

                    <span class="order-meta-label">
                        Prescription
                    </span>

                    ${
                        hasPrescription
                            ? `
                                <span
                                    class="prescription-indicator"
                                >
                                    <span
                                        class="prescription-dot"
                                    ></span>
                                    Required
                                </span>
                            `
                            : `
                                <span
                                    class="prescription-indicator none"
                                >
                                    <span
                                        class="prescription-dot"
                                    ></span>
                                    Not required
                                </span>
                            `
                    }

                </div>


                <div class="order-status-block">

                    <span class="order-meta-label">
                        Status
                    </span>

                    <span
                        class="order-status ${statusClass}"
                    >
                        ${statusText}
                    </span>

                    <span
                        class="payment-status ${paymentClass}"
                    >
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
       RELATIVE TIME
       ===================================================== */

    function formatRelativeTime(dateValue) {

        if (!dateValue) {
            return "Time unavailable";
        }


        const date =
            new Date(dateValue);


        if (Number.isNaN(date.getTime())) {
            return "Time unavailable";
        }


        const now =
            new Date();


        const difference =
            Math.max(
                0,
                now.getTime() -
                date.getTime()
            );


        const minutes =
            Math.floor(
                difference /
                (1000 * 60)
            );


        if (minutes < 1) {
            return "Just now";
        }


        if (minutes < 60) {

            return (
                minutes +
                (
                    minutes === 1
                        ? " min ago"
                        : " mins ago"
                )
            );

        }


        const hours =
            Math.floor(
                minutes / 60
            );


        if (hours < 24) {

            return (
                hours +
                (
                    hours === 1
                        ? " hour ago"
                        : " hours ago"
                )
            );

        }


        const days =
            Math.floor(
                hours / 24
            );


        if (days === 1) {
            return "Yesterday";
        }


        if (days < 7) {

            return (
                days +
                " days ago"
            );

        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short"
            }
        );
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
                return (
                    paymentStatus ||
                    "Payment unknown"
                );
        }
    }


    /* =====================================================
       ACTIVE ORDERS LOADING
       ===================================================== */

    function hideActiveOrdersLoading() {

        if (activeOrdersLoading) {
            activeOrdersLoading.style.display =
                "none";
        }
    }


    function showActiveOrdersError(message) {

        hideActiveOrdersLoading();

        if (activeOrdersList) {
            activeOrdersList.style.display =
                "none";
        }

        if (activeOrdersEmpty) {
            activeOrdersEmpty.style.display =
                "none";
        }

        if (activeOrdersError) {
            activeOrdersError.textContent =
                message;

            activeOrdersError.style.display =
                "block";
        }
    }


    function hideActiveOrdersError() {

        if (activeOrdersError) {
            activeOrdersError.style.display =
                "none";
        }
    }


    /* =====================================================
       MAIN LOADING STATE
       ===================================================== */

    function showLoading() {

        ordersLoading.style.display =
            "block";

        ordersEmpty.style.display =
            "none";

        ordersError.style.display =
            "none";

        ordersList.innerHTML = "";
    }


    function hideLoading() {

        ordersLoading.style.display =
            "none";
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
       HTML ESCAPE
       ===================================================== */

    function escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent =
            value ?? "";

        return div.innerHTML;
    }


    /* =====================================================
       START
       ===================================================== */

    loadOrders();

});