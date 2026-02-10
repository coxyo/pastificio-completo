// components/ImportFatture.js
// Componente per l'import delle fatture XML da Danea EasyFatt
// VERSIONE PULITA - Bottone Sfoglia File + Rintracciabilità HACCP
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  Collapse,
  TextField
} from '@mui/material';
import {
  FolderOpen as FolderIcon,
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
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export default function ImportFatture() {
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fattureAnalizzate, setFattureAnalizzate] = useState([]);
  const [ingredienti, setIngredienti] = useState([]);
  const [storico, setStorico] = useState([]);
  const [mapping, setMapping] = useState([]);
  const [expandedFattura, setExpandedFattura] = useState({});
  const [dialogAnnulla, setDialogAnnulla] = useState(null);
  const [motivoAnnullamento, setMotivoAnnullamento] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const fileInputRef = useRef(null);

  // ==================== CARICAMENTO DATI ====================

  useEffect(() => {
    caricaStorico();
    caricaMapping();
  }, []);

  const caricaStorico = async () => {
    try {
      const response = await fetch(`${API_URL}/import-fatture?limit=50`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setStorico(data.data.importazioni || []);
      }
    } catch (error) {
      console.error('Errore caricamento storico:', error);
    }
  };

  const caricaMapping = async () => {
    try {
      const response = await fetch(`${API_URL}/import-fatture/mapping`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setMapping(data.data.mappings || []);
      }
    } catch (error) {
      console.error('Errore caricamento mapping:', error);
    }
  };

  // ==================== GESTIONE FILE ====================

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const xmlFiles = files.filter(f => f.name.toLowerCase().endsWith('.xml'));
    
    if (xmlFiles.length === 0) {
      toast.error('Seleziona almeno un file XML');
      return;
    }
    
    if (xmlFiles.length < files.length) {
      toast.warning(`${files.length - xmlFiles.length} file non XML ignorati`);
    }
    
    setSelectedFiles(xmlFiles);
    toast.info(`${xmlFiles.length} file XML selezionati`);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Nessun file selezionato');
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('fatture', file);
      });
      
      const response = await fetch(`${API_URL}/import-fatture/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Aggiungi campi editabili per lotto e scadenza
        const risultatiConCampiEditabili = data.data.risultati.map(fattura => ({
          ...fattura,
          righe: (fattura.righe || []).map(riga => ({
            ...riga,
            lottoFornitoreEdit: riga.lottoFornitore || '',
            dataScadenzaEdit: riga.dataScadenza ? new Date(riga.dataScadenza).toISOString().split('T')[0] : ''
          }))
        }));
        
        setFattureAnalizzate(risultatiConCampiEditabili);
        setIngredienti(data.data.ingredienti || []);
        
        const analizzate = data.data.risultati.filter(r => r.stato === 'analizzato').length;
        const duplicati = data.data.risultati.filter(r => r.stato === 'duplicato').length;
        const errori = data.data.risultati.filter(r => r.stato === 'errore').length;
        
        if (analizzate > 0) {
          toast.success(`${analizzate} fattura/e pronte per l'import`);
        }
        if (duplicati > 0) {
          toast.warning(`${duplicati} fattura/e già importate in precedenza`);
        }
        if (errori > 0) {
          toast.error(`${errori} errori durante l'analisi`);
        }
        
        // Reset file selezionati
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast.error(data.error || 'Errore durante l\'upload');
      }
    } catch (error) {
      console.error('Errore upload:', error);
      toast.error('Errore di connessione durante l\'upload');
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

  // Handler per modifica lotto
  const handleLottoChange = (fatturaIndex, rigaIndex, value) => {
    setFattureAnalizzate(prev => {
      const updated = [...prev];
      updated[fatturaIndex].righe[rigaIndex].lottoFornitoreEdit = value;
      return updated;
    });
  };

  // Handler per modifica scadenza
  const handleScadenzaChange = (fatturaIndex, rigaIndex, value) => {
    setFattureAnalizzate(prev => {
      const updated = [...prev];
      updated[fatturaIndex].righe[rigaIndex].dataScadenzaEdit = value;
      return updated;
    });
  };

  // ==================== CONFERMA IMPORT ====================

  const confermaImport = async (fatturaData) => {
    setLoading(true);
    
    try {
      // Prepara righe con mapping, lotto e scadenza
      const righe = fatturaData.righe.map(riga => ({
        ...riga,
        ingredienteId: riga.ingredienteId || riga.mapping?.ingredienteId,
        lottoFornitore: riga.lottoFornitoreEdit || riga.lottoFornitore || '',
        dataScadenza: riga.dataScadenzaEdit || riga.dataScadenza || null
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
          documento: fatturaData.fattura
        },
        fornitore: fatturaData.fornitore,
        righe,
        ddt: fatturaData.ddt,
        fileInfo: fatturaData.fileInfo
      };
      
      const response = await fetch(`${API_URL}/import-fatture/conferma`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Fattura ${fatturaData.fattura.numero} importata con successo!`);
        
        // Rimuovi fattura dalla lista
        setFattureAnalizzate(prev => prev.filter(f => f !== fatturaData));
        
        // Ricarica storico
        caricaStorico();
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

  // ==================== IGNORA FATTURA ====================

  const ignoraFattura = async (fatturaData) => {
    setLoading(true);
    
    try {
      const payload = {
        fattura: {
          numero: fatturaData.fattura.numero,
          data: fatturaData.fattura.data,
          tipoDocumento: fatturaData.fattura.tipoDocumento,
          importoTotale: fatturaData.fattura.importoTotale,
          fornitore: fatturaData.fornitore
        },
        fornitore: fatturaData.fornitore,
        fileInfo: fatturaData.fileInfo,
        motivo: 'Fattura non contiene ingredienti'
      };
      
      const response = await fetch(`${API_URL}/import-fatture/ignora`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.info(`Fattura ${fatturaData.fattura.numero} ignorata`);
        
        // Rimuovi fattura dalla lista
        setFattureAnalizzate(prev => prev.filter(f => f !== fatturaData));
        
        // Ricarica storico
        caricaStorico();
      } else {
        toast.error(data.error || 'Errore durante l\'operazione');
      }
    } catch (error) {
      console.error('Errore ignora fattura:', error);
      toast.error('Errore durante l\'operazione');
    } finally {
      setLoading(false);
    }
  };

  // ==================== ANNULLA IMPORTAZIONE ====================

  const annullaImportazione = async () => {
    if (!dialogAnnulla) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/import-fatture/${dialogAnnulla._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ motivo: motivoAnnullamento })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Importazione annullata');
        setDialogAnnulla(null);
        setMotivoAnnullamento('');
        caricaStorico();
      } else {
        toast.error(data.error || 'Errore durante l\'annullamento');
      }
    } catch (error) {
      console.error('Errore annullamento:', error);
      toast.error('Errore durante l\'annullamento');
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPERS ====================

  const formatData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('it-IT');
  };

  const formatValuta = (valore) => {
    if (valore === undefined || valore === null) return '-';
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(valore);
  };

  const getStatoChip = (stato) => {
    const config = {
      'analizzato': { color: 'info', label: 'analizzato' },
      'importato': { color: 'success', label: 'Importato' },
      'importato_parziale': { color: 'warning', label: 'Parziale' },
      'duplicato': { color: 'default', label: 'Duplicato' },
      'annullato': { color: 'error', label: 'Annullato' },
      'errore': { color: 'error', label: 'Errore' }
    };
    const c = config[stato] || { color: 'default', label: stato };
    return <Chip size="small" color={c.color} label={c.label} />;
  };

  // ==================== RENDER ====================

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FileIcon color="primary" />
        Import Fatture
      </Typography>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          variant="fullWidth"
        >
          <Tab icon={<UploadIcon />} label="UPLOAD" />
          <Tab icon={<HistoryIcon />} label="STORICO" />
          <Tab icon={<SettingsIcon />} label="MAPPING" />
        </Tabs>
      </Paper>

      {/* ========== TAB 0: Upload ========== */}
      {activeTab === 0 && (
        <Box>
          {/* Area Selezione File */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              📁 Seleziona Fatture XML
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xml"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-input"
              />
              
              <Button
                variant="contained"
                size="large"
                startIcon={<FolderIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                sx={{ minWidth: 200 }}
              >
                Sfoglia File...
              </Button>
              
              {selectedFiles.length > 0 && (
                <>
                  <Chip 
                    label={`${selectedFiles.length} file selezionati`}
                    color="primary"
                    variant="outlined"
                  />
                  
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<UploadIcon />}
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    Analizza Fatture
                  </Button>
                </>
              )}
            </Box>
            
            {/* Lista file selezionati */}
            {selectedFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  File selezionati:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedFiles.map((file, idx) => (
                    <Chip
                      key={idx}
                      icon={<FileIcon />}
                      label={file.name}
                      size="small"
                      onDelete={() => {
                        setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Analisi fatture in corso...
                </Typography>
              </Box>
            )}
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Seleziona i file XML delle fatture elettroniche esportate da Danea EasyFatt.
              Puoi selezionare più file contemporaneamente.
            </Alert>
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
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {fattura.stato === 'analizzato' && (
                          <>
                            <Button
                              variant="outlined"
                              color="warning"
                              startIcon={<CloseIcon />}
                              onClick={() => ignoraFattura(fattura)}
                              disabled={loading}
                            >
                              Ignora
                            </Button>
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={<CheckIcon />}
                              onClick={() => confermaImport(fattura)}
                              disabled={loading}
                            >
                              Importa
                            </Button>
                          </>
                        )}
                      </Box>
                    </Box>

                    {/* Alert Duplicato/Errore */}
                    {fattura.stato === 'duplicato' && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <strong>Fattura già importata:</strong> {fattura.messaggio}
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
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                              <TableCell>#</TableCell>
                              <TableCell>Descrizione Fattura</TableCell>
                              <TableCell align="right">Qtà</TableCell>
                              <TableCell>UM</TableCell>
                              <TableCell align="right">Prezzo</TableCell>
                              <TableCell align="right">Totale</TableCell>
                              <TableCell>Lotto</TableCell>
                              <TableCell>Scadenza</TableCell>
                              <TableCell sx={{ minWidth: 200 }}>→ Prodotto Magazzino</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {fattura.righe.map((riga, rigaIndex) => (
                              <TableRow 
                                key={rigaIndex}
                                sx={{
                                  backgroundColor: riga.mapping?.trovato ? 'rgba(76, 175, 80, 0.1)' : 
                                                   riga.mapping?.suggerito ? 'rgba(255, 152, 0, 0.1)' : 
                                                   'inherit'
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
                                  <TextField
                                    size="small"
                                    placeholder="Lotto"
                                    value={riga.lottoFornitoreEdit || ''}
                                    onChange={(e) => handleLottoChange(fatturaIndex, rigaIndex, e.target.value)}
                                    sx={{ width: 100 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="date"
                                    value={riga.dataScadenzaEdit || ''}
                                    onChange={(e) => handleScadenzaChange(fatturaIndex, rigaIndex, e.target.value)}
                                    sx={{ width: 130 }}
                                    InputLabelProps={{ shrink: true }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={riga.ingredienteId || riga.mapping?.ingredienteId || ''}
                                      onChange={(e) => handleMappingChange(fatturaIndex, rigaIndex, e.target.value)}
                                      displayEmpty
                                    >
                                      <MenuItem value="">
                                        <em>-- Ignora --</em>
                                      </MenuItem>
                                      {ingredienti.map(ing => (
                                        <MenuItem key={ing._id} value={ing._id}>
                                          {ing.nome} ({ing.categoria})
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  {riga.mapping?.trovato && (
                                    <Chip size="small" color="success" label="Mappato" sx={{ ml: 1 }} />
                                  )}
                                  {riga.mapping?.suggerito && !riga.mapping?.trovato && (
                                    <Chip size="small" color="warning" label="Suggerito" sx={{ ml: 1 }} />
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
            <Typography variant="h6">📜 Storico Importazioni</Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={caricaStorico}
            >
              Aggiorna
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white' }}>Data Import</TableCell>
                  <TableCell sx={{ color: 'white' }}>Fornitore</TableCell>
                  <TableCell sx={{ color: 'white' }}>N. Fattura</TableCell>
                  <TableCell sx={{ color: 'white' }}>Data Fattura</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Importo</TableCell>
                  <TableCell sx={{ color: 'white' }}>Righe</TableCell>
                  <TableCell sx={{ color: 'white' }}>Stato</TableCell>
                  <TableCell sx={{ color: 'white' }}>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {storico.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Nessuna importazione trovata
                    </TableCell>
                  </TableRow>
                ) : (
                  storico.map((imp, idx) => (
                    <React.Fragment key={imp._id || idx}>
                      <TableRow 
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setExpandedFattura(prev => ({
                          ...prev,
                          [imp._id]: !prev[imp._id]
                        }))}
                      >
                        <TableCell>{formatData(imp.dataImportazione || imp.createdAt)}</TableCell>
                        <TableCell>{imp.fornitore?.ragioneSociale || '-'}</TableCell>
                        <TableCell>{imp.fattura?.numero || '-'}</TableCell>
                        <TableCell>{formatData(imp.fattura?.data)}</TableCell>
                        <TableCell align="right">{formatValuta(imp.totali?.totaleDocumento)}</TableCell>
                        <TableCell>
                          {imp.statistiche?.righeImportate || 0}/{imp.statistiche?.totaleRighe || 0}
                        </TableCell>
                        <TableCell>{getStatoChip(imp.stato)}</TableCell>
                        <TableCell>
                          {imp.stato !== 'annullato' && (
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
                          )}
                          <IconButton size="small">
                            {expandedFattura[imp._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      
                      {/* Dettaglio righe espanso */}
                      <TableRow>
                        <TableCell colSpan={8} sx={{ p: 0 }}>
                          <Collapse in={expandedFattura[imp._id]}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Dettaglio Righe:
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Descrizione</TableCell>
                                    <TableCell>Qtà</TableCell>
                                    <TableCell>UM</TableCell>
                                    <TableCell>Prezzo</TableCell>
                                    <TableCell>Ingrediente</TableCell>
                                    <TableCell>Lotto</TableCell>
                                    <TableCell>Scadenza</TableCell>
                                    <TableCell>Stato</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(imp.righe || []).map((riga, rIdx) => (
                                    <TableRow key={rIdx}>
                                      <TableCell>{riga.descrizione}</TableCell>
                                      <TableCell>{riga.quantita}</TableCell>
                                      <TableCell>{riga.unitaMisura}</TableCell>
                                      <TableCell>{formatValuta(riga.prezzoUnitario)}</TableCell>
                                      <TableCell>{riga.ingredienteAbbinato?.nome || '-'}</TableCell>
                                      <TableCell>{riga.lottoFornitore || '-'}</TableCell>
                                      <TableCell>{riga.dataScadenza ? formatData(riga.dataScadenza) : '-'}</TableCell>
                                      <TableCell>
                                        <Chip 
                                          size="small" 
                                          color={riga.stato === 'importato' ? 'success' : riga.stato === 'ignorato' ? 'default' : 'error'}
                                          label={riga.stato || 'N/D'}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ========== TAB 2: Mapping ========== */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            ⚙️ Mapping Prodotti Fornitore
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Questi mapping vengono creati automaticamente quando importi le fatture.
            Permettono di riconoscere automaticamente i prodotti nelle fatture successive.
          </Alert>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'secondary.main' }}>
                  <TableCell sx={{ color: 'white' }}>Fornitore</TableCell>
                  <TableCell sx={{ color: 'white' }}>Descrizione Fornitore</TableCell>
                  <TableCell sx={{ color: 'white' }}>→ Ingrediente</TableCell>
                  <TableCell sx={{ color: 'white' }}>Categoria</TableCell>
                  <TableCell sx={{ color: 'white' }}>Utilizzi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mapping.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nessun mapping configurato
                    </TableCell>
                  </TableRow>
                ) : (
                  mapping.map((m, idx) => (
                    <TableRow key={m._id || idx}>
                      <TableCell>{m.fornitore?.ragioneSociale || '-'}</TableCell>
                      <TableCell>{m.descrizioneFornitore}</TableCell>
                      <TableCell>
                        <strong>{m.prodottoMagazzino?.nome || '-'}</strong>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={m.prodottoMagazzino?.categoria || '-'} />
                      </TableCell>
                      <TableCell>{m.utilizzi || 0}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Dialog Annulla Importazione */}
      <Dialog open={!!dialogAnnulla} onClose={() => setDialogAnnulla(null)}>
        <DialogTitle>Annulla Importazione</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Sei sicuro di voler annullare l'importazione della fattura{' '}
            <strong>{dialogAnnulla?.fattura?.numero}</strong> di{' '}
            <strong>{dialogAnnulla?.fornitore?.ragioneSociale}</strong>?
          </Typography>
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            Questa azione eliminerà tutti i movimenti di magazzino e i lotti creati.
          </Typography>
          <TextField
            fullWidth
            label="Motivo annullamento"
            value={motivoAnnullamento}
            onChange={(e) => setMotivoAnnullamento(e.target.value)}
            sx={{ mt: 2 }}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAnnulla(null)}>
            Annulla
          </Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={annullaImportazione}
            disabled={loading}
          >
            Conferma Annullamento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}