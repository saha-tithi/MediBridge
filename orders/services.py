from decimal import Decimal
from django.db import transaction
from cart.models import Cart
from orders.models import Order, OrderItem


@transaction.atomic
def create_order(customer, shipping_address):

    try:
        cart = Cart.objects.get(customer=customer)
    except Cart.DoesNotExist:
        raise ValueError("Cart does not exist.")

    cart_items = cart.items.select_related("medicine","prescription",).all()

    if not cart_items.exists():
        raise ValueError("Your cart is empty.")

    total_amount = Decimal("0.00")

    for cart_item in cart_items:
        total_amount += cart_item.subtotal

   
    order = Order.objects.create(customer=customer,status=Order.Status.PLACED,payment_status=Order.PaymentStatus.PENDING,total_amount=total_amount,shipping_address=shipping_address,)

    for cart_item in cart_items:
        OrderItem.objects.create(
            order=order,
            medicine=cart_item.medicine,
            prescription=cart_item.prescription,
            is_prescription_item=cart_item.is_prescription_item,
            quantity=cart_item.quantity,
            unit_price=cart_item.unit_price,
            subtotal=cart_item.subtotal,
        )

   
    cart_items.delete()

    return order


@transaction.atomic
def process_order(order):
    if order.status != Order.Status.PLACED:
        raise ValueError("Only placed orders can be processed.")

    for item in order.items.select_related("medicine","prescription",).all():

        inventory = (
            item.medicine.inventories
            .filter(
                is_available=True,
                stock__gte=item.quantity,
            )
            .order_by("expiry_date")
            .first()
        )

        if inventory is None:
            raise ValueError(f"{item.medicine.brand_name} is out of stock.")

        if item.is_prescription_item:
            if item.prescription is None:
                raise ValueError(
                    f"Prescription is missing for "
                    f"{item.medicine.brand_name}."
                )

    order.status = Order.Status.PACKED

    order.save(
        update_fields=["status","updated_at",]
    )
    return order

@transaction.atomic
def update_order_status(order, new_status):

    allowed_transitions = {
        Order.Status.PACKED: [Order.Status.SHIPPED,],Order.Status.SHIPPED: [Order.Status.DELIVERED,],
    }

    current_status = order.status

    if current_status not in allowed_transitions:
        raise ValueError(
            f"Order cannot be moved from "
            f"{current_status}."
        )

    if new_status not in allowed_transitions[current_status]:
        raise ValueError(
            f"Cannot move order from "
            f"{current_status} to {new_status}."
        )

    order.status = new_status

    order.save(update_fields=["status","updated_at",])

    return order