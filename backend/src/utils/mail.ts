import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

const RESEND_API = 'https://api.resend.com/emails';
/** Resend onboarding/test sender — production needs a verified domain From address. */
const RESEND_TEST_FROM = 'SuqET <onboarding@resend.dev>';

function frontendUrl(): string {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function resendApiKey(): string {
  return (process.env.RESEND_API_KEY || '').trim();
}

function smtpHost(): string {
  const raw = (process.env.SMTP_HOST || '').trim();
  if (/^gmail$/i.test(raw)) return 'smtp.gmail.com';
  return raw;
}

function smtpUser(): string {
  return (process.env.SMTP_USER || '').trim();
}

function smtpPass(): string {
  return (process.env.SMTP_PASS || '').replace(/\s+/g, '');
}

function smtpPort(): number {
  return Number(process.env.SMTP_PORT || 587);
}

export function isResendConfigured(): boolean {
  return Boolean(resendApiKey());
}

export function isSmtpConfigured(): boolean {
  return Boolean(smtpHost() && smtpUser() && smtpPass());
}

/** True when Resend or SMTP can send mail. */
export function isMailConfigured(): boolean {
  return isResendConfigured() || isSmtpConfigured();
}

/**
 * Hackathon/demo: skip outbound mail and treat signups as verified.
 * Set SKIP_EMAIL_VERIFICATION=true on suqet-api in Render when you have no verified domain.
 */
export function skipEmailVerification(): boolean {
  const v = (process.env.SKIP_EMAIL_VERIFICATION || '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function isUnusableFrom(configured: string): boolean {
  const inner = configured.match(/<([^>]+)>/)?.[1] || configured;
  return (
    !configured ||
    /localhost|example\.com/i.test(inner) ||
    !inner.includes('@')
  );
}

/**
 * Prefer EMAIL_FROM, then SMTP_FROM.
 * Resend needs a verified-domain address in production (not *.vercel.app).
 * Without a usable From + Resend: fall back to Resend's onboarding test sender.
 * Gmail SMTP rejects From addresses that are not the authenticated mailbox.
 */
export function resolveFromAddress(): string {
  const emailFrom = (process.env.EMAIL_FROM || '').trim();
  const smtpFrom = (process.env.SMTP_FROM || '').trim();
  const configured = emailFrom || smtpFrom;

  if (!isUnusableFrom(configured)) return configured;

  if (isResendConfigured()) return RESEND_TEST_FROM;

  const user = smtpUser();
  if (user.includes('@')) return `SuqET <${user}>`;
  return configured || 'SuqET <noreply@localhost>';
}

function publicMailError(err: unknown): Error {
  if (err instanceof Error && /Resend|EMAIL_FROM|rate limit/i.test(err.message)) {
    return err;
  }
  const code =
    err && typeof err === 'object' && 'code' in err ? String((err as { code?: string }).code) : '';
  const responseCode =
    err && typeof err === 'object' && 'responseCode' in err
      ? Number((err as { responseCode?: number }).responseCode)
      : 0;
  if (code === 'EAUTH' || responseCode === 535 || responseCode === 534) {
    return new Error(
      'Email login was rejected. For Gmail use an App Password and port 587 (STARTTLS) or 465 (SSL).'
    );
  }
  if (code === 'ESOCKET' || code === 'ECONNECTION' || code === 'ETIMEDOUT') {
    return new Error('Could not reach the mail server. Check SMTP_HOST and SMTP_PORT (587 vs 465).');
  }
  if (responseCode === 550 || responseCode === 553) {
    return new Error('The mail server rejected the From address. Set SMTP_FROM to your SMTP_USER mailbox.');
  }
  return new Error('Could not send email. Try again later.');
}

let cached: Transporter | null = null;

function transporter(): Transporter {
  if (cached) return cached;
  const port = smtpPort();
  const secure = port === 465;
  cached = nodemailer.createTransport({
    host: smtpHost(),
    port,
    secure,
    requireTLS: !secure,
    family: 4,
    auth: {
      user: smtpUser(),
      pass: smtpPass(),
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 15_000,
  } as SMTPTransport.Options);
  return cached;
}

export function resetPasswordUrl(token: string): string {
  return `${frontendUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;
}

export function verifyEmailUrl(token: string): string {
  return `${frontendUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;
}

async function sendViaResend(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const from = resolveFromAddress();
  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    }),
  });

  const body = (await res.json().catch(() => null)) as {
    id?: string;
    message?: string;
    name?: string;
    statusCode?: number;
  } | null;

  if (!res.ok) {
    const detail = body?.message || `Resend HTTP ${res.status}`;
    console.error('[mail] Resend send failed', { status: res.status, detail, name: body?.name });
    if (res.status === 401) {
      throw new Error('Resend API key was rejected. Check RESEND_API_KEY on the server.');
    }
    if (res.status === 403 || /domain|not verified|from/i.test(detail)) {
      throw new Error(
        'Resend rejected the From address. Set EMAIL_FROM to an address on a verified domain (not *.vercel.app).'
      );
    }
    if (res.status === 429) {
      throw new Error('Email rate limit reached. Try again shortly.');
    }
    throw new Error('Could not send email via Resend. Try again later.');
  }
}

async function sendViaSmtp(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  await transporter().sendMail({
    from: resolveFromAddress(),
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}

/**
 * Prefer Resend when RESEND_API_KEY is set (Render / production).
 * Else SMTP when SMTP_* is set (local/dev).
 * Throws when nothing is configured so callers can auto-verify or return a demo error.
 */
async function sendMail(opts: { to: string; subject: string; text: string; html: string }): Promise<void> {
  if (isResendConfigured()) {
    try {
      await sendViaResend(opts);
      return;
    } catch (err) {
      console.error('[mail] send failed', publicMailError(err).message);
      throw publicMailError(err);
    }
  }

  if (isSmtpConfigured()) {
    try {
      await sendViaSmtp(opts);
      return;
    } catch (err) {
      console.error('[mail] send failed', publicMailError(err).message, {
        code: err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : undefined,
        responseCode:
          err && typeof err === 'object' && 'responseCode' in err
            ? (err as { responseCode?: number }).responseCode
            : undefined,
      });
      throw publicMailError(err);
    }
  }

  console.warn(`[mail] No RESEND_API_KEY or SMTP configured. Cannot send: ${opts.subject}`);
  throw new Error('Email is not configured on this server.');
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = resetPasswordUrl(token);
  const text = `Reset your SuqET password:\n${link}\n\nThis link expires in 1 hour. If you did not request it, ignore this email.`;
  await sendMail({
    to,
    subject: 'Reset your SuqET password',
    text,
    html: `<p>Reset your SuqET password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour.</p>`,
  });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = verifyEmailUrl(token);
  const text = `Confirm your SuqET email:\n${link}\n\nThis link expires in 24 hours.`;
  await sendMail({
    to,
    subject: 'Confirm your SuqET email',
    text,
    html: `<p>Confirm your SuqET email:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
  });
}
