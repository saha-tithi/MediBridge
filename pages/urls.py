from django.urls import path
from .views import login_page, register_page,cart_page,checkout_page,checkout_review_page,order_success_page,order_detail_page,orders_page,profile_page,addresses_page,upload_prescription_page,prescription_results_page,prescriptions_page,pharmacist_overview_page,pharmacist_orders_page,pharmacist_order_detail_page,pharmacist_inventory_page,medicine_detail_page,pharmacist_medicines_page,pharmacist_medicine_detail_page



urlpatterns = [
    path("login/", login_page, name="login-page"),
    path("register/", register_page, name="register-page"),
    path("cart/",cart_page,name="cart-page",),
    path("checkout/",checkout_page,name="checkout-page",),
    path("checkout/review/",checkout_review_page,name="checkout-review-page"),
    path("orders/",orders_page,name="orders-page",),
    path("orders/success/<uuid:pk>/",order_success_page,name="order-success-page"),
    path("orders/<uuid:pk>/",order_detail_page,name="order-detail-page",),
    path("profile/",profile_page,name="profile-page",),
    path("addresses/",addresses_page,name="addresses-page",),
    path("upload-prescription/",upload_prescription_page,name="upload-prescription-page",),
    path("prescription-results/<uuid:pk>/",prescription_results_page,name="prescription-results-page",),
    path("prescriptions/", prescriptions_page, name="prescriptions-page",),
    path("pharmacist/",pharmacist_overview_page,name="pharmacist-overview-page",),
    path("pharmacist/orders/",pharmacist_orders_page,name="pharmacist-order-list-page",),
    path("pharmacist/orders/<uuid:pk>/",pharmacist_order_detail_page,name="pharmacist-order-detail-page",),
    path("pharmacist/inventory/",pharmacist_inventory_page,name="pharmacist-inventory-page",),
    path("medicines/<uuid:pk>/", medicine_detail_page, name="medicine-detail-page",),
    path("pharmacist/medicines/",pharmacist_medicines_page,name="pharmacist-medicine-list-page",),
    path("pharmacist/medicines/<uuid:pk>/",pharmacist_medicine_detail_page,name="pharmacist-medicine-detail-page",),
]