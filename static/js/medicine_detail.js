
const cartAction =
    document.getElementById("medicineCartAction");


if (cartAction) {

    const medicineId =
        cartAction.dataset.medicineId;


    

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

                }

                else {

                    showAddButton();

                }

            }

            else {

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


            console.log(
                "Added to cart:",
                response
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


            alert(
                error.message ||
                "Unable to add medicine to cart."
            );


            button.disabled = false;

            button.textContent =
                "Add to Cart";

        }

    }



    
    function showQuantityControl(
        cartItemId,
        quantity
    ) {

        cartAction.innerHTML = `

            <div class="medicine-quantity-control">

                <button
                    type="button"
                    class="medicine-quantity-button"
                    id="decreaseQuantity"
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
                >
                    +
                </button>

            </div>

        `;


        document
            .getElementById("decreaseQuantity")
            .addEventListener(
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


        document
            .getElementById("increaseQuantity")
            .addEventListener(
                "click",
                function () {

                    updateQuantity(
                        cartItemId,
                        quantity + 1
                    );

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


            alert(
                error.message ||
                "Unable to update quantity."
            );

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

}