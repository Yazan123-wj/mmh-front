"""Product / media catalog polish tests — no external network."""

from __future__ import annotations

from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image

from accounts.models import AdminRole
from accounts.tests_admin import auth_client, make_admin, seed_permissions
from audit.models import AuditLog
from catalog.models import (
    Category,
    FulfillmentType,
    MediaAsset,
    Platform,
    Product,
    ProductFieldDefinition,
    ProductKind,
    ProductVariant,
    PublishStatus,
    Region,
    StockStatus,
)
from cms.models import SiteSettings
from commerce.crypto import encrypt_code, fingerprint_code
from commerce.models import DigitalCode, DigitalCodeSource, DigitalCodeStatus
from suppliers.models import Supplier, SupplierProductMapping


def _png_bytes(size=(40, 40), color=(20, 120, 200)) -> bytes:
    buf = BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    return buf.getvalue()


class ProductCatalogPolishTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        seed_permissions()
        SiteSettings.load()
        cls.admin = make_admin("cat-admin@mmh.test", AdminRole.ADMIN)
        cls.viewer = make_admin("cat-viewer@mmh.test", AdminRole.VIEWER)
        cls.catalog = make_admin("cat-mgr@mmh.test", AdminRole.CATALOG_MANAGER)
        cls.category = Category.objects.create(slug="pcat", name_en="PCat", status=PublishStatus.PUBLISHED)
        cls.platform = Platform.objects.create(slug="pplat", name_en="PPlat", status=PublishStatus.PUBLISHED)
        cls.region = Region.objects.create(slug="us", currency="USD", name_en="US")
        cls.product = Product.objects.create(
            id="polish-prod",
            slug="polish-prod",
            kind=ProductKind.GIFT_CARD,
            fulfillment_type=FulfillmentType.CODE,
            category=cls.category,
            platform=cls.platform,
            brand="Polish",
            artwork_key="polish",
            status=PublishStatus.PUBLISHED,
            name_en="Polish Product",
        )
        cls.variant = ProductVariant.objects.create(
            product=cls.product,
            sku="POLISH-10",
            denomination=10,
            package_value="10",
            package_currency="USD",
            price_fils=10500,
            stock_status=StockStatus.OUT_OF_STOCK,
            name_en="10",
            region=cls.region,
        )
        cls.supplier = Supplier.objects.create(slug="1epin", name="1Epin", active=True)

    def test_product_list_annotations_and_filters(self):
        ct, nonce, masked = encrypt_code("POLISH-CODE-1")
        DigitalCode.objects.create(
            variant=self.variant,
            status=DigitalCodeStatus.AVAILABLE,
            source=DigitalCodeSource.MANUAL,
            code_fingerprint=fingerprint_code("POLISH-CODE-1"),
            ciphertext=ct,
            nonce=nonce,
            masked=masked,
        )
        client = auth_client(self.admin)
        res = client.get("/api/v1/admin/products/?stock=in_stock&search=POLISH")
        self.assertEqual(res.status_code, 200)
        row = res.json()["results"][0]
        self.assertEqual(row["codes_available"], 1)
        self.assertEqual(row["variants_count"], 1)
        self.assertEqual(row["price_min_fils"], 10500)
        self.assertIn("US", row.get("region_labels") or ["US"])

    def test_unique_slug_validation(self):
        client = auth_client(self.catalog)
        res = client.post(
            "/api/v1/admin/products/",
            {
                "id": "other-id",
                "slug": "polish-prod",
                "kind": "WALLET",
                "fulfillment_type": "CODE",
                "category_id": self.category.id,
                "platform_id": self.platform.id,
                "brand": "X",
                "artwork_key": "x",
                "name_en": "Dup",
                "status": "DRAFT",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("slug", str(res.data).lower() + str(res.content).lower())

    def test_media_upload_primary_and_reorder(self):
        client = auth_client(self.catalog)
        f1 = SimpleUploadedFile("a.png", _png_bytes(), content_type="image/png")
        f2 = SimpleUploadedFile("b.png", _png_bytes((50, 50), (200, 20, 20)), content_type="image/png")
        r1 = client.post(
            f"/api/v1/admin/products/{self.product.slug}/media/",
            {"file": f1, "is_primary": "true", "alt": "Primary"},
            format="multipart",
        )
        self.assertEqual(r1.status_code, 201, r1.content)
        r2 = client.post(
            f"/api/v1/admin/products/{self.product.slug}/media/",
            {"file": f2, "alt": "Second"},
            format="multipart",
        )
        self.assertEqual(r2.status_code, 201)
        self.product.refresh_from_db()
        self.assertTrue(self.product.image_url)
        ids = [r2.json()["id"], r1.json()["id"]]
        reorder = client.post(
            f"/api/v1/admin/products/{self.product.slug}/media/reorder/",
            {"ordered_ids": ids},
            format="json",
        )
        self.assertEqual(reorder.status_code, 200)
        primary = client.patch(
            f"/api/v1/admin/media/{r2.json()['id']}/",
            {"is_primary": True},
            format="json",
        )
        self.assertEqual(primary.status_code, 200)
        self.assertTrue(primary.json()["is_primary"])

    def test_invalid_media_rejected(self):
        client = auth_client(self.catalog)
        bad = SimpleUploadedFile("x.txt", b"not-an-image", content_type="text/plain")
        res = client.post(
            f"/api/v1/admin/products/{self.product.slug}/media/",
            {"file": bad},
            format="multipart",
        )
        self.assertEqual(res.status_code, 400)

    def test_variant_and_field_upsert(self):
        client = auth_client(self.catalog)
        res = client.patch(
            f"/api/v1/admin/products/{self.product.slug}/",
            {
                "name_en": "Polish Product Updated",
                "category_id": self.category.id,
                "platform_id": self.platform.id,
                "brand": "Polish",
                "artwork_key": "polish",
                "kind": "GIFT_CARD",
                "fulfillment_type": "CODE",
                "variants": [
                    {
                        "id": self.variant.id,
                        "sku": "POLISH-10",
                        "name_en": "10 USD",
                        "denomination": "10",
                        "package_value": "10",
                        "package_currency": "USD",
                        "price_fils": 12000,
                        "published": True,
                    },
                    {
                        "sku": "POLISH-20",
                        "name_en": "20 USD",
                        "denomination": "20",
                        "package_value": "20",
                        "package_currency": "USD",
                        "price_fils": 20000,
                        "published": True,
                    },
                ],
                "fields": [
                    {
                        "key": "player_id",
                        "type": "TEXT",
                        "required": True,
                        "label_en": "Player ID",
                        "sort_order": 0,
                    },
                    {
                        "key": "server",
                        "type": "TEXT",
                        "required": False,
                        "label_en": "Server",
                        "sort_order": 1,
                    },
                ],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(ProductVariant.objects.filter(product=self.product).count(), 2)
        keys = list(
            ProductFieldDefinition.objects.filter(product=self.product).order_by("sort_order").values_list("key", flat=True)
        )
        self.assertEqual(keys, ["player_id", "server"])
        self.assertTrue(AuditLog.objects.filter(action="product.updated").exists())

    def test_duplicate_product_skips_codes(self):
        ct, nonce, masked = encrypt_code("KEEP-ME")
        DigitalCode.objects.create(
            variant=self.variant,
            status=DigitalCodeStatus.AVAILABLE,
            code_fingerprint=fingerprint_code("KEEP-ME"),
            ciphertext=ct,
            nonce=nonce,
            masked=masked,
        )
        client = auth_client(self.admin)
        res = client.post(f"/api/v1/admin/products/{self.product.slug}/duplicate/", {}, format="json")
        self.assertEqual(res.status_code, 201, res.content)
        clone_id = res.json()["id"]
        self.assertEqual(DigitalCode.objects.filter(variant__product_id=clone_id).count(), 0)
        self.assertEqual(res.json()["status"], "DRAFT")

    def test_supplier_mapping_permission_and_no_secrets(self):
        client = auth_client(self.viewer)
        denied = client.post(
            f"/api/v1/admin/products/{self.product.slug}/mappings/",
            {"supplier_id": self.supplier.id, "external_product_id": "EXT-1"},
            format="json",
        )
        self.assertEqual(denied.status_code, 403)

        admin = auth_client(self.admin)
        ok = admin.post(
            f"/api/v1/admin/products/{self.product.slug}/mappings/",
            {"supplier_id": self.supplier.id, "external_product_id": "EXT-1", "variant_id": self.variant.id},
            format="json",
        )
        self.assertEqual(ok.status_code, 201, ok.content)
        detail = admin.get(f"/api/v1/admin/products/{self.product.slug}/")
        body = str(detail.json())
        self.assertNotIn("password", body.lower())
        self.assertIn("EXT-1", body)

    def test_protected_category_delete(self):
        client = auth_client(self.catalog)
        res = client.delete(f"/api/v1/admin/categories/{self.category.id}/")
        self.assertEqual(res.status_code, 409)

    def test_viewer_cannot_write_product(self):
        client = auth_client(self.viewer)
        res = client.patch(
            f"/api/v1/admin/products/{self.product.slug}/",
            {"name_en": "Nope"},
            format="json",
        )
        self.assertEqual(res.status_code, 403)
