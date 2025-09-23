import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Typography, Box, Chip, Paper
} from '@mui/material';
import { 
  ContentCopy as CopyIcon, 
  WhatsApp as WhatsAppIcon, 
  CheckCircle as CheckIcon, 
  Schedule as ClockIcon 
} from '@mui/icons-material';

export default function WhatsAppHelper({ ordini }) {
  const [messaggiCopiati, setMessaggiCopiati] = useState({});
  const numeroWhatsApp = '3898879833';
  
  const ordiniOggi = ordini.filter(o => {
    const oggi = new Date().toDateString();
    const dataOrdine = new Date(o.dataRitiro).toDateString();
    return dataOrdine === oggi;
  });

  const generaMessaggio = (ordine, tipo) => {
    const templates = {
      conferma: `🍝 *PASTIFICIO NONNA CLAUDIA*\n\n✅ Ordine Confermato!\n\nGentile ${ordine.nomeCliente},\nconfermiamo il suo ordine per:\n\n📅 ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}\n⏰ Ore ${ordine.oraRitiro}\n\nProdotti:\n${(ordine.prodotti || []).map(p => `• ${p.nome}: ${p.quantita} ${p.unita}`).join('\n')}\n\n💰 Totale: €${ordine.totale}\n\n📍 Via Carmine 20/B, Assemini\n📞 389 887 9833\n\nGrazie!`,
      
      promemoria: `🔔 *PROMEMORIA RITIRO*\n\nCiao ${ordine.nomeCliente}!\n\nTi ricordiamo il ritiro del tuo ordine domani:\n\n📅 ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}\n⏰ Ore ${ordine.oraRitiro}\n\nTi aspettiamo!`,
      
      pronto: `✅ *ORDINE PRONTO!*\n\n${ordine.nomeCliente}, il tuo ordine è pronto!\n\n⏰ Ti aspettiamo entro le ${ordine.oraRitiro}\n📍 Via Carmine 20/B\n\nA presto!`
    };
    
    return templates[tipo] || '';
  };

  const copiaMessaggio = (ordine, tipo) => {
    const messaggio = generaMessaggio(ordine, tipo);
    navigator.clipboard.writeText(messaggio);
    
    setMessaggiCopiati({
      ...messaggiCopiati,
      [`${ordine._id}-${tipo}`]: true
    });
    
    setTimeout(() => {
      setMessaggiCopiati(prev => ({
        ...prev,
        [`${ordine._id}-${tipo}`]: false
      }));
    }, 2000);
  };

  const apriWhatsApp = (telefono) => {
    const numeroClean = telefono.replace(/\D/g, '');
    const url = `https://web.whatsapp.com/send?phone=39${numeroClean}`;
    window.open(url, '_blank');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Invio Messaggi WhatsApp - {ordiniOggi.length} ordini oggi
      </Typography>
      
      {ordiniOggi.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            Nessun ordine da confermare oggi
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {ordiniOggi.map(ordine => (
            <Card key={ordine._id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{ordine.nomeCliente}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      📞 {ordine.telefono} | ⏰ {ordine.oraRitiro}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<WhatsAppIcon />}
                    onClick={() => apriWhatsApp(ordine.telefono)}
                  >
                    Apri Chat
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant={messaggiCopiati[`${ordine._id}-conferma`] ? "contained" : "outlined"}
                    color={messaggiCopiati[`${ordine._id}-conferma`] ? "success" : "primary"}
                    size="small"
                    startIcon={messaggiCopiati[`${ordine._id}-conferma`] ? <CheckIcon /> : <CopyIcon />}
                    onClick={() => copiaMessaggio(ordine, 'conferma')}
                  >
                    {messaggiCopiati[`${ordine._id}-conferma`] ? 'Copiato!' : 'Copia Conferma'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ClockIcon />}
                    onClick={() => copiaMessaggio(ordine, 'promemoria')}
                  >
                    Promemoria
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CheckIcon />}
                    onClick={() => copiaMessaggio(ordine, 'pronto')}
                  >
                    Pronto
                  </Button>
                </Box>
                
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Prodotti: {(ordine.prodotti || []).map(p => p.nome).join(', ')}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      
      <Paper sx={{ mt: 3, p: 2, bgcolor: 'info.main', color: 'white' }}>
        <Typography variant="body2">
          <strong>Istruzioni:</strong><br/>
          1️⃣ Clicca "Copia" per copiare il messaggio<br/>
          2️⃣ Clicca "Apri Chat" per aprire WhatsApp Web<br/>
          3️⃣ Incolla con Ctrl+V e invia!
        </Typography>
      </Paper>
    </Box>
  );
}