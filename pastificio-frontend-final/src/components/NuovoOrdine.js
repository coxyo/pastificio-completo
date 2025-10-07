// components/NuovoOrdine.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  IconButton,
  Typography,
  Box,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Divider,
  Chip,
  Autocomplete
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  WhatsApp as WhatsAppIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';

const prodottiDisponibili = {
  dolci: [
    { nome: "Pardulas", prezzo: 19.00, unita: "Kg", descrizione: "Ricotta, zucchero, uova, aromi vari, farina 00, strutto, lievito" },
    { nome: "Amaretti", prezzo: 22.00, unita: "Kg", descrizione: "Mandorle, zucchero, uova, aromi vari" },
    { nome: "Papassinas", prezzo: 22.00, unita: "Kg", descrizione: "Farina, mandorle, uva sultanina, noci, sapa, zucchero, strutto, aromi vari, lievito" },
    { nome: "Ciambelle con marmellata", prezzo: 16.00, unita: "Kg", descrizione: "Farina 00, zucchero, strutto, margarina vegetale, uova, passata di albicocche" },
    { nome: "Ciambelle con Nutella", prezzo: 16.00, unita: "Kg", descrizione: "Farina, zucchero, strutto, margarina vegetale, uova, cacao, aromi vari" },
    { nome: "Cantucci", prezzo: 23.00, unita: "Kg", descrizione: "Mandorle, farina 00, zucchero, uova, aromi vari" },
    { nome: "Bianchini", prezzo: 15.00, unita: "Kg", descrizione: "Zucchero, uova" },
    { nome: "Gueffus", prezzo: 22.00, unita: "Kg", descrizione: "Mandorle, zucchero, aromi vari" },
    { nome: "Dolci misti (Pardulas, ciambelle, papassinas, amaretti, gueffus, bianchini)", prezzo: 19.00, unita: "Kg", descrizione: "Mix di dolci tradizionali" },
    { nome: "Dolci misti (Pardulas, ciambelle)", prezzo: 17.00, unita: "Kg", descrizione: "Mix pardulas e ciambelle" },
    { nome: "Zeppole", prezzo: 21.00, unita: "Kg", descrizione: "Farina, latte, uova, ricotta, patate, aromi vari, lievito" },
    { nome: "Pizzette sfoglia", prezzo: 16.00, unita: "Kg", descrizione: "Farina, passata di pomodoro, strutto, capperi, lievito" },
    { nome: "Torta di sapa", prezzo: 23.00, unita: "Kg", descrizione: "Farina, sapa, zucchero, uova, noci, mandorle, uva sultanina" }
  ],
  panadas: [
    { nome: "Panada di anguille", prezzo: 30.00, unita: "Kg", descrizione: "Con patate o piselli (prodotto congelato)" },
    { nome: "Panada di Agnello", prezzo: 25.00, unita: "Kg", descrizione: "Con patate o piselli (prodotto congelato)" },
    { nome: "Panada di Maiale", prezzo: 21.00, unita: "Kg", descrizione: "Con patate o piselli (prodotto congelato)" },
    { nome: "Panada di Vitella", prezzo: 23.00, unita: "Kg", descrizione: "Con patate o piselli (prodotto congelato)" },
    { nome: "Panada di verdure", prezzo: 17.00, unita: "Kg", descrizione: "Melanzane, patate e piselli (prodotto congelato)" },
    { nome: "Panadine carne o verdura", prezzo: 0.80, unita: "unità", descrizione: "Prodotto congelato" }
  ],
  pasta: [
    { nome: "Ravioli ricotta e zafferano", prezzo: 11.00, unita: "Kg", descrizione: "Ricotta, zafferano, uova, sale, semola, farina" },
    { nome: "Ravioli ricotta spinaci e zafferano", prezzo: 11.00, unita: "Kg", descrizione: "Ricotta, spinaci, zafferano, uova, sale, semola, farina" },
    { nome: "Ravioli ricotta spinaci", prezzo: 11.00, unita: "Kg", descrizione: "Ricotta, spinaci, uova, sale, semola, farina" },
    { nome: "Ravioli ricotta dolci", prezzo: 11.00, unita: "Kg", descrizione: "Ricotta, zafferano, uova, zucchero, semola, farina" },
    { nome: "Culurgiones", prezzo: 16.00, unita: "Kg", descrizione: "Patate, formaggio, aglio, menta, olio extra vergine, sale, semola, farina" },
    { nome: "Ravioli formaggio", prezzo: 16.00, unita: "Kg", descrizione: "Formaggio pecorino, spinaci, uova, sale, semola, farina" },
    { nome: "Sfoglie per Lasagne", prezzo: 5.00, unita: "Kg", descrizione: "Semola, farina, uova, sale" },
    { nome: "Pasta per panadas", prezzo: 5.00, unita: "Kg", descrizione: "Semola, farina, strutto naturale, sale" },
    { nome: "Pasta per pizza", prezzo: 5.00, unita: "Kg", descrizione: "Farina, latte, olio, lievito, sale" },
    { nome: "Fregola", prezzo: 10.00, unita: "Kg", descrizione: "Semola, zafferano, sale" }
  ]
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

export default function NuovoOrdine({ open, onClose, onSave, ordineIniziale, submitInCorso }) {
  const [ordine, setOrdine] = useState({
    nomeCliente: '',
    telefono: '',
    dataRitiro: new Date().toISOString().split('T')[0],
    oraRitiro: '',
    prodotti: [],
    note: '',
    stato: 'nuovo',
    cliente: { nome: '', telefono: '' }
  });

  const [prodottoCorrente, setProdottoCorrente] = useState({
    nome: '',
    quantita: 1,
    unita: 'Kg',
    prezzo: 0,
    categoria: ''
  });

  const [errori, setErrori] = useState({});
  const [clienti, setClienti] = useState([]);
  const [loadingClienti, setLoadingClienti] = useState(false);

  // Carica clienti quando il dialog si apre
  useEffect(() => {
    const caricaClienti = async () => {
      if (!open) return;
      
      setLoadingClienti(true);
      try {
        const response = await fetch(`${API_URL}/clienti`);
        const data = await response.json();
        
        console.log('Clienti caricati:', data);
        
        if (data.success && Array.isArray(data.data)) {
          setClienti(data.data);
        }
      } catch (error) {
        console.error('Errore caricamento clienti:', error);
      } finally {
        setLoadingClienti(false);
      }
    };
    
    caricaClienti();
  }, [open]);

  // Carica ordine se in modifica
  useEffect(() => {
    if (ordineIniziale) {
      setOrdine({
        ...ordineIniziale,
        nomeCliente: ordineIniziale.nomeCliente || ordineIniziale.cliente?.nome || '',
        telefono: ordineIniziale.telefono || ordineIniziale.cliente?.telefono || ''
      });
    } else {
      // Reset quando si chiude il dialog
      if (!open) {
        setOrdine({
          nomeCliente: '',
          telefono: '',
          dataRitiro: new Date().toISOString().split('T')[0],
          oraRitiro: '',
          prodotti: [],
          note: '',
          stato: 'nuovo',
          cliente: { nome: '', telefono: '' }
        });
        setProdottoCorrente({
          nome: '',
          quantita: 1,
          unita: 'Kg',
          prezzo: 0,
          categoria: ''
        });
        setErrori({});
      }
    }
  }, [ordineIniziale, open]);

  const tuttiProdotti = Object.values(prodottiDisponibili).flat();

  const handleProdottoChange = (nomeProdotto) => {
    const prodotto = tuttiProdotti.find(p => p.nome === nomeProdotto);
    if (prodotto) {
      setProdottoCorrente({
        nome: prodotto.nome,
        prezzo: prodotto.prezzo,
        unita: prodotto.unita,
        quantita: 1,
        categoria: Object.entries(prodottiDisponibili).find(([_, prods]) => 
          prods.some(p => p.nome === prodotto.nome)
        )?.[0] || ''
      });
    }
  };

  const aggiungiProdotto = () => {
    if (!prodottoCorrente.nome) {
      setErrori({ prodotto: 'Seleziona un prodotto' });
      return;
    }

    const nuovoProdotto = {
      ...prodottoCorrente,
      prodotto: prodottoCorrente.nome,
      totale: prodottoCorrente.quantita * prodottoCorrente.prezzo
    };

    setOrdine({
      ...ordine,
      prodotti: [...ordine.prodotti, nuovoProdotto]
    });

    setProdottoCorrente({
      nome: '',
      quantita: 1,
      unita: 'Kg',
      prezzo: 0,
      categoria: ''
    });
    setErrori({});
  };

  const rimuoviProdotto = (index) => {
    setOrdine({
      ...ordine,
      prodotti: ordine.prodotti.filter((_, i) => i !== index)
    });
  };

  const calcolaTotale = () => {
    return ordine.prodotti.reduce((sum, p) => sum + (p.quantita * p.prezzo), 0);
  };

  const handleSubmit = () => {
    const erroriValidazione = {};
    
    if (!ordine.nomeCliente) {
      erroriValidazione.nomeCliente = 'Nome cliente obbligatorio';
    }
    if (ordine.prodotti.length === 0) {
      erroriValidazione.prodotti = 'Aggiungi almeno un prodotto';
    }
    if (!ordine.dataRitiro) {
      erroriValidazione.dataRitiro = 'Data ritiro obbligatoria';
    }
    if (!ordine.oraRitiro) {
      erroriValidazione.oraRitiro = 'Ora ritiro obbligatoria';
    }

    if (Object.keys(erroriValidazione).length > 0) {
      setErrori(erroriValidazione);
      return;
    }

    const ordineCompleto = {
      ...ordine,
      cliente: {
        nome: ordine.nomeCliente,
        telefono: ordine.telefono
      },
      totale: calcolaTotale(),
      createdAt: ordine.createdAt || new Date().toISOString()
    };

    onSave(ordineCompleto);
  };

  const handleWhatsApp = () => {
    const testoOrdine = `
🍝 *PASTIFICIO NONNA CLAUDIA* 🍝

📋 *NUOVO ORDINE*
👤 Cliente: ${ordine.nomeCliente}
📅 Ritiro: ${ordine.dataRitiro}
⏰ Ora: ${ordine.oraRitiro}

📦 *PRODOTTI:*
${ordine.prodotti.map(p => `• ${p.nome}: ${p.quantita} ${p.unita}`).join('\n')}

💰 *TOTALE: €${calcolaTotale().toFixed(2)}*

${ordine.note ? `📝 Note: ${ordine.note}` : ''}

Grazie per l'ordine! ✨
    `.trim();

    const numeroWhatsApp = ordine.telefono?.replace(/\D/g, '');
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(testoOrdine)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {ordineIniziale ? 'Modifica Ordine' : 'Nuovo Ordine'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Dati Cliente */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Dati Cliente
            </Typography>
          </Grid>

          {/* AUTOCOMPLETE CLIENTI - VERSIONE CORRETTA */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={clienti}
              loading={loadingClienti}
              value={null}
              inputValue={ordine.nomeCliente}
              onInputChange={(event, newInputValue) => {
                setOrdine({ ...ordine, nomeCliente: newInputValue });
              }}
              getOptionLabel={(option) => {
                if (!option) return '';
                if (typeof option === 'string') return option;
                const nome = option.tipo === 'azienda' ? 
                  option.ragioneSociale : 
                  `${option.nome} ${option.cognome || ''}`.trim();
                return `${nome} - ${option.telefono}`;
              }}
              onChange={(event, newValue) => {
                if (newValue && typeof newValue === 'object') {
                  const nomeCompleto = newValue.tipo === 'azienda' ? 
                    newValue.ragioneSociale : 
                    `${newValue.nome} ${newValue.cognome || ''}`.trim();
                  
                  setOrdine({
                    ...ordine,
                    nomeCliente: nomeCompleto,
                    telefono: newValue.telefono,
                    email: newValue.email || ''
                  });
                }
              }}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente *"
                  error={!!errori.nomeCliente}
                  helperText={errori.nomeCliente || "Cerca cliente esistente o scrivi nuovo"}
                  required
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telefono"
              value={ordine.telefono}
              onChange={(e) => setOrdine({ ...ordine, telefono: e.target.value })}
              InputProps={{
                startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>

          {/* Data e Ora */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              <CalendarIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Data e Ora Ritiro
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Data Ritiro"
              value={ordine.dataRitiro}
              onChange={(e) => setOrdine({ ...ordine, dataRitiro: e.target.value })}
              error={!!errori.dataRitiro}
              helperText={errori.dataRitiro}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="time"
              label="Ora Ritiro"
              value={ordine.oraRitiro}
              onChange={(e) => setOrdine({ ...ordine, oraRitiro: e.target.value })}
              error={!!errori.oraRitiro}
              helperText={errori.oraRitiro}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Prodotti */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              <CartIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Prodotti
            </Typography>
          </Grid>

          {/* Form aggiungi prodotto */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Seleziona Prodotto"
                    value={prodottoCorrente.nome}
                    onChange={(e) => handleProdottoChange(e.target.value)}
                    error={!!errori.prodotto}
                    helperText={errori.prodotto}
                    size="small"
                  >
                    <MenuItem value="">-- Seleziona --</MenuItem>
                    {Object.entries(prodottiDisponibili).map(([categoria, prodotti]) => [
                      <MenuItem key={`header-${categoria}`} disabled>
                        <Typography variant="overline">{categoria.toUpperCase()}</Typography>
                      </MenuItem>,
                      ...prodotti.map(p => (
                        <MenuItem key={p.nome} value={p.nome}>
                          {p.nome} - €{p.prezzo}/{p.unita}
                        </MenuItem>
                      ))
                    ])}
                  </TextField>
                </Grid>

                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantità"
                    value={prodottoCorrente.quantita}
                    onChange={(e) => setProdottoCorrente({
                      ...prodottoCorrente,
                      quantita: parseFloat(e.target.value) || 0
                    })}
                    inputProps={{ min: 0, step: 0.1 }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={6} md={2}>
                  <TextField
                    select
                    fullWidth
                    label="Unità"
                    value={prodottoCorrente.unita}
                    onChange={(e) => setProdottoCorrente({
                      ...prodottoCorrente,
                      unita: e.target.value
                    })}
                    size="small"
                  >
                    <MenuItem value="Kg">Kg</MenuItem>
                    <MenuItem value="unità">Unità</MenuItem>
                    <MenuItem value="pezzi">Pezzi</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Prezzo"
                    value={prodottoCorrente.prezzo}
                    onChange={(e) => setProdottoCorrente({
                      ...prodottoCorrente,
                      prezzo: parseFloat(e.target.value) || 0
                    })}
                    inputProps={{ min: 0, step: 0.01 }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={6} md={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={aggiungiProdotto}
                    startIcon={<AddIcon />}
                  >
                    Aggiungi
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Lista prodotti */}
          {ordine.prodotti.length > 0 && (
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Prodotto</TableCell>
                      <TableCell align="right">Quantità</TableCell>
                      <TableCell>Unità</TableCell>
                      <TableCell align="right">Prezzo/u</TableCell>
                      <TableCell align="right">Totale</TableCell>
                      <TableCell align="center">Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ordine.prodotti.map((p, index) => (
                      <TableRow key={index}>
                        <TableCell>{p.nome || p.prodotto}</TableCell>
                        <TableCell align="right">{p.quantita}</TableCell>
                        <TableCell>{p.unita}</TableCell>
                        <TableCell align="right">€{p.prezzo.toFixed(2)}</TableCell>
                        <TableCell align="right">€{(p.quantita * p.prezzo).toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => rimuoviProdotto(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} align="right">
                        <Typography variant="h6">Totale:</Typography>
                      </TableCell>
                      <TableCell align="right" colSpan={2}>
                        <Typography variant="h6" color="primary">
                          €{calcolaTotale().toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}

          {errori.prodotti && (
            <Grid item xs={12}>
              <Alert severity="error">{errori.prodotti}</Alert>
            </Grid>
          )}

          {/* Note */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Note"
              value={ordine.note}
              onChange={(e) => setOrdine({ ...ordine, note: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        {ordine.telefono && ordine.prodotti.length > 0 && (
          <Button
            color="success"
            startIcon={<WhatsAppIcon />}
            onClick={handleWhatsApp}
          >
            Invia WhatsApp
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={onClose}>
          Annulla
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitInCorso}
          startIcon={<SaveIcon />}
        >
          {submitInCorso ? 'Salvataggio...' : 'Salva Ordine'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}