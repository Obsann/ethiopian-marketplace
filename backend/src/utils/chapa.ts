import crypto from 'crypto';

const CHAPA_BASE = 'https://api.chapa.co/v1';
/** Chapa rejects customization.title longer than 16 characters. */
const CHECKOUT_TITLE = 'ET Marketplace';

function chapaSecret(): string | undefined {
  const secret = process.env.CHAPA_SECRET_KEY?.trim();
  return secret || undefined;
}

/**
 * Placeholder / example keys (e.g. CHASECK_TEST_xxx) must not call Chapa.
 * Dashboard test secrets are `CHASECK_TEST-…` (hyphen) or `CHASECK_TEST_…`.
 */
export function isPlaceholderChapaKey(secret = chapaSecret()): boolean {
  if (!secret) return true;
  if (secret.toLowerCase().includes('xxx')) return true;
  if (secret.length < 20) return true;
  return false;
}

/** True when a real Chapa test or live secret is set (not the xxx placeholder). */
export function isChapaConfigured(secret = chapaSecret()): boolean {
  return Boolean(secret && !isPlaceholderChapaKey(secret));
}

/** Chapa test/sandbox secret: CHASECK_TEST- (dashboard) or CHASECK_TEST_ (docs). */
export function isChapaTestKey(secret = chapaSecret()): boolean {
  return Boolean(secret && /^CHASECK_TEST[-_]/i.test(secret) && !isPlaceholderChapaKey(secret));
}

/** Live production secret (CHASECK- / CHASECK_), not a TEST key. */
export function isLiveChapa(secret = chapaSecret()): boolean {
  return isChapaConfigured(secret) && !isChapaTestKey(secret);
}

/**
 * Chapa initialize requires 10 digits: 09xxxxxxxx or 07xxxxxxxx.
 * Accepts +2519…, 002519…, 2519…, 09…, and 9… forms.
 */
export function toChapaPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (/^0[97]\d{8}$/.test(digits)) return digits;
  if (/^251[97]\d{8}$/.test(digits)) return `0${digits.slice(3)}`;
  if (/^[97]\d{8}$/.test(digits)) return `0${digits}`;
  return undefined;
}

const DEMO_CHAPA_EMAIL_HOSTS = new Set(['buyer.et', 'seller.et', 'marketplace.et']);

/**
 * Chapa’s validator rejects some demo TLDs (e.g. sara@buyer.et → validation.email).
 * Keep the real account email in our DB; only the Chapa payload is rewritten.
 */
export function toChapaEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf('@');
  if (at < 1) return trimmed;
  const local = trimmed.slice(0, at).replace(/[^a-z0-9._+-]/gi, '') || 'buyer';
  const host = trimmed.slice(at + 1).toLowerCase();
  if (DEMO_CHAPA_EMAIL_HOSTS.has(host)) return `${local}@gmail.com`;
  return trimmed;
}

function flattenChapaParts(value: unknown, prefix?: string, into: string[] = []): string[] {
  if (value == null) return into;
  if (typeof value === 'string') {
    const t = value.trim();
    if (t && t !== '[object Object]') into.push(prefix ? `${prefix}: ${t}` : t);
    return into;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    into.push(prefix ? `${prefix}: ${String(value)}` : String(value));
    return into;
  }
  if (Array.isArray(value)) {
    const strings = value.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
    if (strings.length) into.push(prefix ? `${prefix}: ${strings.join(', ')}` : strings.join(', '));
    else value.forEach((v) => flattenChapaParts(v, prefix, into));
    return into;
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      flattenChapaParts(v, prefix ? `${prefix}.${k}` : k, into);
    }
  }
  return into;
}

