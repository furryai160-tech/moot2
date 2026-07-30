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
    imageClass += "w-10 h-10 sm:w-12 sm:h-12 -mt-2";
  } else if (variant === 'vertical') {
    imageClass += "w-28 sm:w-36 h-auto -mt-4";
  } else {
    // horizontal / default - raised up to eliminate empty space on top
    imageClass += "h-20 sm:h-24 w-auto max-w-[180px] sm:max-w-[220px] -mt-4 sm:-mt-5 transform -translate-y-1";
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="https://i.ibb.co/SwjDf5Yx/logo.png" 
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/logo.png';
        }}
        alt="موربيدو للمراتب والمفروشات - Morbido Mattress" 
        className={imageClass}
      />
    </div>
  );
}

