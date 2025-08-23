// components/Magazzino/index.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tab,
  Tabs,
  Card,
  CardContent,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Print as PrintIcon,
  FileDownload as DownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import axios from 'axios';
import { useWebSocket } from '../../hooks/useWebSocket';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function GestioneMagazzino() {
  const [tab, setTab] = useState(0);
  const [movimenti, setMovimenti] = useState([]);
  const [giacenze, setGiacenze] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  
  // Form nuovo movimento
  const [nuovoMovimento, setNuovoMovimento] = useState({
    tipo: 'carico',
    prodotto: {
      nome: '',
      categoria: ''
    },
    quantita: '',
    unita: 'kg',
    prezzoUnitario: '',
    fornitore: {
      nome: ''
    },
    documentoRiferimento: {
      tipo: '',
      numero: '',
      data: ''
    },
    lotto: '',
    dataScadenza: '',
    note: ''
  });

  const { socket } = useWebSocket();

  useEffect(() => {
    caricaDati();
    
    if (socket) {
      socket.on('nuovoMovimento', (movimento) => {
        setMovimenti(prev => [movimento, ...prev]);
        caricaGiacenze();
      });
    }

    return () => {
      if (socket) {
        socket.off('nuovoMovimento');
      }
    };
  }, [socket]);

  const caricaDati = async () => {
    setLoading(true);
    try {
      await Promise.all([
        caricaMovimenti(),
        caricaGiacenze(),
        caricaStatistiche()
      ]);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const caricaMovimenti = async () => {
    try {
      const response = await axios.get('/api/magazzino/movimenti');
      setMovimenti(response.data.data);
    } catch (error) {
      setError('Errore caricamento movimenti');
    }
  };

  const caricaGiacenze = async () => {
    try {
      const response = await axios.get('/api/magazzino/giacenze');
      setGiacenze(response.data.data);
    } catch (error) {
      setError('Errore caricamento giacenze');
    }
  };

  const caricaStatistiche = async () => {
    try {
      const response = await axios.get('/api/magazzino/valore');
      setStats(response.data.data);
    } catch (error) {
      setError('Errore caricamento statistiche');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.post('/api/magazzino/movimenti', nuovoMovimento);
      setSuccess('Movimento registrato con successo');
      setDialogOpen(false);
      resetForm();
      caricaDati();
    } catch (error) {
      setError(error.response?.data?.error || 'Errore registrazione movimento');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNuovoMovimento({
      tipo: 'carico',
      prodotto: { nome: '', categoria: '' },
      quantita: '',
      unita: 'kg',
      prezzoUnitario: '',
      fornitore: { nome: '' },
      documentoRiferimento: { tipo: '', numero: '', data: '' },
      lotto: '',
      dataScadenza: '',
      note: ''
    });
  };

  const getColorByQuantita = (quantitaAttuale, scortaMinima) => {
    if (quantitaAttuale <= 0) return 'error';
    if (quantitaAttuale < scortaMinima) return 'warning';
    return 'success';
  };

  const renderStatistiche = () => {
    if (!stats) return null;

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Valore Totale Magazzino
              </Typography>
              <Typography variant="h4">
                € {stats.valoreToTale?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Prodotti Sotto Scorta
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.prodottiSottoScorta?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Prodotti in Scadenza
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.prodottiInScadenza?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Movimenti Oggi
              </Typography>
              <Typography variant="h4">
                {movimenti.filter(m => 
                  format(new Date(m.dataMovimento), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                ).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">
            Gestione Magazzino
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Nuovo Movimento
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {renderStatistiche()}

        <Paper sx={{ width: '100%' }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)}>
            <Tab label="Giacenze" />
            <Tab label="Movimenti" />
            <Tab label="Analisi" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Prodotto</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell align="right">Quantità</TableCell>
                    <TableCell align="right">Valore Medio</TableCell>
                    <TableCell align="right">Valore Totale</TableCell>
                    <TableCell>Ultimo Movimento</TableCell>
                    <TableCell>Stato</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {giacenze.map((giacenza) => (
                    <TableRow key={giacenza._id}>
                      <TableCell>{giacenza.prodotto.nome}</TableCell>
                      <TableCell>{giacenza.prodotto.categoria}</TableCell>
                      <TableCell align="right">
                        {giacenza.quantitaAttuale} {giacenza.unita}
                      </TableCell>
                      <TableCell align="right">
                        € {giacenza.valoreMedio?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell align="right">
                        € {(giacenza.quantitaAttuale * giacenza.valoreMedio)?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        {giacenza.ultimoMovimento?.data && (
                          <Box>
                            <Typography variant="caption">
                              {format(new Date(giacenza.ultimoMovimento.data), 'dd/MM/yyyy')}
                            </Typography>
                            <br />
                            <Chip 
                              label={giacenza.ultimoMovimento.tipo}
                              size="small"
                              color={giacenza.ultimoMovimento.tipo === 'carico' ? 'success' : 'error'}
                            />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((giacenza.quantitaAttuale / giacenza.scorta.ottimale) * 100, 100)}
                          color={getColorByQuantita(giacenza.quantitaAttuale, giacenza.scorta.minima)}
                          sx={{ width: 60, height: 8 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Prodotto</TableCell>
                    <TableCell align="right">Quantità</TableCell>
                    <TableCell align="right">Prezzo Unit.</TableCell>
                    <TableCell align="right">Valore</TableCell>
                    <TableCell>Fornitore/Cliente</TableCell>
                    <TableCell>Documento</TableCell>
                    <TableCell>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimenti.map((movimento) => (
                    <TableRow key={movimento._id}>
                      <TableCell>
                        {format(new Date(movimento.dataMovimento), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={movimento.tipo}
                          color={movimento.tipo === 'carico' ? 'success' : movimento.tipo === 'scarico' ? 'error' : 'default'}
                          size="small"
                          icon={movimento.tipo === 'carico' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        />
                      </TableCell>
                      <TableCell>{movimento.prodotto.nome}</TableCell>
                      <TableCell align="right">
                        {movimento.quantita} {movimento.unita}
                      </TableCell>
                      <TableCell align="right">
                        € {movimento.prezzoUnitario?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell align="right">
                        € {movimento.valoreMovimento?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>{movimento.fornitore?.nome || '-'}</TableCell>
                      <TableCell>
                        {movimento.documentoRiferimento?.numero || '-'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Stampa">
                          <IconButton size="small">
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            {stats && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Valore per Categoria
                    </Typography>
                    {Object.entries(stats.perCategoria || {}).map(([categoria, valore]) => (
                      <Box key={categoria} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>{categoria}</Typography>
                          <Typography>€ {valore.toFixed(2)}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(valore / stats.valoreToTale) * 100}
                          sx={{ height: 10 }}
                        />
                      </Box>
                    ))}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom color="warning.main">
                      Prodotti Sotto Scorta
                    </Typography>
                    {stats.prodottiSottoScorta?.map((item, index) => (
                      <Alert 
                        key={index} 
                        severity="warning" 
                        sx={{ mb: 1 }}
                        icon={<WarningIcon />}
                      >
                        <Typography variant="subtitle2">
                          {item.prodotto}
                        </Typography>
                        <Typography variant="caption">
                          Attuale: {item.quantitaAttuale} | 
                          Minima: {item.scortaMinima} | 
                          Da ordinare: {item.daOrdinare}
                        </Typography>
                      </Alert>
                    ))}
                  </Paper>
                </Grid>
              </Grid>
            )}
          </TabPanel>
        </Paper>

        {/* Dialog Nuovo Movimento */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <form onSubmit={handleSubmit}>
            <DialogTitle>Nuovo Movimento Magazzino</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo Movimento</InputLabel>
                    <Select
                      value={nuovoMovimento.tipo}
                      onChange={(e) => setNuovoMovimento({...nuovoMovimento, tipo: e.target.value})}
                    >
                      <MenuItem value="carico">Carico</MenuItem>
                      <MenuItem value="scarico">Scarico</MenuItem>
                      <MenuItem value="rettifica">Rettifica</MenuItem>
                      <MenuItem value="inventario">Inventario</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Prodotto"
                    value={nuovoMovimento.prodotto.nome}
                    onChange={(e) => setNuovoMovimento({
                      ...nuovoMovimento,
                      prodotto: { ...nuovoMovimento.prodotto, nome: e.target.value }
                    })}
                    required
                  />
                </Grid>

                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Quantità"
                    type="number"
                    value={nuovoMovimento.quantita}
                    onChange={(e) => setNuovoMovimento({...nuovoMovimento, quantita: e.target.value})}
                    required
                  />
                </Grid>

                <Grid item xs={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Unità</InputLabel>
                    <Select
                      value={nuovoMovimento.unita}
                      onChange={(e) => setNuovoMovimento({...nuovoMovimento, unita: e.target.value})}
                    >
                      <MenuItem value="kg">Kg</MenuItem>
                      <MenuItem value="unita">Unità</MenuItem>
                      <MenuItem value="litri">Litri</MenuItem>
                      <MenuItem value="grammi">Grammi</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Prezzo Unitario"
                    type="number"
                    value={nuovoMovimento.prezzoUnitario}
                    onChange={(e) => setNuovoMovimento({...nuovoMovimento, prezzoUnitario: e.target.value})}
                    inputProps={{ step: "0.01" }}
                  />
                </Grid>

                {nuovoMovimento.tipo === 'carico' && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                       label="Fornitore"
                       value={nuovoMovimento.fornitore.nome}
                       onChange={(e) => setNuovoMovimento({
                         ...nuovoMovimento,
                         fornitore: { nome: e.target.value }
                       })}
                     />
                   </Grid>

                   <Grid item xs={12} md={6}>
                     <TextField
                       fullWidth
                       label="Numero Documento"
                       value={nuovoMovimento.documentoRiferimento.numero}
                       onChange={(e) => setNuovoMovimento({
                         ...nuovoMovimento,
                         documentoRiferimento: { 
                           ...nuovoMovimento.documentoRiferimento, 
                           numero: e.target.value 
                         }
                       })}
                     />
                   </Grid>

                   <Grid item xs={12} md={6}>
                     <TextField
                       fullWidth
                       label="Data Documento"
                       type="date"
                       value={nuovoMovimento.documentoRiferimento.data}
                       onChange={(e) => setNuovoMovimento({
                         ...nuovoMovimento,
                         documentoRiferimento: { 
                           ...nuovoMovimento.documentoRiferimento, 
                           data: e.target.value 
                         }
                       })}
                       InputLabelProps={{ shrink: true }}
                     />
                   </Grid>

                   <Grid item xs={12} md={6}>
                     <TextField
                       fullWidth
                       label="Lotto"
                       value={nuovoMovimento.lotto}
                       onChange={(e) => setNuovoMovimento({...nuovoMovimento, lotto: e.target.value})}
                     />
                   </Grid>

                   <Grid item xs={12} md={6}>
                     <TextField
                       fullWidth
                       label="Data Scadenza"
                       type="date"
                       value={nuovoMovimento.dataScadenza}
                       onChange={(e) => setNuovoMovimento({...nuovoMovimento, dataScadenza: e.target.value})}
                       InputLabelProps={{ shrink: true }}
                     />
                   </Grid>
                 </>
               )}

               <Grid item xs={12}>
                 <TextField
                   fullWidth
                   label="Note"
                   multiline
                   rows={3}
                   value={nuovoMovimento.note}
                   onChange={(e) => setNuovoMovimento({...nuovoMovimento, note: e.target.value})}
                 />
               </Grid>
             </Grid>
           </DialogContent>
           <DialogActions>
             <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
             <Button type="submit" variant="contained" disabled={loading}>
               Salva Movimento
             </Button>
           </DialogActions>
         </form>
       </Dialog>
     </Box>
   </Container>
 );
}