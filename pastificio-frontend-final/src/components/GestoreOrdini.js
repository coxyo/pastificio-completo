// src/components/GestoreOrdini.js - ✅ VERSIONE COMPLETA CON CALLPOPUP + PUSHER + HACCP AUTO
// 🔄 Deploy forzato: 16/01/2026 ore 06:30 - Aggiunto popup HACCP automatico Martedì
// File unico completo - 2800+ linee
// Data aggiornamento: 16 Gennaio 2026

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Box, Container, Grid, Paper, Typography, 
  Snackbar, Alert, CircularProgress, IconButton, Chip, Button,
  LinearProgress, Menu, MenuItem, Divider, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Fab, Tooltip,
  InputAdornment, Table, TableBody, TableCell, TableHead, TableRow,
  Collapse, Card, CardContent
} from '@mui/material';
import { 
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
  CleaningServices as CleanIcon,
  WhatsApp as WhatsAppIcon,
  FileDownload as ExportIcon,
  Print as PrintIcon,
  Analytics as AnalyticsIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  ListAlt as ListAltIcon,
  Add as AddIcon,
  Sync as SyncIcon,
  LocalShipping as ShippingIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Phone as Phone,  // ✅ NUOVO per pulsante Storico Chiamate
  Search as SearchIcon,  // ✅ NUOVO per ricerca
  DateRange as DateRangeIcon,  // ✅ NUOVO per periodo
  Clear as ClearIcon,  // ✅ NUOVO per pulire ricerca
  Calculate as CalculateIcon,
  Timer as TimerIcon,  // ✅ NUOVO per calcolo totali
  ExpandMore as ExpandMoreIcon  // ✅ 12/02/2026 per triangolini dettagli
} from '@mui/icons-material';

import { PRODOTTI_CONFIG, getProdottoConfig, LISTA_PRODOTTI } from '../config/prodottiConfig';
import { BRAND } from '@/theme/theme'; // ✅ RESTYLING 04/03/2026: palette brand
import { 
  calcolaPrezzoOrdine, 
  formattaPrezzo,
  getUnitaMisuraDisponibili 
} from '../utils/calcoliPrezzi';

import NuovoOrdine from './NuovoOrdine';
import OrdiniList, { CATEGORIE } from './OrdiniList';
import InstallPWA from './InstallPWA';
import StatisticheWidget from './widgets/StatisticheWidget';
import RiepilogoGiornaliero from './RiepilogoGiornaliero';
import RiepilogoStampabile from './RiepilogoStampabile';
import GestioneLimiti from './GestioneLimiti';
import DashboardWhatsApp from './DashboardWhatsAppNuovo';

// ✅ NUOVO: Import per CallPopup e Pusher Integration
import CallPopup from './CallPopup';
import useIncomingCall from '@/hooks/useIncomingCall';  // ✅ AGGIUNTO

// ✅ NUOVISSIMO: Import per Tag e Statistiche Chiamate (16/11/2025)
import StoricoChiamate from './StoricoChiamate';
import GestioneZeppole from './GestioneZeppole';
import StatisticheChiamate from './StatisticheChiamate';
import { Cake as CakeIcon, Close as CloseIcon, Thermostat as ThermostatIcon } from '@mui/icons-material';

// ✅ NUOVO 28/02/2026: Alert automatici anomalie
import AlertBanner from './alerts/AlertBanner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
  API_URL.replace('https://', 'wss://').replace('http://', 'ws://').replace('/api', '');

// ═══════════════════════════════════════════════════════════════════════════
// 🆕 AGGIUNTO 22/01/2026: AUTO-REFRESH INTELLIGENTE + POLLING OTTIMIZZATO
// ═══════════════════════════════════════════════════════════════════════════
const AUTO_REFRESH_CONFIG = {
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minuti
  WARNING_TIME: 60 * 1000, // Avviso 1 minuto prima
  POSTPONE_TIME: 10 * 60 * 1000, // Posticipa 10 minuti
  ENABLED: true,
  SAVE_STATE_BEFORE_REFRESH: true,
};

const POLLING_CONFIG = {
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minuti (ridotto da continuo)
  KEEP_ALIVE_INTERVAL: 10 * 60 * 1000, // 10 minuti
  LIMITI_CACHE_TIME: 2 * 60 * 1000, // Cache limiti 2 minuti
  DEBOUNCE_TIME: 1000, // 1 secondo debounce
};


