// src/components/ui/progress.js
import React from 'react';

export const Progress = ({ 
  value = 0, 
  className = '', 
  indicatorClassName = '',
  ...props 
}) => {
  const percentage = Math.min(100, Math.max(0, value));
  
  return (
    <div 
      className={`relative w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
      {...props}
    >
      <div
        className={`h-full transition-all duration-300 ease-in-out ${
          indicatorClassName || 'bg-primary'
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// NON aggiungere altre export qui