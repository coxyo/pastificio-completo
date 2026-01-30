'use client';

// components/PuliziaAutoPopup.js - FIXED ENDPOINT
// ✅ Usa /api/haccp/registrazione invece di /api/haccp/pulizia

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  LinearProgress,
  Alert,
  Chip
} from '@mui/material';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

// Aree pulizia giornaliera (4 aree)
const AREE_PULIZIA_GIORNALIERE = [
  { id: 'superfici', nome: 'Superfici di lavoro', prodotto: 'Detergente + Sanificante' },
  { id: 'pavimenti', nome: 'Pavimenti', prodotto: 'Detergente + Sanificante' },
  { id: 'attrezzature', nome: 'Attrezzature', prodotto: 'Detergente + Sanificante' },
  { id: 'servizi', nome: 'Servizi igienici', prodotto: 'Detergente + Sanificante' }
];

// Aree pulizia settimanale approfondita (5 aree)
const AREE_PULIZIA_SETTIMANALI = [
  { id: 'pareti', nome: 'Pareti', prodotto: 'Detergente + Sanificante' },
  { id: 'frigoriferi', nome: 'Frigoriferi (interno ed esterno)', prodotto: 'Detergente + Sanificante' },
  { id: 'abbattitore', nome: 'Abbattitore (pulizia approfondita)', prodotto: 'Detergente + Sanificante' },
  { id: 'scaffalature', nome: 'Scaffalature e ripiani', prodotto: 'Detergente + Sanificante' },
  { id: 'finestre', nome: 'Finestre e vetrate', prodotto: 'Detergente Vetri' }
];

