export type GatewayErrorCode =
  | "AUTH_FAILED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "REQUEST_FAILED"
  | "RESPONSE_INVALID"
  | "NOT_CONFIGURED";

export class GatewayApiError extends Error {
  readonly code: GatewayErrorCode;
  readonly httpStatus: number | undefined;

  constructor(code: GatewayErrorCode, message: string, httpStatus?: number) {
    super(message);
    this.name = "GatewayApiError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export function gatewayErrorToLegacyCode(e: GatewayApiError): string {
  if (e.code === "AUTH_FAILED" || e.code === "FORBIDDEN") return "GATEWAY_AUTH_FAILED";
  if (e.code === "NOT_CONFIGURED") return "GATEWAY_NOT_CONFIGURED";
  if (e.code === "RESPONSE_INVALID") return "GATEWAY_RESPONSE_INVALID";
  if (e.code === "RATE_LIMITED") return "GATEWAY_RATE_LIMITED";
  return "GATEWAY_REQUEST_FAILED";
}
