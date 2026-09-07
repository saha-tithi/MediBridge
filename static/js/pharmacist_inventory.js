document.addEventListener("DOMContentLoaded", function () {

    const totalInventory =
        document.getElementById("totalInventory");

    const inStockInventory =
        document.getElementById("inStockInventory");

    const lowStockInventory =
        document.getElementById("lowStockInventory");

    const outOfStockInventory =
        document.getElementById("outOfStockInventory");

    const searchInput =
        document.getElementById("inventorySearch");

    const filterSelect =
        document.getElementById("inventoryFilter");

    const tableWrapper =
        document.getElementById("inventoryTableWrapper");

    const tableBody =
        document.getElementById("inventoryTableBody");

    const loading =
        document.getElementById("inventoryLoading");

    const empty =
        document.getElementById("inventoryEmpty");

    const errorMessage =
        document.getElementById("inventoryError");

    const results =
        document.getElementById("inventoryResults");


    let inventory = [];


    /* =========================================
       LOAD INVENTORY
    ========================================== */

    async function loadInventory() {

        showLoading();

        try {

            const response = await apiRequest(
                "/medicine/pharmacist/inventory/",
                {
                    method: "GET"
                }
            );

            if (Array.isArray(response)) {

    inventory = response;

} else {

    inventory =
        response.results ||
        response.data ||
        [];

}

            if (!Array.isArray(inventory)) {
                throw new Error(
                    "Invalid inventory data received."
                );
            }

            updateStatistics();

            renderInventory();

            hideLoading();

        } catch (error) {

            console.error(
                "Pharmacist inventory error:",
                error
            );

            showError(
                error.message ||
                "Unable to load inventory."
            );

        }

    }


    /* =========================================
       STATISTICS
    ========================================== */

    function updateStatistics() {

        const total =
            inventory.length;


        const inStock =
            inventory.filter(function (item) {

                return (
                    Number(item.stock) > 0 &&
                    item.is_available === true
                );

            }).length;


        const lowStock =
            inventory.filter(function (item) {

                const stock =
                    Number(item.stock);

                return (
                    stock > 0 &&
                    stock <= 10 &&
                    item.is_available === true
                );

            }).length;


        const outOfStock =
            inventory.filter(function (item) {

                return Number(item.stock) === 0;

            }).length;


        totalInventory.textContent =
            total;

        inStockInventory.textContent =
            inStock;

        lowStockInventory.textContent =
            lowStock;

        outOfStockInventory.textContent =
            outOfStock;

    }


    /* =========================================
       RENDER INVENTORY
    ========================================== */

    function renderInventory() {

        tableBody.innerHTML = "";


        const filteredInventory =
            getFilteredInventory();


        if (filteredInventory.length === 0) {

            tableWrapper.style.display =
                "none";

            results.style.display =
                "none";

            empty.style.display =
                "flex";

            return;

        }


        empty.style.display =
            "none";

        tableWrapper.style.display =
            "block";

        results.style.display =
            "block";


        filteredInventory.forEach(function (item) {

            const row =
                document.createElement("tr");


            const medicineName =
                item.medicine_name ||
                "Unknown medicine";


            const genericName =
                item.generic_name ||
                "";


            const strength =
                item.strength ||
                "";


            const stock =
                Number(item.stock) || 0;


            const stockClass =
                getStockClass(stock);


            const expiry =
                formatExpiry(
                    item.expiry_date
                );


            const availability =
                item.is_available === true;


            row.innerHTML = `

                <td>

                    <div class="inventory-medicine">

                        <span class="inventory-medicine-name">
                            ${escapeHtml(medicineName)}
                        </span>

                        <span class="inventory-medicine-details">
                            ${escapeHtml(genericName)}
                            ${genericName && strength ? " · " : ""}
                            ${escapeHtml(strength)}
                        </span>

                    </div>

                </td>


                <td>

                    <span class="inventory-stock ${stockClass}">
                        ${stock}
                    </span>

                </td>


                <td>

                    <span class="inventory-batch">
                        ${escapeHtml(
                            item.batch_number || "—"
                        )}
                    </span>

                </td>


                <td>

                    <span class="inventory-price">
                        ₹${formatAmount(item.selling_price)}
                    </span>

                </td>


                <td>

                    <div class="inventory-expiry">

                        <span class="inventory-expiry-date">
                            ${expiry.text}
                        </span>

                        ${
                            expiry.warning
                                ? `
                                    <span class="${expiry.className}">
                                        ${expiry.warning}
                                    </span>
                                `
                                : ""
                        }

                    </div>

                </td>


                <td>

                    ${
                        availability
                            ? `
                                <span class="inventory-availability available">

                                    <span class="inventory-availability-dot"></span>

                                    Available

                                </span>
                            `
                            : `
                                <span class="inventory-availability unavailable">

                                    <span class="inventory-availability-dot"></span>

                                    Unavailable

                                </span>
                            `
                    }

                </td>

            `;


            tableBody.appendChild(row);

        });


        results.textContent =
            `Showing ${filteredInventory.length} of ${inventory.length} inventory item${inventory.length === 1 ? "" : "s"}.`;

    }


    /* =========================================
       FILTER INVENTORY
    ========================================== */

    function getFilteredInventory() {

        const searchTerm =
            searchInput.value
                .trim()
                .toLowerCase();


        const filter =
            filterSelect.value;


        return inventory.filter(function (item) {

            const medicineName =
                String(
                    item.medicine_name || ""
                ).toLowerCase();


            const genericName =
                String(
                    item.generic_name || ""
                ).toLowerCase();


            const batchNumber =
                String(
                    item.batch_number || ""
                ).toLowerCase();


            const matchesSearch =
                !searchTerm ||
                medicineName.includes(searchTerm) ||
                genericName.includes(searchTerm) ||
                batchNumber.includes(searchTerm);


            if (!matchesSearch) {
                return false;
            }


            const stock =
                Number(item.stock) || 0;


            if (filter === "IN_STOCK") {

                return (
                    stock > 0 &&
                    item.is_available === true
                );

            }


            if (filter === "LOW_STOCK") {

                return (
                    stock > 0 &&
                    stock <= 10 &&
                    item.is_available === true
                );

            }


            if (filter === "OUT_OF_STOCK") {

                return stock === 0;

            }


            if (filter === "UNAVAILABLE") {

                return item.is_available === false;

            }


            return true;

        });

    }


    /* =========================================
       STOCK CLASS
    ========================================== */

    function getStockClass(stock) {

        if (stock === 0) {
            return "empty";
        }

        if (stock <= 10) {
            return "low";
        }

        return "";

    }


    /* =========================================
       EXPIRY
    ========================================== */

    function formatExpiry(dateString) {

        if (!dateString) {

            return {
                text: "—",
                warning: "",
                className: ""
            };

        }


        const expiryDate =
            new Date(
                dateString + "T00:00:00"
            );


        if (
            Number.isNaN(
                expiryDate.getTime()
            )
        ) {

            return {
                text: "—",
                warning: "",
                className: ""
            };

        }


        const formatted =
            expiryDate.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );


        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );


        const difference =
            expiryDate.getTime() -
            today.getTime();


        const days =
            Math.ceil(
                difference /
                (1000 * 60 * 60 * 24)
            );


        if (days < 0) {

            return {
                text: formatted,
                warning: "Expired",
                className:
                    "inventory-expiry-danger"
            };

        }


        if (days <= 30) {

            return {
                text: formatted,
                warning: "Expires soon",
                className:
                    "inventory-expiry-danger"
            };

        }


        if (days <= 90) {

            return {
                text: formatted,
                warning: "Within 3 months",
                className:
                    "inventory-expiry-warning"
            };

        }


        return {
            text: formatted,
            warning: "",
            className: ""
        };

    }


    /* =========================================
       FORMAT AMOUNT
    ========================================== */

    function formatAmount(amount) {

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
       ESCAPE HTML
    ========================================== */

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =========================================
       SEARCH
    ========================================== */

    searchInput.addEventListener(
        "input",
        function () {
            renderInventory();
        }
    );


    /* =========================================
       FILTER
    ========================================== */

    filterSelect.addEventListener(
        "change",
        function () {
            renderInventory();
        }
    );


    /* =========================================
       LOADING
    ========================================== */

    function showLoading() {

        loading.style.display =
            "flex";

        tableWrapper.style.display =
            "none";

        empty.style.display =
            "none";

        results.style.display =
            "none";

        errorMessage.style.display =
            "none";

    }


    function hideLoading() {

        loading.style.display =
            "none";

    }


    /* =========================================
       ERROR
    ========================================== */

    function showError(message) {

        loading.style.display =
            "none";

        tableWrapper.style.display =
            "none";

        empty.style.display =
            "none";

        results.style.display =
            "none";

        errorMessage.textContent =
            message;

        errorMessage.style.display =
            "block";

    }


    /* =========================================
       INITIAL LOAD
    ========================================== */

    loadInventory();

});