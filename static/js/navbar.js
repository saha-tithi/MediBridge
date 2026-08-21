document.addEventListener("DOMContentLoaded", async function () {

    const cartCount = document.getElementById("cartCount");

    
    if (!cartCount) {
        return;
    }

    try {

        const response = await apiRequest(
            "/cart/",
            {
                method: "GET"
            }
        );

        const cart = response.data;

        if (cart && cart.items) {

            const totalItems = cart.items.reduce(
                function (total, item) {
                    return total + item.quantity;
                },
                0
            );

            cartCount.textContent = totalItems;

        } else {

            cartCount.textContent = "0";

        }

    } catch (error) {

        console.error(
            "Unable to fetch cart count:",
            error
        );

        cartCount.textContent = "0";
    }

});