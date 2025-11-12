// components/OpzioniAvanzate.js
// ✅ Componente per opzioni avanzate ordini
// Gestisce: note preparazione, esclusioni prodotti, packaging speciale

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import { 
  ChevronDown, 
  AlertCircle, 
  Package, 
  FileText,
  Ban
} from 'lucide-react';

/**
 * ✅ Prodotti disponibili per esclusione (dolci misti)
 */
const PRODOTTI_ESCLUDIBILI = [
  { id: 'ciambelle', label: 'Ciambelle', categoria: 'Dolci' },
  { id: 'bianchini', label: 'Bianchini', categoria: 'Dolci' },
  { id: 'amaretti', label: 'Amaretti', categoria: 'Dolci' },
  { id: 'gueffus', label: 'Gueffus', categoria: 'Dolci' },
  { id: 'papassinas', label: 'Papassinas', categoria: 'Dolci' },
  { id: 'pardulas', label: 'Pardulas', categoria: 'Dolci' }
];

/**
 * ✅ Opzioni packaging speciale
 */
const OPZIONI_PACKAGING = [
  { id: 'sottovuoto', label: 'Sottovuoto (da viaggio)', icon: '✈️' },
  { id: 'confezione_regalo', label: 'Confezione Regalo', icon: '🎁' },
  { id: 'sacchetti_separati', label: 'Sacchetti Separati', icon: '📦' },
  { id: 'vassoio_personalizzato', label: 'Vassoio Personalizzato', icon: '🎨' }
];

/**
 * ✅ Componente principale OpzioniAvanzate
 */
