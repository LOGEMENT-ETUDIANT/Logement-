"""
Management command: load listings from the cleaned CSV into the database.

Usage (from backend/ directory):
    python manage.py load_csv
    python manage.py load_csv --path /custom/path/to/data_nettoyer.csv
    python manage.py load_csv --clear   # wipe existing rows first
"""

import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from listings.models import Listing

DEFAULT_CSV = settings.BASE_DIR.parent / 'data' / 'raw' / 'data_nettoyer.csv'
HEADER_FIELDS = ['Name', 'Surface', 'Price', 'Pieces', 'Code_postal', 'Lieu']


def _float_or_none(value):
    try:
        return float(value) if value and value.strip() else None
    except ValueError:
        return None


def _postal(value):
    """Convert '75016.0' or '75016' to '75016'."""
    try:
        return str(int(float(value))) if value and value.strip() else ''
    except (ValueError, OverflowError):
        return ''


class Command(BaseCommand):
    help = 'Import listings from data/raw/data_nettoyer.csv into the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--path',
            type=str,
            default=str(DEFAULT_CSV),
            help='Path to the CSV file (default: data/raw/data_nettoyer.csv)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing listings before importing',
        )

    def handle(self, *args, **options):
        csv_path = Path(options['path'])

        if not csv_path.exists():
            raise CommandError(f'CSV file not found: {csv_path}')

        if options['clear']:
            deleted, _ = Listing.objects.all().delete()
            self.stdout.write(f'  Cleared {deleted} existing rows.')

        objects = []
        skipped = 0

        with open(csv_path, newline='', encoding='utf-8') as fh:
            sample = fh.read(2048)
            fh.seek(0)
            has_header = csv.Sniffer().has_header(sample)

            if has_header:
                reader = csv.DictReader(fh)
            else:
                reader = (
                    dict(zip(HEADER_FIELDS, row))
                    for row in csv.reader(fh)
                    if any(cell.strip() for cell in row)
                )

            for row in reader:
                price = _float_or_none(row.get('Price'))
                surface = _float_or_none(row.get('Surface'))

                if price is None or surface is None:
                    skipped += 1
                    continue

                objects.append(Listing(
                    name        = (row.get('Name') or '').strip(),
                    surface     = surface,
                    price       = price,
                    lieu        = (row.get('Lieu') or '').strip(),
                    chambres    = _float_or_none(row.get('Chambres')) or 0,
                    pieces      = _float_or_none(row.get('Pièces')),
                    etage       = _float_or_none(row.get('Etage')),
                    code_postal = _postal(row.get('Code_postal')),
                ))

        Listing.objects.bulk_create(objects, batch_size=500, ignore_conflicts=True)

        self.stdout.write(
            self.style.SUCCESS(
                f'Done. Imported {len(objects)} listings, skipped {skipped} incomplete rows.'
            )
        )
