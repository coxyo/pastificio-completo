// components/LavorazionePopup.js
// ✅ NUOVO 04/03/2026: Popup selezione prodotti in lavorazione
// ✅ 07/03/2026: Aggiunto supporto "Dolci misti" prodotto singolo (composizione standard)
// Appare al click su "L" per ordini con vassoio, più prodotti, o dolci misti
// Permette di selezionare quali componenti sono già stati messi da parte
// Il riepilogo produzione si aggiorna sottraendo i prodotti "in_lavorazione"

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, Chip, Divider,
  Alert, IconButton, List, ListItem,
  ListItemIcon, ListItemText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BuildIcon from '@mui/icons-material/Build';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import SelectAllIcon from '@mui/icons-material/SelectAll';

// ===================================================
// COSTANTE: Composizione standard Dolci Misti
// Deve essere identica a COMPOSIZIONE_DOLCI_MISTI in GestoreOrdini.js
// ===================================================
const COMPOSIZIONE_DOLCI_MISTI = {
  Pardulas: 0.40,
  Ciambelle: 0.25,
  Amaretti: 0.15,
  Gueffus: 0.05,
  Pabassine: 0.05,
  Bianchini: 0.03
};

const PEZZI_PER_KG_DOLCI = {
  Pardulas: 25,
  Ciambelle: 30,
  Amaretti: 35,
  Gueffus: 65,
  Pabassine: 30,
  Bianchini: 100,
};

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
// HELPER: Determina se un prodotto è "Dolci misti" singolo (non vassoio)
// ===================================================
export const isDolciMistiSingolo = (prodotto) => {
  if (!prodotto) return false;
  const nome = (prodotto.nome || '').toLowerCase();
  return (nome.includes('dolci mix') || nome.includes('dolci misti')) && !nome.includes('vassoio');
};

// ===================================================
// HELPER: Genera i componenti standard da un prodotto "Dolci misti" singolo
// ===================================================
const generaComponentiDolciMisti = (prodotto, indiceProdotto) => {
  const unita = (prodotto.unita || prodotto.unitaMisura || 'kg').toLowerCase();
  const pesoKg = unita === 'kg' ? (prodotto.quantita || 0) : (prodotto.quantita || 0) * 0.1;

  return Object.entries(COMPOSIZIONE_DOLCI_MISTI).map(([nome, percentuale], indiceComp) => {
    const pesoComp = pesoKg * percentuale;
    const pezziKg = PEZZI_PER_KG_DOLCI[nome] || 30;
    const pezzi = Math.round(pesoComp * pezziKg);
    const qtaDisplay = pesoComp >= 0.1
      ? `${(pesoComp * 1000).toFixed(0)}g (~${pezzi} pz)`
      : `~${pezzi} pz`;

    return {
      id: `dolcimisti-${indiceProdotto}-${indiceComp}`,
      indiceProdotto,
      indiceComp,
      nome,
      variante: null,
      quantita: pesoComp,
      unita: 'Kg',
      qtaDisplay,
      isDaVassoio: false,
      isDaDolciMisti: true,
      nomeVassoio: null,
    };
  });
};

// ===================================================
// HELPER: Estrae la lista prodotti "reali" da un ordine
// ===================================================
export const estraiProdottiLavorazione = (ordine) => {
  if (!ordine || !ordine.prodotti) return [];

  const prodotti = [];

  // ✅ FIX 14/03/2026: Pre-calcola quanti vassoi ci sono per numerarli
  const indiciVassoi = ordine.prodotti
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => isVassioMisto(p));
  const totalVassoi = indiciVassoi.length;

  // Mappa: indiceProdotto → numero vassio (1-based)
  const numerazioneVassoio = {};
  indiciVassoi.forEach(({ i }, contatore) => {
    numerazioneVassoio[i] = contatore + 1;
  });

  ordine.prodotti.forEach((prodotto, indiceProdotto) => {
    if (isVassioMisto(prodotto) && prodotto.dettagliCalcolo?.composizione) {
      // Vassoio: espandi i componenti
      const numVassoio = numerazioneVassoio[indiceProdotto];
      // ✅ FIX: Label vassoio include numero progressivo se ce ne sono più di uno
      const labelVassoio = totalVassoi > 1
        ? `Vassoio ${numVassoio} di ${totalVassoi}`
        : 'Vassoio';

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
          isDaDolciMisti: false,
          nomeVassoio: labelVassoio,
          numVassoio,          // ✅ numero progressivo
          totalVassoi,         // ✅ totale vassoi nell'ordine
        });
      });
    } else if (isDolciMistiSingolo(prodotto)) {
      // ✅ 07/03/2026: Dolci misti singolo → genera componenti composizione standard
      const componenti = generaComponentiDolciMisti(prodotto, indiceProdotto);
      prodotti.push(...componenti);
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
        isDaDolciMisti: false,
        nomeVassoio: null,
      });
    }
  });

  return prodotti;
};