export default function OpzioniAvanzate({ 
  value = {}, 
  onChange,
  mostraEsclusioni = true,
  mostraPackaging = true,
  prodottoCorrente = null
}) {
  const [opzioni, setOpzioni] = useState({
    notePreparazione: value.notePreparazione || '',
    noteCottura: value.noteCottura || '',
    esclusioniProdotti: value.esclusioniProdotti || [],
    packagingSpeciale: value.packagingSpeciale || [],
    ...value
  });

  // ========== HANDLER CHANGE ==========
  const handleChange = (campo, valore) => {
    const nuoveOpzioni = {
      ...opzioni,
      [campo]: valore
    };
    
    setOpzioni(nuoveOpzioni);
    
    if (onChange) {
      onChange(nuoveOpzioni);
    }
  };

  // ========== HANDLER ESCLUSIONI ==========
  const toggleEsclusione = (prodottoId) => {
    const nuoveEsclusioni = opzioni.esclusioniProdotti.includes(prodottoId)
      ? opzioni.esclusioniProdotti.filter(id => id !== prodottoId)
      : [...opzioni.esclusioniProdotti, prodottoId];
    
    handleChange('esclusioniProdotti', nuoveEsclusioni);
  };

  // ========== HANDLER PACKAGING ==========
  const togglePackaging = (packagingId) => {
    const nuovoPackaging = opzioni.packagingSpeciale.includes(packagingId)
      ? opzioni.packagingSpeciale.filter(id => id !== packagingId)
      : [...opzioni.packagingSpeciale, packagingId];
    
    handleChange('packagingSpeciale', nuovoPackaging);
  };

  // ========== VERIFICA SE DOLCI MISTI ==========
  const isDolciMisti = prodottoCorrente && 
    (prodottoCorrente.toLowerCase().includes('dolci misti') ||
     prodottoCorrente.toLowerCase().includes('vassoio'));

  return (
    <Box sx={{ mt: 2 }}>
      {/* ========== NOTE PREPARAZIONE ========== */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ChevronDown />}>
          <Box display="flex" alignItems="center" gap={1}>
            <FileText size={20} />
            <Typography fontWeight="bold">
              📝 Note Preparazione
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Es: Confezionare in 2 pacchi separati, Aggiungere biglietto auguri..."
            value={opzioni.notePreparazione}
            onChange={(e) => handleChange('notePreparazione', e.target.value)}
            variant="outlined"
            helperText="Istruzioni specifiche per la preparazione dell'ordine"
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Es: Pardulas ben cotte, Ciambelle poco dorate..."
            value={opzioni.noteCottura}
            onChange={(e) => handleChange('noteCottura', e.target.value)}
            variant="outlined"
            sx={{ mt: 2 }}
            helperText="Note specifiche sulla cottura dei prodotti"
          />
        </AccordionDetails>
      </Accordion>

      {/* ========== ESCLUSIONI PRODOTTI (solo per dolci misti) ========== */}
      {mostraEsclusioni && isDolciMisti && (
        <Accordion>
          <AccordionSummary expandIcon={<ChevronDown />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Ban size={20} />
              <Typography fontWeight="bold">
                🚫 Esclusioni Prodotti
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="info" icon={<AlertCircle size={18} />} sx={{ mb: 2 }}>
              Seleziona i prodotti da <strong>escludere</strong> dal mix dolci misti
            </Alert>

            <FormGroup>
              {PRODOTTI_ESCLUDIBILI.map(prodotto => (
                <FormControlLabel
                  key={prodotto.id}
                  control={
                    <Checkbox
                      checked={opzioni.esclusioniProdotti.includes(prodotto.id)}
                      onChange={() => toggleEsclusione(prodotto.id)}
                      color="error"
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography>{prodotto.label}</Typography>
                      <Chip 
                        label={prodotto.categoria} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  }
                />
              ))}
            </FormGroup>

            {opzioni.esclusioniProdotti.length > 0 && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'error.light', borderRadius: 1 }}>
                <Typography variant="caption" color="error.dark">
                  ⚠️ Prodotti esclusi: {opzioni.esclusioniProdotti.length}
                </Typography>
                <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
                  {opzioni.esclusioniProdotti.map(id => {
                    const prodotto = PRODOTTI_ESCLUDIBILI.find(p => p.id === id);
                    return (
                      <Chip
                        key={id}
                        label={prodotto?.label}
                        size="small"
                        color="error"
                        onDelete={() => toggleEsclusione(id)}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {/* ========== PACKAGING SPECIALE ========== */}
      {mostraPackaging && (
        <Accordion>
          <AccordionSummary expandIcon={<ChevronDown />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Package size={20} />
              <Typography fontWeight="bold">
                📦 Packaging Speciale
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="info" icon={<AlertCircle size={18} />} sx={{ mb: 2 }}>
              Seleziona opzioni di confezionamento speciali
            </Alert>

            <FormGroup>
              {OPZIONI_PACKAGING.map(opzione => (
                <FormControlLabel
                  key={opzione.id}
                  control={
                    <Checkbox
                      checked={opzioni.packagingSpeciale.includes(opzione.id)}
                      onChange={() => togglePackaging(opzione.id)}
                      color="primary"
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{opzione.icon}</span>
                      <Typography>{opzione.label}</Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>

            {opzioni.packagingSpeciale.length > 0 && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="caption" color="primary.dark">
                  ✅ Opzioni packaging selezionate:
                </Typography>
                <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
                  {opzioni.packagingSpeciale.map(id => {
                    const opzione = OPZIONI_PACKAGING.find(p => p.id === id);
                    return (
                      <Chip
                        key={id}
                        label={`${opzione?.icon} ${opzione?.label}`}
                        size="small"
                        color="primary"
                        onDelete={() => togglePackaging(id)}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {/* ========== RIEPILOGO OPZIONI ========== */}
      {(opzioni.notePreparazione || 
        opzioni.noteCottura || 
        opzioni.esclusioniProdotti.length > 0 || 
        opzioni.packagingSpeciale.length > 0) && (
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'success.light' }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            ✅ Riepilogo Opzioni Avanzate
          </Typography>
          <Divider sx={{ my: 1 }} />
          
          {opzioni.notePreparazione && (
            <Box mb={1}>
              <Typography variant="caption" color="text.secondary">
                Note preparazione:
              </Typography>
              <Typography variant="body2">
                {opzioni.notePreparazione}
              </Typography>
            </Box>
          )}

          {opzioni.noteCottura && (
            <Box mb={1}>
              <Typography variant="caption" color="text.secondary">
                Note cottura:
              </Typography>
              <Typography variant="body2">
                {opzioni.noteCottura}
              </Typography>
            </Box>
          )}

          {opzioni.esclusioniProdotti.length > 0 && (
            <Box mb={1}>
              <Typography variant="caption" color="error.dark">
                Prodotti esclusi:
              </Typography>
              <Typography variant="body2">
                {opzioni.esclusioniProdotti
                  .map(id => PRODOTTI_ESCLUDIBILI.find(p => p.id === id)?.label)
                  .join(', ')}
              </Typography>
            </Box>
          )}

          {opzioni.packagingSpeciale.length > 0 && (
            <Box>
              <Typography variant="caption" color="primary.dark">
                Packaging:
              </Typography>
              <Typography variant="body2">
                {opzioni.packagingSpeciale
                  .map(id => OPZIONI_PACKAGING.find(p => p.id === id)?.label)
                  .join(', ')}
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}

/**
 * ✅ Hook per gestire opzioni avanzate
 */
export function useOpzioniAvanzate(initialValue = {}) {
  const [opzioni, setOpzioni] = useState(initialValue);

  const hasOpzioni = Boolean(
    opzioni.notePreparazione ||
    opzioni.noteCottura ||
    (opzioni.esclusioniProdotti && opzioni.esclusioniProdotti.length > 0) ||
    (opzioni.packagingSpeciale && opzioni.packagingSpeciale.length > 0)
  );

  return {
    opzioni,
    setOpzioni,
    hasOpzioni
  };
}

/**
 * ✅ Formatta opzioni per salvataggio ordine
 */
export function formattaOpzioniPerOrdine(opzioni) {
  const result = {};

  if (opzioni.notePreparazione) {
    result.notePreparazione = opzioni.notePreparazione;
  }

  if (opzioni.noteCottura) {
    result.noteCottura = opzioni.noteCottura;
  }

  if (opzioni.esclusioniProdotti && opzioni.esclusioniProdotti.length > 0) {
    result.esclusioni = opzioni.esclusioniProdotti
      .map(id => PRODOTTI_ESCLUDIBILI.find(p => p.id === id)?.label)
      .filter(Boolean);
  }

  if (opzioni.packagingSpeciale && opzioni.packagingSpeciale.length > 0) {
    result.packaging = opzioni.packagingSpeciale
      .map(id => OPZIONI_PACKAGING.find(p => p.id === id)?.label)
      .filter(Boolean);
  }

  return result;
}