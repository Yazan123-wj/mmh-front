from __future__ import annotations

import base64
import hashlib
import os
import re
from hashlib import sha256

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from django.conf import settings


class CodeCryptoError(RuntimeError):
    pass


def _key_bytes() -> bytes:
    raw = (settings.CODE_ENCRYPTION_KEY or "").strip()
    if len(raw) == 64:
        try:
            return bytes.fromhex(raw)
        except ValueError as exc:
            raise CodeCryptoError("CODE_ENCRYPTION_KEY must be 64 hex chars") from exc
    if getattr(settings, "IS_PRODUCTION", False) or getattr(settings, "IS_STAGING", False):
        raise CodeCryptoError(
            "CODE_ENCRYPTION_KEY must be a 64-character hex string "
            "(openssl rand -hex 32). Dev SECRET_KEY fallback is disabled outside development."
        )
    # Dev fallback derived from SECRET_KEY — development only
    return sha256(settings.SECRET_KEY.encode("utf-8")).digest()

def normalize_code_identity(code: str, pin: str | None = None) -> str:
    """Canonical identity used for fingerprints (not reversible to plaintext display)."""
    cleaned = re.sub(r"\s+", "", (code or "").strip().upper())
    pin_part = re.sub(r"\s+", "", (pin or "").strip())
    if pin_part:
        return f"{cleaned}|{pin_part}"
    return cleaned


def fingerprint_code(code: str, pin: str | None = None) -> str:
    identity = normalize_code_identity(code, pin)
    if not identity:
        raise CodeCryptoError("Cannot fingerprint empty code")
    return hashlib.sha256(identity.encode("utf-8")).hexdigest()


def encrypt_code(plaintext: str) -> tuple[str, str, str]:
    key = _key_bytes()
    nonce = os.urandom(12)
    aes = AESGCM(key)
    ciphertext = aes.encrypt(nonce, plaintext.encode("utf-8"), None)
    masked = mask_code(plaintext)
    return base64.b64encode(ciphertext).decode("ascii"), base64.b64encode(nonce).decode("ascii"), masked


def decrypt_code(ciphertext_b64: str, nonce_b64: str) -> str:
    key = _key_bytes()
    aes = AESGCM(key)
    plaintext = aes.decrypt(base64.b64decode(nonce_b64), base64.b64decode(ciphertext_b64), None)
    return plaintext.decode("utf-8")


def mask_code(value: str) -> str:
    cleaned = (value or "").strip()
    if len(cleaned) <= 4:
        return "****"
    if len(cleaned) <= 8:
        return f"{cleaned[:2]}{'•' * (len(cleaned) - 4)}{cleaned[-2:]}"
    return f"{cleaned[:4]}{'•' * min(8, len(cleaned) - 8)}{cleaned[-4:]}"


# Back-compat alias
_mask = mask_code
