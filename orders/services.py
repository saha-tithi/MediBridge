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