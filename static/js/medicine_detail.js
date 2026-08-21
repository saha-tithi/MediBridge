
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
                cart.items
            ) {

                const existingItem =
                    cart.items.find(
                        function (item) {

                            return (
                                item.medicine_id ===
                                medicineId
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


        button.addEventListener(
            "click",
            addToCart
        );

    }

    async function addToCart() {

        const button =
            document.getElementById(
                "addToCartButton"
            );


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


            const cartItem =
                cart.items.find(
                    function (item) {

                        return (
                            item.medicine_id ===
                            medicineId
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


        const decreaseButton =
            document.getElementById(
                "decreaseQuantity"
            );


        const increaseButton =
            document.getElementById(
                "increaseQuantity"
            );




        decreaseButton.addEventListener(
            "click",
            function () {

                if (quantity > 1) {

                    updateQuantity(
                        cartItemId,
                        quantity - 1
                    );

                }

            }
        );




        increaseButton.addEventListener(
            "click",
            function () {

                if (
                    quantity <
                    availableStock
                ) {

                    updateQuantity(
                        cartItemId,
                        quantity + 1
                    );

                }

            }
        );

    }





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


            const cartItem =
                cart.items.find(
                    function (item) {

                        return (
                            item.medicine_id ===
                            medicineId
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
            !cart.items
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
                        item.quantity
                    );

                },
                0
            );


        cartCount.textContent =
            totalItems;

    }


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