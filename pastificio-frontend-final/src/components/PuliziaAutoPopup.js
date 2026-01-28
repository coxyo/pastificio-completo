// components/PuliziaAutoPopup.js
// ✅ POPUP AUTOMATICO PULIZIE - GIORNALIERO + SETTIMANALE
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

// ============================================
// AREE PULIZIA (sincronizzate con GestioneHACCP)
// ============================================
const AREE_PULIZIA_GIORNALIERE = [
  { id: 'superfici', nome: 'Superfici di lavoro', prodotto: 'Detergente + Sanificante' },
  { id: 'pavimenti', nome: 'Pavimenti', prodotto: 'Detergente + Sanificante' },
  { id: 'attrezzature', nome: 'Attrezzature', prodotto: 'Detergente + Sanificante' },
  { id: 'servizi', nome: 'Servizi igienici', prodotto: 'Detergente + Sanificante' }
];

const AREE_PULIZIA_SETTIMANALI = [
  { id: 'pareti', nome: 'Pareti', prodotto: 'Detergente + Sanificante' },
  { id: 'frigoriferi', nome: 'Frigoriferi (interno ed esterno)', prodotto: 'Detergente + Sanificante' },
  { id: 'abbattitore', nome: 'Abbattitore (pulizia approfondita)', prodotto: 'Detergente + Sanificante' },
  { id: 'scaffalature', nome: 'Scaffalature e ripiani', prodotto: 'Detergente + Sanificante' },
  { id: 'finestre', nome: 'Finestre e vetrate', prodotto: 'Detergente vetri' }
];

