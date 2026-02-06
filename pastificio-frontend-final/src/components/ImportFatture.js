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
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Inventory as InventoryIcon,
  LinkOff as LinkOffIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const getHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`
});

export default function ImportFatture() {
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fattureAnalizzate, setFattureAnalizzate] = useState([]);
  const [ingredienti, setIngredienti] = useState([]);
  const [storico, setStorico] = useState([]);
  const [mapping, setMapping] = useState([]);
  const [statistiche, setStatistiche] = useState(null);
  const [expandedFattura, setExpandedFattura] = useState({});
  const [dialogAnnulla, setDialogAnnulla] = useState(null);
  const [motivoAnnullamento, setMotivoAnnullamento] = useState('');

  // ==================== CARICAMENTO DATI ====================

  useEffect(() => {
    caricaStorico();
    caricaMapping();
    caricaStatistiche();
  }, []);

  const caricaStorico = async () => {
    try {
      const response = await fetch(`${API_URL}/import-fatture?limit=50`, {
        headers: getHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setStorico(data.data.importazioni);
      }
    } catch (error) {
      console.error('Errore caricamento storico:', error);
    }
  };

  const caricaMapping = async () => {
    try {
      const response = await fetch(`${API_URL}/import-fatture/mapping?limit=100`, {
        headers: getHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setMapping(data.data.mappings);
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

  const handleFiles = async (files) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.xml')) {
          formData.append('fatture', file);
        } else {
          toast.warning(`File ${file.name} ignorato (solo XML)`);
        }
      }
      
      if (!formData.has('fatture')) {
        toast.error('Nessun file XML valido selezionato');
        setUploading(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/import-fatture/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFattureAnalizzate(data.data.risultati);
        setIngredienti(data.data.ingredienti);
        
        const analizzate = data.data.risultati.filter(r => r.stato === 'analizzato').length;
        const duplicati = data.data.risultati.filter(r => r.stato === 'duplicato').length;
        const errori = data.data.risultati.filter(r => r.stato === 'errore').length;
        
        if (analizzate > 0) {
          toast.success(`${analizzate} fattur${analizzate > 1 ? 'e' : 'a'} analizzat${analizzate > 1 ? 'e' : 'a'}`);
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
      
      const token = localStorage.getItem('token');
      console.log('Token per confermaImport:', token ? 'presente' : 'MANCANTE');
      
      const response = await fetch(`${API_URL}/import-fatture/conferma`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(
          `✅ Importata fattura ${fatturaData.fattura.numero}: ` +
          `${data.data.statistiche.righeImportate}/${data.data.statistiche.totaleRighe} righe, ` +
          `${data.data.movimentiCreati} movimenti creati`
        );
        
        // Rimuovi dalla lista analizzate
        setFattureAnalizzate(prev => prev.filter(f => f !== fatturaData));
        
        // Ricarica dati
        caricaStorico();
        caricaMapping();
        caricaStatistiche();
      } else {
        toast.error(data.error || 'Errore durante l\'import');
      }
    } catch (error) {
      console.error('Errore conferma import:', error);
      toast.error('Errore durante la conferma dell\'import');
    } finally {
      setLoading(false);
    }
  };

  // ==================== ANNULLA IMPORT ====================

  const annullaImportazione = async () => {
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
        toast.success(data.data.messaggio);
        setDialogAnnulla(null);
        setMotivoAnnullamento('');
        caricaStorico();
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

  // ==================== HELPER ====================

  const formatData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('it-IT');
  };

  const formatValuta = (importo) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(importo || 0);
  };

  const getStatoChip = (stato) => {
    const config = {
      completato: { color: 'success', label: 'Completato' },
      parziale: { color: 'warning', label: 'Parziale' },
      pendente: { color: 'info', label: 'Pendente' },
      errore: { color: 'error', label: 'Errore' },
      annullato: { color: 'default', label: 'Annullato' }
    };
    const c = config[stato] || { color: 'default', label: stato };
    return <Chip size="small" color={c.color} label={c.label} />;
  };

  // ==================== RENDER ====================

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        📄 Import Fatture XML
        <Chip label="Danea EasyFatt" size="small" variant="outlined" />
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

      {/* ========== TAB 0: Upload ========== */}
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">
                          {fattura.stato === 'duplicato' && '⚠️ '}
                          {fattura.stato === 'errore' && '❌ '}
                          {fattura.fornitore?.ragioneSociale || fattura.fornitore?.partitaIva || fattura.file}
                        </Typography>
                        {fattura.fattura && (
                          <Typography variant="body2" color="textSecondary">
                            Fattura n. {fattura.fattura.numero} del {formatData(fattura.fattura.data)} — 
                            Totale: {formatValuta(fattura.fattura.importoTotale)}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        {fattura.stato === 'analizzato' && (
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<CheckIcon />}
                            onClick={() => confermaImport(fattura)}
                            disabled={loading}
                          >
                            Importa
                          </Button>
                        )}
                      </Box>
                    </Box>

                    {/* Duplicato/Errore Alert */}
                    {fattura.stato === 'duplicato' && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        {fattura.messaggio}
                      </Alert>
                    )}
                    {fattura.stato === 'errore' && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {fattura.messaggio}
                      </Alert>
                    )}

                    {/* DDT */}
                    {fattura.ddt?.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                          DDT: {fattura.ddt.map(d => `${d.numero} (${formatData(d.data)})`).join(', ')}
                        </Typography>
                      </Box>
                    )}

                    {/* Tabella Righe */}
                    {fattura.righe && fattura.righe.length > 0 && (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>#</TableCell>
                              <TableCell>Descrizione Fattura</TableCell>
                              <TableCell align="right">Qtà</TableCell>
                              <TableCell>UM</TableCell>
                              <TableCell align="right">Prezzo</TableCell>
                              <TableCell align="right">Totale</TableCell>
                              <TableCell sx={{ minWidth: 200 }}>→ Prodotto Magazzino</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {fattura.righe.map((riga, rigaIndex) => (
                              <TableRow 
                                key={rigaIndex}
                                sx={{
                                  backgroundColor: riga.mapping?.trovato ? 'success.light' : 
                                                   riga.mapping?.suggerito ? 'warning.light' : 
                                                   'inherit',
                                  opacity: riga.mapping?.trovato ? 0.9 : 1
                                }}
                              >
                                <TableCell>{riga.numeroLinea}</TableCell>
                                <TableCell>
                                  <Typography variant="body2">{riga.descrizione}</Typography>
                                  {riga.codiceArticolo && (
                                    <Typography variant="caption" color="textSecondary">
                                      Cod: {riga.codiceArticolo}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">{riga.quantita}</TableCell>
                                <TableCell>{riga.unitaMisura}</TableCell>
                                <TableCell align="right">{formatValuta(riga.prezzoUnitario)}</TableCell>
                                <TableCell align="right">{formatValuta(riga.prezzoTotale)}</TableCell>
                                <TableCell>
                                  {riga.mapping?.trovato ? (
                                    <Tooltip title={`Match confermato (${riga.mapping.score}%)`}>
                                      <Chip
                                        icon={<LinkIcon />}
                                        label={riga.mapping.ingredienteNome}
                                        color="success"
                                        size="small"
                                      />
                                    </Tooltip>
                                  ) : (
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={riga.ingredienteId || riga.mapping?.ingredienteId || ''}
                                        onChange={(e) => handleMappingChange(fatturaIndex, rigaIndex, e.target.value)}
                                        displayEmpty
                                      >
                                        <MenuItem value="">
                                          <em>-- Ignora --</em>
                                        </MenuItem>
                                        {riga.mapping?.suggerito && (
                                          <MenuItem 
                                            value={riga.mapping.ingredienteId}
                                            sx={{ backgroundColor: 'warning.light' }}
                                          >
                                            ⭐ {riga.mapping.ingredienteNome} ({riga.mapping.score}%)
                                          </MenuItem>
                                        )}
                                        <Divider />
                                        {ingredienti.map(ing => (
                                          <MenuItem key={ing._id} value={ing._id}>
                                            {ing.nome} ({ing.categoria})
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
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

      {/* ========== TAB 1: Storico ========== */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">📋 Storico Importazioni</Typography>
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={caricaStorico}
              size="small"
            >
              Aggiorna
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data Import</TableCell>
                  <TableCell>Fornitore</TableCell>
                  <TableCell>N. Fattura</TableCell>
                  <TableCell>Data Fattura</TableCell>
                  <TableCell align="right">Importo</TableCell>
                  <TableCell align="center">Righe</TableCell>
                  <TableCell align="center">Stato</TableCell>
                  <TableCell align="center">Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {storico.map((imp) => (
                  <React.Fragment key={imp._id}>
                    <TableRow 
                      hover
                      onClick={() => setExpandedFattura(prev => ({
                        ...prev,
                        [imp._id]: !prev[imp._id]
                      }))}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{formatData(imp.dataImportazione)}</TableCell>
                      <TableCell>
                        {imp.nomeFornitore || imp.fornitore?.ragioneSociale || imp.fornitore?.partitaIva}
                      </TableCell>
                      <TableCell>{imp.numero}</TableCell>
                      <TableCell>{formatData(imp.data)}</TableCell>
                      <TableCell align="right">{formatValuta(imp.importoTotale)}</TableCell>
                      <TableCell align="center">
                        {imp.statistiche?.righeImportate || 0}/{imp.statistiche?.totaleRighe || 0}
                      </TableCell>
                      <TableCell align="center">{getStatoChip(imp.stato)}</TableCell>
                      <TableCell align="center">
                        {imp.stato !== 'annullato' && (
                          <Tooltip title="Annulla importazione">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDialogAnnulla(imp);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton size="small">
                          {expandedFattura[imp._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    
                    {/* Dettaglio Espanso */}
                    <TableRow>
                      <TableCell colSpan={8} sx={{ py: 0, border: expandedFattura[imp._id] ? undefined : 'none' }}>
                        <Collapse in={expandedFattura[imp._id]} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Dettaglio Righe:</Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Descrizione</TableCell>
                                  <TableCell align="right">Qtà</TableCell>
                                  <TableCell>UM</TableCell>
                                  <TableCell align="right">Prezzo</TableCell>
                                  <TableCell>Ingrediente</TableCell>
                                  <TableCell>Stato</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {imp.righe?.map((riga, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{riga.descrizione}</TableCell>
                                    <TableCell align="right">{riga.quantita}</TableCell>
                                    <TableCell>{riga.unitaMisura}</TableCell>
                                    <TableCell align="right">{formatValuta(riga.prezzoUnitario)}</TableCell>
                                    <TableCell>
                                      {riga.ingredienteNome || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {riga.importato ? (
                                        <Chip label="Importato" size="small" color="success" />
                                      ) : riga.errore ? (
                                        <Chip label="Errore" size="small" color="error" />
                                      ) : (
                                        <Chip label="Ignorato" size="small" />
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            
                            {imp.annullamento?.annullato && (
                              <Alert severity="warning" sx={{ mt: 2 }}>
                                Annullato il {formatData(imp.annullamento.dataAnnullamento)}
                                {imp.annullamento.motivo && ` - Motivo: ${imp.annullamento.motivo}`}
                              </Alert>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
                {storico.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="textSecondary" sx={{ py: 3 }}>
                        Nessuna importazione effettuata
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ========== TAB 2: Mapping ========== */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>⚙️ Mapping Prodotti Fornitore</Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Come funziona</AlertTitle>
            Quando importi una fattura, il sistema memorizza l'associazione tra la descrizione del prodotto 
            del fornitore e il prodotto nel tuo magazzino. 
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
        <DialogTitle>⚠️ Annulla Importazione</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Stai per annullare l'importazione della fattura <strong>{dialogAnnulla?.numero}</strong> di{' '}
            <strong>
              {dialogAnnulla?.nomeFornitore || dialogAnnulla?.fornitore?.ragioneSociale}
            </strong>.
          </Typography>
          <Typography variant="body2" color="error" gutterBottom>
            Verranno eliminati tutti i movimenti di magazzino creati da questa importazione.
          </Typography>
          <TextField
            label="Motivo annullamento (opzionale)"
            fullWidth
            multiline
            rows={2}
            value={motivoAnnullamento}
            onChange={(e) => setMotivoAnnullamento(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAnnulla(null)}>Annulla</Button>
          <Button 
            onClick={annullaImportazione} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            Conferma Annullamento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}