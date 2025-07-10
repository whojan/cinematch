import React, { useEffect, useState } from 'react';
import { FeatureHighlightProps } from '../types/guide';

export const FeatureHighlight: React.FC<FeatureHighlightProps> = ({
  targetSelector,
  type,
  isActive,
  onClick
}) => {
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const updateRect = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        setElementRect(element.getBoundingClientRect());
      }
    };

    updateRect();
    window.addEventListener('scroll', updateRect);
    window.addEventListener('resize', updateRect);

    return () => {
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
    };
  }, [targetSelector, isActive]);

  if (!isActive || !elementRect) return null;

  const highlightStyle: React.CSSProperties = {
    position: 'absolute',
    left: elementRect.left + window.pageXOffset,
    top: elementRect.top + window.pageYOffset,
    width: elementRect.width,
    height: elementRect.height,
    zIndex: 55,
    pointerEvents: onClick ? 'auto' : 'none',
    cursor: onClick ? 'pointer' : 'default'
  };

  const getHighlightClasses = () => {
    const baseClasses = 'absolute inset-0 transition-all duration-500';
    
    switch (type) {
      case 'spotlight':
        return `${baseClasses} bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-lg shadow-2xl shadow-white/25 animate-pulse`;
      case 'border':
        return `${baseClasses} border-3 border-amber-400 rounded-lg shadow-lg shadow-amber-400/30 animate-pulse`;
      case 'pulse':
        return `${baseClasses} bg-blue-500/20 border-2 border-blue-400 rounded-lg animate-pulse shadow-lg shadow-blue-400/30`;
      case 'glow':
        return `${baseClasses} bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400 rounded-lg shadow-xl shadow-purple-400/40 animate-pulse`;
      default:
        return `${baseClasses} border-2 border-white/50 rounded-lg`;
    }
  };

  return (
    <div
      style={highlightStyle}
      onClick={onClick}
      className="transform transition-transform duration-200 hover:scale-105"
    >
      <div className={getHighlightClasses()} />
      
      {/* Ripple effect for clickable highlights */}
      {onClick && (
        <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200" />
      )}
    </div>
  );
};