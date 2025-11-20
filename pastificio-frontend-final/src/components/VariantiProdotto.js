// components/VariantiProdotto.js
// ✅ AGGIORNATO 19/11/2025: Aggiunto supporto opzioni extra per note
// Gestisce varianti prodotto con checkbox multiple e opzioni cottura

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Divider,
  Chip,
  Stack
} from '@mui/material';

// ========== CONFIGURAZIONE VARIANTI ==========

export const CONFIGURAZIONE_VARIANTI = {
  'Ravioli ricotta': {
    tipo: 'checkbox',
    multiple: true,
    varianti: [
      { id: 'spinaci', label: 'Spinaci', valore: 'con Spinaci' },
      { id: 'zafferano', label: 'Zafferano', valore: 'con Zafferano' },
      { id: 'dolci', label: 'Dolci', valore: 'Dolci' }
    ],
    // ✅ NUOVO: Opzioni extra che vanno nelle note
    opzioniExtra: [
      { id: 'piu_piccoli', label: 'Più piccoli', valore: 'più piccoli' },
      { id: 'piu_grandi', label: 'Più grandi', valore: 'più grandi' },
      { id: 'piu_spinaci', label: 'Più spinaci', valore: 'più spinaci' },
      { id: 'piu_zafferano', label: 'Più zafferano', valore: 'più zafferano' },
      { id: 'pasta_grossa', label: 'Pasta più grossa', valore: 'pasta più grossa' },
      { id: 'molto_dolci', label: 'Molto dolci', valore: 'molto dolci' },
      { id: 'poco_dolci', label: 'Poco dolci', valore: 'poco dolci' }
    ],
    nomeBase: 'Ravioli ricotta'
  },
  'Panada di Agnello': {
    tipo: 'select',
    varianti: [
      { id: 'patate', label: 'con patate', valore: '(con patate)' },
      { id: 'piselli', label: 'con piselli', valore: '(con piselli)' },
      { id: 'carciofi', label: 'con carciofi', valore: '(con carciofi)' }
    ],
    nomeBase: 'Panada di Agnello'
  },
  'Panada di Maiale': {
    tipo: 'select',
    varianti: [
      { id: 'patate', label: 'con patate', valore: '(con patate)' },
      { id: 'piselli', label: 'con piselli', valore: '(con piselli)' },
      { id: 'carciofi', label: 'con carciofi', valore: '(con carciofi)' }
    ],
    nomeBase: 'Panada di Maiale'
  },
  'Panada di Vitella': {
    tipo: 'select',
    varianti: [
      { id: 'patate', label: 'con patate', valore: '(con patate)' },
      { id: 'piselli', label: 'con piselli', valore: '(con piselli)' },
      { id: 'carciofi', label: 'con carciofi', valore: '(con carciofi)' }
    ],
    nomeBase: 'Panada di Vitella'
  },
  'Ciambelle': {
    tipo: 'select',
    varianti: [
      { id: 'marmellata_albicocca', label: 'Marmellata albicocca', valore: 'con marmellata di albicocca' },
      { id: 'marmellata_ciliegia', label: 'Marmellata ciliegia', valore: 'con marmellata di ciliegia' },
      { id: 'nutella', label: 'Nutella', valore: 'con nutella' },
      { id: 'zucchero_velo', label: 'Zucchero a velo', valore: 'con zucchero a velo' },
      { id: 'semplici', label: 'Semplici (nude)', valore: 'semplici' }
    ],
    nomeBase: 'Ciambelle'
  },
  'Pardulas': {
    tipo: 'select',
    varianti: [
      { id: 'base', label: 'Base (senza copertura)', valore: '(base)' },
      { id: 'glassa', label: 'Con glassa', valore: 'con glassa' },
      { id: 'zucchero_velo', label: 'Con zucchero a velo', valore: 'con zucchero a velo' }
    ],
    nomeBase: 'Pardulas'
  }
};

// ✅ NUOVO: Funzione per estrarre opzioni extra dal nome prodotto
export const estraiOpzioniExtra = (nomeProdotto, configKey) => {
  const config = CONFIGURAZIONE_VARIANTI[configKey];
  if (!config || !config.opzioniExtra) return [];
  
  const nomeLC = nomeProdotto.toLowerCase();
  const opzioniTrovate = [];
  
  config.opzioniExtra.forEach(opzione => {
    if (nomeLC.includes(opzione.valore.toLowerCase())) {
      opzioniTrovate.push(opzione.valore);
    }
  });
  
  return opzioniTrovate;
};

