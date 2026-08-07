import uuid
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering=["name"]
        verbose_name_plural="Categories"
    def __str__(self):
        return self.name


class Medicine(models.Model):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    category=models.ForeignKey(Category,on_delete=models.PROTECT,related_name="medicines")
    generic_name=models.CharField(max_length=150)
    brand_name=models.CharField(max_length=150)
    strength = models.CharField(max_length=50,help_text="Example: 500 mg, 650 mg, 5 ml")
    manufacturer=models.CharField(max_length=150)
    description=models.TextField(blank=True)
    requires_prescription = models.BooleanField(default=False)
    image = models.ImageField(upload_to="medicines/",blank=True,null=True,)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering=["brand_name"]
        indexes=[
            models.Index(fields=["brand_name"]),
            models.Index(fields=["generic_name"]),
            models.Index(fields=["manufacturer"]),
        ]
    def __str__(self):
        return f"{self.brand_name} ({self.strength})"


class Inventory(models.Model):
    medicine = models.ForeignKey(Medicine,on_delete=models.CASCADE,related_name="inventories",)
    stock=models.PositiveIntegerField(default=0)
    selling_price=models.DecimalField(max_digits=10,decimal_places=2)
    batch_number = models.CharField(max_length=100)
    expiry_date = models.DateField()
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering=["expiry_date"]

    def __str__(self):
        return f"{self.medicine.brand_name} - {self.stock}"


        

