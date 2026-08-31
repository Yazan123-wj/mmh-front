import type { AdminRole, PaymentStatus } from "@prisma/client";

export function assertCanCompleteFulfillment(input: {
  paymentStatus: PaymentStatus;
  targetStatus: string;
  role: AdminRole;
  reason: string;
}) {
  if (!input.reason.trim()) throw new Error("A reason is required.");
  if (input.targetStatus !== "COMPLETED") return;
  if (input.paymentStatus === "PAID") return;
  if (input.role !== "SUPER_ADMIN") {
    throw new Error("Unpaid orders cannot be fulfilled.");
  }
}

export function assertSupplierFulfillmentGate(input: {
  isTest: boolean;
  paymentStatus: PaymentStatus;
  productPublished: boolean;
  variantAvailable: boolean;
  mappingActive: boolean;
  alreadySubmitted: boolean;
}) {
  if (input.isTest) return;
  if (input.alreadySubmitted) throw new Error("Order was already submitted to the supplier.");
  if (!input.mappingActive) throw new Error("Product does not have an active supplier mapping.");
  if (!input.productPublished || !input.variantAvailable) throw new Error("Product is not available for fulfillment.");
  if (input.paymentStatus !== "PAID") throw new Error("Unpaid orders cannot be sent to 1Epin.");
  throw new Error("Automatic supplier fulfillment is disabled until payment integration is complete.");
}
