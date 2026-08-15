import requests
from decouple import config


NEWS_API_KEY = config("NEWS_API_KEY")

NEWS_API_URL = "https://newsdata.io/api/1/latest"


def get_health_articles(limit=6):
    params = {
        "apikey": NEWS_API_KEY,
        "q": "health medicine healthcare medical",
        "language": "en",
        "size": limit,
    }

    try:
        response = requests.get(
            NEWS_API_URL,
            params=params,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        articles = []

        for article in data.get("results", []):

            articles.append({
                "title": article.get("title", ""),
                "summary": article.get("description", ""),
                "url": article.get("link", ""),
                "image": article.get("image_url"),
                "source": article.get("source_name", "Health News"),
                "published": article.get("pubDate", ""),
                "category": "Health",
            })

        return articles

    except requests.RequestException:
        return []