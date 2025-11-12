// components/VariantiProdotto.js
// ✅ VERSIONE COMPLETA - Supporto varianti per tutti i prodotti
import React, { useState, useEffect } from 'react';
import {
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Paper,
  Radio,
  RadioGroup,
  Chip,
  Divider
} from '@mui/material';
import { Info } from 'lucide-react';

/**
 * ✅ CONFIGURAZIONE COMPLETA VARIANTI PRODOTTI
 * Supporta: checkbox multiple, radio single-choice, note cottura
 */
const VARIANTI_PRODOTTI = {
  // ========== RAVIOLI ==========
  'Ravioli ricotta': {
    tipo: 'checkbox', // Selezione multipla
    varianti: ['spinaci', 'zafferano', 'dolci'],
    labels: {
      spinaci: 'con Spinaci',
      zafferano: 'con Zafferano',
      dolci: 'Dolci'
    },
    descrizione: 'Seleziona le varianti desiderate'
  },

  // ========== CIAMBELLE ==========
  'Ciambelle': {
    tipo: 'radio', // Selezione singola
    varianti: ['marmellata', 'nutella', 'solo_base', 'miste'],
    labels: {
      marmellata: 'con Marmellata',
      nutella: 'con Nutella',
      solo_base: 'Solo Base (senza ripieno)',
      miste: 'Miste (marmellata + nutella + base)'
    },
    default: 'marmellata',
    descrizione: 'Scegli il tipo di ripieno',
    info: 'Per vassoi misti, seleziona "Miste" e specifica nelle note'
  },

  'Ciambelle con marmellata': {
    tipo: 'info',
    nota: 'Prodotto già specificato - nessuna variante necessaria'
  },

  'Ciambelle con Nutella': {
    tipo: 'info',
    nota: 'Prodotto già specificato - nessuna variante necessaria'
  },

  // ========== PANADAS ==========
  'Panada di anguille': {
    tipo: 'radio',
    varianti: ['con_aglio', 'senza_aglio'],
    labels: {
      con_aglio: 'con Aglio',
      senza_aglio: 'senza Aglio'
    },
    default: 'con_aglio',
    descrizione: 'Preferenza aglio'
  },

  'Panada di Agnello': {
    tipo: 'radio',
    varianti: ['con_aglio', 'senza_aglio'],
    labels: {
      con_aglio: 'con Aglio',
      senza_aglio: 'senza Aglio'
    },
    default: 'con_aglio',
    descrizione: 'Preferenza aglio'
  },

  'Panada di maiale': {
    tipo: 'radio',
    varianti: ['con_aglio', 'senza_aglio'],
    labels: {
      con_aglio: 'con Aglio',
      senza_aglio: 'senza Aglio'
    },
    default: 'con_aglio',
    descrizione: 'Preferenza aglio'
  },

  'Panada di vitella': {
    tipo: 'radio',
    varianti: ['con_aglio', 'senza_aglio'],
    labels: {
      con_aglio: 'con Aglio',
      senza_aglio: 'senza Aglio'
    },
    default: 'con_aglio',
    descrizione: 'Preferenza aglio'
  },

  'Panada di verdure': {
    tipo: 'radio',
    varianti: ['con_aglio', 'senza_aglio'],
    labels: {
      con_aglio: 'con Aglio',
      senza_aglio: 'senza Aglio'
    },
    default: 'con_aglio',
    descrizione: 'Preferenza aglio'
  },

  // ========== PARDULAS ==========
  'Pardulas': {
    tipo: 'radio',
    varianti: ['normale', 'ben_cotte', 'poco_cotte'],
    labels: {
      normale: 'Cottura Normale',
      ben_cotte: 'Ben Cotte',
      poco_cotte: 'Poco Cotte'
    },
    default: 'normale',
    descrizione: 'Livello di cottura',
    info: 'Specifica la doratura desiderata'
  },

  // ========== DOLCI MISTI ==========
  'Dolci misti (Pardulas, ciambelle, papassinas, amaretti, gueffus, bianchini)': {
    tipo: 'checkbox',
    varianti: ['senza_ciambelle', 'senza_bianchini', 'senza_amaretti', 'senza_gueffus'],
    labels: {
      senza_ciambelle: 'Escludi Ciambelle',
      senza_bianchini: 'Escludi Bianchini',
      senza_amaretti: 'Escludi Amaretti',
      senza_gueffus: 'Escludi Gueffus'
    },
    descrizione: 'Esclusioni dal mix'
  },

  'Dolci misti (Pardulas, ciambelle)': {
    tipo: 'info',
    nota: 'Mix standard Pardulas + Ciambelle'
  }
};

/**
 * ✅ Genera nome prodotto con varianti selezionate
 */
