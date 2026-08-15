from django.shortcuts import render
from common.news import get_health_articles


def login_page(request):
    return render(request, "login.html")


def register_page(request):
    return render(request, "register.html")


def dashboard_page(request):

    articles = get_health_articles(limit=6)

    return render(
        request,
        "dashboard.html",
        {
            "articles": articles,
        },
    )