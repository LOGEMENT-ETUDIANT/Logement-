from django.db import migrations


class Migration(migrations.Migration):
    """
    No-op migration: the 'logement' table already exists in Supabase
    and is managed outside Django (managed = False on the model).
    This file only registers the app in django_migrations.
    """
    initial = True
    dependencies = []
    operations = []
