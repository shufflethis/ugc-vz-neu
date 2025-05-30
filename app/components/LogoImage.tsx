'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LogoImageProps {
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  alt?: string;
}

export default function LogoImage({ 
  width, 
  height, 
  className = '', 
  priority = false,
  alt = 'UGC VZ'
}: LogoImageProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Image
      src={imageError ? '/ugc-vz-logo.png' : '/ugc-vz-logo.webp'}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={() => setImageError(true)}
    />
  );
}
