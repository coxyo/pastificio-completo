// frontend/src/components/Report/ReportScheduler.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Send
} from '@mui/icons-material';
import { reportService } from '../../services/reportService';
import { toast } from 'react-toastify';

const ReportScheduler = () => {
  const [scheduledReports, setScheduledReports] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'vendite',
    frequenza: 'giornaliero',
    ora: '08:00',
    giorniSettimana: [],
    giornoMese: 1,
    email: '',
    formato: 'pdf',
    attivo: true,
    templateId: ''
  });
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    loadScheduledReports();
    loadTemplates();
  }, []);

  const loadScheduledReports = async () => {
    try {
      const data = await reportService.getScheduledReports();
      setScheduledReports(data);
    } catch (error) {
      console.error('Errore caricamento report programmati:', error);
      toast.error('Errore nel caricamento dei report programmati');
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await reportService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Errore caricamento template:', error);
    }
  };

  const handleNewReport = () => {
    setFormData({
      nome: '',
      tipo: 'vendite',
      frequenza: 'giornaliero',
      ora: '08:00',
      giorniSettimana: [],
      giornoMese: 1,
      email: '',
      formato: 'pdf',
      attivo: true,
      templateId: ''
    });
    setEditingReport(null);
    setOpenDialog(true);
  };

  const handleEditReport = (report) => {
    setFormData(report);
    setEditingReport(report);
    setOpenDialog(true);
  };

  const handleSaveReport = async () => {
    try {
      if (editingReport) {
        await reportService.updateScheduledReport(editingReport.id, formData);
        toast.success('Report programmato aggiornato');
      } else {
        await reportService.createScheduledReport(formData);
        toast.success('Report programmato creato');
      }
      setOpenDialog(false);
      loadScheduledReports();
    } catch (error) {
      console.error('Errore salvataggio report programmato:', error);
      toast.error('Errore nel salvataggio del report programmato');
    }
  };

  const handleDeleteReport = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo report programmato?')) {
      try {
        await reportService.deleteScheduledReport(id);
        toast.success('Report programmato eliminato');
        loadScheduledReports();
      } catch (error) {
        console.error('Errore eliminazione report programmato:', error);
        toast.error('Errore nell\'eliminazione del report programmato');
      }
    }
  };

  const handleToggleReport = async (report) => {
    try {
      await reportService.updateScheduledReport(report.id, {
        ...report,
        attivo: !report.attivo
      });
      toast.success(`Report ${report.attivo ? 'disattivato' : 'attivato'}`);
      loadScheduledReports();
    } catch (error) {
      console.error('Errore toggle report:', error);
      toast.error('Errore nel cambio stato del report');
    }
  };

  const getFrequenzaText = (report) => {
    switch (report.frequenza) {
      case 'giornaliero':
        return `Ogni giorno alle ${report.ora}`;
      case 'settimanale':
        const giorni = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
        const giorniSelezionati = report.giorniSettimana
          .map(g => giorni[g])
          .join(', ');
        return `Ogni ${giorniSelezionati} alle ${report.ora}`;
      case 'mensile':
        return `Giorno ${report.giornoMese} del mese alle ${report.ora}`;
      default:
        return report.frequenza;
    }
  };

  const giorniSettimana = [
    { value: 1, label: 'Lunedì' },
    { value: 2, label: 'Martedì' },
    { value: 3, label: 'Mercoledì' },
    { value: 4, label: 'Giovedì' },
    { value: 5, label: 'Venerdì' },
    { value: 6, label: 'Sabato' },
    { value: 0, label: 'Domenica' }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h5">Report Programmati</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleNewReport}
        >
          Nuovo Report Programmato
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        {scheduledReports.length === 0 ? (
          <Alert severity="info">
            Nessun report programmato. Clicca sul pulsante sopra per crearne uno.
          </Alert>
        ) : (
          <List>
            {scheduledReports.map(report => (
              <ListItem key={report.id} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {report.nome}
                      </Typography>
                      <Chip
                        label={report.tipo}
                        size="small"
                        color="primary"
                      />
                      <Chip
                        label={report.formato.toUpperCase()}
                        size="small"
                      />
                      {!report.attivo && (
                        <Chip
                          label="Disattivato"
                          size="small"
                          color="error"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {getFrequenzaText(report)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Invia a: {report.email}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    onClick={() => handleToggleReport(report)}
                    color={report.attivo ? 'primary' : 'default'}
                  >
                    {report.attivo ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  <IconButton onClick={() => handleEditReport(report)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteReport(report.id)}>
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingReport ? 'Modifica Report Programmato' : 'Nuovo Report Programmato'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Report"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo Report</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  <MenuItem value="ordini">Report Ordini</MenuItem>
                  <MenuItem value="vendite">Report Vendite</MenuItem>
                  <MenuItem value="produzione">Report Produzione</MenuItem>
                  <MenuItem value="inventario">Report Inventario</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                >
                  <MenuItem value="">Template Default</MenuItem>
                  {templates
                    .filter(t => t.tipo === formData.tipo)
                    .map(template => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.nome}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Frequenza</InputLabel>
                <Select
                  value={formData.frequenza}
                  onChange={(e) => setFormData({ ...formData, frequenza: e.target.value })}
                >
                  <MenuItem value="giornaliero">Giornaliero</MenuItem>
                  <MenuItem value="settimanale">Settimanale</MenuItem>
                  <MenuItem value="mensile">Mensile</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Ora"
                value={formData.ora}
                onChange={(e) => setFormData({ ...formData, ora: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {formData.frequenza === 'settimanale' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Giorni della Settimana</InputLabel>
                  <Select
                    multiple
                    value={formData.giorniSettimana}
                    onChange={(e) => setFormData({ ...formData, giorniSettimana: e.target.value })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip 
                            key={value} 
                            label={giorniSettimana.find(g => g.value === value)?.label} 
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {giorniSettimana.map(giorno => (
                      <MenuItem key={giorno.value} value={giorno.value}>
                        {giorno.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {formData.frequenza === 'mensile' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Giorno del Mese"
                  value={formData.giornoMese}
                  onChange={(e) => setFormData({ ...formData, giornoMese: parseInt(e.target.value) })}
                  inputProps={{ min: 1, max: 31 }}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                type="email"
                label="Email Destinatario"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Formato</InputLabel>
                <Select
                  value={formData.formato}
                  onChange={(e) => setFormData({ ...formData, formato: e.target.value })}
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.attivo}
                    onChange={(e) => setFormData({ ...formData, attivo: e.target.checked })}
                  />
                }
                label="Report Attivo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Annulla
          </Button>
          <Button variant="contained" onClick={handleSaveReport} startIcon={<Send />}>
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportScheduler;