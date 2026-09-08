/* =========================================================
   PHARMACIST INVENTORY
========================================================= */

let inventoryData = [];

let isSubmittingProduct = false;
let isSubmittingCategory = false;
let isSubmittingInventory = false;
let isSubmittingBatch = false;


/* =========================================================
   ELEMENTS
========================================================= */

const inventorySearch =
    document.getElementById("inventorySearch");

const inventoryFilter =
    document.getElementById("inventoryFilter");

const inventoryTableBody =
    document.getElementById("inventoryTableBody");

const inventoryTableWrapper =
    document.getElementById("inventoryTableWrapper");

const inventoryLoading =
    document.getElementById("inventoryLoading");

const inventoryError =
    document.getElementById("inventoryError");

const inventoryEmpty =
    document.getElementById("inventoryEmpty");

const inventoryResults =
    document.getElementById("inventoryResults");

const totalInventory =
    document.getElementById("totalInventory");

const inStockInventory =
    document.getElementById("inStockInventory");

const lowStockInventory =
    document.getElementById("lowStockInventory");

const outOfStockInventory =
    document.getElementById("outOfStockInventory");


/* =========================================================
   ADD PRODUCT MODAL
========================================================= */

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

const saveProductButton =
    document.getElementById("saveProductButton");

const productFormMessage =
    document.getElementById("productFormMessage");

const productBrandName =
    document.getElementById("productBrandName");

const productGenericName =
    document.getElementById("productGenericName");

const productStrength =
    document.getElementById("productStrength");

const productManufacturer =
    document.getElementById("productManufacturer");

const productCategory =
    document.getElementById("productCategory");

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


/* =========================================================
   PRODUCT IMAGE
========================================================= */

const productImage =
    document.getElementById("productImage");

const productImagePreview =
    document.getElementById("productImagePreview");


/* =========================================================
   CATEGORY MODAL
========================================================= */

const addCategoryButton =
    document.getElementById("addCategoryButton");

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


/* =========================================================
   MANAGE INVENTORY MODAL
========================================================= */

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

let selectedInventoryId = null;


/* =========================================================
   ADD NEW BATCH MODAL
========================================================= */

const addBatchButton =
    document.getElementById("addBatchButton");

const batchModal =
    document.getElementById("batchModal");

const closeBatchModal =
    document.getElementById("closeBatchModal");

const cancelBatchButton =
    document.getElementById("cancelBatchButton");

const batchForm =
    document.getElementById("batchForm");

const batchMedicine =
    document.getElementById("batchMedicine");

const batchStock =
    document.getElementById("batchStock");

const batchPrice =
    document.getElementById("batchPrice");

const batchNumber =
    document.getElementById("batchNumber");

const batchExpiry =
    document.getElementById("batchExpiry");

const batchAvailable =
    document.getElementById("batchAvailable");

const batchFormMessage =
    document.getElementById("batchFormMessage");

const saveBatchButton =
    document.getElementById("saveBatchButton");


/* =========================================================
   LOAD INVENTORY
========================================================= */

async function loadInventory() {

    showInventoryLoading();

    try {

        const response =
            await apiRequest(
                "/medicine/pharmacist/inventory/"
            );

        inventoryData =
            extractData(response);

        updateInventoryStatistics();

        renderInventory();

        hideInventoryLoading();

    } catch (error) {

        hideInventoryLoading();

        showInventoryError(
            error.message ||
            "Unable to load inventory."
        );
    }
}


/* =========================================================
   EXTRACT API DATA
========================================================= */

function extractData(response) {

    if (Array.isArray(response)) {

        return response;
    }


    if (
        response &&
        Array.isArray(response.data)
    ) {

        return response.data;
    }


    if (
        response &&
        response.data &&
        Array.isArray(response.data.results)
    ) {

        return response.data.results;
    }


    if (
        response &&
        Array.isArray(response.results)
    ) {

        return response.results;
    }


    return [];
}


/* =========================================================
   INVENTORY LOADING STATE
========================================================= */

function showInventoryLoading() {

    inventoryLoading.style.display =
        "flex";

    inventoryError.style.display =
        "none";

    inventoryEmpty.style.display =
        "none";

    inventoryTableWrapper.style.display =
        "none";

    inventoryResults.style.display =
        "none";
}


function hideInventoryLoading() {

    inventoryLoading.style.display =
        "none";
}


/* =========================================================
   INVENTORY ERROR
========================================================= */

