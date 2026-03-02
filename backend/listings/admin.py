from django.contrib import admin
from .models import Listing


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display  = ('name', 'lieu', 'code_postal', 'price', 'surface', 'chambres')
    list_filter   = ('code_postal', 'chambres')
    search_fields = ('lieu', 'code_postal', 'name')
    ordering      = ('price',)
