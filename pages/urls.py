from django.urls import path
from .views import login_page, register_page,cart_page,checkout_page



urlpatterns = [
    path("login/", login_page, name="login-page"),
    path("register/", register_page, name="register-page"),
    path("cart/",cart_page,name="cart-page",),
    path(
        "checkout/",checkout_page,name="checkout-page",),
]