import uuid
from django.conf import settings
from django.db import models
from medicine.models import Medicine
from prescriptions.models import Prescription


class Order(models.Model):

    class Status(models.TextChoices):
        PLACED = "PLACED", "Placed"
        PROCESSING = "PROCESSING", "Processing"
        PACKED = "PACKED", "Packed"
        SHIPPED = "SHIPPED", "Shipped"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"

    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"
    class PaymentMethod(models.TextChoices):
        ONLINE = "ONLINE", "Online"
        COD = "COD", "Cash on Delivery"
    

    id = models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False,)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT,related_name="orders",)

    status = models.CharField(max_length=20,choices=Status.choices,default=Status.PLACED,)

    payment_status = models.CharField(max_length=20,choices=PaymentStatus.choices,default=PaymentStatus.PENDING,)
    payment_method = models.CharField(max_length=20,choices=PaymentMethod.choices,default=PaymentMethod.COD,
)
    total_amount = models.DecimalField(max_digits=10,decimal_places=2,)

    shipping_address = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True,)

    updated_at = models.DateTimeField(auto_now=True,)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order {self.id} - {self.customer.username}"


class OrderItem(models.Model):

    id = models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False,)

    order = models.ForeignKey(Order,on_delete=models.CASCADE,related_name="items",)

    medicine = models.ForeignKey(Medicine,on_delete=models.PROTECT,related_name="order_items",)

    prescription = models.ForeignKey(Prescription,on_delete=models.PROTECT,null=True,blank=True,related_name="order_items",)

    is_prescription_item = models.BooleanField(default=False,)

    quantity = models.PositiveIntegerField()

    unit_price = models.DecimalField(max_digits=10,decimal_places=2,)

    subtotal = models.DecimalField(max_digits=10,decimal_places=2,)

    created_at = models.DateTimeField(auto_now_add=True,)

    def __str__(self):
        return f"{self.medicine.brand_name} x {self.quantity}"