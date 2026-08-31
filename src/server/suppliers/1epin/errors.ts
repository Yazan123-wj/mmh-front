import { SupplierError } from "@/server/suppliers/types";
import { errorInfo } from "@/server/suppliers/1epin/error-map";
import { OneEpinConfigError } from "@/server/suppliers/1epin/config";

export class OneEpinApiError extends SupplierError {
  constructor(
    message: string,
    public readonly resultCode: string,
    public readonly correlationId: string,
    retryable = false,
    public readonly httpStatus?: number,
  ) {
    super(message, resultCode, retryable);
    this.name = "OneEpinApiError";
  }
}

export function fromResultCode(code: string, correlationId: string, fallback?: string) {
  const info = errorInfo(code);
  return new OneEpinApiError(fallback || info.adminMessage, info.code, correlationId, info.retryable);
}

export { OneEpinConfigError };
