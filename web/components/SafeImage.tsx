'use client';

import Image, { ImageProps } from 'next/image';
import { useEffect, useState } from 'react';
import { resolveMediaUrl } from '@/lib/media';

type SafeImageProps = Omit<ImageProps, 'src'> & {
  src: string | null | undefined;
  fallback?: string;
};

/**
 * next/image wrapper that resolves API-relative/localhost media URLs and
 * falls back to a placeholder when the remote file is missing.
 */
export function SafeImage({
  src,
  fallback = '/placeholder-listing.svg',
  alt,
  onError,
  ...rest
}: SafeImageProps) {
  const resolved = resolveMediaUrl(src);
  const [current, setCurrent] = useState(resolved);

  useEffect(() => {
    setCurrent(resolveMediaUrl(src));
  }, [src]);

  const display = current || fallback;
  const skipOptimizer =
    typeof display === 'string' &&
    (display.includes('/uploads/') || display.includes('onrender.com'));

  return (
    <Image
      {...rest}
      alt={alt}
      src={display}
      unoptimized={skipOptimizer}
      onError={(e) => {
        if (current !== fallback) setCurrent(fallback);
        onError?.(e);
      }}
    />
  );
}