function showInventoryError(message) {

    inventoryError.textContent =
        message;

    inventoryError.style.display =
        "block";

    inventoryTableWrapper.style.display =
        "none";

    inventoryEmpty.style.display =
        "none";

    inventoryResults.style.display =
        "none";
}


/* =========================================================
   STATISTICS
========================================================= */

function updateInventoryStatistics() {

    /*
     * Inventory contains one row per batch.
     * Statistics should be calculated per medicine,
     * using the combined stock of all its batches.
     */

    const medicineStock = {};


    inventoryData.forEach(function (item) {

        const medicineId =
            String(item.medicine_id);


        if (!medicineStock[medicineId]) {

            medicineStock[medicineId] = 0;
        }


        medicineStock[medicineId] +=
            Number(item.stock) || 0;
    });


    const medicineStocks =
        Object.values(medicineStock);


    const total =
        medicineStocks.length;


    const inStock =
        medicineStocks.filter(function (stock) {

            return stock > 10;

        }).length;


    const lowStock =
        medicineStocks.filter(function (stock) {

            return stock > 0 && stock <= 10;

        }).length;


    const outOfStock =
        medicineStocks.filter(function (stock) {

            return stock === 0;

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

/* =========================================================
   RENDER INVENTORY
========================================================= */

function renderInventory() {

    const searchTerm =
        inventorySearch.value
            .trim()
            .toLowerCase();

    const filter =
        inventoryFilter.value;


    const filteredItems =
        inventoryData.filter(
            function (item) {

                const medicineName =
                    String(
                        item.medicine_name || ""
                    ).toLowerCase();


                const genericName =
                    String(
                        item.generic_name || ""
                    ).toLowerCase();


                const strength =
                    String(
                        item.strength || ""
                    ).toLowerCase();


                const batchNumber =
                    String(
                        item.batch_number || ""
                    ).toLowerCase();


                const matchesSearch =
                    medicineName.includes(searchTerm) ||
                    genericName.includes(searchTerm) ||
                    strength.includes(searchTerm) ||
                    batchNumber.includes(searchTerm);


                const stock =
                    Number(item.stock);


                let matchesFilter = true;


                /* =========================================
                   INVENTORY FILTERS
                ========================================== */

                if (
                    filter === "ACTIVE"
                ) {

                    /*
                     * Active inventory:
                     * - Stock must be greater than 0
                     * - Batch must be available
                     */

                    matchesFilter =
                        stock > 0 &&
                        item.is_available === true;

                } else if (
                    filter === "IN_STOCK"
                ) {

                    matchesFilter =
                        stock > 10;

                } else if (
                    filter === "LOW_STOCK"
                ) {

                    matchesFilter =
                        stock > 0 &&
                        stock <= 10;

                } else if (
                    filter === "OUT_OF_STOCK"
                ) {

                    matchesFilter =
                        stock === 0;

                } else if (
                    filter === "UNAVAILABLE"
                ) {

                    /*
                     * This includes:
                     *
                     * 1. Existing batches marked unavailable
                     * 2. Medicines with NO inventory
                     *
                     * The backend sends is_available=false
                     * for medicines without inventory.
                     */

                    matchesFilter =
                        item.is_available === false;
                }


                return (
                    matchesSearch &&
                    matchesFilter
                );
            }
        );


    inventoryTableBody.innerHTML =
        "";


    if (filteredItems.length === 0) {

        inventoryTableWrapper.style.display =
            "none";

        inventoryEmpty.style.display =
            "block";

        inventoryResults.style.display =
            "none";

        return;
    }


    inventoryEmpty.style.display =
        "none";

    inventoryTableWrapper.style.display =
        "block";

    inventoryResults.style.display =
        "block";


    filteredItems.forEach(
        function (item) {

            const row =
                document.createElement("tr");


            const stock =
                Number(item.stock);


            let stockClass =
                "stock-good";


            if (stock === 0) {

                stockClass =
                    "stock-out";

            } else if (stock <= 10) {

                stockClass =
                    "stock-low";
            }


            /* =========================================
               AVAILABILITY
            ========================================== */

            let availabilityClass;

            let availabilityText;


            if (stock === 0) {

                availabilityClass =
                    "unavailable";

                availabilityText =
                    "Out of Stock";

            } else if (!item.is_available) {

                availabilityClass =
                    "unavailable";

                availabilityText =
                    "Unavailable";

            } else {

                availabilityClass =
                    "available";

                availabilityText =
                    "Available";
            }


            /* =========================================
               ACTION
            ========================================== */

            let actionHtml;


            if (item.id) {

                /*
                 * Normal inventory batch.
                 * It has an Inventory record, so it can
                 * be managed.
                 */

                actionHtml = `
                    <button
                        type="button"
                        class="inventory-manage-button"
                        data-id="${item.id}"
                    >
                        Manage
                    </button>
                `;

            } else {

                /*
                 * Medicine exists but has no Inventory
                 * record yet.
                 */

                actionHtml = `
                    <span class="inventory-no-batch">
                        No batch
                    </span>
                `;
            }


            row.innerHTML = `

                <td>

                    <div class="medicine-table-info">

                        <strong>
                            ${escapeHtml(
                                item.medicine_name ||
                                "—"
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                item.generic_name ||
                                ""
                            )}

                            ${
                                item.strength
                                    ? " · " +
                                      escapeHtml(
                                          item.strength
                                      )
                                    : ""
                            }
                        </span>

                    </div>

                </td>


                <td>

                    <span
                        class="inventory-stock ${stockClass}"
                    >
                        ${stock}
                    </span>

                </td>


                <td>
                    ${escapeHtml(
                        item.batch_number ||
                        "—"
                    )}
                </td>


                <td>
                    ${
                        item.selling_price !== null &&
                        item.selling_price !== undefined
                            ? "₹" +
                              formatPrice(
                                  item.selling_price
                              )
                            : "—"
                    }
                </td>


                <td>
                    ${
                        item.expiry_date
                            ? formatDate(
                                  item.expiry_date
                              )
                            : "—"
                    }
                </td>


                <td>

                    <span
                        class="inventory-availability ${availabilityClass}"
                    >
                        ${availabilityText}
                    </span>

                </td>


                <td>

                    ${actionHtml}

                </td>

            `;


            inventoryTableBody.appendChild(
                row
            );
        }
    );


    /* =========================================
       MANAGE BUTTONS
    ========================================== */

    document
        .querySelectorAll(
            ".inventory-manage-button"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            button.dataset.id;


                        const item =
                            inventoryData.find(
                                function (
                                    inventoryItem
                                ) {

                                    return (
                                        String(
                                            inventoryItem.id
                                        ) ===
                                        String(id)
                                    );
                                }
                            );


                        if (item) {

                            openManageInventory(
                                item
                            );
                        }
                    }
                );
            }
        );


    inventoryResults.textContent =
        `${filteredItems.length} item${
            filteredItems.length === 1
                ? ""
                : "s"
        } found`;
}

