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
  Calculate as CalculateIcon  // ✅ NUOVO per calcolo totali
} from '@mui/icons-material';

import { PRODOTTI_CONFIG, getProdottoConfig, LISTA_PRODOTTI } from '../config/prodottiConfig';
import { 
  calcolaPrezzoOrdine, 
  formattaPrezzo,
  getUnitaMisuraDisponibili 
} from '../utils/calcoliPrezzi';

import NuovoOrdine from './NuovoOrdine';
import OrdiniList from './OrdiniList';
import InstallPWA from './InstallPWA';
import StatisticheWidget from './widgets/StatisticheWidget';
import RiepilogoGiornaliero from './RiepilogoGiornaliero';
import RiepilogoStampabile from './RiepilogoStampabile';
import GestioneLimiti from './GestioneLimiti';

// ✅ NUOVO: Import per CallPopup e Pusher Integration
import CallPopup from './CallPopup';
import useIncomingCall from '@/hooks/useIncomingCall';  // ✅ AGGIUNTO

// ✅ NUOVISSIMO: Import per Tag e Statistiche Chiamate (16/11/2025)
import StoricoChiamate from './StoricoChiamate';
import GestioneZeppole from './GestioneZeppole';
import StatisticheChiamate from './StatisticheChiamate';
import { Cake as CakeIcon, Close as CloseIcon, Thermostat as ThermostatIcon } from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
  API_URL.replace('https://', 'wss://').replace('http://', 'ws://').replace('/api', '');

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
    
    // ✅ FIX 15/01/2026: Converti € in Kg per Zeppole (€21/Kg)
    if (unita === '€' || unita === 'euro') {
      if (nomeLC.includes('zeppol')) {
        // Zeppole: €21/Kg → quantità € / 21 = Kg
        return quantita / 21;
      }
      // Altri prodotti in € non hanno peso
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
    
    ordiniFiltrati.forEach(ordine => {
      (ordine.prodotti || []).forEach(prodotto => {
        // ✅ FIX 19/12/2025: Escludi prodotti "Fatto" (completato) e "Consegnato" dai totali
        if (prodotto.statoProduzione === 'completato' || 
            prodotto.statoProduzione === 'consegnato') {
          return; // Non contare questo prodotto nei totali
        }
        
        const nomeLC = prodotto.nome?.toLowerCase() || '';
        let peso = convertiInKg(prodotto);
        
        if (peso === 0) return; // Ignora € e prodotti senza peso
        
        // ✅ FIX 15/12/2025: VASSOIO deve essere controllato PRIMA di "dolci misti"
        // perché "Vassoio Dolci Misti" contiene "dolci misti" come sottostringa!
        if (nomeLC.includes('vassoio') && prodotto.dettagliCalcolo?.composizione) {
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
        
        // ✅ CASO SPECIALE: DOLCI MIX / DOLCI MISTI generici (senza composizione vassoio)
        if (nomeLC.includes('dolci mix') || nomeLC.includes('dolci misti')) {
          // Esplodi usando composizione standard
          for (const [componente, percentuale] of Object.entries(COMPOSIZIONE_DOLCI_MISTI)) {
            totali[componente] = (totali[componente] || 0) + (peso * percentuale);
          }
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
    <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f8f9fa' }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#555' }}>
        📊 TOTALI PRODUZIONE ({new Date(dataSelezionata).toLocaleDateString('it-IT')})
      </Typography>
      
      {/* Riga principale con macro-totali */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        {totaleRavioli > 0 && (
          <Chip 
            label={`🥟 Ravioli: ${totaleRavioli.toFixed(1)} KG`} 
            color="error" 
            sx={{ fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('RAVIOLI')}
          />
        )}
        {totalePardulas > 0 && (
          <Chip 
            label={`🟡 Pardulas: ${totalePardulas.toFixed(1)} KG`} 
            color="warning" 
            sx={{ fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('PARDULAS')}
          />
        )}
        {totaleDolci > 0 && (
          <Chip 
            label={`🍪 Dolci: ${totaleDolci.toFixed(1)} KG`} 
            color="success" 
            sx={{ fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('DOLCI')}
          />
        )}
        {totalePanadas > 0 && (
          <Chip 
            label={`🥧 Panadas: ${totalePanadas.toFixed(1)} KG`} 
            sx={{ fontWeight: 'bold', backgroundColor: '#ff9800', color: 'white', cursor: 'pointer' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('PANADAS')}
          />
        )}
        {totaleSebadas > 0 && (
          <Chip 
            label={`🍪 Seabadas: ${totaleSebadas.toFixed(1)} KG`} 
            sx={{ fontWeight: 'bold', backgroundColor: '#AA96DA', color: 'white', cursor: 'pointer' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('SEABADAS')}
          />
        )}
        {totaleZeppole > 0 && (
          <Chip 
            label={`🍩 Zeppole: ${totaleZeppole.toFixed(1)} KG`} 
            sx={{ fontWeight: 'bold', backgroundColor: '#FCCD90', color: 'white', cursor: 'pointer' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('ZEPPOLE')}
          />
        )}
        {totalePanadine > 0 && (
          <Chip 
            label={`🥐 Panadine: ${totalePanadine.toFixed(1)} KG`} 
            sx={{ fontWeight: 'bold', backgroundColor: '#FCBAD3', color: 'white', cursor: 'pointer' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('PANADINE')}
          />
        )}
        {totalePasta > 0 && (
          <Chip 
            label={`🍝 Pasta: ${totalePasta.toFixed(1)} KG`} 
            sx={{ fontWeight: 'bold', backgroundColor: '#B0BEC5', color: 'white', cursor: 'pointer' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('PASTA')}
          />
        )}
        {totaleAltri > 0 && (
          <Chip 
            label={`📦 Altri: ${totaleAltri.toFixed(1)} KG`} 
            color="info" 
            sx={{ fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => window.scrollToCategoria && window.scrollToCategoria('ALTRI')}
          />
        )}
        <Chip label={`TOTALE: ${totaleGenerale.toFixed(1)} KG`} color="primary" sx={{ fontWeight: 'bold', ml: 'auto' }} />
      </Box>
      
      {/* ✅ FIX 19/12/2025: Riga dettaglio RAVIOLI per variante! */}
      {totaleRavioli > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, pl: 2, borderLeft: '3px solid #f44336' }}>
          <Typography variant="caption" sx={{ width: '100%', color: '#666', mb: 0.5, fontWeight: 'bold' }}>Dettaglio Ravioli:</Typography>
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
      )}
      
      {/* Riga dettaglio dolci */}
      {totaleDolci > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, pl: 2, borderLeft: '3px solid #4caf50' }}>
          <Typography variant="caption" sx={{ width: '100%', color: '#666', mb: 0.5 }}>Dettaglio Dolci:</Typography>
          <ChipDettaglio label="Ciambelle" value={totali.Ciambelle} color="success" />
          <ChipDettaglio label="Amaretti" value={totali.Amaretti} color="success" />
          <ChipDettaglio label="Gueffus" value={totali.Gueffus} color="success" />
          <ChipDettaglio label="Bianchini" value={totali.Bianchini} color="success" />
          <ChipDettaglio label="Pabassine" value={totali.Pabassine} color="success" />
          </Box>
      )}
      
      {/* ✅ Riga dettaglio panadas farcite */}
      {totalePanadas > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, pl: 2, borderLeft: '3px solid #ff9800' }}>
          <Typography variant="caption" sx={{ width: '100%', color: '#666', mb: 0.5 }}>Dettaglio Panadas:</Typography>
          <ChipDettaglio label="Agnello" value={totali.PanadaAgnello} color="warning" />
          <ChipDettaglio label="Maiale" value={totali.PanadaMaiale} color="warning" />
          <ChipDettaglio label="Vitella" value={totali.PanadaVitella} color="warning" />
          <ChipDettaglio label="Verdure" value={totali.PanadaVerdure} color="warning" />
          <ChipDettaglio label="Anguille" value={totali.PanadaAnguille} color="warning" />
        </Box>
      )}
      
      {/* Riga dettaglio altri */}
      {totaleAltri > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, pl: 2, borderLeft: '3px solid #2196f3' }}>
          <Typography variant="caption" sx={{ width: '100%', color: '#666', mb: 0.5 }}>Dettaglio Altri:</Typography>
          <ChipDettaglio label="Pasta Panada" value={totali.PastaPerPanada} color="info" />
          <ChipDettaglio label="Pizzette" value={totali.Pizzette} color="info" />
          <ChipDettaglio label="Fregula" value={totali.Fregula} color="info" />
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
    
    // ✅ FIX 15/01/2026: Converti € in Kg per Zeppole (€21/Kg)
    if (unita === '€' || unita === 'euro') {
      if (nomeLC.includes('zeppol')) {
        return quantita / 21;
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
  const [riepilogoStampabileAperto, setRiepilogoStampabileAperto] = useState(false);
  const [whatsappHelperAperto, setWhatsappHelperAperto] = useState(false);
  
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
    
    // ✅ FIX 17/01/2026: Salva cliente COMPLETO e numero per precompilazione
    if (chiamataCorrente) {
      if (chiamataCorrente.cliente) {
        setClienteIdDaChiamata(chiamataCorrente.cliente._id);
        setClienteDaChiamata(chiamataCorrente.cliente); // ✅ NUOVO
        localStorage.setItem('chiamataCliente', JSON.stringify(chiamataCorrente));
      }
      // ✅ NUOVO: Salva numero anche se cliente non trovato
      if (chiamataCorrente.numero) {
        setNumeroDaChiamata(chiamataCorrente.numero);
      }
    }
    
    // Apri dialogo nuovo ordine
    setDialogoNuovoOrdineAperto(true);
    
    // ✅ FIX 14/01/2026: CHIUDI IL POPUP!
    // Prima mancava questa chiamata, per questo il popup restava aperto
    handleClosePopup();
    
    // Chiama anche hook (per consistenza)
    handleAcceptCall();
  };
    
  // ----------------------------------------------------------------
  // REFS
  // ----------------------------------------------------------------
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const syncIntervalRef = useRef(null);
  
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
  // EFFETTO 3: Gestione chiamata in arrivo da CallPopup
  // ----------------------------------------------------------------
  useEffect(() => {
    console.log('🔵 [GestoreOrdini] useEffect MOUNT eseguito');
    
    const chiamataData = localStorage.getItem('chiamataCliente');
    console.log('🔵 [GestoreOrdini] localStorage:', chiamataData);
    
    if (chiamataData) {
      try {
        const { clienteId, telefono } = JSON.parse(chiamataData);
        
        console.log('📞 Gestione chiamata ricevuta:', { clienteId, telefono });
        
        if (clienteId) {
          setClienteIdDaChiamata(clienteId);
          
          setTimeout(() => {
            setDialogoNuovoOrdineAperto(true);
            console.log('✅ Dialog nuovo ordine aperto per cliente:', clienteId);
          }, 300);
        } else {
          console.log('⚠️ Cliente sconosciuto, numero:', telefono);
          setTimeout(() => {
            setDialogoNuovoOrdineAperto(true);
          }, 300);
        }
        
        setTimeout(() => {
  localStorage.removeItem('chiamataCliente');
  console.log('🗑️ Dati chiamata rimossi da localStorage');
}, 500); // ✅ 500ms invece di 3000ms
        
      } catch (error) {
        console.error('❌ Errore parsing chiamata:', error);
        localStorage.removeItem('chiamataCliente');
      }
    }
  }, []);
  
// ----------------------------------------------------------------
// EFFETTO 3bis: Listener per chiamate (gestisce anche component già montato)
// ----------------------------------------------------------------
useEffect(() => {
  const handleNuovaChiamata = () => {
    console.log('🔔 [GestoreOrdini] Evento nuova-chiamata ricevuto');
    
    const chiamataData = localStorage.getItem('chiamataCliente');
    console.log('🔔 [GestoreOrdini] localStorage:', chiamataData);
    
    if (chiamataData) {
      try {
        const { clienteId, telefono } = JSON.parse(chiamataData);
        
        console.log('📞 Gestione chiamata ricevuta:', { clienteId, telefono });
        
        if (clienteId) {
          setClienteIdDaChiamata(clienteId);
        }
        
        setTimeout(() => {
          setDialogoNuovoOrdineAperto(true);
          console.log('✅ Dialog nuovo ordine aperto');
        }, 300);
        
        setTimeout(() => {
  localStorage.removeItem('chiamataCliente');
  console.log('🗑️ Dati chiamata rimossi da localStorage');
}, 3000); // ✅ 3 secondi invece di 500ms
        
      } catch (error) {
        console.error('❌ Errore parsing chiamata:', error);
        localStorage.removeItem('chiamataCliente');
      }
    }
  };

  // Listener per evento custom
  window.addEventListener('nuova-chiamata', handleNuovaChiamata);
  
  return () => {
    window.removeEventListener('nuova-chiamata', handleNuovaChiamata);
  };
}, []);

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
    
    try {
      setSyncInProgress(true);
      console.log(`🔄 Sincronizzazione in corso... (tentativo ${retry + 1}/2)`);
      
      // ✅ FIX 13/12/2025: Prima prova con filtro data, poi fallback senza
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);
      const dataLimiteISO = dataLimite.toISOString().split('T')[0];
      
      let url = `${API_URL}/ordini`;
      // Prova prima con filtro (se backend lo supporta)
      // Se fallisce, ricarica senza filtro
      
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
  }, [syncInProgress]);

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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuovoOrdine)
      });
      
      if (response.ok) {
        const ordineCreato = await response.json();
        console.log('✅ Ordine creato con successo:', ordineCreato);
        
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
        
        mostraNotifica('Ordine salvato e giacenze aggiornate', 'success');
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
      console.log('🟢 Segno ordine come pronto:', ordine._id);
      
      // Aggiorna stato ordine
      const response = await fetch(`${API_URL}/ordini/${ordine._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ 
          stato: 'pronto',
          whatsappInviato: false // Reset flag per nuovo invio
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Errore aggiornamento ordine');
      }
      
      console.log('✅ Ordine aggiornato a "pronto"');
      
      // ✅ NUOVO: Invia WhatsApp con auto-send
      await inviaWhatsAppPronto(ordine, true); // true = auto-send attivo
      
      // Ricarica ordini
      await sincronizzaConMongoDB();
      
      mostraNotifica('✅ Ordine segnato come pronto e WhatsApp inviato automaticamente!', 'success');
      
    } catch (error) {
      console.error('❌ Errore segna come pronto:', error);
      mostraNotifica(`Errore: ${error.message}`, 'error');
    }
  };
  const salvaOrdine = async (nuovoOrdine) => {
    if (submitInCorso) return;
    
    setSubmitInCorso(true);
    
    try {
      if (ordineSelezionato) {
        await aggiornaOrdine({ ...ordineSelezionato, ...nuovoOrdine });
      } else {
        await creaOrdine(nuovoOrdine);
      }
      
      setOrdineSelezionato(null);
      setDialogoNuovoOrdineAperto(false);
      
    } catch (error) {
      console.error('Errore salvataggio:', error);
      mostraNotifica('Errore durante il salvataggio', 'error');
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
      
      <Container maxWidth="xl">
        <StatisticheWidget ordini={ordini} dataSelezionata={dataSelezionata} />
        
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" component="h1">
              Gestione Ordini {prodottiCaricati && `✅ (${Object.values(prodottiDisponibili).flat().length} prodotti caricati)`}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <InstallPWA />
              
              <Tooltip title={syncInProgress ? "Sincronizzazione in corso..." : "Sincronizza"}>
                <span>
                  <IconButton onClick={() => sincronizzaConMongoDB()} disabled={syncInProgress}>
                    <SyncIcon className={syncInProgress ? 'rotating' : ''} />
                  </IconButton>
                </span>
              </Tooltip>
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<SettingsIcon />}
                onClick={() => setDialogLimitiOpen(true)}
              >
                📊 Limiti Produzione
              </Button>
              
              <Button
                variant="contained"
                size="small"
                color="success"
                startIcon={<WhatsAppIcon />}
                onClick={() => setWhatsappHelperAperto(true)}
              >
                WhatsApp
              </Button>
              
              {/* ✅ NUOVISSIMO: Pulsanti Chiamate (16/11/2025) */}
              <Button
                variant="contained"
                size="small"
                color="info"
                startIcon={<Phone />}
                onClick={() => setStoricoChiamateAperto(true)}
              >
                📞 Storico Chiamate
              </Button>
              
              <Button
                variant="contained"
                size="small"
                color="secondary"
                startIcon={<AnalyticsIcon />}
                onClick={() => setStatisticheChiamateAperto(true)}
              >
                📊 Statistiche Chiamate
              </Button>
              
              <Button
                variant="contained"
                size="small"
                sx={{ 
                  bgcolor: '#FF6B9D',
                  color: 'white',
                  '&:hover': { bgcolor: '#FF4081' }
                }}
                startIcon={<CakeIcon />}
                onClick={() => setDialogZeppoleOpen(true)}
              >
                🎂 ZEPPOLE
              </Button>
              
              <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<ListAltIcon />}
              onClick={() => setRiepilogoAperto(true)}
>
              Riepilogo
</Button>

              <Button
                variant="contained"
                size="small"
                color="warning"
                startIcon={<PrintIcon />}
                onClick={() => setRiepilogoStampabileAperto(true)}
                sx={{ ml: 1 }}
              >
                📄 Stampabile
              </Button>
              
<Button
  variant="outlined"
  size="small"
  startIcon={<ExportIcon />}
  onClick={(e) => setMenuExport(e.currentTarget)}
>
  Export
</Button>
              <Menu
                anchorEl={menuExport}
                open={Boolean(menuExport)}
                onClose={() => setMenuExport(null)}
              >
                <MenuItem onClick={() => handleExport('csv')}>
                  <ExportIcon sx={{ mr: 1 }} /> CSV
                </MenuItem>
                <MenuItem onClick={() => handleExport('excel')}>
                  <ExportIcon sx={{ mr: 1 }} /> Excel
                </MenuItem>
                <MenuItem onClick={() => handleExport('pdf')}>
                  <ExportIcon sx={{ mr: 1 }} /> PDF
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleExport('print')}>
                  <PrintIcon sx={{ mr: 1 }} /> Stampa
                </MenuItem>
              </Menu>
              
              <Chip 
                label={`${statistiche.totaleOrdini} ordini`}
                variant="outlined"
                size="small"
              />
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<CleanIcon />}
                onClick={rimuoviDuplicati}
                disabled={caricamento}
              >
                Pulisci
              </Button>
              
              <IconButton onClick={() => sincronizzaConMongoDB()} disabled={syncInProgress}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
              label={isConnected ? 'Online' : 'Offline'}
              color={isConnected ? 'success' : 'error'}
              size="small"
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
        <Paper sx={{ p: 2, mb: 2, backgroundColor: '#e3f2fd' }}>
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
                  const search = ricercaCliente.toLowerCase();
                  return clienteStr.toLowerCase().includes(search);
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
        
        <Fab 
          color="primary" 
          aria-label="Nuovo ordine"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
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
    setDialogoNuovoOrdineAperto(false);
    setClienteIdDaChiamata(null);
    setNumeroDaChiamata(null); // ✅ FIX 17/01/2026
    setClienteDaChiamata(null); // ✅ FIX 17/01/2026
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

        {/* ✅ NUOVO: CallPopup per chiamate in arrivo da Pusher/3CX */}
        <CallPopup
          chiamata={chiamataCorrente}
          isOpen={isPopupOpen}
          onClose={handleClosePopup}
          onNuovoOrdine={(cliente, numero) => {
            // ✅ FIX 17/01/2026: Salva cliente e numero
            if (cliente) {
              setClienteIdDaChiamata(cliente._id);
              setClienteDaChiamata(cliente);
            }
            if (numero) {
              setNumeroDaChiamata(numero);
            }
            setDialogoNuovoOrdineAperto(true);
            handleClosePopup();
          }}
/>

{/* Dialog Zeppole */}
<Dialog
  open={dialogZeppoleOpen}
  onClose={() => setDialogZeppoleOpen(false)}
  maxWidth="xl"
  fullWidth
  PaperProps={{
    sx: {
      height: '90vh',
      maxHeight: '90vh'
    }
  }}
>
  <DialogTitle sx={{ 
    bgcolor: '#FF6B9D', 
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <CakeIcon />
      <Typography variant="h6">🎂 Gestione Zeppole</Typography>
    </Box>
    <IconButton 
      onClick={() => setDialogZeppoleOpen(false)}
      sx={{ color: 'white' }}
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>
  
  <DialogContent sx={{ p: 0, overflow: 'auto' }}>
    <GestioneZeppole />
  </DialogContent>
</Dialog>

{/* ✅ DISABILITATO 17/01/2026: Popup HACCP Automatico - Componente non trovato
{showHACCPPopup && (
  <HACCPAutoPopup 
    onClose={closeHACCPPopup}
  />
)}
*/}

      </Container>
    </>
  );
}