'use client';

import React, { useState, useEffect } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = '/images/placeholders/default-tour.svg';

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  className,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
    setHasError(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc || fallbackSrc}
      alt={alt || 'Japan Tour Experience'}
      onError={handleError}
      className={className}
      loading="lazy"
      {...props}
    />
  );
}