/* =========================================================
   SEARCH / FILTER
========================================================= */

inventorySearch.addEventListener(
    "input",
    renderInventory
);

inventoryFilter.addEventListener(
    "change",
    renderInventory
);


/* =========================================================
   ADD PRODUCT MODAL
========================================================= */

function openProductModalWindow() {

    productModal.style.display =
        "flex";

    document.body.classList.add(
        "modal-open"
    );

    productFormMessage.style.display =
        "none";

    productFormMessage.textContent =
        "";

    loadCategories();
}


function closeProductModalWindow() {

    if (isSubmittingProduct) {

        return;
    }


    productModal.style.display =
        "none";

    document.body.classList.remove(
        "modal-open"
    );


    productForm.reset();

    productImagePreview.innerHTML =
        "";


    productFormMessage.style.display =
        "none";

    productFormMessage.textContent =
        "";
}


addProductButton.addEventListener(
    "click",
    openProductModalWindow
);


closeProductModal.addEventListener(
    "click",
    closeProductModalWindow
);


cancelProductButton.addEventListener(
    "click",
    closeProductModalWindow
);


/* =========================================================
   PRODUCT IMAGE PREVIEW
========================================================= */

productImage.addEventListener(
    "change",
    function () {

        productImagePreview.innerHTML =
            "";


        const file =
            productImage.files[0];


        if (!file) {

            return;
        }


        if (
            !file.type.startsWith("image/")
        ) {

            productImage.value =
                "";

            showProductMessage(
                "Please select a valid image file.",
                "error"
            );

            return;
        }


        const imageURL =
            URL.createObjectURL(file);


        productImagePreview.innerHTML = `

            <div class="product-image-preview-wrapper">

                <img
                    src="${imageURL}"
                    alt="Product preview"
                >

                <button
                    type="button"
                    id="removeProductImage"
                    class="remove-product-image"
                >
                    Remove
                </button>

            </div>

        `;


        document
            .getElementById(
                "removeProductImage"
            )
            .addEventListener(
                "click",
                function () {

                    productImage.value =
                        "";

                    productImagePreview.innerHTML =
                        "";
                }
            );
    }
);


