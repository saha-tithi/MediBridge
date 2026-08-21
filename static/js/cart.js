/* =========================================
   CART ELEMENTS
========================================= */

const cartItems =
    document.getElementById("cartItems");

const cartLayout =
    document.getElementById("cartLayout");

const orderSummary =
    document.getElementById("orderSummary");

const summaryItems =
    document.getElementById("summaryItems");

const summaryTotal =
    document.getElementById("summaryTotal");

const checkoutButton =
    document.getElementById("checkoutButton");



/* =========================================
   API HELPER
========================================= */

async function cartAPI(url, options = {}) {

    const token =
        localStorage.getItem("access_token");


    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };


    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;

    }


    const response =
        await fetch(
            `/api/v1${url}`,
            {
                ...options,
                headers: headers
            }
        );


    let data = {};

    try {

        data = await response.json();

    } catch (error) {

        data = {};

    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            data.detail ||
            "Something went wrong."
        );

    }


    return data;

}



/* =========================================
   LOAD CART
========================================= */

async function loadCart() {

    cartItems.innerHTML = `

        <div class="cart-loading">

            <div class="loading-circle"></div>

            <p>
                Loading your cart...
            </p>

        </div>

    `;


    try {

        const response =
            await cartAPI(
                "/cart/",
                {
                    method: "GET"
                }
            );


        const cart =
            response.data;


        renderCart(cart);


    } catch (error) {

        console.error(
            "Cart loading error:",
            error
        );


        cartLayout.classList.remove(
            "empty-cart-layout"
        );


        orderSummary.style.display =
            "block";


        cartItems.innerHTML = `

            <div class="cart-error">

                <h2>
                    Unable to load your cart
                </h2>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>

        `;

    }

}



/* =========================================
   RENDER CART
========================================= */

function renderCart(cart) {


    /* ================================
       EMPTY CART
    ================================= */

    if (
        !cart ||
        !cart.items ||
        cart.items.length === 0
    ) {

        renderEmptyCart();

        return;

    }


    /* ================================
       CART HAS ITEMS
    ================================= */

    cartLayout.classList.remove(
        "empty-cart-layout"
    );


    orderSummary.style.display =
        "block";


    cartItems.innerHTML =
        cart.items
            .map(function (item) {

                return createCartItemHTML(item);

            })
            .join("");


    updateSummary(cart);

}



/* =========================================
   EMPTY CART
========================================= */

function renderEmptyCart() {

    cartLayout.classList.add(
        "empty-cart-layout"
    );


    orderSummary.style.display =
        "none";


    cartItems.innerHTML = `

        <div class="empty-cart">

            <div class="empty-cart-icon">
                🛒
            </div>


            <h2>
                Your cart is empty
            </h2>


            <p>
                You haven't added any medicines yet.
                Browse our medicine collection and
                add what you need.
            </p>


            <a
                href="/medicines/"
                class="empty-cart-button"
            >
                Continue Shopping
            </a>

        </div>

    `;


    summaryItems.textContent =
        "0";


    summaryTotal.textContent =
        "₹0.00";


    checkoutButton.disabled =
        true;

}



/* =========================================
   CREATE CART ITEM
========================================= */

function createCartItemHTML(item) {

    const prescriptionBadge =
        item.is_prescription_item

        ? `
            <div class="cart-prescription">

                <span>
                    ▣
                </span>

                Prescription medicine

            </div>
        `

        : "";


    return `

        <article
            class="cart-item"
            data-item-id="${item.id}"
        >

            <div class="cart-item-image">

                <div class="cart-pill-placeholder"></div>

            </div>


            <div class="cart-item-info">

                <span class="cart-item-category">
                    Medicine
                </span>


                <h3>
                    ${escapeHTML(item.medicine_name)}
                </h3>


                <p class="cart-item-generic">
                    ₹${item.unit_price} per item
                </p>


                ${prescriptionBadge}

            </div>


            <div class="cart-item-actions">

                <div class="quantity-control">

                    <button
                        type="button"
                        class="quantity-button"
                        onclick="
                            decreaseQuantity(
                                '${item.id}',
                                ${item.quantity}
                            )
                        "
                    >
                        −
                    </button>


                    <span class="quantity-value">
                        ${item.quantity}
                    </span>


                    <button
                        type="button"
                        class="quantity-button"
                        onclick="
                            increaseQuantity(
                                '${item.id}',
                                ${item.quantity}
                            )
                        "
                    >
                        +
                    </button>

                </div>


                <div class="cart-item-subtotal">
                    ₹${item.subtotal}
                </div>


                <button
                    type="button"
                    class="remove-item"
                    onclick="
                        removeCartItem(
                            '${item.id}'
                        )
                    "
                >
                    Remove
                </button>

            </div>

        </article>

    `;

}



/* =========================================
   UPDATE SUMMARY
========================================= */

function updateSummary(cart) {

    let totalQuantity = 0;


    cart.items.forEach(function (item) {

        totalQuantity +=
            Number(item.quantity);

    });


    summaryItems.textContent =
        totalQuantity;


    summaryTotal.textContent =
        `₹${cart.total}`;


    checkoutButton.disabled =
        false;

}



/* =========================================
   INCREASE QUANTITY
========================================= */

async function increaseQuantity(
    itemId,
    currentQuantity
) {

    await updateQuantity(
        itemId,
        currentQuantity + 1
    );

}



/* =========================================
   DECREASE QUANTITY
========================================= */

async function decreaseQuantity(
    itemId,
    currentQuantity
) {

    if (currentQuantity <= 1) {

        return;

    }


    await updateQuantity(
        itemId,
        currentQuantity - 1
    );

}



/* =========================================
   UPDATE QUANTITY
========================================= */

async function updateQuantity(
    itemId,
    quantity
) {

    try {

        await cartAPI(
            `/cart/items/${itemId}/`,
            {
                method: "PATCH",

                body: JSON.stringify({
                    quantity: quantity
                })
            }
        );


        await loadCart();


    } catch (error) {

        alert(
            error.message ||
            "Unable to update cart."
        );

    }

}



/* =========================================
   REMOVE CART ITEM
========================================= */

async function removeCartItem(itemId) {

    try {

        await cartAPI(
            `/cart/items/${itemId}/remove/`,
            {
                method: "DELETE"
            }
        );


        await loadCart();


    } catch (error) {

        alert(
            error.message ||
            "Unable to remove item."
        );

    }

}



/* =========================================
   CHECKOUT
========================================= */

checkoutButton.addEventListener(
    "click",
    function () {

        if (checkoutButton.disabled) {

            return;

        }


        window.location.href =
            "/checkout/";

    }
);



/* =========================================
   HTML ESCAPE
========================================= */

function escapeHTML(value) {

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



/* =========================================
   INITIAL LOAD
========================================= */

loadCart();