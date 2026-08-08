from django.urls import path

from .views import (AddToCartAPIView,CartAPIView,ClearCartAPIView,RemoveCartItemAPIView,UpdateCartItemAPIView,)

urlpatterns = [
    path("",CartAPIView.as_view(),name="cart",),
    path("items/",AddToCartAPIView.as_view(),name="cart-add",),
    path("items/<uuid:pk>/",UpdateCartItemAPIView.as_view(),name="cart-update",),
    path("items/<uuid:pk>/remove/",RemoveCartItemAPIView.as_view(),name="cart-remove",),
    path("clear/",ClearCartAPIView.as_view(),name="cart-clear",),
]