/* =========================================================
   PRODUCT MESSAGE
========================================================= */

function showProductMessage(
    message,
    type
) {

    productFormMessage.textContent =
        message;

    productFormMessage.style.display =
        "block";


    if (type === "success") {

        productFormMessage.style.color =
            "#438f89";

    } else {

        productFormMessage.style.color =
            "#d05b5b";
    }
}


/* =========================================================
   LOAD CATEGORIES
========================================================= */

async function loadCategories() {

    try {

        const response =
            await apiRequest(
                "/medicine/categories/"
            );


        const categories =
            extractData(response);


        productCategory.innerHTML = `
            <option value="">
                Select category
            </option>
        `;


        categories.forEach(
            function (category) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category.id;

                option.textContent =
                    category.name;


                productCategory.appendChild(
                    option
                );
            }
        );


    } catch (error) {

        showProductMessage(
            "Unable to load categories.",
            "error"
        );
    }
}


/* =========================================================
   ADD PRODUCT
========================================================= */

productForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (isSubmittingProduct) {

            return;
        }


        isSubmittingProduct = true;


        saveProductButton.disabled =
            true;

        saveProductButton.textContent =
            "Adding Product...";


        productFormMessage.style.display =
            "none";


        try {

            const formData =
                new FormData();


            formData.append(
                "category",
                productCategory.value
            );


            formData.append(
                "brand_name",
                productBrandName.value.trim()
            );


            formData.append(
                "generic_name",
                productGenericName.value.trim()
            );


            formData.append(
                "strength",
                productStrength.value.trim()
            );


            formData.append(
                "manufacturer",
                productManufacturer.value.trim()
            );


            formData.append(
                "description",
                productDescription.value.trim()
            );


            formData.append(
                "requires_prescription",
                productPrescription.checked
            );


            formData.append(
                "stock",
                productStock.value
            );


            formData.append(
                "selling_price",
                productPrice.value
            );


            formData.append(
                "batch_number",
                productBatch.value.trim()
            );


            formData.append(
                "expiry_date",
                productExpiry.value
            );


            formData.append(
                "is_available",
                productAvailable.checked
            );


            /* =========================================
               IMAGE
            ========================================== */

            if (
                productImage.files.length > 0
            ) {

                formData.append(
                    "image",
                    productImage.files[0]
                );
            }


            await apiRequest(
                "/medicine/pharmacist/products/",
                {
                    method: "POST",
                    body: formData
                }
            );


            showProductMessage(
                "Product added successfully.",
                "success"
            );


            isSubmittingProduct =
                false;


            setTimeout(
                function () {

                    closeProductModalWindow();

                    loadInventory();

                },
                600
            );


        } catch (error) {

            showProductMessage(
                error.message ||
                "Unable to add product.",
                "error"
            );


            isSubmittingProduct =
                false;


        } finally {

            saveProductButton.disabled =
                false;

            saveProductButton.textContent =
                "Add Product";
        }

    }
);


/* =========================================================
   CATEGORY MODAL
========================================================= */

function openCategoryModalWindow() {

    categoryModal.style.display =
        "flex";

    document.body.classList.add(
        "modal-open"
    );


    categoryFormMessage.style.display =
        "none";

    categoryFormMessage.textContent =
        "";
}


function closeCategoryModalWindow() {

    if (isSubmittingCategory) {

        return;
    }


    categoryModal.style.display =
        "none";

    document.body.classList.remove(
        "modal-open"
    );


    categoryForm.reset();


    categoryFormMessage.style.display =
        "none";

    categoryFormMessage.textContent =
        "";
}


addCategoryButton.addEventListener(
    "click",
    openCategoryModalWindow
);


closeCategoryModal.addEventListener(
    "click",
    closeCategoryModalWindow
);


cancelCategoryButton.addEventListener(
    "click",
    closeCategoryModalWindow
);


/* =========================================================
   CREATE CATEGORY
========================================================= */

categoryForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (isSubmittingCategory) {

            return;
        }


        isSubmittingCategory =
            true;


        saveCategoryButton.disabled =
            true;

        saveCategoryButton.textContent =
            "Creating...";


        categoryFormMessage.style.display =
            "none";


        try {

            const response =
                await apiRequest(
                    "/medicine/categories/create/",
                    {
                        method: "POST",

                        body: JSON.stringify({

                            name:
                                categoryName.value.trim(),

                            description:
                                categoryDescription.value.trim()
                        })
                    }
                );


            const newCategory =
                response.data ||
                response;


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                newCategory.id;

            option.textContent =
                newCategory.name;


            productCategory.appendChild(
                option
            );


            productCategory.value =
                newCategory.id;


            categoryFormMessage.textContent =
                "Category created successfully.";

            categoryFormMessage.style.color =
                "#438f89";

            categoryFormMessage.style.display =
                "block";


            isSubmittingCategory =
                false;


            setTimeout(
                function () {

                    closeCategoryModalWindow();

                },
                500
            );


        } catch (error) {

            categoryFormMessage.textContent =
                error.message ||
                "Unable to create category.";

            categoryFormMessage.style.color =
                "#d05b5b";

            categoryFormMessage.style.display =
                "block";


            isSubmittingCategory =
                false;


        } finally {

            saveCategoryButton.disabled =
                false;

            saveCategoryButton.textContent =
                "Create Category";
        }

    }
);


/* =========================================================
   MANAGE INVENTORY
========================================================= */

function openManageInventory(item) {

    selectedInventoryId =
        item.id;


    manageMedicineName.textContent =
        `${item.medicine_name || ""} ${
            item.strength || ""
        }`;


    manageBatch.textContent =
        item.batch_number ||
        "—";


    manageExpiry.textContent =
        formatDate(
            item.expiry_date
        );


    manageStock.value =
        item.stock;


    managePrice.value =
        item.selling_price;


    manageAvailable.checked =
        Boolean(
            item.is_available
        );


    manageFormMessage.style.display =
        "none";

    manageFormMessage.textContent =
        "";


    manageInventoryModal.style.display =
        "flex";

    document.body.classList.add(
        "modal-open"
    );
}


function closeManageInventoryWindow() {

    if (isSubmittingInventory) {

        return;
    }


    manageInventoryModal.style.display =
        "none";

    document.body.classList.remove(
        "modal-open"
    );


    manageInventoryForm.reset();

    selectedInventoryId =
        null;


    manageFormMessage.style.display =
        "none";

    manageFormMessage.textContent =
        "";
}


closeManageModal.addEventListener(
    "click",
    closeManageInventoryWindow
);


cancelManageButton.addEventListener(
    "click",
    closeManageInventoryWindow
);


/* =========================================================
   UPDATE INVENTORY
========================================================= */

manageInventoryForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (isSubmittingInventory) {

            return;
        }


        if (!selectedInventoryId) {

            return;
        }


        isSubmittingInventory =
            true;


        saveManageButton.disabled =
            true;

        saveManageButton.textContent =
            "Saving...";


        manageFormMessage.style.display =
            "none";


        try {

            await apiRequest(
                `/medicine/pharmacist/inventory/${selectedInventoryId}/`,
                {
                    method: "PATCH",

                    body: JSON.stringify({

                        stock:
                            Number(
                                manageStock.value
                            ),

                        selling_price:
                            Number(
                                managePrice.value
                            ),

                        is_available:
                            manageAvailable.checked
                    })
                }
            );


            manageFormMessage.textContent =
                "Inventory updated successfully.";

            manageFormMessage.style.color =
                "#438f89";

            manageFormMessage.style.display =
                "block";


            isSubmittingInventory =
                false;


            setTimeout(
                function () {

                    closeManageInventoryWindow();

                    loadInventory();

                },
                500
            );


        } catch (error) {

            manageFormMessage.textContent =
                error.message ||
                "Unable to update inventory.";

            manageFormMessage.style.color =
                "#d05b5b";

            manageFormMessage.style.display =
                "block";


            isSubmittingInventory =
                false;


        } finally {

            saveManageButton.disabled =
                false;

            saveManageButton.textContent =
                "Save Changes";
        }

    }
);


/* =========================================================
   ADD NEW BATCH
========================================================= */

function openBatchModalWindow() {

    if (isSubmittingBatch) {

        return;
    }


    batchModal.style.display =
        "flex";

    document.body.classList.add(
        "modal-open"
    );


    batchForm.reset();

    batchAvailable.checked =
        true;


    batchFormMessage.style.display =
        "none";

    batchFormMessage.textContent =
        "";


    loadBatchMedicines();
}


function closeBatchModalWindow() {

    if (isSubmittingBatch) {

        return;
    }


    batchModal.style.display =
        "none";

    document.body.classList.remove(
        "modal-open"
    );


    batchForm.reset();

    batchAvailable.checked =
        true;


    batchFormMessage.style.display =
        "none";

    batchFormMessage.textContent =
        "";
}


