from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from medicine.models import Medicine, Inventory
from prescriptions.models import Prescription
from .models import Cart, CartItem


def get_available_inventory(medicine):

    return (Inventory.objects.filter( medicine=medicine,is_available=True, stock__gt=0,expiry_date__gte=timezone.now().date(),).order_by("expiry_date").first())


@transaction.atomic
def add_to_cart(customer,medicine_id,quantity,prescription_id=None,):
    medicine = Medicine.objects.get(id=medicine_id)
    if medicine.requires_prescription and not prescription_id:
        raise ValueError("This medicine requires a valid prescription.")

    inventory = get_available_inventory(medicine)

    if inventory is None:
        raise ValueError("Medicine is currently unavailable.")

    if quantity > inventory.stock:
        raise ValueError(f"Only {inventory.stock} item(s) available.")

    cart, _ = Cart.objects.get_or_create(customer=customer,)

    prescription = None
    is_prescription_item = False

    if prescription_id:
        prescription = Prescription.objects.get(id=prescription_id,customer=customer,)
        is_prescription_item = True

    cart_item, created = CartItem.objects.get_or_create(cart=cart,medicine=medicine,prescription=prescription,
        defaults={
            "quantity": quantity,
            "unit_price": inventory.selling_price,
            "subtotal": inventory.selling_price * quantity,
            "is_prescription_item": is_prescription_item,
        },
    )

    if not created:

        new_quantity = cart_item.quantity + quantity

        if new_quantity > inventory.stock:
            raise ValueError(f"Only {inventory.stock} item(s) available.")

        cart_item.quantity = new_quantity
        cart_item.subtotal = (Decimal(new_quantity) * cart_item.unit_price)

        cart_item.save(
            update_fields=[
                "quantity",
                "subtotal",
            ]
        )

    return cart_item


@transaction.atomic
def update_cart_item(cart_item,quantity,):
    
    inventory = get_available_inventory(cart_item.medicine)

    if inventory is None:
        raise ValueError("Medicine is unavailable.")

    if quantity > inventory.stock:
        raise ValueError(f"Only {inventory.stock} item(s) available.")

    cart_item.quantity = quantity
    cart_item.subtotal = (Decimal(quantity) * cart_item.unit_price)

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