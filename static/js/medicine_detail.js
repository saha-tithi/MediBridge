const addToCartButton =
    document.querySelector(".add-to-cart-button");


if (addToCartButton) {

    addToCartButton.addEventListener(
        "click",
        async function () {

            const medicineId =
                this.dataset.medicineId;


            if (!medicineId) {

                console.error(
                    "Medicine ID not found."
                );

                return;
            }


            const originalText =
                this.textContent;


            this.disabled = true;

            this.textContent =
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


                this.textContent =
                    "Added to Cart ✓";


                /*
                 * Update navbar cart count
                 */

                const cartCount =
                    document.getElementById(
                        "cartCount"
                    );


                if (cartCount) {

                    const cart =
                        response.data;


                    if (
                        cart &&
                        cart.items
                    ) {

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


                /*
                 * Restore button
                 */

                setTimeout(
                    function () {

                        addToCartButton.disabled =
                            false;

                        addToCartButton.textContent =
                            originalText;

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "Add to cart error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to add medicine to cart."
                );


                this.disabled = false;

                this.textContent =
                    originalText;

            }

        }
    );

}