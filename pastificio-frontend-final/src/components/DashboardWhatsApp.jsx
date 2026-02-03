// components/DashboardWhatsApp.jsx
// ✅ VERSIONE CORRETTA - USA localStorage COME GESTOREORDINI
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

  useEffect(() => {
    caricaOrdini();
  }, []);

  const caricaOrdini = () => {
    try {
      setLoading(true);
      
      // ✅ CORRETTO: Carica da localStorage come fa GestoreOrdini
      const ordiniCache = JSON.parse(localStorage.getItem('ordini') || '[]');
      console.log('📦 Ordini da localStorage:', ordiniCache.length);
      
      // Calcola domani
      const domani = new Date();
      domani.setDate(domani.getDate() + 1);
      domani.setHours(0, 0, 0, 0);
      const domaniStr = domani.toISOString().split('T')[0];
      
      console.log('📅 Cerco ordini per:', domaniStr);
      
      // Filtra ordini per domani con telefono e senza promemoria inviato
      const ordiniDomani = ordiniCache.filter(o => {
        const dataRitiro = (o.dataRitiro || '').split('T')[0];
        const hasTelefono = o.telefono && o.telefono.trim() !== '';
        const nonInviato = !o.promemoria_inviato;
        
        const match = dataRitiro === domaniStr && hasTelefono && nonInviato;
        
        if (match) {
          console.log('✅ Ordine trovato:', o.nomeCliente, o.telefono);
        }
        
        return match;
      });
      
      console.log(`📊 Trovati ${ordiniDomani.length} ordini per domani con telefono`);
      
      setOrdini(ordiniDomani);
      
    } catch (error) {
      console.error('❌ Errore caricamento ordini:', error);
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
      const numeroClean = ordine.telefono.replace(/\D/g, '');
      
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
      }, index * 1000); // 1 secondo tra una finestra e l'altra
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  const rimanenti = ordini.length - sentCount;

  return (
    <Box>
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
                      {/* Cliente e Orario */}
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

                      {/* Prodotti */}
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

                      {/* Pulsante Invia */}
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
      
      {/* Debug Info */}
      <Alert severity="info" sx={{ mt: 2 }}>
        🔍 <strong>Debug:</strong> Ordini totali in localStorage: {JSON.parse(localStorage.getItem('ordini') || '[]').length}
        <br />
        📅 Cercando ordini per: {new Date(Date.now() + 86400000).toISOString().split('T')[0]}
      </Alert>
    </Box>
  );
};

export default DashboardWhatsApp;
