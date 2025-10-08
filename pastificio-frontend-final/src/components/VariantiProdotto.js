// components/VariantiProdotto.js
import React, { useState } from 'react';
import {
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Paper,
  Chip
} from '@mui/material';

/**
 * Configurazione varianti per prodotti
 */
const VARIANTI_PRODOTTI = {
  'Ravioli ricotta': {
    varianti: ['spinaci', 'zafferano', 'dolci'],
    labels: {
      spinaci: 'con Spinaci',
      zafferano: 'con Zafferano',
      dolci: 'Dolci'
    }
  }
};

/**
 * Genera nome prodotto con varianti selezionate
 */
export function generaNomeProdottoConVarianti(prodottoBase, variantiSelezionate) {
  if (!variantiSelezionate || variantiSelezionate.length === 0) {
    return prodottoBase;
  }

  const config = VARIANTI_PRODOTTI[prodottoBase];
  if (!config) return prodottoBase;

  const nomiVarianti = variantiSelezionate
    .map(v => config.labels[v])
    .join(' e ');

  return `${prodottoBase} ${nomiVarianti}`;
}

/**
 * Componente per selezionare varianti prodotto
 */
export default function VariantiProdotto({ prodotto, onChange }) {
  const [variantiSelezionate, setVariantiSelezionate] = useState([]);

  const config = VARIANTI_PRODOTTI[prodotto];

  // Se il prodotto non ha varianti, non mostrare nulla
  if (!config) return null;

  const handleChange = (variante) => (event) => {
    const nuoveVarianti = event.target.checked
      ? [...variantiSelezionate, variante]
      : variantiSelezionate.filter(v => v !== variante);

    setVariantiSelezionate(nuoveVarianti);
    
    // Notifica il parent component
    if (onChange) {
      onChange(nuoveVarianti);
    }
  };

  const nomeProdottoFinale = generaNomeProdottoConVarianti(prodotto, variantiSelezionate);

  return (
    <Paper sx={{ p: 2, bgcolor: 'info.light', mt: 1 }}>
      <Typography variant="subtitle2" gutterBottom>
        Personalizza il tuo ordine:
      </Typography>
      
      <FormGroup>
        {config.varianti.map(variante => (
          <FormControlLabel
            key={variante}
            control={
              <Checkbox
                checked={variantiSelezionate.includes(variante)}
                onChange={handleChange(variante)}
                color="primary"
              />
            }
            label={config.labels[variante]}
          />
        ))}
      </FormGroup>

      {variantiSelezionate.length > 0 && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Prodotto finale:
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {nomeProdottoFinale}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

/**
 * Hook per usare le varianti
 */
export function useVariantiProdotto(prodottoBase) {
  const [varianti, setVarianti] = useState([]);

  const nomeProdotto = generaNomeProdottoConVarianti(prodottoBase, varianti);
  const hasVarianti = VARIANTI_PRODOTTI[prodottoBase] !== undefined;

  return {
    varianti,
    setVarianti,
    nomeProdotto,
    hasVarianti
  };
}