// ✅ NUOVO: Funzione per rimuovere opzioni extra dal nome (lasciare solo varianti principali)
export const rimuoviOpzioniExtraDaNome = (nomeProdotto, configKey) => {
  const config = CONFIGURAZIONE_VARIANTI[configKey];
  if (!config || !config.opzioniExtra) return nomeProdotto;
  
  let nomeClean = nomeProdotto;
  
  config.opzioniExtra.forEach(opzione => {
    // Rimuovi la variante dal nome (case insensitive)
    const regex = new RegExp(`\\s*e\\s+${opzione.valore}|\\s+${opzione.valore}`, 'gi');
    nomeClean = nomeClean.replace(regex, '');
  });
  
  return nomeClean.trim();
};

// ✅ Funzione per verificare se un prodotto ha varianti configurate
export const prodottoHaVarianti = (nomeProdotto) => {
  if (!nomeProdotto) return false;
  
  return Object.keys(CONFIGURAZIONE_VARIANTI).some(key => 
    nomeProdotto.toLowerCase().includes(key.toLowerCase())
  );
};

// ✅ Funzione per generare il nome completo del prodotto con varianti
export const generaNomeProdottoConVarianti = (nomeBase, variantiIds) => {
  // Trova la configurazione
  const configKey = Object.keys(CONFIGURAZIONE_VARIANTI).find(key => 
    nomeBase.toLowerCase().includes(key.toLowerCase())
  );
  
  if (!configKey) return nomeBase;
  
  const config = CONFIGURAZIONE_VARIANTI[configKey];
  
  if (!variantiIds || variantiIds.length === 0) {
    return config.nomeBase;
  }
  
  // Genera il nome con le varianti selezionate
  const variantiValori = variantiIds.map(id => {
    const variante = config.varianti.find(v => v.id === id);
    return variante ? variante.valore : '';
  }).filter(Boolean);
  
  if (variantiValori.length === 0) {
    return config.nomeBase;
  }
  
  return `${config.nomeBase} ${variantiValori.join(' e ')}`;
};

// ========== COMPONENTE PRINCIPALE ==========

