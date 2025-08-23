import React from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, 
  LinearProgress, Chip, IconButton 
} from '@mui/material';
import { 
  Factory, Schedule, Assignment, TrendingUp, 
  Warning, CheckCircle, Refresh 
} from '@mui/icons-material';

export default function DashboardProduzione() {
  const stats = {
    ordiniInProduzione: 5,
    ordiniCompletatiOggi: 12,
    efficienza: 87,
    materiePrimeDisponibili: 95
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Dashboard Produzione
        </Typography>
        <IconButton>
          <Refresh />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Factory color="primary" />
                <Typography variant="h6" sx={{ ml: 2 }}>
                  In Produzione
                </Typography>
              </Box>
              <Typography variant="h3">{stats.ordiniInProduzione}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle color="success" />
                <Typography variant="h6" sx={{ ml: 2 }}>
                  Completati Oggi
                </Typography>
              </Box>
              <Typography variant="h3">{stats.ordiniCompletatiOggi}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="info" />
                <Typography variant="h6" sx={{ ml: 2 }}>
                  Efficienza
                </Typography>
              </Box>
              <Typography variant="h3">{stats.efficienza}%</Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.efficienza} 
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning color="warning" />
                <Typography variant="h6" sx={{ ml: 2 }}>
                  Materie Prime
                </Typography>
              </Box>
              <Typography variant="h3">{stats.materiePrimeDisponibili}%</Typography>
              <Chip 
                label="Disponibile" 
                color="success" 
                size="small" 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ordini in Produzione
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lista degli ordini attualmente in fase di produzione
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}