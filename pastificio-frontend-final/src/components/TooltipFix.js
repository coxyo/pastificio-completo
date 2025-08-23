// components/TooltipFix.js
import React from 'react';

// Wrapper sicuro per Tooltip
export const SafeTooltip = ({ title, children, ...props }) => {
  // Se MUI Tooltip non è disponibile, ritorna solo il children
  try {
    const { Tooltip } = require('@mui/material');
    return <Tooltip title={title} {...props}>{children}</Tooltip>;
  } catch (error) {
    // Fallback: mostra solo il contenuto senza tooltip
    return <span title={title}>{children}</span>;
  }
};

export default SafeTooltip;