from django.urls import path
from .views import login_page,dashboard_page


urlpatterns = [
    path("login/", login_page, name="login-page"),
    path("dashboard/", dashboard_page, name="dashboard-page"),
]