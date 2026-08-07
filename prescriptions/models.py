from django.db import models
from django.conf import settings
import uuid


class Prescription(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        VERIFIED = "VERIFIED", "Verified"
        REJECTED = "REJECTED", "Rejected"

    id = models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False,)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="prescriptions",)
    prescription = models.FileField(upload_to="prescriptions/",)
    extracted_text = models.TextField(blank=True,)
    status = models.CharField(max_length=20,choices=Status.choices,default=Status.PENDING,)
    pharmacist_note = models.TextField(blank=True,)
    uploaded_at = models.DateTimeField(auto_now_add=True,)
    updated_at = models.DateTimeField(auto_now=True,)
    extracted_medicines = models.JSONField(default=list,blank=True,)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.customer.username} - {self.status}"