from django.shortcuts import render



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