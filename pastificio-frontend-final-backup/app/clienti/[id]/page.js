// app/clienti/[id]/page.js
'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import ClienteDettagli from '@/components/ClienteDettagli';
import { CircularProgress, Box, Alert } from '@mui/material';

export default function PageClienteDettagli() {
  const params = useParams();
  const [cliente, setCliente] = useState(null);
  const [statistiche, setStatistiche] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params?.id) {
      caricaDatiCliente(params.id);
    }
  }, [params?.id]);

  const caricaDatiCliente = async (clienteId) => {
    try {
      setLoading(true);
      
      // Carica dati del cliente dal localStorage o API
      const clientiSalvati = localStorage.getItem('clienti');
      let clienteTrovato = null;
      
      if (clientiSalvati) {
        const clienti = JSON.parse(clientiSalvati);
        clienteTrovato = clienti.find(c => c.id === clienteId || c._id === clienteId);
      }

      // Se non trovato nel localStorage, usa dati di esempio
      if (!clienteTrovato) {
        clienteTrovato = {
          id: clienteId,
          nome: 'Cliente di Esempio',
          telefono: '1234567890',
          email: 'cliente@esempio.com',
          indirizzo: 'Via Roma 1, 00100 Roma',
          tipo: 'Privato',
          stato: 'Attivo'
        };
      }

      // Prepara le statistiche con valori di default
      const stats = {
        valoreTotale: 1250.50,
        valoreStatale: 1250.50, // Aggiungi questo campo che mancava
        ordiniTotali: 15,
        mediaOrdine: 83.37,
        frequenza: 'Settimanale',
        ultimoOrdine: new Date().toLocaleDateString('it-IT'),
        giorniCliente: 180,
        prodottiAcquistati: 8,
        tassoCrescita: 15,
        puntualitaPagamenti: 100,
        livelloFedelta: 'Gold',
        progressoFedelta: 75
      };

      setCliente(clienteTrovato);
      setStatistiche(stats);
      setError(null);
    } catch (err) {
      console.error('Errore caricamento cliente:', err);
      setError('Errore nel caricamento dei dati del cliente');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Passa i dati al componente ClienteDettagli
  return (
    <ClienteDettagli 
      cliente={cliente}
      statistiche={statistiche}
      clienteId={params?.id}
    />
  );
}