export default function PuliziaAutoPopup({ onClose, forceShow = false }) {
  const [open, setOpen] = useState(false);
  const [tipoPulizia, setTipoPulizia] = useState('giornaliera'); // 'giornaliera' o 'settimanale'
  const [pulizie, setPulizie] = useState({});
  const [note, setNote] = useState('');
  const [operatore, setOperatore] = useState('Maurizio Mameli');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // CHECK AUTOMATICO SE MOSTRARE POPUP
  // ============================================
  useEffect(() => {
    const checkIfShouldShow = () => {
      const ora = new Date();
      const giornoSettimana = ora.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
      const ore = ora.getHours();
      const minuti = ora.getMinutes();
      
      console.log(`🧹 [Pulizia Auto] Controllo automatico: ${['Domenica','Lunedi','Martedi','Mercoledi','Giovedi','Venerdi','Sabato'][giornoSettimana]} ore ${ore}:${minuti.toString().padStart(2,'0')}`);
      
      let shouldShow = false;
      let tipo = 'giornaliera';
      
      // SETTIMANALI: Domenica ore 10:00-10:59
      if (giornoSettimana === 0 && ore === 10) {
        console.log('✅ [Pulizia Auto] È Domenica ore 10! Pulizie SETTIMANALI');
        shouldShow = true;
        tipo = 'settimanale';
      }
      // GIORNALIERE: Lun-Sab ore 18:00-18:59
      else if (giornoSettimana >= 1 && giornoSettimana <= 6 && ore === 18) {
        console.log('✅ [Pulizia Auto] Ore 18 giorni lavorativi! Pulizie GIORNALIERE');
        shouldShow = true;
        tipo = 'giornaliera';
      }
      
      if (!shouldShow && !forceShow) {
        console.log(`ℹ️ [Pulizia Auto] Condizioni non soddisfatte (Giorno: ${giornoSettimana}, Ora: ${ore})`);
        return;
      }
      
      // Verifica se già aperto oggi
      const storageKey = `pulizia_last_popup_${tipo}`;
      const ultimoShow = localStorage.getItem(storageKey);
      const oggi = new Date().toISOString().split('T')[0];
      
      if (ultimoShow === oggi && !forceShow) {
        console.log(`ℹ️ [Pulizia Auto] Popup ${tipo} già mostrato oggi, skip`);
        return;
      }
      
      console.log(`🧹 [Pulizia Auto] Apro popup pulizie ${tipo.toUpperCase()}!`);
      
      setTipoPulizia(tipo);
      inizializzaPulizie(tipo);
      setOpen(true);
    };
    
    checkIfShouldShow();
  }, [forceShow]);

  // ============================================
  // INIZIALIZZA CHECKBOX (TUTTE SPUNTATE)
  // ============================================
  const inizializzaPulizie = (tipo) => {
    const aree = tipo === 'settimanale' ? AREE_PULIZIA_SETTIMANALI : AREE_PULIZIA_GIORNALIERE;
    const iniziale = {};
    aree.forEach(area => {
      iniziale[area.id] = true; // Tutte spuntate
    });
    setPulizie(iniziale);
    
    // Note di default
    if (tipo === 'giornaliera') {
      setNote('Pulizia giornaliera di routine');
    } else {
      setNote('Pulizia settimanale approfondita');
    }
  };

  // ============================================
  // GESTIONE CHECKBOX
  // ============================================
  const handleCheckChange = (areaId) => {
    setPulizie(prev => ({
      ...prev,
      [areaId]: !prev[areaId]
    }));
  };

  // ============================================
  // CALCOLO COMPLETAMENTO
  // ============================================
  const getCompletamento = () => {
    const aree = tipoPulizia === 'settimanale' ? AREE_PULIZIA_SETTIMANALI : AREE_PULIZIA_GIORNALIERE;
    const totale = aree.length;
    const completate = Object.values(pulizie).filter(Boolean).length;
    return {
      completate,
      totale,
      percentuale: Math.round((completate / totale) * 100)
    };
  };

  // ============================================
  // CONFERMA E SALVA
  // ============================================
  const handleConferma = async () => {
    try {
      setLoading(true);
      setError(null);

      const aree = tipoPulizia === 'settimanale' ? AREE_PULIZIA_SETTIMANALI : AREE_PULIZIA_GIORNALIERE;
      
      // Costruisci array elementi puliti
      const elementiPuliti = aree
        .filter(area => pulizie[area.id])
        .map(area => ({
          nome: area.nome,
          conforme: true,
          note: null
        }));

      // Payload per backend
      const payload = {
        tipo: 'sanificazione',
        controlloIgienico: {
          area: tipoPulizia === 'settimanale' ? 'Intero laboratorio' : 'Aree di produzione',
          elementi: elementiPuliti,
          azioneCorrettiva: null
        },
        operatore: operatore,
        note: note,
        conforme: true,
        dataOra: new Date().toISOString()
      };

      console.log('📤 [Pulizia Auto] Invio payload:', payload);

      const token = localStorage.getItem('token');
      
      // ✅ USA ENDPOINT CORRETTO: /api/haccp/registrazione
      const response = await axios.post(
        `${API_URL}/haccp/registrazione`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ [Pulizia Auto] Salvato con successo:', response.data);

      // Salva in localStorage per evitare duplicati
      const storageKey = `pulizia_last_popup_${tipoPulizia}`;
      const oggi = new Date().toISOString().split('T')[0];
      localStorage.setItem(storageKey, oggi);

      // Chiudi popup
      setOpen(false);
      
      // Ricarica pagina dopo 2 secondi
      setTimeout(() => {
        if (onClose) onClose();
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error('❌ [Pulizia Auto] Errore salvataggio:', err);
      setError(err.response?.data?.message || err.message || 'Errore durante il salvataggio');
      setLoading(false);
    }
  };

  const handleAnnulla = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  // Dati completamento
  const completamento = getCompletamento();
  const aree = tipoPulizia === 'settimanale' ? AREE_PULIZIA_SETTIMANALI : AREE_PULIZIA_GIORNALIERE;

  return (
    <Dialog
      open={open}
      onClose={handleAnnulla}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 32 }}>🧹</span>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {tipoPulizia === 'settimanale' ? 'Pulizie Settimanali Approfondite' : 'Pulizie Giornaliere'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {tipoPulizia === 'settimanale' 
                ? 'Pulizia approfondita settimanale - Tutte le aree'
                : 'Pulizia di fine giornata - Aree principali'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Alert Info */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>📋 Verifica e spunta</strong> tutte le aree che hai pulito {tipoPulizia === 'settimanale' ? 'questa settimana' : 'a fine giornata'}
        </Alert>

        {/* Barra Progresso */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight="bold">
              Completamento: {completamento.percentuale}%
            </Typography>
            <Chip 
              label={`${completamento.completate}/${completamento.totale} aree`}
              color={completamento.percentuale === 100 ? 'success' : 'warning'}
              size="small"
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={completamento.percentuale}
            sx={{ height: 8, borderRadius: 1 }}
            color={completamento.percentuale === 100 ? 'success' : 'warning'}
          />
        </Box>

        {/* Lista Aree */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Aree da verificare:
        </Typography>
        <FormGroup>
          {aree.map((area) => (
            <FormControlLabel
              key={area.id}
              control={
                <Checkbox
                  checked={pulizie[area.id] || false}
                  onChange={() => handleCheckChange(area.id)}
                  color="success"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">
                    {area.nome}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {area.prodotto}
                  </Typography>
                </Box>
              }
              sx={{ 
                mb: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: pulizie[area.id] ? 'success.light' : 'grey.100',
                '&:hover': { bgcolor: pulizie[area.id] ? 'success.light' : 'grey.200' }
              }}
            />
          ))}
        </FormGroup>

        {/* Note */}
        <TextField
          fullWidth
          label="Note aggiuntive"
          multiline
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mt: 3, mb: 2 }}
        />

        {/* Operatore */}
        <TextField
          fullWidth
          label="Operatore"
          value={operatore}
          onChange={(e) => setOperatore(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Errore */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={handleAnnulla}
          disabled={loading}
          variant="outlined"
        >
          Annulla
        </Button>
        <Button
          onClick={handleConferma}
          disabled={loading || completamento.completate === 0}
          variant="contained"
          color="success"
          size="large"
        >
          {loading ? 'Salvataggio...' : 'CONFERMA E REGISTRA'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}