addBatchButton.addEventListener(
    "click",
    openBatchModalWindow
);


closeBatchModal.addEventListener(
    "click",
    closeBatchModalWindow
);


cancelBatchButton.addEventListener(
    "click",
    closeBatchModalWindow
);


/* =========================================================
   LOAD MEDICINES FOR BATCH
========================================================= */

async function loadBatchMedicines() {

    batchMedicine.innerHTML = `
        <option value="">
            Loading medicines...
        </option>
    `;


    try {

        const response =
            await apiRequest(
                "/medicine/"
            );


        const medicines =
            extractData(response);


        batchMedicine.innerHTML = `
            <option value="">
                Select medicine
            </option>
        `;


        medicines.forEach(
            function (medicine) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    medicine.id;


                option.textContent =
                    `${medicine.brand_name} — ${
                        medicine.strength || ""
                    }`;


                batchMedicine.appendChild(
                    option
                );
            }
        );


        if (medicines.length === 0) {

            batchMedicine.innerHTML = `
                <option value="">
                    No medicines available
                </option>
            `;
        }


    } catch (error) {

        batchMedicine.innerHTML = `
            <option value="">
                Unable to load medicines
            </option>
        `;


        batchFormMessage.textContent =
            error.message ||
            "Unable to load medicines.";

        batchFormMessage.style.color =
            "#d05b5b";

        batchFormMessage.style.display =
            "block";
    }
}


/* =========================================================
   CREATE NEW BATCH
========================================================= */

batchForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (isSubmittingBatch) {

            return;
        }


        if (!batchMedicine.value) {

            batchFormMessage.textContent =
                "Please select a medicine.";

            batchFormMessage.style.color =
                "#d05b5b";

            batchFormMessage.style.display =
                "block";

            return;
        }


        isSubmittingBatch =
            true;


        saveBatchButton.disabled =
            true;

        saveBatchButton.textContent =
            "Adding Batch...";


        batchFormMessage.style.display =
            "none";


        try {

            await apiRequest(
                "/medicine/pharmacist/batches/",
                {
                    method: "POST",

                    body: JSON.stringify({

                        medicine:
                            batchMedicine.value,

                        stock:
                            Number(
                                batchStock.value
                            ),

                        selling_price:
                            batchPrice.value,

                        batch_number:
                            batchNumber.value.trim(),

                        expiry_date:
                            batchExpiry.value,

                        is_available:
                            batchAvailable.checked
                    })
                }
            );


            batchFormMessage.textContent =
                "New batch added successfully.";

            batchFormMessage.style.color =
                "#438f89";

            batchFormMessage.style.display =
                "block";


            isSubmittingBatch =
                false;


            setTimeout(
                async function () {

                    closeBatchModalWindow();

                    await loadInventory();

                },
                600
            );


        } catch (error) {

            batchFormMessage.textContent =
                error.message ||
                "Unable to add new batch.";

            batchFormMessage.style.color =
                "#d05b5b";

            batchFormMessage.style.display =
                "block";


            isSubmittingBatch =
                false;

        } finally {

            saveBatchButton.disabled =
                false;

            saveBatchButton.textContent =
                "Add Batch";
        }

    }
);


/* =========================================================
   MODAL OVERLAY CLICK
========================================================= */

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


manageInventoryModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            manageInventoryModal
        ) {

            closeManageInventoryWindow();
        }
    }
);


batchModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            batchModal
        ) {

            closeBatchModalWindow();
        }
    }
);


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {

            return;
        }


        if (
            productModal.style.display ===
            "flex"
        ) {

            closeProductModalWindow();

            return;
        }


        if (
            categoryModal.style.display ===
            "flex"
        ) {

            closeCategoryModalWindow();

            return;
        }


        if (
            manageInventoryModal.style.display ===
            "flex"
        ) {

            closeManageInventoryWindow();

            return;
        }


        if (
            batchModal.style.display ===
            "flex"
        ) {

            closeBatchModalWindow();
        }
    }
);


/* =========================================================
   HELPERS
========================================================= */

function formatPrice(price) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {

        return "0.00";
    }


    return Number(price).toFixed(2);
}


function formatDate(dateString) {

    if (!dateString) {

        return "—";
    }


    const date =
        new Date(dateString);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;
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


function escapeHtml(value) {

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


/* =========================================================
   INITIAL LOAD
========================================================= */

loadInventory();