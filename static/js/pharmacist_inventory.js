document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       INVENTORY ELEMENTS
    ========================================== */

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


    /* =========================================
       PRODUCT MODAL
    ========================================== */

    const addProductButton =
        document.getElementById("addProductButton");

    const productModal =
        document.getElementById("productModal");

    const closeProductModal =
        document.getElementById("closeProductModal");

    const cancelProductButton =
        document.getElementById("cancelProductButton");

    const productForm =
        document.getElementById("productForm");

    const productFormMessage =
        document.getElementById("productFormMessage");

    const saveProductButton =
        document.getElementById("saveProductButton");

    const productCategory =
        document.getElementById("productCategory");

    const addCategoryButton =
        document.getElementById("addCategoryButton");

    const productBrandName =
        document.getElementById("productBrandName");

    const productGenericName =
        document.getElementById("productGenericName");

    const productStrength =
        document.getElementById("productStrength");

    const productManufacturer =
        document.getElementById("productManufacturer");

    const productDescription =
        document.getElementById("productDescription");

    const productPrescription =
        document.getElementById("productPrescription");

    const productStock =
        document.getElementById("productStock");

    const productPrice =
        document.getElementById("productPrice");

    const productBatch =
        document.getElementById("productBatch");

    const productExpiry =
        document.getElementById("productExpiry");

    const productAvailable =
        document.getElementById("productAvailable");


    /* =========================================
       CATEGORY MODAL
    ========================================== */

    const categoryModal =
        document.getElementById("categoryModal");

    const closeCategoryModal =
        document.getElementById("closeCategoryModal");

    const cancelCategoryButton =
        document.getElementById("cancelCategoryButton");

    const categoryForm =
        document.getElementById("categoryForm");

    const categoryName =
        document.getElementById("categoryName");

    const categoryDescription =
        document.getElementById("categoryDescription");

    const categoryFormMessage =
        document.getElementById("categoryFormMessage");

    const saveCategoryButton =
        document.getElementById("saveCategoryButton");


    /* =========================================
       MANAGE MODAL
    ========================================== */

    const manageInventoryModal =
        document.getElementById("manageInventoryModal");

    const closeManageModal =
        document.getElementById("closeManageModal");

    const cancelManageButton =
        document.getElementById("cancelManageButton");

    const manageInventoryForm =
        document.getElementById("manageInventoryForm");

    const manageMedicineName =
        document.getElementById("manageMedicineName");

    const manageBatch =
        document.getElementById("manageBatch");

    const manageExpiry =
        document.getElementById("manageExpiry");

    const manageStock =
        document.getElementById("manageStock");

    const managePrice =
        document.getElementById("managePrice");

    const manageAvailable =
        document.getElementById("manageAvailable");

    const manageFormMessage =
        document.getElementById("manageFormMessage");

    const saveManageButton =
        document.getElementById("saveManageButton");


    /* =========================================
       STATE
    ========================================== */

    let inventory = [];
    let categories = [];

    let selectedInventoryId = null;

    let isSubmittingProduct = false;
    let isSubmittingCategory = false;
    let isSubmittingInventory = false;


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


                <td>

                    <button
                        type="button"
                        class="inventory-manage-button"
                        data-inventory-id="${escapeHtml(item.id)}"
                    >
                        Manage
                    </button>

                </td>

            `;


            tableBody.appendChild(row);

        });


        results.textContent =
            `Showing ${filteredInventory.length} of ${inventory.length} inventory item${inventory.length === 1 ? "" : "s"}.`;

    }


    /* =========================================
       FILTER
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
       MANAGE BUTTON
    ========================================== */

    tableBody.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".inventory-manage-button"
                );


            if (!button) {
                return;
            }


            openManageModal(
                button.dataset.inventoryId
            );

        }
    );


    /* =========================================
       OPEN MANAGE MODAL
    ========================================== */

    function openManageModal(
        inventoryId
    ) {

        const item =
            inventory.find(function (inventoryItem) {

                return String(
                    inventoryItem.id
                ) === String(inventoryId);

            });


        if (!item) {
            return;
        }


        selectedInventoryId =
            inventoryId;


        manageMedicineName.textContent =
            `${item.medicine_name || "Medicine"}${item.strength ? " · " + item.strength : ""}`;


        manageBatch.textContent =
            item.batch_number || "—";


        manageExpiry.textContent =
            formatExpiry(
                item.expiry_date
            ).text;


        manageStock.value =
            Number(item.stock) || 0;


        managePrice.value =
            item.selling_price || "";


        manageAvailable.checked =
            item.is_available === true;


        clearManageFormMessage();


        manageInventoryModal.style.display =
            "flex";

        document.body.style.overflow =
            "hidden";


        setTimeout(function () {

            manageStock.focus();

        }, 50);

    }


    /* =========================================
       CLOSE MANAGE MODAL
    ========================================== */

    function closeManageInventoryModal() {

        if (isSubmittingInventory) {
            return;
        }


        manageInventoryModal.style.display =
            "none";

        document.body.style.overflow =
            "";

        manageInventoryForm.reset();

        selectedInventoryId =
            null;

        clearManageFormMessage();

        setManageFormSubmitting(false);

    }


    closeManageModal.addEventListener(
        "click",
        closeManageInventoryModal
    );


    cancelManageButton.addEventListener(
        "click",
        closeManageInventoryModal
    );


    manageInventoryModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                manageInventoryModal
            ) {

                closeManageInventoryModal();

            }

        }
    );


    /* =========================================
       SAVE INVENTORY
    ========================================== */

    manageInventoryForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (
                isSubmittingInventory ||
                !selectedInventoryId
            ) {
                return;
            }


            clearManageFormMessage();


            const stock =
                Number(manageStock.value);


            const price =
                Number(managePrice.value);


            if (
                Number.isNaN(stock) ||
                stock < 0
            ) {

                showManageFormMessage(
                    "Please enter a valid stock quantity.",
                    "error"
                );

                return;

            }


            if (
                Number.isNaN(price) ||
                price < 0
            ) {

                showManageFormMessage(
                    "Please enter a valid selling price.",
                    "error"
                );

                return;

            }


            isSubmittingInventory =
                true;


            setManageFormSubmitting(true);


            try {

                await apiRequest(
                    `/medicine/pharmacist/inventory/${selectedInventoryId}/`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            stock: stock,
                            selling_price: price,
                            is_available:
                                manageAvailable.checked
                        })
                    }
                );


                showManageFormMessage(
                    "Inventory updated successfully.",
                    "success"
                );


                setTimeout(
                    async function () {

                        /*
                         * IMPORTANT:
                         * Release the submitting lock BEFORE
                         * calling the close function.
                         */

                        isSubmittingInventory =
                            false;

                        closeManageInventoryModal();

                        await loadInventory();

                    },
                    600
                );


            } catch (error) {

                console.error(
                    "Inventory update error:",
                    error
                );


                showManageFormMessage(
                    error.message ||
                    "Unable to update inventory.",
                    "error"
                );


                isSubmittingInventory =
                    false;


                setManageFormSubmitting(false);

            }

        }
    );


    /* =========================================
       MANAGE FORM STATE
    ========================================== */

    function setManageFormSubmitting(
        submitting
    ) {

        saveManageButton.disabled =
            submitting;

        cancelManageButton.disabled =
            submitting;

        closeManageModal.disabled =
            submitting;


        saveManageButton.textContent =
            submitting
                ? "Saving..."
                : "Save Changes";

    }


    function showManageFormMessage(
        message,
        type
    ) {

        manageFormMessage.textContent =
            message;

        manageFormMessage.style.display =
            "block";


        if (type === "success") {

            manageFormMessage.style.color =
                "#3f8170";

            manageFormMessage.style.background =
                "#edf8f4";

            manageFormMessage.style.border =
                "1px solid #d5ebe4";

        } else {

            manageFormMessage.style.color =
                "#a94e4e";

            manageFormMessage.style.background =
                "#fff1f1";

            manageFormMessage.style.border =
                "1px solid #f2d8d8";

        }

    }


    function clearManageFormMessage() {

        manageFormMessage.textContent =
            "";

        manageFormMessage.style.display =
            "none";

    }


    /* =========================================
       PRODUCT MODAL
    ========================================== */

    addProductButton.addEventListener(
        "click",
        async function () {

            openProductModal();

            await loadCategories();

        }
    );


    closeProductModal.addEventListener(
        "click",
        closeProductModalWindow
    );


    cancelProductButton.addEventListener(
        "click",
        closeProductModalWindow
    );


    productModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                productModal
            ) {

                closeProductModalWindow();

            }

        }
    );


    function openProductModal() {

        productModal.style.display =
            "flex";

        document.body.style.overflow =
            "hidden";

        clearProductFormMessage();


        setTimeout(function () {

            productBrandName.focus();

        }, 50);

    }


    function closeProductModalWindow() {

        if (isSubmittingProduct) {
            return;
        }


        productModal.style.display =
            "none";

        document.body.style.overflow =
            "";


        resetProductForm();

    }


    /* =========================================
       LOAD CATEGORIES
    ========================================== */

    async function loadCategories() {

        productCategory.innerHTML = `
            <option value="">
                Loading categories...
            </option>
        `;

        productCategory.disabled =
            true;


        try {

            const response =
                await apiRequest(
                    "/medicine/categories/",
                    {
                        method: "GET"
                    }
                );


            if (Array.isArray(response)) {

                categories = response;

            } else {

                categories =
                    response.results ||
                    response.data ||
                    [];

            }


            if (!Array.isArray(categories)) {

                throw new Error(
                    "Invalid category data received."
                );

            }


            renderCategories();

        } catch (error) {

            console.error(
                "Category loading error:",
                error
            );


            productCategory.innerHTML = `
                <option value="">
                    Unable to load categories
                </option>
            `;

            productCategory.disabled =
                true;


            showProductFormMessage(
                error.message ||
                "Unable to load categories.",
                "error"
            );

        }

    }


    /* =========================================
       RENDER CATEGORIES
    ========================================== */

    function renderCategories(
        selectedId = ""
    ) {

        productCategory.innerHTML = `
            <option value="">
                Select category
            </option>
        `;


        if (categories.length === 0) {

            productCategory.innerHTML = `
                <option value="">
                    No categories available
                </option>
            `;

            productCategory.disabled =
                true;

            return;

        }


        categories.forEach(function (category) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category.id;


            option.textContent =
                category.name;


            if (
                String(category.id) ===
                String(selectedId)
            ) {

                option.selected =
                    true;

            }


            productCategory.appendChild(
                option
            );

        });


        productCategory.disabled =
            false;

    }


    /* =========================================
       CATEGORY MODAL
    ========================================== */

    addCategoryButton.addEventListener(
        "click",
        function () {

            openCategoryModal();

        }
    );


    function openCategoryModal() {

        clearCategoryForm();

        categoryModal.style.display =
            "flex";


        setTimeout(function () {

            categoryName.focus();

        }, 50);

    }


    function closeCategoryModalWindow() {

        if (isSubmittingCategory) {
            return;
        }


        categoryModal.style.display =
            "none";

        clearCategoryForm();

    }


    closeCategoryModal.addEventListener(
        "click",
        closeCategoryModalWindow
    );


    cancelCategoryButton.addEventListener(
        "click",
        closeCategoryModalWindow
    );


    categoryModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                categoryModal
            ) {

                closeCategoryModalWindow();

            }

        }
    );


    /* =========================================
       CREATE CATEGORY
    ========================================== */

    categoryForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (isSubmittingCategory) {
                return;
            }


            const name =
                categoryName.value.trim();


            const description =
                categoryDescription.value.trim();


            if (!name) {

                showCategoryFormMessage(
                    "Please enter a category name.",
                    "error"
                );

                return;

            }


            isSubmittingCategory =
                true;


            setCategoryFormSubmitting(true);


            try {

                const response =
                    await apiRequest(
                        "/medicine/categories/create/",
                        {
                            method: "POST",
                            body: JSON.stringify({
                                name: name,
                                description:
                                    description
                            })
                        }
                    );


                const newCategory =
                    response.data ||
                    response;


                if (
                    !newCategory ||
                    !newCategory.id
                ) {

                    throw new Error(
                        "Category was created, but the response was invalid."
                    );

                }


                categories.push(
                    newCategory
                );


                categories.sort(
                    function (a, b) {

                        return String(
                            a.name
                        ).localeCompare(
                            String(b.name)
                        );

                    }
                );


                /*
                 * Select the new category
                 * in the product form.
                 */

                renderCategories(
                    newCategory.id
                );


                showCategoryFormMessage(
                    "Category created successfully.",
                    "success"
                );


                setTimeout(
                    function () {

                        /*
                         * IMPORTANT:
                         * Release the lock BEFORE
                         * closing the modal.
                         */

                        isSubmittingCategory =
                            false;

                        closeCategoryModalWindow();

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "Category creation error:",
                    error
                );


                showCategoryFormMessage(
                    error.message ||
                    "Unable to create category.",
                    "error"
                );


                isSubmittingCategory =
                    false;


                setCategoryFormSubmitting(false);

            }

        }
    );


    /* =========================================
       CATEGORY FORM STATE
    ========================================== */

    function setCategoryFormSubmitting(
        submitting
    ) {

        saveCategoryButton.disabled =
            submitting;

        cancelCategoryButton.disabled =
            submitting;

        closeCategoryModal.disabled =
            submitting;


        saveCategoryButton.textContent =
            submitting
                ? "Creating..."
                : "Create Category";

    }


    function showCategoryFormMessage(
        message,
        type
    ) {

        categoryFormMessage.textContent =
            message;

        categoryFormMessage.style.display =
            "block";


        if (type === "success") {

            categoryFormMessage.style.color =
                "#3f8170";

            categoryFormMessage.style.background =
                "#edf8f4";

            categoryFormMessage.style.border =
                "1px solid #d5ebe4";

        } else {

            categoryFormMessage.style.color =
                "#a94e4e";

            categoryFormMessage.style.background =
                "#fff1f1";

            categoryFormMessage.style.border =
                "1px solid #f2d8d8";

        }

    }


    function clearCategoryForm() {

        categoryForm.reset();

        clearCategoryFormMessage();

        isSubmittingCategory =
            false;

        setCategoryFormSubmitting(false);

    }


    function clearCategoryFormMessage() {

        categoryFormMessage.textContent =
            "";

        categoryFormMessage.style.display =
            "none";

    }


    /* =========================================
       CREATE PRODUCT
    ========================================== */

    productForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (isSubmittingProduct) {
                return;
            }


            clearProductFormMessage();


            const productData =
                getProductFormData();


            const validationError =
                validateProductData(
                    productData
                );


            if (validationError) {

                showProductFormMessage(
                    validationError,
                    "error"
                );

                return;

            }


            isSubmittingProduct =
                true;


            setProductFormSubmitting(true);


            try {

                await apiRequest(
                    "/medicine/pharmacist/products/",
                    {
                        method: "POST",
                        body: JSON.stringify(
                            productData
                        )
                    }
                );


                showProductFormMessage(
                    "Product added successfully.",
                    "success"
                );


                setTimeout(
                    async function () {

                        /*
                         * IMPORTANT:
                         * Release the lock BEFORE
                         * closing the modal.
                         */

                        isSubmittingProduct =
                            false;

                        closeProductModalWindow();

                        await loadInventory();

                    },
                    600
                );


            } catch (error) {

                console.error(
                    "Add product error:",
                    error
                );


                showProductFormMessage(
                    error.message ||
                    "Unable to add product.",
                    "error"
                );


                isSubmittingProduct =
                    false;


                setProductFormSubmitting(false);

            }

        }
    );


    /* =========================================
       PRODUCT FORM DATA
    ========================================== */

    function getProductFormData() {

        return {

            category:
                productCategory.value,

            brand_name:
                productBrandName.value.trim(),

            generic_name:
                productGenericName.value.trim(),

            strength:
                productStrength.value.trim(),

            manufacturer:
                productManufacturer.value.trim(),

            description:
                productDescription.value.trim(),

            requires_prescription:
                productPrescription.checked,

            stock:
                Number(productStock.value),

            selling_price:
                productPrice.value,

            batch_number:
                productBatch.value.trim(),

            expiry_date:
                productExpiry.value,

            is_available:
                productAvailable.checked

        };

    }


    /* =========================================
       VALIDATE PRODUCT
    ========================================== */

    function validateProductData(
        data
    ) {

        if (!data.category) {

            return "Please select a category.";

        }


        if (!data.brand_name) {

            return "Please enter the brand name.";

        }


        if (!data.generic_name) {

            return "Please enter the generic name.";

        }


        if (!data.strength) {

            return "Please enter the medicine strength.";

        }


        if (!data.manufacturer) {

            return "Please enter the manufacturer.";

        }


        if (
            Number.isNaN(data.stock) ||
            data.stock < 0
        ) {

            return "Please enter a valid stock quantity.";

        }


        if (
            data.selling_price === "" ||
            Number(data.selling_price) < 0
        ) {

            return "Please enter a valid selling price.";

        }


        if (!data.batch_number) {

            return "Please enter the batch number.";

        }


        if (!data.expiry_date) {

            return "Please select an expiry date.";

        }


        const expiryDate =
            new Date(
                data.expiry_date +
                "T00:00:00"
            );


        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );


        if (
            Number.isNaN(
                expiryDate.getTime()
            )
        ) {

            return "Please enter a valid expiry date.";

        }


        if (expiryDate < today) {

            return "Expiry date cannot be in the past.";

        }


        return null;

    }


    /* =========================================
       PRODUCT FORM STATE
    ========================================== */

    function setProductFormSubmitting(
        submitting
    ) {

        saveProductButton.disabled =
            submitting;

        cancelProductButton.disabled =
            submitting;

        closeProductModal.disabled =
            submitting;

        addCategoryButton.disabled =
            submitting;


        saveProductButton.textContent =
            submitting
                ? "Adding Product..."
                : "Add Product";

    }


    /* =========================================
       PRODUCT MESSAGE
    ========================================== */

    function showProductFormMessage(
        message,
        type
    ) {

        productFormMessage.textContent =
            message;

        productFormMessage.style.display =
            "block";


        if (type === "success") {

            productFormMessage.style.color =
                "#3f8170";

            productFormMessage.style.background =
                "#edf8f4";

            productFormMessage.style.border =
                "1px solid #d5ebe4";

        } else {

            productFormMessage.style.color =
                "#a94e4e";

            productFormMessage.style.background =
                "#fff1f1";

            productFormMessage.style.border =
                "1px solid #f2d8d8";

        }

    }


    function clearProductFormMessage() {

        productFormMessage.textContent =
            "";

        productFormMessage.style.display =
            "none";

    }


    /* =========================================
       RESET PRODUCT FORM
    ========================================== */

    function resetProductForm() {

        productForm.reset();


        productAvailable.checked =
            true;


        productPrescription.checked =
            false;


        productCategory.innerHTML = `
            <option value="">
                Select category
            </option>
        `;


        productCategory.disabled =
            false;


        clearProductFormMessage();


        isSubmittingProduct =
            false;


        setProductFormSubmitting(false);

    }


    /* =========================================
       STOCK CLASS
    ========================================== */

    function getStockClass(
        stock
    ) {

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

    function formatExpiry(
        dateString
    ) {

        if (!dateString) {

            return {
                text: "—",
                warning: "",
                className: ""
            };

        }


        const expiryDate =
            new Date(
                dateString +
                "T00:00:00"
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

    function formatAmount(
        amount
    ) {

        const number =
            Number(amount);


        if (
            Number.isNaN(number)
        ) {

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

    function escapeHtml(
        value
    ) {

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
       ESCAPE KEY
    ========================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !== "Escape"
            ) {
                return;
            }


            if (
                categoryModal.style.display !==
                "none"
            ) {

                closeCategoryModalWindow();

                return;

            }


            if (
                manageInventoryModal.style.display !==
                "none"
            ) {

                closeManageInventoryModal();

                return;

            }


            if (
                productModal.style.display !==
                "none"
            ) {

                closeProductModalWindow();

            }

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

    function showError(
        message
    ) {

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