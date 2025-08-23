import React, { useState, useEffect } from 'react';
import {
  Typography, Box, Paper, Grid, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Divider, Alert, Snackbar,
  CircularProgress, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

/**
 * Componente per le impostazioni di default della fatturazione
 */
const ImpostazioniDiDefault = () => {
  // Stati
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Stato impostazioni
  const [settings, setSettings] = useState({
    azienda: {
      nome: '',
      indirizzo: '',
      cap: '',
      citta: '',
      provincia: '',
      codiceFiscale: '',
      partitaIva: '',
      email: '',
      pec: '',
      telefono: '',
      sitoWeb: ''
    },
    contoBancario: {
      iban: '',
      banca: '',
      filiale: '',
      intestatario: '',
      swift: ''
    },
    fatturazione: {
      modalitaPagamentoDefault: 'Bonifico Bancario',
      giorniScadenzaDefault: 30,
      aliquotaIvaDefault: 10,
      prefissoNumeroFattura: '',
      invioAutomaticoEmail: false,
      includiFatturaInOrdine: true
    },
    numeroProgressivo: {
      anno: new Date().getFullYear(),
      ultimoNumero: 0,
      resetAnnuale: true
    },
    pdf: {
      colorePrimario: '#3f51b5',
      coloreSecondario: '#f50057',
      fontPrimario: 'Arial',
      mostraLogo: true,
      includiFooter: true,
      notaPiePagina: 'Documento emesso in conformità alla normativa vigente.'
    }
  });

  /**
   * Carica le impostazioni salvate
   */
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In un'app reale, qui ci sarebbe una chiamata API
      // Per ora, simuliamo il caricamento di dati di esempio
      setTimeout(() => {
        setSettings({
          azienda: {
            nome: 'Pastificio Artigianale',
            indirizzo: 'Via Roma 123',
            cap: '00123',
            citta: 'Roma',
            provincia: 'RM',
            codiceFiscale: 'ABCDEF12G34H567I',
            partitaIva: '12345678901',
            email: 'info@pastificio.it',
            pec: 'pastificio@pec.it',
            telefono: '06 1234567',
            sitoWeb: 'www.pastificio.it'
          },
          contoBancario: {
            iban: 'IT12A1234567890123456789012',
            banca: 'Banca Esempio',
            filiale: 'Roma Centro',
            intestatario: 'Pastificio Artigianale Srl',
            swift: 'ABCDIT12'
          },
          fatturazione: {
            modalitaPagamentoDefault: 'Bonifico Bancario',
            giorniScadenzaDefault: 30,
            aliquotaIvaDefault: 10,
            prefissoNumeroFattura: 'F',
            invioAutomaticoEmail: true,
            includiFatturaInOrdine: true
          },
          numeroProgressivo: {
            anno: new Date().getFullYear(),
            ultimoNumero: 42,
            resetAnnuale: true
          },
          pdf: {
            colorePrimario: '#1976d2',
            coloreSecondario: '#dc004e',
            fontPrimario: 'Helvetica',
            mostraLogo: true,
            includiFooter: true,
            notaPiePagina: 'Documento emesso in conformità alla normativa vigente.'
          }
        });
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Errore nel caricamento delle impostazioni:', err);
      setError('Errore nel caricamento delle impostazioni. Riprova più tardi.');
      setLoading(false);
    }
  };

  // Carica le impostazioni all'avvio
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Salva le impostazioni
   */
  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // In un'app reale, qui ci sarebbe una chiamata API
      // Per ora, simuliamo il salvataggio
      setTimeout(() => {
        toast.success('Impostazioni salvate con successo');
        setSuccess('Impostazioni salvate con successo');
        setSaving(false);
        
        // Nasconde il messaggio di successo dopo 3 secondi
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }, 1000);
    } catch (err) {
      console.error('Errore nel salvataggio delle impostazioni:', err);
      setError('Errore nel salvataggio delle impostazioni. Riprova più tardi.');
      setSaving(false);
    }
  };

  /**
   * Resetta le impostazioni ai valori di default
   */
  const resetSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // In un'app reale, qui ci sarebbe una chiamata API
      // Per ora, simuliamo il reset
      setTimeout(() => {
        loadSettings();
        toast.info('Impostazioni ripristinate ai valori di default');
        setSaving(false);
      }, 1000);
    } catch (err) {
      console.error('Errore nel reset delle impostazioni:', err);
      setError('Errore nel reset delle impostazioni. Riprova più tardi.');
      setSaving(false);
    }
  };

  /**
   * Gestisce il cambio dati nei form
   */
  const handleChange = (section, field, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Impostazioni Fatturazione
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Configura le impostazioni predefinite per la fatturazione. Queste impostazioni verranno utilizzate
          come valori di default quando crei nuove fatture.
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <form>
        {/* Sezione Dati Azienda */}
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography variant="h6">Dati Azienda</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nome/Ragione Sociale"
                  value={settings.azienda.nome}
                  onChange={(e) => handleChange('azienda', 'nome', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Indirizzo"
                  value={settings.azienda.indirizzo}
                  onChange={(e) => handleChange('azienda', 'indirizzo', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  label="CAP"
                  value={settings.azienda.cap}
                  onChange={(e) => handleChange('azienda', 'cap', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Città"
                  value={settings.azienda.citta}
                  onChange={(e) => handleChange('azienda', 'citta', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  label="Provincia"
                  value={settings.azienda.provincia}
                  onChange={(e) => handleChange('azienda', 'provincia', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Partita IVA"
                  value={settings.azienda.partitaIva}
                  onChange={(e) => handleChange('azienda', 'partitaIva', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Codice Fiscale"
                  value={settings.azienda.codiceFiscale}
                  onChange={(e) => handleChange('azienda', 'codiceFiscale', e.target.value)}
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Email"
                  type="email"
                  value={settings.azienda.email}
                  onChange={(e) => handleChange('azienda', 'email', e.target.value)}
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="PEC"
                  type="email"
                  value={settings.azienda.pec}
                  onChange={(e) => handleChange('azienda', 'pec', e.target.value)}
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Telefono"
                  value={settings.azienda.telefono}
                  onChange={(e) => handleChange('azienda', 'telefono', e.target.value)}
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Sito Web"
                  value={settings.azienda.sitoWeb}
                  onChange={(e) => handleChange('azienda', 'sitoWeb', e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        
        {/* Sezione Conto Bancario */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2a-content"
            id="panel2a-header"
          >
            <Typography variant="h6">Conto Bancario</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="IBAN"
                  value={settings.contoBancario.iban}
                  onChange={(e) => handleChange('contoBancario', 'iban', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Banca"
                  value={settings.contoBancario.banca}
                  onChange={(e) => handleChange('contoBancario', 'banca', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Filiale"
                  value={settings.contoBancario.filiale}
                  onChange={(e) => handleChange('contoBancario', 'filiale', e.target.value)}
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Intestatario"
                  value={settings.contoBancario.intestatario}
                  onChange={(e) => handleChange('contoBancario', 'intestatario', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="SWIFT/BIC"
                  value={settings.contoBancario.swift}
                  onChange={(e) => handleChange('contoBancario', 'swift', e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        
        {/* Sezione Fatturazione */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel3a-content"
            id="panel3a-header"
          >
            <Typography variant="h6">Opzioni di Fatturazione</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Modalità di Pagamento Default</InputLabel>
                  <Select
                    value={settings.fatturazione.modalitaPagamentoDefault}
                    onChange={(e) => handleChange('fatturazione', 'modalitaPagamentoDefault', e.target.value)}
                    label="Modalità di Pagamento Default"
                  >
                    <MenuItem value="Contanti">Contanti</MenuItem>
                    <MenuItem value="Bonifico Bancario">Bonifico Bancario</MenuItem>
                    <MenuItem value="Ricevuta Bancaria">Ricevuta Bancaria</MenuItem>
                    <MenuItem value="Assegno">Assegno</MenuItem>
                    <MenuItem value="Altro">Altro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Giorni Scadenza Default"
                  type="number"
                  value={settings.fatturazione.giorniScadenzaDefault}
                  onChange={(e) => handleChange('fatturazione', 'giorniScadenzaDefault', parseInt(e.target.value))}
                  fullWidth
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Aliquota IVA Default</InputLabel>
                  <Select
                    value={settings.fatturazione.aliquotaIvaDefault}
                    onChange={(e) => handleChange('fatturazione', 'aliquotaIvaDefault', parseInt(e.target.value))}
                    label="Aliquota IVA Default"
                  >
                    <MenuItem value={4}>4% (Beni di prima necessità)</MenuItem>
                    <MenuItem value={5}>5% (Prodotti sanitari)</MenuItem>
                    <MenuItem value={10}>10% (Prodotti alimentari)</MenuItem>
                    <MenuItem value={22}>22% (Aliquota ordinaria)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Prefisso Numero Fattura"
                  value={settings.fatturazione.prefissoNumeroFattura}
                  onChange={(e) => handleChange('fatturazione', 'prefissoNumeroFattura', e.target.value)}
                  fullWidth
                  helperText="Ad esempio: F per normale fattura, P per proforma, ecc."
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Invio Automatico Email</InputLabel>
                  <Select
                    value={settings.fatturazione.invioAutomaticoEmail}
                    onChange={(e) => handleChange('fatturazione', 'invioAutomaticoEmail', e.target.value)}
                    label="Invio Automatico Email"
                  >
                    <MenuItem value={true}>Sì</MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Includi Fattura in Ordine</InputLabel>
                  <Select
                    value={settings.fatturazione.includiFatturaInOrdine}
                    onChange={(e) => handleChange('fatturazione', 'includiFatturaInOrdine', e.target.value)}
                    label="Includi Fattura in Ordine"
                  >
                    <MenuItem value={true}>Sì</MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        
        {/* Sezione Numerazione */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel4a-content"
            id="panel4a-header"
          >
            <Typography variant="h6">Numerazione Progressiva</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Anno Corrente"
                  type="number"
                  value={settings.numeroProgressivo.anno}
                  onChange={(e) => handleChange('numeroProgressivo', 'anno', parseInt(e.target.value))}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  helperText="L'anno corrente viene impostato automaticamente"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Ultimo Numero Utilizzato"
                  type="number"
                  value={settings.numeroProgressivo.ultimoNumero}
                  onChange={(e) => handleChange('numeroProgressivo', 'ultimoNumero', parseInt(e.target.value))}
                  fullWidth
                  helperText="Attenzione: modificare solo se necessario!"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Reset Annuale</InputLabel>
                  <Select
                    value={settings.numeroProgressivo.resetAnnuale}
                    onChange={(e) => handleChange('numeroProgressivo', 'resetAnnuale', e.target.value)}
                    label="Reset Annuale"
                  >
                    <MenuItem value={true}>Sì (ricomincia da 1 ogni anno)</MenuItem>
                    <MenuItem value={false}>No (numerazione progressiva continua)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info">
                  La prossima fattura avrà numero: <strong>{settings.fatturazione.prefissoNumeroFattura}{settings.numeroProgressivo.ultimoNumero + 1}/{settings.numeroProgressivo.anno}</strong>
                </Alert>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        
        {/* Sezione PDF */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel5a-content"
            id="panel5a-header"
          >
            <Typography variant="h6">Personalizzazione PDF</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Colore Primario"
                  type="color"
                  value={settings.pdf.colorePrimario}
                  onChange={(e) => handleChange('pdf', 'colorePrimario', e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: settings.pdf.colorePrimario,
                          mr: 1
                        }}
                      />
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Colore Secondario"
                  type="color"
                  value={settings.pdf.coloreSecondario}
                  onChange={(e) => handleChange('pdf', 'coloreSecondario', e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: settings.pdf.coloreSecondario,
                          mr: 1
                        }}
                      />
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Font Primario</InputLabel>
                  <Select
                    value={settings.pdf.fontPrimario}
                    onChange={(e) => handleChange('pdf', 'fontPrimario', e.target.value)}
                    label="Font Primario"
                  >
                    <MenuItem value="Arial">Arial</MenuItem>
                    <MenuItem value="Helvetica">Helvetica</MenuItem>
                    <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                    <MenuItem value="Courier">Courier</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Mostra Logo</InputLabel>
                  <Select
                    value={settings.pdf.mostraLogo}
                    onChange={(e) => handleChange('pdf', 'mostraLogo', e.target.value)}
                    label="Mostra Logo"
                  >
                    <MenuItem value={true}>Sì</MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Includi Footer</InputLabel>
                  <Select
                    value={settings.pdf.includiFooter}
                    onChange={(e) => handleChange('pdf', 'includiFooter', e.target.value)}
                    label="Includi Footer"
                  >
                    <MenuItem value={true}>Sì</MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nota a Piè Pagina"
                  value={settings.pdf.notaPiePagina}
                  onChange={(e) => handleChange('pdf', 'notaPiePagina', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        
        {/* Azioni */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={resetSettings}
            disabled={saving}
          >
            Ripristina Default
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
          </Button>
        </Box>
      </form>
    </div>
  );
};

export default ImpostazioniDiDefault;