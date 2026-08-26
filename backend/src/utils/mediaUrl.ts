/**
 * Normalize and publish media URLs so collaborators / production never depend on
 * another developer's localhost uploads path.
 */

export function publicApiBase(): string {
  return (
    process.env.BACKEND_PUBLIC_URL ||
    `http://localhost:${process.env.PORT || 4000}`
  ).replace(/\/$/, '');
}

/** Prefer storing relative paths for local disk uploads. */
export function toStoredMediaPath(filename: string): string {
  return `/uploads/${filename}`;
}

/**
 * Turn stored paths into absolute URLs for API responses.
 * Rewrites legacy localhost upload URLs to the current BACKEND_PUBLIC_URL.
 */
export function toPublicMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed) && !/localhost|127\.0\.0\.1/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/placeholders/')) {
    return `${publicApiBase()}${trimmed}`;
  }

  const localMatch = trimmed.match(
    /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/uploads\/.+)$/i
  );
  if (localMatch) {
    return `${publicApiBase()}${localMatch[1]}`;
  }

  return trimmed;
}
