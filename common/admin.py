"""Site-wide setup for the MediBridge Django admin.

django.contrib.admin.autodiscover() imports ``<app>.admin`` for every
installed app, so this module is the natural home for branding that
applies to the whole admin site rather than to one model.
"""

from django.contrib import admin

# Shown in the header, the browser tab and the dashboard heading.
admin.site.site_header = "MediBridge Admin"
admin.site.site_title = "MediBridge admin"
admin.site.index_title = "Dashboard"

# Django defaults this to "/", but this project has no root route (see
# pages/urls.py), so the stock "View site" link 404s. The storefront's own
# navbar logo points at /medicines/, which is the de-facto home.
admin.site.site_url = "/medicines/"

# templates/admin/custom_index.html extends Django's admin/index.html
# and prepends the live stats cards.
admin.site.index_template = "admin/custom_index.html"
