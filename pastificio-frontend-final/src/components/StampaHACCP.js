// components/StampaHACCP.js
// 🖨️ STAMPA HACCP SEMPLICE A4 - Stile Tabella Word

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

export default function StampaHACCP() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState('temperature'); // 'temperature' o 'pulizie'
  const [periodo, setPeriodo] = useState('settimana'); // 'settimana', 'mese'
  const [registrazioni, setRegistrazioni] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carica registrazioni quando si apre il dialog
  const handleOpen = async () => {
    setOpen(true);
    await caricaRegistrazioni();
  };

  const caricaRegistrazioni = async () => {
    try {
      setLoading(true);
      
      // Calcola date periodo
      const dataFine = new Date();
      const dataInizio = new Date();
      
      if (periodo === 'settimana') {
        dataInizio.setDate(dataFine.getDate() - 7);
      } else {
        dataInizio.setDate(dataFine.getDate() - 30);
      }

      const token = localStorage.getItem('token');
      
      // ✅ FIX: Usa sempre /registrazioni, il backend filtra
      const endpoint = `${API_URL}/haccp/registrazioni`;
      
      const response = await axios.get(endpoint, {
        params: {
          limit: 100
          // ✅ NO filtro tipo, lo facciamo lato client
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // ✅ FIX: Accesso ai dati (potrebbe essere .data o .registrazioni o .temperature)
      const rawData = response.data.registrazioni || 
                      response.data.data || 
                      response.data.temperature || 
                      response.data || 
                      [];
      
      console.log('📊 [Stampa] Raw data ricevuto:', rawData.length, 'records');
      console.log('📊 [Stampa] Primo record:', rawData[0]);
      
      const filtrate = rawData.filter(r => {
        const dataReg = new Date(r.dataOra);
        
        // ✅ FIX FINALE: Filtro intelligente per tipo
        if (tipo === 'temperature') {
          // Cerca registrazioni temperature:
          // 1. Con campo temperatura.valore (nuovo formato)
          // 2. Con tipo che include "temperatura" o "frigo" o "congelatore" o "abbattimento"
          const haTemperaturaValore = r.temperatura?.valore !== undefined;
          const tipoTemperatura = r.tipo?.includes('temperatura') || 
                                  r.tipo?.includes('frigo') || 
                                  r.tipo?.includes('congelatore') ||
                                  r.tipo === 'abbattimento';
          
          return dataReg >= dataInizio && dataReg <= dataFine && (haTemperaturaValore || tipoTemperatura);
        }
        // Pulizie: solo con controlloIgienico
        else {
          const haPulizie = r.controlloIgienico?.area || r.controlloIgienico?.elementi?.length > 0;
          const tipoPulizie = r.tipo === 'sanificazione' || r.tipo?.includes('pulizia');
          return dataReg >= dataInizio && dataReg <= dataFine && (haPulizie || tipoPulizie);
        }
      });

      console.log('📊 [Stampa HACCP] Registrazioni caricate:', filtrate.length);
      console.log('📊 [Stampa HACCP] Prima registrazione:', filtrate[0]);
      setRegistrazioni(filtrate);
      
    } catch (error) {
      console.error('Errore caricamento registrazioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStampa = () => {
    window.print();
  };

  return (
    <>
      {/* Bottone principale */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<PrintIcon />}
        onClick={handleOpen}
        size="large"
        sx={{ textTransform: 'none' }}
      >
        📄 STAMPA REGISTRO
      </Button>

      {/* Dialog configurazione */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Typography variant="h5">
            🖨️ Stampa Registro HACCP
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            {/* Selezione tipo */}
            <TextField
              select
              label="Tipo Registro"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="temperature">🌡️ Verifica Frigoriferi</MenuItem>
              <MenuItem value="pulizie">🧹 Registro Pulizie</MenuItem>
            </TextField>

            {/* Selezione periodo */}
            <TextField
              select
              label="Periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="settimana">📅 Ultima Settimana</MenuItem>
              <MenuItem value="mese">📅 Ultimo Mese</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              onClick={caricaRegistrazioni}
              disabled={loading}
            >
              🔄 Aggiorna
            </Button>
          </Box>

          {/* Anteprima stampa */}
          <Box className="print-area" sx={{ bgcolor: 'white', p: 3, border: '1px solid #ccc' }}>
            {tipo === 'temperature' ? (
              <TabellaTemperature registrazioni={registrazioni} />
            ) : (
              <TabellaPulizie registrazioni={registrazioni} />
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStampa}
            startIcon={<PrintIcon />}
            disabled={loading || registrazioni.length === 0}
          >
            🖨️ STAMPA
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stili stampa */}
      <style jsx global>{`
        @media print {
          /* Nascondi tutto tranne area stampa */
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          /* Formattazione A4 */
          @page {
            size: A4;
            margin: 2cm;
          }
          
          /* Stili tabella */
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: center;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
        }
      `}</style>
    </>
  );
}

// ============================================
// TABELLA TEMPERATURE (Stile Word)
// ============================================
function TabellaTemperature({ registrazioni }) {
  return (
    <Box>
      {/* Intestazione */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          PASTIFICIO NONNA CLAUDIA
        </Typography>
        <Typography variant="h5" sx={{ mb: 1 }}>
          VERIFICA FRIGORIFERI
        </Typography>
        <Typography variant="body1">
          Periodo: {new Date().toLocaleDateString('it-IT')}
        </Typography>
      </Box>

      {/* Tabella */}
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>DATA</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>FRIGO 1 ISA</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>FRIGO 2 ICECOOL</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>FRIGO 3 SAMSUNG</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>FREEZER SAMSUNG</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>OPERATORE</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {registrazioni.map((reg, index) => {
              // ✅ FIX FINALE: Usa temperatura.valore e temperatura.dispositivo
              
              // Funzione per estrarre temperatura per dispositivo
              const getTemp = (cercaNomi) => {
                // Se è singola registrazione con temperatura.dispositivo
                if (reg.temperatura?.dispositivo) {
                  const disp = reg.temperatura.dispositivo.toLowerCase();
                  for (const nome of cercaNomi) {
                    if (disp.includes(nome.toLowerCase())) {
                      return reg.temperatura.valore;
                    }
                  }
                }
                return null;
              };
              
              const frigo1 = getTemp(['Frigo 1', 'frigo1']);
              const frigo2 = getTemp(['Frigo 2', 'frigo2', 'Icecool']);
              const frigo3 = getTemp(['Frigo 3', 'frigo3']);
              const freezer = getTemp(['Freezer', 'Congelatore']);
              
              return (
                <TableRow key={index}>
                  <TableCell sx={{ border: '1px solid black' }}>
                    {new Date(reg.dataOra).toLocaleDateString('it-IT')}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid black' }}>{frigo1}°C</TableCell>
                  <TableCell sx={{ border: '1px solid black' }}>{frigo2}°C</TableCell>
                  <TableCell sx={{ border: '1px solid black' }}>{frigo3}°C</TableCell>
                  <TableCell sx={{ border: '1px solid black' }}>{freezer}°C</TableCell>
                  <TableCell sx={{ border: '1px solid black' }}>{reg.operatore}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Firma a fondo pagina */}
      <Box sx={{ mt: 5, textAlign: 'right' }}>
        <Typography variant="body1">
          Certificato digitalmente nel sistema HACCP
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Firma: _______________________
        </Typography>
        <Typography variant="caption">
          (Maurizio Mameli - Responsabile HACCP)
        </Typography>
      </Box>
    </Box>
  );
}

// ============================================
// TABELLA PULIZIE (Stile Word)
// ============================================
function TabellaPulizie({ registrazioni }) {
  return (
    <Box>
      {/* Intestazione */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          PASTIFICIO NONNA CLAUDIA
        </Typography>
        <Typography variant="h5" sx={{ mb: 1 }}>
          REGISTRO PULIZIE E SANIFICAZIONE
        </Typography>
        <Typography variant="body1">
          Periodo: {new Date().toLocaleDateString('it-IT')}
        </Typography>
      </Box>

      {/* Tabella */}
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>DATA</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>AREE PULITE</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>NOTE</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>OPERATORE</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {registrazioni.map((reg, index) => {
              const aree = reg.controlloIgienico?.elementi || [];
              const areeNomi = aree.map(a => a.nome).join(', ');
              
              return (
                <TableRow key={index}>
                  <TableCell sx={{ border: '1px solid black' }}>
                    {new Date(reg.dataOra).toLocaleDateString('it-IT')}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid black', textAlign: 'left' }}>
                    {areeNomi || '-'}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid black', textAlign: 'left' }}>
                    {reg.note || '-'}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid black' }}>{reg.operatore}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Firma a fondo pagina */}
      <Box sx={{ mt: 5, textAlign: 'right' }}>
        <Typography variant="body1">
          Certificato digitalmente nel sistema HACCP
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Firma: _______________________
        </Typography>
        <Typography variant="caption">
          (Maurizio Mameli - Responsabile HACCP)
        </Typography>
      </Box>
    </Box>
  );
}