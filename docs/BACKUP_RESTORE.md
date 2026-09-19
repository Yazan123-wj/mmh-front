# Backup and restore

## Database backup

Use standard PostgreSQL tooling against the managed instance, for example:

```bash
pg_dump -Fc -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f mmh_$(date +%Y%m%d).dump
```

Schedule daily (or more frequent) backups via your host’s backup product. Retain multiple generations.

## Restore

```bash
pg_restore --clean --if-exists -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" mmh_YYYYMMDD.dump
```

Prefer restoring into a staging database first. After restore:

1. `python manage.py migrate` (should be no-op if dump matches schema)
2. `GET /api/ready/`
3. Spot-check admin catalog, a sample order, and encrypted code reveal for a known test code (non-production)

## Verification checklist

- [ ] Application starts with production env
- [ ] Migrations applied
- [ ] Health + readiness OK
- [ ] Sample product/media visible
- [ ] Encrypted digital code can be decrypted with the **same** `CODE_ENCRYPTION_KEY`

---

## CODE_ENCRYPTION_KEY — critical

Digital codes are stored as AES-GCM ciphertext. **A database backup alone is not enough.**

If `CODE_ENCRYPTION_KEY` is lost or rotated incorrectly:

- Stored codes become **undecryptable**
- Customers cannot receive working PINs/codes

### Requirements

1. Generate once: `openssl rand -hex 32` (64 hex characters)
2. Store in a secrets manager / offline sealed backup **separate from** the DB dump
3. Never commit the key to git
4. Never log the key
5. Production and staging refuse to start / encrypt without a valid 64-hex key

---

## Media files

If media lives on local disk / volume, back up `MEDIA_ROOT` alongside the database (or use object storage versioning when adopted). See [MEDIA_STORAGE.md](./MEDIA_STORAGE.md).
