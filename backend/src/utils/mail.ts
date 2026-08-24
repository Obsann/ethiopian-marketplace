import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

function frontendUrl(): string {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
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

export function isMailConfigured(): boolean {
  return Boolean(smtpHost() && smtpUser() && smtpPass());
}

/**
 * Gmail (and most hosts) reject From addresses that are not the authenticated
 * mailbox. A leftover SMTP_FROM like "SuqET <noreply@localhost>" is a common
 * reason "SMTP is set" but nothing arrives.
 */
export function resolveFromAddress(): string {
  const user = smtpUser();
  const configured = (process.env.SMTP_FROM || '').trim();
  const inner = configured.match(/<([^>]+)>/)?.[1] || configured;
  const unusable =
    !configured ||
    /localhost|example\.com/i.test(inner) ||
    !inner.includes('@');
  if (!unusable) return configured;
  if (user.includes('@')) return `SuqET <${user}>`;
  return configured || 'SuqET <noreply@localhost>';
}

function publicMailError(err: unknown): Error {
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

async function sendMail(opts: { to: string; subject: string; text: string; html: string }): Promise<void> {
  if (!isMailConfigured()) {
    console.warn(`[mail] SMTP not configured. Skip send: ${opts.subject}`);
    return;
  }
  try {
    await transporter().sendMail({
      from: resolveFromAddress(),
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
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
