from django.urls import path
from .views import login_page, register_page,cart_page,checkout_page,checkout_review_page,order_success_page



urlpatterns = [
    path("login/", login_page, name="login-page"),
    path("register/", register_page, name="register-page"),
    path("cart/",cart_page,name="cart-page",),
    path("checkout/",checkout_page,name="checkout-page",),
    path("checkout/review/",checkout_review_page,name="checkout-review-page"),
    path("orders/success/<uuid:pk>/",order_success_page,name="order-success-page"),
]