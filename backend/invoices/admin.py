from django.contrib import admin
from .models import Client, Invoice, Payment, ShopSettings

admin.site.register(ShopSettings)
admin.site.register(Client)
admin.site.register(Invoice)
admin.site.register(Payment)
