from django.contrib import admin
from .models import Category,Medicine,Inventory

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id","name",)
    search_fields = ("name",)

@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ("brand_name","generic_name","strength","manufacturer","requires_prescription",)
    list_filter = ("category","requires_prescription",)
    search_fields = ("brand_name","generic_name","manufacturer",)

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ("medicine","stock","selling_price","expiry_date","is_available",)
    list_filter = ("is_available",)
    search_fields = ("medicine__brand_name",)


    