# Generated manually for production query indexes

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("commerce", "0003_code_import_inventory"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["email"], name="commerce_or_email_idx"),
        ),
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["payment_status"], name="commerce_or_pay_st_idx"),
        ),
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["fulfillment_status"], name="commerce_or_ful_st_idx"),
        ),
        migrations.AddIndex(
            model_name="digitalcode",
            index=models.Index(fields=["status"], name="commerce_dc_status_idx"),
        ),
        migrations.AlterField(
            model_name="payment",
            name="external_ref",
            field=models.CharField(blank=True, db_index=True, max_length=255),
        ),
    ]
