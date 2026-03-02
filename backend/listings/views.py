from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Min, Max, F, FloatField, ExpressionWrapper

from .models import Listing
from .serializers import ListingSerializer


class ListingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ListingSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ['lieu', 'name']
    ordering_fields  = ['price', 'surface', 'code_postal']

    def get_queryset(self):
        qs = Listing.objects.filter(price__isnull=False, surface__isnull=False)

        # Filter by postal code (stored as float, e.g. 75016.0)
        code_postal = self.request.query_params.get('code_postal')
        if code_postal:
            try:
                qs = qs.filter(code_postal=float(code_postal))
            except ValueError:
                pass

        min_price = self.request.query_params.get('min_price')
        if min_price:
            qs = qs.filter(price__gte=float(min_price))

        max_price = self.request.query_params.get('max_price')
        if max_price:
            qs = qs.filter(price__lte=float(max_price))

        min_surface = self.request.query_params.get('min_surface')
        if min_surface:
            qs = qs.filter(surface__gte=float(min_surface))

        return qs

    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = self.get_queryset()

        prix_m2_expr = ExpressionWrapper(
            F('price') / F('surface'),
            output_field=FloatField(),
        )

        agg = qs.annotate(ppm2=prix_m2_expr).aggregate(
            total       = Count('id'),
            avg_price   = Avg('price'),
            avg_surface = Avg('surface'),
            avg_prix_m2 = Avg('ppm2'),
            min_price   = Min('price'),
            max_price   = Max('price'),
        )

        for key in ('avg_price', 'avg_surface', 'avg_prix_m2'):
            if agg[key] is not None:
                agg[key] = round(agg[key], 1)

        # Postal codes — return all or top-N depending on ?all_zones=1
        all_zones = request.query_params.get('all_zones') == '1'
        zone_qs = (
            qs.values('code_postal')
            .annotate(count=Count('id'), avg_price=Avg('price'), avg_surface=Avg('surface'))
            .order_by('-count')
        )
        by_postal_raw = list(zone_qs if all_zones else zone_qs[:20])
        by_postal = []
        for zone in by_postal_raw:
            cp = zone['code_postal']
            try:
                cp_str = str(int(cp)) if cp is not None else ''
            except (ValueError, OverflowError):
                cp_str = str(cp)
            by_postal.append({
                'code_postal':  cp_str,
                'count':        zone['count'],
                'avg_price':    round(zone['avg_price'], 0) if zone['avg_price'] else None,
                'avg_surface':  round(zone['avg_surface'], 1) if zone['avg_surface'] else None,
            })

        return Response({**agg, 'by_postal': by_postal})
