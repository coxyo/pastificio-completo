import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Paper, Tabs, Tab, Button, Divider,
  Grid, Card, CardContent, CircularProgress, Chip
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Add as AddIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// Componenti
import FattureList from './FattureList';
import FatturaForm from './FatturaForm';
import FatturaDetail from './FatturaDetail';
import StatisticheFatturazione from './StatisticheFatturazione';
import ImpostazioniDiDefault from './ImpostazioniDiDefault';

/**
 * Componente principale per la sezione Fatturazione
 */
const Fatturazione = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);
  const [statistiche, setStatistiche] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Determina tab attivo in base all'URL
  useEffect(() => {
    const path = location.pathname;
    
    if (path.includes('/fatture/statistiche')) {
      setActiveTab(1);
    } else if (path.includes('/fatture/impostazioni')) {
      setActiveTab(2);
    } else {
      setActiveTab(0);
    }
  }, [location]);
  
  // Carica statistiche base
  useEffect(() => {
    const loadStatistiche = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/fatture/statistiche');
        setStatistiche(response.data.data.statisticheGenerali);
      } catch (error) {
        console.error('Errore nel caricamento delle statistiche:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStatistiche();
  }, []);
  
  // Gestisce cambio tab
  const handleTabChange = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/fatture');
        break;
      case 1:
        navigate('/fatture/statistiche');
        break;
      case 2:
        navigate('/fatture/impostazioni');
        break;
      default:
        navigate('/fatture');
    }
  };
  
  // Formatta importi
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '€0,00';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  
  return (
    <div>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h3" component="h1">
            Fatturazione
          </Typography>
          
          {activeTab === 0 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/fatture/nuova')}
            >
              Nuova Fattura
            </Button>
          )}
        </Box>
        
        {/* Dashboard Cards */}
        {activeTab === 0 && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Fatturato Anno Corrente
                  </Typography>
                  <Typography variant="h4">
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      formatCurrency(statistiche?.fatturatoTotale || 0)
                    )}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {statistiche?.numeroFatture || 0} fatture emesse
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Importo Pagato
                  </Typography>
                  <Typography variant="h4">
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      formatCurrency(statistiche?.importoPagato || 0)
                    )}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {statistiche?.percentualePagato || 0}% del totale
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Fatture In Scadenza (7gg)
                  </Typography>
                  <Typography variant="h4">
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      3 // Questo è un placeholder, andrebbe implementato lato server
                    )}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Valore: {formatCurrency(12500)} {/* Placeholder */}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Fatture Scadute
                  </Typography>
                  <Typography variant="h4" color="error">
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      2 // Placeholder
                    )}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Valore: {formatCurrency(3800)} {/* Placeholder */}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<ReceiptIcon />} label="Fatture" iconPosition="start" />
            <Tab icon={<AssessmentIcon />} label="Statistiche" iconPosition="start" />
            <Tab icon={<SettingsIcon />} label="Impostazioni" iconPosition="start" />
          </Tabs>
        </Paper>
        
        <Routes>
          <Route path="/" element={<FattureList />} />
          <Route path="/nuova" element={<FatturaForm />} />
          <Route path="/:id" element={<FatturaDetail />} />
          <Route path="/:id/modifica" element={<FatturaForm />} />
          <Route path="/statistiche" element={<StatisticheFatturazione />} />
          <Route path="/impostazioni" element={<ImpostazioniDiDefault />} />
        </Routes>
      </Box>
    </div>
  );
};

export default Fatturazione;