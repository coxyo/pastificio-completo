// components/ui/scroll-area.js
import React from 'react';

export const ScrollArea = ({ children, className = '' }) => {
  return (
    <div className={`overflow-auto ${className}`}>
      {children}
    </div>
  );
};