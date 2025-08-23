'use client';

import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Snackbar } from '@mui/material';
import { Ordine, ProdottoOrdine } from '../../types';
import AggiungiProdotto from './AggiungiProdotto';
import CarrelloOrdine from './CarrelloOrdine';
import DettagliOrdine from './DettagliOrdine';
import RiepilogoOrdini from './RiepilogoOrdini';
import { generaStampaRiepilogo } from '../../utils/stampa';

const theme = createTheme();

const GestoreOrdini: React.FC = () => {
  // Stati per gestione prodotti
  const [modalitaManuale, setModalitaManuale] = useState(false);
  const [categoriaSelezionata, setCategoriaSelezionata] = useState('');
  const [prodottoSelezionato, setProdottoSelezionato] = useState('');
  const [prodottoManuale, setProdottoManuale] = useState('');
  const [unitaMisuraSelezionata, setUnitaMisuraSelezionata] = useState('Kg');
  const [quantita, setQuantita] = useState(1);
  const [noteProdotto, setNoteProdotto] = useState('');

  // Stati per gestione carrello
  const [carrello, setCarrello] = useState<ProdottoOrdine[]>([]);

  // Stati per gestione ordine
  const [dataRitiro, setDataRitiro] = useState('');
  const [oraRitiro, setOraRitiro] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [daViaggio, setDaViaggio] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [note, setNote] = useState('');

  // Stati per gestione ordini
  const [ordini, setOrdini] = useState<Ordine[]>([]);

  // Stati per notifiche
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Carica ordini iniziali
  useEffect(() => {
    // Qui potresti caricare gli ordini da un API o dal localStorage
    const ordiniSalvati = localStorage.getItem('ordini');
    if (ordiniSalvati) {
      setOrdini(JSON.parse(ordiniSalvati));
    }
  }, []);

  // Funzione per aggiungere prodotto al carrello
  const aggiungiAlCarrello = () => {
    // Verifica che tutti i campi necessari siano compilati
    if (modalitaManuale && !prodottoManuale) {
      setSnackbarMessage('Inserisci il nome del prodotto');
      setSnackbarOpen(true);
      return;
    }

    if (!modalitaManuale && !prodottoSelezionato) {
      setSnackbarMessage('Seleziona un prodotto');
      setSnackbarOpen(true);
      return;
    }

    if (quantita <= 0) {
      setSnackbarMessage('La quantità deve essere maggiore di zero');
      setSnackbarOpen(true);
      return;
    }

    // Crea il nuovo prodotto
    const nuovoProdotto: ProdottoOrdine = {
      prodotto: modalitaManuale ? prodottoManuale : prodottoSelezionato,
      quantita,
      prezzo: 0, // Qui dovresti recuperare il prezzo in base al prodotto selezionato
      unita: unitaMisuraSelezionata,
      note: noteProdotto
    };

    // Aggiungi al carrello
    setCarrello([...carrello, nuovoProdotto]);

    // Reset dei campi
    if (modalitaManuale) {
      setProdottoManuale('');
    } else {
      setProdottoSelezionato('');
    }
    setQuantita(1);
    setNoteProdotto('');

    // Notifica
    setSnackbarMessage('Prodotto aggiunto al carrello');
    setSnackbarOpen(true);
  };

  // Funzione per rimuovere prodotto dal carrello
  const rimuoviDalCarrello = (index: number) => {
    setCarrello(carrello.filter((_, i) => i !== index));
    setSnackbarMessage('Prodotto rimosso dal carrello');
    setSnackbarOpen(true);
  };

  // Funzione per svuotare il carrello
  const svuotaCarrello = () => {
    setCarrello([]);
    setSnackbarMessage('Carrello svuotato');
    setSnackbarOpen(true);
  };

  // Funzione per calcolare il totale del carrello
  const calcolaTotaleCarrello = () => {
    return carrello.reduce((total, item) => total + (item.prezzo * item.quantita), 0);
  };

  // Funzione per aggiungere un nuovo ordine
  const aggiungiOrdine = () => {
    // Verifica che tutti i campi necessari siano compilati
    if (!dataRitiro) {
      setSnackbarMessage('Inserisci la data di ritiro');
      setSnackbarOpen(true);
      return;
    }

    if (!oraRitiro) {
      setSnackbarMessage('Inserisci l\'ora di ritiro');
      setSnackbarOpen(true);
      return;
    }

    if (!nomeCliente) {
      setSnackbarMessage('Inserisci il nome del cliente');
      setSnackbarOpen(true);
      return;
    }

    if (carrello.length === 0) {
      setSnackbarMessage('Aggiungi almeno un prodotto al carrello');
      setSnackbarOpen(true);
      return;
    }

    // Crea il nuovo ordine
    const nuovoOrdine: Ordine = {
      _id: Date.now().toString(), // In un'app reale, questo verrebbe dal server
      dataRitiro,
      oraRitiro,
      nomeCliente,
      telefono,
      daViaggio,
      note,
      prodotti: [...carrello],
      createdAt: new Date().toISOString(),
      stato: 'In Attesa'
    };

    // Aggiungi il nuovo ordine
    const nuoviOrdini = [...ordini, nuovoOrdine];
    setOrdini(nuoviOrdini);

    // Salva nel localStorage (in un'app reale, salveresti nel DB)
    localStorage.setItem('ordini', JSON.stringify(nuoviOrdini));

    // Reset dei campi
    setDataRitiro('');
    setOraRitiro('');
    setNomeCliente('');
    setTelefono('');
    setDaViaggio(false);
    setNote('');
    svuotaCarrello();

    // Notifica
    setSnackbarMessage('Ordine aggiunto con successo');
    setSnackbarOpen(true);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ maxWidth: 800, margin: 'auto', padding: 2 }}>
        <AggiungiProdotto
          modalitaManuale={modalitaManuale}
          onChangeModalita={setModalitaManuale}
          categoriaSelezionata={categoriaSelezionata}
          onChangeCategoria={setCategoriaSelezionata}
          prodottoSelezionato={prodottoSelezionato}
          onChangeProdotto={setProdottoSelezionato}
          prodottoManuale={prodottoManuale}
          onChangeProdottoManuale={setProdottoManuale}
          unitaMisura={unitaMisuraSelezionata}
          onChangeUnitaMisura={setUnitaMisuraSelezionata}
          quantita={quantita}
          onChangeQuantita={setQuantita}
          noteProdotto={noteProdotto}
          onChangeNote={setNoteProdotto}
          onAggiungi={aggiungiAlCarrello}
        />

        <CarrelloOrdine
          carrello={carrello}
          onRimuovi={rimuoviDalCarrello}
          onSvuota={svuotaCarrello}
          totale={calcolaTotaleCarrello()}
        />

        <DettagliOrdine
          dataRitiro={dataRitiro}
          onChangeData={setDataRitiro}
          oraRitiro={oraRitiro}
          onChangeOra={setOraRitiro}
          nomeCliente={nomeCliente}
          onChangeNome={setNomeCliente}
          daViaggio={daViaggio}
          onChangeViaggio={setDaViaggio}
          telefono={telefono}
          onChangeTelefono={setTelefono}
          note={note}
          onChangeNote={setNote}
          onConferma={aggiungiOrdine}
        />

        <RiepilogoOrdini
          ordini={ordini}
          onStampaRiepilogo={() => generaStampaRiepilogo(ordini, dataRitiro)}
        />

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Box>
    </ThemeProvider>
  );
};

export default GestoreOrdini;