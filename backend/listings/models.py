from django.db import models


class Listing(models.Model):
    name           = models.TextField(db_column='Name', blank=True, null=True)
    surface        = models.FloatField(db_column='Surface', blank=True, null=True)
    price          = models.FloatField(db_column='Price', blank=True, null=True)
    lieu           = models.TextField(db_column='Lieu', blank=True, null=True)
    chambres       = models.TextField(db_column='Chambres', blank=True, null=True)
    pieces         = models.FloatField(db_column='Pièces', blank=True, null=True)
    etage          = models.FloatField(db_column='Etage', blank=True, null=True)
    code_postal    = models.FloatField(db_column='Code_postal', blank=True, null=True)
    arrondissement = models.FloatField(db_column='Arrondissement', blank=True, null=True)

    class Meta:
        managed = False       # Django will never create / alter / drop this table
        db_table = 'logement' # points at the existing Supabase table
        ordering = ['price']

    def __str__(self):
        return f'{self.lieu} — {self.price} €'
