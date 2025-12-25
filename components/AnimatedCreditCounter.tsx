import React, { useEffect, useState } from 'react';

interface AnimatedCreditCounterProps {
  value: number | null;
  className?: string;
}

export const AnimatedCreditCounter: React.FC<AnimatedCreditCounterProps> = ({ value, className = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (value === null || value === displayValue) return;

    const end = value;
    const start = displayValue ?? value;
    
    setDirection(end > start ? 'up' : 'down');
    setIsAnimating(true);
    
    const duration = 800; // ms
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setIsAnimating(false);
          setDirection(null);
        }, 300);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  if (displayValue === null) {
    return <span className={className}>-</span>;
  }

  const getAnimationClass = () => {
    if (!isAnimating) return 'scale-100 text-purple-400';
    if (direction === 'up') return 'scale-125 text-green-400 font-black';
    return 'scale-90 text-red-500 font-black';
  };

  return (
    <span 
      className={`${className} inline-block transition-all duration-300 transform ${getAnimationClass()}`}
      style={{ textShadow: isAnimating ? '0 0 10px currentColor' : 'none' }}
    >
      {displayValue}
    </span>
  );
};
