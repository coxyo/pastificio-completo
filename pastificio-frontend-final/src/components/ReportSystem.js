// src/components/ReportSystem.js
import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Box, Grid, Button, 
  TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Tabs, Tab, Divider, CircularProgress, Alert, Card, CardContent 
} from '@mui/material';
import { 
  DownloadOutlined, BarChart, PieChart, CalendarToday,
  FilterAlt, Sort, RestartAlt
} from '@mui/icons-material';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { LoggingService } from '../services/loggingService';
import { CacheService } from '../services/cacheService';

import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Registra componenti ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const ReportSystem = ({ ordini: ordiniProp = [] }) => {
  // Stati per gestione dati e filtri
  const [ordini, setOrdini] = useState([]);
  const [dataInizio, setDataInizio] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dataFine, setDataFine] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [categoriaFiltro, setCategoriaFiltro] = useState('tutti');
  const [tipoReport, setTipoReport] = useState('vendite');
  const [periodicitaReport, setPeriodicitaReport] = useState('giornaliero');
  const [formatoExport, setFormatoExport] = useState('excel');
  const [ordinamento, setOrdinamento] = useState('data');
  const [ordinamentoDirezione, setOrdinamentoDirezione] = useState('desc');
  
  // Stati per UI
  const [caricamento, setCaricamento] = useState(true);
  const [tabAttivo, setTabAttivo] = useState(0);
  const [errore, setErrore] = useState(null);
  const [datiReport, setDatiReport] = useState([]);
  const [datiGrafico, setDatiGrafico] = useState(null);
  const [statistiche, setStatistiche] = useState({
    totaleVendite: 0,
    mediaPeriodo: 0,
    prodottoPiùVenduto: '-',
    numeroOrdini: 0,
    clientePiùFrequente: '-'
  });

  // Carica ordini all'avvio o quando cambiano i filtri
  useEffect(() => {
    const caricaOrdini = async () => {
      try {
        setCaricamento(true);
        setErrore(null);
        
        let datiOrdini = [];
        
        // Se ci sono ordini passati come prop, usali
        if (ordiniProp && ordiniProp.length > 0) {
          datiOrdini = ordiniProp;
        } else {
          // Altrimenti carica dal server o dalla cache
          try {
            const response = await fetch('http://localhost:5000/api/ordini', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              datiOrdini = data.data || [];
            } else {
              throw new Error('Errore nel caricamento ordini');
            }
          } catch (error) {
            LoggingService.warn('Fallback alla cache per i report', error);
            const cachedData = CacheService.getFromCache();
            datiOrdini = cachedData?.ordini || [];
          }
        }
        
        // Valida i dati
        const ordiniValidi = Array.isArray(datiOrdini) ? datiOrdini : [];
        setOrdini(ordiniValidi);
        LoggingService.info('Dati report caricati', { numeroOrdini: ordiniValidi.length });
        
        // Genera report in base ai filtri correnti
        if (ordiniValidi.length > 0) {
          generaReport(ordiniValidi);
        }
      } catch (error) {
        LoggingService.error('Errore caricamento dati report', error);
        setErrore('Errore nel caricamento dei dati. Riprova più tardi.');
      } finally {
        setCaricamento(false);
      }
    };
    
    caricaOrdini();
  }, [ordiniProp, dataInizio, dataFine, categoriaFiltro, tipoReport, periodicitaReport, ordinamento, ordinamentoDirezione]);
  
  // Genera report in base ai filtri applicati
  const generaReport = (datiOrdini) => {
    try {
      // Valida input
      if (!Array.isArray(datiOrdini) || datiOrdini.length === 0) {
        setDatiReport([]);
        setDatiGrafico(null);
        return;
      }

      // Filtra per date
      const inizio = startOfDay(parseISO(dataInizio));
      const fine = endOfDay(parseISO(dataFine));
      
      let ordiniFiltrati = datiOrdini.filter(ordine => {
        try {
          if (!ordine.dataRitiro) return false;
          const dataOrdine = parseISO(ordine.dataRitiro);
          return dataOrdine >= inizio && dataOrdine <= fine;
        } catch (e) {
          return false;
        }
      });
      
      // Filtra per categoria prodotto
      if (categoriaFiltro !== 'tutti') {
        ordiniFiltrati = ordiniFiltrati.filter(ordine => {
          if (!ordine.prodotti || !Array.isArray(ordine.prodotti)) return false;
          
          return ordine.prodotti.some(prodotto => {
            if (!prodotto || !prodotto.prodotto) return false;
            
            // Determina categoria
            let categoria = 'altro';
            const nomeProdotto = prodotto.prodotto.toLowerCase();
            
            if (nomeProdotto.includes('pasta') || nomeProdotto.includes('ravioli')) {
              categoria = 'pasta';
            } else if (nomeProdotto.includes('dolc') || nomeProdotto.includes('torta')) {
              categoria = 'dolci';
            } else if (nomeProdotto.includes('panada')) {
              categoria = 'panadas';
            }
            
            return categoria === categoriaFiltro;
          });
        });
      }
      
      // Genera i dati del report in base al tipo selezionato
      switch (tipoReport) {
        case 'vendite':
          generaReportVendite(ordiniFiltrati);
          break;
        case 'prodotti':
          generaReportProdotti(ordiniFiltrati);
          break;
        case 'clienti':
          generaReportClienti(ordiniFiltrati);
          break;
        default:
          generaReportVendite(ordiniFiltrati);
      }
    } catch (error) {
      LoggingService.error('Errore generazione report', error);
      setErrore('Errore nella generazione del report. Controlla i parametri inseriti.');
    }
  };
  
  // Report vendite per periodo
  const generaReportVendite = (ordiniFiltrati) => {
    try {
      // Aggrega dati per periodo
      const venditePeriodo = {};
      
      ordiniFiltrati.forEach(ordine => {
        if (!ordine.prodotti || !Array.isArray(ordine.prodotti)) return;
        
        const dataOrdine = parseISO(ordine.dataRitiro);
        let chiavePeriodo;
        
        // Determina la chiave del periodo in base alla periodicità selezionata
        switch (periodicitaReport) {
          case 'giornaliero':
            chiavePeriodo = format(dataOrdine, 'yyyy-MM-dd');
            break;
          case 'settimanale':
            const inizioSettimana = startOfWeek(dataOrdine, { locale: it });
            chiavePeriodo = format(inizioSettimana, 'yyyy-MM-dd');
            break;
          case 'mensile':
            chiavePeriodo = format(dataOrdine, 'yyyy-MM');
            break;
          default:
            chiavePeriodo = format(dataOrdine, 'yyyy-MM-dd');
        }
        
        // Inizializza il periodo se non esiste
        if (!venditePeriodo[chiavePeriodo]) {
          venditePeriodo[chiavePeriodo] = {
            periodo: chiavePeriodo,
            etichetta: '',
            numeroOrdini: 0,
            totaleVendite: 0,
            prodotti: {}
          };
          
          // Formatta l'etichetta del periodo
          switch (periodicitaReport) {
            case 'giornaliero':
              venditePeriodo[chiavePeriodo].etichetta = format(parseISO(chiavePeriodo), 'EEEE d MMMM', { locale: it });
              break;
            case 'settimanale':
              const fineSett = endOfWeek(parseISO(chiavePeriodo), { locale: it });
              venditePeriodo[chiavePeriodo].etichetta = `${format(parseISO(chiavePeriodo), 'd MMM', { locale: it })} - ${format(fineSett, 'd MMM', { locale: it })}`;
              break;
            case 'mensile':
              venditePeriodo[chiavePeriodo].etichetta = format(parseISO(`${chiavePeriodo}-01`), 'MMMM yyyy', { locale: it });
              break;
          }
        }
        
        // Incrementa conteggio ordini
        venditePeriodo[chiavePeriodo].numeroOrdini++;
        
        // Calcola totale vendite
        const totaleOrdine = ordine.prodotti.reduce((sum, prod) => {
          const prezzo = parseFloat(prod.prezzo) || 0;
          const quantita = parseFloat(prod.quantita) || 0;
          return sum + (prezzo * quantita);
        }, 0);
        venditePeriodo[chiavePeriodo].totaleVendite += totaleOrdine;
        
        // Aggrega dati prodotti
        ordine.prodotti.forEach(prod => {
          if (!prod || !prod.prodotto) return;
          const nomeProdotto = prod.prodotto;
          
          if (!venditePeriodo[chiavePeriodo].prodotti[nomeProdotto]) {
            venditePeriodo[chiavePeriodo].prodotti[nomeProdotto] = {
              quantita: 0,
              valore: 0
            };
          }
          
          const prezzo = parseFloat(prod.prezzo) || 0;
          const quantita = parseFloat(prod.quantita) || 0;
          
          venditePeriodo[chiavePeriodo].prodotti[nomeProdotto].quantita += quantita;
          venditePeriodo[chiavePeriodo].prodotti[nomeProdotto].valore += (prezzo * quantita);
        });
      });
      
      // Converti in array e ordina
      let reportData = Object.values(venditePeriodo);
      
      // Applica ordinamento
      switch (ordinamento) {
        case 'data':
          reportData.sort((a, b) => a.periodo.localeCompare(b.periodo));
          break;
        case 'valore':
          reportData.sort((a, b) => a.totaleVendite - b.totaleVendite);
          break;
        case 'ordini':
          reportData.sort((a, b) => a.numeroOrdini - b.numeroOrdini);
          break;
      }
      
      // Applica direzione ordinamento
      if (ordinamentoDirezione === 'desc') {
        reportData.reverse();
      }
      
      setDatiReport(reportData);
      
      // Prepara dati per il grafico
      const labels = reportData.map(item => item.etichetta);
      const datasetVendite = reportData.map(item => item.totaleVendite);
      const datasetOrdini = reportData.map(item => item.numeroOrdini);
      
      setDatiGrafico({
        labels,
        datasets: [
          {
            label: 'Vendite (€)',
            data: datasetVendite,
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            borderColor: 'rgba(53, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Numero Ordini',
            data: datasetOrdini,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      });
      
      // Calcola statistiche generali
      const totaleVendite = reportData.reduce((sum, item) => sum + item.totaleVendite, 0);
      const numeroOrdini = reportData.reduce((sum, item) => sum + item.numeroOrdini, 0);
      
      // Trova prodotto più venduto
      const prodottiAggregati = {};
      reportData.forEach(item => {
        Object.entries(item.prodotti).forEach(([nome, dati]) => {
          if (!prodottiAggregati[nome]) {
            prodottiAggregati[nome] = {
              quantita: 0,
              valore: 0
            };
          }
          prodottiAggregati[nome].quantita += dati.quantita;
          prodottiAggregati[nome].valore += dati.valore;
        });
      });
      
      let prodottoPiùVenduto = '-';
      let maxQuantita = 0;
      
      Object.entries(prodottiAggregati).forEach(([nome, dati]) => {
        if (dati.quantita > maxQuantita) {
          maxQuantita = dati.quantita;
          prodottoPiùVenduto = nome;
        }
      });
      
      // Trova cliente più frequente
      const clientiFrequenza = {};
      ordiniFiltrati.forEach(ordine => {
        if (ordine.nomeCliente) {
          const cliente = ordine.nomeCliente;
          clientiFrequenza[cliente] = (clientiFrequenza[cliente] || 0) + 1;
        }
      });
      
      let clientePiùFrequente = '-';
      let maxFrequenza = 0;
      
      Object.entries(clientiFrequenza).forEach(([cliente, frequenza]) => {
        if (frequenza > maxFrequenza) {
          maxFrequenza = frequenza;
          clientePiùFrequente = cliente;
        }
      });
      
      setStatistiche({
        totaleVendite: totaleVendite.toFixed(2),
        mediaPeriodo: reportData.length > 0 ? (totaleVendite / reportData.length).toFixed(2) : 0,
        prodottoPiùVenduto,
        numeroOrdini,
        clientePiùFrequente
      });
    } catch (error) {
      LoggingService.error('Errore in generaReportVendite', error);
      setErrore('Errore nella generazione del report vendite');
    }
  };
  
  // Report per prodotti
  const generaReportProdotti = (ordiniFiltrati) => {
    try {
      // Aggrega dati per prodotto
      const prodottiAggregati = {};
      
      ordiniFiltrati.forEach(ordine => {
        if (!ordine.prodotti || !Array.isArray(ordine.prodotti)) return;
        
        ordine.prodotti.forEach(prod => {
          if (!prod || !prod.prodotto) return;
          const nomeProdotto = prod.prodotto;
          
          if (!prodottiAggregati[nomeProdotto]) {
            prodottiAggregati[nomeProdotto] = {
              prodotto: nomeProdotto,
              quantita: 0,
              valore: 0,
              numeroOrdini: 0,
              categoria: determinaCategoria(nomeProdotto)
            };
          }
          
          const prezzo = parseFloat(prod.prezzo) || 0;
          const quantita = parseFloat(prod.quantita) || 0;
          
          prodottiAggregati[nomeProdotto].quantita += quantita;
          prodottiAggregati[nomeProdotto].valore += (prezzo * quantita);
          prodottiAggregati[nomeProdotto].numeroOrdini += 1;
        });
      });
      
      // Converti in array e ordina
      let reportData = Object.values(prodottiAggregati);
      
      // Applica ordinamento
      switch (ordinamento) {
        case 'nome':
          reportData.sort((a, b) => a.prodotto.localeCompare(b.prodotto));
          break;
        case 'valore':
          reportData.sort((a, b) => a.valore - b.valore);
          break;
        case 'quantita':
          reportData.sort((a, b) => a.quantita - b.quantita);
          break;
      }
      
      // Applica direzione ordinamento
      if (ordinamentoDirezione === 'desc') {
        reportData.reverse();
      }
      
      setDatiReport(reportData);
      
      // Prepara dati per il grafico a torta
      // Aggrega per categoria per il grafico
      const categorieAggr = {};
      reportData.forEach(item => {
        if (!categorieAggr[item.categoria]) {
          categorieAggr[item.categoria] = 0;
        }
        categorieAggr[item.categoria] += item.valore;
      });
      
      const backgroundColors = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)'
      ];
      
      const borderColors = [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)'
      ];
      
      setDatiGrafico({
        labels: Object.keys(categorieAggr),
        datasets: [
          {
            data: Object.values(categorieAggr),
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
          }
        ]
      });
      
      // Calcola statistiche generali
      const totaleVendite = reportData.reduce((sum, item) => sum + item.valore, 0);
      const prodottoPiùVenduto = reportData.length > 0 ? 
        reportData.reduce((prev, current) => (prev.quantita > current.quantita) ? prev : current).prodotto : '-';
      
      setStatistiche({
        totaleVendite: totaleVendite.toFixed(2),
        mediaPeriodo: reportData.length > 0 ? (totaleVendite / reportData.length).toFixed(2) : 0,
        prodottoPiùVenduto,
        numeroOrdini: ordiniFiltrati.length,
        clientePiùFrequente: '-' // Non rilevante per questo report
      });
    } catch (error) {
      LoggingService.error('Errore in generaReportProdotti', error);
      setErrore('Errore nella generazione del report prodotti');
    }
  };
  
  // Report per clienti
  const generaReportClienti = (ordiniFiltrati) => {
    try {
      // Aggrega dati per cliente
      const clientiAggregati = {};
      
      ordiniFiltrati.forEach(ordine => {
        if (!ordine.nomeCliente) return;
        const cliente = ordine.nomeCliente;
        
        if (!clientiAggregati[cliente]) {
          clientiAggregati[cliente] = {
            cliente,
            numeroOrdini: 0,
            totaleSpeso: 0,
            mediaPerOrdine: 0,
            prodottiPreferiti: {}
          };
        }
        
        clientiAggregati[cliente].numeroOrdini++;
        
        if (ordine.prodotti && Array.isArray(ordine.prodotti)) {
          const totaleOrdine = ordine.prodotti.reduce((sum, prod) => {
            const prezzo = parseFloat(prod.prezzo) || 0;
            const quantita = parseFloat(prod.quantita) || 0;
            return sum + (prezzo * quantita);
          }, 0);
          clientiAggregati[cliente].totaleSpeso += totaleOrdine;
          
          // Calcola prodotti preferiti
          ordine.prodotti.forEach(prod => {
            if (!prod || !prod.prodotto) return;
            const nomeProdotto = prod.prodotto;
            
            if (!clientiAggregati[cliente].prodottiPreferiti[nomeProdotto]) {
              clientiAggregati[cliente].prodottiPreferiti[nomeProdotto] = {
                quantita: 0,
                valore: 0
              };
            }
            
            const prezzo = parseFloat(prod.prezzo) || 0;
            const quantita = parseFloat(prod.quantita) || 0;
            
            clientiAggregati[cliente].prodottiPreferiti[nomeProdotto].quantita += quantita;
            clientiAggregati[cliente].prodottiPreferiti[nomeProdotto].valore += (prezzo * quantita);
          });
        }
      });
      
      // Calcola media per ordine
      Object.values(clientiAggregati).forEach(cliente => {
        cliente.mediaPerOrdine = cliente.numeroOrdini > 0 ? 
          cliente.totaleSpeso / cliente.numeroOrdini : 0;
        
        // Trova prodotto preferito
        let prodottoPreferito = '-';
        let maxQuantita = 0;
        
        Object.entries(cliente.prodottiPreferiti).forEach(([nome, dati]) => {
          if (dati.quantita > maxQuantita) {
            maxQuantita = dati.quantita;
            prodottoPreferito = nome;
          }
        });
        
        cliente.prodottoPreferito = prodottoPreferito;
      });
      
      // Converti in array e ordina
      let reportData = Object.values(clientiAggregati);
      
      // Applica ordinamento
      switch (ordinamento) {
        case 'nome':
          reportData.sort((a, b) => a.cliente.localeCompare(b.cliente));
          break;
        case 'spesa':
          reportData.sort((a, b) => a.totaleSpeso - b.totaleSpeso);
          break;
        case 'ordini':
          reportData.sort((a, b) => a.numeroOrdini - b.numeroOrdini);
          break;
        case 'media':
          reportData.sort((a, b) => a.mediaPerOrdine - b.mediaPerOrdine);
          break;
      }
      
      // Applica direzione ordinamento
      if (ordinamentoDirezione === 'desc') {
        reportData.reverse();
      }
      
      setDatiReport(reportData);
      
      // Prepara dati per il grafico (top 10 clienti per spesa)
      const top10Clienti = [...reportData]
        .sort((a, b) => b.totaleSpeso - a.totaleSpeso)
        .slice(0, 10);
      
      const labels = top10Clienti.map(item => item.cliente);
      const datasetSpesa = top10Clienti.map(item => item.totaleSpeso);
      const datasetOrdini = top10Clienti.map(item => item.numeroOrdini);
      
      setDatiGrafico({
        labels,
        datasets: [
          {
            label: 'Totale Speso (€)',
            data: datasetSpesa,
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            borderColor: 'rgba(53, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Numero Ordini',
            data: datasetOrdini,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      });
      
      // Calcola statistiche generali
      const totaleVendite = reportData.reduce((sum, item) => sum + item.totaleSpeso, 0);
      const clientePiùFrequente = reportData.length > 0 ? 
        reportData.reduce((prev, current) => (prev.numeroOrdini > current.numeroOrdini) ? prev : current).cliente : '-';
      
      setStatistiche({
        totaleVendite: totaleVendite.toFixed(2),
        mediaPeriodo: reportData.length > 0 ? (totaleVendite / reportData.length).toFixed(2) : 0,
        prodottoPiùVenduto: '-', // Non rilevante per questo report
        numeroOrdini: ordiniFiltrati.length,
        clientePiùFrequente
      });
    } catch (error) {
      LoggingService.error('Errore in generaReportClienti', error);
      setErrore('Errore nella generazione del report clienti');
    }
  };
  
  // Helper per determinare la categoria di un prodotto
  const determinaCategoria = (nomeProdotto) => {
    if (!nomeProdotto) return 'altro';
    nomeProdotto = nomeProdotto.toLowerCase();
    
    if (nomeProdotto.includes('panada')) {
      return 'panadas';
    } else if (nomeProdotto.includes('pasta') || nomeProdotto.includes('ravioli') || 
               nomeProdotto.includes('culurgiones') || nomeProdotto.includes('fregola')) {
      return 'pasta';
    } else if (nomeProdotto.includes('dolc') || nomeProdotto.includes('torta') ||
               nomeProdotto.includes('amaretti') || nomeProdotto.includes('ciambelle') ||
               nomeProdotto.includes('pardulas')) {
      return 'dolci';
    } else {
      return 'altro';
    }
  };
  
  // Funzione per esportare report
  const esportaReport = () => {
    try {
      LoggingService.info('Esportazione report', { tipo: tipoReport, formato: formatoExport });
      
      let datiEsportazione;
      let nomeFile;
      
      // Prepara i dati in base al tipo di report
      switch (tipoReport) {
        case 'vendite':
          datiEsportazione = datiReport.map(item => ({
            Periodo: item.etichetta,
            'Numero Ordini': item.numeroOrdini,
            'Totale Vendite': item.totaleVendite.toFixed(2),
            'Media per Ordine': item.numeroOrdini > 0 ? (item.totaleVendite / item.numeroOrdini).toFixed(2) : '0.00'
          }));
          nomeFile = `report_vendite_${format(new Date(), 'yyyyMMdd')}`;
          break;
        case 'prodotti':
          datiEsportazione = datiReport.map(item => ({
            Prodotto: item.prodotto,
            Categoria: item.categoria,
            Quantità: item.quantita.toFixed(2),
            'Valore Totale': item.valore.toFixed(2),
            'Numero Ordini': item.numeroOrdini
          }));
          nomeFile = `report_prodotti_${format(new Date(), 'yyyyMMdd')}`;
          break;
        case 'clienti':
          datiEsportazione = datiReport.map(item => ({
            Cliente: item.cliente,
            'Numero Ordini': item.numeroOrdini,
            'Totale Speso': item.totaleSpeso.toFixed(2),
            'Media per Ordine': item.mediaPerOrdine.toFixed(2),
            'Prodotto Preferito': item.prodottoPreferito
          }));
          nomeFile = `report_clienti_${format(new Date(), 'yyyyMMdd')}`;
          break;
        default:
          datiEsportazione = [];
      }
      
      // Esporta nel formato selezionato
      switch (formatoExport) {
        case 'excel':
          esportaExcel(datiEsportazione, nomeFile);
          break;
        case 'csv':
          esportaCSV(datiEsportazione, nomeFile);
          break;
        case 'pdf':
          esportaPDF(datiEsportazione, nomeFile);
          break;
        case 'json':
          esportaJSON(datiEsportazione, nomeFile);
          break;
      }
    } catch (error) {
      LoggingService.error('Errore esportazione report', error);
      setErrore('Errore nell\'esportazione del report. Riprova più tardi.');
    }
  };
  
  // Funzioni di esportazione
  const esportaExcel = (dati, nomeFile) => {
    // In un'implementazione reale, utilizzerai librerie come ExcelJS
    // Per ora simula il download di un file JSON
    const json = JSON.stringify(dati, null, 2);
    downloadFile(json, `${nomeFile}.json`, 'application/json');
    LoggingService.info('Report esportato in formato JSON (simulazione Excel)');
  };
  
  const esportaCSV = (dati, nomeFile) => {
    if (!dati || dati.length === 0) {
      setErrore('Nessun dato da esportare');
      return;
    }
    
    // Ottieni headers dalle chiavi del primo oggetto
    const headers = Object.keys(dati[0]);
    
    // Crea righe CSV
    const csvRows = [
      headers.join(','), // Headers
      ...dati.map(row => 
        headers.map(key => {
          const value = row[key];
          // Gestisci valori con virgole e null/undefined
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ];
    
    // Unisci tutte le righe con newline
    const csvString = csvRows.join('\n');
    
    // Download file
    downloadFile(csvString, `${nomeFile}.csv`, 'text/csv');
    LoggingService.info('Report esportato in formato CSV');
  };
  
  const esportaPDF = (dati, nomeFile) => {
    // In un'implementazione reale, utilizzerai librerie come pdfmake o jsPDF
    // Per ora simula il download di un file JSON
    const json = JSON.stringify(dati, null, 2);
    downloadFile(json, `${nomeFile}.json`, 'application/json');
    LoggingService.info('Report esportato in formato JSON (simulazione PDF)');
  };
  
  const esportaJSON = (dati, nomeFile) => {
    const json = JSON.stringify(dati, null, 2);
    downloadFile(json, `${nomeFile}.json`, 'application/json');
    LoggingService.info('Report esportato in formato JSON');
  };
  
  // Helper per download file
  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };
  
  // Handler per cambio tab
  const handleTabChange = (event, newValue) => {
    setTabAttivo(newValue);
  };
  
  // Selettori rapidi di periodi
  const selezionaPeriodo = (periodo) => {
    const oggi = new Date();
    
    switch (periodo) {
      case 'oggi':
        setDataInizio(format(oggi, 'yyyy-MM-dd'));
        setDataFine(format(oggi, 'yyyy-MM-dd'));
        break;
      case 'ieri':
        const ieri = subDays(oggi, 1);
        setDataInizio(format(ieri, 'yyyy-MM-dd'));
        setDataFine(format(ieri, 'yyyy-MM-dd'));
        break;
      case 'settimana':
        setDataInizio(format(startOfWeek(oggi, { locale: it }), 'yyyy-MM-dd'));
        setDataFine(format(oggi, 'yyyy-MM-dd'));
        break;
      case 'settimana_prec':
        const inizioSettPrec = startOfWeek(subWeeks(oggi, 1), { locale: it });
        const fineSettPrec = endOfWeek(inizioSettPrec, { locale: it });
        setDataInizio(format(inizioSettPrec, 'yyyy-MM-dd'));
        setDataFine(format(fineSettPrec, 'yyyy-MM-dd'));
        break;
      case 'mese':
        setDataInizio(format(startOfMonth(oggi), 'yyyy-MM-dd'));
        setDataFine(format(oggi, 'yyyy-MM-dd'));
        break;
      case 'mese_prec':
        const mesePrecedente = subMonths(oggi, 1);
        setDataInizio(format(startOfMonth(mesePrecedente), 'yyyy-MM-dd'));
        setDataFine(format(endOfMonth(mesePrecedente), 'yyyy-MM-dd'));
        break;
      case '30giorni':
        setDataInizio(format(subDays(oggi, 30), 'yyyy-MM-dd'));
        setDataFine(format(oggi, 'yyyy-MM-dd'));
        break;
    }
  };
  
  // Resetta tutti i filtri
  const resetFiltri = () => {
    setDataInizio(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    setDataFine(format(new Date(), 'yyyy-MM-dd'));
    setCategoriaFiltro('tutti');
    setTipoReport('vendite');
    setPeriodicitaReport('giornaliero');
    setOrdinamento('data');
    setOrdinamentoDirezione('desc');
  };
  
  // Componente per tabella report vendite
  const TabellaReportVendite = ({ dati }) => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Periodo</TableCell>
            <TableCell align="right">N° Ordini</TableCell>
            <TableCell align="right">Totale Vendite (€)</TableCell>
            <TableCell align="right">Media per Ordine (€)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dati && dati.length > 0 ? (
            dati.map((row, index) => (
              <TableRow key={index} hover>
                <TableCell>{row.etichetta}</TableCell>
                <TableCell align="right">{row.numeroOrdini}</TableCell>
                <TableCell align="right">{row.totaleVendite.toFixed(2)}</TableCell>
                <TableCell align="right">
                  {row.numeroOrdini > 0 ? (row.totaleVendite / row.numeroOrdini).toFixed(2) : '0.00'}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} align="center">
                Nessun dato disponibile
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
  
  // Componente per tabella report prodotti
  const TabellaReportProdotti = ({ dati }) => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Prodotto</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell align="right">Quantità</TableCell>
            <TableCell align="right">Valore (€)</TableCell>
            <TableCell align="right">N° Ordini</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dati && dati.length > 0 ? (
            dati.map((row, index) => (
              <TableRow key={index} hover>
                <TableCell>{row.prodotto}</TableCell>
                <TableCell>{row.categoria}</TableCell>
                <TableCell align="right">{row.quantita.toFixed(2)}</TableCell>
                <TableCell align="right">{row.valore.toFixed(2)}</TableCell>
                <TableCell align="right">{row.numeroOrdini}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center">
                Nessun dato disponibile
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
  
  // Componente per tabella report clienti
  const TabellaReportClienti = ({ dati }) => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Cliente</TableCell>
            <TableCell align="right">N° Ordini</TableCell>
            <TableCell align="right">Totale Speso (€)</TableCell>
            <TableCell align="right">Media per Ordine (€)</TableCell>
            <TableCell>Prodotto Preferito</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dati && dati.length > 0 ? (
            dati.map((row, index) => (
              <TableRow key={index} hover>
                <TableCell>{row.cliente}</TableCell>
                <TableCell align="right">{row.numeroOrdini}</TableCell>
                <TableCell align="right">{row.totaleSpeso.toFixed(2)}</TableCell>
                <TableCell align="right">{row.mediaPerOrdine.toFixed(2)}</TableCell>
                <TableCell>{row.prodottoPreferito}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center">
                Nessun dato disponibile
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
  
  // Opzioni per i grafici
  const opzioniBarChart = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Valore (€)'
        }
      },
      y1: {
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Numero'
        },
        grid: {
          drawOnChartArea: false
        }
      },
      x: {
        title: {
          display: true,
          text: 'Periodo'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Andamento Vendite'
      }
    }
  };
  
  const opzioniPieChart = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      },
      title: {
        display: true,
        text: 'Distribuzione Categorie'
      }
    }
  };
  
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Sistema di Report
      </Typography>
      
      {/* Sezione filtri */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtri e Opzioni Report
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo Report</InputLabel>
              <Select
                value={tipoReport}
                onChange={(e) => setTipoReport(e.target.value)}
                label="Tipo Report"
              >
                <MenuItem value="vendite">Report Vendite</MenuItem>
                <MenuItem value="prodotti">Report Prodotti</MenuItem>
                <MenuItem value="clienti">Report Clienti</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {tipoReport === 'vendite' && (
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Periodicità</InputLabel>
                <Select
                  value={periodicitaReport}
                  onChange={(e) => setPeriodicitaReport(e.target.value)}
                  label="Periodicità"
                >
                  <MenuItem value="giornaliero">Giornaliera</MenuItem>
                  <MenuItem value="settimanale">Settimanale</MenuItem>
                  <MenuItem value="mensile">Mensile</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoria Prodotti</InputLabel>
              <Select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                label="Categoria Prodotti"
              >
                <MenuItem value="tutti">Tutte le categorie</MenuItem>
                <MenuItem value="pasta">Pasta</MenuItem>
                <MenuItem value="dolci">Dolci</MenuItem>
                <MenuItem value="panadas">Panadas</MenuItem>
                <MenuItem value="altro">Altro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              label="Data Inizio"
              type="date"
              fullWidth
              size="small"
              value={dataInizio}
              onChange={(e) => setDataInizio(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              label="Data Fine"
              type="date"
              fullWidth
              size="small"
              value={dataFine}
              onChange={(e) => setDataFine(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Ordinamento</InputLabel>
              <Select
                value={ordinamento}
                onChange={(e) => setOrdinamento(e.target.value)}
                label="Ordinamento"
              >
                {tipoReport === 'vendite' && (
                  <>
                    <MenuItem value="data">Data</MenuItem>
                    <MenuItem value="valore">Valore</MenuItem>
                    <MenuItem value="ordini">Numero Ordini</MenuItem>
                  </>
                )}
                {tipoReport === 'prodotti' && (
                  <>
                    <MenuItem value="nome">Nome</MenuItem>
                    <MenuItem value="valore">Valore</MenuItem>
                    <MenuItem value="quantita">Quantità</MenuItem>
                  </>
                )}
                {tipoReport === 'clienti' && (
                  <>
                    <MenuItem value="nome">Nome</MenuItem>
                    <MenuItem value="spesa">Totale Speso</MenuItem>
                    <MenuItem value="ordini">Numero Ordini</MenuItem>
                    <MenuItem value="media">Media per Ordine</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Direzione</InputLabel>
              <Select
                value={ordinamentoDirezione}
                onChange={(e) => setOrdinamentoDirezione(e.target.value)}
                label="Direzione"
              >
                <MenuItem value="asc">Crescente</MenuItem>
                <MenuItem value="desc">Decrescente</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<CalendarToday />}
            onClick={() => selezionaPeriodo('oggi')}
          >
            Oggi
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => selezionaPeriodo('ieri')}
          >
            Ieri
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => selezionaPeriodo('settimana')}
          >
            Questa Settimana
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => selezionaPeriodo('settimana_prec')}
          >
            Settimana Scorsa
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => selezionaPeriodo('mese')}
          >
            Questo Mese
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => selezionaPeriodo('mese_prec')}
          >
            Mese Scorso
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => selezionaPeriodo('30giorni')}
          >
            Ultimi 30 Giorni
          </Button>
          <Button 
            variant="outlined" 
            color="warning"
            size="small"
            startIcon={<RestartAlt />}
            onClick={resetFiltri}
          >
            Reset Filtri
          </Button>
        </Box>
      </Paper>
      
      {/* Sezione export */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            Esporta Report:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={formatoExport}
              onChange={(e) => setFormatoExport(e.target.value)}
              displayEmpty
            >
              <MenuItem value="excel">Excel</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Button 
          variant="contained" 
          startIcon={<DownloadOutlined />}
          onClick={esportaReport}
          disabled={datiReport.length === 0 || caricamento}
        >
          Esporta
        </Button>
      </Paper>
      
      {/* Notifica errore */}
      {errore && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrore(null)}>
          {errore}
        </Alert>
      )}
      
      {/* KPI principali */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Totale Vendite
              </Typography>
              <Typography variant="h4">
                €{statistiche.totaleVendite}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Media per Periodo
              </Typography>
              <Typography variant="h4">
                €{statistiche.mediaPeriodo}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Prodotto Più Venduto
              </Typography>
              <Typography variant="h6" noWrap>
                {statistiche.prodottoPiùVenduto}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Numero Ordini
              </Typography>
              <Typography variant="h4">
                {statistiche.numeroOrdini}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Cliente Più Frequente
              </Typography>
              <Typography variant="h6" noWrap>
                {statistiche.clientePiùFrequente}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Contenuto principale */}
      <Paper sx={{ p: 2 }}>
        <Tabs 
          value={tabAttivo} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab icon={<BarChart />} label="Grafici" iconPosition="start" />
          <Tab icon={<FilterAlt />} label="Dati" iconPosition="start" />
        </Tabs>
        
        {caricamento ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {tabAttivo === 0 && (
              <Box sx={{ height: 400, position: 'relative' }}>
                {datiGrafico && datiGrafico.labels && datiGrafico.labels.length > 0 ? (
                  tipoReport === 'prodotti' ? (
                    <Pie data={datiGrafico} options={opzioniPieChart} />
                  ) : (
                    <Bar data={datiGrafico} options={opzioniBarChart} />
                  )
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
                    Nessun dato disponibile per il grafico
                  </Typography>
                )}
              </Box>
            )}
            
            {tabAttivo === 1 && (
              <>
                {tipoReport === 'vendite' && <TabellaReportVendite dati={datiReport} />}
                {tipoReport === 'prodotti' && <TabellaReportProdotti dati={datiReport} />}
                {tipoReport === 'clienti' && <TabellaReportClienti dati={datiReport} />}
              </>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default ReportSystem;