document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       GET ORDER ID FROM URL
       ===================================================== */

    const pathParts = window.location.pathname
        .split("/")
        .filter(Boolean);

    const orderId = pathParts[pathParts.length - 1];


    if (!orderId) {
        showError("Order ID could not be found.");
        return;
    }


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const detailLoading =
        document.getElementById("detailLoading");

    const detailError =
        document.getElementById("detailError");

    const orderContent =
        document.getElementById("orderContent");

    const orderTitle =
        document.getElementById("orderTitle");

    const orderStatus =
        document.getElementById("orderStatus");

    const orderDate =
        document.getElementById("orderDate");

    const orderTotal =
        document.getElementById("orderTotal");

    const shippingAddress =
        document.getElementById("shippingAddress");

    const orderItems =
        document.getElementById("orderItems");

    const itemCount =
        document.getElementById("itemCount");

    const paymentMethod =
        document.getElementById("paymentMethod");

    const paymentStatus =
        document.getElementById("paymentStatus");

    const paymentTotal =
        document.getElementById("paymentTotal");

    const prescriptionPanel =
        document.getElementById("prescriptionPanel");

    const prescriptionItems =
        document.getElementById("prescriptionItems");

    const prescriptionStatus =
        document.getElementById("prescriptionStatus");

    const prescriptionActions =
        document.getElementById("prescriptionActions");

    const verifyPrescriptionButton =
        document.getElementById("verifyPrescriptionButton");

    const rejectPrescriptionButton =
        document.getElementById("rejectPrescriptionButton");

    const orderActions =
        document.getElementById("orderActions");

    const actionDescription =
        document.getElementById("actionDescription");

    const newOrderStatus =
        document.getElementById("newOrderStatus");

    const updateStatusButton =
        document.getElementById("updateStatusButton");


    let currentOrder = null;

    let currentPrescriptions = [];


    /* =====================================================
       LOAD ORDER
       ===================================================== */

    async function loadOrder() {

        showLoading();

        try {

            const response = await apiRequest(
                `/orders/pharmacist/${orderId}/`,
                {
                    method: "GET"
                }
            );

            currentOrder = response.data;

            renderOrder(currentOrder);

        } catch (error) {

            console.error(
                "Failed to load order:",
                error
            );

            showError(
                error.message ||
                "Unable to load this order."
            );
        }
    }


    /* =====================================================
       RENDER ORDER
       ===================================================== */

    function renderOrder(order) {

        hideLoading();

        orderContent.style.display = "grid";

        renderHeader(order);

        renderDelivery(order);

        renderItems(order);

        renderPayment(order);

        renderPrescriptions(order);

        renderActions(order);

    }


    /* =====================================================
       HEADER
       ===================================================== */

    function renderHeader(order) {

        const id = String(order.id || "")
            .toUpperCase();

        orderTitle.textContent =
            `Order #${id.substring(0, 8)}`;

        orderStatus.textContent =
            formatStatus(order.status);

        orderStatus.className =
            `order-status ${getStatusClass(order.status)}`;

        orderDate.textContent =
            formatDateTime(order.created_at);

        orderTotal.textContent =
            formatCurrency(order.total_amount);
    }


    /* =====================================================
       DELIVERY
       ===================================================== */

    function renderDelivery(order) {

        shippingAddress.textContent =
            order.shipping_address ||
            "No shipping address available.";
    }


    /* =====================================================
       ITEMS
       ===================================================== */

    function renderItems(order) {

        const items =
            Array.isArray(order.items)
                ? order.items
                : [];

        itemCount.textContent =
            `${items.length} ${
                items.length === 1
                    ? "item"
                    : "items"
            }`;


        if (items.length === 0) {

            orderItems.innerHTML = `
                <div class="no-prescription">
                    No medicines found in this order.
                </div>
            `;

            return;
        }


        orderItems.innerHTML =
            items.map(function (item) {

                return `
                    <div class="order-item">

                        <div class="order-item-main">

                            <span class="order-item-name">
                                ${escapeHtml(
                                    item.medicine_name ||
                                    "Medicine"
                                )}
                            </span>

                            <span class="order-item-price">
                                ${formatCurrency(
                                    item.unit_price
                                )}
                                per item
                            </span>

                        </div>


                        <div class="order-item-quantity">
                            × ${item.quantity || 0}
                        </div>


                        <div class="order-item-subtotal">
                            ${formatCurrency(
                                item.subtotal
                            )}
                        </div>

                    </div>
                `;

            }).join("");
    }


    /* =====================================================
       PAYMENT
       ===================================================== */

    function renderPayment(order) {

        paymentMethod.textContent =
            formatPaymentMethod(
                order.payment_method
            );


        paymentStatus.textContent =
            formatPaymentStatus(
                order.payment_status
            );


        paymentStatus.className =
            `payment-value ${
                getPaymentClass(
                    order.payment_status
                )
            }`;


        paymentTotal.textContent =
            formatCurrency(
                order.total_amount
            );
    }


    /* =====================================================
       PRESCRIPTIONS
       ===================================================== */

    function renderPrescriptions(order) {

        const items =
            Array.isArray(order.items)
                ? order.items
                : [];


        /*
         * Find every prescription actually attached
         * to an order item.
         */

        currentPrescriptions = [];

        items.forEach(function (item) {

            if (
                item.prescription &&
                item.prescription.id
            ) {

                const alreadyExists =
                    currentPrescriptions.some(
                        function (prescription) {

                            return (
                                prescription.id ===
                                item.prescription.id
                            );

                        }
                    );


                if (!alreadyExists) {

                    currentPrescriptions.push({
                        id: item.prescription.id,
                        file_url: item.prescription.file_url,
                        status: item.prescription.status,
                        medicine_name: item.medicine_name
                    });

                }

            }

        });


        /*
         * No prescription attached
         */

        if (currentPrescriptions.length === 0) {

            prescriptionPanel.style.display =
                "none";

            if (prescriptionActions) {

                prescriptionActions.style.display =
                    "none";

            }

            return;
        }


        /*
         * Prescription attached
         */

        prescriptionPanel.style.display =
            "block";


        prescriptionItems.innerHTML =
            currentPrescriptions
                .map(function (prescription) {

                    return createPrescriptionItem(
                        prescription
                    );

                })
                .join("");


        updatePrescriptionUI();
    }


    /* =====================================================
       CREATE PRESCRIPTION ITEM
       ===================================================== */

    function createPrescriptionItem(
        prescription
    ) {

        const fileUrl =
            prescription.file_url;


        const status =
            prescription.status || "PENDING";


        const statusClass =
            status === "VERIFIED"
                ? "verified"
                : status === "REJECTED"
                    ? "rejected"
                    : "";


        const statusText =
            status === "VERIFIED"
                ? "Verified"
                : status === "REJECTED"
                    ? "Rejected"
                    : "Pending review";


        return `
            <div class="prescription-item">

                <div class="prescription-item-info">

                    <strong>
                        ${escapeHtml(
                            prescription.medicine_name ||
                            "Prescription"
                        )}
                    </strong>

                    <span>
                        Prescription attached to this order
                    </span>

                </div>


                <div class="prescription-item-actions">

                    <span
                        class="prescription-status ${statusClass}"
                    >
                        ${statusText}
                    </span>


                    ${
                        fileUrl
                            ? `
                                <a
                                    href="${escapeHtml(fileUrl)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="prescription-file"
                                >
                                    View prescription
                                    <span>↗</span>
                                </a>
                            `
                            : `
                                <span class="prescription-file">
                                    File unavailable
                                </span>
                            `
                    }

                </div>

            </div>
        `;
    }


    /* =====================================================
       PRESCRIPTION UI
       ===================================================== */

    function updatePrescriptionUI() {

        if (!prescriptionActions) {
            return;
        }


        const hasPendingPrescription =
            currentPrescriptions.some(
                function (prescription) {

                    return prescription.status === "PENDING";

                }
            );


        if (hasPendingPrescription) {

            prescriptionActions.style.display =
                "flex";

            if (verifyPrescriptionButton) {

                verifyPrescriptionButton.disabled =
                    false;

            }

            if (rejectPrescriptionButton) {

                rejectPrescriptionButton.disabled =
                    false;

            }

        }
        else {

            prescriptionActions.style.display =
                "none";
        }


        /*
         * Overall prescription status
         */

        const hasRejected =
            currentPrescriptions.some(
                function (prescription) {

                    return prescription.status === "REJECTED";

                }
            );


        const allVerified =
            currentPrescriptions.every(
                function (prescription) {

                    return prescription.status === "VERIFIED";

                }
            );


        if (hasRejected) {

            prescriptionStatus.textContent =
                "Rejected";

        }
        else if (allVerified) {

            prescriptionStatus.textContent =
                "Verified";

        }
        else {

            prescriptionStatus.textContent =
                "Attached";

        }
    }


    /* =====================================================
       VERIFY PRESCRIPTION
       ===================================================== */

    if (verifyPrescriptionButton) {

        verifyPrescriptionButton.addEventListener(
            "click",
            function () {

                updatePrescriptionStatus(
                    "VERIFIED"
                );

            }
        );

    }


    /* =====================================================
       REJECT PRESCRIPTION
       ===================================================== */

    if (rejectPrescriptionButton) {

        rejectPrescriptionButton.addEventListener(
            "click",
            function () {

                updatePrescriptionStatus(
                    "REJECTED"
                );

            }
        );

    }


    /* =====================================================
       UPDATE PRESCRIPTION STATUS
       ===================================================== */

    async function updatePrescriptionStatus(
        newStatus
    ) {

        const pendingPrescriptions =
            currentPrescriptions.filter(
                function (prescription) {

                    return prescription.status === "PENDING";

                }
            );


        if (pendingPrescriptions.length === 0) {

            return;
        }


        let pharmacistNote = "";


        if (newStatus === "REJECTED") {

            pharmacistNote =
                window.prompt(
                    "Enter a reason for rejecting the prescription:"
                );


            if (pharmacistNote === null) {

                return;
            }


            pharmacistNote =
                pharmacistNote.trim();


            if (!pharmacistNote) {

                showActionError(
                    "Please provide a reason for rejecting the prescription."
                );

                return;
            }

        }
        else {

            const confirmed =
                window.confirm(
                    "Verify this prescription?"
                );


            if (!confirmed) {

                return;
            }


            pharmacistNote =
                window.prompt(
                    "Add an optional note:",
                    ""
                );


            if (pharmacistNote === null) {

                pharmacistNote = "";

            }

        }


        if (verifyPrescriptionButton) {

            verifyPrescriptionButton.disabled =
                true;

        }


        if (rejectPrescriptionButton) {

            rejectPrescriptionButton.disabled =
                true;

        }


        try {

            /*
             * At the moment all attached order items
             * should point to the same uploaded
             * prescription.
             *
             * We therefore update each pending
             * prescription returned by the order.
             */

            for (
                const prescription
                of pendingPrescriptions
            ) {

                await apiRequest(
                    `/prescriptions/pharmacist/${prescription.id}/verify/`,
                    {
                        method: "PATCH",

                        body: JSON.stringify({

                            status: newStatus,

                            pharmacist_note:
                                pharmacistNote

                        })
                    }
                );

            }


            /*
             * Reload the order so the UI gets the
             * latest prescription status.
             */

            await loadOrder();


        } catch (error) {

            console.error(
                "Failed to update prescription:",
                error
            );


            showActionError(
                error.message ||
                "Unable to update the prescription."
            );


            if (verifyPrescriptionButton) {

                verifyPrescriptionButton.disabled =
                    false;

            }


            if (rejectPrescriptionButton) {

                rejectPrescriptionButton.disabled =
                    false;

            }

        }

    }


    /* =====================================================
       ORDER ACTIONS
       ===================================================== */

    function renderActions(order) {

        orderActions.innerHTML = "";

        const status = order.status;


        /*
         * PLACED
         *
         * Pharmacist can process the order.
         */

        if (status === "PLACED") {

            actionDescription.textContent =
                "Review the order and attached prescription before processing.";

            orderActions.innerHTML = `
                <button
                    type="button"
                    id="processOrderButton"
                    class="action-button primary-action-button"
                >
                    Process order
                </button>

                <p class="action-note">
                    Processing will check stock and
                    prescription verification.
                </p>
            `;


            const processButton =
                document.getElementById(
                    "processOrderButton"
                );


            processButton.addEventListener(
                "click",
                processOrder
            );


            return;
        }


        /*
         * PROCESSING
         */

        if (status === "PROCESSING") {

            actionDescription.textContent =
                "This order is currently being processed.";

            orderActions.innerHTML = `
                <div class="action-note">
                    Continue preparing this order.
                </div>
            `;

            return;
        }


        /*
         * PACKED
         */

        if (status === "PACKED") {

            actionDescription.textContent =
                "The order is packed and ready for shipment.";

            orderActions.innerHTML = `
                <div class="action-note">
                    Use the status section below
                    to mark this order as shipped.
                </div>
            `;

            return;
        }


        /*
         * SHIPPED
         */

        if (status === "SHIPPED") {

            actionDescription.textContent =
                "The order has been shipped.";

            orderActions.innerHTML = `
                <div class="action-note">
                    Update the status to Delivered
                    when the customer receives the order.
                </div>
            `;

            return;
        }


        /*
         * DELIVERED
         */

        if (status === "DELIVERED") {

            actionDescription.textContent =
                "This order has been delivered.";

            orderActions.innerHTML = `
                <div class="action-note">
                    No further action is required.
                </div>
            `;

            return;
        }


        /*
         * CANCELLED
         */

        if (status === "CANCELLED") {

            actionDescription.textContent =
                "This order has been cancelled.";

            orderActions.innerHTML = `
                <div class="action-note">
                    No further action is available.
                </div>
            `;

        }

    }


    /* =====================================================
       PROCESS ORDER
       ===================================================== */

    async function processOrder() {

        const button =
            document.getElementById(
                "processOrderButton"
            );


        if (!button) {
            return;
        }


        const confirmed =
            window.confirm(
                "Process this order?"
            );


        if (!confirmed) {
            return;
        }


        button.disabled = true;

        button.textContent =
            "Processing...";


        try {

            const response =
                await apiRequest(
                    `/orders/pharmacist/${orderId}/process/`,
                    {
                        method: "POST"
                    }
                );


            currentOrder =
                response.data;


            renderOrder(currentOrder);


        } catch (error) {

            console.error(
                "Failed to process order:",
                error
            );


            button.disabled = false;

            button.textContent =
                "Process order";


            showActionError(
                error.message ||
                "Unable to process this order."
            );

        }

    }


    /* =====================================================
       UPDATE STATUS
       ===================================================== */

    updateStatusButton.addEventListener(
        "click",
        updateOrderStatus
    );


    async function updateOrderStatus() {

        const newStatus =
            newOrderStatus.value;


        if (!newStatus) {

            showActionError(
                "Please select a status."
            );

            return;
        }


        const confirmed =
            window.confirm(
                `Mark this order as ${formatStatus(
                    newStatus
                )}?`
            );


        if (!confirmed) {
            return;
        }


        updateStatusButton.disabled =
            true;

        updateStatusButton.textContent =
            "Updating...";


        try {

            const response =
                await apiRequest(
                    `/orders/pharmacist/${orderId}/status/`,
                    {
                        method: "PATCH",

                        body: JSON.stringify({
                            status: newStatus
                        })
                    }
                );


            currentOrder =
                response.data;


            newOrderStatus.value = "";

            renderOrder(currentOrder);


        } catch (error) {

            console.error(
                "Failed to update order:",
                error
            );


            showActionError(
                error.message ||
                "Unable to update order status."
            );

        } finally {

            updateStatusButton.disabled =
                false;

            updateStatusButton.textContent =
                "Update status";
        }

    }


    /* =====================================================
       DATE
       ===================================================== */

    function formatDateTime(value) {

        if (!value) {
            return "Date unavailable";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "Date unavailable";
        }


        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    /* =====================================================
       CURRENCY
       ===================================================== */

    function formatCurrency(value) {

        const amount =
            Number(value);


        if (Number.isNaN(amount)) {
            return "₹—";
        }


        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2
            }
        ).format(amount);
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

    function getPaymentClass(status) {

        switch (status) {

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


    function formatPaymentStatus(status) {

        switch (status) {

            case "PENDING":
                return "Payment pending";

            case "PAID":
                return "Payment paid";

            case "FAILED":
                return "Payment failed";

            default:
                return status || "Unknown";
        }
    }


    function formatPaymentMethod(method) {

        switch (method) {

            case "ONLINE":
                return "Online";

            case "COD":
                return "Cash on Delivery";

            default:
                return method || "Unknown";
        }
    }


    /* =====================================================
       LOADING / ERROR
       ===================================================== */

    function showLoading() {

        detailLoading.style.display =
            "grid";

        orderContent.style.display =
            "none";

        detailError.style.display =
            "none";
    }


    function hideLoading() {

        detailLoading.style.display =
            "none";
    }


    function showError(message) {

        detailLoading.style.display =
            "none";

        orderContent.style.display =
            "none";

        detailError.textContent =
            message;

        detailError.style.display =
            "block";
    }


    function showActionError(message) {

        window.alert(message);
    }


    /* =====================================================
       BASIC HTML ESCAPING
       ===================================================== */

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       START
       ===================================================== */

    loadOrder();

});