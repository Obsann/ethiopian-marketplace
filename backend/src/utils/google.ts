import jwt from 'jsonwebtoken';

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO = 'https://www.googleapis.com/oauth2/v3/userinfo';

export type OAuthRole = 'buyer' | 'seller';

interface OAuthState {
  purpose: 'google_oauth';
  role: OAuthRole;
  next?: string;
}

export function googleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_CALLBACK_URL
  );
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');
  return secret;
}

export function signOAuthState(role: OAuthRole, next?: string): string {
  const payload: OAuthState = { purpose: 'google_oauth', role };
  if (next) payload.next = next;
  return jwt.sign(payload, jwtSecret(), { expiresIn: '10m' });
}

export function readOAuthState(state: string): OAuthState {
  const decoded = jwt.verify(state, jwtSecret()) as OAuthState;
  if (decoded.purpose !== 'google_oauth' || (decoded.role !== 'buyer' && decoded.role !== 'seller')) {
    throw new Error('Invalid OAuth state');
  }
  if (decoded.next && (!decoded.next.startsWith('/') || decoded.next.startsWith('//'))) {
    delete decoded.next;
  }
  return decoded;
}

export function googleAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: process.env.GOOGLE_CALLBACK_URL || '',
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified?: boolean | string;
  name?: string;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirect_uri: process.env.GOOGLE_CALLBACK_URL || '',
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error || 'Google token exchange failed');
  }

  const profileRes = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const profile = (await profileRes.json()) as GoogleProfile;
  if (!profileRes.ok || !profile.sub || !profile.email) {
    throw new Error('Google profile missing email');
  }
  const verified = profile.email_verified === true || profile.email_verified === 'true';
  if (!verified) {
    throw new Error('Google email is not verified');
  }
  return profile;
}
