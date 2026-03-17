from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("listings", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS logement (
                id BIGSERIAL PRIMARY KEY,
                \"Name\" TEXT NULL,
                \"Surface\" DOUBLE PRECISION NULL,
                \"Price\" DOUBLE PRECISION NULL,
                \"Lieu\" TEXT NULL,
                \"Chambres\" TEXT NULL,
                \"Pièces\" DOUBLE PRECISION NULL,
                \"Etage\" DOUBLE PRECISION NULL,
                \"Code_postal\" DOUBLE PRECISION NULL,
                \"Arrondissement\" DOUBLE PRECISION NULL
            );
            """,
            reverse_sql="""
            DROP TABLE IF EXISTS logement;
            """,
        ),
    ]
