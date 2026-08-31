export const ONE_EPIN_CODES = [
  "00",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
] as const;

export type OneEpinResultCode = (typeof ONE_EPIN_CODES)[number];

export interface OneEpinErrorInfo {
  code: OneEpinResultCode;
  name: string;
  adminMessage: string;
  customerMessage: string;
  retryable: boolean;
  manualReview: boolean;
  severity: "info" | "warning" | "error";
  action: string;
}

export const ERROR_MAP: Record<OneEpinResultCode, OneEpinErrorInfo> = {
  "00": {
    code: "00",
    name: "SUCCESS",
    adminMessage: "1Epin accepted the request.",
    customerMessage: "Your order is being processed.",
    retryable: false,
    manualReview: false,
    severity: "info",
    action: "Continue with reconciliation if this is an order.",
  },
  "01": {
    code: "01",
    name: "MISSING_PARAMETER",
    adminMessage: "A required 1Epin parameter was missing.",
    customerMessage: "This product cannot be ordered right now.",
    retryable: false,
    manualReview: true,
    severity: "error",
    action: "Fix the request payload and retry manually.",
  },
  "02": {
    code: "02",
    name: "UNAUTHORIZED_IP",
    adminMessage: "1Epin rejected this server IP. A static egress IP must be allowlisted.",
    customerMessage: "Digital delivery is temporarily unavailable.",
    retryable: false,
    manualReview: true,
    severity: "error",
    action: "Register the production static IP on the 1Epin API Settings page.",
  },
  "03": {
    code: "03",
    name: "INVALID_USER",
    adminMessage: "1Epin credentials were rejected.",
    customerMessage: "Digital delivery is temporarily unavailable.",
    retryable: false,
    manualReview: true,
    severity: "error",
    action: "Rotate test credentials in environment variables. Never store them in the database.",
  },
  "04": {
    code: "04",
    name: "NO_BALANCE",
    adminMessage: "The 1Epin wallet has no remaining balance.",
    customerMessage: "This product is temporarily unavailable.",
    retryable: false,
    manualReview: true,
    severity: "error",
    action: "Top up the 1Epin wallet before sending more orders.",
  },
  "05": {
    code: "05",
    name: "CATEGORY_NOT_FOUND",
    adminMessage: "The supplier category was not found.",
    customerMessage: "This product is unavailable.",
    retryable: false,
    manualReview: true,
    severity: "warning",
    action: "Re-sync categories and review mappings.",
  },
  "06": {
    code: "06",
    name: "PRODUCT_NOT_FOUND",
    adminMessage: "The supplier product was not found.",
    customerMessage: "This product is unavailable.",
    retryable: false,
    manualReview: true,
    severity: "warning",
    action: "Mark the mapping for review and re-sync products.",
  },
  "07": {
    code: "07",
    name: "REGISTERED_ORDER_NUMBER",
    adminMessage: "This supplier order number already exists. Reconcile instead of submitting a new number.",
    customerMessage: "Your order is being processed.",
    retryable: false,
    manualReview: false,
    severity: "warning",
    action: "Call checkOrder with the same order number and reconcile.",
  },
  "08": {
    code: "08",
    name: "ORDER_NOT_FOUND",
    adminMessage: "1Epin has no order with this number.",
    customerMessage: "Your order is being reviewed.",
    retryable: false,
    manualReview: true,
    severity: "warning",
    action: "Only resubmit if this was never accepted. Keep the same order number.",
  },
  "09": {
    code: "09",
    name: "USER_PARAMETER_REQUIRED",
    adminMessage: "This top-up product requires a player/user field.",
    customerMessage: "A player ID is required for this product.",
    retryable: false,
    manualReview: false,
    severity: "warning",
    action: "Collect the required customer field and retry the same order number only if checkOrder returns 08.",
  },
  "10": {
    code: "10",
    name: "AGREEMENT_WINDOW",
    adminMessage: "1Epin is in the 23:45–00:00 agreement maintenance window.",
    customerMessage: "This product is briefly unavailable. Try again shortly.",
    retryable: true,
    manualReview: false,
    severity: "warning",
    action: "Wait until after 00:00 and retry read operations. Do not blindly retry addOrder.",
  },
  "11": {
    code: "11",
    name: "PRODUCT_UNAVAILABLE_API",
    adminMessage: "This product cannot be sold through the API.",
    customerMessage: "This product is unavailable.",
    retryable: false,
    manualReview: true,
    severity: "warning",
    action: "Mark the supplier product unavailable and keep the MMH product unpublished or remapped.",
  },
  "12": {
    code: "12",
    name: "BAREM_REQUIRED",
    adminMessage: "A valid barem amount is required for this tiered product.",
    customerMessage: "This denomination cannot be ordered as configured.",
    retryable: false,
    manualReview: true,
    severity: "warning",
    action: "Send barem only for tiered products.",
  },
  "13": {
    code: "13",
    name: "BAREM_OUT_OF_RANGE",
    adminMessage: "The barem amount is outside the allowed min/max range.",
    customerMessage: "This denomination is not available.",
    retryable: false,
    manualReview: true,
    severity: "warning",
    action: "Adjust the mapped denomination to a supported barem.",
  },
  "14": {
    code: "14",
    name: "DECIMAL_AMOUNT_NOT_ALLOWED",
    adminMessage: "This product does not allow decimal amounts.",
    customerMessage: "This denomination is not available.",
    retryable: false,
    manualReview: true,
    severity: "warning",
    action: "Send a whole-number barem or quantity.",
  },
  "15": {
    code: "15",
    name: "BAREM_NOT_ACCEPTED",
    adminMessage: "This standard product does not accept a barem parameter.",
    customerMessage: "This product cannot be ordered right now.",
    retryable: false,
    manualReview: false,
    severity: "warning",
    action: "Omit barem and resubmit only after checkOrder confirms the order does not exist.",
  },
  "16": {
    code: "16",
    name: "MAX_QUANTITY_EXCEEDED",
    adminMessage: "Quantity exceeds the 1Epin maximum for this product.",
    customerMessage: "Reduce the quantity and try again.",
    retryable: false,
    manualReview: false,
    severity: "warning",
    action: "Clamp quantity to the supplier maximum.",
  },
  "17": {
    code: "17",
    name: "MIN_QUANTITY_NOT_MET",
    adminMessage: "Quantity is below the 1Epin minimum for this product.",
    customerMessage: "Increase the quantity and try again.",
    retryable: false,
    manualReview: false,
    severity: "warning",
    action: "Clamp quantity to the supplier minimum.",
  },
};

export function errorInfo(code: string | null | undefined): OneEpinErrorInfo {
  const key = (code ?? "").padStart(2, "0") as OneEpinResultCode;
  if (key in ERROR_MAP) return ERROR_MAP[key];
  return {
    code: "01",
    name: "UNDOCUMENTED",
    adminMessage: `1Epin returned an undocumented result code (${code ?? "none"}).`,
    customerMessage: "Digital delivery is temporarily unavailable.",
    retryable: false,
    manualReview: true,
    severity: "error",
    action: "Preserve the correlation ID and inspect the redacted supplier log.",
  };
}

export function isRetryableHttp(status: number) {
  return status === 429 || status >= 500;
}
