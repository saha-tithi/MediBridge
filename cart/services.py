from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from medicine.models import Medicine, Inventory
from prescriptions.models import Prescription

from .models import Cart, CartItem


def get_available_inventories(medicine):

    return (
        Inventory.objects.filter(
            medicine=medicine,
            is_available=True,
            stock__gt=0,
            expiry_date__gte=timezone.now().date(),
        )
        .order_by("expiry_date")
    )


def get_total_available_stock(medicine):

    inventories = get_available_inventories(
        medicine
    )

    return sum(
        inventory.stock
        for inventory in inventories
    )


@transaction.atomic
def add_to_cart(
    customer,
    medicine_id,
    quantity,
    prescription_id=None,
):

    # -----------------------------------------
    # GET MEDICINE
    # -----------------------------------------

    try:

        medicine = Medicine.objects.get(
            id=medicine_id
        )

    except Medicine.DoesNotExist:

        raise ValueError(
            "Medicine not found."
        )


    # -----------------------------------------
    # GET PRESCRIPTION IF PROVIDED
    # -----------------------------------------

    prescription = None

    if prescription_id:

        try:

            prescription = Prescription.objects.get(
                id=prescription_id,
                customer=customer,
            )

        except Prescription.DoesNotExist:

            raise ValueError(
                "Invalid prescription."
            )


    # -----------------------------------------
    # PRESCRIPTION REQUIREMENT
    # -----------------------------------------

    if medicine.requires_prescription:

        if prescription is None:

            raise ValueError(
                "This medicine requires a valid prescription."
            )


    # -----------------------------------------
    # INVENTORY
    # -----------------------------------------

    total_available_stock = (
        get_total_available_stock(medicine)
    )


    if total_available_stock <= 0:

        raise ValueError(
            "Medicine is currently unavailable."
        )


    if quantity > total_available_stock:

        raise ValueError(
            f"Only {total_available_stock} item(s) available."
        )


    # -----------------------------------------
    # GET / CREATE CART
    # -----------------------------------------

    cart, _ = Cart.objects.get_or_create(
        customer=customer,
    )


    # -----------------------------------------
    # PRESCRIPTION ITEM FLAG
    # -----------------------------------------

    is_prescription_item = (
        medicine.requires_prescription
    )


    # -----------------------------------------
    # GET ACTIVE INVENTORY FOR PRICE
    # -----------------------------------------

    inventories = get_available_inventories(
        medicine
    )

    active_inventory = inventories.first()


    # -----------------------------------------
    # CREATE / GET CART ITEM
    # -----------------------------------------

    cart_item, created = CartItem.objects.get_or_create(
        cart=cart,
        medicine=medicine,
        prescription=prescription,
        defaults={
            "quantity": quantity,
            "unit_price": active_inventory.selling_price,
            "subtotal": (
                active_inventory.selling_price
                * quantity
            ),
            "is_prescription_item": (
                is_prescription_item
            ),
        },
    )


    # -----------------------------------------
    # EXISTING CART ITEM
    # -----------------------------------------

    if not created:

        new_quantity = (
            cart_item.quantity + quantity
        )


        if new_quantity > total_available_stock:

            raise ValueError(
                f"Only {total_available_stock} item(s) available."
            )


        cart_item.quantity = new_quantity

        cart_item.subtotal = (
            Decimal(new_quantity)
            * cart_item.unit_price
        )


        cart_item.save(
            update_fields=[
                "quantity",
                "subtotal",
            ]
        )


    return cart_item


@transaction.atomic
def update_cart_item(
    cart_item,
    quantity,
):

    # -----------------------------------------
    # TOTAL AVAILABLE STOCK
    # -----------------------------------------

    total_available_stock = (
        get_total_available_stock(
            cart_item.medicine
        )
    )


    if total_available_stock <= 0:

        raise ValueError(
            "Medicine is unavailable."
        )


    if quantity > total_available_stock:

        raise ValueError(
            f"Only {total_available_stock} item(s) available."
        )


    # -----------------------------------------
    # UPDATE CART ITEM
    # -----------------------------------------

    cart_item.quantity = quantity

    cart_item.subtotal = (
        Decimal(quantity)
        * cart_item.unit_price
    )


    cart_item.save(
        update_fields=[
            "quantity",
            "subtotal",
        ]
    )


    return cart_item


def remove_cart_item(cart_item):

    cart_item.delete()


def clear_cart(cart):

    cart.items.all().delete()


def get_cart(customer):

    cart, _ = Cart.objects.get_or_create(
        customer=customer,
    )

    return cart