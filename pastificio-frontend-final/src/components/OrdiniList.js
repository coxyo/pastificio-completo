// components/OrdiniList.js - ✅ FIX 25/11/2025: L/F/C NON APRONO PIÙ IL DIALOG
import React, { useState, useMemo } from 'react';
import { 
  Paper, Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, TextField, Chip, Menu, MenuItem, Divider,
  Tooltip, Collapse, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptIcon from '@mui/icons-material/Receipt';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

const API_URL = 'https://pastificio-completo-production.up.railway.app/api';

// ========== CONFIGURAZIONE CATEGORIE ==========
const CATEGORIE = {
  RAVIOLI: {
    nome: 'RAVIOLI',
    prodotti: ['Ravioli', 'Culurgiones'],
    colore: '#FF6B6B',
    coloreBg: 'rgba(255, 107, 107, 0.1)'
  },
  PARDULAS: {
    nome: 'PARDULAS',
    prodotti: ['Pardulas'],
    colore: '#4ECDC4',
    coloreBg: 'rgba(78, 205, 196, 0.1)'
  },
  DOLCI: {
    nome: 'DOLCI',
    prodotti: ['Amaretti', 'Bianchini', 'Papassinas', 'Gueffus', 'Ciambelle', 
               'Torta di saba', 'Vassoio', 'Dolci misti', 'Pabassine'],
    colore: '#FFE66D',
    coloreBg: 'rgba(255, 230, 109, 0.1)'
  },
  PANADAS: {
    nome: 'PANADAS',
    prodotti: ['Panada'],
    colore: '#F38181',
    coloreBg: 'rgba(243, 129, 129, 0.1)'
  },
  SEABADAS: {
    nome: 'SEABADAS',
    prodotti: ['Sebadas'],
    colore: '#AA96DA',
    coloreBg: 'rgba(170, 150, 218, 0.1)'
  },
  ZEPPOLE: {
    nome: 'ZEPPOLE',
    prodotti: ['Zeppole'],
    colore: '#FCCD90',
    coloreBg: 'rgba(252, 205, 144, 0.1)'
  },
  PANADINE: {
    nome: 'PANADINE',
    prodotti: ['Panadine'],
    colore: '#FCBAD3',
    coloreBg: 'rgba(252, 186, 211, 0.1)'
  },
  PASTA: {
    nome: 'PASTA',
    prodotti: ['Pasta per panada', 'Pasta'],
    colore: '#B0BEC5',
    coloreBg: 'rgba(176, 190, 197, 0.1)'
  },
  ALTRI: {
    nome: 'ALTRI',
    prodotti: ['Fregula', 'Pizzette', 'Sfoglia'],
    colore: '#95E1D3',
    coloreBg: 'rgba(149, 225, 211, 0.1)'
  }
};

const getCategoriaProdotto = (nomeProdotto) => {
  if (!nomeProdotto) return 'ALTRI';
  const nomeLC = nomeProdotto.toLowerCase();
  
  // ✅ PRIORITÀ 1: Controlla PASTA prima di PANADAS (evita falsi positivi)
  if (nomeLC.includes('pasta per panada') || nomeLC.includes('pasta panada') || 
      (nomeLC.includes('pasta') && !nomeLC.includes('panada'))) {
    return 'PASTA';
  }
  
  // ✅ PRIORITÀ 2: Controlla altre categorie con ordine specifico
  // Ravioli
  if (nomeLC.includes('ravioli') || nomeLC.includes('culurgion')) {
    return 'RAVIOLI';
  }
  // Pardulas
  if (nomeLC.includes('pardula')) {
    return 'PARDULAS';
  }
  // Dolci
  if (nomeLC.includes('ciambelle') || nomeLC.includes('amaretti') || 
      nomeLC.includes('bianchini') || nomeLC.includes('papassin') || 
      nomeLC.includes('pabassine') || nomeLC.includes('gueff') ||
      nomeLC.includes('torta') || nomeLC.includes('vassoio') || 
      nomeLC.includes('dolci misti')) {
    return 'DOLCI';
  }
  // Panadas (dopo aver già escluso Pasta)
  if (nomeLC.includes('panada')) {
    return 'PANADAS';
  }
  // Seabadas
  if (nomeLC.includes('sebada')) {
    return 'SEABADAS';
  }
  // Zeppole
  if (nomeLC.includes('zeppol')) {
    return 'ZEPPOLE';
  }
  // Panadine
  if (nomeLC.includes('panadine')) {
    return 'PANADINE';
  }
  // Altri
  if (nomeLC.includes('fregula') || nomeLC.includes('pizzette') || 
      nomeLC.includes('sfoglia')) {
    return 'ALTRI';
  }
  
  return 'ALTRI';
};

const GIORNI_SETTIMANA = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

const OrdiniList = ({ 
  ordini, 
  onDelete, 
  onEdit, 
  onDateChange, 
  onNuovoOrdine,
  onSegnaComePronto,  // ✅ WHATSAPP AUTO-SEND: callback per segnare ordine pronto
  ricercaCliente,  // ✅ NUOVO: ricerca cliente attiva
  mostraTutteLeDate,  // ✅ NUOVO: flag per mostrare tutte le date
}) => {
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [ordineSelezionato, setOrdineSelezionato] = useState(null);
  const [categorieEspanse, setCategorieEspanse] = useState({
    RAVIOLI: true,
    PARDULAS: true,
    DOLCI: true,
    PANADAS: true,
    SEABADAS: true,
    ZEPPOLE: true,
    PANADINE: true,
    PASTA: true,
    ALTRI: true
  });
  const [categoriaSchermoIntero, setCategoriaSchermoIntero] = useState(null);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDataFiltro(newDate);
    onDateChange(newDate);
  };

  const handleGiornoPrecedente = () => {
    const data = new Date(dataFiltro);
    data.setDate(data.getDate() - 1);
    const nuovaData = data.toISOString().split('T')[0];
    setDataFiltro(nuovaData);
    onDateChange(nuovaData);
  };

  const handleGiornoSuccessivo = () => {
    const data = new Date(dataFiltro);
    data.setDate(data.getDate() + 1);
    const nuovaData = data.toISOString().split('T')[0];
    setDataFiltro(nuovaData);
    onDateChange(nuovaData);
  };

  const getNomeGiorno = (dataString) => {
    const data = new Date(dataString + 'T00:00:00');
    return GIORNI_SETTIMANA[data.getDay()];
  };

  const handleMenuOpen = (event, ordine) => {
    setAnchorEl(event.currentTarget);
    setOrdineSelezionato(ordine);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setOrdineSelezionato(null);
  };

  const toggleCategoria = (categoria) => {
    setCategorieEspanse(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  };

  const apriSchermoIntero = (nomeCategoria) => {
    setCategoriaSchermoIntero(nomeCategoria);
  };

  const chiudiSchermoIntero = () => {
    setCategoriaSchermoIntero(null);
  };

  // ✅ Helper per formattare quantità (rimuove numeri periodici)
  const formatQuantita = (num) => {
    if (typeof num !== 'number') num = parseFloat(num) || 0;
    return Number(num.toFixed(2)); // Arrotonda a 2 decimali e rimuove zeri trailing
  };

  // ✅ Filtra note automatiche, mostra solo note manuali dell'utente
  const filtraNoteManuali = (note) => {
    if (!note || note === '-') return '-';
    
    // Pattern note automatiche da rimuovere
    const patternAutomatici = [
      /packaging:/i,
      /dimensione:/i,
      /vassoio carta/i,
      /vassoio plastica/i,
      /scatola/i,
      /n \d+ \(/i  // "N 4 (--400-500g)" etc.
    ];
    
    // Split note per separatori comuni
    const separatori = /[\n|;]/;
    const noteArray = note.split(separatori).map(n => n.trim()).filter(n => n.length > 0);
    
    // Filtra note automatiche
    const noteManuali = noteArray.filter(nota => {
      return !patternAutomatici.some(pattern => pattern.test(nota));
    });
    
    // Ritorna note manuali o '-' se vuote
    return noteManuali.length > 0 ? noteManuali.join(' | ') : '-';
  };

  // ✅ FIX 19/12/2025 v4: FINALE - Trigger storage invece di reload!
  const aggiornaStatoProdotto = (ordineId, indiceProdotto, nuovoStato) => {
    console.log(`🚀 CAMBIO STATO: ${nuovoStato}`);
    
    // ✅ 1. Aggiorna localStorage SUBITO
    const ordiniLocal = JSON.parse(localStorage.getItem('ordini') || '[]');
    const ordiniAggiornati = ordiniLocal.map(o => {
      if (o._id === ordineId && o.prodotti[indiceProdotto]) {
        const nuoviProdotti = [...o.prodotti];
        nuoviProdotti[indiceProdotto] = {
          ...nuoviProdotti[indiceProdotto],
          statoProduzione: nuovoStato
        };
        return { ...o, prodotti: nuoviProdotti };
      }
      return o;
    });
    localStorage.setItem('ordini', JSON.stringify(ordiniAggiornati));
    
    // ✅ 2. Trigger evento storage (GestoreOrdini lo ascolta!)
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'ordini',
      newValue: JSON.stringify(ordiniAggiornati),
      url: window.location.href
    }));
    
    // ✅ 3. Chiama server in background
    setTimeout(() => {
      const token = localStorage.getItem('token');
      fetch(`${API_URL}/ordini/${ordineId}/prodotto/${indiceProdotto}/stato`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stato: nuovoStato })
      })
      .then(r => r.ok && console.log('✅ Stato confermato'))
      .catch(e => console.error('❌ Errore:', e));
    }, 0);
  };

  const handleInLavorazione = (gruppo, isChecked) => {
    const nuovoStato = isChecked ? 'in_lavorazione' : 'nuovo';
    
    // ✅ FIX 19/12/2025: Se è un gruppo (count > 1), marca TUTTI gli ordini!
    if (gruppo.count > 1 && gruppo.ordini) {
      gruppo.ordini.forEach(({ ordine, indiceProdotto }) => {
        aggiornaStatoProdotto(ordine._id, indiceProdotto, nuovoStato);
      });
    } else {
      // Ordine singolo
      aggiornaStatoProdotto(gruppo.ordine._id, gruppo.indiceProdotto, nuovoStato);
    }
  };

  const handleFatto = (gruppo, isChecked) => {
    const nuovoStato = isChecked ? 'completato' : 'in_lavorazione';
    
    // ✅ FIX 19/12/2025: Se è un gruppo (count > 1), marca TUTTI gli ordini!
    if (gruppo.count > 1 && gruppo.ordini) {
      gruppo.ordini.forEach(({ ordine, indiceProdotto }) => {
        aggiornaStatoProdotto(ordine._id, indiceProdotto, nuovoStato);
      });
    } else {
      // Ordine singolo
      aggiornaStatoProdotto(gruppo.ordine._id, gruppo.indiceProdotto, nuovoStato);
    }
  };

  const handleConsegnato = (gruppo, isChecked) => {
    const nuovoStato = isChecked ? 'consegnato' : 'completato';
    
    // ✅ FIX 19/12/2025: Se è un gruppo (count > 1), marca TUTTI gli ordini!
    if (gruppo.count > 1 && gruppo.ordini) {
      gruppo.ordini.forEach(({ ordine, indiceProdotto }) => {
        aggiornaStatoProdotto(ordine._id, indiceProdotto, nuovoStato);
      });
    } else {
      // Ordine singolo
      aggiornaStatoProdotto(gruppo.ordine._id, gruppo.indiceProdotto, nuovoStato);
    }
  };

  const inviaWhatsApp = (ordine, tipo = 'conferma') => {
    try {
      let messaggio = '';
      
      if (tipo === 'pronto') {
        messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝

✅ *ORDINE PRONTO PER IL RITIRO*

Cliente: ${ordine.nomeCliente}
Data: ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}
Ora: ${ordine.oraRitiro}

📍 *DOVE:* Via Carmine 20/B, Assemini (CA)
📞 *INFO:* 389 887 9833

Vi aspettiamo!
Pastificio Nonna Claudia`;

      } else if (tipo === 'promemoria') {
        messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝

🔔 *PROMEMORIA RITIRO*

Gentile ${ordine.nomeCliente},
le ricordiamo il suo ordine per domani alle ${ordine.oraRitiro}.

📍 *DOVE:* Via Carmine 20/B, Assemini (CA)
📞 *Per info:* 389 887 9833

Grazie e a presto!
Pastificio Nonna Claudia`;

      } else {
        const prodottiDettaglio = ordine.prodotti.map(p => {
          const dettagli = p.dettagliCalcolo?.dettagli || `${p.quantita} ${p.unitaMisura || p.unita || 'Kg'}`;
          return `• ${p.nome || p.prodotto}: ${dettagli} - €${(p.prezzo || 0).toFixed(2)}`;
        }).join('\n');

        messaggio = `🍝 *PASTIFICIO NONNA CLAUDIA* 🍝

✅ *ORDINE CONFERMATO*

Gentile ${ordine.nomeCliente},
grazie per aver scelto i nostri prodotti artigianali!

📋 *RIEPILOGO ORDINE:*
${prodottiDettaglio}

💰 *TOTALE: €${calcolaTotale(ordine)}*

📅 *RITIRO:* ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
⏰ *ORA:* ${ordine.oraRitiro}

📍 *DOVE:* Via Carmine 20/B, Assemini (CA)
📞 *Per info:* 389 887 9833

Grazie per averci scelto!
Pastificio Nonna Claudia`;
      }

      const telefonoCliente = ordine.telefono || ordine.cliente?.telefono || '';
      const telefonoPulito = telefonoCliente.replace(/\D/g, '');
      const numeroWhatsApp = telefonoPulito.startsWith('39') ? telefonoPulito : `39${telefonoPulito}`;
      
      const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(messaggio)}`;
      window.open(url, '_blank');
      
    } catch (error) {
      console.error('Errore invio WhatsApp:', error);
    }
  };

  const segnaComePronto = async (ordineId) => {
    const ordine = ordini.find(o => o._id === ordineId);
    if (ordine && onSegnaComePronto) {
      // ✅ WHATSAPP AUTO-SEND: usa callback da GestoreOrdini
      await onSegnaComePronto(ordine);
    } else if (ordine) {
      // ✅ FALLBACK: comportamento vecchio se callback non presente
      for (let i = 0; i < ordine.prodotti.length; i++) {
        await aggiornaStatoProdotto(ordineId, i, 'completato');
      }
      inviaWhatsApp(ordine, 'pronto');
    }
    handleMenuClose();
  };

  const inviaPromemoria = (ordineId) => {
    const ordine = ordini.find(o => o._id === ordineId);
    if (ordine) {
      inviaWhatsApp(ordine, 'promemoria');
    }
    handleMenuClose();
  };

  const handleCreaFattura = () => {
    if (ordineSelezionato) {
      console.log('Crea fattura per ordine:', ordineSelezionato._id);
    }
    handleMenuClose();
  };

  const handleStampaOrdine = () => {
    if (ordineSelezionato) {
      console.log('Stampa ordine:', ordineSelezionato._id);
    }
    handleMenuClose();
  };

  const handleCambiaStato = (nuovoStato) => {
    if (ordineSelezionato) {
      if (nuovoStato === 'completato') {
        segnaComePronto(ordineSelezionato._id);
      }
    }
    handleMenuClose();
  };

  // ========== RAGGRUPPAMENTO CON FIX ==========
  const ordiniPerCategoria = useMemo(() => {
    const result = {
      RAVIOLI: [],
      PARDULAS: [],
      DOLCI: [],
      PANADAS: [],
      SEABADAS: [],
      ZEPPOLE: [],
      PANADINE: [],
      PASTA: [],
      ALTRI: []
    };

    const ordiniFiltrati = ordini.filter(ordine => {
      // ✅ NUOVO: Se ricerca attiva, mostra tutti gli ordini (già filtrati per cliente in GestoreOrdini)
      if (mostraTutteLeDate || ricercaCliente) {
        return true;
      }
      const dataOrdine = ordine.dataRitiro || ordine.createdAt || '';
      return dataOrdine.startsWith(dataFiltro);
    });

    const mappaRaggruppamento = new Map();

    ordiniFiltrati.forEach(ordine => {
      if (!ordine.prodotti || ordine.prodotti.length === 0) return;

      const categorieOrdine = new Set(
        ordine.prodotti.map(p => getCategoriaProdotto(p.nome || p.prodotto))
      );
      const haAltriProdotti = categorieOrdine.size > 1 || ordine.prodotti.length > 1;

      ordine.prodotti.forEach((prodotto, indiceProdotto) => {
        const nomeProdotto = prodotto.nome || prodotto.prodotto || 'N/D';
        const categoria = getCategoriaProdotto(nomeProdotto);
        const quantita = prodotto.quantita || 0;
        const unita = prodotto.unitaMisura || prodotto.unita || 'Kg';
        const nomeCliente = ordine.nomeCliente || 'N/D';
        const ordineId = ordine._id || ordine.id || `temp-${Date.now()}-${Math.random()}`;
        
        // ✅ FIX 15/01/2026 v2: Raggruppa prodotti NELLO STESSO ORDINE
        // Chiave: ordineId + prodotto + quantità
        // Stesso ordine + stesso prodotto + stessa quantità → "2x", "3x", etc
        // Ordini diversi → righe separate anche se stesso prodotto
        let chiave;
        if (nomeProdotto === 'Vassoio Dolci Misti' || unita === 'vassoio') {
          const prezzoArrotondato = Math.round((prodotto.prezzo || 0) * 100) / 100;
          // Vassoi: raggruppa per ordine + prezzo (non per quantità)
          chiave = `${ordineId}-${categoria}-${nomeCliente}-${nomeProdotto}-${prezzoArrotondato}`;
        } else {
          // Prodotti normali: raggruppa per ordine + prodotto + quantità
          chiave = `${ordineId}-${categoria}-${nomeCliente}-${nomeProdotto}-${quantita}-${unita}`;
        }

        if (mappaRaggruppamento.has(chiave)) {
          const gruppo = mappaRaggruppamento.get(chiave);
          gruppo.count += 1;  // ✅ Incrementa count: 2x, 3x, etc
          gruppo.prezzoTotale += (parseFloat(prodotto.prezzo) || 0);
          // ✅ FIX 19/12/2025: Salva TUTTI gli ordini del gruppo, non solo il primo!
          gruppo.ordini.push({ ordine, indiceProdotto });
        } else {
          mappaRaggruppamento.set(chiave, {
            categoria,
            oraRitiro: ordine.oraRitiro || '',
            nomeCliente,
            daViaggio: ordine.daViaggio || false,
            haAltriProdotti,
            prodotto,
            ordine, // ✅ Mantieni per compatibilità (è il primo ordine)
            indiceProdotto, // ✅ Mantieni per compatibilità (è il primo indice)
            ordini: [{ ordine, indiceProdotto }], // ✅ NUOVO: Array di TUTTI gli ordini
            count: 1,
            prezzoTotale: parseFloat(prodotto.prezzo) || 0
          });
        }
      });
    });

    mappaRaggruppamento.forEach((gruppo) => {
      result[gruppo.categoria].push(gruppo);
    });

    Object.keys(result).forEach(cat => {
      result[cat].sort((a, b) => {
        const oraA = a.oraRitiro || '';
        const oraB = b.oraRitiro || '';
        return oraA.localeCompare(oraB);
      });
    });

    return result;
  }, [ordini, dataFiltro, mostraTutteLeDate, ricercaCliente]);

  const totaleRigheOggi = useMemo(() => {
    return Object.values(ordiniPerCategoria).reduce((acc, cat) => acc + cat.length, 0);
  }, [ordiniPerCategoria]);

  return (
    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={handleGiornoPrecedente} 
            size="small"
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '0.75rem', lineHeight: 1 }}>
              {getNomeGiorno(dataFiltro)}
            </Typography>
            <TextField
              type="date"
              size="small"
              value={dataFiltro}
              onChange={handleDateChange}
              sx={{ width: 150, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.9rem' } }}
            />
          </Box>
          
          <IconButton 
            onClick={handleGiornoSuccessivo} 
            size="small"
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <ChevronRightIcon />
          </IconButton>
          
          <Typography variant="subtitle2" color="text.secondary" sx={{ ml: 1 }}>
            {totaleRigheOggi} prodotti
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onNuovoOrdine}
        >
          NUOVO
        </Button>
      </Box>

      {/* Tabelle per categoria */}
      {Object.entries(CATEGORIE).map(([chiaveCategoria, configCategoria]) => {
        const prodottiCategoria = ordiniPerCategoria[chiaveCategoria] || [];
        if (prodottiCategoria.length === 0) return null;

        return (
          <Box key={chiaveCategoria} data-categoria={chiaveCategoria} sx={{ mb: 2 }}>
            <Box
              onClick={() => toggleCategoria(chiaveCategoria)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: configCategoria.colore,
                color: 'white',
                px: 2,
                py: 1,
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                '&:hover': { opacity: 0.9 }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight="bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    apriSchermoIntero(chiaveCategoria);
                  }}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'scale(1.05)', textDecoration: 'underline' }
                  }}
                >
                  {configCategoria.nome} ({prodottiCategoria.length}) 🔍
                </Typography>
                
                <Tooltip title="Visualizza a schermo intero">
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      apriSchermoIntero(chiaveCategoria);
                    }}
                    sx={{ color: 'white' }}
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              {categorieEspanse[chiaveCategoria] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>

            <Collapse in={categorieEspanse[chiaveCategoria]}>
              <TableContainer component={Paper} elevation={1} sx={{ borderRadius: '0 0 8px 8px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: configCategoria.coloreBg }}>
                      {/* ✅ FIX 13/12/2025: Mostra DATA quando c'è ricerca */}
                      {(ricercaCliente || mostraTutteLeDate) && (
                        <TableCell sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '70px', backgroundColor: '#e3f2fd' }}>📅 DATA</TableCell>
                      )}
                      <TableCell sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '50px' }}>ORA</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem' }}>CLIENTE</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem' }}>PRODOTTO</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '70px' }}>Q.TÀ</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '60px' }}>€</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '90px' }}>L/F/C</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '30px' }}>+</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem' }}>NOTE</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.7rem', width: '90px' }}>AZIONI</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prodottiCategoria.map((gruppo, idx) => {
                      const { ordine, prodotto, daViaggio, haAltriProdotti, nomeCliente, indiceProdotto, count, prezzoTotale } = gruppo;
                      
                      const isInLavorazione = prodotto.statoProduzione === 'in_lavorazione';
                      const isFatto = prodotto.statoProduzione === 'completato';
                      const isConsegnato = prodotto.statoProduzione === 'consegnato';
                      
                      let quantitaEffettiva = prodotto.quantita || 0;
                      let unitaEffettiva = prodotto.unitaMisura || prodotto.unita || 'Kg';
                      let countDisplay = count; // ✅ FIX 13/12/2025: count per display vassoi
                      
                      // ✅ Per i vassoi, usa pesoTotale se esiste, altrimenti calcola dalla composizione
                      if (prodotto.nome === 'Vassoio Dolci Misti' || unitaEffettiva === 'vassoio') {
                        
                        // ✅ FIX: La quantità di vassoi è prodotto.quantita
                        const quantitaVassoi = prodotto.quantita || 1;
                        let pesoTotaleVassoi = 0;
                        
                        // Priorità 1: Usa pesoTotale se esiste
                        if (prodotto.dettagliCalcolo?.pesoTotale) {
                          pesoTotaleVassoi = parseFloat(prodotto.dettagliCalcolo.pesoTotale);
                        }
                        // Priorità 2: Calcola dalla composizione (solo Kg)
                        else if (prodotto.dettagliCalcolo?.composizione) {
                          pesoTotaleVassoi = prodotto.dettagliCalcolo.composizione.reduce((sum, item) => {
                            const unitaItem = (item.unita || '').toLowerCase();
                            if (unitaItem === 'kg') {
                              return sum + (parseFloat(item.quantita) || 0);
                            }
                            return sum;
                          }, 0);
                        }
                        // Priorità 3: Fallback a 0.5 kg per vassoio
                        else {
                          pesoTotaleVassoi = 0.5; // ✅ FIX: peso di UN vassoio, non moltiplicare
                        }
                        
                        // ✅ FIX: pesoTotaleVassoi è già il peso di UN singolo vassoio
                        quantitaEffettiva = pesoTotaleVassoi;
                        unitaEffettiva = 'Kg';
                        
                        // ✅ FIX: Usa quantità vassoi come count se > 1
                        if (quantitaVassoi > 1) {
                          countDisplay = quantitaVassoi;
                        }
                      }
                      
                      const qtaDisplay = countDisplay > 1 
                        ? `${countDisplay} x ${formatQuantita(quantitaEffettiva)} ${unitaEffettiva}` 
                        : `${formatQuantita(quantitaEffettiva)} ${unitaEffettiva}`;

                      // ✅ FIX 13/12/2025: Abbreviazioni per vassoi
                      const ABBREVIAZIONI_VASSOIO = {
                        'Ciambelle con marmellata di albicocca': 'C.Albic',
                        'Ciambelle con marmellata di ciliegia': 'C.Cileg',
                        'Ciambelle con nutella': 'C.Nut',
                        'Ciambelle con zucchero a velo': 'C.Nude',
                        'Ciambelle semplici': 'C.Nude',
                        'Ciambelle miste': 'C.Miste',
                        'Ciambelle': 'C',
                        'Pardulas con glassa': 'P.Glass',
                        'Pardulas con zucchero a velo': 'P.Zucch',
                        'Pardulas (base)': 'P',
                        'Pardulas': 'P',
                        'Amaretti': 'A',
                        'Bianchini': 'B',
                        'Gueffus': 'G',
                        'Papassinas': 'PAB',
                        'Dolci misti': 'Dolci Mix'
                      };
                      
                      const abbreviaNome = (nome) => {
                        if (!nome) return '';
                        if (ABBREVIAZIONI_VASSOIO[nome]) return ABBREVIAZIONI_VASSOIO[nome];
                        for (const [key, abbr] of Object.entries(ABBREVIAZIONI_VASSOIO)) {
                          if (key.toLowerCase() === nome.toLowerCase()) return abbr;
                          if (nome.toLowerCase().includes(key.toLowerCase())) return abbr;
                        }
                        return nome;
                      };
                      
                      let composizioneDisplay = '';
                      if (prodotto.dettagliCalcolo?.composizione) {
                        composizioneDisplay = prodotto.dettagliCalcolo.composizione
                          .map(item => {
                            // ✅ FIX: Costruisci nome completo PRIMA di abbreviare
                            // Per ordini vecchi: nome="Ciambelle", variante="con marmellata..."
                            // Per ordini nuovi: nome="Ciambelle con marmellata...", variante=null
                            let nomeCompleto = item.nome || '';
                            if (item.variante && !nomeCompleto.toLowerCase().includes(item.variante.toLowerCase())) {
                              // Aggiungi variante solo se non già inclusa nel nome
                              nomeCompleto = `${nomeCompleto} ${item.variante}`.trim();
                            }
                            const nomeAbbreviato = abbreviaNome(nomeCompleto);
                            return `${nomeAbbreviato}: ${formatQuantita(item.quantita)}`;
                          })
                          .join(', ');
                      } else if (prodotto.dettagliCalcolo?.dettagli && 
                                 (prodotto.nome === 'Vassoio Dolci Misti' || unitaEffettiva === 'vassoio')) {
                        composizioneDisplay = prodotto.dettagliCalcolo.dettagli;
                      }

                      return (
                        <TableRow 
                          key={`${ordine._id}-${idx}`}
                          sx={{
                            '&:nth-of-type(odd)': { backgroundColor: isConsegnato ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.02)' },
                            '&:hover': { backgroundColor: isConsegnato ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)' },
                            opacity: isConsegnato ? 0.6 : 1,
                            textDecoration: isConsegnato ? 'line-through' : 'none'
                          }}
                        >
                          {/* ✅ FIX 13/12/2025: Mostra DATA quando c'è ricerca */}
                          {(ricercaCliente || mostraTutteLeDate) && (
                            <TableCell sx={{ p: 0.5, backgroundColor: '#e3f2fd' }}>
                              <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                                {ordine.dataRitiro ? new Date(ordine.dataRitiro).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) : '-'}
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell sx={{ p: 0.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {ordine.oraRitiro || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ p: 0.5 }}>
                            <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.75rem' }}>
                              {nomeCliente}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ p: 0.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {prodotto.nome || prodotto.prodotto}
                              {prodotto.variante && ` (${prodotto.variante})`}
                            </Typography>
                            {composizioneDisplay && (
                              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', display: 'block' }}>
                                ({composizioneDisplay})
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ p: 0.5 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'nowrap' }}
                            >
                              {qtaDisplay}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ p: 0.5 }}>
                            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                              €{(prezzoTotale || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                          
                          {/* ✅ FIX 25/11/2025: L/F/C NON APRONO PIÙ IL DIALOG */}
                          <TableCell align="center" sx={{ p: 0.5, pointerEvents: 'none' }}>
                            <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center', pointerEvents: 'none' }}>
                              <Tooltip title={count > 1 ? "In Lavorazione (gruppo)" : "In Lavorazione"}>
                                <Box 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                  sx={{ display: 'inline-block', pointerEvents: 'auto' }}
                                >
                                  <Chip
                                    label="L"
                                    data-no-edit="true"
                                    color={isInLavorazione ? 'warning' : 'default'}
                                    variant={isInLavorazione ? 'filled' : 'outlined'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleInLavorazione(gruppo, !isInLavorazione);
                                    }}
                                    sx={{ 
                                      cursor: 'pointer', 
                                      minWidth: '24px',
                                      fontSize: '0.6rem',
                                      height: '18px',
                                      '& .MuiChip-label': { px: 0.4 },
                                      pointerEvents: 'auto'
                                    }}
                                  />
                                </Box>
                              </Tooltip>
                              <Tooltip title={count > 1 ? "Fatto (gruppo)" : "Fatto"}>
                                <Box 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                  sx={{ display: 'inline-block', pointerEvents: 'auto' }}
                                >
                                  <Chip
                                    label="F"
                                    data-no-edit="true"
                                    color={isFatto ? 'success' : 'default'}
                                    variant={isFatto ? 'filled' : 'outlined'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleFatto(gruppo, !isFatto);
                                    }}
                                    sx={{ 
                                      cursor: 'pointer', 
                                      minWidth: '24px',
                                      fontSize: '0.6rem',
                                      height: '18px',
                                      '& .MuiChip-label': { px: 0.4 },
                                      pointerEvents: 'auto'
                                    }}
                                  />
                                </Box>
                              </Tooltip>
                              <Tooltip title={count > 1 ? "Consegnato (gruppo)" : "Consegnato"}>
                                <Box 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                  sx={{ display: 'inline-block', pointerEvents: 'auto' }}
                                >
                                  <Chip
                                    label="C"
                                    data-no-edit="true"
                                    color={isConsegnato ? 'error' : 'default'}
                                    variant={isConsegnato ? 'filled' : 'outlined'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleConsegnato(gruppo, !isConsegnato);
                                    }}
                                    sx={{ 
                                      cursor: 'pointer', 
                                      minWidth: '24px',
                                      fontSize: '0.6rem',
                                      height: '18px',
                                      '& .MuiChip-label': { px: 0.4 },
                                      pointerEvents: 'auto'
                                    }}
                                  />
                                </Box>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          
                          <TableCell align="center" sx={{ p: 0.5 }}>
                            {haAltriProdotti ? (
                              <Tooltip title="Ha altri prodotti in altre categorie">
                                <Chip label="+" size="small" color="info" sx={{ fontSize: '0.6rem', height: '18px', minWidth: '20px', '& .MuiChip-label': { px: 0.3 } }} />
                              </Tooltip>
                            ) : ''}
                          </TableCell>
                          
                          <TableCell sx={{ p: 0.5, minWidth: '180px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                              {daViaggio && (
                                <Chip label="V" size="small" color="warning" sx={{ fontSize: '0.6rem', height: '18px', flexShrink: 0 }} />
                              )}
                              <Typography 
                                variant="caption" 
                                sx={{ fontSize: '0.65rem', lineHeight: 1.3, wordBreak: 'break-word' }}
                              >
                                {filtraNoteManuali(prodotto.note || ordine.note)}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell align="center" sx={{ p: 0.5, pointerEvents: 'none' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                              <IconButton 
                                onClick={(e) => { e.stopPropagation(); onEdit(ordine); }} 
                                size="small" 
                                color="primary" 
                                title="Modifica" 
                                sx={{ p: 0.25, pointerEvents: 'auto' }}
                              >
                                <EditIcon sx={{ fontSize: '0.9rem' }} />
                              </IconButton>
                              <IconButton 
                                onClick={(e) => { e.stopPropagation(); onDelete(ordine._id); }} 
                                size="small" 
                                color="error" 
                                title="Elimina" 
                                sx={{ p: 0.25, pointerEvents: 'auto' }}
                              >
                                <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                              </IconButton>
                              <IconButton 
                                onClick={(e) => handleMenuOpen(e, ordine)} 
                                size="small" 
                                title="Menu" 
                                sx={{ p: 0.25, pointerEvents: 'auto' }}
                              >
                                <MoreVertIcon sx={{ fontSize: '0.9rem' }} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </Box>
        );
      })}

      {totaleRigheOggi === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Nessun ordine per questa data
          </Typography>
        </Paper>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem 
          onClick={() => segnaComePronto(ordineSelezionato?._id)}
          sx={{ color: 'success.main' }}
        >
          <WhatsAppIcon sx={{ mr: 1 }} fontSize="small" />
          Segna come Pronto (invia WhatsApp)
        </MenuItem>
        
        <MenuItem onClick={() => inviaPromemoria(ordineSelezionato?._id)}>
          <NotificationsActiveIcon sx={{ mr: 1 }} fontSize="small" />
          Invia Promemoria WhatsApp
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleCreaFattura}>
          <ReceiptIcon sx={{ mr: 1 }} fontSize="small" />
          Crea Fattura
        </MenuItem>
        
        <MenuItem onClick={handleStampaOrdine}>
          <PrintIcon sx={{ mr: 1 }} fontSize="small" />
          Stampa Ordine
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={() => handleCambiaStato('completato')}
          sx={{ color: 'success.main' }}
        >
          Completato (invia WhatsApp)
        </MenuItem>
      </Menu>

    {/* Dialog zoom con L/F/C funzionanti */}
    <Dialog
      open={!!categoriaSchermoIntero}
      onClose={chiudiSchermoIntero}
      maxWidth="xl"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          minHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: CATEGORIE[categoriaSchermoIntero]?.colore || '#000' }}>
            {CATEGORIE[categoriaSchermoIntero]?.nome} ({ordiniPerCategoria[categoriaSchermoIntero]?.length || 0})
          </Typography>
          <IconButton onClick={chiudiSchermoIntero} size="large">
            <CloseIcon fontSize="large" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {categoriaSchermoIntero && ordiniPerCategoria[categoriaSchermoIntero] && (
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: CATEGORIE[categoriaSchermoIntero]?.coloreBg || '#f0f0f0' }}>
                {/* ✅ FIX 13/12/2025: Mostra DATA quando c'è ricerca */}
                {(ricercaCliente || mostraTutteLeDate) && (
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem', backgroundColor: '#e3f2fd' }}>📅 DATA</TableCell>
                )}
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>ORA</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>CLIENTE</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>PRODOTTO</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Q.TÀ</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>PREZZO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>L/F/C</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>NOTE</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>AZIONI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordiniPerCategoria[categoriaSchermoIntero].map((gruppo, idx) => {
                const { ordine, prodotto, nomeCliente, daViaggio, indiceProdotto, count, prezzoTotale } = gruppo;
                
                const isInLavorazione = prodotto.statoProduzione === 'in_lavorazione';
                const isFatto = prodotto.statoProduzione === 'completato';
                const isConsegnato = prodotto.statoProduzione === 'consegnato';
                
                      let quantitaEffettiva = prodotto.quantita || 0;
                      let unitaEffettiva = prodotto.unitaMisura || prodotto.unita || 'Kg';
                      let countDisplay = count; // ✅ FIX 13/12/2025: count per display vassoi
                      
                      // ✅ Per i vassoi, usa pesoTotale se esiste, altrimenti calcola dalla composizione
                      if (prodotto.nome === 'Vassoio Dolci Misti' || unitaEffettiva === 'vassoio') {
                        
                        // ✅ FIX: La quantità di vassoi è prodotto.quantita
                        const quantitaVassoi = prodotto.quantita || 1;
                        let pesoTotaleVassoi = 0;
                        
                        // Priorità 1: Usa pesoTotale se esiste
                        if (prodotto.dettagliCalcolo?.pesoTotale) {
                          pesoTotaleVassoi = parseFloat(prodotto.dettagliCalcolo.pesoTotale);
                        }
                        // Priorità 2: Calcola dalla composizione (solo Kg)
                        else if (prodotto.dettagliCalcolo?.composizione) {
                          pesoTotaleVassoi = prodotto.dettagliCalcolo.composizione.reduce((sum, item) => {
                            const unitaItem = (item.unita || '').toLowerCase();
                            if (unitaItem === 'kg') {
                              return sum + (parseFloat(item.quantita) || 0);
                            }
                            return sum;
                          }, 0);
                        }
                        // Priorità 3: Fallback a 0.5 kg per vassoio
                        else {
                          pesoTotaleVassoi = 0.5; // ✅ FIX: peso di UN vassoio, non moltiplicare
                        }
                        
                        // ✅ FIX: pesoTotaleVassoi è già il peso di UN singolo vassoio
                        quantitaEffettiva = pesoTotaleVassoi;
                        unitaEffettiva = 'Kg';
                        
                        // ✅ FIX: Usa quantità vassoi come count se > 1
                        if (quantitaVassoi > 1) {
                          countDisplay = quantitaVassoi;
                        }
                      }
                      
                      const qtaDisplay = countDisplay > 1 
                        ? `${countDisplay} x ${formatQuantita(quantitaEffettiva)} ${unitaEffettiva}` 
                        : `${formatQuantita(quantitaEffettiva)} ${unitaEffettiva}`;
                
                // ✅ FIX 13/12/2025: Abbreviazioni per vassoi
                const ABBREVIAZIONI_VASSOIO = {
                  'Ciambelle con marmellata di albicocca': 'C.Albic',
                  'Ciambelle con marmellata di ciliegia': 'C.Cileg',
                  'Ciambelle con nutella': 'C.Nut',
                  'Ciambelle con zucchero a velo': 'C.Nude',
                  'Ciambelle semplici': 'C.Nude',
                  'Ciambelle miste': 'C.Miste',
                  'Ciambelle': 'C',
                  'Pardulas con glassa': 'P.Glass',
                  'Pardulas con zucchero a velo': 'P.Zucch',
                  'Pardulas (base)': 'P',
                  'Pardulas': 'P',
                  'Amaretti': 'A',
                  'Bianchini': 'B',
                  'Gueffus': 'G',
                  'Papassinas': 'PAB',
                  'Dolci misti': 'Dolci Mix'
                };
                
                const abbreviaNome = (nome) => {
                  if (!nome) return '';
                  if (ABBREVIAZIONI_VASSOIO[nome]) return ABBREVIAZIONI_VASSOIO[nome];
                  for (const [key, abbr] of Object.entries(ABBREVIAZIONI_VASSOIO)) {
                    if (key.toLowerCase() === nome.toLowerCase()) return abbr;
                    if (nome.toLowerCase().includes(key.toLowerCase())) return abbr;
                  }
                  return nome;
                };
                
                let composizioneDisplay = '';
                if (prodotto.dettagliCalcolo?.composizione) {
                  composizioneDisplay = prodotto.dettagliCalcolo.composizione
                    .map(item => {
                      // ✅ FIX: Costruisci nome completo PRIMA di abbreviare
                      let nomeCompleto = item.nome || '';
                      if (item.variante && !nomeCompleto.toLowerCase().includes(item.variante.toLowerCase())) {
                        nomeCompleto = `${nomeCompleto} ${item.variante}`.trim();
                      }
                      const nomeAbbreviato = abbreviaNome(nomeCompleto);
                      return `${nomeAbbreviato}: ${formatQuantita(item.quantita)} ${item.unita}`;
                    })
                    .join(', ');
                } else if (prodotto.dettagliCalcolo?.dettagli) {
                  composizioneDisplay = prodotto.dettagliCalcolo.dettagli;
                }
                
                return (
                  <TableRow key={idx} sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: isConsegnato ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.02)' },
                    height: '60px',
                    opacity: isConsegnato ? 0.6 : 1,
                    textDecoration: isConsegnato ? 'line-through' : 'none'
                  }}>
                    {/* ✅ FIX 13/12/2025: Mostra DATA quando c'è ricerca */}
                    {(ricercaCliente || mostraTutteLeDate) && (
                      <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>
                        {ordine.dataRitiro ? new Date(ordine.dataRitiro).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) : '-'}
                      </TableCell>
                    )}
                    <TableCell sx={{ fontSize: '1rem' }}>{ordine.oraRitiro || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '1rem', fontWeight: 'medium' }}>{nomeCliente}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                        {prodotto.nome || prodotto.prodotto}
                        {prodotto.variante && ` (${prodotto.variante})`}
                      </Typography>
                      {composizioneDisplay && (
                        <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                          {composizioneDisplay}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '1.1rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {qtaDisplay}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'primary.main' }}>
                      €{(prezzoTotale || 0).toFixed(2)}
                    </TableCell>
                    
                    {/* ✅ FIX 25/11/2025: L/F/C NON APRONO PIÙ IL DIALOG */}
                    <TableCell align="center" sx={{ pointerEvents: 'none' }}>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', pointerEvents: 'none' }}>
                        <Chip
                          label="L"
                          data-no-edit="true"
                          color={isInLavorazione ? 'warning' : 'default'}
                          variant={isInLavorazione ? 'filled' : 'outlined'}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleInLavorazione(gruppo, !isInLavorazione);
                          }}
                          sx={{ cursor: 'pointer', fontSize: '1rem', minWidth: '40px', height: '32px', pointerEvents: 'auto' }}
                        />
                        <Chip
                          label="F"
                          data-no-edit="true"
                          color={isFatto ? 'success' : 'default'}
                          variant={isFatto ? 'filled' : 'outlined'}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleFatto(gruppo, !isFatto);
                          }}
                          sx={{ cursor: 'pointer', fontSize: '1rem', minWidth: '40px', height: '32px', pointerEvents: 'auto' }}
                        />
                        <Chip
                          label="C"
                          data-no-edit="true"
                          color={isConsegnato ? 'error' : 'default'}
                          variant={isConsegnato ? 'filled' : 'outlined'}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleConsegnato(gruppo, !isConsegnato);
                          }}
                          sx={{ cursor: 'pointer', fontSize: '1rem', minWidth: '40px', height: '32px', pointerEvents: 'auto' }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.9rem' }}>
                      {daViaggio && <Chip label="VIAGGIO" size="small" color="warning" sx={{ mr: 0.5 }} />}
                      {filtraNoteManuali(prodotto.note || ordine.note)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => { chiudiSchermoIntero(); onEdit(ordine); }} color="primary" size="large">
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>

    </Paper>
  );
};

const calcolaTotale = (ordine) => {
  if (ordine.totale !== undefined && ordine.totale !== null) {
    return parseFloat(ordine.totale).toFixed(2);
  }
  
  if (!ordine.prodotti || !Array.isArray(ordine.prodotti)) {
    return '0.00';
  }
  
  return ordine.prodotti.reduce((totale, prodotto) => {
    return totale + (parseFloat(prodotto.prezzo) || 0);
  }, 0).toFixed(2);
};

export default OrdiniList;