export default function VariantiProdotto({ 
  prodottoBase, 
  onVarianteChange, 
  variantiSelezionate = [],
  opzioniExtraSelezionate = [] // ✅ NUOVO
}) {
  const [selezioneVarianti, setSelezioneVarianti] = useState(variantiSelezionate);
  const [selezioneExtra, setSelezioneExtra] = useState(opzioniExtraSelezionate); // ✅ NUOVO
  
  // Trova la configurazione per questo prodotto
  const configKey = Object.keys(CONFIGURAZIONE_VARIANTI).find(key => 
    prodottoBase.toLowerCase().includes(key.toLowerCase())
  );
  
  const config = configKey ? CONFIGURAZIONE_VARIANTI[configKey] : null;
  
  // Reset quando cambia prodotto
  useEffect(() => {
    setSelezioneVarianti(variantiSelezionate);
    setSelezioneExtra(opzioniExtraSelezionate);
  }, [prodottoBase, variantiSelezionate, opzioniExtraSelezionate]);
  
  // Notifica il parent quando cambiano le selezioni
  useEffect(() => {
    if (config && onVarianteChange) {
      // Costruisci il nome completo
      let nomeCompleto = config.nomeBase;
      
      if (config.tipo === 'checkbox' && selezioneVarianti.length > 0) {
        // Per checkbox multiple, unisci con " e "
        const variantiValori = selezioneVarianti.map(id => {
          const variante = config.varianti.find(v => v.id === id);
          return variante ? variante.valore : '';
        }).filter(Boolean);
        
        if (variantiValori.length > 0) {
          nomeCompleto = `${config.nomeBase} ${variantiValori.join(' e ')}`;
        }
      } else if (config.tipo === 'select' && selezioneVarianti.length > 0) {
        const variante = config.varianti.find(v => v.id === selezioneVarianti[0]);
        if (variante) {
          nomeCompleto = `${config.nomeBase} ${variante.valore}`;
        }
      }
      
      // ✅ NUOVO: Aggiungi opzioni extra
      const extraValori = selezioneExtra.map(id => {
        const opzione = config.opzioniExtra?.find(o => o.id === id);
        return opzione ? opzione.valore : '';
      }).filter(Boolean);
      
      onVarianteChange(nomeCompleto, selezioneVarianti, extraValori);
    }
  }, [selezioneVarianti, selezioneExtra, config, onVarianteChange]);
  
  // Se non c'è configurazione, non mostrare nulla
  if (!config) {
    return null;
  }
  
  // Handler per checkbox varianti principali
  const handleCheckboxChange = (varianteId) => {
    setSelezioneVarianti(prev => {
      if (prev.includes(varianteId)) {
        return prev.filter(id => id !== varianteId);
      } else {
        return [...prev, varianteId];
      }
    });
  };
  
  // Handler per select (singola selezione)
  const handleSelectChange = (varianteId) => {
    setSelezioneVarianti([varianteId]);
  };
  
  // ✅ NUOVO: Handler per opzioni extra
  const handleExtraChange = (opzioneId) => {
    setSelezioneExtra(prev => {
      if (prev.includes(opzioneId)) {
        return prev.filter(id => id !== opzioneId);
      } else {
        return [...prev, opzioneId];
      }
    });
  };
  
  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#1976d2' }}>
        🎯 Seleziona variante{config.tipo === 'checkbox' ? ' (puoi selezionarne più di una)' : ''}:
      </Typography>
      
      {/* Varianti principali */}
      {config.tipo === 'checkbox' ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {config.varianti.map(variante => (
            <FormControlLabel
              key={variante.id}
              control={
                <Checkbox
                  checked={selezioneVarianti.includes(variante.id)}
                  onChange={() => handleCheckboxChange(variante.id)}
                  color="primary"
                />
              }
              label={variante.label}
              sx={{
                bgcolor: selezioneVarianti.includes(variante.id) ? '#e3f2fd' : 'white',
                borderRadius: 1,
                px: 1,
                border: '1px solid #ddd'
              }}
            />
          ))}
        </Box>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {config.varianti.map(variante => (
            <Chip
              key={variante.id}
              label={variante.label}
              onClick={() => handleSelectChange(variante.id)}
              color={selezioneVarianti.includes(variante.id) ? 'primary' : 'default'}
              variant={selezioneVarianti.includes(variante.id) ? 'filled' : 'outlined'}
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>
      )}
      
      {/* ✅ NUOVO: Opzioni extra (solo per ravioli) */}
      {config.opzioniExtra && config.opzioniExtra.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#f57c00' }}>
            📝 Opzioni extra (vanno nelle note):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {config.opzioniExtra.map(opzione => (
              <FormControlLabel
                key={opzione.id}
                control={
                  <Checkbox
                    checked={selezioneExtra.includes(opzione.id)}
                    onChange={() => handleExtraChange(opzione.id)}
                    color="warning"
                    size="small"
                  />
                }
                label={opzione.label}
                sx={{
                  bgcolor: selezioneExtra.includes(opzione.id) ? '#fff3e0' : 'white',
                  borderRadius: 1,
                  px: 1,
                  border: '1px solid #ddd',
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.85rem'
                  }
                }}
              />
            ))}
          </Box>
        </>
      )}
      
      {/* Preview nome completo */}
      {(selezioneVarianti.length > 0 || selezioneExtra.length > 0) && (
        <Box sx={{ mt: 2, p: 1, bgcolor: '#e8f5e9', borderRadius: 1 }}>
          <Typography variant="caption" color="success.main">
            <strong>Nome prodotto:</strong>{' '}
            {(() => {
              let nome = config.nomeBase;
              
              if (config.tipo === 'checkbox' && selezioneVarianti.length > 0) {
                const variantiValori = selezioneVarianti.map(id => {
                  const v = config.varianti.find(x => x.id === id);
                  return v ? v.valore : '';
                }).filter(Boolean);
                nome = `${config.nomeBase} ${variantiValori.join(' e ')}`;
              } else if (config.tipo === 'select' && selezioneVarianti.length > 0) {
                const v = config.varianti.find(x => x.id === selezioneVarianti[0]);
                if (v) nome = `${config.nomeBase} ${v.valore}`;
              }
              
              return nome;
            })()}
          </Typography>
          
          {selezioneExtra.length > 0 && (
            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
              <strong>Note cottura:</strong>{' '}
              {selezioneExtra.map(id => {
                const o = config.opzioniExtra.find(x => x.id === id);
                return o ? o.valore : '';
              }).filter(Boolean).join(', ')}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
