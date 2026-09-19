from django.urls import path

from commerce.views import (
    CouponValidateView,
    CreateOrderView,
    MyOrdersView,
    OrderDetailView,
)

urlpatterns = [
    path("coupons/validate/", CouponValidateView.as_view()),
    path("checkout/orders/", CreateOrderView.as_view()),
    path("orders/mine/", MyOrdersView.as_view()),
    path("orders/<str:order_number>/", OrderDetailView.as_view()),
]
