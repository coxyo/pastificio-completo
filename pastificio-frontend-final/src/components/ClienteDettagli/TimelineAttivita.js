// src/components/ClienteDettagli/TimelineAttivita.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent
} from '@mui/lab';
import {
  ShoppingCart,
  Euro,
  Message,
  Email,
  Phone,
  Edit,
  Star,
  CardGiftcard,
  LocalOffer,
  CheckCircle,
  Cancel,
  Schedule,
  PersonAdd
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function TimelineAttivita({ clienteId }) {
  const [attivita, setAttivita] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    caricaAttivita();
  }, [clienteId]);

  const caricaAttivita = async (loadMore = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Simula il caricamento delle attività
      // In produzione questo verrebbe dal backend
      const attivitaSimulate = generaAttivitaSimulate();
      
      if (loadMore) {
        setAttivita(prev => [...prev, ...attivitaSimulate]);
      } else {
        setAttivita(attivitaSimulate);
      }
      
      setHasMore(attivitaSimulate.length === 10);
    } catch (error) {
      console.error('Errore caricamento attività:', error);
    } finally {
      setLoading(false);
    }
  };

  const generaAttivitaSimulate = () => {
    const tipiAttivita = [
      {
        tipo: 'ordine_creato',
        titolo: 'Nuovo Ordine',
        descrizione: 'Ordine #12345 creato',
        icona: <ShoppingCart />,
        colore: 'primary',
        dettagli: { totale: 45.50, prodotti: 3 }
      },
      {
        tipo: 'ordine_completato',
        titolo: 'Ordine Completato',
        descrizione: 'Ordine #12344 ritirato',
        icona: <CheckCircle />,
        colore: 'success',
        dettagli: { totale: 38.00 }
      },
      {
        tipo: 'punti_aggiunti',
        titolo: 'Punti Fedeltà',
        descrizione: '+45 punti aggiunti',
        icona: <Star />,
        colore: 'warning',
        dettagli: { puntiTotali: 245 }
      },
      {
        tipo: 'livello_raggiunto',
        titolo: 'Nuovo Livello',
        descrizione: 'Raggiunto livello Argento',
        icona: <CardGiftcard />,
        colore: 'info',
        dettagli: { livelloPrecedente: 'Bronzo' }
      },
      {
        tipo: 'comunicazione',
        titolo: 'WhatsApp Inviato',
        descrizione: 'Promemoria ritiro ordine',
        icona: <Message />,
        colore: 'success'
      },
      {
        tipo: 'modifica_dati',
        titolo: 'Dati Aggiornati',
        descrizione: 'Aggiornato numero telefono',
        icona: <Edit />,
        colore: 'default'
      },
      {
        tipo: 'email_inviata',
        titolo: 'Email Inviata',
        descrizione: 'Conferma ordine #12343',
        icona: <Email />,
        colore: 'primary'
      }
    ];

    // Genera attività casuali con date decrescenti
    const attivitaGenerate = [];
    const oggi = new Date();
    
    for (let i = 0; i < 10; i++) {
      const giornoOffset = i * 2 + Math.floor(Math.random() * 3);
      const data = new Date(oggi);
      data.setDate(data.getDate() - giornoOffset);
      
      const attivitaCasuale = tipiAttivita[Math.floor(Math.random() * tipiAttivita.length)];
      
      attivitaGenerate.push({
        id: `activity-${Date.now()}-${i}`,
        ...attivitaCasuale,
        data: data.toISOString(),
        ora: data.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      });
    }
    
    return attivitaGenerate;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const oggi = new Date();
    const ieri = new Date(oggi);
    ieri.setDate(ieri.getDate() - 1);
    
    if (date.toDateString() === oggi.toDateString()) {
      return 'Oggi';
    } else if (date.toDateString() === ieri.toDateString()) {
      return 'Ieri';
    } else {
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== oggi.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const renderDettagli = (attivita) => {
    if (!attivita.dettagli) return null;
    
    return (
      <Box sx={{ mt: 1 }}>
        {attivita.dettagli.totale && (
          <Chip
            size="small"
            label={`€${attivita.dettagli.totale.toFixed(2)}`}
            color="primary"
            variant="outlined"
            sx={{ mr: 1 }}
          />
        )}
        {attivita.dettagli.prodotti && (
          <Chip
            size="small"
            label={`${attivita.dettagli.prodotti} prodotti`}
            variant="outlined"
            sx={{ mr: 1 }}
          />
        )}
        {attivita.dettagli.puntiTotali && (
          <Chip
            size="small"
            label={`Totale: ${attivita.dettagli.puntiTotali} punti`}
            color="warning"
            variant="outlined"
          />
        )}
      </Box>
    );
  };

  if (loading && attivita.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (attivita.length === 0) {
    return (
      <Alert severity="info">
        Nessuna attività registrata per questo cliente
      </Alert>
    );
  }

  return (
    <Box>
      <Timeline position="alternate">
        {attivita.map((item, index) => (
          <TimelineItem key={item.id}>
            <TimelineOppositeContent
              sx={{ m: 'auto 0' }}
              align={index % 2 === 0 ? 'right' : 'left'}
              variant="body2"
              color="text.secondary"
            >
              <Typography variant="caption" display="block">
                {formatDate(item.data)}
              </Typography>
              <Typography variant="caption">
                {item.ora}
              </Typography>
            </TimelineOppositeContent>
            
            <TimelineSeparator>
              <TimelineConnector sx={{ bgcolor: 'grey.300' }} />
              <TimelineDot color={item.colore || 'grey'} variant="outlined">
                {item.icona}
              </TimelineDot>
              <TimelineConnector sx={{ bgcolor: 'grey.300' }} />
            </TimelineSeparator>
            
            <TimelineContent sx={{ py: '12px', px: 2 }}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="subtitle2" component="h6">
                  {item.titolo}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.descrizione}
                </Typography>
                {renderDettagli(item)}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
      
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setPage(page + 1);
              caricaAttivita(true);
            }}
            disabled={loading}
          >
            {loading ? 'Caricamento...' : 'Carica Altre Attività'}
          </Button>
        </Box>
      )}
    </Box>
  );
}