/** Chapa often returns `message` as an object of field errors, not a string. */
export function stringifyChapaError(json: unknown, fallback = 'Chapa request failed'): string {
  if (json == null) return fallback;
  if (typeof json === 'string') {
    const t = json.trim();
    return t && t !== '[object Object]' ? t : fallback;
  }
  if (typeof json !== 'object') return fallback;

  const obj = json as Record<string, unknown>;
  const parts = flattenChapaParts(obj.message);
  const data = obj.data;
  if (data && typeof data === 'object' && !Array.isArray(data) && !('checkout_url' in data)) {
    flattenChapaParts(data, undefined, parts);
  }
  const unique = [...new Set(parts.map((p) => p.trim()).filter(Boolean))];
  if (unique.length) return unique.join('; ');

  try {
    const serialized = JSON.stringify(obj);
    if (serialized && serialized !== '{}' && serialized !== 'null') {
      return serialized.length > 400 ? `${serialized.slice(0, 400)}…` : serialized;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function firstString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0].trim();
  return '';
}

/** Chapa callback/return uses trx_ref; initialize uses tx_ref. */
export function chapaTxRefFrom(source: Record<string, unknown>): string {
  return firstString(source.trx_ref || source.tx_ref);
}

function headerValue(
  headers: Record<string, unknown>,
  name: string
): string | undefined {
  const direct = headers[name];
  if (typeof direct === 'string' && direct) return direct;
  const lower = headers[name.toLowerCase()];
  if (typeof lower === 'string' && lower) return lower;
  return undefined;
}

export function timingSafeEqualHex(expectedHex: string, provided: string): boolean {
  try {
    const expected = Buffer.from(expectedHex, 'hex');
    const got = Buffer.from(provided, 'hex');
    if (expected.length === 0 || expected.length !== got.length) return false;
    return crypto.timingSafeEqual(expected, got);
  } catch {
    return false;
  }
}

/**
 * Chapa sends HMAC-SHA256 of the raw payload on x-chapa-signature and/or
 * chapa-signature. Both must bind to the request body.
 */
export function verifyChapaWebhook(opts: {
  rawBody?: Buffer | string;
  headers: Record<string, unknown>;
  webhookSecret?: string;
}): boolean {
  const secret = opts.webhookSecret;
  if (!secret) return false;

  const raw =
    opts.rawBody === undefined
      ? ''
      : typeof opts.rawBody === 'string'
        ? opts.rawBody
        : opts.rawBody.toString('utf8');

  const xSig = headerValue(opts.headers, 'x-chapa-signature');
  const chapaSig = headerValue(opts.headers, 'chapa-signature');
  if (!xSig && !chapaSig) return false;

  const payloadHash = crypto.createHmac('sha256', secret).update(raw).digest('hex');

  const xOk = xSig ? timingSafeEqualHex(payloadHash, xSig) : false;
  const chapaOk = chapaSig ? timingSafeEqualHex(payloadHash, chapaSig) : false;

  return xOk || chapaOk;
}

function clipName(value: string, fallback: string): string {
  const cleaned = value.replace(/[^\p{L}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim();
  const clipped = (cleaned || fallback).slice(0, 50);
  return clipped || fallback;
}

async function parseChapaJson(res: Response): Promise<unknown> {
  const raw = await res.text();
  if (!raw.trim()) return { message: `Empty response (${res.status})` };
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return { message: raw.slice(0, 200) };
  }
}

async function postChapaInitialize(
  secret: string,
  body: Record<string, unknown>
): Promise<{ checkout_url: string }> {
  const res = await fetch(`${CHAPA_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await parseChapaJson(res);
  const parsed = json as { status?: string; data?: { checkout_url?: string } };
  if (!res.ok || parsed.status !== 'success' || !parsed.data?.checkout_url) {
    throw new Error(stringifyChapaError(json, `Chapa initialize failed (${res.status})`));
  }
  return { checkout_url: parsed.data.checkout_url };
}

export async function chapaInitialize(payload: {
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  phone_number?: string;
}): Promise<{ checkout_url: string }> {
  const secret = chapaSecret();
  if (!isChapaConfigured(secret) || !secret) {
    return {
      checkout_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments/mock-checkout?tx_ref=${payload.tx_ref}`,
    };
  }

  const body: Record<string, unknown> = {
    amount: String(payload.amount),
    currency: payload.currency,
    email: toChapaEmail(payload.email),
    first_name: clipName(payload.first_name, 'Buyer'),
    last_name: clipName(payload.last_name, 'Buyer'),
    tx_ref: payload.tx_ref,
    callback_url: payload.callback_url,
    return_url: payload.return_url,
    customization: {
      title: CHECKOUT_TITLE,
      description: 'Second-hand marketplace checkout',
    },
  };
  const phone = payload.phone_number ? toChapaPhone(payload.phone_number) : undefined;
  if (phone) body.phone_number = phone;

  try {
    return await postChapaInitialize(secret, body);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    const retry = { ...body };
    let shouldRetry = false;
    if (phone && /phone/i.test(message)) {
      delete retry.phone_number;
      shouldRetry = true;
    }
    if (/email/i.test(message)) {
      retry.email = `buyer.${String(payload.tx_ref).replace(/[^a-z0-9]/gi, '').slice(0, 10)}@gmail.com`;
      shouldRetry = true;
    }
    if (shouldRetry) return postChapaInitialize(secret, retry);
    throw err;
  }
}

export type ChapaVerifyResult = {
  status: string;
  amount: number;
  currency: string;
  tx_ref: string;
};

export async function chapaVerifyTransaction(tx_ref: string): Promise<ChapaVerifyResult> {
  const secret = chapaSecret();
  if (!isChapaConfigured() || !secret) {
    throw new Error('Chapa is not configured');
  }

  const res = await fetch(`${CHAPA_BASE}/transaction/verify/${encodeURIComponent(tx_ref)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  const json = await parseChapaJson(res);
  const parsed = json as {
    status?: string;
    data?: {
      status?: string;
      amount?: string | number;
      currency?: string;
      tx_ref?: string;
    };
  };

  if (!res.ok || parsed.status !== 'success' || !parsed.data) {
    throw new Error(stringifyChapaError(json, 'Chapa verify failed'));
  }

  return {
    status: String(parsed.data.status || '').toLowerCase(),
    amount: Number(parsed.data.amount),
    currency: String(parsed.data.currency || 'ETB'),
    tx_ref: String(parsed.data.tx_ref || tx_ref),
  };
}

export async function chapaRefund(tx_ref: string, reason: string): Promise<void> {
  const secret = chapaSecret();
  if (!isChapaConfigured() || !secret) return;

  const res = await fetch(`${CHAPA_BASE}/refund/${encodeURIComponent(tx_ref)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  const json = await parseChapaJson(res);
  const parsed = json as { status?: string };
  if (!res.ok || (parsed.status && parsed.status !== 'success')) {
    throw new Error(stringifyChapaError(json, 'Chapa refund failed'));
  }
}