// ============================================
// COMPONENTE PRINCIPALE
// ============================================
export default function PuliziaAutoPopup({ onClose, forceShow = false, tipo = 'auto' }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  
  // Determina tipo pulizia (giornaliera/settimanale)
  const [tipoPulizia, setTipoPulizia] = useState('giornaliera');
  
  // Stato aree pulite
  const [areePulite, setAreePulite] = useState({});
  const [note, setNote] = useState('');
  const [operatore, setOperatore] = useState('Maurizio Mameli');

  // ============================================
  // INIZIALIZZAZIONE
  // ============================================
  useEffect(() => {
    if (forceShow) {
      inizializzaPulizie();
      setOpen(true);
      setLoading(false);
      return;
    }

    checkIfShouldShow();
  }, [forceShow]);

  const checkIfShouldShow = async () => {
    setLoading(true);
    
    const oggi = new Date();
    const giornoSettimana = oggi.getDay(); // 0=Dom, 6=Sab
    const ore = oggi.getHours();
    
    console.log(`🧹 [Pulizia Auto] Oggi è ${["Domenica","Lunedi","Martedi","Mercoledi","Giovedi","Venerdi","Sabato"][giornoSettimana]} ore ${ore}:${oggi.getMinutes().toString().padStart(2,'0')}`);
    
    let shouldShow = false;
    let tipoDeterminato = 'giornaliera';
    
    // ✅ PULIZIE SETTIMANALI: Domenica ore 10:00-10:59
    if (giornoSettimana === 0 && ore === 10) {
      console.log('✅ [Pulizia Auto] È Domenica ore 10! Pulizie SETTIMANALI');
      shouldShow = true;
      tipoDeterminato = 'settimanale';
    }
    // ✅ PULIZIE GIORNALIERE: Lunedì-Sabato ore 18:00-18:59
    else if (giornoSettimana >= 1 && giornoSettimana <= 6 && ore === 18) {
      console.log('✅ [Pulizia Auto] Ore 18 giorni lavorativi! Pulizie GIORNALIERE');
      shouldShow = true;
      tipoDeterminato = 'giornaliera';
    }
    
    if (!shouldShow) {
      console.log('📅 [Pulizia Auto] Condizioni non soddisfatte, popup NON mostrato');
      setLoading(false);
      return;
    }

    // Verifica se già registrato oggi
    const dataOggi = oggi.toISOString().split('T')[0];
    const storageKey = `pulizia_last_popup_${tipoDeterminato}`;
    const ultimoShow = localStorage.getItem(storageKey);
    
    if (ultimoShow === dataOggi) {
      console.log(`✅ [Pulizia Auto] Pulizie ${tipoDeterminato} già registrate oggi`);
      setLoading(false);
      return;
    }

    // Mostra popup
    console.log(`🧹 [Pulizia Auto] Mostro popup pulizie ${tipoDeterminato.toUpperCase()}`);
    setTipoPulizia(tipoDeterminato);
    inizializzaPulizie(tipoDeterminato);
    setOpen(true);
    setLoading(false);
  };

  const inizializzaPulizie = (tipo = tipoPulizia) => {
    const aree = tipo === 'settimanale' ? AREE_PULIZIA_SETTIMANALI : AREE_PULIZIA_GIORNALIERE;
    const iniziali = {};
    aree.forEach(area => {
      iniziali[area.id] = true; // Pre-seleziona tutte
    });
    setAreePulite(iniziali);
    setNote(tipo === 'settimanale' ? 'Pulizia approfondita settimanale' : 'Pulizia giornaliera di routine');
  };

  // ============================================
  // MODIFICA STATO AREE
  // ============================================
  const handleToggleArea = (areaId) => {
    setAreePulite(prev => ({
      ...prev,
      [areaId]: !prev[areaId]
    }));
  };

  // ============================================
  // SALVATAGGIO
  // ============================================
  const handleConferma = async () => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      console.log('🧹 [Pulizia] ========================================');
      console.log('🧹 [Pulizia] INIZIO SALVATAGGIO');
      console.log('🧹 [Pulizia] ========================================');
      console.log('📊 [Pulizia] Tipo:', tipoPulizia);
      console.log('📊 [Pulizia] Aree pulite:', areePulite);

      const aree = tipoPulizia === 'settimanale' ? AREE_PULIZIA_SETTIMANALI : AREE_PULIZIA_GIORNALIERE;
      
      // Prepara payload
      const areePuliteArray = aree
        .filter(area => areePulite[area.id])
        .map(area => ({
          nome: area.nome,
          conforme: true,
          note: null
        }));

      const payload = {
        tipo: tipoPulizia === 'settimanale' ? 'sanificazione' : 'controllo_igienico',
        controlloIgienico: {
          area: tipoPulizia === 'settimanale' ? 'Intero laboratorio' : 'Aree di produzione',
          elementi: areePuliteArray,
          azioneCorrettiva: null
        },
        operatore: operatore,
        note: note,
        conforme: areePuliteArray.length > 0,
        dataOra: new Date().toISOString()
      };

      console.log('📤 [Pulizia] Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${API_URL}/haccp/pulizia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 [Pulizia] Response status:', response.status);

      const responseText = await response.text();
      console.log('📡 [Pulizia] Response body:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [Pulizia] Errore parsing JSON:', parseError);
        throw new Error('Risposta del server non valida');
      }

      if (!response.ok) {
        console.error('❌ [Pulizia] Response non OK:', result);
        throw new Error(result.message || `Errore HTTP ${response.status}`);
      }

      if (!result.success) {
        console.error('❌ [Pulizia] Success = false:', result);
        throw new Error(result.message || 'Salvataggio fallito');
      }

      console.log('✅ [Pulizia] ========================================');
      console.log('✅ [Pulizia] SALVATAGGIO COMPLETATO!');
      console.log('✅ [Pulizia] ========================================');

      // Salva in localStorage per evitare duplicati
      const oggi = new Date().toISOString().split('T')[0];
      const storageKey = `pulizia_last_popup_${tipoPulizia}`;
      localStorage.setItem(storageKey, oggi);

      setSaved(true);
      
      // Chiudi dopo 2 secondi
      setTimeout(() => {
        handleClose();
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 2000);

    } catch (err) {
      console.error('💥 [Pulizia] ========================================');
      console.error('💥 [Pulizia] ERRORE SALVATAGGIO');
      console.error('💥 [Pulizia] ========================================');
      console.error('💥 [Pulizia]', err);
      setError(err.message || 'Errore sconosciuto');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return null;
  }

  if (!open) {
    return null;
  }

  const aree = tipoPulizia === 'settimanale' ? AREE_PULIZIA_SETTIMANALI : AREE_PULIZIA_GIORNALIERE;
  const totaleAree = aree.length;
  const areePuliteCount = Object.values(areePulite).filter(Boolean).length;
  const completamento = Math.round((areePuliteCount / totaleAree) * 100);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        bgcolor: tipoPulizia === 'settimanale' ? 'secondary.main' : 'info.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        {tipoPulizia === 'settimanale' ? (
          <EventRepeatIcon fontSize="large" />
        ) : (
          <CleaningServicesIcon fontSize="large" />
        )}
        <Box>
          <Typography variant="h5">
            {tipoPulizia === 'settimanale' ? '🧹 Pulizie Settimanali Approfondite' : '🧹 Pulizie Giornaliere'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {tipoPulizia === 'settimanale' 
              ? 'Domenica - Pulizia completa del laboratorio'
              : 'Pulizia di fine giornata - Aree principali'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {/* Alert informativo */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {tipoPulizia === 'settimanale' 
              ? '📋 Verifica e spunta tutte le aree che hai pulito durante la pulizia approfondita settimanale'
              : '📋 Verifica e spunta tutte le aree che hai pulito a fine giornata'}
          </Typography>
        </Alert>

        {/* Statistiche completamento */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">
              Completamento: {completamento}%
            </Typography>
            <Chip 
              label={`${areePuliteCount}/${totaleAree} aree`}
              color={completamento === 100 ? 'success' : 'default'}
              icon={completamento === 100 ? <CheckCircleIcon /> : undefined}
            />
          </Box>
          <Box sx={{ 
            width: '100%', 
            height: 8, 
            bgcolor: 'grey.300', 
            borderRadius: 1,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              width: `${completamento}%`, 
              height: '100%', 
              bgcolor: completamento === 100 ? 'success.main' : 'info.main',
              transition: 'width 0.3s'
            }} />
          </Box>
        </Paper>

        {/* Lista aree da pulire */}
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Aree da verificare:
        </Typography>

        {aree.map((area) => (
          <Paper 
            key={area.id} 
            sx={{ 
              p: 2, 
              mb: 2,
              border: '2px solid',
              borderColor: areePulite[area.id] ? 'success.main' : 'grey.300',
              bgcolor: areePulite[area.id] ? 'success.50' : 'white',
              transition: 'all 0.3s'
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={areePulite[area.id] || false}
                  onChange={() => handleToggleArea(area.id)}
                  color="success"
                  sx={{ '& .MuiSvgIcon-root': { fontSize: 32 } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {area.nome}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Prodotto: {area.prodotto}
                  </Typography>
                </Box>
              }
            />
          </Paper>
        ))}

        <Divider sx={{ my: 3 }} />

        {/* Note */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Note aggiuntive (opzionale)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Es: Rilevate macchie su parete zona cottura, pulite immediatamente"
        />

        {/* Operatore */}
        <TextField
          fullWidth
          label="Operatore"
          value={operatore}
          onChange={(e) => setOperatore(e.target.value)}
          sx={{ mt: 2 }}
        />

        {/* Errore */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Successo */}
        {saved && (
          <Alert severity="success" sx={{ mt: 2 }}>
            ✅ Pulizie registrate con successo! La pagina si aggiornerà automaticamente...
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={handleClose}
          disabled={saving || saved}
          variant="outlined"
          size="large"
        >
          Annulla
        </Button>
        <Button
          onClick={handleConferma}
          disabled={saving || saved || areePuliteCount === 0}
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
          sx={{ minWidth: 200 }}
        >
          {saving ? 'Salvataggio...' : saved ? 'Salvato!' : 'Conferma e Registra'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}