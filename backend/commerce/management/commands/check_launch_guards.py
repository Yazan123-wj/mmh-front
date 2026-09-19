from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Run Django system checks relevant to production launch guards."

    def handle(self, *args, **options):
        call_command("check", verbosity=1)
        self.stdout.write(self.style.SUCCESS("Launch guard checks completed."))
