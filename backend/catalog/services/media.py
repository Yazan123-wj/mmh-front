from __future__ import annotations

import io
import uuid
from typing import BinaryIO

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction

from catalog.models import MediaAsset, Product

MAX_BYTES = 5 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_EDGE_PX = 2000


class MediaUploadError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


def sniff_image(head: bytes) -> str | None:
    if head.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if head[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "image/webp"
    return None


def _ext_for(content_type: str) -> str:
    return {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }.get(content_type, ".bin")


def _maybe_downscale(raw: bytes, content_type: str) -> tuple[bytes, str]:
    """Downscale huge images with Pillow; preserve format when practical."""
    try:
        from PIL import Image
    except ImportError:
        return raw, content_type

    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception as exc:
        raise MediaUploadError("Invalid or corrupt image file") from exc

    # SVG / exotic formats rejected earlier; GIF may be animated — skip aggressive rewrite
    if content_type == "image/gif":
        return raw, content_type

    w, h = img.size
    if max(w, h) <= MAX_EDGE_PX:
        return raw, content_type

    img.thumbnail((MAX_EDGE_PX, MAX_EDGE_PX), Image.Resampling.LANCZOS)
    out = io.BytesIO()
    if content_type == "image/jpeg":
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        img.save(out, format="JPEG", quality=88, optimize=True)
        return out.getvalue(), "image/jpeg"
    if content_type == "image/png":
        img.save(out, format="PNG", optimize=True)
        return out.getvalue(), "image/png"
    if content_type == "image/webp":
        img.save(out, format="WEBP", quality=88)
        return out.getvalue(), "image/webp"
    return raw, content_type


def save_upload(file_obj: BinaryIO, filename: str = "") -> tuple[str, str, str]:
    """Validate and store upload. Returns (storage_path, url, mime_type)."""
    name = (filename or getattr(file_obj, "name", "") or "").lower()
    size = getattr(file_obj, "size", None)
    if size is not None and size > MAX_BYTES:
        raise MediaUploadError(f"File exceeds {MAX_BYTES // (1024 * 1024)}MB limit")
    if ".." in name or "/" in name or "\\" in name:
        raise MediaUploadError("Invalid file name")

    head = file_obj.read(16)
    file_obj.seek(0)
    sniffed = sniff_image(head)
    content_type = sniffed or (getattr(file_obj, "content_type", "") or "")
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise MediaUploadError("Only JPEG, PNG, WEBP, or GIF images are allowed")

    allowed_ext = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    ext_from_name = "." + name.rsplit(".", 1)[-1] if "." in name else ""
    if ext_from_name and ext_from_name not in allowed_ext:
        raise MediaUploadError("File extension not allowed")

    raw = file_obj.read()
    if len(raw) > MAX_BYTES:
        raise MediaUploadError(f"File exceeds {MAX_BYTES // (1024 * 1024)}MB limit")
    if not raw:
        raise MediaUploadError("File is empty")

    raw, content_type = _maybe_downscale(raw, content_type)
    ext = _ext_for(content_type)
    path = f"uploads/{uuid.uuid4().hex}{ext}"
    saved = default_storage.save(path, ContentFile(raw))
    url = default_storage.url(saved)
    return saved, url, content_type


def absolute_media_url(request, url: str) -> str:
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if request is None:
        return url
    return request.build_absolute_uri(url)


@transaction.atomic
def attach_product_media(
    *,
    product: Product,
    storage_path: str,
    url: str,
    mime_type: str,
    alt: str = "",
    make_primary: bool = False,
) -> MediaAsset:
    next_order = (
        MediaAsset.objects.filter(product=product).order_by("-sort_order").values_list("sort_order", flat=True).first()
        or 0
    ) + 1
    is_first = not MediaAsset.objects.filter(product=product).exists()
    primary = make_primary or is_first
    if primary:
        MediaAsset.objects.filter(product=product, is_primary=True).update(is_primary=False)
    asset = MediaAsset.objects.create(
        key=f"product-{product.id}-{uuid.uuid4().hex[:12]}",
        url=url,
        alt=alt or "",
        mime_type=mime_type,
        product=product,
        storage_path=storage_path,
        sort_order=next_order,
        is_primary=primary,
    )
    if primary:
        product.image_url = url
        if not product.artwork_key:
            product.artwork_key = asset.key[:64]
        product.save(update_fields=["image_url", "artwork_key", "updated_at"])
    return asset


@transaction.atomic
def set_primary_media(asset: MediaAsset) -> MediaAsset:
    if not asset.product_id:
        raise MediaUploadError("Media is not attached to a product")
    MediaAsset.objects.filter(product_id=asset.product_id, is_primary=True).update(is_primary=False)
    asset.is_primary = True
    asset.save(update_fields=["is_primary"])
    Product.objects.filter(pk=asset.product_id).update(image_url=asset.url)
    return asset


@transaction.atomic
def reorder_media(product: Product, ordered_ids: list[int]) -> list[MediaAsset]:
    assets = {a.id: a for a in MediaAsset.objects.filter(product=product, id__in=ordered_ids)}
    if len(assets) != len(ordered_ids):
        raise MediaUploadError("One or more media ids are invalid for this product")
    for idx, mid in enumerate(ordered_ids):
        MediaAsset.objects.filter(pk=mid).update(sort_order=idx)
    return list(MediaAsset.objects.filter(product=product))


def delete_media(asset: MediaAsset) -> None:
    product = asset.product
    path = asset.storage_path
    was_primary = asset.is_primary
    asset_id = asset.id
    asset.delete()
    # Cleanup file only if no other asset references the same path
    if path and not MediaAsset.objects.filter(storage_path=path).exclude(pk=asset_id).exists():
        try:
            if default_storage.exists(path):
                default_storage.delete(path)
        except Exception:
            pass
    if product and was_primary:
        nxt = MediaAsset.objects.filter(product=product).order_by("sort_order", "id").first()
        if nxt:
            set_primary_media(nxt)
        else:
            Product.objects.filter(pk=product.pk).update(image_url="")
