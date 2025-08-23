// app/report/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Receipt, 
  Description, 
  TrendingUp, 
  Settings,
  Add,
  ArrowForward,
  Assessment,
  Print,
  Schedule,
  LocalShipping,
  Label,
  CloudDownload,
  Visibility,
  Email,
  WhatsApp,
  BarChart as BarChartIcon // AGGIUNTO
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// Import componenti esistenti
import ReportManager from '@/components/Report/ReportManager';
import ReportGenerator from '@/components/Report/ReportGenerator';
import ReportViewer from '@/components/Report/ReportViewer';
import TemplateEditor from '@/components/Report/TemplateEditor';
import ReportAvanzati from '@/components/Report/ReportAvanzati'; // AGGIUNTO

// Import servizi
import reportService from '@/services/reportService';
import pdfService from '@/services/pdfService';
import { UtilityService } from '@/services/utilityService';
import { api } from '@/services/api';
import { toast } from 'react-toastify';

export default function ReportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ordiniOggi, setOrdiniOggi] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [reportStats, setReportStats] = useState({ // AGGIUNTO
    generated: 0,
    scheduled: 0,
    lastBackup: null
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Carica ordini di oggi
      const ordini = await api.caricaOrdini();
      const oggi = new Date();
      const ordiniFiltered = ordini.filter(o => {
        const dataOrdine = new Date(o.dataRitiro);
        return dataOrdine.toDateString() === oggi.toDateString();
      });
      setOrdiniOggi(ordiniFiltered);

      // Carica templates
      const templatesData = await reportService.fetchTemplates();
      setTemplates(templatesData);

      // AGGIUNTO: Carica statistiche report
      loadReportStats();
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  // AGGIUNTO: Funzione per caricare statistiche report
  const loadReportStats = () => {
    try {
      const stats = localStorage.getItem('reportStats');
      if (stats) {
        setReportStats(JSON.parse(stats));
      }
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    }
  };

  // AGGIUNTO: Funzione per aggiornare statistiche
  const updateReportStats = () => {
    const newStats = {
      ...reportStats,
      generated: reportStats.generated + 1,
      lastBackup: new Date().toISOString()
    };
    setReportStats(newStats);
    localStorage.setItem('reportStats', JSON.stringify(newStats));
  };

  const handleQuickReport = async (type) => {
    try {
      setLoading(true);
      let doc;
      const oggi = new Date();

      switch(type) {
        case 'daily-production':
          // Prepara dati per report produzione
          const productionData = prepareProductionData(ordiniOggi);
          doc = await pdfService.generateDailyProductionReport(productionData);
          pdfService.save(doc, `produzione_${format(oggi, 'yyyy-MM-dd')}.pdf`);
          toast.success('Report produzione generato');
          updateReportStats(); // AGGIUNTO
          break;

        case 'daily-orders':
          // Report ordini giornaliero
          const pdfUrl = await reportService.generateDailyReport(oggi);
          window.open(pdfUrl, '_blank');
          toast.success('Report ordini generato');
          updateReportStats(); // AGGIUNTO
          break;

        case 'labels':
          // Etichette prodotti di oggi
          const labelsData = prepareLabelsData(ordiniOggi);
          doc = await pdfService.generateProductLabels(labelsData);
          pdfService.save(doc, `etichette_${format(oggi, 'yyyy-MM-dd')}.pdf`);
          toast.success('Etichette generate');
          updateReportStats(); // AGGIUNTO
          break;

        case 'receipts':
          // Genera tutte le ricevute di oggi
          for (const ordine of ordiniOggi) {
            const receiptDoc = await pdfService.generateOrderReceipt(formatOrderForReceipt(ordine));
            pdfService.save(receiptDoc, `ricevuta_${ordine._id.slice(-8)}.pdf`);
          }
          toast.success(`Generate ${ordiniOggi.length} ricevute`);
          updateReportStats(); // AGGIUNTO
          break;

        // AGGIUNTO: Nuovo caso per analisi avanzate rapide
        case 'quick-analysis':
          setActiveTab(5);
          toast.info('Apertura analisi avanzate...');
          break;
      }
    } catch (error) {
      console.error('Errore generazione report:', error);
      toast.error('Errore nella generazione del report');
    } finally {
      setLoading(false);
    }
  };

  const prepareProductionData = (ordini) => {
    const categoriesMap = {};
    const timelineMap = {};
    let totalProducts = 0;
    let totalValue = 0;

    ordini.forEach(ordine => {
      // Raggruppa per categoria
      ordine.prodotti.forEach(prod => {
        const categoria = getProductCategory(prod.prodotto);
        if (!categoriesMap[categoria]) {
          categoriesMap[categoria] = {};
        }
        if (!categoriesMap[categoria][prod.prodotto]) {
          categoriesMap[categoria][prod.prodotto] = {
            quantity: 0,
            unit: prod.unita || 'pz',
            notes: []
          };
        }
        categoriesMap[categoria][prod.prodotto].quantity += prod.quantita;
        if (prod.note) {
          categoriesMap[categoria][prod.prodotto].notes.push(prod.note);
        }
        totalProducts += prod.quantita;
        totalValue += prod.prezzo * prod.quantita;
      });

      // Timeline ordini
      const ora = ordine.oraRitiro || '10:00';
      if (!timelineMap[ora]) {
        timelineMap[ora] = [];
      }
      timelineMap[ora].push({
        time: ora,
        customerName: ordine.nomeCliente,
        phone: ordine.telefono,
        products: ordine.prodotti,
        isTravel: ordine.daViaggio
      });
    });

    // Ordina timeline
    const timeline = Object.values(timelineMap)
      .flat()
      .sort((a, b) => a.time.localeCompare(b.time));

    return {
      date: new Date(),
      totalOrders: ordini.length,
      totalProducts,
      totalValue,
      uniqueCustomers: new Set(ordini.map(o => o.nomeCliente)).size,
      ordersByCategory: categoriesMap,
      ordersByTime: timeline
    };
  };

  const getProductCategory = (productName) => {
    const name = productName.toLowerCase();
    if (name.includes('culurgiones') || name.includes('ravioli') || name.includes('pasta')) {
      return 'Pasta Fresca';
    }
    if (name.includes('dolc') || name.includes('pardulas') || name.includes('sebadas')) {
      return 'Dolci';
    }
    if (name.includes('panada')) {
      return 'Panadas';
    }
    return 'Altri Prodotti';
  };

  const prepareLabelsData = (ordini) => {
    const labels = [];
    const oggi = new Date();
    
    ordini.forEach(ordine => {
      ordine.prodotti.forEach(prod => {
        labels.push({
          name: prod.prodotto,
          weight: `${prod.quantita} ${prod.unita || ''}`,
          batch: `L${format(oggi, 'yyyyMMdd')}`,
          productionDate: oggi,
          expiryDate: new Date(oggi.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 giorni
          price: prod.prezzo,
          customerName: ordine.nomeCliente,
          qrCode: `ORD:${ordine._id}|PROD:${prod.prodotto}`
        });
      });
    });
    
    return labels;
  };

  const formatOrderForReceipt = (ordine) => {
    return {
      id: ordine._id,
      date: new Date(ordine.dataRitiro),
      customerName: ordine.nomeCliente,
      phone: ordine.telefono,
      pickupDate: format(new Date(ordine.dataRitiro), 'dd/MM/yyyy'),
      pickupTime: ordine.oraRitiro,
      isTravel: ordine.daViaggio,
      products: ordine.prodotti.map(p => ({
        name: p.prodotto,
        quantity: p.quantita,
        unit: p.unita || 'pz',
        price: p.prezzo
      })),
      notes: ordine.note
    };
  };

  const quickReports = [
    {
      id: 'daily-production',
      title: 'Report Produzione',
      description: 'Lista produzione giornaliera per la cucina',
      icon: <LocalShipping />,
      color: 'primary',
      badge: ordiniOggi.length
    },
    {
      id: 'daily-orders',
      title: 'Report Ordini',
      description: 'Riepilogo ordini del giorno',
      icon: <Receipt />,
      color: 'secondary'
    },
    {
      id: 'labels',
      title: 'Etichette Prodotti',
      description: 'Stampa etichette per confezionamento',
      icon: <Label />,
      color: 'success'
    },
    {
      id: 'receipts',
      title: 'Ricevute Clienti',
      description: 'Genera ricevute per gli ordini',
      icon: <Description />,
      color: 'warning'
    },
    // AGGIUNTO: Nuovo quick report per analisi
    {
      id: 'quick-analysis',
      title: 'Analisi Rapida',
      description: 'Grafici e statistiche avanzate',
      icon: <BarChartIcon />,
      color: 'info'
    }
  ];

  const statisticsCards = [
    {
      label: 'Report Generati Oggi',
      value: reportStats.generated || 0, // MODIFICATO
      trend: reportStats.generated > 10 ? '+15%' : null, // MODIFICATO
      color: 'primary'
    },
    {
      label: 'Templates Attivi',
      value: templates.length,
      color: 'secondary'
    },
    {
      label: 'Export Programmati',
      value: reportStats.scheduled || 3, // MODIFICATO
      color: 'success'
    },
    {
      label: 'Ultimo Backup',
      value: reportStats.lastBackup 
        ? format(new Date(reportStats.lastBackup), 'HH:mm', { locale: it })
        : 'Mai', // MODIFICATO
      color: 'info'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Centro Report e Stampe
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<BarChartIcon />}
            onClick={() => setActiveTab(5)}
            sx={{ mr: 1 }}
            color="info"
          >
            Analisi Avanzate
          </Button>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setActiveTab(3)}
            sx={{ mr: 1 }}
          >
            Configurazione
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setActiveTab(1)}
          >
            Nuovo Report
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statisticsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  {card.label}
                </Typography>
                <Typography variant="h5" component="div">
                  {card.value}
                </Typography>
                {card.trend && (
                  <Typography sx={{ color: 'success.main' }} variant="body2">
                    {card.trend}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Report Rapidi
        </Typography>
        <Grid container spacing={2}>
          {quickReports.map((report) => (
            <Grid item xs={12} sm={6} md={report.id === 'quick-analysis' ? 12 : 3} key={report.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  background: report.id === 'quick-analysis' 
                    ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' 
                    : 'inherit',
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => handleQuickReport(report.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        bgcolor: report.id === 'quick-analysis' 
                          ? 'rgba(255,255,255,0.3)' 
                          : `${report.color}.main`,
                        color: 'white',
                        p: 1,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        mr: 2
                      }}
                    >
                      {report.icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight="bold"
                        sx={{ color: report.id === 'quick-analysis' ? 'white' : 'inherit' }}
                      >
                        {report.title}
                      </Typography>
                      {report.badge && (
                        <Chip 
                          label={report.badge} 
                          size="small" 
                          color={report.color}
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Typography 
                    variant="body2" 
                    color={report.id === 'quick-analysis' ? 'white' : 'text.secondary'}
                  >
                    {report.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Main Content with Tabs */}
      <Paper>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Report Manager" icon={<Assessment />} iconPosition="start" />
          <Tab label="Genera Report" icon={<Add />} iconPosition="start" />
          <Tab label="Visualizza" icon={<Visibility />} iconPosition="start" />
          <Tab label="Templates" icon={<Settings />} iconPosition="start" />
          <Tab label="Programmati" icon={<Schedule />} iconPosition="start" />
          <Tab 
            label="Analisi Avanzate" 
            icon={<TrendingUp />} 
            iconPosition="start"
            sx={{ 
              color: activeTab === 5 ? 'info.main' : 'inherit',
              '&.Mui-selected': { color: 'info.main' }
            }}
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeTab === 0 && <ReportManager />}
              {activeTab === 1 && (
                <ReportGenerator 
                  onGenerateReport={(type) => {
                    toast.success(`Report ${type} generato con successo`);
                    updateReportStats(); // AGGIUNTO
                    setActiveTab(2);
                  }}
                />
              )}
              {activeTab === 2 && (
                <ReportViewer 
                  data={previewData}
                  template={selectedReport}
                />
              )}
              {activeTab === 3 && (
                <TemplateEditor 
                  templates={templates}
                  onSave={loadInitialData}
                />
              )}
              {activeTab === 4 && (
                <Box>
                  <Typography variant="h6">Report Programmati</Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Funzionalità in sviluppo - Sarà possibile programmare l'invio automatico dei report
                  </Alert>
                  {/* AGGIUNTO: Preview della funzionalità futura */}
                  <List sx={{ mt: 2 }}>
                    <ListItem>
                      <ListItemIcon>
                        <Schedule />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Report Giornaliero"
                        secondary="Ogni giorno alle 19:00 - Email automatica"
                      />
                      <Chip label="Prossimamente" size="small" />
                    </ListItem>
                  </List>
                </Box>
              )}
              {activeTab === 5 && (
                <ReportAvanzati 
                  ordini={ordiniOggi}
                  onExport={() => updateReportStats()}
                />
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Recent Reports */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Report Recenti
            </Typography>
            <List>
              {[1, 2, 3].map((item) => (
                <React.Fragment key={item}>
                  <ListItem>
                    <ListItemIcon>
                      <Description />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Report Produzione ${format(new Date(), 'dd/MM/yyyy')}`}
                      secondary="Generato 2 ore fa"
                    />
                    <Box>
                      <Tooltip title="Visualizza">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton size="small">
                          <CloudDownload />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Invia Email">
                        <IconButton size="small">
                          <Email />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="WhatsApp">
                        <IconButton size="small">
                          <WhatsApp />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                  {item < 3 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Export Programmati
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Report Settimanale"
                  secondary="Ogni lunedì alle 08:00"
                />
                <Chip label="Attivo" color="success" size="small" />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Backup Mensile"
                  secondary="1° del mese alle 23:00"
                />
                <Chip label="Attivo" color="success" size="small" />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Report Fiscale"
                  secondary="Fine trimestre"
                />
                <Chip label="Pausa" color="warning" size="small" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}