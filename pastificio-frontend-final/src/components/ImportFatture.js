// components/ImportFatture.js
// Componente per l'import delle fatture XML da Danea EasyFatt
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  AlertTitle,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Badge,
  Collapse,
  TextField
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalShipping as FornitoreIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

export default function ImportFatture() {
  // Stati
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Dati
  const [fattureAnalizzate, setFattureAnalizzate] = useState([]);
  const [ingredienti, setIngredienti] = useState([]);
  const [importazioni, setImportazioni] = useState([]);
  const [mapping, setMapping] = useState([]);
  const [statistiche, setStatistiche] = useState(null);
  
  // Dialog
  const [fatturaSelezionata, setFatturaSelezionata] = useState(null);
  const [dialogAnnulla, setDialogAnnulla] = useState(null);
  const [motivoAnnullamento, setMotivoAnnullamento] = useState('');
  
  // Espansione righe
  const [righeEspanse, setRigheEspanse] = useState({});

  // Token
  const getToken = () => localStorage.getItem('token');

  // Headers
  const getHeaders = () => ({
    'Authorization': `Bearer ${getToken()}`
  });

  // Carica dati iniziali
  useEffect(() => {
    caricaImportazioni();
    caricaMapping();
    caricaStatistiche();
  }, []);

  // ==================== API CALLS ====================

  const caricaImportazioni = async () => {
    try {
      const response = await fetch(`${API_URL}/import-fatture?limit=50`, {
        headers: getHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setImportazioni(data.data.importazioni);
      }
    } catch (error) {
      console.error('Errore caricamento importazioni:', error);
    }
  };

  const caricaMapping = async () => {
    try {
      const response = await fetch(`${API_URL}/import-fatture/mapping`, {
        headers: getHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setMapping(data.data.mapping);
      }
    } catch (error) {
      console.error('Errore caricamento mapping:', error);
    }
  };

  const caricaStatistiche = async () => {
    try {
      const response = await fetch(`${API_URL}/import-fatture/statistiche`, {
        headers: getHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setStatistiche(data.data);
      }
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    }
  };

  // ==================== DRAG & DROP ====================

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // ==================== UPLOAD & PARSING ====================

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Errore lettura file'));
      reader.readAsText(file);
    });
  };

  const handleFiles = async (files) => {
    setUploading(true);
    
    try {
      const xmlFiles = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.xml')) {
          try {
            const content = await readFileAsText(file);
            xmlFiles.push({
              name: file.name,
              content: content
            });
          } catch (err) {
            toast.warning(`Errore lettura ${file.name}`);
          }
        } else {
          toast.warning(`File ${file.name} ignorato (solo XML)`);
        }
      }
      
      if (xmlFiles.length === 0) {
        toast.error('Nessun file XML valido selezionato');
        setUploading(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/import-fatture/upload`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: xmlFiles })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFattureAnalizzate(data.data.risultati);
        setIngredienti(data.data.ingredienti);
        
        const analizzate = data.data.risultati.filter(r => r.stato === 'analizzato').length;
        const duplicati = data.data.risultati.filter(r => r.stato === 'duplicato').length;
        const errori = data.data.risultati.filter(r => r.stato === 'errore').length;
        
        if (analizzate > 0) {
          toast.success(`${analizzate} fattur${analizzate > 1 ? 'e' : 'a'} analizat${analizzate > 1 ? 'e' : 'a'}`);
        }
        if (duplicati > 0) {
          toast.info(`${duplicati} fattur${duplicati > 1 ? 'e' : 'a'} già importat${duplicati > 1 ? 'e' : 'a'}`);
        }
        if (errori > 0) {
          toast.error(`${errori} errori durante l'analisi`);
        }
      } else {
        toast.error(data.error || 'Errore durante l\'upload');
      }
    } catch (error) {
      console.error('Errore upload:', error);
      toast.error('Errore durante l\'upload dei file');
    } finally {
      setUploading(false);
    }
  };

  // ==================== GESTIONE MAPPING ====================

  const handleMappingChange = (fatturaIndex, rigaIndex, ingredienteId) => {
    setFattureAnalizzate(prev => {
      const updated = [...prev];
      const riga = updated[fatturaIndex].righe[rigaIndex];
      
      if (ingredienteId) {
        const ingrediente = ingredienti.find(i => i._id === ingredienteId);
        riga.ingredienteId = ingredienteId;
        riga.mapping = {
          ...riga.mapping,
          ingredienteId,
          ingredienteNome: ingrediente?.nome,
          categoria: ingrediente?.categoria,
          manuale: true
        };
      } else {
        delete riga.ingredienteId;
        if (riga.mapping) {
          riga.mapping.manuale = false;
        }
      }
      
      return updated;
    });
  };

  // ==================== CONFERMA IMPORT ====================

  const confermaImport = async (fatturaData) => {
    setLoading(true);
    
    try {
      // Prepara righe con mapping
      const righe = fatturaData.righe.map(riga => ({
        ...riga,
        ingredienteId: riga.ingredienteId || riga.mapping?.ingredienteId
      }));
      
      const payload = {
        fattura: {
          numero: fatturaData.fattura.numero,
          data: fatturaData.fattura.data,
          tipoDocumento: fatturaData.fattura.tipoDocumento,
          importoTotale: fatturaData.fattura.importoTotale,
          imponibile: fatturaData.fattura.imponibile,
          imposta: fatturaData.fattura.imposta,
          fornitore: fatturaData.fornitore,
          ddt: fatturaData.ddt
        },
        righe,
        fileInfo: fatturaData.fileInfo
      };
      
      const response = await fetch(`${API_URL}/import-fatture/conferma`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`✅ Importati ${data.data.statistiche.righeImportate} prodotti`);
        
        // Rimuovi dalla lista
        setFattureAnalizzate(prev => 
          prev.filter(f => f.fileInfo?.hash !== fatturaData.fileInfo?.hash)
        );
        
        // Ricarica dati
        caricaImportazioni();
        caricaStatistiche();
      } else {
        toast.error(data.error || 'Errore durante l\'import');
      }
    } catch (error) {
      console.error('Errore import:', error);
      toast.error('Errore durante l\'import');
    } finally {
      setLoading(false);
    }
  };

  // ==================== ANNULLA IMPORT ====================

  const annullaImport = async () => {
    if (!dialogAnnulla) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/import-fatture/${dialogAnnulla._id}`, {
        method: 'DELETE',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ motivo: motivoAnnullamento })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Importazione annullata. ${data.data.movimentiEliminati} movimenti eliminati.`);
        setDialogAnnulla(null);
        setMotivoAnnullamento('');
        caricaImportazioni();
        caricaStatistiche();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Errore durante l\'annullamento');
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER HELPERS ====================

  const getStatoColor = (stato) => {
    switch (stato) {
      case 'completato': return 'success';
      case 'parziale': return 'warning';
      case 'errore': return 'error';
      case 'annullato': return 'default';
      default: return 'info';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('it-IT');
  };

  // ==================== RENDER ====================

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReceiptIcon sx={{ fontSize: 40 }} />
        Import Fatture Danea
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Importa fatture XML esportate da Danea EasyFatt per aggiornare automaticamente il magazzino
      </Typography>

      {/* Statistiche Rapide */}
      {statistiche && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="primary">
                  {statistiche.perStato?.find(s => s._id === 'completato')?.count || 0}
                </Typography>
                <Typography variant="caption">Completate</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="warning.main">
                  {statistiche.perStato?.find(s => s._id === 'parziale')?.count || 0}
                </Typography>
                <Typography variant="caption">Parziali</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="success.main">
                  {statistiche.totaleMovimentiDaFatture || 0}
                </Typography>
                <Typography variant="caption">Movimenti Creati</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4">
                  {mapping.length}
                </Typography>
                <Typography variant="caption">Mapping Salvati</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          variant="fullWidth"
        >
          <Tab icon={<UploadIcon />} label="Upload" />
          <Tab icon={<HistoryIcon />} label="Storico" />
          <Tab icon={<SettingsIcon />} label="Mapping" />
        </Tabs>
      </Paper>

      {/* TAB 0: Upload */}
      {activeTab === 0 && (
        <Box>
          {/* Area Drag & Drop */}
          <Paper
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              p: 4,
              mb: 3,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: dragActive ? 'primary.main' : 'grey.300',
              backgroundColor: dragActive ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover'
              }
            }}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              multiple
              accept=".xml"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            
            {uploading ? (
              <Box>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography>Analisi in corso...</Typography>
              </Box>
            ) : (
              <Box>
                <UploadIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Trascina i file XML qui
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  oppure clicca per selezionare i file
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Accetta file XML da Danea EasyFatt
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Fatture Analizzate */}
          {fattureAnalizzate.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                📄 Fatture da Importare ({fattureAnalizzate.filter(f => f.stato === 'analizzato').length})
              </Typography>
              
              {fattureAnalizzate.map((fattura, fatturaIndex) => (
                <Card key={fatturaIndex} sx={{ mb: 2 }}>
                  <CardContent>
                    {/* Header Fattura */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FileIcon />
                          Fattura {fattura.fattura?.numero || fattura.file}
                          {fattura.stato === 'duplicato' && (
                            <Chip label="Già importata" size="small" color="warning" />
                          )}
                          {fattura.stato === 'errore' && (
                            <Chip label="Errore" size="small" color="error" />
                          )}
                        </Typography>
                        
                        {fattura.fornitore && (
                          <Typography variant="body2" color="textSecondary">
                            <FornitoreIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {fattura.fornitore.ragioneSociale || 
                             `${fattura.fornitore.nome} ${fattura.fornitore.cognome}`}
                            {!fattura.fornitore.esisteNelDb && (
                              <Chip label="Nuovo fornitore" size="small" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                        )}
                        
                        {fattura.fattura && (
                          <Typography variant="body2">
                            Data: {formatDate(fattura.fattura.data)} | 
                            Totale: <strong>{formatCurrency(fattura.fattura.importoTotale)}</strong>
                          </Typography>
                        )}
                      </Box>
                      
                      {fattura.stato === 'analizzato' && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => confermaImport(fattura)}
                          disabled={loading}
                          startIcon={<CheckIcon />}
                        >
                          Importa
                        </Button>
                      )}
                    </Box>
                    
                    {/* Messaggio errore/duplicato */}
                    {fattura.messaggio && (
                      <Alert severity={fattura.stato === 'errore' ? 'error' : 'info'} sx={{ mb: 2 }}>
                        {fattura.messaggio}
                      </Alert>
                    )}
                    
                    {/* Tabella Righe */}
                    {fattura.righe && fattura.righe.length > 0 && (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Descrizione Fattura</TableCell>
                              <TableCell align="right">Qtà</TableCell>
                              <TableCell align="right">Prezzo</TableCell>
                              <TableCell>Prodotto Magazzino</TableCell>
                              <TableCell align="center">Match</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {fattura.righe.map((riga, rigaIndex) => (
                              <TableRow key={rigaIndex}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {riga.descrizione}
                                  </Typography>
                                  {riga.codiceArticolo && (
                                    <Typography variant="caption" color="textSecondary">
                                      Cod: {riga.codiceArticolo}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  {riga.quantita} {riga.unitaMisura}
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(riga.prezzoUnitario)}
                                </TableCell>
                                <TableCell sx={{ minWidth: 200 }}>
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={riga.ingredienteId || riga.mapping?.ingredienteId || ''}
                                      onChange={(e) => handleMappingChange(fatturaIndex, rigaIndex, e.target.value)}
                                      displayEmpty
                                    >
                                      <MenuItem value="">
                                        <em>-- Seleziona --</em>
                                      </MenuItem>
                                      {ingredienti.map(ing => (
                                        <MenuItem key={ing._id} value={ing._id}>
                                          {ing.nome} ({ing.categoria})
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </TableCell>
                                <TableCell align="center">
                                  {riga.mapping?.trovato ? (
                                    <Tooltip title="Mapping esistente">
                                      <CheckIcon color="success" />
                                    </Tooltip>
                                  ) : riga.mapping?.suggerito ? (
                                    <Tooltip title={`Suggerito (${riga.mapping.score}%)`}>
                                      <Chip 
                                        label={`${riga.mapping.score}%`}
                                        size="small"
                                        color={getScoreColor(riga.mapping.score)}
                                      />
                                    </Tooltip>
                                  ) : (
                                    <Tooltip title="Nessun match trovato">
                                      <WarningIcon color="warning" />
                                    </Tooltip>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* TAB 1: Storico */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              📋 Storico Importazioni
            </Typography>
            <Button 
              startIcon={<RefreshIcon />}
              onClick={caricaImportazioni}
            >
              Aggiorna
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data Import</TableCell>
                  <TableCell>Fattura</TableCell>
                  <TableCell>Fornitore</TableCell>
                  <TableCell align="right">Importo</TableCell>
                  <TableCell align="center">Righe</TableCell>
                  <TableCell align="center">Stato</TableCell>
                  <TableCell align="center">Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {importazioni.map((imp) => (
                  <TableRow key={imp._id}>
                    <TableCell>
                      {formatDate(imp.dataImportazione)}
                    </TableCell>
                    <TableCell>
                      <strong>{imp.numero}</strong>/{imp.anno}
                      <br />
                      <Typography variant="caption">
                        del {formatDate(imp.data)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {imp.nomeFornitore || imp.fornitore?.ragioneSociale}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(imp.importoTotale)}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={`${imp.statistiche?.righeImportate || 0} importate / ${imp.statistiche?.totaleRighe || 0} totali`}>
                        <span>
                          {imp.statistiche?.righeImportate || 0}/{imp.statistiche?.totaleRighe || 0}
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={imp.stato}
                        size="small"
                        color={getStatoColor(imp.stato)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {imp.stato !== 'annullato' && (
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => setDialogAnnulla(imp)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {importazioni.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary" sx={{ py: 3 }}>
                        Nessuna importazione trovata
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 2: Mapping */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              🔗 Mapping Prodotti ({mapping.length})
            </Typography>
            <Button 
              startIcon={<RefreshIcon />}
              onClick={caricaMapping}
            >
              Aggiorna
            </Button>
          </Box>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            I mapping vengono creati automaticamente quando importi una fattura.
            Il sistema ricorda le associazioni per le prossime importazioni.
          </Alert>
          
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fornitore</TableCell>
                  <TableCell>Descrizione Fattura</TableCell>
                  <TableCell>→</TableCell>
                  <TableCell>Prodotto Magazzino</TableCell>
                  <TableCell align="center">Utilizzi</TableCell>
                  <TableCell align="center">Confermato</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mapping.map((m) => (
                  <TableRow key={m._id}>
                    <TableCell>
                      <Typography variant="body2">
                        {m.fornitore?.ragioneSociale || m.fornitore?.partitaIva}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300 }} noWrap>
                        {m.descrizioneFornitore}
                      </Typography>
                    </TableCell>
                    <TableCell>→</TableCell>
                    <TableCell>
                      <Chip 
                        label={m.prodottoMagazzino?.nome}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Badge badgeContent={m.utilizzi} color="primary" max={99}>
                        <InventoryIcon />
                      </Badge>
                    </TableCell>
                    <TableCell align="center">
                      {m.confermatoManualmente ? (
                        <CheckIcon color="success" />
                      ) : (
                        <Typography variant="caption" color="textSecondary">Auto</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {mapping.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary" sx={{ py: 3 }}>
                        Nessun mapping salvato. Importa una fattura per creare i primi mapping.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Dialog Annulla Import */}
      <Dialog open={!!dialogAnnulla} onClose={() => setDialogAnnulla(null)}>
        <DialogTitle>
          ⚠️ Annulla Importazione
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Stai per annullare l'importazione della fattura <strong>{dialogAnnulla?.numero}/{dialogAnnulla?.anno}</strong>.
          </Typography>
          <Typography color="error" gutterBottom>
            Tutti i movimenti di magazzino collegati verranno eliminati.
          </Typography>
          <TextField
            fullWidth
            label="Motivo annullamento (opzionale)"
            value={motivoAnnullamento}
            onChange={(e) => setMotivoAnnullamento(e.target.value)}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAnnulla(null)}>
            Annulla
          </Button>
          <Button 
            onClick={annullaImport}
            color="error"
            variant="contained"
            disabled={loading}
          >
            Conferma Annullamento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <LinearProgress sx={{ mb: 2, width: 200 }} />
            <Typography>Operazione in corso...</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
}