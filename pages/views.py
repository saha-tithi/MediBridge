from django.shortcuts import render,get_object_or_404
from medicine.models import Medicine



def login_page(request):
    return render(request, "login.html")


def register_page(request):
    return render(request, "register.html")

def cart_page(request):
    return render(request, "cart/cart.html")

def checkout_page(request):
    return render(request, "checkout.html")

def checkout_review_page(request):
    return render(
        request,
        "checkout_review.html")
def order_success_page(request, pk):

    return render(
        request,
        "order_success.html",
        {
            "order_id": pk,
        }
    )
def orders_page(request):
    return render(request,"orders/orders.html"
)
def order_detail_page(request, pk):

    return render(
        request,
        "orders/order_detail.html",
        {
            "order_id": pk,
        }
    )
def profile_page(request):
    return render(
        request,
        "profile.html"
    )
def addresses_page(request):
    return render(
        request,
        "addresses.html"
    )
def upload_prescription_page(request):
    return render(
        request,
        "prescriptions/upload_prescription.html"
    )
def prescription_results_page(request, pk):
    return render(
        request,
        "prescriptions/prescription_results.html",
        {
            "prescription_id": pk,
        }
    )
def prescriptions_page(request):
    return render(
        request,
        "prescriptions/prescriptions.html"
    )
def pharmacist_overview_page(request):
    return render(
        request,
        "pharmacist/overview.html"
    )
def pharmacist_orders_page(request):
    return render(request, "pharmacist/orders.html")
def pharmacist_order_detail_page(request, pk):
    return render(request, "pharmacist/order_detail.html")
def pharmacist_inventory_page(request):
    return render(
        request,
        "pharmacist/inventory.html",
    )

def medicine_detail_page(request, pk):

    medicine = get_object_or_404(
        Medicine.objects
        .select_related("category")
        .prefetch_related("inventories"),
        pk=pk,
    )

    active_inventory = (
        medicine.inventories
        .filter(
            is_available=True,
            stock__gt=0,
        )
        .order_by("expiry_date")
        .first()
    )

    return render(
        request,
        "medicines/medicine_detail.html",
        {
            "medicine": medicine,
            "active_inventory": active_inventory,
        },
    )