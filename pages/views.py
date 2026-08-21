from django.shortcuts import render



def login_page(request):
    return render(request, "login.html")


def register_page(request):
    return render(request, "register.html")

def cart_page(request):
    return render(request, "cart/cart.html")

def checkout_page(request):
    return render(request, "checkout.html")