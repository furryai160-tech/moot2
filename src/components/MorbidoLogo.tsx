import React from 'react';

interface MorbidoLogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'horizontal' | 'vertical' | 'icon-only';
  textColor?: 'dark' | 'light';
}

export default function MorbidoLogo({
  className = '',
  showText = true,
  variant = 'horizontal',
  textColor = 'dark',
}: MorbidoLogoProps) {
  
  // Since the new logo has its own text and layout, we will just display the image.
  // The 'variant' can be used to control the size or display format if needed.

  let imageClass = "object-contain shrink-0 select-none ";
  
  if (variant === 'icon-only') {
    imageClass += "w-10 h-10 sm:w-12 sm:h-12";
  } else if (variant === 'vertical') {
    imageClass += "w-24 h-auto sm:w-32";
  } else {
    // horizontal / default - sized to fit neatly inside the navbar
    imageClass += "h-16 sm:h-20 w-auto max-w-[180px] sm:max-w-[220px]";
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="/logo.png" 
        alt="Morbido Mattress Logo" 
        className={imageClass}
      />
    </div>
  );
}

