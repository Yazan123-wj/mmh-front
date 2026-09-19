from __future__ import annotations

import logging
import secrets

from django.conf import settings
from django.db import transaction

from commerce.crypto import encrypt_code, fingerprint_code
from commerce.models import (
    DigitalCode,
    DigitalCodeSource,
    DigitalCodeStatus,
    FulfillmentStatus,
    Order,
    PaymentStatus,
)
from commerce.services.orders import transition_order

logger = logging.getLogger("commerce")


class FulfillmentError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


def _advance_fulfillment(order: Order, target: str, *, actor=None) -> Order:
    """Walk allowed transitions toward target (NOT_STARTED→QUEUED→PROCESSING→COMPLETED)."""
    path = [
        FulfillmentStatus.NOT_STARTED,
        FulfillmentStatus.QUEUED,
        FulfillmentStatus.PROCESSING,
        FulfillmentStatus.COMPLETED,
    ]
    if target not in path:
        raise FulfillmentError(f"Unsupported fulfillment target {target}")
    order.refresh_from_db()
    while order.fulfillment_status != target:
        cur = order.fulfillment_status
        if cur == FulfillmentStatus.COMPLETED:
            break
        if cur not in path:
            raise FulfillmentError(f"Cannot advance from {cur}")
        idx = path.index(cur)
        nxt = path[idx + 1]
        transition_order(order, fulfillment_status=nxt, actor=actor)
        order.refresh_from_db()
        if nxt == target:
            break
    return order


@transaction.atomic
def fulfill_order(order: Order, *, actor=None) -> Order:
    """
    Idempotent fulfillment entry point after payment is PAID.

    - Already COMPLETED → no-op (safe for webhook replay).
    - ALLOW_DEMO_AUTO_PAYMENT → issue encrypted CHECKOUT_DEMO codes, mark COMPLETED.
    - Otherwise → advance to PROCESSING and stop (inventory/supplier assignment TBD).
      Live OneEpin purchase is never performed here.
    """
    order = Order.objects.select_for_update().prefetch_related("items").get(pk=order.pk)

    if order.fulfillment_status == FulfillmentStatus.COMPLETED:
        return order

    if order.payment_status != PaymentStatus.PAID:
        raise FulfillmentError(
            f"Order {order.order_number} is not paid (payment_status={order.payment_status})",
            status=409,
        )

    if getattr(settings, "ALLOW_DEMO_AUTO_PAYMENT", False):
        _advance_fulfillment(order, FulfillmentStatus.PROCESSING, actor=actor)
        _fulfill_demo_codes(order)
        _advance_fulfillment(order, FulfillmentStatus.COMPLETED, actor=actor)
        logger.info("Demo fulfillment completed for order %s", order.order_number)
        return order

    _advance_fulfillment(order, FulfillmentStatus.PROCESSING, actor=actor)
    logger.info(
        "Order %s paid; fulfillment PROCESSING (inventory/supplier assignment not auto-run)",
        order.order_number,
    )
    return order


def _fulfill_demo_codes(order: Order) -> None:
    for item in order.items.all():
        existing = DigitalCode.objects.filter(order_item=item).count()
        need = max(item.quantity - existing, 0)
        for _ in range(need):
            demo_pin = f"MMH-{secrets.token_hex(4).upper()}"
            ciphertext, nonce, masked = encrypt_code(demo_pin)
            DigitalCode.objects.create(
                order_item=item,
                variant=item.variant,
                status=DigitalCodeStatus.DELIVERED,
                source=DigitalCodeSource.CHECKOUT_DEMO,
                code_fingerprint=fingerprint_code(demo_pin),
                ciphertext=ciphertext,
                nonce=nonce,
                masked=masked,
            )