// ===================================================
// HELPER: Determina se aprire il popup
// ===================================================
export const necessitaPopup = (ordine) => {
  if (!ordine || !ordine.prodotti) return false;

  // ✅ 07/03/2026: Vassoio richiede sempre il popup (anche con 1 solo componente)
  const haVassoio = ordine.prodotti.some(p => isVassioMisto(p));
  if (haVassoio) return true;

  // ✅ 07/03/2026: "Dolci misti" singolo richiede sempre il popup
  const haDolciMisti = ordine.prodotti.some(p => isDolciMistiSingolo(p));
  if (haDolciMisti) return true;

  // Tutti gli altri: apri popup solo se ci sono più componenti
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
  prodottiGiaInLavorazione = [],
}) {
  const prodottiDisponibili = useMemo(
    () => (ordine ? estraiProdottiLavorazione(ordine) : []),
    [ordine]
  );

  const [selezionati, setSelezionati] = useState(new Set());

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

  const selezionaTutti = () => setSelezionati(new Set(prodottiDisponibili.map((p) => p.id)));
  const deselezionaTutti = () => setSelezionati(new Set());

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

  const hasVassoio = prodottiDisponibili.some((p) => p.isDaVassoio);
  const hasDolciMisti = prodottiDisponibili.some((p) => p.isDaDolciMisti);
  // ✅ FIX 14/03/2026: conta vassoi distinti
  const numVassoiDistinti = hasVassoio
    ? (prodottiDisponibili.find(p => p.isDaVassoio)?.totalVassoi || 1)
    : 0;

  const sottotitolo = hasVassoio
    ? numVassoiDistinti > 1
      ? `${numVassoiDistinti} Vassoi Dolci Misti`
      : 'Vassoio Dolci Misti'
    : hasDolciMisti
    ? 'Dolci Misti — composizione standard'
    : null;

  if (!ordine) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      onClick={(e) => e.stopPropagation()}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <BuildIcon color="warning" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" component="span">
            Lavorazione — {ordine.nomeCliente}
          </Typography>
          {sottotitolo && (
            <Typography variant="caption" display="block" color="text.secondary">
              {sottotitolo}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2, pb: 1 }}>
        {hasDolciMisti && !hasVassoio && (
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.82rem' }}>
            Composizione <strong>standard</strong> (Pardulas 40%, Ciambelle 25%, Amaretti 15%...).
            Seleziona i componenti già messi da parte: gli altri rimangono nel riepilogo.
          </Alert>
        )}
        {!hasDolciMisti && (
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.85rem' }}>
            Seleziona i prodotti già <strong>messi da parte</strong>. Il riepilogo produzione si
            aggiornerà sottraendo le quantità selezionate.
          </Alert>
        )}

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
            {selezionati.size} / {prodottiDisponibili.length} componenti selezionati
          </Typography>
        </Box>

        <List dense disablePadding>
          {(() => {
            // ✅ FIX 14/03/2026: Raggruppa per vassoio se ci sono più vassoi
            const tuttiVassoi = prodottiDisponibili.filter(p => p.isDaVassoio);
            const totalVassoiDistinti = tuttiVassoi.length > 0
              ? (tuttiVassoi[0].totalVassoi || 1)
              : 0;
            const mostraGruppi = totalVassoiDistinti > 1;

            // Costruisce lista con header di gruppo intercalati
            const items = [];
            let lastVassoioNum = null;

            prodottiDisponibili.forEach((prodotto) => {
              // Se più vassoi e cambio gruppo → inserisci separatore
              if (mostraGruppi && prodotto.isDaVassoio && prodotto.numVassoio !== lastVassoioNum) {
                lastVassoioNum = prodotto.numVassoio;
                // Calcola se tutti i componenti di questo vassoio sono selezionati
                const compDiQuestoVassoio = prodottiDisponibili.filter(
                  p => p.isDaVassoio && p.numVassoio === prodotto.numVassoio
                );
                const tuttiSelezionatiVassoio = compDiQuestoVassoio.every(p => selezionati.has(p.id));

                items.push(
                  <Box
                    key={`header-vassoio-${prodotto.numVassoio}`}
                    sx={{
                      mt: prodotto.numVassoio > 1 ? 1.5 : 0,
                      mb: 0.5,
                      px: 1,
                      py: 0.4,
                      backgroundColor: 'rgba(255,152,0,0.12)',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      // Click sull'header → seleziona/deseleziona tutti i componenti del vassoio
                      const ids = compDiQuestoVassoio.map(p => p.id);
                      setSelezionati(prev => {
                        const next = new Set(prev);
                        if (tuttiSelezionatiVassoio) {
                          ids.forEach(id => next.delete(id));
                        } else {
                          ids.forEach(id => next.add(id));
                        }
                        return next;
                      });
                    }}
                  >
                    <Typography variant="caption" fontWeight={700} color="warning.dark">
                      🧺 {prodotto.nomeVassoio}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tuttiSelezionatiVassoio ? '✅ tutto selezionato' : 'clicca per sel. tutto'}
                    </Typography>
                  </Box>
                );
              }

              const isSelected = selezionati.has(prodotto.id);
              items.push(
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
                    ml: mostraGruppi && prodotto.isDaVassoio ? 1 : 0,  // indenta componenti vassoio
                    backgroundColor: isSelected ? 'rgba(255, 152, 0, 0.08)' : 'rgba(0,0,0,0.02)',
                    border: isSelected ? '1px solid rgba(255, 152, 0, 0.4)' : '1px solid rgba(0,0,0,0.08)',
                    '&:hover': {
                      backgroundColor: isSelected ? 'rgba(255, 152, 0, 0.15)' : 'rgba(0,0,0,0.05)',
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
                        {/* ✅ FIX: mostra chip vassoio solo se c'è UN solo vassoio */}
                        {prodotto.isDaVassoio && !mostraGruppi && (
                          <Chip label="vassoio" size="small"
                            sx={{ fontSize: '0.6rem', height: 16, '& .MuiChip-label': { px: 0.5 } }}
                            color="default" variant="outlined" />
                        )}
                        {prodotto.isDaDolciMisti && (
                          <Chip label="dolci misti" size="small"
                            sx={{ fontSize: '0.6rem', height: 16, '& .MuiChip-label': { px: 0.5 } }}
                            color="warning" variant="outlined" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color={isSelected ? 'warning.dark' : 'text.secondary'}>
                        {prodotto.qtaDisplay}{isSelected ? ' ✅' : ''}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            });

            return items;
          })()}
        </List>

        {selezionati.size > 0 && !tuttiSelezionati && (
          <Alert severity="warning" sx={{ mt: 2, fontSize: '0.8rem' }}>
            <strong>{selezionati.size} componenti</strong> scalati dal riepilogo.{' '}
            <strong>{prodottiDisponibili.length - selezionati.size}</strong> rimangono da preparare.
          </Alert>
        )}
        {tuttiSelezionati && (
          <Alert severity="success" sx={{ mt: 2, fontSize: '0.8rem' }}>
            Tutti i componenti selezionati — ordine completamente in lavorazione.
          </Alert>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} color="inherit" variant="outlined" size="small">
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
          Conferma Lavorazione{selezionati.size > 0 ? ` (${selezionati.size})` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}