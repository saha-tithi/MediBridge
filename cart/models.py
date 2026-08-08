import uuid
from django.conf import settings
from django.db import models
from medicine.models import Medicine
from prescriptions.models import Prescription


class Cart(models.Model):
    id = models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False,)
    customer = models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="cart",)
    created_at = models.DateTimeField(auto_now_add=True,)
    updated_at = models.DateTimeField(auto_now=True,)

    def __str__(self):
        return f"{self.customer.username}'s Cart"


class CartItem(models.Model):
    id = models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False,)
    cart = models.ForeignKey(Cart,on_delete=models.CASCADE,related_name="items",)
    medicine = models.ForeignKey(Medicine,on_delete=models.CASCADE,related_name="cart_items",)
    prescription = models.ForeignKey(Prescription,on_delete=models.SET_NULL,null=True,blank=True,related_name="cart_items",)
    is_prescription_item = models.BooleanField(default=False,)
    quantity = models.PositiveIntegerField(default=1,)
    unit_price = models.DecimalField(max_digits=10,decimal_places=2,)
    subtotal = models.DecimalField(max_digits=10,decimal_places=2,)
    created_at = models.DateTimeField(auto_now_add=True,)

    class Meta:
        unique_together = (
            "cart",
            "medicine",
            "prescription",
        )

    def __str__(self):
        return f"{self.medicine.brand_name} x {self.quantity}"