document.addEventListener("DOMContentLoaded", function () {

    const totalOrdersElement =
        document.getElementById("totalOrders");

    const ordersToProcessElement =
        document.getElementById("ordersToProcess");

    const prescriptionOrdersElement =
        document.getElementById("prescriptionOrders");

    const pendingPaymentsElement =
        document.getElementById("pendingPayments");

    const recentOrdersElement =
        document.getElementById("recentOrders");

    const ordersLoading =
        document.getElementById("ordersLoading");

    const ordersEmpty =
        document.getElementById("ordersEmpty");

    const statusList =
        document.getElementById("orderStatusList");

    const statusEmpty =
        document.getElementById("statusEmpty");

    const overviewError =
        document.getElementById("overviewError");


    /* =========================================
       LOAD ORDERS
    ========================================== */

    async function loadOverview() {

        showLoading();

        try {

            const response = await apiRequest(
                "/orders/pharmacist/",
                {
                    method: "GET"
                }
            );

            const orders =
                response.data || [];

            if (!Array.isArray(orders)) {
                throw new Error(
                    "Invalid order data received."
                );
            }

            updateStatistics(orders);

            renderRecentOrders(orders);

            renderOrderStatus(orders);

            hideLoading();

        } catch (error) {

            console.error(
                "Pharmacist overview error:",
                error
            );

            showError(
                error.message ||
                "Unable to load pharmacy information."
            );

        }

    }


    /* =========================================
       STATISTICS
    ========================================== */

    function updateStatistics(orders) {

        const totalOrders =
            orders.length;


        const ordersToProcess =
            orders.filter(function (order) {

                return (
                    order.status === "PLACED" ||
                    order.status === "PROCESSING"
                );

            }).length;


        const prescriptionOrders =
            orders.filter(function (order) {

                return Array.isArray(order.items) &&
                    order.items.some(function (item) {

                        return item.is_prescription_item === true;

                    });

            }).length;


        const pendingPayments =
            orders.filter(function (order) {

                return order.payment_status === "PENDING";

            }).length;


        totalOrdersElement.textContent =
            totalOrders;

        ordersToProcessElement.textContent =
            ordersToProcess;

        prescriptionOrdersElement.textContent =
            prescriptionOrders;

        pendingPaymentsElement.textContent =
            pendingPayments;

    }


    /* =========================================
       RECENT ORDERS
    ========================================== */

    function renderRecentOrders(orders) {

        recentOrdersElement.innerHTML = "";

        if (orders.length === 0) {

            ordersEmpty.style.display =
                "flex";

            return;

        }

        ordersEmpty.style.display =
            "none";


        const recentOrders =
            orders.slice(0, 5);


        recentOrders.forEach(function (order) {

            const orderElement =
                document.createElement("a");

            orderElement.className =
                "recent-order";

            orderElement.href =
                `/pharmacist/orders/${order.id}/`;


            const shortId =
                formatOrderId(order.id);


            const amount =
                formatAmount(order.total_amount);


            const date =
                formatDate(order.created_at);


            const statusClass =
                getStatusClass(order.status);


            const statusText =
                formatStatus(order.status);


            orderElement.innerHTML = `

                <div class="recent-order-main">

                    <div class="recent-order-icon">
                        ◫
                    </div>

                    <div class="recent-order-info">

                        <span class="recent-order-id">
                            Order #${shortId}
                        </span>

                        <span class="recent-order-date">
                            ${date}
                        </span>

                    </div>

                </div>


                <div class="recent-order-side">

                    <span class="recent-order-amount">
                        ₹${amount}
                    </span>

                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>

                </div>

            `;


            recentOrdersElement.appendChild(
                orderElement
            );

        });

    }


    /* =========================================
       ORDER STATUS
    ========================================== */

    function renderOrderStatus(orders) {

        statusList.innerHTML = "";


        if (orders.length === 0) {

            statusEmpty.style.display =
                "flex";

            return;

        }


        statusEmpty.style.display =
            "none";


        const statuses = [

            {
                key: "PLACED",
                label: "Placed"
            },

            {
                key: "PROCESSING",
                label: "Processing"
            },

            {
                key: "PACKED",
                label: "Packed"
            },

            {
                key: "SHIPPED",
                label: "Shipped"
            },

            {
                key: "DELIVERED",
                label: "Delivered"
            },

            {
                key: "CANCELLED",
                label: "Cancelled"
            }

        ];


        statuses.forEach(function (status) {

            const count =
                orders.filter(function (order) {

                    return order.status === status.key;

                }).length;


            if (count === 0) {
                return;
            }


            const percentage =
                (count / orders.length) * 100;


            const item =
                document.createElement("div");

            item.className =
                "order-status-item";


            item.innerHTML = `

                <div class="order-status-top">

                    <span class="order-status-name">

                        <span class="order-status-dot"></span>

                        ${status.label}

                    </span>

                    <span class="order-status-count">
                        ${count}
                    </span>

                </div>


                <div class="order-status-bar">

                    <div
                        class="order-status-fill"
                        style="width: ${percentage}%"
                    ></div>

                </div>

            `;


            statusList.appendChild(item);

        });

    }


    /* =========================================
       FORMAT ORDER ID
    ========================================== */

    function formatOrderId(id) {

        if (!id) {
            return "—";
        }

        return id
            .toString()
            .replace(/-/g, "")
            .substring(0, 8)
            .toUpperCase();

    }


    /* =========================================
       FORMAT AMOUNT
    ========================================== */

    function formatAmount(amount) {

        if (amount === null || amount === undefined) {
            return "0.00";
        }

        const number =
            Number(amount);

        if (Number.isNaN(number)) {
            return "0.00";
        }

        return number.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

    }


    /* =========================================
       FORMAT DATE
    ========================================== */

    function formatDate(dateString) {

        if (!dateString) {
            return "Date unavailable";
        }


        const date =
            new Date(dateString);


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


    /* =========================================
       FORMAT STATUS
    ========================================== */

    function formatStatus(status) {

        const statuses = {

            PLACED: "Placed",

            PROCESSING: "Processing",

            PACKED: "Packed",

            SHIPPED: "Shipped",

            DELIVERED: "Delivered",

            CANCELLED: "Cancelled"

        };


        return statuses[status] ||
            status ||
            "Unknown";

    }


    /* =========================================
       STATUS CLASS
    ========================================== */

    function getStatusClass(status) {

        const classes = {

            PLACED:
                "status-placed",

            PROCESSING:
                "status-processing",

            PACKED:
                "status-packed",

            SHIPPED:
                "status-shipped",

            DELIVERED:
                "status-delivered",

            CANCELLED:
                "status-cancelled"

        };


        return classes[status] ||
            "status-placed";

    }


    /* =========================================
       LOADING
    ========================================== */

    function showLoading() {

        ordersLoading.style.display =
            "block";

        ordersEmpty.style.display =
            "none";

        recentOrdersElement.innerHTML = "";

        statusList.innerHTML = "";

        overviewError.style.display =
            "none";

    }


    function hideLoading() {

        ordersLoading.style.display =
            "none";

    }


    /* =========================================
       ERROR
    ========================================== */

    function showError(message) {

        hideLoading();

        overviewError.textContent =
            message;

        overviewError.style.display =
            "block";

    }


    /* =========================================
       INITIAL LOAD
    ========================================== */

    loadOverview();

});