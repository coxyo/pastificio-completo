// src/components/Clienti/ImportClienti.js
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Grid,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

const ImportClienti = ({ open, onClose, onImportComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [mapping, setMapping] = useState({});
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);

  const steps = ['Carica File', 'Verifica Dati', 'Mappatura Campi', 'Importazione'];

  const requiredFields = [
    { key: 'nome', label: 'Nome', required: true },
    { key: 'cognome', label: 'Cognome', required: false },
    { key: 'telefono', label: 'Telefono', required: false },
    { key: 'email', label: 'Email', required: false },
    { key: 'indirizzo', label: 'Indirizzo', required: false },
    { key: 'citta', label: 'Città', required: false },
    { key: 'cap', label: 'CAP', required: false },
    { key: 'piva', label: 'P.IVA', required: false },
    { key: 'codiceFiscale', label: 'Codice Fiscale', required: false },
    { key: 'note', label: 'Note', required: false },
  ];

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      readExcelFile(uploadedFile);
    }
  };

  const readExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
          setData(jsonData);
          setColumns(Object.keys(jsonData[0]));
          autoMapColumns(Object.keys(jsonData[0]));
          setActiveStep(1);
        } else {
          setErrors(['Il file è vuoto o non contiene dati validi']);
        }
      } catch (error) {
        setErrors(['Errore nella lettura del file: ' + error.message]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const autoMapColumns = (fileColumns) => {
    const newMapping = {};
    requiredFields.forEach(field => {
      const matchingColumn = fileColumns.find(col => 
        col.toLowerCase().includes(field.key.toLowerCase()) ||
        col.toLowerCase().includes(field.label.toLowerCase())
      );
      if (matchingColumn) {
        newMapping[field.key] = matchingColumn;
      }
    });
    setMapping(newMapping);
  };

  const validateData = () => {
    const validationErrors = [];
    const requiredFieldKeys = requiredFields.filter(f => f.required).map(f => f.key);
    
    // Verifica che i campi obbligatori siano mappati
    requiredFieldKeys.forEach(field => {
      if (!mapping[field]) {
        validationErrors.push(`Campo obbligatorio non mappato: ${field}`);
      }
    });

    // Verifica i dati
    data.forEach((row, index) => {
      requiredFieldKeys.forEach(field => {
        if (mapping[field] && !row[mapping[field]]) {
          validationErrors.push(`Riga ${index + 2}: ${field} mancante`);
        }
      });

      // Validazione email se presente
      if (mapping.email && row[mapping.email]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row[mapping.email])) {
          validationErrors.push(`Riga ${index + 2}: Email non valida`);
        }
      }

      // Validazione telefono se presente
      if (mapping.telefono && row[mapping.telefono]) {
        const phone = String(row[mapping.telefono]).replace(/\D/g, '');
        if (phone.length < 9) {
          validationErrors.push(`Riga ${index + 2}: Telefono non valido`);
        }
      }
    });

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleImport = async () => {
    if (!validateData()) {
      return;
    }

    setImporting(true);
    setActiveStep(3);

    // Prepara i dati per l'importazione
    const clientiDaImportare = data.map(row => {
      const cliente = {};
      Object.keys(mapping).forEach(field => {
        if (mapping[field] && row[mapping[field]]) {
          cliente[field] = row[mapping[field]];
        }
      });
      return cliente;
    });

    try {
      // Simula l'importazione (sostituire con chiamata API reale)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const results = {
        totale: clientiDaImportare.length,
        successo: clientiDaImportare.length - 2,
        duplicati: 1,
        errori: 1,
      };

      setImportResults(results);
      setImporting(false);
      
      if (onImportComplete) {
        onImportComplete(results);
      }
    } catch (error) {
      setErrors(['Errore durante l\'importazione: ' + error.message]);
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        Nome: 'Mario',
        Cognome: 'Rossi',
        Telefono: '1234567890',
        Email: 'mario.rossi@email.com',
        Indirizzo: 'Via Roma 1',
        Città: 'Milano',
        CAP: '20100',
        'P.IVA': '12345678901',
        'Codice Fiscale': 'RSSMRA80A01H501Z',
        Note: 'Cliente abituale',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Clienti');
    XLSX.writeFile(wb, 'template_clienti.xlsx');
  };

  const handleReset = () => {
    setActiveStep(0);
    setFile(null);
    setData([]);
    setColumns([]);
    setMapping({});
    setErrors([]);
    setImportResults(null);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Box 
              sx={{
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: 'background.paper',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Carica file Excel
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Clicca per selezionare o trascina il file qui
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Formati supportati: .xlsx, .xls
              </Typography>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                startIcon={<DownloadIcon />}
                onClick={downloadTemplate}
                variant="outlined"
              >
                Scarica Template
              </Button>
            </Box>

            {file && (
              <Alert severity="success" sx={{ mt: 2 }}>
                File caricato: {file.name}
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Trovati {data.length} record nel file
            </Alert>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Riga</TableCell>
                    {columns.slice(0, 5).map(col => (
                      <TableCell key={col}>{col}</TableCell>
                    ))}
                    {columns.length > 5 && (
                      <TableCell>...</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 2}</TableCell>
                      {columns.slice(0, 5).map(col => (
                        <TableCell key={col}>{row[col]}</TableCell>
                      ))}
                      {columns.length > 5 && (
                        <TableCell>...</TableCell>
                      )}
                    </TableRow>
                  ))}
                  {data.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        ... e altri {data.length - 10} record
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                  />
                }
                label="Salta record duplicati"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                  />
                }
                label="Aggiorna clienti esistenti"
              />
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Mappa i campi del file Excel con i campi del sistema
            </Alert>

            <Grid container spacing={2}>
              {requiredFields.map(field => (
                <Grid item xs={12} sm={6} key={field.key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 120 }}>
                      {field.label}
                      {field.required && ' *'}
                    </Typography>
                    <select
                      value={mapping[field.key] || ''}
                      onChange={(e) => setMapping({
                        ...mapping,
                        [field.key]: e.target.value,
                      })}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                      }}
                    >
                      <option value="">-- Non mappato --</option>
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {errors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Errori di validazione:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {errors.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {errors.length > 5 && (
                    <li>... e altri {errors.length - 5} errori</li>
                  )}
                </ul>
              </Alert>
            )}
          </Box>
        );

      case 3:
        return (
          <Box>
            {importing && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Importazione in corso...
                </Typography>
                <LinearProgress sx={{ mt: 2 }} />
              </Box>
            )}

            {importResults && (
              <Box>
                <Alert 
                  severity={importResults.errori > 0 ? 'warning' : 'success'}
                  sx={{ mb: 3 }}
                >
                  Importazione completata!
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="h4" color="primary">
                        {importResults.totale}
                      </Typography>
                      <Typography variant="body2">
                        Record Totali
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="h4" color="success.main">
                        {importResults.successo}
                      </Typography>
                      <Typography variant="body2">
                        Importati
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                      <Typography variant="h4" color="warning.main">
                        {importResults.duplicati}
                      </Typography>
                      <Typography variant="body2">
                        Duplicati
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                      <Typography variant="h4" color="error.main">
                        {importResults.errori}
                      </Typography>
                      <Typography variant="body2">
                        Errori
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Importa Clienti da Excel
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        {activeStep > 0 && activeStep < 3 && (
          <Button onClick={() => setActiveStep(activeStep - 1)}>
            Indietro
          </Button>
        )}
        
        {importResults && (
          <Button onClick={handleReset}>
            Nuova Importazione
          </Button>
        )}

        <Button onClick={onClose}>
          {importResults ? 'Chiudi' : 'Annulla'}
        </Button>

        {activeStep === 1 && (
          <Button 
            onClick={() => setActiveStep(2)} 
            variant="contained"
          >
            Procedi
          </Button>
        )}

        {activeStep === 2 && (
          <Button 
            onClick={handleImport} 
            variant="contained"
            disabled={errors.length > 0}
          >
            Importa
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportClienti;