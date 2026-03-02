from rest_framework import serializers
from .models import Listing


class ListingSerializer(serializers.ModelSerializer):
    prix_m2     = serializers.SerializerMethodField()
    cp_display  = serializers.SerializerMethodField()
    chambres_n  = serializers.SerializerMethodField()

    class Meta:
        model  = Listing
        fields = [
            'id', 'name', 'surface', 'price', 'prix_m2',
            'lieu', 'chambres', 'chambres_n', 'pieces',
            'etage', 'code_postal', 'cp_display', 'arrondissement',
        ]

    def get_prix_m2(self, obj):
        if obj.surface and obj.surface > 0 and obj.price:
            return round(obj.price / obj.surface, 1)
        return None

    def get_cp_display(self, obj):
        """Return postal code as a clean string (e.g. 75016 not 75016.0)."""
        if obj.code_postal is None:
            return ''
        try:
            return str(int(obj.code_postal))
        except (ValueError, OverflowError):
            return str(obj.code_postal)

    def get_chambres_n(self, obj):
        """Normalise chambres to a number regardless of storage type."""
        if obj.chambres is None:
            return None
        try:
            return int(float(str(obj.chambres)))
        except (ValueError, TypeError):
            return None