export function generaNomeProdottoConVarianti(prodottoBase, variantiSelezionate) {
  if (!variantiSelezionate || variantiSelezionate.length === 0) {
    return prodottoBase;
  }

  const config = VARIANTI_PRODOTTI[prodottoBase];
  if (!config || config.tipo === 'info') return prodottoBase;

  // CASO 1: Radio (selezione singola)
  if (config.tipo === 'radio') {
    const variante = Array.isArray(variantiSelezionate) 
      ? variantiSelezionate[0] 
      : variantiSelezionate;
    
    const label = config.labels[variante];
    
    // Se è la variante di default, non aggiungere al nome
    if (variante === config.default) {
      return prodottoBase;
    }
    
    return `${prodottoBase} ${label}`;
  }

  // CASO 2: Checkbox (selezione multipla)
  if (config.tipo === 'checkbox') {
    const nomiVarianti = variantiSelezionate
      .map(v => config.labels[v])
      .filter(Boolean)
      .join(', ');

    if (nomiVarianti) {
      return `${prodottoBase} (${nomiVarianti})`;
    }
  }

  return prodottoBase;
}

/**
 * ✅ Componente principale per selezionare varianti prodotto
 */
export default function VariantiProdotto({ prodotto, onChange, value }) {
  const [variantiSelezionate, setVariantiSelezionate] = useState(value || []);

  const config = VARIANTI_PRODOTTI[prodotto];

  // Inizializza con valore di default per radio
  useEffect(() => {
    if (config && config.tipo === 'radio' && config.default && !value) {
      setVariantiSelezionate([config.default]);
      if (onChange) {
        onChange([config.default]);
      }
    }
  }, [prodotto]);

  // Sincronizza con prop value
  useEffect(() => {
    if (value) {
      setVariantiSelezionate(value);
    }
  }, [value]);

  // Se il prodotto non ha varianti, non mostrare nulla
  if (!config) return null;

  // Caso INFO: solo messaggio informativo
  if (config.tipo === 'info') {
    return (
      <Paper sx={{ p: 2, bgcolor: 'info.light', mt: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Info size={18} />
          <Typography variant="body2" color="text.secondary">
            {config.nota}
          </Typography>
        </Box>
      </Paper>
    );
  }

  // ========== HANDLER CHECKBOX (multi-select) ==========
  const handleCheckboxChange = (variante) => (event) => {
    const nuoveVarianti = event.target.checked
      ? [...variantiSelezionate, variante]
      : variantiSelezionate.filter(v => v !== variante);

    setVariantiSelezionate(nuoveVarianti);
    
    if (onChange) {
      onChange(nuoveVarianti);
    }
  };

  // ========== HANDLER RADIO (single-select) ==========
  const handleRadioChange = (event) => {
    const nuoveVarianti = [event.target.value];
    setVariantiSelezionate(nuoveVarianti);
    
    if (onChange) {
      onChange(nuoveVarianti);
    }
  };

  const nomeProdottoFinale = generaNomeProdottoConVarianti(prodotto, variantiSelezionate);

  return (
    <Paper 
      sx={{ 
        p: 2, 
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        mt: 1 
      }}
    >
      <Typography variant="subtitle2" gutterBottom color="primary" fontWeight="bold">
        🎨 {config.descrizione || 'Personalizza il tuo ordine'}
      </Typography>

      {config.info && (
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Info size={16} color="#1976d2" />
          <Typography variant="caption" color="text.secondary">
            {config.info}
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 1 }} />

      {/* ========== RENDER CHECKBOX ========== */}
      {config.tipo === 'checkbox' && (
        <FormGroup>
          {config.varianti.map(variante => (
            <FormControlLabel
              key={variante}
              control={
                <Checkbox
                  checked={variantiSelezionate.includes(variante)}
                  onChange={handleCheckboxChange(variante)}
                  color="primary"
                />
              }
              label={config.labels[variante]}
            />
          ))}
        </FormGroup>
      )}

      {/* ========== RENDER RADIO ========== */}
      {config.tipo === 'radio' && (
        <RadioGroup
          value={variantiSelezionate[0] || config.default}
          onChange={handleRadioChange}
        >
          {config.varianti.map(variante => (
            <FormControlLabel
              key={variante}
              value={variante}
              control={<Radio color="primary" />}
              label={config.labels[variante]}
            />
          ))}
        </RadioGroup>
      )}

      {/* ========== PREVIEW PRODOTTO FINALE ========== */}
      {variantiSelezionate.length > 0 && nomeProdottoFinale !== prodotto && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ p: 1.5, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              ✅ Prodotto finale:
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="success.dark">
              {nomeProdottoFinale}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
}

/**
 * ✅ Hook per usare le varianti (versione semplificata)
 */
export function useVariantiProdotto(prodottoBase) {
  const [varianti, setVarianti] = useState([]);

  const config = VARIANTI_PRODOTTI[prodottoBase];
  
  // Inizializza con default se radio
  useEffect(() => {
    if (config && config.tipo === 'radio' && config.default) {
      setVarianti([config.default]);
    }
  }, [prodottoBase]);

  const nomeProdotto = generaNomeProdottoConVarianti(prodottoBase, varianti);
  const hasVarianti = config && config.tipo !== 'info';

  return {
    varianti,
    setVarianti,
    nomeProdotto,
    hasVarianti,
    config
  };
}

/**
 * ✅ Verifica se un prodotto ha varianti
 */
export function prodottoHaVarianti(nomeProdotto) {
  const config = VARIANTI_PRODOTTI[nomeProdotto];
  return config && config.tipo !== 'info';
}

/**
 * ✅ Ottieni configurazione varianti prodotto
 */
export function getConfigVarianti(nomeProdotto) {
  return VARIANTI_PRODOTTI[nomeProdotto] || null;
}