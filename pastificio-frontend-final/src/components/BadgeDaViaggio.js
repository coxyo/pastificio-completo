// components/BadgeDaViaggio.js
import React from 'react';
import { Chip, Box } from '@mui/material';
import { LocalShipping as ShippingIcon } from '@mui/icons-material';

/**
 * Badge visuale per ordini "Da Viaggio"
 * Può essere usato in liste, card, tabelle
 */
export default function BadgeDaViaggio({ variant = 'chip', size = 'small' }) {
  if (variant === 'chip') {
    return (
      <Chip
        icon={<ShippingIcon />}
        label="VIAGGIO"
        color="warning"
        size={size}
        sx={{
          fontWeight: 'bold',
          '& .MuiChip-icon': {
            fontSize: size === 'small' ? 16 : 20
          }
        }}
      />
    );
  }

  if (variant === 'badge') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.5,
          bgcolor: 'warning.light',
          color: 'warning.dark',
          borderRadius: 1,
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}
      >
        <ShippingIcon sx={{ fontSize: 16 }} />
        <span>DA VIAGGIO</span>
      </Box>
    );
  }

  if (variant === 'icon') {
    return (
      <ShippingIcon 
        color="warning" 
        sx={{ fontSize: size === 'small' ? 20 : 28 }}
        titleAccess="Ordine da Viaggio"
      />
    );
  }

  return null;
}

/**
 * Wrapper per mostrare badge solo se ordine è da viaggio
 */
export function MostraBadgeSeViaggio({ ordine, variant = 'chip', size = 'small' }) {
  if (!ordine?.daViaggio) return null;
  
  return <BadgeDaViaggio variant={variant} size={size} />;
}