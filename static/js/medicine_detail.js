const cartAction =
    document.getElementById("medicineCartAction");


if (cartAction) {

    const medicineId =
        cartAction.dataset.medicineId;

    const availableStock =
        parseInt(
            cartAction.dataset.stock,
            10
        );


    loadMedicineCart();


    // =========================================================
    // LOAD CART
    // =========================================================

    async function loadMedicineCart() {

        try {

            const response =
                await apiRequest(
                    "/cart/",
                    {
                        method: "GET"
                    }
                );


            const cart =
                response.data;


            if (
                cart &&
                Array.isArray(cart.items)
            ) {

                const existingItem =
                    cart.items.find(
                        function (item) {

                            return (
                                String(item.medicine_id) ===
                                String(medicineId)
                            );

                        }
                    );


                if (existingItem) {

                    showQuantityControl(
                        existingItem.id,
                        existingItem.quantity
                    );

                } else {

                    showAddButton();

                }


                updateNavbarCartCount(cart);

            } else {

                showAddButton();

            }


        } catch (error) {

            console.error(
                "Unable to load cart:",
                error
            );

            showAddButton();

        }

    }


    // =========================================================
    // ADD TO CART BUTTON
    // =========================================================

    function showAddButton() {

        cartAction.innerHTML = `

            <button
                type="button"
                class="add-to-cart-button"
                id="addToCartButton"
            >
                Add to Cart
            </button>

        `;


        const button =
            document.getElementById(
                "addToCartButton"
            );


        if (button) {

            button.addEventListener(
                "click",
                addToCart
            );

        }

    }


    async function addToCart() {

        const button =
            document.getElementById(
                "addToCartButton"
            );


        if (!button) {
            return;
        }


        button.disabled = true;

        button.textContent =
            "Adding...";


        try {

            const response =
                await apiRequest(
                    "/cart/items/",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            medicine_id: medicineId,
                            quantity: 1
                        })
                    }
                );


            const cart =
                response.data;


            if (
                cart &&
                Array.isArray(cart.items)
            ) {

                const cartItem =
                    cart.items.find(
                        function (item) {

                            return (
                                String(item.medicine_id) ===
                                String(medicineId)
                            );

                        }
                    );


                if (cartItem) {

                    showQuantityControl(
                        cartItem.id,
                        cartItem.quantity
                    );

                }

                updateNavbarCartCount(cart);

            }


        } catch (error) {

            console.error(
                "Add to cart error:",
                error
            );


            button.disabled = false;

            button.textContent =
                "Add to Cart";


            showCartMessage(
                error.message ||
                "Unable to add medicine to cart."
            );

        }

    }


    // =========================================================
    // QUANTITY CONTROL
    // =========================================================

    function showQuantityControl(
        cartItemId,
        quantity
    ) {

        const maximumReached =
            quantity >= availableStock;


        cartAction.innerHTML = `

            <div class="medicine-quantity-wrapper">

                <div class="medicine-quantity-control">

                    <button
                        type="button"
                        class="medicine-quantity-button"
                        id="decreaseQuantity"
                        aria-label="Decrease quantity"
                    >
                        −
                    </button>


                    <span
                        class="medicine-quantity-value"
                        id="medicineQuantity"
                    >
                        ${quantity}
                    </span>


                    <button
                        type="button"
                        class="medicine-quantity-button"
                        id="increaseQuantity"
                        aria-label="Increase quantity"
                        ${maximumReached ? "disabled" : ""}
                    >
                        +
                    </button>

                </div>


                ${
                    maximumReached
                    ?
                    `
                        <p class="stock-limit-message">
                            Maximum available quantity reached.
                        </p>
                    `
                    :
                    ""
                }

            </div>

        `;


        // Store the current cart item information
        // directly on the container.

        cartAction.dataset.cartItemId =
            cartItemId;

        cartAction.dataset.quantity =
            quantity;

    }


    // =========================================================
    // QUANTITY BUTTONS
    // =========================================================

    cartAction.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".medicine-quantity-button"
                );


            if (!button) {
                return;
            }


            const cartItemId =
                cartAction.dataset.cartItemId;


            const currentQuantity =
                parseInt(
                    cartAction.dataset.quantity,
                    10
                );


            if (!cartItemId) {
                console.error(
                    "Cart item ID is missing."
                );
                return;
            }


            if (
                Number.isNaN(
                    currentQuantity
                )
            ) {

                console.error(
                    "Current quantity is invalid."
                );

                return;

            }


            // -----------------------------------------
            // DECREASE
            // -----------------------------------------

            if (
                button.id ===
                "decreaseQuantity"
            ) {

                if (
                    currentQuantity <= 1
                ) {

                    return;

                }


                updateQuantity(
                    cartItemId,
                    currentQuantity - 1
                );

                return;

            }


            // -----------------------------------------
            // INCREASE
            // -----------------------------------------

            if (
                button.id ===
                "increaseQuantity"
            ) {

                if (
                    currentQuantity >=
                    availableStock
                ) {

                    return;

                }


                updateQuantity(
                    cartItemId,
                    currentQuantity + 1
                );

            }

        }
    );


    // =========================================================
    // UPDATE QUANTITY
    // =========================================================

    async function updateQuantity(
        cartItemId,
        newQuantity
    ) {

        try {

            const response =
                await apiRequest(
                    `/cart/items/${cartItemId}/`,
                    {
                        method: "PATCH",

                        body: JSON.stringify({
                            quantity: newQuantity
                        })
                    }
                );


            const cart =
                response.data;


            if (
                cart &&
                Array.isArray(cart.items)
            ) {

                const cartItem =
                    cart.items.find(
                        function (item) {

                            return (
                                String(item.medicine_id) ===
                                String(medicineId)
                            );

                        }
                    );


                if (cartItem) {

                    showQuantityControl(
                        cartItem.id,
                        cartItem.quantity
                    );

                }


                updateNavbarCartCount(cart);

            }


        } catch (error) {

            console.error(
                "Quantity update error:",
                error
            );


            showCartMessage(
                error.message ||
                "Unable to update quantity."
            );


            await loadMedicineCart();

        }

    }


    // =========================================================
    // NAVBAR CART COUNT
    // =========================================================

    function updateNavbarCartCount(cart) {

        const cartCount =
            document.getElementById(
                "cartCount"
            );


        if (!cartCount) {
            return;
        }


        if (
            !cart ||
            !Array.isArray(cart.items)
        ) {

            cartCount.textContent =
                "0";

            return;

        }


        const totalItems =
            cart.items.reduce(
                function (
                    total,
                    item
                ) {

                    return (
                        total +
                        Number(item.quantity || 0)
                    );

                },
                0
            );


        cartCount.textContent =
            totalItems;

    }


    // =========================================================
    // CART MESSAGE
    // =========================================================

    function showCartMessage(message) {

        let messageElement =
            document.getElementById(
                "cartActionMessage"
            );


        if (!messageElement) {

            messageElement =
                document.createElement(
                    "p"
                );


            messageElement.id =
                "cartActionMessage";


            messageElement.className =
                "cart-action-message";


            cartAction.appendChild(
                messageElement
            );

        }


        messageElement.textContent =
            message;


        setTimeout(
            function () {

                if (
                    messageElement &&
                    messageElement.parentNode
                ) {

                    messageElement.remove();

                }

            },
            3000
        );

    }

}