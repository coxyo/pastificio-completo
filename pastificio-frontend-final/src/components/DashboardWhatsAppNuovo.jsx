// components/DashboardWhatsAppNuovo.jsx
// ✅ COMPONENTE RINOMINATO PER BYPASSARE CACHE VERCEL
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
  Chip
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const DashboardWhatsAppNuovo = () => {
  const [ordini, setOrdini] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    caricaOrdini();
  }, []);

  const caricaOrdini = () => {
    setLoading(true);
    
    const tutti = JSON.parse(localStorage.getItem('ordini') || '[]');
    const domani = new Date();
    domani.setDate(domani.getDate() + 1);
    const domaniStr = domani.toISOString().split('T')[0];
    
    const filtrati = [];
    for (let i = 0; i < tutti.length; i++) {
      const o = tutti[i];
      if (!o) continue;
      
      const data = (o.dataRitiro || '').split('T')[0];
      const tel = o.telefono && String(o.telefono).trim() !== '';
      
      if (data === domaniStr && tel) {
        filtrati.push(o);
      }
    }
    
    console.log('✅ NUOVO COMPONENTE! Trovati:', filtrati.length, 'ordini');
    setOrdini(filtrati);
    setLoading(false);
  };

  const inviaPromemoria = (ordine) => {
    const prodotti = ordine.prodotti.slice(0, 3).map(p => `• ${p.nome}`).join('\n');
    const msg = `🔔 PROMEMORIA RITIRO\n\nCiao ${ordine.nomeCliente}!\n\nTi ricordiamo che domani:\n\n📅 ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}\n⏰ ${ordine.oraRitiro || '10:00'}\n\nHai il ritiro del tuo ordine:\n\n${prodotti}\n\nTi aspettiamo! 😊\n📍 Via Carmine 20/B, Assemini`;
    const num = String(ordine.telefono).replace(/\D/g, '');
    const url = `https://wa.me/39${num}?text=${encodeURIComponent(msg)}`;
    
    // Apri finestra con riferimento
    const popup = window.open(url, '_blank');
    
    // Chiudi automaticamente dopo 2 secondi
    setTimeout(() => {
      if (popup && !popup.closed) {
        popup.close();
        console.log(`✅ Finestra chiusa per: ${ordine.nomeCliente}`);
      }
    }, 2000); // 2 secondi di tempo per far passare il messaggio a WhatsApp Desktop
    
    setSentCount(prev => prev + 1);
  };

  const inviaTutti = () => {
    if (!confirm(`Aprire ${ordini.length} finestre WhatsApp?\n\nLe finestre si apriranno una alla volta ogni 3 secondi.\nOgni finestra si chiuderà automaticamente dopo 2 secondi.\n\nIl messaggio verrà trasferito a WhatsApp Desktop automaticamente!`)) return;
    
    console.log(`🚀 Invio ${ordini.length} promemoria con intervallo di 3 secondi...`);
    
    let opened = 0;
    
    ordini.forEach((o, i) => {
      setTimeout(() => {
        opened++;
        console.log(`📱 Apertura ${opened}/${ordini.length}: ${o.nomeCliente}`);
        inviaPromemoria(o);
        
        // Alert ogni apertura
        if (opened === ordini.length) {
          setTimeout(() => {
            alert(`✅ Tutte le ${ordini.length} finestre sono aperte!\n\nOra clicca "Invia" in ognuna (Ctrl+Tab per navigare tra le finestre).`);
          }, 1000);
        }
      }, i * 3000); // 3 secondi tra una finestra e l'altra
    });
  };

  if (loading) {
    return <Box p={4}><CircularProgress /><Typography sx={{ ml: 2 }}>Caricamento...</Typography></Box>;
  }

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h4" align="center" color="primary">{ordini.length}</Typography>
              <Typography variant="body2" align="center">Ordini da Notificare</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography variant="h4" align="center" sx={{ color: '#25D366' }}>{sentCount}</Typography>
              <Typography variant="body2" align="center">Promemoria Inviati</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography variant="h4" align="center" color="warning">{ordini.length - sentCount}</Typography>
              <Typography variant="body2" align="center">Rimanenti</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {ordini.length > 0 && (
        <Box sx={{ my: 3 }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<WhatsAppIcon />}
            onClick={inviaTutti}
            sx={{ 
              py: 2.5, 
              bgcolor: '#667eea', 
              '&:hover': { bgcolor: '#5568d3' },
              fontSize: '1.1rem',
              fontWeight: 'bold',
              boxShadow: 3
            }}
          >
            🚀 INVIA TUTTI ({ordini.length} MESSAGGI)
          </Button>
        </Box>
      )}

      {ordini.length === 0 ? (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          ✅ Nessun promemoria da inviare!
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {ordini.map((ordine) => (
            <Grid item xs={12} key={ordine._id}>
              <Card sx={{ borderLeft: '5px solid #25D366' }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Typography variant="h6">
                        {ordine.nomeCliente} {ordine.cognomeCliente || ''}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        📞 {ordine.telefono}
                      </Typography>
                      <Chip label={`⏰ ${ordine.oraRitiro || '10:00'}`} size="small" sx={{ mt: 1 }} />
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
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<SendIcon />}
                        onClick={() => inviaPromemoria(ordine)}
                        sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' } }}
                      >
                        Invia Promemoria
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Alert severity="info" sx={{ mt: 2 }}>
        💡 Click su "Invia Promemoria" per aprire WhatsApp. Funziona solo su PC con WhatsApp Desktop!
      </Alert>
    </Box>
  );
};

export default DashboardWhatsAppNuovo;
