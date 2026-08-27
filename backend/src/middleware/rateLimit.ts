import rateLimit from 'express-rate-limit';

const limitedMessage = (text: string) => ({
  success: false,
  data: null,
  message: text,
  error: 'RATE_LIMITED',
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitedMessage('Too many auth attempts. Please try again in 15 minutes.'),
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitedMessage('Too many login attempts. Wait 15 minutes, then try again.'),
});

export const passwordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitedMessage('Too many password reset attempts. Please try again in an hour.'),
});

export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitedMessage('Too many payment attempts. Please try again later.'),
});

export const writeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitedMessage('Too many requests. Please try again later.'),
});
