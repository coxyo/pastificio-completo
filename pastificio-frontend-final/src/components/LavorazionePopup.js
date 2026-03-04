// components/LavorazionePopup.js
// ✅ NUOVO 04/03/2026: Popup selezione prodotti in lavorazione
// Appare al click su "L" per ordini con vassoio o più prodotti
// Permette di selezionare quali prodotti sono già stati messi da parte
// Il riepilogo produzione si aggiorna sottraendo i prodotti "in_lavorazione"

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Checkbox, Button, Chip, Divider,
  FormControlLabel, Alert, IconButton, List, ListItem,
  ListItemIcon, ListItemText, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BuildIcon from '@mui/icons-material/Build';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import SelectAllIcon from '@mui/icons-material/SelectAll';

// ===================================================
// HELPER: Determina se un prodotto è un vassoio misto
// ===================================================
export const isVassioMisto = (prodotto) => {
  if (!prodotto) return false;
  const nome = (prodotto.nome || '').toLowerCase();
  const unita = (prodotto.unita || prodotto.unitaMisura || '').toLowerCase();
  return nome.includes('vassoio') || unita === 'vassoio';
};

// ===================================================
// HELPER: Estrae la lista prodotti "reali" da un ordine
// Per vassoi: ritorna i componenti della composizione
// Per ordini normali: ritorna i prodotti dell'ordine
// ===================================================
export const estraiProdottiLavorazione = (ordine) => {
  if (!ordine || !ordine.prodotti) return [];

  const prodotti = [];

  ordine.prodotti.forEach((prodotto, indiceProdotto) => {
    if (isVassioMisto(prodotto) && prodotto.dettagliCalcolo?.composizione) {
      // Vassoio: espandi i componenti
      prodotto.dettagliCalcolo.composizione.forEach((comp, indiceComp) => {
        const qtaFormatted = comp.unita === 'Kg'
          ? `${parseFloat(comp.quantita).toFixed(2)} Kg`
          : `${comp.quantita} ${comp.unita || 'pz'}`;
        prodotti.push({
          id: `vassoio-${indiceProdotto}-${indiceComp}`,
          indiceProdotto,
          indiceComp,
          nome: comp.nome || comp.prodotto || 'Prodotto',
          variante: comp.variante || null,
          quantita: comp.quantita,
          unita: comp.unita || 'Kg',
          qtaDisplay: qtaFormatted,
          isDaVassoio: true,
          nomeVassoio: `Vassoio ${prodotto.quantita > 1 ? `(${prodotto.quantita}x)` : ''}`,
        });
      });
    } else {
      // Prodotto normale
      const unita = prodotto.unitaMisura || prodotto.unita || 'Kg';
      let qtaDisplay = '';
      if (unita.toLowerCase() === 'kg') {
        qtaDisplay = `${parseFloat(prodotto.quantita).toFixed(2)} Kg`;
      } else if (unita.toLowerCase() === 'pezzi' || unita.toLowerCase() === 'pz') {
        qtaDisplay = `${prodotto.quantita} pz`;
      } else {
        qtaDisplay = `${prodotto.quantita} ${unita}`;
      }
      prodotti.push({
        id: `prod-${indiceProdotto}`,
        indiceProdotto,
        indiceComp: null,
        nome: prodotto.nome || prodotto.prodotto || 'Prodotto',
        variante: prodotto.variante || null,
        quantita: prodotto.quantita,
        unita,
        qtaDisplay,
        isDaVassoio: false,
        nomeVassoio: null,
      });
    }
  });

  return prodotti;
};

// ===================================================
// HELPER: Determina se aprire il popup o procedere
// direttamente (solo se 1 prodotto senza composizione)
// ===================================================
export const necessitaPopup = (ordine) => {
  if (!ordine || !ordine.prodotti) return false;
  const prodotti = estraiProdottiLavorazione(ordine);
  return prodotti.length > 1;
};

