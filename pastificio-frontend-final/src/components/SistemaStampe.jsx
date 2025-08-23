import React, { useState } from 'react';
import {
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Button, 
  TextField, 
  MenuItem, 
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  Print as PrintIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

// Demo templates data
const demoTemplates = [
  { id: 1, name: 'Fattura Standard', type: 'fattura', active: true, lastModified: '2024-02-15' },
  { id: 2, name: 'Ordine Dettagliato', type: 'ordine', active: true, lastModified: '2024-02-20' },
  { id: 3, name: 'Etichette Prodotti', type: 'etichetta', active: false, lastModified: '2024-01-10' },
  { id: 4, name: 'Resoconto Giornaliero', type: 'report', active: true, lastModified: '2024-03-01' },
  { id: 5, name: 'Documento di Trasporto', type: 'ddt', active: true, lastModified: '2024-02-25' },
];

// Example template content
const exampleTemplateContent = `
<div class="template-content">
  <div class="header">
    <h1>{{company_name}}</h1>
    <p>{{company_address}}</p>
    <p>P.IVA: {{company_vat}}</p>
  </div>
  
  <div class="customer-details">
    <h2>Cliente:</h2>
    <p>{{customer_name}}</p>
    <p>{{customer_address}}</p>
    <p>{{customer_vat}}</p>
  </div>
  
  <div class="order-details">
    <h2>Dettagli Ordine #{{order_number}}</h2>
    <p>Data: {{order_date}}</p>
    <p>Data Ritiro: {{pickup_date}}</p>
  </div>
  
  <table class="products-table">
    <thead>
      <tr>
        <th>Prodotto</th>
        <th>Quantità</th>
        <th>Prezzo</th>
        <th>Totale</th>
      </tr>
    </thead>
    <tbody>
      {{#each products}}
        <tr>
          <td>{{name}}</td>
          <td>{{quantity}} {{unit}}</td>
          <td>€{{price}}</td>
          <td>€{{total}}</td>
        </tr>
      {{/each}}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3">Totale:</td>
        <td>€{{order_total}}</td>
      </tr>
    </tfoot>
  </table>
  
  <div class="footer">
    <p>Grazie per il vostro ordine!</p>
    <p>{{company_name}} - Tel: {{company_phone}} - Email: {{company_email}}</p>
  </div>
</div>
`;

const SistemaStampe = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [templates, setTemplates] = useState(demoTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateContent, setTemplateContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState({
    name: '',
    type: 'ordine',
    active: true,
    content: '',
    paperSize: 'a4',
    orientation: 'portrait'
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    // In a real app, fetch the template content from the server
    setTemplateContent(exampleTemplateContent);
  };
  
  const handleCreateNew = () => {
    setIsEditing(true);
    setSelectedTemplate(null);
    setEditingTemplate({
      name: 'Nuovo Template',
      type: 'ordine',
      active: true,
      content: exampleTemplateContent,
      paperSize: 'a4',
      orientation: 'portrait'
    });
  };
  
  const handleEditTemplate = () => {
    if (!selectedTemplate) return;
    
    setIsEditing(true);
    setEditingTemplate({
      ...selectedTemplate,
      content: templateContent,
      paperSize: 'a4', // These would be fetched from the actual template
      orientation: 'portrait'
    });
  };
  
  const handleSaveTemplate = () => {
    if (isEditing) {
      if (selectedTemplate) {
        // Update existing template
        setTemplates(templates.map(t => 
          t.id === selectedTemplate.id 
            ? {...editingTemplate, id: t.id, lastModified: new Date().toISOString().slice(0, 10)} 
            : t
        ));
        setSelectedTemplate({
          ...editingTemplate,
          id: selectedTemplate.id,
          lastModified: new Date().toISOString().slice(0, 10)
        });
      } else {
        // Create new template
        const newTemplate = {
          ...editingTemplate,
          id: Math.max(...templates.map(t => t.id)) + 1,
          lastModified: new Date().toISOString().slice(0, 10)
        };
        setTemplates([...templates, newTemplate]);
        setSelectedTemplate(newTemplate);
      }
      setTemplateContent(editingTemplate.content);
      setIsEditing(false);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedTemplate) {
      setEditingTemplate({
        ...selectedTemplate,
        content: templateContent
      });
    }
  };
  
  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (templateToDelete) {
      setTemplates(templates.filter(t => t.id !== templateToDelete.id));
      if (selectedTemplate && selectedTemplate.id === templateToDelete.id) {
        setSelectedTemplate(null);
        setTemplateContent('');
      }
    }
    setDeleteDialogOpen(false);
  };
  
  const handlePreview = () => {
    setPreviewDialogOpen(true);
  };
  
  const handlePrint = () => {
    // In a real app, this would generate a PDF and trigger the print dialog
    alert("Funzionalità di stampa non implementata in questa demo");
  };
  
  return (
    <div className="p-6">
      <Typography variant="h4" component="h1" gutterBottom>
        Sistema di Stampe Personalizzate
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Gestisci i template per stampe di documenti e report
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="template tabs">
          <Tab label="Templates" />
          <Tab label="Editor" disabled={!selectedTemplate && !isEditing} />
          <Tab label="Anteprima" disabled={!selectedTemplate && !isEditing} />
        </Tabs>
      </Box>
      
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Template Disponibili</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
            >
              Nuovo Template
            </Button>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <TextField
              select
              label="Filtra per tipo"
              variant="outlined"
              size="small"
              value="all"
              sx={{ width: 200, mr: 2 }}
            >
              <MenuItem value="all">Tutti i tipi</MenuItem>
              <MenuItem value="ordine">Ordine</MenuItem>
              <MenuItem value="fattura">Fattura</MenuItem>
              <MenuItem value="report">Report</MenuItem>
              <MenuItem value="etichetta">Etichetta</MenuItem>
              <MenuItem value="ddt">DDT</MenuItem>
            </TextField>
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Solo attivi"
            />
          </Box>
          
          <Paper sx={{ mb: 3 }}>
            <List>
              {templates.map((template) => (
                <React.Fragment key={template.id}>
                  <ListItem
                    button
                    selected={selectedTemplate && selectedTemplate.id === template.id}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <ListItemText
                      primary={template.name}
                      secondary={`Tipo: ${template.type} | Ultima modifica: ${template.lastModified}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="edit" 
                        onClick={() => {
                          handleSelectTemplate(template);
                          handleEditTemplate();
                        }}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={() => handleDeleteClick(template)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider variant="fullWidth" component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
          
          {selectedTemplate && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Template Selezionato: {selectedTemplate.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<EditIcon />}
                  onClick={handleEditTemplate}
                >
                  Modifica
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<VisibilityIcon />}
onClick={() => setActiveTab(2)}
                >
                  Anteprima
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                >
                  Stampa
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}
      
      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            {isEditing 
              ? (selectedTemplate 
                  ? `Modifica Template: ${selectedTemplate.name}`
                  : "Nuovo Template")
              : ""}
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Nome Template"
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                margin="normal"
              />
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="template-type-label">Tipo Documento</InputLabel>
                <Select
                  labelId="template-type-label"
                  id="template-type"
                  value={editingTemplate.type}
                  label="Tipo Documento"
                  onChange={(e) => setEditingTemplate({...editingTemplate, type: e.target.value})}
                >
                  <MenuItem value="ordine">Ordine</MenuItem>
                  <MenuItem value="fattura">Fattura</MenuItem>
                  <MenuItem value="report">Report</MenuItem>
                  <MenuItem value="etichetta">Etichetta</MenuItem>
                  <MenuItem value="ddt">DDT</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="template-paper-label">Formato Carta</InputLabel>
                <Select
                  labelId="template-paper-label"
                  id="template-paper"
                  value={editingTemplate.paperSize}
                  label="Formato Carta"
                  onChange={(e) => setEditingTemplate({...editingTemplate, paperSize: e.target.value})}
                >
                  <MenuItem value="a4">A4</MenuItem>
                  <MenuItem value="a5">A5</MenuItem>
                  <MenuItem value="letter">Letter</MenuItem>
                  <MenuItem value="legal">Legal</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="template-orientation-label">Orientamento</InputLabel>
                <Select
                  labelId="template-orientation-label"
                  id="template-orientation"
                  value={editingTemplate.orientation}
                  label="Orientamento"
                  onChange={(e) => setEditingTemplate({...editingTemplate, orientation: e.target.value})}
                >
                  <MenuItem value="portrait">Verticale</MenuItem>
                  <MenuItem value="landscape">Orizzontale</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={editingTemplate.active}
                    onChange={(e) => setEditingTemplate({...editingTemplate, active: e.target.checked})}
                  />
                }
                label="Template Attivo"
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Contenuto Template
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Usa variabili nel formato {'{{nome_variabile}}'} e cicli con {'{{#each items}}...{{/each}}'}
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={15}
                value={editingTemplate.content || exampleTemplateContent}
                onChange={(e) => setEditingTemplate({...editingTemplate, content: e.target.value})}
                variant="outlined"
                sx={{ fontFamily: 'monospace' }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={handleCancelEdit}>
              Annulla
            </Button>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={handleSaveTemplate}
            >
              Salva Template
            </Button>
          </Box>
        </Box>
      )}
      
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Anteprima Template: {selectedTemplate?.name || editingTemplate.name}
            </Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<VisibilityIcon />}
                onClick={handlePreview}
                sx={{ mr: 2 }}
              >
                Anteprima Completa
              </Button>
              <Button 
                variant="contained" 
                startIcon={<PrintIcon />}
                onClick={handlePrint}
              >
                Stampa
              </Button>
            </Box>
          </Box>
          
          <Paper 
            sx={{ 
              p: 3, 
              minHeight: 500, 
              maxHeight: 700, 
              overflow: 'auto',
              background: '#fff',
              boxShadow: 2,
              width: editingTemplate.orientation === 'portrait' ? '21cm' : '29.7cm',
              margin: '0 auto',
              border: '1px solid #ddd'
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: templateContent }} />
          </Paper>
        </Box>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler eliminare il template "{templateToDelete?.name}"?
            Questa azione non può essere annullata.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Preview dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Anteprima Template: {selectedTemplate?.name || editingTemplate.name}
        </DialogTitle>
        <DialogContent>
          <div dangerouslySetInnerHTML={{ __html: templateContent }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Chiudi</Button>
          <Button onClick={handlePrint} color="primary" startIcon={<PrintIcon />}>
            Stampa
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SistemaStampe;