// components/DashboardWhatsApp.jsx
// ✅ VERSIONE FINALE CORRETTA - DEBUG COMPLETO
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

const DashboardWhatsApp = () => {
  const [ordini, setOrdini] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentCount, setSentCount] = useState(0);
  const [sentOrders, setSentOrders] = useState(new Set());
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    caricaOrdini();
  }, []);

  const caricaOrdini = () => {
    try {
      setLoading(true);
      
      // Carica da localStorage
      const ordiniRaw = localStorage.getItem('ordini');
      console.log('📦 localStorage raw:', ordiniRaw ? 'presente' : 'vuoto');
      
      if (!ordiniRaw) {
        console.warn('⚠️ localStorage vuoto!');
        setOrdini([]);
        setDebugInfo('localStorage vuoto');
        setLoading(false);
        return;
      }
      
      const ordiniCache = JSON.parse(ordiniRaw);
      console.log('📦 Ordini da localStorage:', ordiniCache.length);
      
      // Verifica che sia un array
      if (!Array.isArray(ordiniCache)) {
        console.error('❌ ordiniCache non è un array!', typeof ordiniCache);
        setOrdini([]);
        setDebugInfo('Errore: dati non validi in localStorage');
        setLoading(false);
        return;
      }
      
      // Calcola domani
      const oggi = new Date();
      const domani = new Date(oggi);
      domani.setDate(domani.getDate() + 1);
      domani.setHours(0, 0, 0, 0);
      const domaniStr = domani.toISOString().split('T')[0];
      
      console.log('📅 Cerco ordini per:', domaniStr);
      console.log('📅 Oggi è:', oggi.toISOString().split('T')[0]);
      
      // Filtra ordini per domani con telefono
      const ordiniDomani = ordiniCache.filter(o => {
        if (!o) return false;
        
        const dataRitiro = (o.dataRitiro || '').split('T')[0];
        const hasTelefono = o.telefono && String(o.telefono).trim() !== '';
        
        // Debug ogni ordine di domani
        if (dataRitiro === domaniStr) {
          console.log('🔍 Ordine domani:', {
            nome: o.nomeCliente,
            telefono: o.telefono,
            hasTelefono: hasTelefono,
            promemoria: o.promemoria_inviato
          });
        }
        
        // Match se data domani E ha telefono (ignoriamo promemoria_inviato per debug)
        return dataRitiro === domaniStr && hasTelefono;
      });
      
      console.log(`📊 Trovati ${ordiniDomani.length} ordini per domani con telefono`);
      
      // Debug dettagliato
      if (ordiniDomani.length === 0) {
        const tuttiDomani = ordiniCache.filter(o => {
          const dataRitiro = (o.dataRitiro || '').split('T')[0];
          return dataRitiro === domaniStr;
        });
        
        console.log('⚠️ Ordini totali per domani (senza filtro telefono):', tuttiDomani.length);
        
        if (tuttiDomani.length > 0) {
          console.log('⚠️ Ordini senza telefono:');
          tuttiDomani.forEach(o => {
            if (!o.telefono || String(o.telefono).trim() === '') {
              console.log(`   - ${o.nomeCliente}: telefono mancante`);
            }
          });
        }
        
        setDebugInfo(`Nessun ordine trovato per ${domaniStr}. Totale ordini in localStorage: ${ordiniCache.length}`);
      } else {
        setDebugInfo(`${ordiniDomani.length} ordini trovati per ${domaniStr}`);
      }
      
      setOrdini(ordiniDomani);
      
    } catch (error) {
      console.error('❌ Errore caricamento ordini:', error);
      setDebugInfo(`Errore: ${error.message}`);
      setOrdini([]);
    } finally {
      setLoading(false);
    }
  };

  const inviaPromemoria = async (ordine) => {
    try {
      // Prepara messaggio
      const prodottiBreve = ordine.prodotti
        .slice(0, 3)
        .map(p => `• ${p.nome}`)
        .join('\n');

      const messaggio = `🔔 *PROMEMORIA RITIRO*

Ciao ${ordine.nomeCliente}!

Ti ricordiamo che domani:

📅 ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}
⏰ ${ordine.oraRitiro || '10:00'}

Hai il ritiro del tuo ordine:

${prodottiBreve}

Ti aspettiamo! 😊
📍 Via Carmine 20/B, Assemini`;

      // Normalizza numero
      const numeroClean = String(ordine.telefono).replace(/\D/g, '');
      
      // Genera link wa.me
      const whatsappUrl = `https://wa.me/39${numeroClean}?text=${encodeURIComponent(messaggio)}`;
      
      console.log('📱 Apertura WhatsApp per:', numeroClean);
      
      // Apri WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Marca come inviato localmente
      setSentOrders(prev => new Set([...prev, ordine._id]));
      setSentCount(prev => prev + 1);
      
      // Aggiorna database
      try {
        await fetch(`${API_URL}/ordini/${ordine._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promemoria_inviato: true,
            promemoria_inviato_at: new Date().toISOString()
          })
        });
        
        // Aggiorna localStorage
        const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
        const index = ordiniCache.findIndex(o => o._id === ordine._id);
        if (index !== -1) {
          ordiniCache[index].promemoria_inviato = true;
          ordiniCache[index].promemoria_inviato_at = new Date().toISOString();
          localStorage.setItem('ordini', JSON.stringify(ordiniCache));
        }
        
        console.log('✅ Promemoria salvato nel database');
      } catch (error) {
        console.warn('⚠️ Errore aggiornamento database (non critico):', error);
      }
      
    } catch (error) {
      console.error('❌ Errore invio promemoria:', error);
    }
  };

  const inviaTutti = () => {
    if (!window.confirm(`Aprire ${ordini.length} finestre WhatsApp?\n\nClick OK, poi clicca "Invia" in ogni finestra.`)) {
      return;
    }

    ordini.forEach((ordine, index) => {
      setTimeout(() => {
        inviaPromemoria(ordine);
      }, index * 1000);
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Caricamento ordini...</Typography>
      </Box>
    );
  }

  const rimanenti = ordini.length - sentCount;

  return (
    <Box>
      {/* Debug Info Banner */}
      {debugInfo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          🔍 <strong>Debug:</strong> {debugInfo}
        </Alert>
      )}

      {/* Header con Statistiche */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h4" align="center" color="primary">
                {ordini.length}
              </Typography>
              <Typography variant="body2" align="center" color="textSecondary">
                Ordini da Notificare
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography variant="h4" align="center" sx={{ color: '#25D366' }}>
                {sentCount}
              </Typography>
              <Typography variant="body2" align="center" color="textSecondary">
                Promemoria Inviati
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography variant="h4" align="center" color="warning.main">
                {rimanenti}
              </Typography>
              <Typography variant="body2" align="center" color="textSecondary">
                Rimanenti
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pulsante Invia Tutti */}
      {ordini.length > 0 && (
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<WhatsAppIcon />}
          onClick={inviaTutti}
          sx={{ 
            mb: 3,
            py: 2,
            bgcolor: '#667eea',
            '&:hover': { bgcolor: '#5568d3' }
          }}
        >
          🚀 INVIA TUTTI ({ordini.length} messaggi)
        </Button>
      )}

      {/* Lista Ordini */}
      {ordini.length === 0 ? (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          ✅ Nessun promemoria da inviare! Tutti i clienti sono stati notificati.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {ordini.map((ordine) => {
            const isSent = sentOrders.has(ordine._id);
            
            return (
              <Grid item xs={12} key={ordine._id}>
                <Card 
                  sx={{ 
                    borderLeft: '5px solid #25D366',
                    opacity: isSent ? 0.6 : 1,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: isSent ? 'none' : 'translateY(-4px)',
                      boxShadow: isSent ? 1 : 4
                    }
                  }}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6">
                          {ordine.nomeCliente} {ordine.cognomeCliente || ''}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          📞 {ordine.telefono}
                        </Typography>
                        <Chip 
                          label={`⏰ ${ordine.oraRitiro || '10:00'}`}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Grid>

                      <Grid item xs={12} md={5}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          📦 Prodotti:
                        </Typography>
                        {ordine.prodotti.slice(0, 3).map((p, i) => (
                          <Typography key={i} variant="body2">
                            • {p.nome} ({p.quantita} {p.unita || 'pz'})
                          </Typography>
                        ))}
                        {ordine.prodotti.length > 3 && (
                          <Typography variant="body2" color="textSecondary">
                            ... e altri {ordine.prodotti.length - 3}
                          </Typography>
                        )}
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={isSent ? <CheckCircleIcon /> : <SendIcon />}
                          onClick={() => inviaPromemoria(ordine)}
                          disabled={isSent}
                          sx={{
                            bgcolor: isSent ? '#ccc' : '#25D366',
                            '&:hover': {
                              bgcolor: isSent ? '#ccc' : '#128C7E'
                            }
                          }}
                        >
                          {isSent ? 'Inviato' : 'Invia Promemoria'}
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Info */}
      <Alert severity="info" sx={{ mt: 2 }}>
        💡 <strong>Come funziona:</strong> Click su "Invia Promemoria" per aprire WhatsApp con il messaggio già scritto. 
        Poi clicca solo "Invia" in WhatsApp. Funziona solo su PC con WhatsApp Desktop installata!
      </Alert>
    </Box>
  );
};

export default DashboardWhatsApp;