// ===================================================
// COMPONENTE PRINCIPALE
// ===================================================
export default function LavorazionePopup({
  open,
  onClose,
  onConferma,
  ordine,
  // Prodotti già in lavorazione (da precedente click "L")
  prodottiGiaInLavorazione = [],
}) {
  const prodottiDisponibili = useMemo(
    () => (ordine ? estraiProdottiLavorazione(ordine) : []),
    [ordine]
  );

  // IDs dei prodotti selezionati (già preparati)
  const [selezionati, setSelezionati] = useState(new Set());

  // Quando il popup si apre, pre-seleziona i prodotti già in lavorazione
  useEffect(() => {
    if (open && prodottiGiaInLavorazione.length > 0) {
      const ids = new Set(prodottiGiaInLavorazione.map((p) => p.id));
      setSelezionati(ids);
    } else if (open) {
      setSelezionati(new Set());
    }
  }, [open, prodottiGiaInLavorazione]);

  const toggleProdotto = (id) => {
    setSelezionati((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selezionaTutti = () => {
    setSelezionati(new Set(prodottiDisponibili.map((p) => p.id)));
  };

  const deselezionaTutti = () => {
    setSelezionati(new Set());
  };

  const tuttiSelezionati = selezionati.size === prodottiDisponibili.length;
  const nessunoSelezionato = selezionati.size === 0;

  const handleConferma = () => {
    const prodottiSelezionati = prodottiDisponibili.filter((p) => selezionati.has(p.id));
    const prodottiNonSelezionati = prodottiDisponibili.filter((p) => !selezionati.has(p.id));
    onConferma({
      prodottiInLavorazione: prodottiSelezionati,
      prodottiDaCompletare: prodottiNonSelezionati,
      tuttiPronti: tuttiSelezionati,
    });
  };

  // Raggruppa per vassoio (se ci sono componenti di vassoio)
  const hasVassoio = prodottiDisponibili.some((p) => p.isDaVassoio);

  if (!ordine) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      // Stoppa propagazione click per non aprire il dialog ordine
      onClick={(e) => e.stopPropagation()}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <BuildIcon color="warning" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" component="span">
            🔧 Lavorazione — {ordine.nomeCliente}
          </Typography>
          {hasVassoio && (
            <Typography variant="caption" display="block" color="text.secondary">
              Vassoio Dolci Misti
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2, pb: 1 }}>
        <Alert severity="info" sx={{ mb: 2, fontSize: '0.85rem' }}>
          Seleziona i prodotti già <strong>messi da parte</strong>. Il riepilogo produzione si aggiornerà sottraendo le quantità selezionate.
        </Alert>

        {/* Azione rapida: seleziona/deseleziona tutti */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SelectAllIcon />}
            onClick={tuttiSelezionati ? deselezionaTutti : selezionaTutti}
            sx={{ fontSize: '0.75rem' }}
          >
            {tuttiSelezionati ? 'Deseleziona tutti' : 'Seleziona tutti'}
          </Button>
          <Typography variant="caption" color="text.secondary">
            {selezionati.size} / {prodottiDisponibili.length} prodotti selezionati
          </Typography>
        </Box>

        {/* Lista prodotti */}
        <List dense disablePadding>
          {prodottiDisponibili.map((prodotto, idx) => {
            const isSelected = selezionati.has(prodotto.id);

            return (
              <ListItem
                key={prodotto.id}
                disablePadding
                onClick={() => toggleProdotto(prodotto.id)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 1,
                  mb: 0.5,
                  px: 1,
                  py: 0.5,
                  backgroundColor: isSelected
                    ? 'rgba(255, 152, 0, 0.08)'
                    : 'rgba(0,0,0,0.02)',
                  border: isSelected
                    ? '1px solid rgba(255, 152, 0, 0.4)'
                    : '1px solid rgba(0,0,0,0.08)',
                  '&:hover': {
                    backgroundColor: isSelected
                      ? 'rgba(255, 152, 0, 0.15)'
                      : 'rgba(0,0,0,0.05)',
                  },
                  transition: 'all 0.15s',
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {isSelected ? (
                    <CheckBoxIcon color="warning" fontSize="small" />
                  ) : (
                    <CheckBoxOutlineBlankIcon color="disabled" fontSize="small" />
                  )}
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                        {prodotto.nome}
                        {prodotto.variante ? ` (${prodotto.variante})` : ''}
                      </Typography>
                      {prodotto.isDaVassoio && (
                        <Chip
                          label="vassoio"
                          size="small"
                          sx={{ fontSize: '0.6rem', height: 16, '& .MuiChip-label': { px: 0.5 } }}
                          color="default"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color={isSelected ? 'warning.dark' : 'text.secondary'}>
                      {prodotto.qtaDisplay}
                      {isSelected && ' ✅'}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
        </List>

        {/* Riepilogo selezione */}
        {selezionati.size > 0 && !tuttiSelezionati && (
          <Alert severity="warning" sx={{ mt: 2, fontSize: '0.8rem' }}>
            <strong>{selezionati.size} prodotti</strong> verranno scalati dal riepilogo produzione.{' '}
            <strong>{prodottiDisponibili.length - selezionati.size} prodotti</strong> rimangono da preparare.
          </Alert>
        )}
        {tuttiSelezionati && (
          <Alert severity="success" sx={{ mt: 2, fontSize: '0.8rem' }}>
            Tutti i prodotti selezionati — l'ordine è completamente in lavorazione.
          </Alert>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        <Button
          onClick={onClose}
          color="inherit"
          variant="outlined"
          size="small"
        >
          Annulla
        </Button>
        <Button
          onClick={handleConferma}
          color="warning"
          variant="contained"
          size="small"
          disabled={nessunoSelezionato}
          startIcon={<BuildIcon />}
        >
          ✅ Conferma Lavorazione
          {selezionati.size > 0 && ` (${selezionati.size})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}