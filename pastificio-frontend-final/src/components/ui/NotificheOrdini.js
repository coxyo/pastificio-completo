'use client'
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, List, ListItem, ListItemText, ListItemIcon,
  Typography, Box, IconButton, Badge
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function NotificheOrdini({ ordini }) {
  const [open, setOpen] = React.useState(false);
  const ordiniOggi = ordini.filter(
    ordine => ordine.dataRitiro === format(new Date(), 'yyyy-MM-dd')
  );

  // Ordini imminenti (prossima ora)
  const ordiniImminenti = ordiniOggi.filter(ordine => {
    const oraOrdine = new Date();
    const [hours, minutes] = ordine.oraRitiro.split(':');
    oraOrdine.setHours(parseInt(hours), parseInt(minutes));
    
    const now = new Date();
    const inUnOra = new Date(now.getTime() + 60 * 60000);
    
    return oraOrdine >= now && oraOrdine <= inUnOra;
  });

  return (
    <>
      <IconButton color="inherit" onClick={() => setOpen(true)}>
        <Badge badgeContent={ordiniImminenti.length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notifiche Ordini</DialogTitle>
        <DialogContent>
          {ordiniImminenti.length > 0 ? (
            <>
              <Typography variant="h6" gutterBottom>
                Ordini imminenti
              </Typography>
              <List>
                {ordiniImminenti.map((ordine, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <AccessTimeIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${ordine.oraRitiro} - ${ordine.nomeCliente}`}
                      secondary={
                        <>
                          {ordine.prodotti.map((p, i) => (
                            <span key={i}>
                              {p.prodotto}: {p.quantita} {p.unita}
                              {i < ordine.prodotti.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                          {ordine.daViaggio && ' (Da viaggio)'}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          ) : (
            <Typography>
              Nessun ordine imminente per oggi
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}