// =============================================================
// COMPONENTE RIEPILOGO SEMPLICE
// =============================================================
function RiepilogoSemplice({ ordini, dataSelezionata }) {
  const ordiniFiltrati = ordini.filter(o => {
    const dataOrdine = o.dataRitiro || o.createdAt || '';
    return dataOrdine.startsWith(dataSelezionata);
  });

  const totale = ordiniFiltrati.reduce((sum, o) => sum + (o.totale || 0), 0);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Riepilogo del {new Date(dataSelezionata).toLocaleDateString('it-IT')}
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Ordini Totali</Typography>
            <Typography variant="h4">{ordiniFiltrati.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Incasso Totale</Typography>
            <Typography variant="h4">€{totale.toFixed(2)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
        Dettaglio Ordini:
      </Typography>
      
      {ordiniFiltrati.map((ordine, index) => (
        <Paper key={ordine._id || index} sx={{ p: 2, mb: 1 }}>
          <Grid container alignItems="center">
            <Grid item xs={6}>
              <Typography>{ordine.nomeCliente}</Typography>
              <Typography variant="caption">{ordine.telefono}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography>{ordine.oraRitiro || 'N/D'}</Typography>
            </Grid>
            <Grid item xs={3} sx={{ textAlign: 'right' }}>
              <Typography variant="h6">€{(ordine.totale || 0).toFixed(2)}</Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 1, pl: 2 }}>
            {(ordine.prodotti || []).map((p, idx) => {
              const risultatoCalcolo = p.dettagliCalcolo || {};
              return (
                <Typography key={idx} variant="body2" color="text.secondary">
                  • {p.nome} - {p.quantita} {p.unita} - €{(p.prezzo || 0).toFixed(2)}
                  {risultatoCalcolo.dettagli && (
                    <Typography 
                      component="span" 
                      variant="caption" 
                      sx={{ display: 'block', pl: 2, fontStyle: 'italic', color: 'info.main' }}
                    >
                      {risultatoCalcolo.dettagli}
                    </Typography>
                  )}
                </Typography>
              );
            })}
          </Box>
        </Paper>
      ))}
    
      
      {/* ✅ NUOVO 30/01/2026: Dialog Conferma WhatsApp Automatico */}
      <Dialog
        open={confermaWhatsAppOpen}
        onClose={() => !whatsappLoading && setConfermaWhatsAppOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WhatsAppIcon sx={{ color: 'success.main' }} />
            <Typography variant="h6">Ordine Pronto</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {whatsappLoading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress size={40} />
              <Typography sx={{ mt: 2 }}>
                Completamento ordine e invio WhatsApp...
              </Typography>
            </Box>
          ) : (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                L'ordine verrà segnato come completato e il cliente riceverà una notifica WhatsApp.
              </Alert>
              
              {ordineSelezionato && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Cliente:</strong> {ordineSelezionato.nomeCliente}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Telefono:</strong> {ordineSelezionato.telefono || 'Non disponibile'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Ordine:</strong> {ordineSelezionato.numeroOrdine || ordineSelezionato.id}
                  </Typography>
                  
                  {ordineSelezionato.prodotti && ordineSelezionato.prodotti.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Prodotti:</strong>
                      </Typography>
                      <Box sx={{ pl: 2, mt: 0.5 }}>
                        {ordineSelezionato.prodotti.slice(0, 3).map((p, i) => (
                          <Typography key={i} variant="caption" display="block">
                            • {p.nome}
                            {p.stato && ` (${p.stato})`}
                          </Typography>
                        ))}
                        {ordineSelezionato.prodotti.length > 3 && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            ...e altri {ordineSelezionato.prodotti.length - 3} prodotti
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {whatsappError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {whatsappError}
                </Alert>
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Cosa succederà:</strong><br />
                1. Ordine segnato come completato<br />
                2. Tentativo invio automatico via API<br />
                3. Se fallisce, apertura WhatsApp manuale
              </Alert>
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          {!whatsappLoading && (
            <>
              <Button 
                onClick={() => setConfermaWhatsAppOpen(false)}
                disabled={whatsappLoading}
              >
                Annulla
              </Button>
              <Button
                onClick={() => handleCompletaOrdineConWhatsApp(ordineSelezionato, false)}
                disabled={whatsappLoading}
                color="warning"
              >
                Solo Completa (no WhatsApp)
              </Button>
              <Button
                onClick={() => handleCompletaOrdineConWhatsApp(ordineSelezionato, true)}
                disabled={whatsappLoading || !ordineSelezionato?.telefono}
                variant="contained"
                color="success"
                startIcon={<WhatsAppIcon />}
              >
                Sì, Completa e Invia WhatsApp
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

</Box>
  );
}

// =============================================================
// ✅ AGGIORNATO 10/12/2025: COMPONENTE TOTALI PRODUZIONE DETTAGLIATI
// =============================================================
const PEZZI_PER_KG_TOTALI = {
  'Ravioli': 30, 'Culurgiones': 32, 'Pardulas': 25,
  'Amaretti': 35, 'Bianchini': 100, 'Papassinas': 30, 'Pabassine': 30,
  'Gueffus': 65, 'Ciambelle': 30, 'Sebadas': 10, 
  'Panadine': 20, 'Panada': 4, 'Pizzette': 30, 'Zeppole': 24
};

// ✅ Composizione standard DOLCI MISTI (1 kg)
const COMPOSIZIONE_DOLCI_MISTI = {
  Pardulas: 0.40,    // 400g
  Ciambelle: 0.25,   // 250g
  Amaretti: 0.15,    // 150g
  Gueffus: 0.05,     // 50g
  Pabassine: 0.05,   // 50g
  Bianchini: 0.03    // 30g (3 pezzi)
};

function TotaliProduzione({ ordini, dataSelezionata }) {
  // ✅ 12/02/2026: State per dettagli espandibili
  const [dettagliAperti, setDettagliAperti] = useState({});
  
  const toggleDettaglio = (categoria) => {
    setDettagliAperti(prev => ({ ...prev, [categoria]: !prev[categoria] }));
  };

  // Filtra ordini per data
  const ordiniFiltrati = ordini.filter(o => {
    const dataOrdine = o.dataRitiro || o.createdAt || '';
    return dataOrdine.startsWith(dataSelezionata);
  });

  // Funzione per convertire in KG
  const convertiInKg = (prodotto) => {
    const unita = (prodotto.unita || 'kg').toLowerCase();
    const quantita = prodotto.quantita || 0;
    const nomeLC = (prodotto.nome || '').toLowerCase();
    
      // ✅ FIX 12/03/2026: Converti € in Kg per TUTTI i prodotti (da PRODOTTI_CONFIG)
      if (unita === '€' || unita === 'euro') {
        const PREZZI_EURO_KG = [
          { keys: ['culurgion'],                                     prezzoKg: 16 },
          { keys: ['ravioli'],                                       prezzoKg: 11 },
          { keys: ['pardula'],                                       prezzoKg: 20 },
          { keys: ['ciambelle', 'ciambella', 'chiaccher'],           prezzoKg: 17 },
          { keys: ['amarett'],                                       prezzoKg: 22 },
          { keys: ['papassin', 'pabassine', 'pabassinas'],           prezzoKg: 22 },
          { keys: ['gueff'],                                         prezzoKg: 22 },
          { keys: ['bianchin'],                                      prezzoKg: 15 },
          { keys: ['zeppol'],                                        prezzoKg: 21 },
          { keys: ['torta di saba', 'torta'],                        prezzoKg: 26 },
          { keys: ['dolci misti', 'dolci mix'],                      prezzoKg: 19 },
          { keys: ['panada anguill'],                                prezzoKg: 30 },
          { keys: ['panada di agnello', 'panada agnello'],           prezzoKg: 25 },
          { keys: ['panada di maiale', 'panada maiale'],             prezzoKg: 21 },
          { keys: ['panada di vitella', 'panada vitella'],           prezzoKg: 23 },
          { keys: ['panada di verdur', 'panada verdur'],             prezzoKg: 17 },
          { keys: ['panadine'],                                      prezzoKg: 28 },
          { keys: ['pasta per panada', 'pasta panada'],              prezzoKg:  5 },
          { keys: ['pizzette'],                                      prezzoKg: 16 },
          { keys: ['fregula', 'fregola'],                            prezzoKg: 10 },
        ];
        for (const { keys, prezzoKg } of PREZZI_EURO_KG) {
          if (keys.some(k => nomeLC.includes(k))) return quantita / prezzoKg;
        }
        return 0;
      }
    
    if (unita === 'kg' || unita === 'kilogrammi') return quantita;
    if (unita === 'pezzi' || unita === 'pz') {
      for (const [nome, pezziKg] of Object.entries(PEZZI_PER_KG_TOTALI)) {
        if (prodotto.nome.toLowerCase().includes(nome.toLowerCase())) {
          return quantita / pezziKg;
        }
      }
      return quantita / 30;
    }
    if (unita === 'vassoio' && prodotto.dettagliCalcolo?.composizione) {
      return prodotto.dettagliCalcolo.composizione.reduce((acc, comp) => {
        if (comp.unita === 'Kg') return acc + comp.quantita;
        if (comp.unita === 'Pezzi') {
          for (const [nome, pezziKg] of Object.entries(PEZZI_PER_KG_TOTALI)) {
            if (comp.nome.toLowerCase().includes(nome.toLowerCase())) {
              return acc + comp.quantita / pezziKg;
            }
          }
          return acc + comp.quantita / 30;
        }
        return acc;
      }, 0);
    }
    return 0;
  };

  // ✅ Calcola totali DETTAGLIATI per ogni tipo di prodotto
  const calcolaTotaliDettagliati = () => {
    const totali = {
      // ✅ FIX 19/12/2025: Ravioli DETTAGLIATI per variante!
      RavioliZafferano: 0,
      RavioliZafferanoDolci: 0,
      RavioliZafferanoPocoDolci: 0,
      RavioliZafferanoMoltoDolci: 0,
      RavioliSpinaciZafferano: 0,
      RavioliSpinaci: 0,
      RavioliSpinaciDolci: 0,
      RavioliSpinaciPocoDolci: 0,
      RavioliSpinaciMoltoDolci: 0,
      RavioliDolci: 0,
      RavioliFormaggio: 0,
      RavioliAltri: 0, // Per ravioli senza variante specifica
      Culurgiones: 0,
      // Pardulas
      Pardulas: 0,
      // Dolci singoli
      Ciambelle: 0,
      Amaretti: 0,
      Gueffus: 0,
      Bianchini: 0,
      Pabassine: 0,
      Zeppole: 0,
      // Panadas (farcite)
      PanadaAgnello: 0,
      PanadaMaiale: 0,
      PanadaVitella: 0,
      PanadaVerdure: 0,
      PanadaAnguille: 0,
      Panadine: 0,
      // Altro
      PastaPerPanada: 0,
      Sebadas: 0,
      Pizzette: 0,
      Fregula: 0
    };
    
    // 🔍 DEBUG TEMPORANEO - rimuovere dopo verifica
    console.group('🔍 DEBUG calcolaTotaliDettagliati - ' + ordiniFiltrati.length + ' ordini');
    ordiniFiltrati.forEach(ordine => {
      (ordine.prodotti || []).forEach(prodotto => {
        // ✅ FIX 19/12/2025: Escludi prodotti "Fatto" (completato) e "Consegnato" dai totali
        if (prodotto.statoProduzione === 'completato' || 
            prodotto.statoProduzione === 'consegnato') {
          return; // Non contare questo prodotto nei totali
        }
        
        const nomeLC = prodotto.nome?.toLowerCase() || '';
        let peso = convertiInKg(prodotto);
        
        // 🔍 DEBUG
        console.log(`  ${ordine.cliente?.nome||'?'} | ${prodotto.nome} | ${prodotto.quantita} ${prodotto.unita} | stato:${prodotto.statoProduzione||'nuovo'} | peso:${peso.toFixed(3)} Kg`);
        
        if (peso === 0) return; // Ignora € e prodotti senza peso
        
        // ✅ FIX 07/03/2026: in_lavorazione va escluso PRIMA di tutto (anche vassoi)
        // ECCEZIONE 07/03/2026: "Dolci misti" in_lavorazione gestito sotto con logica granulare
        const isDolciMistiProdotto = (nomeLC.includes('dolci mix') || nomeLC.includes('dolci misti')) && !nomeLC.includes('vassoio');
        if (prodotto.statoProduzione === 'in_lavorazione' && !isDolciMistiProdotto) {
          return;
        }

        // ✅ FIX 15/12/2025: VASSOIO deve essere controllato PRIMA di "dolci misti"
        // perché "Vassoio Dolci Misti" contiene "dolci misti" come sottostringa!
        if (nomeLC.includes('vassoio') && prodotto.dettagliCalcolo?.composizione) {
          // ✅ FIX 07/03/2026: moltiplica per numero vassoi (prodotto.quantita)
          const numVassoi = prodotto.quantita || 1;
          prodotto.dettagliCalcolo.composizione.forEach(comp => {
            const compNome = comp.nome?.toLowerCase() || '';
            let compPeso = 0;
            if (comp.unita === 'Kg' || comp.unita === 'kg') compPeso = comp.quantita;
            else if (comp.unita === 'Pezzi' || comp.unita === 'pezzi' || comp.unita === 'pz') {
              // Converti pezzi in kg
              for (const [nome, pezziKg] of Object.entries(PEZZI_PER_KG_TOTALI)) {
                if (compNome.includes(nome.toLowerCase())) {
                  compPeso = comp.quantita / pezziKg;
                  break;
                }
              }
              if (compPeso === 0) compPeso = comp.quantita / 30;
            }
            // Moltiplica per numero vassoi
            compPeso = compPeso * numVassoi;
            
            // Classifica il componente
            if (compNome.includes('pardula')) totali.Pardulas += compPeso;
            else if (compNome.includes('ciambelle') || compNome.includes('ciambella')) totali.Ciambelle += compPeso;
            else if (compNome.includes('amarett')) totali.Amaretti += compPeso;
            else if (compNome.includes('gueff')) totali.Gueffus += compPeso;
            else if (compNome.includes('bianchin')) totali.Bianchini += compPeso;
            else if (compNome.includes('pabassine') || compNome.includes('papassin')) totali.Pabassine += compPeso;
          });
          return; // Non classificare ulteriormente il vassoio stesso
        }
        
        // ✅ CASO SPECIALE: DOLCI MIX / DOLCI MISTI generici (prodotto singolo, senza composizione vassoio)
        // ✅ 07/03/2026: gestione granulare quando in_lavorazione (popup componenti)
        if (isDolciMistiProdotto) {
          if (prodotto.statoProduzione === 'in_lavorazione' && Array.isArray(prodotto.prodottiInLavorazione) && prodotto.prodottiInLavorazione.length > 0) {
            // Calcola il peso già messo da parte per ogni componente
            const pesoGiaPronto = {};
            prodotto.prodottiInLavorazione.forEach(comp => {
              const compNomeLC = (comp.nome || '').toLowerCase();
              let compPeso = 0;
              if (comp.unita === 'Kg' || comp.unita === 'kg') {
                compPeso = comp.quantita || 0;
              } else if (comp.unita === 'Pezzi' || comp.unita === 'pezzi' || comp.unita === 'pz') {
                for (const [nome, pezziKg] of Object.entries(PEZZI_PER_KG_TOTALI)) {
                  if (compNomeLC.includes(nome.toLowerCase())) {
                    compPeso = (comp.quantita || 0) / pezziKg;
                    break;
                  }
                }
                if (compPeso === 0) compPeso = (comp.quantita || 0) / 30;
              }
              // Mappa nome componente → chiave totali
              if (compNomeLC.includes('pardula')) pesoGiaPronto.Pardulas = (pesoGiaPronto.Pardulas || 0) + compPeso;
              else if (compNomeLC.includes('ciambelle') || compNomeLC.includes('ciambella')) pesoGiaPronto.Ciambelle = (pesoGiaPronto.Ciambelle || 0) + compPeso;
              else if (compNomeLC.includes('amarett')) pesoGiaPronto.Amaretti = (pesoGiaPronto.Amaretti || 0) + compPeso;
              else if (compNomeLC.includes('gueff')) pesoGiaPronto.Gueffus = (pesoGiaPronto.Gueffus || 0) + compPeso;
              else if (compNomeLC.includes('bianchin')) pesoGiaPronto.Bianchini = (pesoGiaPronto.Bianchini || 0) + compPeso;
              else if (compNomeLC.includes('pabassine') || compNomeLC.includes('papassin')) pesoGiaPronto.Pabassine = (pesoGiaPronto.Pabassine || 0) + compPeso;
            });
            // Aggiungi al riepilogo solo i componenti RIMANENTI (totale standard - già pronti)
            for (const [componente, percentuale] of Object.entries(COMPOSIZIONE_DOLCI_MISTI)) {
              const pesoTotaleComp = peso * percentuale;
              const giaPronto = pesoGiaPronto[componente] || 0;
              const rimanente = Math.max(0, pesoTotaleComp - giaPronto);
              if (rimanente > 0) {
                totali[componente] = (totali[componente] || 0) + rimanente;
              }
            }
          } else if (prodotto.statoProduzione !== 'in_lavorazione') {
            // Stato normale (nuovo): esplodi usando composizione standard
            for (const [componente, percentuale] of Object.entries(COMPOSIZIONE_DOLCI_MISTI)) {
              totali[componente] = (totali[componente] || 0) + (peso * percentuale);
            }
          }
          // Se in_lavorazione senza prodottiInLavorazione: escludi tutto (già messo da parte interamente)
          return; // Non classificare ulteriormente
        }
        
        // ✅ FIX 27/12/2025: Classifica prodotto (RAVIOLI per TUTTE le varianti, combinazioni PRIMA!)
        if (nomeLC.includes('ravioli')) {
          // ⭐ IMPORTANTE: Controllare COMBINAZIONI PRIMA (zafferano + dolci, spinaci + dolci, etc.)
          if (nomeLC.includes('zafferano') && nomeLC.includes('molto dolci')) {
            totali.RavioliZafferanoMoltoDolci += peso;
          } else if (nomeLC.includes('zafferano') && nomeLC.includes('poco dolci')) {
            totali.RavioliZafferanoPocoDolci += peso;
          } else if (nomeLC.includes('zafferano') && nomeLC.includes('dolci')) {
            totali.RavioliZafferanoDolci += peso; // ⭐ "Ravioli zafferano dolci" → QUI!
          } else if (nomeLC.includes('spinaci') && nomeLC.includes('molto dolci')) {
            totali.RavioliSpinaciMoltoDolci += peso;
          } else if (nomeLC.includes('spinaci') && nomeLC.includes('poco dolci')) {
            totali.RavioliSpinaciPocoDolci += peso;
          } else if (nomeLC.includes('spinaci') && nomeLC.includes('dolci')) {
            totali.RavioliSpinaciDolci += peso;
          } else if (nomeLC.includes('zafferano') && nomeLC.includes('spinaci')) {
            totali.RavioliSpinaciZafferano += peso;
          }
          // POI: Singole varianti
          else if (nomeLC.includes('zafferano')) {
            totali.RavioliZafferano += peso;
          } else if (nomeLC.includes('spinaci')) {
            totali.RavioliSpinaci += peso;
          } else if (nomeLC.includes('dolci') || nomeLC.includes('dolce')) {
            totali.RavioliDolci += peso;
          } else if (nomeLC.includes('formaggio') || nomeLC.includes('ricotta')) {
            totali.RavioliFormaggio += peso;
          } else {
            // Ravioli generici o altre varianti
            totali.RavioliAltri += peso;
          }
        }
        else if (nomeLC.includes('culurgion')) totali.Culurgiones += peso;
        else if (nomeLC.includes('pardula')) totali.Pardulas += peso;
        else if (nomeLC.includes('ciambelle') || nomeLC.includes('ciambella')) totali.Ciambelle += peso;
        else if (nomeLC.includes('amarett')) totali.Amaretti += peso;
        else if (nomeLC.includes('gueff')) totali.Gueffus += peso;
        else if (nomeLC.includes('bianchin')) totali.Bianchini += peso;
        else if (nomeLC.includes('pabassine') || nomeLC.includes('papassin') || nomeLC.includes('pabassinas')) totali.Pabassine += peso;
        else if (nomeLC.includes('zeppol')) totali.Zeppole += peso;
        else if (nomeLC.includes('panadine')) totali.Panadine += peso;
        // ✅ FIX: Separa "Pasta per panada" dalle Panadas farcite
        else if (nomeLC.includes('pasta per panada') || nomeLC === 'pasta panada') totali.PastaPerPanada += peso;
        else if (nomeLC.includes('panada') && nomeLC.includes('agnello')) totali.PanadaAgnello += peso;
        else if (nomeLC.includes('panada') && nomeLC.includes('maiale')) totali.PanadaMaiale += peso;
        else if (nomeLC.includes('panada') && nomeLC.includes('vitella')) totali.PanadaVitella += peso;
        else if (nomeLC.includes('panada') && nomeLC.includes('verdur')) totali.PanadaVerdure += peso;
        else if (nomeLC.includes('panada') && nomeLC.includes('anguill')) totali.PanadaAnguille += peso;
        else if (nomeLC.includes('sebada')) totali.Sebadas += peso;
        else if (nomeLC.includes('pizzette')) totali.Pizzette += peso;
        else if (nomeLC.includes('fregula') || nomeLC.includes('fregola')) totali.Fregula += peso;
        else {
          // ✅ Log prodotti non classificati per debug
          console.warn(`⚠️ Prodotto non classificato: "${prodotto.nome}" (${peso.toFixed(2)} kg)`);
        }
      });
    });
    
    return totali;
  };

  // ✅ FIX 19/12/2025 v2: useMemo per ricalcolare totali quando ordini cambiano!
  const totali = useMemo(() => {
    console.log('🔄 Ricalcolo totali produzione...');
    return calcolaTotaliDettagliati();
  }, [ordini, dataSelezionata]); // Ricalcola quando ordini o data cambiano
  
  // ✅ FIX 19/12/2025: Raggruppa per macro-categoria (RAVIOLI dettagliati!)
  const totaleRavioli = totali.RavioliZafferano + totali.RavioliZafferanoDolci + totali.RavioliZafferanoPocoDolci + totali.RavioliZafferanoMoltoDolci + totali.RavioliSpinaciZafferano + totali.RavioliSpinaci + totali.RavioliSpinaciDolci + totali.RavioliSpinaciPocoDolci + totali.RavioliSpinaciMoltoDolci + totali.RavioliDolci + totali.RavioliFormaggio + totali.RavioliAltri + totali.Culurgiones;
  const totalePardulas = totali.Pardulas;
  const totaleDolci = totali.Ciambelle + totali.Amaretti + totali.Gueffus + totali.Bianchini + totali.Pabassine; // ✅ RIMOSSO Zeppole
  // ✅ FIX: Panadas farcite separate
  const totalePanadas = totali.PanadaAgnello + totali.PanadaMaiale + totali.PanadaVitella + totali.PanadaVerdure + totali.PanadaAnguille;
  // ✅ NUOVO 30/12/2025: Gruppi separati per Seabadas, Zeppole, Panadine
  const totaleSebadas = totali.Sebadas;
  const totaleZeppole = totali.Zeppole;
  const totalePanadine = totali.Panadine;
  const totalePasta = totali.PastaPerPanada; // ✅ NUOVO 30/12/2025: Pasta separata
  const totaleAltri = totali.Pizzette + totali.Fregula; // ✅ RIMOSSO Panadine, Sebadas e Pasta
  console.log('🔍 TOTALI PARDULAS DEBUG:', totalePardulas.toFixed(3), '| DOLCI:', totaleDolci.toFixed(3), '| TOT:', totaleGenerale.toFixed(3));
  console.groupEnd();
  const totaleGenerale = totaleRavioli + totalePardulas + totaleDolci + totalePanadas + totaleSebadas + totaleZeppole + totalePanadine + totalePasta + totaleAltri;

  if (totaleGenerale === 0) return null;

  // Helper per formattare chip
  const ChipDettaglio = ({ label, value, color }) => value > 0.05 ? (
    <Chip 
      label={`${label}: ${value.toFixed(1)} KG`} 
      size="small"
      sx={{ fontWeight: 500, fontSize: '0.75rem' }}
      color={color}
      variant="outlined"
    />
  ) : null;

  return (
    <Paper sx={{
      p: { xs: 1.5, sm: 2 }, mb: 2,
      background: `linear-gradient(135deg, rgba(46,123,0,0.04) 0%, rgba(200,168,48,0.06) 100%)`,
      border: `1px solid rgba(46,123,0,0.15)`,
      borderTop: `3px solid ${BRAND.green}`,
      borderRadius: 2,
      boxShadow: '0 2px 8px rgba(46,123,0,0.08)',
    }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 800, color: BRAND.greenDark, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        📊 Totali Produzione — {new Date(dataSelezionata).toLocaleDateString('it-IT')}
      </Typography>
      
      {/* Riga principale con macro-totali */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        {totaleRavioli > 0 && (
          <Chip 
            label={`🥟 Ravioli: ${totaleRavioli.toFixed(1)} KG`} 
            sx={{ fontWeight: 'bold', cursor: 'pointer', backgroundColor: CATEGORIE.RAVIOLI.colore, color: 'white' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('RAVIOLI')}
          />
        )}
        {totalePardulas > 0 && (
          <Chip 
            label={`🟡 Pardulas: ${totalePardulas.toFixed(1)} KG`} 
            sx={{ fontWeight: 'bold', cursor: 'pointer', backgroundColor: CATEGORIE.PARDULAS.colore, color: 'white' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('PARDULAS')}
          />
        )}
        {totaleDolci > 0 && (
          <Chip 
            label={`🍪 Dolci: ${totaleDolci.toFixed(1)} KG`} 
            sx={{ fontWeight: 'bold', cursor: 'pointer', backgroundColor: CATEGORIE.DOLCI.colore, color: '#333' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('DOLCI')}
          />
        )}
        {totalePanadas > 0 && (
          <Chip 
            label={`🥧 Panadas: ${totalePanadas.toFixed(1)} KG`} 
            sx={{ fontWeight: 'bold', backgroundColor: CATEGORIE.PANADAS.colore, color: 'white', cursor: 'pointer' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('PANADAS')}
          />
        )}
        {totaleSebadas > 0 && (
          <Chip 
            label={`🍪 Seabadas: ${totaleSebadas.toFixed(1)} KG`} 
            sx={{ fontWeight: 'bold', backgroundColor: CATEGORIE.SEABADAS.colore, color: 'white', cursor: 'pointer' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('SEABADAS')}
          />
        )}
        {totaleZeppole > 0 && (
          <Chip 
            label={`🍩 Zeppole: ${totaleZeppole.toFixed(1)} KG`} 
            sx={{ fontWeight: 'bold', backgroundColor: CATEGORIE.ZEPPOLE.colore, color: 'white', cursor: 'pointer' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('ZEPPOLE')}
          />
        )}
        {totalePanadine > 0 && (
          <Chip 
            label={`🥐 Panadine: ${totalePanadine.toFixed(1)} KG`} 
            sx={{ fontWeight: 'bold', backgroundColor: CATEGORIE.PANADINE.colore, color: 'white', cursor: 'pointer' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('PANADINE')}
          />
        )}
        {totalePasta > 0 && (
          <Chip 
            label={`🍝 Pasta: ${totalePasta.toFixed(1)} KG`} 
            sx={{ fontWeight: 'bold', backgroundColor: CATEGORIE.PASTA.colore, color: 'white', cursor: 'pointer' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('PASTA')}
          />
        )}
        {totaleAltri > 0 && (
          <Chip 
            label={`📦 Altri: ${totaleAltri.toFixed(1)} KG`} 
            sx={{ fontWeight: 'bold', cursor: 'pointer', backgroundColor: CATEGORIE.ALTRI.colore, color: '#333' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('ALTRI')}
          />
        )}
        <Chip label={`TOTALE: ${totaleGenerale.toFixed(1)} KG`} color="primary" sx={{ fontWeight: 'bold', ml: 'auto' }} />
      </Box>
      
      {/* ✅ 12/02/2026: Dettaglio RAVIOLI espandibile con triangolino */}
      {totaleRavioli > 0 && (
        <Box sx={{ mt: 1, pl: 2, borderLeft: '3px solid #f44336' }}>
          <Box 
            onClick={() => toggleDettaglio('ravioli')}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
          >
            <ExpandMoreIcon sx={{ 
              fontSize: 18, mr: 0.5, color: '#666',
              transform: dettagliAperti.ravioli ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s'
            }} />
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>Dettaglio Ravioli:</Typography>
          </Box>
          <Collapse in={!!dettagliAperti.ravioli}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              <ChipDettaglio label="R.Zaff" value={totali.RavioliZafferano} color="error" />
              <ChipDettaglio label="R.Zaff.Dolci" value={totali.RavioliZafferanoDolci} color="error" />
              <ChipDettaglio label="R.Zaff.PocoDolci" value={totali.RavioliZafferanoPocoDolci} color="error" />
              <ChipDettaglio label="R.Zaff.MoltoDolci" value={totali.RavioliZafferanoMoltoDolci} color="error" />
              <ChipDettaglio label="R.Spin+Zaff" value={totali.RavioliSpinaciZafferano} color="error" />
              <ChipDettaglio label="R.Spin" value={totali.RavioliSpinaci} color="error" />
              <ChipDettaglio label="R.Spin.Dolci" value={totali.RavioliSpinaciDolci} color="error" />
              <ChipDettaglio label="R.Spin.PocoDolci" value={totali.RavioliSpinaciPocoDolci} color="error" />
              <ChipDettaglio label="R.Spin.MoltoDolci" value={totali.RavioliSpinaciMoltoDolci} color="error" />
              <ChipDettaglio label="R.Dolci" value={totali.RavioliDolci} color="error" />
              <ChipDettaglio label="R.Formagg" value={totali.RavioliFormaggio} color="error" />
              <ChipDettaglio label="R.Altri" value={totali.RavioliAltri} color="error" />
              <ChipDettaglio label="Culurg" value={totali.Culurgiones} color="error" />
            </Box>
          </Collapse>
        </Box>
      )}
      
      {/* ✅ 12/02/2026: Dettaglio DOLCI espandibile */}
      {totaleDolci > 0 && (
        <Box sx={{ mt: 1, pl: 2, borderLeft: '3px solid #4caf50' }}>
          <Box 
            onClick={() => toggleDettaglio('dolci')}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
          >
            <ExpandMoreIcon sx={{ 
              fontSize: 18, mr: 0.5, color: '#666',
              transform: dettagliAperti.dolci ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s'
            }} />
            <Typography variant="caption" sx={{ color: '#666' }}>Dettaglio Dolci:</Typography>
          </Box>
          <Collapse in={!!dettagliAperti.dolci}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              <ChipDettaglio label="Ciambelle" value={totali.Ciambelle} color="success" />
              <ChipDettaglio label="Amaretti" value={totali.Amaretti} color="success" />
              <ChipDettaglio label="Gueffus" value={totali.Gueffus} color="success" />
              <ChipDettaglio label="Bianchini" value={totali.Bianchini} color="success" />
              <ChipDettaglio label="Pabassine" value={totali.Pabassine} color="success" />
            </Box>
          </Collapse>
        </Box>
      )}
      
      {/* ✅ 12/02/2026: Dettaglio PANADAS espandibile */}
      {totalePanadas > 0 && (
        <Box sx={{ mt: 1, pl: 2, borderLeft: '3px solid #ff9800' }}>
          <Box 
            onClick={() => toggleDettaglio('panadas')}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
          >
            <ExpandMoreIcon sx={{ 
              fontSize: 18, mr: 0.5, color: '#666',
              transform: dettagliAperti.panadas ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s'
            }} />
            <Typography variant="caption" sx={{ color: '#666' }}>Dettaglio Panadas:</Typography>
          </Box>
          <Collapse in={!!dettagliAperti.panadas}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              <ChipDettaglio label="Agnello" value={totali.PanadaAgnello} color="warning" />
              <ChipDettaglio label="Maiale" value={totali.PanadaMaiale} color="warning" />
              <ChipDettaglio label="Vitella" value={totali.PanadaVitella} color="warning" />
              <ChipDettaglio label="Verdure" value={totali.PanadaVerdure} color="warning" />
              <ChipDettaglio label="Anguille" value={totali.PanadaAnguille} color="warning" />
            </Box>
          </Collapse>
        </Box>
      )}
      
      {/* ✅ 12/02/2026: Dettaglio ALTRI espandibile */}
      {totaleAltri > 0 && (
        <Box sx={{ mt: 1, pl: 2, borderLeft: '3px solid #2196f3' }}>
          <Box 
            onClick={() => toggleDettaglio('altri')}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
          >
            <ExpandMoreIcon sx={{ 
              fontSize: 18, mr: 0.5, color: '#666',
              transform: dettagliAperti.altri ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s'
            }} />
            <Typography variant="caption" sx={{ color: '#666' }}>Dettaglio Altri:</Typography>
          </Box>
          <Collapse in={!!dettagliAperti.altri}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              <ChipDettaglio label="Pasta Panada" value={totali.PastaPerPanada} color="info" />
              <ChipDettaglio label="Pizzette" value={totali.Pizzette} color="info" />
              <ChipDettaglio label="Fregula" value={totali.Fregula} color="info" />
            </Box>
          </Collapse>
        </Box>
      )}
    </Paper>
  );
}

// =============================================================
// COMPONENTE WHATSAPP HELPER  
// =============================================================
function WhatsAppHelperComponent({ ordini }) {
  const [selectedOrdine, setSelectedOrdine] = useState(null);
  const [messaggio, setMessaggio] = useState('');

  useEffect(() => {
    if (selectedOrdine) {
      const prodottiText = selectedOrdine.prodotti.map(p => 
        `- ${p.nome}: ${p.quantita} ${p.unita} (€${(p.prezzo || 0).toFixed(2)})`
      ).join('\n');

      const msg = `🍝 *Pastificio Nonna Claudia*\n\nCiao ${selectedOrdine.nomeCliente}!\n\nIl tuo ordine è pronto per il ritiro:\n\n${prodottiText}\n\n*Totale: €${(selectedOrdine.totale || 0).toFixed(2)}*\n\nOra ritiro: ${selectedOrdine.oraRitiro || 'da confermare'}\n\nGrazie! 😊`;
      
      setMessaggio(msg);
    }
  }, [selectedOrdine]);

  const inviaWhatsApp = () => {
    if (!selectedOrdine) return;
    
    const numero = selectedOrdine.telefono.replace(/\D/g, '');
    const numeroCompleto = numero.startsWith('39') ? numero : `39${numero}`;
    const messaggioCodificato = encodeURIComponent(messaggio);
    
    window.open(`https://wa.me/${numeroCompleto}?text=${messaggioCodificato}`, '_blank');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Invia conferma WhatsApp</Typography>
      
      <TextField
        select
        fullWidth
        label="Seleziona Ordine"
        value={selectedOrdine?._id || ''}
        onChange={(e) => {
          const ordine = ordini.find(o => o._id === e.target.value);
          setSelectedOrdine(ordine);
        }}
        sx={{ mb: 2 }}
      >
        {ordini.map(o => (
          <MenuItem key={o._id} value={o._id}>
            {o.nomeCliente} - {o.dataRitiro} {o.oraRitiro} - €{(o.totale || 0).toFixed(2)}
          </MenuItem>
        ))}
      </TextField>

      {selectedOrdine && (
        <>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={messaggio}
            onChange={(e) => setMessaggio(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <Button 
            fullWidth
            variant="contained" 
            color="success"
            startIcon={<WhatsAppIcon />}
            onClick={inviaWhatsApp}
          >
            Invia su WhatsApp
          </Button>
        </>
      )}
    
      
      {/* ✅ NUOVO 30/01/2026: Dialog Conferma WhatsApp Automatico */}
      <Dialog
        open={confermaWhatsAppOpen}
        onClose={() => !whatsappLoading && setConfermaWhatsAppOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WhatsAppIcon sx={{ color: 'success.main' }} />
            <Typography variant="h6">Ordine Pronto</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {whatsappLoading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress size={40} />
              <Typography sx={{ mt: 2 }}>
                Completamento ordine e invio WhatsApp...
              </Typography>
            </Box>
          ) : (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                L'ordine verrà segnato come completato e il cliente riceverà una notifica WhatsApp.
              </Alert>
              
              {ordineSelezionato && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Cliente:</strong> {ordineSelezionato.nomeCliente}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Telefono:</strong> {ordineSelezionato.telefono || 'Non disponibile'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Ordine:</strong> {ordineSelezionato.numeroOrdine || ordineSelezionato.id}
                  </Typography>
                  
                  {ordineSelezionato.prodotti && ordineSelezionato.prodotti.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Prodotti:</strong>
                      </Typography>
                      <Box sx={{ pl: 2, mt: 0.5 }}>
                        {ordineSelezionato.prodotti.slice(0, 3).map((p, i) => (
                          <Typography key={i} variant="caption" display="block">
                            • {p.nome}
                            {p.stato && ` (${p.stato})`}
                          </Typography>
                        ))}
                        {ordineSelezionato.prodotti.length > 3 && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            ...e altri {ordineSelezionato.prodotti.length - 3} prodotti
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {whatsappError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {whatsappError}
                </Alert>
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Cosa succederà:</strong><br />
                1. Ordine segnato come completato<br />
                2. Tentativo invio automatico via API<br />
                3. Se fallisce, apertura WhatsApp manuale
              </Alert>
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          {!whatsappLoading && (
            <>
              <Button 
                onClick={() => setConfermaWhatsAppOpen(false)}
                disabled={whatsappLoading}
              >
                Annulla
              </Button>
              <Button
                onClick={() => handleCompletaOrdineConWhatsApp(ordineSelezionato, false)}
                disabled={whatsappLoading}
                color="warning"
              >
                Solo Completa (no WhatsApp)
              </Button>
              <Button
                onClick={() => handleCompletaOrdineConWhatsApp(ordineSelezionato, true)}
                disabled={whatsappLoading || !ordineSelezionato?.telefono}
                variant="contained"
                color="success"
                startIcon={<WhatsAppIcon />}
              >
                Sì, Completa e Invia WhatsApp
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

</Box>
  );
}

// =============================================================
// COMPONENTE TOTALI PER PERIODO - NUOVO 11/12/2025
// =============================================================
function TotaliPeriodoComponent({ ordini, dataInizio, dataFine }) {
  // Filtra ordini per periodo
  const ordiniFiltrati = ordini.filter(o => {
    const dataOrdine = (o.dataRitiro || o.createdAt || '').split('T')[0];
    return dataOrdine >= dataInizio && dataOrdine <= dataFine;
  });

  // Funzione per convertire in KG (copia da TotaliProduzione)
  const convertiInKg = (prodotto) => {
    const unita = (prodotto.unita || 'kg').toLowerCase();
    const quantita = prodotto.quantita || 0;
    const nomeLC = (prodotto.nome || '').toLowerCase();
    
      // ✅ FIX 12/03/2026: Converti € in Kg per TUTTI i prodotti (da PRODOTTI_CONFIG)
      if (unita === '€' || unita === 'euro') {
        const PREZZI_EURO_KG = [
          { keys: ['culurgion'],                                     prezzoKg: 16 },
          { keys: ['ravioli'],                                       prezzoKg: 11 },
          { keys: ['pardula'],                                       prezzoKg: 20 },
          { keys: ['ciambelle', 'ciambella', 'chiaccher'],           prezzoKg: 17 },
          { keys: ['amarett'],                                       prezzoKg: 22 },
          { keys: ['papassin', 'pabassine', 'pabassinas'],           prezzoKg: 22 },
          { keys: ['gueff'],                                         prezzoKg: 22 },
          { keys: ['bianchin'],                                      prezzoKg: 15 },
          { keys: ['zeppol'],                                        prezzoKg: 21 },
          { keys: ['torta di saba', 'torta'],                        prezzoKg: 26 },
          { keys: ['dolci misti', 'dolci mix'],                      prezzoKg: 19 },
          { keys: ['panada anguill'],                                prezzoKg: 30 },
          { keys: ['panada di agnello', 'panada agnello'],           prezzoKg: 25 },
          { keys: ['panada di maiale', 'panada maiale'],             prezzoKg: 21 },
          { keys: ['panada di vitella', 'panada vitella'],           prezzoKg: 23 },
          { keys: ['panada di verdur', 'panada verdur'],             prezzoKg: 17 },
          { keys: ['panadine'],                                      prezzoKg: 28 },
          { keys: ['pasta per panada', 'pasta panada'],              prezzoKg:  5 },
          { keys: ['pizzette'],                                      prezzoKg: 16 },
          { keys: ['fregula', 'fregola'],                            prezzoKg: 10 },
        ];
        for (const { keys, prezzoKg } of PREZZI_EURO_KG) {
          if (keys.some(k => nomeLC.includes(k))) return quantita / prezzoKg;
        }
        return 0;
      }
    
    if (unita === 'kg' || unita === 'kilogrammi') return quantita;
    if (unita === 'pezzi' || unita === 'pz') {
      for (const [nome, pezziKg] of Object.entries(PEZZI_PER_KG_TOTALI)) {
        if (prodotto.nome.toLowerCase().includes(nome.toLowerCase())) {
          return quantita / pezziKg;
        }
      }
      return quantita / 30;
    }
    if (unita === 'vassoio' && prodotto.dettagliCalcolo?.composizione) {
      return prodotto.dettagliCalcolo.composizione.reduce((acc, comp) => {
        if (comp.unita === 'Kg') return acc + comp.quantita;
        if (comp.unita === 'Pezzi') {
          for (const [nome, pezziKg] of Object.entries(PEZZI_PER_KG_TOTALI)) {
            if (comp.nome.toLowerCase().includes(nome.toLowerCase())) {
              return acc + comp.quantita / pezziKg;
            }
          }
          return acc + comp.quantita / 30;
        }
        return acc;
      }, 0);
    }
    return 0;
  };

  // Calcola totali per categoria
  const calcolaTotali = () => {
    const totali = {
      // ✅ FIX 19/12/2025: Ravioli DETTAGLIATI
      RavioliZafferano: 0,
      RavioliSpinaciZafferano: 0,
      RavioliSpinaci: 0,
      RavioliDolci: 0,
      RavioliFormaggio: 0,
      RavioliAltri: 0,
      Culurgiones: 0,
      Pardulas: 0,
      Ciambelle: 0,
      Amaretti: 0,
      Gueffus: 0,
      Bianchini: 0,
      Pabassine: 0,
      Zeppole: 0,
      PanadaAgnello: 0,
      PanadaMaiale: 0,
      PanadaVitella: 0,
      PanadaVerdure: 0,
      PanadaAnguille: 0,
      Panadine: 0,
      PastaPerPanada: 0,
      Sebadas: 0,
      Pizzette: 0,
      Fregula: 0
    };
    
    ordiniFiltrati.forEach(ordine => {
      (ordine.prodotti || []).forEach(prodotto => {
        const nomeLC = prodotto.nome?.toLowerCase() || '';
        let peso = convertiInKg(prodotto);
        
        if (peso === 0) return;
        
        // Esplodi vassoi
        if (nomeLC.includes('vassoio') && prodotto.dettagliCalcolo?.composizione) {
          prodotto.dettagliCalcolo.composizione.forEach(comp => {
            const compNome = comp.nome?.toLowerCase() || '';
            let compPeso = 0;
            if (comp.unita === 'Kg' || comp.unita === 'kg') compPeso = comp.quantita;
            else if (comp.unita === 'Pezzi' || comp.unita === 'pezzi' || comp.unita === 'pz') {
              for (const [nome, pezziKg] of Object.entries(PEZZI_PER_KG_TOTALI)) {
                if (compNome.includes(nome.toLowerCase())) {
                  compPeso = comp.quantita / pezziKg;
                  break;
                }
              }
              if (compPeso === 0) compPeso = comp.quantita / 30;
            }
            
            if (compNome.includes('pardula')) totali.Pardulas += compPeso;
            else if (compNome.includes('ciambelle')) totali.Ciambelle += compPeso;
            else if (compNome.includes('amarett')) totali.Amaretti += compPeso;
            else if (compNome.includes('gueff')) totali.Gueffus += compPeso;
            else if (compNome.includes('bianchin')) totali.Bianchini += compPeso;
            else if (compNome.includes('pabassine')) totali.Pabassine += compPeso;
          });
          return;
        }
        
        // ✅ FIX 19/12/2025: Classifica prodotto (RAVIOLI per variante!)
        if (nomeLC.includes('ravioli')) {
          // Controlla variante ravioli
          if (nomeLC.includes('zafferano') && nomeLC.includes('spinaci')) {
            totali.RavioliSpinaciZafferano += peso;
          } else if (nomeLC.includes('zafferano')) {
            totali.RavioliZafferano += peso;
          } else if (nomeLC.includes('spinaci')) {
            totali.RavioliSpinaci += peso;
          } else if (nomeLC.includes('dolci') || nomeLC.includes('dolce')) {
            totali.RavioliDolci += peso;
          } else if (nomeLC.includes('formaggio') || nomeLC.includes('ricotta')) {
            totali.RavioliFormaggio += peso;
          } else {
            totali.RavioliAltri += peso;
          }
        }
        else if (nomeLC.includes('culurgion')) totali.Culurgiones += peso;
        else if (nomeLC.includes('pardula')) totali.Pardulas += peso;
        else if (nomeLC.includes('ciambelle')) totali.Ciambelle += peso;
        else if (nomeLC.includes('amarett')) totali.Amaretti += peso;
        else if (nomeLC.includes('gueff')) totali.Gueffus += peso;
        else if (nomeLC.includes('bianchin')) totali.Bianchini += peso;
        else if (nomeLC.includes('pabassine')) totali.Pabassine += peso;
        else if (nomeLC.includes('zeppol')) totali.Zeppole += peso;
        else if (nomeLC.includes('panadine')) totali.Panadine += peso;
        else if (nomeLC.includes('pasta per panada') || nomeLC === 'pasta panada') totali.PastaPerPanada += peso;
        else if (nomeLC.includes('panada') && nomeLC.includes('agnello')) totali.PanadaAgnello += peso;
        else if (nomeLC.includes('panada') && nomeLC.includes('maiale')) totali.PanadaMaiale += peso;
        else if (nomeLC.includes('panada') && nomeLC.includes('vitella')) totali.PanadaVitella += peso;
        else if (nomeLC.includes('panada') && nomeLC.includes('verdur')) totali.PanadaVerdure += peso;
        else if (nomeLC.includes('panada') && nomeLC.includes('anguill')) totali.PanadaAnguille += peso;
        else if (nomeLC.includes('sebada')) totali.Sebadas += peso;
        else if (nomeLC.includes('pizzette')) totali.Pizzette += peso;
        else if (nomeLC.includes('fregula')) totali.Fregula += peso;
      });
    });
    
    return totali;
  };

  const totali = calcolaTotali();
  
  // Raggruppa per macro-categoria
  const totaleRavioli = totali.Ravioli + totali.Culurgiones;
  const totalePardulas = totali.Pardulas;
  const totaleDolci = totali.Ciambelle + totali.Amaretti + totali.Gueffus + totali.Bianchini + totali.Pabassine; // ✅ RIMOSSO Zeppole
  const totalePanadas = totali.PanadaAgnello + totali.PanadaMaiale + totali.PanadaVitella + totali.PanadaVerdure + totali.PanadaAnguille;
  // ✅ NUOVO 30/12/2025: Gruppi separati per Seabadas, Zeppole, Panadine
  const totaleSebadas = totali.Sebadas;
  const totaleZeppole = totali.Zeppole;
  const totalePanadine = totali.Panadine;
  const totalePasta = totali.PastaPerPanada; // ✅ NUOVO 30/12/2025: Pasta separata
  const totaleAltri = totali.Pizzette + totali.Fregula; // ✅ RIMOSSO Panadine, Sebadas e Pasta
  const totaleGenerale = totaleRavioli + totalePardulas + totaleDolci + totalePanadas + totaleSebadas + totaleZeppole + totalePanadine + totalePasta + totaleAltri;

  // Calcola incasso totale
  const incassoTotale = ordiniFiltrati.reduce((sum, o) => sum + (o.totale || 0), 0);

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Periodo: dal <strong>{new Date(dataInizio).toLocaleDateString('it-IT')}</strong> al <strong>{new Date(dataFine).toLocaleDateString('it-IT')}</strong>
        <br />
        Ordini trovati: <strong>{ordiniFiltrati.length}</strong> | Incasso totale: <strong>€{incassoTotale.toFixed(2)}</strong>
      </Alert>

      {totaleGenerale === 0 ? (
        <Alert severity="warning">Nessun prodotto trovato nel periodo selezionato</Alert>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Categoria</strong></TableCell>
              <TableCell align="right"><strong>Totale (KG)</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* RAVIOLI */}
            {totaleRavioli > 0 && (
              <>
                <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                  <TableCell colSpan={2}><strong>🥟 RAVIOLI/PASTA</strong></TableCell>
                </TableRow>
                {totali.Ravioli > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Ravioli</TableCell>
                    <TableCell align="right">{totali.Ravioli.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
                {totali.Culurgiones > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Culurgiones</TableCell>
                    <TableCell align="right">{totali.Culurgiones.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
              </>
            )}

            {/* PARDULAS */}
            {totalePardulas > 0 && (
              <TableRow sx={{ backgroundColor: '#fff3e0' }}>
                <TableCell><strong>🧁 PARDULAS</strong></TableCell>
                <TableCell align="right"><strong>{totalePardulas.toFixed(2)} KG</strong></TableCell>
              </TableRow>
            )}

            {/* DOLCI */}
            {totaleDolci > 0 && (
              <>
                <TableRow sx={{ backgroundColor: '#fce4ec' }}>
                  <TableCell colSpan={2}><strong>🍪 DOLCI</strong></TableCell>
                </TableRow>
                {totali.Ciambelle > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Ciambelle</TableCell>
                    <TableCell align="right">{totali.Ciambelle.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
                {totali.Amaretti > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Amaretti</TableCell>
                    <TableCell align="right">{totali.Amaretti.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
                {totali.Gueffus > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Gueffus</TableCell>
                    <TableCell align="right">{totali.Gueffus.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
                {totali.Bianchini > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Bianchini</TableCell>
                    <TableCell align="right">{totali.Bianchini.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
                {totali.Pabassine > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Pabassine</TableCell>
                    <TableCell align="right">{totali.Pabassine.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
                {totali.Zeppole > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Zeppole</TableCell>
                    <TableCell align="right">{totali.Zeppole.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
              </>
            )}

            {/* PANADAS */}
            {totalePanadas > 0 && (
              <>
                <TableRow sx={{ backgroundColor: '#e8f5e9' }}>
                  <TableCell colSpan={2}><strong>🥧 PANADAS</strong></TableCell>
                </TableRow>
                {totali.PanadaAgnello > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Panada Agnello</TableCell>
                    <TableCell align="right">{totali.PanadaAgnello.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
                {totali.PanadaMaiale > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Panada Maiale</TableCell>
                    <TableCell align="right">{totali.PanadaMaiale.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
                {totali.PanadaVitella > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Panada Vitella</TableCell>
                    <TableCell align="right">{totali.PanadaVitella.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
                {totali.PanadaVerdure > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Panada Verdure</TableCell>
                    <TableCell align="right">{totali.PanadaVerdure.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
                {totali.PanadaAnguille > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Panada Anguille</TableCell>
                    <TableCell align="right">{totali.PanadaAnguille.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
              </>
            )}

            {/* ALTRI */}
            {totaleAltri > 0 && (
              <>
                <TableRow sx={{ backgroundColor: '#f3e5f5' }}>
                  <TableCell colSpan={2}><strong>📦 ALTRI</strong></TableCell>
                </TableRow>
                {totali.PastaPerPanada > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Pasta per Panada</TableCell>
                    <TableCell align="right">{totali.PastaPerPanada.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
                {totali.Panadine > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Panadine</TableCell>
                    <TableCell align="right">{totali.Panadine.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
                {totali.Sebadas > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Sebadas</TableCell>
                    <TableCell align="right">{totali.Sebadas.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
                {totali.Pizzette > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Pizzette</TableCell>
                    <TableCell align="right">{totali.Pizzette.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
                {totali.Fregula > 0 && (
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Fregula</TableCell>
                    <TableCell align="right">{totali.Fregula.toFixed(2)} KG</TableCell>
                  </TableRow>
                )}
              </>
            )}

            {/* TOTALE GENERALE */}
            <TableRow sx={{ backgroundColor: '#1976d2', color: 'white' }}>
              <TableCell sx={{ color: 'white' }}><strong>TOTALE GENERALE</strong></TableCell>
              <TableCell align="right" sx={{ color: 'white' }}><strong>{totaleGenerale.toFixed(2)} KG</strong></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    
      
      {/* ✅ NUOVO 30/01/2026: Dialog Conferma WhatsApp Automatico */}
      <Dialog
        open={confermaWhatsAppOpen}
        onClose={() => !whatsappLoading && setConfermaWhatsAppOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WhatsAppIcon sx={{ color: 'success.main' }} />
            <Typography variant="h6">Ordine Pronto</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {whatsappLoading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress size={40} />
              <Typography sx={{ mt: 2 }}>
                Completamento ordine e invio WhatsApp...
              </Typography>
            </Box>
          ) : (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                L'ordine verrà segnato come completato e il cliente riceverà una notifica WhatsApp.
              </Alert>
              
              {ordineSelezionato && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Cliente:</strong> {ordineSelezionato.nomeCliente}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Telefono:</strong> {ordineSelezionato.telefono || 'Non disponibile'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Ordine:</strong> {ordineSelezionato.numeroOrdine || ordineSelezionato.id}
                  </Typography>
                  
                  {ordineSelezionato.prodotti && ordineSelezionato.prodotti.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Prodotti:</strong>
                      </Typography>
                      <Box sx={{ pl: 2, mt: 0.5 }}>
                        {ordineSelezionato.prodotti.slice(0, 3).map((p, i) => (
                          <Typography key={i} variant="caption" display="block">
                            • {p.nome}
                            {p.stato && ` (${p.stato})`}
                          </Typography>
                        ))}
                        {ordineSelezionato.prodotti.length > 3 && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            ...e altri {ordineSelezionato.prodotti.length - 3} prodotti
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {whatsappError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {whatsappError}
                </Alert>
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Cosa succederà:</strong><br />
                1. Ordine segnato come completato<br />
                2. Tentativo invio automatico via API<br />
                3. Se fallisce, apertura WhatsApp manuale
              </Alert>
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          {!whatsappLoading && (
            <>
              <Button 
                onClick={() => setConfermaWhatsAppOpen(false)}
                disabled={whatsappLoading}
              >
                Annulla
              </Button>
              <Button
                onClick={() => handleCompletaOrdineConWhatsApp(ordineSelezionato, false)}
                disabled={whatsappLoading}
                color="warning"
              >
                Solo Completa (no WhatsApp)
              </Button>
              <Button
                onClick={() => handleCompletaOrdineConWhatsApp(ordineSelezionato, true)}
                disabled={whatsappLoading || !ordineSelezionato?.telefono}
                variant="contained"
                color="success"
                startIcon={<WhatsAppIcon />}
              >
                Sì, Completa e Invia WhatsApp
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

</Box>
  );
}

 // =============================================================
 // COMPONENTE PRINCIPALE - GESTORE ORDINI
 // =============================================================
 export default function GestoreOrdini() {

  // ----------------------------------------------------------------
  // STATE - Ordini & UI
  // ----------------------------------------------------------------
  const [ordini, setOrdini] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [submitInCorso, setSubmitInCorso] = useState(false);
  
  // ✅ FIX 19/12/2025: Listener per aggiornamenti localStorage da OrdiniList
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'ordini' || e.type === 'storage') {
        console.log('🔄 Ordini aggiornati in localStorage, ricarico...');
        const ordiniAggiornati = JSON.parse(localStorage.getItem('ordini') || '[]');
        setOrdini(ordiniAggiornati);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // ✅ NUOVO 21/01/2026: Apertura automatica Nuovo Ordine da CallPopup
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Controlla se dobbiamo aprire il form nuovo ordine
    const shouldOpen = localStorage.getItem('_openNuovoOrdineOnLoad');
    
    if (shouldOpen === 'true') {
      console.log('📞 Apertura automatica Nuovo Ordine da CallPopup');
      
      // ✅ FIX 13/02/2026: Reset ordine precedente per evitare dati residui
      setOrdineSelezionato(null);
      
      // Rimuovi flag
      localStorage.removeItem('_openNuovoOrdineOnLoad');
      
      // ✅ NUOVO: Leggi cliente da localStorage e imposta negli stati
      const clientePreselezionato = localStorage.getItem('nuovoOrdine_clientePreselezionato');
      if (clientePreselezionato) {
        try {
          const cliente = JSON.parse(clientePreselezionato);
          console.log('✅ Cliente da localStorage:', cliente);
          console.log('  - cliente._id:', cliente._id);
          console.log('  - cliente.telefono:', cliente.telefono);
          
          // Imposta gli stati che verranno passati come props a NuovoOrdine
          setClienteIdDaChiamata(cliente._id || cliente.id);
          setClienteDaChiamata(cliente);
          setNumeroDaChiamata(cliente.telefono);
          
          console.log('✅ Stati impostati:');
          console.log('  - clienteIdDaChiamata:', cliente._id || cliente.id);
          console.log('  - clienteDaChiamata:', cliente);
          console.log('  - numeroDaChiamata:', cliente.telefono);
          
          // NON rimuovere ancora da localStorage, lo farà NuovoOrdine
        } catch (error) {
          console.error('Errore parsing cliente:', error);
        }
      }
      
      // Aspetta che il componente sia montato (300ms)
      setTimeout(() => {
        // Apri il dialog nuovo ordine
        setDialogoNuovoOrdineAperto(true);
        console.log('✅ Dialog Nuovo Ordine aperto');
      }, 300);
    }
    
    // Listener per evento custom (se già in /ordini)
    const handleOpenNuovoOrdine = () => {
      console.log('📞 Evento open-nuovo-ordine ricevuto');
      
      // ✅ FIX 13/02/2026: Reset ordine precedente per evitare dati residui
      setOrdineSelezionato(null);
      
      // ✅ NUOVO: Leggi cliente anche qui
      const clientePreselezionato = localStorage.getItem('nuovoOrdine_clientePreselezionato');
      if (clientePreselezionato) {
        try {
          const cliente = JSON.parse(clientePreselezionato);
          setClienteIdDaChiamata(cliente._id || cliente.id);
          setClienteDaChiamata(cliente);
          setNumeroDaChiamata(cliente.telefono);
        } catch (error) {
          console.error('Errore parsing cliente:', error);
        }
      }
      
      setDialogoNuovoOrdineAperto(true);
    };
    
    window.addEventListener('open-nuovo-ordine', handleOpenNuovoOrdine);
    
    return () => {
      window.removeEventListener('open-nuovo-ordine', handleOpenNuovoOrdine);
    };
  }, []); // Esegui solo al mount

  
  const [isConnected, setIsConnected] = useState(false);
  const [ultimaSync, setUltimaSync] = useState(null);
  const [storageUsed, setStorageUsed] = useState(0);
  
  const [dialogoNuovoOrdineAperto, setDialogoNuovoOrdineAperto] = useState(false);
  const [ordineSelezionato, setOrdineSelezionato] = useState(null);
  const [dataSelezionata, setDataSelezionata] = useState(new Date().toISOString().split('T')[0]);
  
  const [notifica, setNotifica] = useState({ aperta: false, messaggio: '', tipo: 'info' });
  const [menuExport, setMenuExport] = useState(null);
  
  const [prodottiDisponibili, setProdottiDisponibili] = useState({});
 const [clienteIdDaChiamata, setClienteIdDaChiamata] = useState(null); 
  const [numeroDaChiamata, setNumeroDaChiamata] = useState(null); // ✅ FIX 17/01/2026
  const [clienteDaChiamata, setClienteDaChiamata] = useState(null); // ✅ FIX 17/01/2026
  const [prodottiCaricati, setProdottiCaricati] = useState(false);
  
  
  // ✅ NUOVISSIMO: State per Storico Chiamate e Statistiche (16/11/2025)
  const [storicoChiamateAperto, setStoricoChiamateAperto] = useState(false);
  const [dialogZeppoleOpen, setDialogZeppoleOpen] = useState(false);
  const [statisticheChiamateAperto, setStatisticheChiamateAperto] = useState(false);
  const [dialogLimitiOpen, setDialogLimitiOpen] = useState(false);
  const [riepilogoAperto, setRiepilogoAperto] = useState(false);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(null); // 🆕 22/01
  const [showRefreshDialog, setShowRefreshDialog] = useState(false); // 🆕 22/01
  const [riepilogoStampabileAperto, setRiepilogoStampabileAperto] = useState(false);
  const [whatsappHelperAperto, setWhatsappHelperAperto] = useState(false);
// ✅ NUOVO 31/01/2026: Tab Dashboard WhatsApp
const [dashboardWhatsAppAperto, setDashboardWhatsAppAperto] = useState(false);
  
  // ✅ NUOVO 30/01/2026: Stati per WhatsApp automatico su completamento
  const [confermaWhatsAppOpen, setConfermaWhatsAppOpen] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappError, setWhatsappError] = useState(null);
  
  // ✅ NUOVO 11/12/2025: State per ricerca avanzata
  const [ricercaCliente, setRicercaCliente] = useState('');
  const [ricercaExpanded, setRicercaExpanded] = useState(false);
  const [dialogTotaliPeriodo, setDialogTotaliPeriodo] = useState(false);
  const [periodoInizio, setPeriodoInizio] = useState(new Date().toISOString().split('T')[0]);
  const [periodoFine, setPeriodoFine] = useState(new Date().toISOString().split('T')[0]);
  
  // ✅ FIX 17/01/2026: State per HACCP popup automatico
  const [showHACCPPopup, setShowHACCPPopup] = useState(false);
  
  // ✅ PUSHER: Hook per chiamate entranti real-time
  const {
    chiamataCorrente,
    isPopupOpen,
    handleClosePopup,
    handleAcceptCall: handleAcceptCallFromHook,
    clearChiamata,
    connected: pusherConnected,
    pusherService
  } = useIncomingCall();

  // ✅ Handler personalizzato accettazione chiamata
  const handleAcceptIncomingCall = () => {
    console.log('🟢 [GestoreOrdini] Chiamata accettata, preparo dati per NuovoOrdine');
    
    // ✅ FIX 04/03/2026: Salva dati PRIMA di clearChiamata (che azzera chiamataCorrente)
    const clienteSalvato = chiamataCorrente?.cliente ? { ...chiamataCorrente.cliente } : null;
    const numeroSalvato = chiamataCorrente?.numero ? chiamataCorrente.numero.replace(/^\+39/, '') : null;
    
    // Pulizia state
    setClienteIdDaChiamata(null);
    setClienteDaChiamata(null);
    setNumeroDaChiamata(null);
    setOrdineSelezionato(null);
    
    // ✅ Chiudi popup DEFINITIVAMENTE (clearChiamata ha [] dipendenze = mai stale)
    if (clearChiamata) clearChiamata();
    
    // Imposta NUOVI dati dal salvataggio locale
    if (clienteSalvato && clienteSalvato._id) {
      setClienteIdDaChiamata(clienteSalvato._id);
      setClienteDaChiamata(clienteSalvato);
    }
    if (numeroSalvato) {
      setNumeroDaChiamata(numeroSalvato);
    }
    
    setTimeout(() => {
      setDialogoNuovoOrdineAperto(true);
    }, 100);
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🆕 WHATSAPP AUTOMATICO SU COMPLETAMENTO ORDINE - 30/01/2026
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Verifica se tutti i prodotti dell'ordine sono completati
   */
  const verificaTuttiProdottiCompletati = (ordine) => {
    if (!ordine.prodotti || ordine.prodotti.length === 0) {
      return true;
    }
    const tuttiCompletati = ordine.prodotti.every(p => 
      p.stato === 'consegnato' || 
      p.stato === 'completato' || 
      p.stato === 'fatto'
    );
    return tuttiCompletati;
  };

  /**
   * Normalizza numero telefono per WhatsApp
   */
  const normalizzaNumeroWhatsApp = (telefono) => {
    if (!telefono) return null;
    let numero = telefono.replace(/\D/g, '');
    if (numero.startsWith('39')) return numero;
    if (numero.length === 10) return '39' + numero;
    if (numero.length === 9) return '393' + numero;
    return numero;
  };

  /**
   * Genera messaggio WhatsApp ordine pronto
   */
  const generaMessaggioOrdineProno = (ordine) => {
    const nomeCliente = ordine.nomeCliente || 'Cliente';
    const numeroOrdine = ordine.numeroOrdine || ordine.id || 'N/A';
    
    let prodottiRiepilogo = '';
    if (ordine.prodotti && ordine.prodotti.length > 0) {
      prodottiRiepilogo = '\n\n📦 *Prodotti:*\n';
      const prodottiDaMostrare = ordine.prodotti.slice(0, 5);
      prodottiDaMostrare.forEach(p => {
        prodottiRiepilogo += `• ${p.nome}`;
        if (p.quantita && p.quantita > 0) {
          prodottiRiepilogo += `: ${p.quantita} ${p.unita || ''}`;
        }
        prodottiRiepilogo += '\n';
      });
      if (ordine.prodotti.length > 5) {
        prodottiRiepilogo += `...e altri ${ordine.prodotti.length - 5} prodotti\n`;
      }
    }

    return `✅ *ORDINE PRONTO!*\n\n${nomeCliente}, il tuo ordine ${numeroOrdine} è pronto!${prodottiRiepilogo}\n⏰ Ti aspettiamo entro le ore di chiusura\n📍 Via Carmine 20/B, Assemini\n\nA presto! 😊`;
  };

  /**
   * Apre WhatsApp con messaggio pre-compilato (fallback wa.me)
   */
  const apriWhatsAppFallback = (ordine) => {
    const numeroNormalizzato = normalizzaNumeroWhatsApp(ordine.telefono);
    if (!numeroNormalizzato) {
      mostraNotifica('Numero telefono non valido', 'error');
      return false;
    }
    const messaggio = generaMessaggioOrdineProno(ordine);
    const messaggioEncoded = encodeURIComponent(messaggio);
    const url = `https://wa.me/${numeroNormalizzato}?text=${messaggioEncoded}`;
    console.log('📱 Apertura WhatsApp fallback:', url);
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  };

  /**
   * Invia WhatsApp via API Baileys (tentativo automatico)
   */
  const inviaWhatsAppAPI = async (ordine) => {
    try {
      const numeroNormalizzato = normalizzaNumeroWhatsApp(ordine.telefono);
      if (!numeroNormalizzato) {
        throw new Error('Numero telefono non valido');
      }
      console.log('📤 Tentativo invio WhatsApp via API per:', numeroNormalizzato);
      
      const response = await fetch(`${API_URL}/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          numero: numeroNormalizzato,
          template: 'ordine_pronto',
          variabili: {
            nomeCliente: ordine.nomeCliente || 'Cliente',
            numeroOrdine: ordine.numeroOrdine || ordine.id || 'N/A',
            prodotti: ordine.prodotti || []
          }
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        console.log('✅ WhatsApp inviato via API Baileys:', result);
        return { success: true, method: 'api', result };
      } else {
        console.warn('⚠️ API WhatsApp fallita:', result.error || result.message);
        return { success: false, error: result.error || result.message };
      }
    } catch (error) {
      console.error('❌ Errore invio WhatsApp API:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Gestisce completamento ordine con invio WhatsApp IMMEDIATO
   */
  const handleCompletaOrdineConWhatsApp = async (ordine, inviaWhatsApp = true) => {
    try {
      console.log('🎯 Inizio completamento ordine:', ordine._id);
      
      if (!verificaTuttiProdottiCompletati(ordine)) {
        mostraNotifica('⚠️ Completa prima tutti i prodotti dell\'ordine!', 'warning');
        setConfermaWhatsAppOpen(false);
        return;
      }

      setWhatsappLoading(true);
      setWhatsappError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ordini/${ordine._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...ordine, stato: 'completato' })
      });

      if (!response.ok) {
        throw new Error('Errore aggiornamento stato ordine');
      }

      const ordineAggiornato = await response.json();
      console.log('✅ Ordine completato:', ordineAggiornato);

      setOrdini(prev => prev.map(o => 
        o._id === ordine._id ? { ...o, stato: 'completato' } : o
      ));
      
      localStorage.setItem('ordini', JSON.stringify(
        ordini.map(o => o._id === ordine._id ? { ...o, stato: 'completato' } : o)
      ));

      mostraNotifica('✅ Ordine completato!', 'success');

      if (inviaWhatsApp && ordine.telefono) {
        console.log('📱 Avvio processo invio WhatsApp...');
        const resultAPI = await inviaWhatsAppAPI(ordine);
        
        if (resultAPI.success) {
          mostraNotifica(`✅ WhatsApp inviato automaticamente a ${ordine.nomeCliente}!`, 'success');
          console.log('✅ WhatsApp inviato via API Baileys - 100% automatico');
        } else {
          console.log('⚠️ Fallback a wa.me per invio manuale');
          mostraNotifica('📱 Apertura WhatsApp manuale...', 'info');
          
          setTimeout(() => {
            const fallbackSuccess = apriWhatsAppFallback(ordine);
            if (fallbackSuccess) {
              mostraNotifica('📱 WhatsApp aperto! Premi INVIO per inviare', 'info');
            } else {
              mostraNotifica('❌ Errore apertura WhatsApp. Verifica il numero telefono.', 'error');
            }
          }, 1500);
        }
      } else if (!ordine.telefono) {
        mostraNotifica('⚠️ Nessun numero telefono per questo cliente', 'warning');
      }

      setConfermaWhatsAppOpen(false);
      setWhatsappLoading(false);

    } catch (error) {
      console.error('❌ Errore completamento ordine:', error);
      mostraNotifica(`❌ Errore: ${error.message}`, 'error');
      setWhatsappError(error.message);
      setWhatsappLoading(false);
    }
  };

  /**
   * Apre dialog conferma WhatsApp
   */
  const handleApriConfermaWhatsApp = (ordine) => {
    console.log('🎯 Apertura dialog conferma WhatsApp per ordine:', ordine._id);
    
    if (!verificaTuttiProdottiCompletati(ordine)) {
      mostraNotifica('⚠️ Completa prima tutti i prodotti dell\'ordine!', 'warning');
      return;
    }

    setOrdineSelezionato(ordine);
    setConfermaWhatsAppOpen(true);
    setWhatsappError(null);
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FINE FUNZIONI WHATSAPP AUTOMATICO
  // ═══════════════════════════════════════════════════════════════════════════

    
  // ----------------------------------------------------------------
  // REFS
  // ----------------------------------------------------------------
  const wsRef = useRef(null);
  const lastActivityRef = useRef(Date.now()); // 🆕 22/01
  const warningTimerRef = useRef(null); // 🆕 22/01
  const limitsDebounceRef = useRef(null); // 🆕 22/01
  const reconnectTimeoutRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const pendingSyncRef = useRef(false); // 🆕 28/02: Flag sync pendente (form aperto)
  
  // ----------------------------------------------------------------
  // FUNZIONE: Scroll alla categoria
  // ----------------------------------------------------------------
  const scrollToCategoria = useCallback((nomeCategoria) => {
    console.log(`📜 Scroll verso categoria: ${nomeCategoria}`);
    
    // Cerca l'elemento con data-categoria
    const elemento = document.querySelector(`[data-categoria="${nomeCategoria}"]`);
    
    if (elemento) {
      // Scroll smooth
      elemento.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
      
      // Highlight temporaneo
      const bgOriginal = elemento.style.backgroundColor;
      elemento.style.backgroundColor = 'rgba(33, 150, 243, 0.15)';
      elemento.style.transition = 'background-color 0.3s ease';
      
      setTimeout(() => {
        elemento.style.backgroundColor = bgOriginal;
        setTimeout(() => {
          elemento.style.transition = '';
        }, 300);
      }, 2000);
    } else {
      console.warn(`⚠️ Elemento categoria ${nomeCategoria} non trovato`);
    }
  }, []);
  
  // Rendi la funzione disponibile globalmente per i chip
  useEffect(() => {
    window.scrollToCategoria = scrollToCategoria;
    return () => {
      delete window.scrollToCategoria;
    };
  }, [scrollToCategoria]);
  
  // ----------------------------------------------------------------
  // EFFETTO 1: Pusher Listener per Chiamate
  //⚠️ DISABILITATO: Ora gestito da useIncomingCall() hook
  // ----------------------------------------------------------------
  /* 
  useEffect(() => {
    console.log('📡 [GestoreOrdini] Inizializzo Pusher listener per chiamate...');
    
    // Inizializza Pusher client se non già fatto
    if (!pusherClientService.pusher) {
      console.log('🚀 [GestoreOrdini] Inizializzo Pusher client...');
      pusherClientService.initialize();
    }

    // Subscribe al canale chiamate
    console.log('📡 [GestoreOrdini] Subscribe al canale chiamate...');
    const channel = pusherClientService.subscribeToChiamate((callData) => {
      console.log('📞 [GestoreOrdini] CHIAMATA IN ARRIVO!', callData);
      
      // Mostra popup
      setCurrentCallData(callData);
      setShowCallPopup(true);
      
      // Notifica sonora browser (se permessi abilitati)
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('📞 Chiamata in arrivo', {
            body: `Da: ${callData.cliente?.nome || 'Sconosciuto'} - ${callData.numero}`,
            icon: '/favicon.ico',
            tag: 'call-notification',
            requireInteraction: true
          });
          console.log('🔔 [GestoreOrdini] Notifica browser inviata');
        } catch (error) {
          console.warn('⚠️ [GestoreOrdini] Errore notifica browser:', error);
        }
      }
    });

    // Listener alternativo via CustomEvent (fallback)
    const handleChiamataArrivo = (event) => {
      console.log('📞 [GestoreOrdini] Evento chiamata:arrivo ricevuto', event.detail);
      setCurrentCallData(event.detail);
      setShowCallPopup(true);
    };

    window.addEventListener('chiamata:arrivo', handleChiamataArrivo);

    // Richiedi permessi notifiche (se non già fatto)
    if ('Notification' in window && Notification.permission === 'default') {
      console.log('🔔 [GestoreOrdini] Richiedo permessi notifiche...');
      Notification.requestPermission().then(permission => {
        console.log('🔔 [GestoreOrdini] Permesso notifiche:', permission);
      });
    }

    // Cleanup
    return () => {
      console.log('🔌 [GestoreOrdini] Cleanup listener chiamate');
      window.removeEventListener('chiamata:arrivo', handleChiamataArrivo);
      // Non fare unsubscribe/disconnect qui perché Pusher è globale
    };
  }, []); // Esegui solo al mount
  */

  // ----------------------------------------------------------------
  // HANDLER: Chiusura CallPopup (ora gestito da useIncomingCall hook)
  // ----------------------------------------------------------------

  // ----------------------------------------------------------------
  // DEBUG: Monitoraggio stato chiamata
  // ----------------------------------------------------------------
  useEffect(() => {
    console.log('📊 [GestoreOrdini] Stato chiamata:');
    console.log('  - isPopupOpen:', isPopupOpen);
    console.log('  - chiamataCorrente:', chiamataCorrente);
    console.log('  - pusherConnected:', pusherConnected);
  }, [isPopupOpen, chiamataCorrente, pusherConnected]);

  // ----------------------------------------------------------------
  // EFFETTO 2: Caricamento prodotti da DB
  // ----------------------------------------------------------------
  useEffect(() => {
    const caricaProdottiDB = async () => {
      try {
        const response = await fetch(`${API_URL}/prodotti/disponibili`);
        if (response.ok) {
          const data = await response.json();
          const prodottiData = data.data || data || [];
          
          const prodottiRaggr = prodottiData.reduce((acc, p) => {
            const categoria = p.categoria || 'altro';
            if (!acc[categoria]) acc[categoria] = [];
            acc[categoria].push(p);
            return acc;
          }, {});
          
          setProdottiDisponibili(prodottiRaggr);
          setProdottiCaricati(true);
          console.log(`✅ Caricati ${prodottiData.length} prodotti dal database`);
        }
      } catch (error) {
        console.error('Errore caricamento prodotti:', error);
        // Fallback a configurazione statica
        setProdottiDisponibili({ dolci: LISTA_PRODOTTI });
        setProdottiCaricati(true);
      }
    };
    
    caricaProdottiDB();
  }, []);

  // ----------------------------------------------------------------
  // EFFETTO 3: Pre-caricamento dati (clienti e prodotti)
  // ----------------------------------------------------------------
  useEffect(() => {
    const preCaricaDati = async () => {
      try {
        // Pre-carica clienti
        const responseClienti = await fetch(`${API_URL}/clienti?attivo=true`);
        if (responseClienti.ok) {
          const dataClienti = await responseClienti.json();
          const clientiData = dataClienti.data || dataClienti.clienti || dataClienti || [];
          
          localStorage.setItem('clienti_cache', JSON.stringify(clientiData));
          localStorage.setItem('clienti_cache_time', Date.now().toString());
          
          console.log(`⚡ Pre-caricati ${clientiData.length} clienti in background`);
        }

        // Pre-carica prodotti
        const responseProdotti = await fetch(`${API_URL}/prodotti/disponibili`);
        if (responseProdotti.ok) {
          const dataProdotti = await responseProdotti.json();
          const prodottiData = dataProdotti.data || dataProdotti || [];
          
          localStorage.setItem('prodotti_cache', JSON.stringify(prodottiData));
          localStorage.setItem('prodotti_cache_time', Date.now().toString());
          
          console.log(`⚡ Pre-caricati ${prodottiData.length} prodotti in background`);
        }
      } catch (error) {
        console.error('Errore pre-caricamento dati:', error);
      }
    };

    preCaricaDati();
    
    // ✅ FIX 13/12/2025: Ricarica ogni 15 minuti invece di 5
    const intervalId = setInterval(preCaricaDati, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);
  
  // ----------------------------------------------------------------
  // ═══════════════════════════════════════════════════════════════
  // NOTA 27/02/2026: EFFETTO 3 RIMOSSO - Era ridondante
  // Il passaggio dati chiamata ora avviene SOLO via React props:
  // CallPopup → onNuovoOrdine → GestoreOrdini state → NuovoOrdine props
  // localStorage('chiamataCliente') non è più usato per questo flusso.
  // ═══════════════════════════════════════════════════════════════
  
// ----------------------------------------------------------------
// NOTA 27/02/2026: EFFETTO 3bis RIMOSSO - Era ridondante
// Evento 'nuova-chiamata' non più necessario, il flusso è via React props.
// ----------------------------------------------------------------

  // ----------------------------------------------------------------
  // EFFETTO 4: Keep-alive Railway
  // ----------------------------------------------------------------
  useEffect(() => {
    const keepAlive = setInterval(async () => {
      try {
        await fetch(`${API_URL.replace('/api', '')}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        console.log('Keep-alive ping inviato');
      } catch (error) {
        // ✅ FIX 13/12/2025: Non loggare errori keep-alive per ridurre spam console
        // console.log('Keep-alive fallito:', error.message);
      }
    }, 10 * 60 * 1000);  // ✅ FIX: 10 minuti invece di 4

    return () => clearInterval(keepAlive);
  }, []);
  
  // ----------------------------------------------------------------
  // FUNZIONI: WebSocket
  // ⚠️ DISABILITATO - Ora si usa Pusher per real-time invece di WebSocket
  // ----------------------------------------------------------------
  /* 
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    try {
      console.log('Tentativo connessione WebSocket...', WS_URL);
      wsRef.current = new WebSocket(WS_URL);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connesso');
        setIsConnected(true);
        mostraNotifica('Connesso in tempo reale', 'success');
        sincronizzaConMongoDB();
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket messaggio:', data);
          
          switch(data.type) {
            case 'ordine_aggiornato':
            case 'ordine_creato':
            case 'ordine_eliminato':
              sincronizzaConMongoDB();
              break;
            case 'alert-scorte':
              mostraNotifica(`⚠️ Scorta bassa: ${data.prodotto} (${data.quantita} ${data.unita})`, 'warning');
              break;
            case 'ping':
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'pong' }));
              }
              break;
          }
        } catch (error) {
          console.error('Errore parsing messaggio WebSocket:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket errore:', error);
        setIsConnected(false);
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnesso');
        setIsConnected(false);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
    } catch (error) {
      console.error('Errore creazione WebSocket:', error);
      setIsConnected(false);
    }
  }, []);
  */
  
  // ----------------------------------------------------------------
  // FUNZIONI: Sincronizzazione MongoDB
  // ----------------------------------------------------------------
  const sincronizzaConMongoDB = useCallback(async (retry = 0) => {
    if (syncInProgress) return;
    
    // 🆕 28/02/2026: NON sincronizzare se il form ordine è aperto (evita reset form)
    if (dialogoNuovoOrdineAperto) {
      console.log('⏸️ Sync posticipata - form ordine aperto');
      pendingSyncRef.current = true;
      return;
    }
    
    try {
      setSyncInProgress(true);
      console.log(`🔄 Sincronizzazione in corso... (tentativo ${retry + 1}/2)`);
      
      // ✅ FIX 13/12/2025: Prima prova con filtro data, poi fallback senza
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);
      const dataLimiteISO = dataLimite.toISOString().split('T')[0];
      
      let url = `${API_URL}/ordini?limit=2000`;
      // ✅ FIX 12/03/2026: limit=2000 per ricevere tutti gli ordini recenti
      // senza paginazione che tronca i dati (es. 63 su 68 ordini del 4 aprile)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        let ordiniBackend = [];
        if (Array.isArray(data)) {
          ordiniBackend = data;
        } else if (data.data && Array.isArray(data.data)) {
          ordiniBackend = data.data;
        } else if (data.ordini && Array.isArray(data.ordini)) {
          ordiniBackend = data.ordini;
        }
        
        // ✅ FIX 13/12/2025: Filtra client-side solo ultimi 60 giorni per performance
        const sessantaGiorniFa = new Date();
        sessantaGiorniFa.setDate(sessantaGiorniFa.getDate() - 60);
        
        const ordiniRecenti = ordiniBackend.filter(ordine => {
          const dataOrdine = new Date(ordine.dataRitiro || ordine.createdAt);
          return dataOrdine >= sessantaGiorniFa;
        });
        
        console.log(`✅ Sincronizzati ${ordiniRecenti.length} ordini recenti (su ${ordiniBackend.length} totali)`);
        
        ordiniRecenti.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.dataRitiro);
          const dateB = new Date(b.createdAt || b.dataRitiro);
          return dateB - dateA;
        });
        
        localStorage.setItem('ordini', JSON.stringify(ordiniRecenti));
        setOrdini(ordiniRecenti);
        
        setIsConnected(true);
        setUltimaSync(new Date());
        
        console.log('✅ Ordini sincronizzati (ultimi 60 giorni)');
        
        return true;
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Errore sincronizzazione:', error);
      
      // ✅ FIX: Solo 1 retry
      if (retry < 1 && navigator.onLine) {
        setTimeout(() => {
          sincronizzaConMongoDB(retry + 1);
        }, 5000);
        return;
      }
      
      setIsConnected(false);
      
      const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
      setOrdini(ordiniCache);
      
      if (ordiniCache.length === 0) {
        mostraNotifica('Nessun ordine in cache locale', 'info');
      } else {
        mostraNotifica(`Modalità offline - ${ordiniCache.length} ordini in cache`, 'warning');
      }
      
      return false;
    } finally {
      setSyncInProgress(false);
    }
  }, [syncInProgress, dialogoNuovoOrdineAperto]);

  // ----------------------------------------------------------------
  // FUNZIONI: Ordini offline
  // ----------------------------------------------------------------
  const inviaOrdiniOffline = async () => {
    const ordiniOffline = JSON.parse(localStorage.getItem('ordiniOffline') || '[]');
    
    if (ordiniOffline.length === 0) return;
    
    console.log(`Invio ${ordiniOffline.length} ordini offline...`);
    let successCount = 0;
    
    for (const ordine of ordiniOffline) {
      try {
        const response = await fetch(`${API_URL}/ordini`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ordine)
        });
        
        if (response.ok) {
          successCount++;
          console.log(`Ordine sincronizzato: ${ordine.nomeCliente}`);
        }
      } catch (error) {
        console.error('Errore invio ordine offline:', error);
      }
    }
    
    if (successCount > 0) {
      localStorage.removeItem('ordiniOffline');
      mostraNotifica(`Sincronizzati ${successCount} ordini offline`, 'success');
      await sincronizzaConMongoDB();
    }
  };
  
  // ----------------------------------------------------------------
  // FUNZIONI: Creazione/Aggiornamento Ordini (con gestione VASSOIO)
  // ----------------------------------------------------------------
  const creaOrdine = async (ordine) => {
    let totaleOrdine = 0;
    
    // ✅ Gestisci vassoi e prodotti normali separatamente
    const prodottiConCalcolo = (ordine.prodotti || []).map(p => {
      // ✅ SE È UN VASSOIO, USA IL PREZZO GIÀ CALCOLATO
      if (p.nome === 'Vassoio Dolci Misti' || p.unita === 'vassoio') {
        console.log('🎂 Vassoio rilevato, uso prezzo preCalcolato:', p.prezzo);
        
        totaleOrdine += p.prezzo || 0;
        
        return {
          ...p,
          prezzo: p.prezzo || 0,
          dettagliCalcolo: p.dettagliCalcolo || {
            dettagli: 'Vassoio personalizzato',
            prezzoTotale: p.prezzo || 0
          }
        };
      }
      
      // ✅ PRODOTTO NORMALE: Ricalcola prezzo (FIX 12/12/2025: passa prezzo esistente)
      try {
        const risultato = calcolaPrezzoOrdine(p.nome, p.quantita, p.unita, p.prezzo);
        totaleOrdine += risultato.prezzoTotale;
        
        return {
          ...p,
          prezzo: risultato.prezzoTotale,
          dettagliCalcolo: risultato
        };
      } catch (error) {
        console.error(`Errore calcolo prezzo per ${p.nome}:`, error);
        
        // Fallback: usa il prezzo già presente
        totaleOrdine += p.prezzo || 0;
        return {
          ...p,
          prezzo: p.prezzo || 0,
          dettagliCalcolo: {
            dettagli: `${p.quantita} ${p.unita}`,
            prezzoTotale: p.prezzo || 0
          }
        };
      }
    });
    
    let clienteId = null;
    if (typeof ordine.cliente === 'string') {
      clienteId = ordine.cliente;
    } else if (ordine.cliente && ordine.cliente._id) {
      clienteId = ordine.cliente._id;
    }
    
    const nuovoOrdine = {
      ...ordine,
      cliente: clienteId || ordine.cliente,
      prodotti: prodottiConCalcolo,
      totale: totaleOrdine,
      _id: undefined,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stato: ordine.stato || 'nuovo'
    };
    
    console.log('📤 Invio ordine al backend:', nuovoOrdine);
    
    try {
      if (!navigator.onLine) {
        throw new Error('Offline mode');
      }
      
      const response = await fetch(`${API_URL}/ordini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(nuovoOrdine)
      });
      
      if (response.ok) {
        const ordineCreato = await response.json();
        console.log('✅ Ordine creato con successo:', ordineCreato);
        console.log('🔍 avvisiLimiti ricevuti:', ordineCreato.avvisiLimiti);
        
        await sincronizzaConMongoDB();
        
        // WebSocket notification disabilitato (ora si usa Pusher)
        /*
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ordine_creato',
            ordine: ordineCreato
          }));
        }
        */
        
        // ✅ Mostra avvisi limiti periodo se presenti (ordine salvato, ma avvisa l'operatore)
        if (ordineCreato.avvisiLimiti && ordineCreato.avvisiLimiti.length > 0) {
          const testoAvvisi = ordineCreato.avvisiLimiti.map(a => a.messaggio).join(' | ');
          mostraNotifica(`⚠️ Ordine salvato - ATTENZIONE LIMITI: ${testoAvvisi}`, 'warning');
        } else {
          mostraNotifica('Ordine salvato e giacenze aggiornate', 'success');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // ✅ Se errore limiti, mostra messaggio specifico
        if (errorData.erroriLimiti) {
          const messaggiErrore = errorData.erroriLimiti.map(e => e.messaggio).join('\n');
          mostraNotifica(`⚠️ Limiti superati:\n${messaggiErrore}`, 'error');
          return;
        }
        
        console.error('❌ Errore backend:', response.status, errorData);
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Errore creazione ordine:', error);
      
      const ordiniOffline = JSON.parse(localStorage.getItem('ordiniOffline') || '[]');
      ordiniOffline.push(nuovoOrdine);
      localStorage.setItem('ordiniOffline', JSON.stringify(ordiniOffline));
      
      const ordineConFlag = { ...nuovoOrdine, _syncPending: true };
      setOrdini(prev => [ordineConFlag, ...prev]);
      
      const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
      ordiniCache.unshift(ordineConFlag);
      localStorage.setItem('ordini', JSON.stringify(ordiniCache));
      
      mostraNotifica('Ordine salvato localmente (verrà sincronizzato)', 'warning');
    }
  };
  
  const aggiornaOrdine = async (ordine) => {
    let totaleOrdine = 0;
    
    const prodottiConCalcolo = (ordine.prodotti || []).map(p => {
      // ✅ SE È UN VASSOIO, USA IL PREZZO GIÀ CALCOLATO
      if (p.nome === 'Vassoio Dolci Misti' || p.unita === 'vassoio') {
        totaleOrdine += p.prezzo || 0;
        return {
          ...p,
          prezzo: p.prezzo || 0,
          dettagliCalcolo: p.dettagliCalcolo || {
            dettagli: 'Vassoio personalizzato',
            prezzoTotale: p.prezzo || 0
          }
        };
      }
      
      // PRODOTTO NORMALE (FIX 12/12/2025: passa prezzo esistente)
      try {
        const risultato = calcolaPrezzoOrdine(p.nome, p.quantita, p.unita, p.prezzo);
        totaleOrdine += risultato.prezzoTotale;
        
        return {
          ...p,
          prezzo: risultato.prezzoTotale,
          dettagliCalcolo: risultato
        };
      } catch (error) {
        console.error(`Errore calcolo prezzo per ${p.nome}:`, error);
        totaleOrdine += p.prezzo || 0;
        return {
          ...p,
          prezzo: p.prezzo || 0,
          dettagliCalcolo: {
            dettagli: `${p.quantita} ${p.unita}`,
            prezzoTotale: p.prezzo || 0
          }
        };
      }
    });
    
    let clienteId = null;
    if (typeof ordine.cliente === 'string') {
      clienteId = ordine.cliente;
    } else if (ordine.cliente && ordine.cliente._id) {
      clienteId = ordine.cliente._id;
    }
    
    const ordineAggiornato = {
      ...ordine,
      cliente: clienteId || ordine.cliente,
      prodotti: prodottiConCalcolo,
      totale: totaleOrdine,
      updatedAt: new Date().toISOString()
    };
    
    try {
      if (!navigator.onLine) {
        throw new Error('Offline mode');
      }
      
      const response = await fetch(`${API_URL}/ordini/${ordine._id || ordine.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ordineAggiornato)
      });
      
      if (response.ok) {
        await sincronizzaConMongoDB();
        mostraNotifica('Ordine aggiornato', 'success');
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.erroriLimiti) {
          const messaggiErrore = errorData.erroriLimiti.map(e => e.messaggio).join('\n');
          mostraNotifica(`⚠️ Limiti superati:\n${messaggiErrore}`, 'error');
          return;
        }
        
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Errore aggiornamento:', error);
      
      setOrdini(prev => prev.map(o => 
        (o._id || o.id) === (ordineAggiornato._id || ordineAggiornato.id) 
          ? { ...ordineAggiornato, _syncPending: true }
          : o
      ));
      
      mostraNotifica('Ordine aggiornato localmente', 'warning');
    }
  };

  const eliminaOrdine = async (id) => {
    if (!confirm('Confermi eliminazione ordine?')) return;
    
    try {
      if (!navigator.onLine) {
        throw new Error('Offline mode');
      }
      
      const response = await fetch(`${API_URL}/ordini/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await sincronizzaConMongoDB();
        mostraNotifica('Ordine eliminato', 'success');
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Errore eliminazione:', error);
      mostraNotifica('Errore eliminazione', 'error');
    }
  };

  // ----------------------------------------------------------------
  // ✅ NUOVO 08/01/2026: Funzione per inviare WhatsApp con auto-send
  // ----------------------------------------------------------------
  const inviaWhatsAppPronto = async (ordine, autoSend = false) => {
    try {
      console.log('📱 Invio WhatsApp per ordine:', ordine._id, 'autoSend:', autoSend);
      
      // Chiamata API per generare link WhatsApp
      const response = await fetch(`${API_URL}/whatsapp/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          numero: ordine.telefono,
          template: 'ordine_pronto',
          variabili: {
            nome: ordine.nomeCliente,
            numeroOrdine: ordine.numeroOrdine
          },
          autoSend: autoSend  // ✅ PARAMETRO AUTO-SEND
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Errore generazione link WhatsApp');
      }
      
      const data = await response.json();
      
      if (data.success && data.whatsappUrl) {
        console.log('✅ Link WhatsApp generato:', data.whatsappUrl);
        
        // Apri WhatsApp in nuova tab
        const whatsappTab = window.open(data.whatsappUrl, '_blank');
        
        if (!whatsappTab) {
          throw new Error('Popup bloccato dal browser. Abilita i popup per questo sito.');
        }
        
        // Aggiorna ordine con flag WhatsApp inviato
        const updateResponse = await fetch(`${API_URL}/ordini/${ordine._id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({ 
            whatsappInviato: true,
            dataInvioWhatsapp: new Date().toISOString()
          })
        });
        
        if (updateResponse.ok) {
          console.log('✅ Flag WhatsApp aggiornato nel database');
        }
        
        return true;
      } else {
        throw new Error('Link WhatsApp non generato');
      }
      
    } catch (error) {
      console.error('❌ Errore invio WhatsApp:', error);
      mostraNotifica(`Errore WhatsApp: ${error.message}`, 'error');
      throw error;
    }
  };

  // ----------------------------------------------------------------
  // ✅ NUOVO 08/01/2026: Funzione per segnare ordine come pronto + auto-send WhatsApp
  // ----------------------------------------------------------------
  const segnaComePronto = async (ordine) => {
    try {
      console.log('🟢 Segno ordine come pronto con WhatsApp automatico:', ordine._id);
      
      // ✅ NUOVO 30/01/2026: Usa il nuovo sistema con popup conferma
      handleApriConfermaWhatsApp(ordine);
      
    } catch (error) {
      console.error('❌ Errore segna come pronto:', error);
      mostraNotifica(`Errore: ${error.message}`, 'error');
    }
  };
  const salvaOrdine = async (nuovoOrdine) => {
    if (submitInCorso) return;
    
    setSubmitInCorso(true);
    
    try {
      const isModifica = !!ordineSelezionato; // ✅ Fix 21/01/2026: Flag per distinguere CREATE vs UPDATE
      
      if (isModifica) {
        await aggiornaOrdine({ ...ordineSelezionato, ...nuovoOrdine });
        // Messaggio "Ordine aggiornato" è gestito dentro aggiornaOrdine
      } else {
        await creaOrdine(nuovoOrdine);
        // Messaggio "Ordine salvato" è gestito dentro creaOrdine
      }
      
      setOrdineSelezionato(null);
      setDialogoNuovoOrdineAperto(false);
      
      // 🆕 05/03/2026: Pulisci bozza dopo salvataggio
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('_ordine_draft');
      }
    } catch (error) {
      console.error('Errore salvataggio:', error);
      const azione = ordineSelezionato ? 'l\'aggiornamento' : 'il salvataggio';
      mostraNotifica(`Errore durante ${azione}`, 'error');
    } finally {
      setTimeout(() => setSubmitInCorso(false), 1000);
    }
  };
  
  // ----------------------------------------------------------------
  // FUNZIONI: Utility
  // ----------------------------------------------------------------
  const rimuoviDuplicati = () => {
    setOrdini(prevOrdini => {
      const ordiniUnici = [];
      const visti = new Set();
      
      prevOrdini.forEach(ordine => {
        const chiave = ordine._id || ordine.id || 
          `${ordine.nomeCliente}-${ordine.telefono}-${ordine.dataRitiro}-${ordine.totale}`;
        
        if (!visti.has(chiave)) {
          visti.add(chiave);
          ordiniUnici.push(ordine);
        }
      });
      
      if (ordiniUnici.length !== prevOrdini.length) {
        localStorage.setItem('ordini', JSON.stringify(ordiniUnici));
        mostraNotifica(`Rimossi ${prevOrdini.length - ordiniUnici.length} ordini duplicati`, 'info');
      } else {
        mostraNotifica('Nessun duplicato trovato', 'info');
      }
      
      return ordiniUnici;
    });
  };
  
  const mostraNotifica = (messaggio, tipo = 'info') => {
    setNotifica({ aperta: true, messaggio, tipo });
  };
  
  const chiudiNotifica = () => {
    setNotifica(prev => ({ ...prev, aperta: false }));
  };

  // ----------------------------------------------------------------
  // FUNZIONI: Export
  // ----------------------------------------------------------------
  const handleExport = async (formato) => {
    setMenuExport(null);
    
    try {
      const ordiniExport = ordini.filter(o => {
        const dataOrdine = o.dataRitiro || o.createdAt;
        return dataOrdine && dataOrdine.startsWith(dataSelezionata);
      });
      
      if (ordiniExport.length === 0) {
        mostraNotifica('Nessun ordine da esportare per questa data', 'warning');
        return;
      }
      
      switch (formato) {
        case 'csv':
          exportToCSV(ordiniExport);
          break;
        case 'excel':
          exportToExcel(ordiniExport);
          break;
        case 'pdf':
          exportToPDF(ordiniExport);
          break;
        case 'print':
          printOrdini(ordiniExport);
          break;
      }
      
      mostraNotifica(`Export ${formato.toUpperCase()} completato`, 'success');
    } catch (error) {
      console.error('Errore export:', error);
      mostraNotifica('Errore durante l\'export', 'error');
    }
  };
  
  const exportToCSV = (ordiniData) => {
    const headers = ['Cliente', 'Telefono', 'Data Ritiro', 'Ora', 'Prodotti', 'Totale', 'Stato', 'Note'];
    const rows = ordiniData.map(o => [
      o.nomeCliente,
      o.telefono,
      o.dataRitiro,
      o.oraRitiro || '',
      (o.prodotti || []).map(p => {
        const dettagli = p.dettagliCalcolo?.dettagli || `${p.quantita} ${p.unita}`;
        return `${p.nome} (${dettagli})`;
      }).join('; '),
      o.totale || 0,
      o.stato || 'nuovo',
      o.note || ''
    ]);
    
    let csv = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ordini_${dataSelezionata}.csv`;
    link.click();
  };
  
  const exportToExcel = (ordiniData) => {
    exportToCSV(ordiniData);
  };
  
  const exportToPDF = (ordiniData) => {
    printOrdini(ordiniData);
  };

  const printOrdini = (ordiniData) => {
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ordini ${dataSelezionata}</title>
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f2f2f2; }
          .totale { text-align: right; font-weight: bold; margin-top: 20px; }
          .dettaglio-prodotto { font-size: 10px; color: #666; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>Pastificio Nonna Claudia - Ordini del ${new Date(dataSelezionata).toLocaleDateString('it-IT')}</h1>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Telefono</th>
              <th>Ora Ritiro</th>
              <th>Prodotti</th>
              <th>Totale</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            ${ordiniData.map(o => `
              <tr>
                <td>${o.nomeCliente}</td>
                <td>${o.telefono}</td>
                <td>${o.oraRitiro || ''}</td>
                <td>
                  ${(o.prodotti || []).map(p => {
                    const dettagli = p.dettagliCalcolo?.dettagli || `${p.quantita} ${p.unita}`;
                    return `${p.nome}<br><span class="dettaglio-prodotto">${dettagli} - €${(p.prezzo || 0).toFixed(2)}</span>`;
                  }).join('<br>')}
                </td>
                <td>€${(o.totale || 0).toFixed(2)}</td>
                <td>${o.stato || 'nuovo'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totale">
          Totale Giornata: €${ordiniData.reduce((sum, o) => sum + (o.totale || 0), 0).toFixed(2)}
        </div>
        <div class="totale">
          Numero Ordini: ${ordiniData.length}
        </div>
        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Stampa
        </button>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };
  
  // ----------------------------------------------------------------
  // FUNZIONI: Statistiche
  // ----------------------------------------------------------------
  const calcolaStatistiche = () => {
    const oggi = new Date().toDateString();
    const ordiniOggi = ordini.filter(o => {
      const dataOrdine = new Date(o.dataRitiro || o.createdAt).toDateString();
      return dataOrdine === oggi;
    });
    
    const totaleOggi = ordiniOggi.reduce((sum, o) => sum + (o.totale || 0), 0);
    const completati = ordiniOggi.filter(o => o.stato === 'completato').length;
    const inLavorazione = ordiniOggi.filter(o => o.stato === 'in_lavorazione').length;
    const nuovi = ordiniOggi.filter(o => o.stato === 'nuovo').length;
    
    return {
      totaleOrdini: ordini.length,
      ordiniOggi: ordiniOggi.length,
      totaleOggi,
      completati,
      inLavorazione,
      nuovi,
      percentualeCompletamento: ordiniOggi.length > 0 ? (completati / ordiniOggi.length * 100) : 0,
      mediaOrdine: ordiniOggi.length > 0 ? (totaleOggi / ordiniOggi.length) : 0
    };
  };
  
  const statistiche = calcolaStatistiche();
  
  // ----------------------------------------------------------------
  // EFFETTO 5: Monitoraggio storage
  // ----------------------------------------------------------------
  useEffect(() => {
    const checkStorage = () => {
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(estimate => {
          const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
          setStorageUsed(parseFloat(usedMB));
        });
      }
    };
    
    checkStorage();
    const interval = setInterval(checkStorage, 30000);
    return () => clearInterval(interval);
  }, [ordini]);
  
  // ----------------------------------------------------------------
  // EFFETTO 6: Inizializzazione mount
  // ----------------------------------------------------------------
  useEffect(() => {
    console.log('Inizializzazione GestoreOrdini...');
    
    const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
    if (ordiniCache.length > 0) {
      setOrdini(ordiniCache);
      console.log(`Caricati ${ordiniCache.length} ordini dalla cache`);
    }
    
    const wakeUpServer = async () => {
      try {
        await fetch(`${API_URL.replace('/api', '')}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        console.log('Server svegliato');
      } catch (error) {
        console.log('Wake up server fallito:', error.message);
      }
      
      setTimeout(() => {
        sincronizzaConMongoDB();
      }, 1000);
    };
    
    wakeUpServer();
    // connectWebSocket(); // ⚠️ DISABILITATO - ora si usa Pusher
    
    syncIntervalRef.current = setInterval(() => {
      sincronizzaConMongoDB();
    }, 300000);  // ✅ FIX 13/12/2025: 5 minuti invece di 30 secondi (massima performance)
    
    setCaricamento(false);
    
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      // if (wsRef.current) wsRef.current.close(); // WebSocket disabilitato
    };
  }, []);
  
  // ----------------------------------------------------------------
  // EFFETTO 7: Gestione online/offline
  // ----------------------------------------------------------------
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connessione ripristinata');
      mostraNotifica('Connessione ripristinata', 'success');
      setIsConnected(true);
      sincronizzaConMongoDB();
      inviaOrdiniOffline();
      // connectWebSocket(); // ⚠️ DISABILITATO - ora si usa Pusher
    };
    
    const handleOffline = () => {
      console.log('Connessione persa');
      setIsConnected(false);
      mostraNotifica('Modalità offline attiva', 'warning');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsConnected(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sincronizzaConMongoDB]); // Rimosso connectWebSocket (disabilitato)
  
  // =============================================================  // RENDER JSX PRINCIPALE
  // =============================================================  


  // ═══════════════════════════════════════════════════════════════════════════
  // 🆕 22/01/2026: FUNZIONI AUTO-REFRESH INTELLIGENTE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const registerActivity = React.useCallback(() => {
    if (!AUTO_REFRESH_CONFIG.ENABLED) return;
    lastActivityRef.current = Date.now();
    setAutoRefreshCountdown(null);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      if (Date.now() - lastActivityRef.current >= (AUTO_REFRESH_CONFIG.INACTIVITY_TIMEOUT - AUTO_REFRESH_CONFIG.WARNING_TIME)) {
        setShowRefreshDialog(true);
        let s = 60; setAutoRefreshCountdown(s);
        const iv = setInterval(() => { s--; setAutoRefreshCountdown(s); if(s <= 0) { clearInterval(iv); setTimeout(() => window.location.reload(), 500); } }, 1000);
      }
    }, AUTO_REFRESH_CONFIG.INACTIVITY_TIMEOUT - AUTO_REFRESH_CONFIG.WARNING_TIME);
  }, []);

  React.useEffect(() => {
    if (!AUTO_REFRESH_CONFIG.ENABLED) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, registerActivity));
    registerActivity();
    return () => { events.forEach(e => window.removeEventListener(e, registerActivity)); if (warningTimerRef.current) clearTimeout(warningTimerRef.current); };
  }, [registerActivity]);


return (
    <>
      <style jsx global>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotating {
          animation: rotate 1s linear infinite;
        }
      `}</style>
      
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        {/* ✅ NUOVO 28/02/2026: Banner alert anomalie */}
        <AlertBanner />
        
        <StatisticheWidget ordini={ordini} dataSelezionata={dataSelezionata} />
        
        <Box sx={{ mb: 3 }}>
          {/* ✅ RESTYLING 04/03/2026: Toolbar brand Nonna Claudia */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            flexWrap: 'wrap',
            gap: 1.5,
            p: { xs: 1.5, sm: 2 },
            borderRadius: 3,
            background: `linear-gradient(135deg, ${BRAND.greenDark} 0%, ${BRAND.green} 100%)`,
            boxShadow: '0 4px 16px rgba(46,123,0,0.25)',
          }}>
            {/* Titolo + badge prodotti */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                variant="h6"
                component="h1"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.15rem' },
                  textShadow: '0 1px 3px rgba(0,0,0,0.20)',
                }}
              >
                Gestione Ordini
              </Typography>
              {prodottiCaricati && (
                <Chip
                  label={`${Object.values(prodottiDisponibili).flat().length} prodotti`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.20)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    border: '1px solid rgba(255,255,255,0.30)',
                    height: 22,
                  }}
                />
              )}
            </Box>

            {/* Azioni toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Tooltip title={syncInProgress ? 'Sincronizzazione...' : 'Sincronizza'}>
                <span>
                  <IconButton onClick={() => sincronizzaConMongoDB()} disabled={syncInProgress} size="small"
                    sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                    <SyncIcon fontSize="small" className={syncInProgress ? 'rotating' : ''} />
                  </IconButton>
                </span>
              </Tooltip>

              <Button variant="outlined" size="small" startIcon={<SettingsIcon />} onClick={() => setDialogLimitiOpen(true)}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.50)', fontSize: '0.78rem', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.12)' } }}>
                Limiti
              </Button>

              <Button variant="contained" size="small" startIcon={<WhatsAppIcon />}
                onClick={() => {
                  const whatsappAbilitato = localStorage.getItem('whatsapp_enabled') === 'true';
                  if (!whatsappAbilitato) { alert('⚠️ Dashboard WhatsApp non disponibile su questo dispositivo.\n\nUsa il PC principale con WhatsApp Desktop installata.\n\nPer abilitare su questo PC (solo amministratori), apri Console (F12) e scrivi:\nlocalStorage.setItem("whatsapp_enabled", "true")'); return; }
                  setDashboardWhatsAppAperto(true);
                }}
                sx={{ bgcolor: '#25D366', color: 'white', fontSize: '0.78rem', '&:hover': { bgcolor: '#1EB85A' }, boxShadow: '0 2px 8px rgba(37,211,102,0.40)' }}>
                WhatsApp
              </Button>

              <Button variant="contained" size="small" startIcon={<Phone />} onClick={() => setStoricoChiamateAperto(true)}
                sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', fontSize: '0.78rem', border: '1px solid rgba(255,255,255,0.30)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>
                Chiamate
              </Button>

              <Button variant="contained" size="small" startIcon={<AnalyticsIcon />} onClick={() => setStatisticheChiamateAperto(true)}
                sx={{ display: { xs: 'none', md: 'inline-flex' }, bgcolor: 'rgba(255,255,255,0.18)', color: 'white', fontSize: '0.78rem', border: '1px solid rgba(255,255,255,0.30)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>
                Statistiche
              </Button>

              <Button variant="contained" size="small" startIcon={<CakeIcon />} onClick={() => setDialogZeppoleOpen(true)}
                sx={{ bgcolor: BRAND.red, color: 'white', fontSize: '0.78rem', '&:hover': { bgcolor: BRAND.redDark }, boxShadow: '0 2px 8px rgba(204,34,0,0.35)' }}>
                Zeppole
              </Button>

              <Button variant="contained" size="small" startIcon={<PrintIcon />} onClick={() => setRiepilogoStampabileAperto(true)}
                sx={{ bgcolor: BRAND.gold, color: BRAND.brownDark, fontWeight: 700, fontSize: '0.78rem', '&:hover': { bgcolor: BRAND.goldDark, color: 'white' }, boxShadow: '0 2px 8px rgba(200,168,48,0.40)' }}>
                Stampa
              </Button>

              <Chip label={`${statistiche.totaleOrdini} ordini`} size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.20)', color: 'white', fontWeight: 700, fontSize: '0.72rem', border: '1px solid rgba(255,255,255,0.30)' }} />

              <Tooltip title="Ricarica">
                <IconButton onClick={() => sincronizzaConMongoDB()} disabled={syncInProgress} size="small"
                  sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {/* ✅ RESTYLING: Status bar compatta */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Chip
              icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
              label={isConnected ? 'Online' : 'Offline'}
              size="small"
              sx={{
                bgcolor: isConnected ? 'rgba(46,123,0,0.10)' : 'rgba(204,34,0,0.10)',
                color: isConnected ? BRAND.greenDark : BRAND.red,
                border: `1px solid ${isConnected ? BRAND.green : BRAND.red}`,
                fontWeight: 700,
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
            
            {ultimaSync && (
              <Typography variant="caption" color="text.secondary">
                Ultimo sync: {ultimaSync.toLocaleTimeString('it-IT')}
              </Typography>
            )}
            
            {storageUsed > 0 && (
              <Chip
                icon={<StorageIcon />}
                label={`Storage: ${storageUsed} MB`}
                size="small"
                variant="outlined"
              />
            )}
            
            {syncInProgress && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption">Sincronizzazione...</Typography>
              </Box>
            )}
          </Box>
          
          {syncInProgress && <LinearProgress sx={{ mb: 2 }} />}
        </Box>
        
        {/* ✅ NUOVO 11/12/2025: Barra Ricerca e Totali Periodo */}
        {/* ✅ RESTYLING 04/03/2026: Search bar brand */}
        <Paper sx={{
          p: { xs: 1.5, sm: 2 }, mb: 2,
          backgroundColor: 'white',
          border: `1px solid rgba(46,123,0,0.15)`,
          borderLeft: `4px solid ${BRAND.green}`,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(46,123,0,0.08)',
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Ricerca per Cliente */}
            <TextField
              size="small"
              placeholder="Cerca cliente... (es. Mameli)"
              value={ricercaCliente}
              onChange={(e) => setRicercaCliente(e.target.value)}
              sx={{ minWidth: 250, backgroundColor: 'white', borderRadius: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: ricercaCliente && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setRicercaCliente('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            {ricercaCliente && (
              <Chip 
                label={`Filtro: "${ricercaCliente}"`}
                onDelete={() => setRicercaCliente('')}
                color="primary"
                size="small"
              />
            )}
            
            <Divider orientation="vertical" flexItem />
            
            {/* Pulsante Totali Periodo */}
            <Button
              variant="contained"
              color="secondary"
              startIcon={<CalculateIcon />}
              onClick={() => setDialogTotaliPeriodo(true)}
              size="small"
            >
              Totali Periodo
            </Button>
            
            {ricercaCliente && (
              <Typography variant="body2" color="text.secondary">
                Mostrando ordini di tutti i giorni per "{ricercaCliente}"
              </Typography>
            )}
          </Box>
        </Paper>
        
        {/* ✅ FIX 27/01/2026: Data grande spostata qui sopra TotaliProduzione */}
        {!caricamento && !ricercaCliente && (
          <Box sx={{ mb: 2 }}>
            {/* ✅ RESTYLING 04/03/2026: Barra data brand */}
            <Box sx={{
              p: { xs: 1.5, sm: 2 },
              background: 'linear-gradient(135deg, #0D1B2A 0%, #1B2A4A 50%, #1A237E 100%)',
              borderRadius: 3,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(13,27,42,0.40)',
              border: `2px solid ${BRAND.gold}`,
            }}>
              {/* Freccia sinistra */}
              <IconButton
                onClick={() => {
                  const data = new Date(dataSelezionata);
                  data.setDate(data.getDate() - 1);
                  setDataSelezionata(data.toISOString().split('T')[0]);
                }}
                sx={{
                  color: BRAND.goldLight,
                  fontSize: '1.5rem',
                  bgcolor: 'rgba(200,168,48,0.15)',
                  '&:hover': { bgcolor: 'rgba(200,168,48,0.30)', color: BRAND.gold },
                  transition: 'all 0.15s ease',
                  width: 44, height: 44,
                }}
              >
                ◀
              </IconButton>

              {/* Data centrale */}
              <Box sx={{ textAlign: 'center', flex: 1, px: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.2rem' },
                    color: 'white',
                    textShadow: '0 1px 4px rgba(0,0,0,0.30)',
                    lineHeight: 1.3,
                  }}
                >
                  {['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'][new Date(dataSelezionata + 'T12:00:00').getDay()]}
                  {' '}
                  {new Date(dataSelezionata + 'T12:00:00').toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }).toUpperCase()}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 0.5 }}>
                  <Chip
                    label={`${ordini.filter(o => (o.dataRitiro || '').startsWith(dataSelezionata)).length} ordini`}
                    size="small"
                    sx={{ bgcolor: 'rgba(200,168,48,0.25)', color: BRAND.goldLight, fontWeight: 700, fontSize: '0.72rem', height: 20, border: `1px solid ${BRAND.gold}` }}
                  />
                  <Chip
                    label={`${ordini.filter(o => (o.dataRitiro || '').startsWith(dataSelezionata)).reduce((acc, o) => acc + (o.prodotti || []).length, 0)} prodotti`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '0.72rem', height: 20 }}
                  />
                </Box>
              </Box>

              {/* Freccia destra */}
              <IconButton
                onClick={() => {
                  const data = new Date(dataSelezionata);
                  data.setDate(data.getDate() + 1);
                  setDataSelezionata(data.toISOString().split('T')[0]);
                }}
                sx={{
                  color: BRAND.goldLight,
                  bgcolor: 'rgba(200,168,48,0.15)',
                  '&:hover': { bgcolor: 'rgba(200,168,48,0.30)', color: BRAND.gold },
                  transition: 'all 0.15s ease',
                  width: 44, height: 44,
                }}
              >
                ▶
              </IconButton>
            </Box>
          </Box>
        )}
        
        {/* ✅ NUOVO 10/12/2025: Totali Produzione per categoria */}
        {!caricamento && !ricercaCliente && (
          <TotaliProduzione ordini={ordini} dataSelezionata={dataSelezionata} />
        )}
        
        {caricamento ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={60} />
            <Typography sx={{ ml: 2, alignSelf: 'center' }}>
              Caricamento ordini...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {/* ✅ NUOVO: Passa ordini filtrati per cliente se ricerca attiva */}
              <OrdiniList 
                ordini={ricercaCliente ? ordini.filter(o => {
                  // ✅ FIX: Gestisci cliente come stringa O oggetto
                  let clienteStr = '';
                  if (typeof o.cliente === 'string') {
                    clienteStr = o.cliente;
                  } else if (o.cliente && typeof o.cliente === 'object') {
                    clienteStr = `${o.cliente.nome || ''} ${o.cliente.cognome || ''}`.trim();
                  }
                  // Fallback a nomeCliente se cliente è vuoto
                  if (!clienteStr && o.nomeCliente) {
                    clienteStr = o.nomeCliente;
                  }
                  // ✅ FIX 28/02/2026: Cerca anche nel telefono
                  const telefonoStr = o.telefono || o.cliente?.telefono || o.cliente?.cellulare || '';
                  const search = ricercaCliente.toLowerCase();
                  return clienteStr.toLowerCase().includes(search) || 
                         telefonoStr.replace(/\s+/g, '').includes(search.replace(/\s+/g, ''));
                }) : ordini}
                onDelete={eliminaOrdine}
                onEdit={(ordine, e) => {
                  // ✅ FIX 22/11/2025: Blocca apertura modifica se click su L/F/C
                  if (e && (
                    e.target.closest('[data-no-edit="true"]') || 
                    e.target.dataset.noEdit === 'true' ||
                    e.target.getAttribute('data-no-edit') === 'true'
                  )) {
                    console.log('🛑 Click su L/F/C, blocco apertura modifica ordine');
                    return; // NON aprire il dialog di modifica
                  }
                  
                  setOrdineSelezionato(ordine);
                  setDialogoNuovoOrdineAperto(true);
                }}
                onDateChange={setDataSelezionata}
                onNuovoOrdine={() => {
                  setOrdineSelezionato(null);
                  setDialogoNuovoOrdineAperto(true);
                }}
                onSegnaComePronto={segnaComePronto}  // ✅ NUOVO 08/01/2026: Passa funzione auto-send WhatsApp
                dataSelezionata={ricercaCliente ? null : dataSelezionata}  // ✅ FIX: null quando ricerca attiva
                isConnected={isConnected}
                ricercaCliente={ricercaCliente}  // ✅ NUOVO: passa ricerca
                mostraTutteLeDate={!!ricercaCliente}  // ✅ NUOVO: flag per mostrare tutte le date
              />
            </Grid>
          </Grid>
        )}
        
        {/* ✅ RESTYLING: FAB brand, sopra bottom nav su mobile */}
        <Fab
          aria-label="Nuovo ordine"
          sx={{
            position: 'fixed',
            bottom: { xs: 72, sm: 24 },  // 72 = 60px bottom nav + 12px margin
            right: { xs: 16, sm: 24 },
            background: `linear-gradient(135deg, ${BRAND.greenDark}, ${BRAND.green})`,
            color: 'white',
            boxShadow: '0 6px 20px rgba(46,123,0,0.40)',
            '&:hover': {
              background: `linear-gradient(135deg, ${BRAND.green}, ${BRAND.greenLight})`,
              boxShadow: '0 8px 28px rgba(46,123,0,0.50)',
            },
            width: { xs: 52, sm: 56 },
            height: { xs: 52, sm: 56 },
          }}
          onClick={() => {
            setOrdineSelezionato(null);
            setDialogoNuovoOrdineAperto(true);
          }}
        >
          <AddIcon />
        </Fab>
        
        {dialogoNuovoOrdineAperto && (
         <NuovoOrdine
  open={dialogoNuovoOrdineAperto}
  onClose={() => {
    console.log('🧹 [GestoreOrdini] Chiusura NuovoOrdine - pulizia completa');
    setDialogoNuovoOrdineAperto(false);
    setClienteIdDaChiamata(null);
    setNumeroDaChiamata(null);
    setClienteDaChiamata(null);
    setOrdineSelezionato(null);
    
    // ✅ FIX 04/03/2026: Chiudi popup chiamata DEFINITIVAMENTE
    if (clearChiamata) clearChiamata();
    
    // Pulizia TOTALE localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nuovoOrdine_clientePreselezionato');
      localStorage.removeItem('chiamataCliente');
      localStorage.removeItem('_openNuovoOrdineOnLoad');
      localStorage.removeItem('ordini_filtroCliente');
      
      // 🆕 05/03/2026: Pulisci bozza ordine (chiusura volontaria)
      sessionStorage.removeItem('_ordine_draft');
    }
    
    // 🆕 28/02/2026: Esegui sync pendente dopo chiusura dialog
    if (pendingSyncRef.current) {
      console.log('🔄 Sync pendente in esecuzione dopo chiusura form...');
      pendingSyncRef.current = false;
      setTimeout(() => sincronizzaConMongoDB(), 500);
    }
  }}
  onSave={salvaOrdine}
  ordineIniziale={ordineSelezionato}
  clienteIdPreselezionato={clienteIdDaChiamata}
  clientePrecompilato={clienteDaChiamata} // ✅ FIX 17/01/2026
  numeroPrecompilato={numeroDaChiamata} // ✅ FIX 17/01/2026
  isConnected={isConnected}
          />
        )}
        
        <Dialog 
          open={dialogLimitiOpen} 
          onClose={() => setDialogLimitiOpen(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{ sx: { height: '90vh' } }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">📊 Gestione Limiti Capacità Produttiva</Typography>
              <IconButton onClick={() => setDialogLimitiOpen(false)} size="small">
                ×
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <GestioneLimiti />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogLimitiOpen(false)}>
              Chiudi
            </Button>
          </DialogActions>
        </Dialog>
        
        <Dialog 
          open={riepilogoAperto} 
          onClose={() => setRiepilogoAperto(false)}
          maxWidth="lg" 
          fullWidth
          PaperProps={{ sx: { height: '90vh' } }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Riepilogo Giornaliero</Typography>
              <IconButton onClick={() => setRiepilogoAperto(false)} size="small">
                ×
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <RiepilogoSemplice 
              ordini={ordini} 
              dataSelezionata={dataSelezionata}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRiepilogoAperto(false)}>Chiudi</Button>
          </DialogActions>
        </Dialog>
        
        {riepilogoStampabileAperto && (
  <RiepilogoStampabile
    ordini={ordini}
    data={dataSelezionata}
    onClose={() => setRiepilogoStampabileAperto(false)}
  />
)}
        
        <Dialog 
          open={whatsappHelperAperto} 
          onClose={() => setWhatsappHelperAperto(false)}
          maxWidth="lg" 
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">WhatsApp Helper</Typography>
              <IconButton onClick={() => setWhatsappHelperAperto(false)} size="small">
                ×
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <WhatsAppHelperComponent ordini={ordini} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWhatsappHelperAperto(false)}>Chiudi</Button>
          </DialogActions>
        </Dialog>
        
        {/* ✅ NUOVISSIMO: Dialog Storico Chiamate (16/11/2025) */}
        <Dialog 
          open={storicoChiamateAperto} 
          onClose={() => setStoricoChiamateAperto(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{ sx: { height: '95vh' } }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">📞 Storico Chiamate</Typography>
              <IconButton onClick={() => setStoricoChiamateAperto(false)} size="small">
                ×
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <StoricoChiamate />
          </DialogContent>
        </Dialog>
        
        {/* ✅ NUOVISSIMO: Dialog Statistiche Chiamate (16/11/2025) */}
        <Dialog 
          open={statisticheChiamateAperto} 
          onClose={() => setStatisticheChiamateAperto(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{ sx: { height: '95vh' } }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">📊 Statistiche Chiamate</Typography>
              <IconButton onClick={() => setStatisticheChiamateAperto(false)} size="small">
                ×
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <StatisticheChiamate />
          </DialogContent>
        </Dialog>
        
        {/* ✅ NUOVO 11/12/2025: Dialog Totali per Periodo */}
        <Dialog 
          open={dialogTotaliPeriodo} 
          onClose={() => setDialogTotaliPeriodo(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">📊 Totali Produzione per Periodo</Typography>
              <IconButton onClick={() => setDialogTotaliPeriodo(false)} size="small">
                ×
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 1 }}>
              <TextField
                type="date"
                label="Data Inizio"
                value={periodoInizio}
                onChange={(e) => setPeriodoInizio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                type="date"
                label="Data Fine"
                value={periodoFine}
                onChange={(e) => setPeriodoFine(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
            
            {/* Calcola e mostra totali per il periodo */}
            <TotaliPeriodoComponent 
              ordini={ordini}
              dataInizio={periodoInizio}
              dataFine={periodoFine}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogTotaliPeriodo(false)}>Chiudi</Button>
          </DialogActions>
        </Dialog>

        {/* 🆕 22/01/2026: Dialog Auto-Refresh */}
        <Dialog open={showRefreshDialog} onClose={() => { setShowRefreshDialog(false); registerActivity(); }}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimerIcon color="warning" /> Aggiornamento Sistema
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              <Typography>Il sistema verrà aggiornato per:</Typography>
              <ul><li>Prevenire problemi cache</li><li>Sincronizzare dati</li><li>Ottimizzare performance</li></ul>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1, textAlign: 'center' }}>
                <strong>Aggiornamento tra: {autoRefreshCountdown} secondi</strong>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setShowRefreshDialog(false); registerActivity(); }}>⏰ Posticipa 10 min</Button>
            <Button onClick={() => { setShowRefreshDialog(false); window.location.reload(); }} variant="contained">🔄 Ora</Button>
          </DialogActions>
        </Dialog>

               
        <Snackbar
          open={notifica.aperta}
          autoHideDuration={6000}
          onClose={chiudiNotifica}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={chiudiNotifica} 
            severity={notifica.tipo} 
            sx={{ width: '100%' }}
            variant="filled"
          >
            {notifica.messaggio}
          </Alert>
        </Snackbar>

        {/* ✅ FIX 04/03/2026: CallPopup - tutti i callback usano clearChiamata (mai stale) */}
        <CallPopup
          chiamata={chiamataCorrente}
          isOpen={isPopupOpen && !dialogoNuovoOrdineAperto}
          onClose={() => {
            console.log('🔒 [GestoreOrdini] onClose CallPopup → clearChiamata');
            if (clearChiamata) clearChiamata();
          }}
          onVediOrdini={(cognome, telefono) => {
            console.log('📦 [GestoreOrdini] Vedi ordini per:', cognome, telefono);
            // ✅ PRIMA imposta ricerca, POI chiudi popup
            const ricerca = telefono || cognome || '';
            if (ricerca) {
              setRicercaCliente(ricerca);
            }
            if (clearChiamata) clearChiamata();
          }}
          onApriOrdine={(ordineId) => {
            console.log('📦 [GestoreOrdini] Apri ordine specifico da popup:', ordineId);
            const ordine = ordini.find(o => o._id === ordineId);
            if (ordine) {
              setOrdineSelezionato(ordine);
              setDialogoNuovoOrdineAperto(true);
            } else {
              const cognome = chiamataCorrente?.cliente?.cognome || '';
              const telefono = chiamataCorrente?.cliente?.telefono || chiamataCorrente?.numero || '';
              const telefonoPulito = telefono.replace(/^\+39/, '');
              if (telefonoPulito || cognome) {
                setRicercaCliente(telefonoPulito || cognome);
              }
            }
          }}
          onNuovoOrdine={(cliente, numero) => {
            console.log('📞 [GestoreOrdini] onNuovoOrdine da CallPopup:', {
              cliente: cliente ? `${cliente.nome} ${cliente.cognome}` : 'sconosciuto',
              clienteId: cliente?._id,
              numero
            });
            
            // ✅ Salva dati PRIMA di clearChiamata (che azzera chiamataCorrente)
            const clienteSalvato = cliente ? { ...cliente } : null;
            const numeroSalvato = numero ? numero.replace(/^\+39/, '') : null;
            
            // Pulizia TOTALE
            setClienteIdDaChiamata(null);
            setClienteDaChiamata(null);
            setNumeroDaChiamata(null);
            setOrdineSelezionato(null);
            
            if (typeof window !== 'undefined') {
              localStorage.removeItem('nuovoOrdine_clientePreselezionato');
              localStorage.removeItem('chiamataCliente');
              localStorage.removeItem('_openNuovoOrdineOnLoad');
            }
            
            // ✅ Chiudi popup DEFINITIVAMENTE
            if (clearChiamata) clearChiamata();
            
            // Imposta NUOVI dati
            if (clienteSalvato && clienteSalvato._id) {
              setClienteIdDaChiamata(clienteSalvato._id);
              setClienteDaChiamata(clienteSalvato);
            }
            if (numeroSalvato) {
              setNumeroDaChiamata(numeroSalvato);
            }
            
            setTimeout(() => {
              setDialogoNuovoOrdineAperto(true);
              console.log('✅ [GestoreOrdini] Dialog Nuovo Ordine aperto');
            }, 100);
          }}
        />

{/* ✅ FIX 18/01/2026: GestioneZeppole ha già il proprio Dialog interno */}
<GestioneZeppole 
  open={dialogZeppoleOpen} 
  onClose={() => setDialogZeppoleOpen(false)} 
/>

{/* ✅ DISABILITATO 17/01/2026: Popup HACCP Automatico - Componente non trovato
{showHACCPPopup && (
  <HACCPAutoPopup 
    onClose={closeHACCPPopup}
  />
)}
*/}

{/* ✅ NUOVO 31/01/2026: Dialog Dashboard WhatsApp */}
<Dialog 
  open={dashboardWhatsAppAperto} 
  onClose={() => setDashboardWhatsAppAperto(false)}
  maxWidth="lg"
  fullWidth
>
  <DialogTitle>
    📱 Dashboard Promemoria WhatsApp
    <IconButton
      onClick={() => setDashboardWhatsAppAperto(false)}
      sx={{ position: 'absolute', right: 8, top: 8 }}
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>
  <DialogContent>
    <DashboardWhatsApp />
  </DialogContent>
</Dialog>

      </Container>
    </>
  );
}