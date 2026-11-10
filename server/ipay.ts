import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_API_BASE_URL = "https://api.payments.ipay.rw";
// The supplied iPay docs omit the exact replay window; allow a conservative, configurable five minutes.
const DEFAULT_WEBHOOK_TOLERANCE_SECONDS = 300;

export type IpayState =
  | "CREATED"
  | "QUEUED"
  | "DISPATCHING"
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "UNKNOWN"
  | "CANCELLED";

export interface IpayWebhookEvent {
  eventId: string;
  eventType: "collection.status_changed";
  occurredAt: string;
  collectionId: string;
  transactionId: string;
  state: IpayState;
  status: number;
  amount: number;
  currency: "RWF";
}

export class IpayRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly outcomeUnknown = false,
  ) {
    super(message);
    this.name = "IpayRequestError";
  }
}

const ALLOWED_TRANSITIONS: Record<IpayState, IpayState[]> = {
  CREATED: ["QUEUED", "FAILED", "CANCELLED"],
  QUEUED: ["DISPATCHING", "FAILED", "CANCELLED"],
  DISPATCHING: ["PENDING", "SUCCEEDED", "FAILED", "UNKNOWN"],
  PENDING: ["SUCCEEDED", "FAILED", "UNKNOWN"],
  UNKNOWN: ["PENDING", "SUCCEEDED", "FAILED"],
  SUCCEEDED: [],
  FAILED: [],
  CANCELLED: [],
};

export function canTransitionIpayState(current: string | null, next: IpayState): boolean {
  if (!current) return next === "CREATED";
  if (current === next) return true;
  return ALLOWED_TRANSITIONS[current as IpayState]?.includes(next) ?? false;
}

function getApiBaseUrl(): string {
  const configured = process.env.IPAY_API_BASE_URL || DEFAULT_API_BASE_URL;
  const url = new URL(configured);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("IPAY_API_BASE_URL must be a plain HTTPS URL");
  }
  return url.toString().replace(/\/+$/, "");
}

function getApiKey(): string {
  const key = process.env.IPAY_API_KEY;
  if (!key) throw new Error("iPay is not configured: IPAY_API_KEY is missing");
  return key;
}

async function requestIpay(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        Accept: "application/json",
        ...init.headers,
      },
    });
    let payload: Record<string, unknown>;
    try {
      payload = await response.json() as Record<string, unknown>;
    } catch {
      throw new IpayRequestError("iPay returned a non-JSON response", response.status, response.ok);
    }
    if (!response.ok) {
      const message = typeof payload.errorMessage === "string"
        ? payload.errorMessage
        : `iPay request failed with HTTP ${response.status}`;
      throw new IpayRequestError(message, response.status);
    }
    return payload;
  } catch (error) {
    if (error instanceof IpayRequestError) throw error;
    throw new IpayRequestError("Could not confirm the iPay request outcome", null);
  } finally {
    clearTimeout(timeout);
  }
}

export async function initiateIpayCollection(input: {
  transactionId: string;
  amount: number;
  phone: string;
  message: string;
}): Promise<void> {
  const callbackUrl = process.env.IPAY_CALLBACK_URL;
  if (callbackUrl && !process.env.IPAY_WEBHOOK_SECRET) {
    throw new Error("iPay webhook signing secret is required when a callback URL is configured");
  }

  const url = new URL(`${getApiBaseUrl()}/initiate-payment`);
  const payload = await requestIpay(url.pathname, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transaction_id: input.transactionId,
      country: "RW",
      currency: "RWF",
      amount: input.amount,
      phone: input.phone,
      payment_mode: "MOBILE",
      message: input.message.slice(0, 140),
      ...(callbackUrl ? { callback_url: callbackUrl } : {}),
    }),
  });

  if (
    payload.transactionId !== input.transactionId ||
    typeof payload.collectionId !== "string" ||
    payload.status !== 201
  ) {
    throw new IpayRequestError("iPay returned an unexpected collection response", 502, true);
  }
}

export async function checkIpayCollection(transactionId: string): Promise<{
  transactionId: string;
  amount: number;
  state: IpayState;
}> {
  const payload = await requestIpay(`/check-status/${encodeURIComponent(transactionId)}`, {
    method: "GET",
  });
  const states: IpayState[] = [
    "CREATED", "QUEUED", "DISPATCHING", "PENDING",
    "SUCCEEDED", "FAILED", "UNKNOWN", "CANCELLED",
  ];
  if (
    payload.transactionId !== transactionId ||
    typeof payload.amount !== "number" ||
    !Number.isInteger(payload.amount) ||
    typeof payload.state !== "string" ||
    !states.includes(payload.state as IpayState)
  ) {
    throw new IpayRequestError("iPay returned an invalid collection status response", 502);
  }
  return {
    transactionId,
    amount: payload.amount,
    state: payload.state as IpayState,
  };
}

export function verifyIpayWebhookSignature(
  timestamp: string,
  signature: string,
  rawBody: Buffer,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const secret = process.env.IPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("iPay webhook signing secret is not configured");

  if (!/^\d{10}$/.test(timestamp) || !/^v1=[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  const tolerance = Number(
    process.env.IPAY_WEBHOOK_TOLERANCE_SECONDS || DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
  );
  if (!Number.isInteger(tolerance) || tolerance < 30 || tolerance > 3600) {
    throw new Error("IPAY_WEBHOOK_TOLERANCE_SECONDS must be an integer from 30 to 3600");
  }

  const timestampSeconds = Number(timestamp);
  if (Math.abs(nowSeconds - timestampSeconds) > tolerance) return false;

  const expected = createHmac("sha256", secret)
    .update(timestamp)
    .update(".")
    .update(rawBody)
    .digest();
  const received = Buffer.from(signature.slice(3), "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
