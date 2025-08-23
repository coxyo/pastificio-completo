import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography, Box, Paper, Grid, Divider, Button, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, CircularProgress, Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Print as PrintIcon,
  Payment as PaymentIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Cancel as CancelIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import axios from 'axios';
import { toast } from 'react-toastify';

/**
 * Componente per visualizzare i dettagli di una fattura
 */
const FatturaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Stato per i dati
  const [fattura, setFattura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stato per dialogs
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Stato per nuovo pagamento
  const [payment, setPayment] = useState({
    importo: '',
    metodoPagamento: 'Bonifico',
    data: format(new Date(), 'yyyy-MM-dd'),
    note: ''
  });
  
  // Stato per invio email
  const [emailData, setEmailData] = useState({
    to: '',
    cc: '',
    subject: '',
    message: ''
  });

  /**
   * Carica i dati della fattura
   */
  const loadFattura = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/fatture/${id}`);
      setFattura(response.data.data);
      
      // Prepara email se c'è un indirizzo
      if (response.data.data.cliente.email) {
        setEmailData(prev => ({
          ...prev,
          to: response.data.data.cliente.email,
          subject: `Fattura n. ${response.data.data.numero}/${response.data.data.anno}`,
          message: `Gentile ${response.data.data.cliente.nome},\n\nIn allegato la fattura n. ${response.data.data.numero}/${response.data.data.anno} del ${format(new Date(response.data.data.dataEmissione), 'dd/MM/yyyy')}.\n\nCordiali saluti,\n[Il tuo nome]`
        }));
      }
    } catch (err) {
      console.error('Errore nel caricamento della fattura:', err);
      setError('Errore nel caricamento della fattura. Riprova più tardi.');
      toast.error('Errore nel caricamento della fattura');
    } finally {
      setLoading(false);
    }
  };

  // Carica i dati all'avvio
  useEffect(() => {
    loadFattura();
  }, [id]);

  /**
   * Formatta importi come valuta
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  /**
   * Formatta date
   */
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: it });
  };

  /**
   * Registra un pagamento
   */
  const handlePayment = async () => {
    try {
      if (!payment.importo || !payment.metodoPagamento) {
        toast.error('Importo e metodo di pagamento sono obbligatori');
        return;
      }
      
      await axios.post(`/api/fatture/${id}/pagamenti`, payment);
      toast.success('Pagamento registrato con successo');
      setShowPaymentDialog(false);
      
      // Reset form e ricarica dati
      setPayment({
        importo: '',
        metodoPagamento: 'Bonifico',
        data: format(new Date(), 'yyyy-MM-dd'),
        note: ''
      });
      
      loadFattura();
    } catch (err) {
      console.error('Errore nella registrazione del pagamento:', err);
      toast.error(err.response?.data?.error || 'Errore nella registrazione del pagamento');
    }
  };

  /**
   * Annulla la fattura
   */
  const handleCancelFattura = async () => {
    try {
      await axios.put(`/api/fatture/${id}/annulla`);
      toast.success('Fattura annullata con successo');
      setShowCancelDialog(false);
      loadFattura();
    } catch (err) {
      console.error('Errore nell\'annullamento della fattura:', err);
      toast.error(err.response?.data?.error || 'Errore nell\'annullamento della fattura');
    }
  };

  /**
   * Elimina la fattura
   */
  const handleDeleteFattura = async () => {
    try {
      await axios.delete(`/api/fatture/${id}`);
      toast.success('Fattura eliminata con successo');
      navigate('/fatture');
    } catch (err) {
      console.error('Errore nell\'eliminazione della fattura:', err);
      toast.error(err.response?.data?.error || 'Errore nell\'eliminazione della fattura');
    }
  };

  /**
   * Invia la fattura per email
   */
  const handleSendEmail = async () => {
    try {
      // Implementazione placeholder - il backend dovrebbe gestire realmente l'invio
      toast.success('Funzionalità di invio email da implementare');
      setShowEmailDialog(false);
    } catch (err) {
      console.error('Errore nell\'invio dell\'email:', err);
      toast.error('Errore nell\'invio dell\'email');
    }
  };

  /**
   * Scarica il PDF della fattura
   */
  const handleDownloadPDF = async () => {
    try {
      const response = await axios.get(`/api/fatture/${id}/pdf`, {
        responseType: 'blob'
      });
      
      // Crea URL per il download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Fattura_${fattura.numero}_${fattura.anno}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF generato con successo');
    } catch (err) {
      console.error('Errore nella generazione del PDF:', err);
      toast.error('Errore nella generazione del PDF');
    }
  };

  // Colori per gli stati
  const getStatusColor = (stato) => {
    switch (stato) {
      case 'Bozza': return '#949494'; // Grigio
      case 'Emessa': return '#2196F3'; // Blu
      case 'Pagata': return '#4CAF50'; // Verde
      case 'Parzialmente Pagata': return '#FF9800'; // Arancione
      case 'Scaduta': return '#F44336'; // Rosso
      case 'Annullata': return '#9C27B0'; // Viola
      default: return '#949494';
    }
  };

  // Opzioni per metodi di pagamento
  const metodiPagamento = [
    { value: 'Contanti', label: 'Contanti' },
    { value: 'Bonifico', label: 'Bonifico' },
    { value: 'Carta di Credito', label: 'Carta di Credito' },
    { value: 'Assegno', label: 'Assegno' },
    { value: 'Altro', label: 'Altro' }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!fattura) {
    return (
      <Alert severity="warning" sx={{ my: 2 }}>
        Fattura non trovata
      </Alert>
    );
  }

  return (
    <div>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            sx={{ mr: 2 }}
            onClick={() => navigate('/fatture')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Fattura #{fattura.numero}/{fattura.anno}
          </Typography>
          <Chip
            label={fattura.stato}
            size="medium"
            sx={{ 
              ml: 2,
              backgroundColor: getStatusColor(fattura.stato),
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>
        
        <Box>
          {fattura.stato === 'Bozza' && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/fatture/${id}/modifica`)}
              sx={{ mr: 1 }}
            >
              Modifica
            </Button>
          )}
          
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handleDownloadPDF}
            sx={{ mr: 1 }}
          >
            Stampa PDF
          </Button>
          
          {['Emessa', 'Parzialmente Pagata', 'Scaduta'].includes(fattura.stato) && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PaymentIcon />}
              onClick={() => setShowPaymentDialog(true)}
              sx={{ mr: 1 }}
            >
              Registra Pagamento
            </Button>
          )}
          
          {fattura.stato !== 'Annullata' && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setShowCancelDialog(true)}
              sx={{ mr: 1 }}
            >
              Annulla
            </Button>
          )}
          
          {(fattura.stato === 'Bozza' || localStorage.getItem('userRole') === 'admin') && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setShowDeleteDialog(true)}
            >
              Elimina
            </Button>
          )}
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Sezione Cliente e Dati Fattura */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Dati Cliente</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {fattura.cliente.nome}
            </Typography>
            <Typography variant="body1">{fattura.cliente.indirizzo}</Typography>
            
            {fattura.cliente.codiceFiscale && (
              <Typography variant="body2">Codice Fiscale: {fattura.cliente.codiceFiscale}</Typography>
            )}
            
            {fattura.cliente.partitaIva && (
              <Typography variant="body2">Partita IVA: {fattura.cliente.partitaIva}</Typography>
            )}
            
            {fattura.cliente.email && (
              <Typography variant="body2">Email: {fattura.cliente.email}</Typography>
            )}
            
            {fattura.cliente.telefono && (
              <Typography variant="body2">Telefono: {fattura.cliente.telefono}</Typography>
            )}
            
            {/* Bottone email se c'è indirizzo */}
            {fattura.cliente.email && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<SendIcon />}
                onClick={() => setShowEmailDialog(true)}
                sx={{ mt: 2 }}
              >
                Invia per Email
              </Button>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Dettagli Fattura</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Numero</Typography>
                <Typography variant="body1">{fattura.numero}/{fattura.anno}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Data Emissione</Typography>
                <Typography variant="body1">{formatDate(fattura.dataEmissione)}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Data Scadenza</Typography>
                <Typography variant="body1">{formatDate(fattura.dataScadenza)}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Modalità Pagamento</Typography>
                <Typography variant="body1">{fattura.modalitaPagamento}</Typography>
              </Grid>
              
              {fattura.modalitaPagamento === 'Bonifico Bancario' && fattura.coordinateBancarie && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Coordinate Bancarie</Typography>
                  </Grid>
                  
                  {fattura.coordinateBancarie.iban && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">IBAN</Typography>
                      <Typography variant="body1">{fattura.coordinateBancarie.iban}</Typography>
                    </Grid>
                  )}
                  
                  {fattura.coordinateBancarie.banca && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Banca</Typography>
                      <Typography variant="body1">{fattura.coordinateBancarie.banca}</Typography>
                    </Grid>
                  )}
                  
                  {fattura.coordinateBancarie.intestatario && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Intestatario</Typography>
                      <Typography variant="body1">{fattura.coordinateBancarie.intestatario}</Typography>
                    </Grid>
                  )}
                </>
              )}
              
              {fattura.note && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="textSecondary">Note</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{fattura.note}</Typography>
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        </Grid>
        
        {/* Sezione Prodotti */}
        <Grid item xs={12}>