// frontend/src/components/Report/TemplateEditor.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';

const TemplateEditor = ({ template: initialTemplate, onSave, onPreview }) => {
  const [template, setTemplate] = useState({
    nome: '',
    descrizione: '',
    tipo: 'report',
    body: '',
    styles: '',
    variabili: [],
    ...initialTemplate
  });

  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  // Template di esempio
  const templateExamples = {
    report: `
<div class="report-header">
  <h1>Report {{tipo}}</h1>
  <p>Periodo: {{periodo.inizio}} - {{periodo.fine}}</p>
</div>

<div class="report-body">
  <div class="kpi-section">
    <div class="kpi-card">
      <h3>Totale Ordini</h3>
      <p class="kpi-value">{{totaleOrdini}}</p>
    </div>
    <div class="kpi-card">
      <h3>Valore Totale</h3>
      <p class="kpi-value">{{formatCurrency totaleValore}}</p>
    </div>
  </div>
  
  {{#if topProdotti}}
  <div class="products-section">
    <h2>Top Prodotti</h2>
    <table>
      <thead>
        <tr>
          <th>Prodotto</th>
          <th>Quantità</th>
          <th>Valore</th>
        </tr>
      </thead>
      <tbody>
        {{#each topProdotti}}
        <tr>
          <td>{{nome}}</td>
          <td>{{quantita}}</td>
          <td>{{formatCurrency valore}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
  {{/if}}
</div>`,
    ricevuta: `
<div class="receipt">
  <div class="receipt-header">
    <h2>Pastificio Nonna Claudia</h2>
    <p>Via Roma, 123 - Tel: 0123-456789</p>
  </div>
  
  <div class="receipt-info">
    <p><strong>Cliente:</strong> {{nomeCliente}}</p>
    <p><strong>Data Ritiro:</strong> {{formatDate dataRitiro}}</p>
    <p><strong>Ora:</strong> {{oraRitiro}}</p>
  </div>
  
  <div class="receipt-items">
    <h3>Prodotti Ordinati</h3>
    {{#each prodotti}}
    <div class="item">
      <span>{{prodotto}}</span>
      <span>{{quantita}} {{unita}}</span>
      <span>{{formatCurrency prezzo}}</span>
    </div>
    {{/each}}
  </div>
  
  <div class="receipt-total">
    <h3>Totale: {{formatCurrency totale}}</h3>
  </div>
</div>`,
    etichetta: `
<div class="label">
  <div class="label-header">
    <h3>{{prodotto}}</h3>
  </div>
  <div class="label-info">
    <p>Prezzo: {{formatCurrency prezzo}}</p>
    <p>Data: {{formatDate data}}</p>
  </div>
  <div class="barcode">
    |||| |||| |||| ||||
  </div>
</div>`
  };

  const defaultStyles = `
.report-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  border-bottom: 2px solid #333;
}

.report-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.kpi-section {
  display: flex;
  justify-content: space-around;
  margin: 30px 0;
}

.kpi-card {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: center;
  min-width: 150px;
}

.kpi-value {
  font-size: 24px;
  font-weight: bold;
  color: #27ae60;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.receipt {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ddd;
}

.receipt-header {
  text-align: center;
  border-bottom: 2px solid #333;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.receipt-items {
  margin: 20px 0;
}

.item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px dotted #ccc;
}

.receipt-total {
  text-align: right;
  margin-top: 20px;
  padding-top: 10px;
  border-top: 2px solid #333;
}

.label {
  width: 200px;
  padding: 10px;
  border: 1px solid #000;
  text-align: center;
}

.barcode {
  margin-top: 10px;
  font-family: monospace;
  font-size: 18px;
}

@media print {
  body {
    margin: 0;
    padding: 0;
  }
  
  .no-print {
    display: none;
  }
}`;

  useEffect(() => {
    if (initialTemplate) {
      setTemplate(initialTemplate);
    }
  }, [initialTemplate]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTemplateChange = (field, value) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value
    }));
    setSaved(false);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateTemplate = () => {
    const newErrors = {};
    
    if (!template.nome?.trim()) {
      newErrors.nome = 'Il nome è obbligatorio';
    }
    
    if (!template.body?.trim()) {
      newErrors.body = 'Il contenuto del template è obbligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateTemplate()) {
      onSave(template);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handlePreview = () => {
    if (validateTemplate()) {
      onPreview(template);
    }
  };

  const loadExample = () => {
    const example = templateExamples[template.tipo] || templateExamples.report;
    handleTemplateChange('body', example);
    handleTemplateChange('styles', defaultStyles);
  };

  const resetTemplate = () => {
    if (window.confirm('Sei sicuro di voler resettare il template?')) {
      setTemplate({
        nome: '',
        descrizione: '',
        tipo: 'report',
        body: '',
        styles: '',
        variabili: []
      });
      setErrors({});
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nome Template"
              value={template.nome}
              onChange={(e) => handleTemplateChange('nome', e.target.value)}
              error={!!errors.nome}
              helperText={errors.nome}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo Template</InputLabel>
              <Select
                value={template.tipo}
                onChange={(e) => handleTemplateChange('tipo', e.target.value)}
                label="Tipo Template"
              >
                <MenuItem value="report">Report</MenuItem>
                <MenuItem value="ricevuta">Ricevuta</MenuItem>
                <MenuItem value="etichetta">Etichetta</MenuItem>
                <MenuItem value="fattura">Fattura</MenuItem>
                <MenuItem value="produzione">Scheda Produzione</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descrizione"
              value={template.descrizione}
              onChange={(e) => handleTemplateChange('descrizione', e.target.value)}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CodeIcon />}
            onClick={loadExample}
            size="small"
          >
            Carica Esempio
          </Button>
          <Tooltip title="Reset Template">
            <IconButton onClick={resetTemplate} size="small">
              <ResetIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      <Paper sx={{ flexGrow: 1 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="HTML Template" icon={<CodeIcon />} iconPosition="start" />
          <Tab label="Stili CSS" icon={<DescriptionIcon />} iconPosition="start" />
          <Tab label="Variabili" icon={<PreviewIcon />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Usa la sintassi Handlebars per le variabili: {`{{nomeVariabile}}`}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={20}
                value={template.body}
                onChange={(e) => handleTemplateChange('body', e.target.value)}
                error={!!errors.body}
                helperText={errors.body}
                variant="outlined"
                sx={{ 
                  '& .MuiInputBase-input': { 
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  } 
                }}
                placeholder="Inserisci il template HTML..."
              />
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Definisci gli stili CSS per il template
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={20}
                value={template.styles}
                onChange={(e) => handleTemplateChange('styles', e.target.value)}
                variant="outlined"
                sx={{ 
                  '& .MuiInputBase-input': { 
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  } 
                }}
                placeholder="Inserisci gli stili CSS..."
              />
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Variabili Disponibili
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Variabili Generali:
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      • {`{{tipo}}`} - Tipo di report<br/>
                      • {`{{periodo.inizio}}`} - Data inizio periodo<br/>
                      • {`{{periodo.fine}}`} - Data fine periodo<br/>
                      • {`{{totaleOrdini}}`} - Numero totale ordini<br/>
                      • {`{{totaleValore}}`} - Valore totale<br/>
                      • {`{{clientiAttivi}}`} - Numero clienti attivi
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Helper Disponibili:
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      • {`{{formatCurrency valore}}`} - Formatta valuta<br/>
                      • {`{{formatDate data}}`} - Formatta data<br/>
                      • {`{{formatNumber numero}}`} - Formatta numero<br/>
                      • {`{{#if condizione}}`} - Condizionale<br/>
                      • {`{{#each lista}}`} - Ciclo su lista
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 2 }}>
                Le variabili disponibili dipendono dal tipo di template e dai dati passati.
                Usa l'anteprima per verificare il rendering.
              </Alert>
            </Box>
          )}
        </Box>

        <Divider />
        
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {saved && (
            <Alert severity="success" sx={{ flexGrow: 1, mr: 2 }}>
              Template salvato con successo!
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={handlePreview}
            >
              Anteprima
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              color="primary"
            >
              Salva Template
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default TemplateEditor;