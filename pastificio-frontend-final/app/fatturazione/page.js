'use client';

import React from 'react';
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
  Divider
} from '@mui/material';
import { 
  Receipt, 
  Description, 
  TrendingUp, 
  Settings,
  Add,
  ArrowForward
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function FatturazionePage() {
  const router = useRouter();

  const menuItems = [
    {
      title: 'Nuova Fattura',
      description: 'Crea una nuova fattura',
      icon: <Add />,
      path: '/fatturazione/nuova',
      color: 'primary'
    },
    {
      title: 'Elenco Fatture',
      description: 'Visualizza tutte le fatture',
      icon: <Receipt />,
      path: '/fatturazione/elenco',
      color: 'secondary'
    },
    {
      title: 'Report Fiscali',
      description: 'Report e statistiche fiscali',
      icon: <TrendingUp />,
      path: '/fatturazione/report',
      color: 'success'
    },
    {
      title: 'Impostazioni',
      description: 'Configura parametri fatturazione',
      icon: <Settings />,
      path: '/fatturazione/impostazioni',
      color: 'warning'
    }
  ];

  const statistiche = {
    fatturatoMese: 15420.50,
    fattureEmesse: 87,
    fattureInSospeso: 12,
    mediaFattura: 177.25
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Fatturazione
      </Typography>

      <Grid container spacing={3}>
        {/* Statistiche */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Fatturato Mese
                  </Typography>
                  <Typography variant="h5">
                    € {statistiche.fatturatoMese.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Fatture Emesse
                  </Typography>
                  <Typography variant="h5">
                    {statistiche.fattureEmesse}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    In Sospeso
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    {statistiche.fattureInSospeso}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Media Fattura
                  </Typography>
                  <Typography variant="h5">
                    € {statistiche.mediaFattura.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Menu Azioni */}
        <Grid item xs={12} md={8}>
          <Paper>
            <List>
              {menuItems.map((item, index) => (
                <React.Fragment key={item.path}>
                  <ListItem
                    button
                    onClick={() => router.push(item.path)}
                    sx={{ py: 2 }}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          bgcolor: `${item.color}.main`,
                          color: 'white',
                          p: 1,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {item.icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      secondary={item.description}
                    />
                    <ArrowForward />
                  </ListItem>
                  {index < menuItems.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Ultime Fatture */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ultime Fatture
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="FT/2024/0087"
                  secondary="Mario Rossi - € 125.50"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="FT/2024/0086"
                  secondary="Bar Centrale - € 340.00"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="FT/2024/0085"
                  secondary="Ristorante Luna - € 580.75"
                />
              </ListItem>
            </List>
            <Button
              fullWidth
              variant="text"
              onClick={() => router.push('/fatturazione/elenco')}
              sx={{ mt: 1 }}
            >
              Vedi tutte
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}