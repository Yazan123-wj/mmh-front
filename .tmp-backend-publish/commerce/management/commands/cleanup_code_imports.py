from __future__ import annotations

from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from commerce.models import CodeImportBatch, CodeImportBatchStatus


class Command(BaseCommand):
    help = (
        "Remove stale code-import temp files for abandoned batches. "
        "Never deletes files for PENDING/VALIDATED/PROCESSING batches. Never logs plaintext."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--older-than-hours",
            type=int,
            default=24,
            help="Only clean batches older than this many hours (default 24)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report only; do not delete files or clear paths",
        )

    def handle(self, *args, **options):
        hours = options["older_than_hours"]
        dry = options["dry_run"]
        cutoff = timezone.now() - timedelta(hours=hours)
        terminal = {
            CodeImportBatchStatus.COMPLETED,
            CodeImportBatchStatus.PARTIAL,
            CodeImportBatchStatus.FAILED,
        }
        active = {
            CodeImportBatchStatus.PENDING,
            CodeImportBatchStatus.VALIDATED,
            CodeImportBatchStatus.PROCESSING,
        }

        qs = CodeImportBatch.objects.exclude(pending_file_path="").filter(created_at__lt=cutoff)
        cleaned = 0
        skipped_active = 0
        for batch in qs.iterator():
            if batch.status in active:
                skipped_active += 1
                continue
            if batch.status not in terminal and batch.status not in active:
                # Unknown status — skip for safety
                skipped_active += 1
                continue
            rel = batch.pending_file_path
            abs_path = Path(settings.MEDIA_ROOT) / rel
            if dry:
                self.stdout.write(f"DRY-RUN would remove batch={batch.id} status={batch.status} path={rel}")
            else:
                try:
                    abs_path.unlink(missing_ok=True)
                except OSError as exc:
                    self.stderr.write(f"Could not remove file for batch {batch.id}: {exc}")
                    continue
                batch.pending_file_path = ""
                batch.save(update_fields=["pending_file_path"])
            cleaned += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"{'Would clean' if dry else 'Cleaned'} {cleaned} import file(s); "
                f"skipped {skipped_active} active batch(es)."
            )
        )
