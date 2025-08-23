// controllers/reportController.js
import Ordine from '../models/Ordine.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { it } from 'date-fns/locale';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Genera report ordini per periodo
export const generaReportOrdini = async (req, res) => {
  try {
    const { periodo = 'giorno', formato = 'pdf' } = req.query;
    
    // Controllo validità formato
    if (!['pdf', 'excel', 'csv'].includes(formato)) {
      return res.status(400).json({
        success: false,
        error: 'Formato non valido. Formati supportati: pdf, excel, csv'
      });
    }
    
    // Determina intervallo date in base al periodo
    const oggi = new Date();
    let startDate, endDate, periodoLabel;
    
    switch (periodo) {
      case 'giorno':
        startDate = startOfDay(oggi);
        endDate = endOfDay(oggi);
        periodoLabel = format(oggi, 'dd/MM/yyyy', { locale: it });
        break;
      case 'settimana':
        startDate = startOfWeek(oggi, { weekStartsOn: 1 });
        endDate = endOfWeek(oggi, { weekStartsOn: 1 });
        periodoLabel = `${format(startDate, 'dd/MM', { locale: it })} - ${format(endDate, 'dd/MM/yyyy', { locale: it })}`;
        break;
      case 'mese':
        startDate = startOfMonth(oggi);
        endDate = endOfMonth(oggi);
        periodoLabel = format(oggi, 'MMMM yyyy', { locale: it });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Periodo non valido. Periodi supportati: giorno, settimana, mese'
        });
    }
    
    // Recupera ordini nel periodo specificato
    const ordini = await Ordine.find({
      dataRitiro: { $gte: startDate, $lte: endDate }
    }).sort({ dataRitiro: 1, oraRitiro: 1 });
    
    // Genera il report nel formato richiesto
    switch (formato) {
      case 'pdf':
        return generaPDF(res, ordini, periodoLabel, periodo);
      case 'excel':
        return generaExcel(res, ordini, periodoLabel, periodo);
      case 'csv':
        return generaCSV(res, ordini, periodoLabel, periodo);
    }
    
  } catch (error) {
    logger.error(`Errore generazione report: ${error.message}`, { 
      service: 'reportController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nella generazione del report'
    });
  }
};

// Genera report per cliente specifico
export const generaReportCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { dataInizio, dataFine, formato = 'pdf' } = req.query;
    
    // Controllo validità formato
    if (!['pdf', 'excel', 'csv'].includes(formato)) {
      return res.status(400).json({
        success: false,
        error: 'Formato non valido. Formati supportati: pdf, excel, csv'
      });
    }
    
    // Costruisci query di filtro
    let filter = { nomeCliente: clienteId };
    if (dataInizio || dataFine) {
      filter.dataRitiro = {};
      if (dataInizio) filter.dataRitiro.$gte = new Date(dataInizio);
      if (dataFine) {
        const endDate = new Date(dataFine);
        endDate.setHours(23, 59, 59, 999);
        filter.dataRitiro.$lte = endDate;
      }
    }
    
    // Recupera ordini per il cliente
    const ordini = await Ordine.find(filter).sort({ dataRitiro: -1 });
    
    // Titolo report
    const periodoLabel = dataInizio && dataFine ? 
      `${format(new Date(dataInizio), 'dd/MM/yyyy', { locale: it })} - ${format(new Date(dataFine), 'dd/MM/yyyy', { locale: it })}` : 
      'Tutti gli ordini';
    
    // Genera il report nel formato richiesto
    switch (formato) {
      case 'pdf':
        return generaPDF(res, ordini, periodoLabel, 'cliente', clienteId);
      case 'excel':
        return generaExcel(res, ordini, periodoLabel, 'cliente', clienteId);
      case 'csv':
        return generaCSV(res, ordini, periodoLabel, 'cliente', clienteId);
    }
    
  } catch (error) {
    logger.error(`Errore generazione report cliente: ${error.message}`, { 
      service: 'reportController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nella generazione del report cliente'
    });
  }
};

// Genera documento di consegna
export const generaDocumentoConsegna = async (req, res) => {
  try {
    const { ordineId } = req.params;
    
    // Recupera ordine
    const ordine = await Ordine.findById(ordineId);
    if (!ordine) {
      return res.status(404).json({
        success: false,
        error: 'Ordine non trovato'
      });
    }
    
    // Crea documento PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // Setup header
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=consegna_${ordineId}.pdf`);
    
    // Pipe PDF alla risposta
    doc.pipe(res);
    
    // Logo e intestazione
    doc.fontSize(24).text('PASTIFICIO NONNA CLAUDIA', { align: 'center' });
    doc.fontSize(16).text('DOCUMENTO DI CONSEGNA', { align: 'center' });
    doc.moveDown();
    
    // Info ordine
    doc.fontSize(12);
    const infoY = doc.y;
    doc.text(`Ordine N°: ${ordineId.slice(-8).toUpperCase()}`, 50, infoY);
    doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy')}`, 400, infoY);
    
    doc.moveDown();
    doc.text(`Cliente: ${ordine.nomeCliente}`);
    doc.text(`Telefono: ${ordine.telefono || 'Non specificato'}`);
    doc.text(`Data Ritiro: ${format(new Date(ordine.dataRitiro), 'dd/MM/yyyy', { locale: it })}`);
    doc.text(`Ora Ritiro: ${ordine.oraRitiro || 'Non specificata'}`);
    
    // Genera QR Code con info ordine
    try {
      const qrData = `ORD:${ordineId}|CLI:${ordine.nomeCliente}|DATA:${ordine.dataRitiro}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 100 });
      const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      doc.image(qrCodeBuffer, 450, 100, { width: 100 });
    } catch (err) {
      logger.error('Errore generazione QR Code:', err);
    }
    
    doc.moveDown(2);
    
    // Tabella prodotti
    doc.fontSize(14).text('Prodotti Ordinati', { underline: true });
    doc.moveDown();
    
    // Intestazione tabella
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = [250, 80, 80, 100];
    
    doc.fontSize(10);
    doc.fillColor('#666666');
    doc.text('Prodotto', tableLeft, tableTop);
    doc.text('Quantità', tableLeft + colWidths[0], tableTop);
    doc.text('Prezzo Un.', tableLeft + colWidths[0] + colWidths[1], tableTop);
    doc.text('Totale', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
    doc.fillColor('black');
    
    // Linea separatrice
    doc.moveTo(tableLeft, tableTop + 15)
       .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
       .stroke();
    
    // Prodotti
    let yPos = tableTop + 20;
    let totale = 0;
    
    ordine.prodotti.forEach((prodotto, index) => {
      const subtotale = (prodotto.quantita * prodotto.prezzo).toFixed(2);
      totale += parseFloat(subtotale);
      
      // Alterna colore righe
      if (index % 2 === 0) {
        doc.rect(tableLeft - 5, yPos - 3, colWidths.reduce((a, b) => a + b, 0) + 10, 20)
           .fill('#f5f5f5')
           .fill('black');
      }
      
      doc.text(prodotto.prodotto, tableLeft, yPos);
      doc.text(`${prodotto.quantita} ${prodotto.unita || ''}`, tableLeft + colWidths[0], yPos);
      doc.text(`€ ${prodotto.prezzo.toFixed(2)}`, tableLeft + colWidths[0] + colWidths[1], yPos);
      doc.text(`€ ${subtotale}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], yPos);
      
      yPos += 20;
      
      // Nuova pagina se necessario
      if (yPos > doc.page.height - 150) {
        doc.addPage();
        yPos = 50;
      }
    });
    
    // Linea separatrice
    doc.moveTo(tableLeft, yPos)
       .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), yPos)
       .stroke();
    
    // Totale
    yPos += 10;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Totale:', tableLeft + colWidths[0] + colWidths[1], yPos);
    doc.text(`€ ${totale.toFixed(2)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], yPos);
    doc.font('Helvetica');
    
    // Note
    if (ordine.note) {
      doc.moveDown(2);
      doc.fontSize(12).text('Note:', { underline: true });
      doc.fontSize(10).text(ordine.note);
    }
    
    // Da viaggio
    if (ordine.daViaggio) {
      doc.moveDown();
      doc.fontSize(10).fillColor('red');
      doc.text('⚠️ ORDINE DA VIAGGIO - PREPARARE PER TRASPORTO', { align: 'center' });
      doc.fillColor('black');
    }
    
    // Firme
    doc.moveDown(4);
    doc.fontSize(10);
    
    const signatureY = doc.page.height - 100;
    doc.text('Firma Operatore', tableLeft, signatureY);
    doc.moveTo(tableLeft, signatureY + 20).lineTo(tableLeft + 150, signatureY + 20).stroke();
    
    doc.text('Firma Cliente', tableLeft + 250, signatureY);
    doc.moveTo(tableLeft + 250, signatureY + 20).lineTo(tableLeft + 400, signatureY + 20).stroke();
    
    // Footer
    doc.fontSize(8).fillColor('#666666');
    doc.text('Pastificio Nonna Claudia - Via Example, 123 - Tel: 070 123456', 50, doc.page.height - 50, {
      align: 'center',
      width: doc.page.width - 100
    });
    
    // Finalizza documento
    doc.end();
    
  } catch (error) {
    logger.error(`Errore generazione documento consegna: ${error.message}`, { 
      service: 'reportController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nella generazione del documento di consegna'
    });
  }
};

// Funzione per generare PDF
const generaPDF = (res, ordini, periodoLabel, tipo, clienteId = null) => {
  // Crea documento PDF
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
  // Setup header
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=report_${tipo}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  
  // Pipe PDF alla risposta
  doc.pipe(res);
  
  // Logo e intestazione
  doc.fontSize(20).text('PASTIFICIO NONNA CLAUDIA', { align: 'center' });
  
  // Titolo report
  let titoloReport;
  switch (tipo) {
    case 'giorno':
      titoloReport = `REPORT GIORNALIERO - ${periodoLabel}`;
      break;
    case 'settimana':
      titoloReport = `REPORT SETTIMANALE - ${periodoLabel}`;
      break;
    case 'mese':
      titoloReport = `REPORT MENSILE - ${periodoLabel}`;
      break;
    case 'cliente':
      titoloReport = `REPORT CLIENTE: ${clienteId}`;
      break;
  }
  
  doc.fontSize(16).text(titoloReport, { align: 'center' });
  doc.moveDown();
  
  // Informazioni report
  doc.fontSize(10).fillColor('#666666');
  doc.text(`Generato il: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it })}`);
  doc.text(`Numero ordini: ${ordini.length}`);
  doc.fillColor('black');
  
  // Calcola statistiche
  const totaleVendite = ordini.reduce((sum, ordine) => {
    const totaleOrdine = ordine.prodotti.reduce((tot, prod) => 
      tot + (prod.quantita * prod.prezzo), 0
    );
    return sum + totaleOrdine;
  }, 0);
  
  doc.text(`Totale vendite: € ${totaleVendite.toFixed(2)}`);
  doc.moveDown();
  
  // Tabella ordini
  doc.fontSize(14).text('Riepilogo Ordini', { underline: true });
  doc.moveDown();
  
  if (ordini.length === 0) {
    doc.fontSize(12).text('Nessun ordine trovato nel periodo selezionato.', { align: 'center' });
  } else {
    // Crea tabella prodotti aggregati
    const prodottiAggregati = {};
    
    ordini.forEach(ordine => {
      ordine.prodotti.forEach(prod => {
        const chiave = `${prod.prodotto}_${prod.unita || 'pz'}`;
        if (!prodottiAggregati[chiave]) {
          prodottiAggregati[chiave] = {
            prodotto: prod.prodotto,
            quantita: 0,
            unita: prod.unita || 'pz',
            valore: 0
          };
        }
        prodottiAggregati[chiave].quantita += prod.quantita;
        prodottiAggregati[chiave].valore += prod.quantita * prod.prezzo;
      });
    });
    
    // Raggruppa per categoria
    const categorie = {
      'Pasta': [],
      'Dolci': [],
      'Panadas': [],
      'Altro': []
    };
    
    Object.values(prodottiAggregati).forEach(prod => {
      const nomeLower = prod.prodotto.toLowerCase();
      if (nomeLower.includes('ravioli') || nomeLower.includes('culurgiones') || 
          nomeLower.includes('fregola') || nomeLower.includes('pasta')) {
        categorie['Pasta'].push(prod);
      } else if (nomeLower.includes('dolc') || nomeLower.includes('torta') || 
                 nomeLower.includes('amaretti') || nomeLower.includes('pardulas')) {
        categorie['Dolci'].push(prod);
      } else if (nomeLower.includes('panada')) {
        categorie['Panadas'].push(prod);
      } else {
        categorie['Altro'].push(prod);
      }
    });
    
    // Stampa tabella per categoria
    doc.fontSize(12);
    let yPos = doc.y;
    
    Object.entries(categorie).forEach(([categoria, prodotti]) => {
      if (prodotti.length > 0) {
        // Intestazione categoria
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(categoria, 50, yPos);
        doc.font('Helvetica');
        yPos += 20;
        
        // Prodotti della categoria
        prodotti.forEach(prod => {
          doc.fontSize(10);
          doc.text(prod.prodotto, 70, yPos, { width: 200 });
          doc.text(`${prod.quantita} ${prod.unita}`, 280, yPos, { width: 100 });
          doc.text(`€ ${prod.valore.toFixed(2)}`, 400, yPos, { width: 100 });
          yPos += 15;
        });
        
        yPos += 10;
        
        // Nuova pagina se necessario
        if (yPos > doc.page.height - 100) {
          doc.addPage();
          yPos = 50;
        }
      }
    });
    
    // Dettaglio ordini (seconda pagina)
    doc.addPage();
    doc.fontSize(14).text('Dettaglio Ordini', { underline: true });
    doc.moveDown();
    
    // Intestazione tabella
    const tableTop = doc.y;
    const tableLeft = 50;
    
    doc.fontSize(9);
    doc.text('Data/Ora', tableLeft, tableTop);
    doc.text('Cliente', tableLeft + 70, tableTop);
    doc.text('Telefono', tableLeft + 170, tableTop);
    doc.text('Prodotti', tableLeft + 250, tableTop);
    doc.text('Totale', tableLeft + 450, tableTop);
    
    // Linea separatrice
    doc.moveTo(tableLeft, tableTop + 15)
       .lineTo(tableLeft + 480, tableTop + 15)
       .stroke();
    
    // Ordini
    yPos = tableTop + 20;
    ordini.forEach((ordine, index) => {
      // Calcola totale ordine
      const totaleOrdine = ordine.prodotti.reduce((tot, prod) => 
        tot + (prod.quantita * prod.prezzo), 0
      );
      
      // Data e ora
      const dataOra = `${format(new Date(ordine.dataRitiro), 'dd/MM', { locale: it })} ${ordine.oraRitiro || '-'}`;
      
      // Prodotti (versione compatta)
      const prodottiStr = ordine.prodotti
        .map(p => `${p.prodotto} (${p.quantita})`)
        .join(', ');
      
      doc.fontSize(8);
      doc.text(dataOra, tableLeft, yPos, { width: 65 });
      doc.text(ordine.nomeCliente, tableLeft + 70, yPos, { width: 95 });
      doc.text(ordine.telefono || '-', tableLeft + 170, yPos, { width: 75 });
      doc.text(prodottiStr, tableLeft + 250, yPos, { width: 195, ellipsis: true });
      doc.text(`€ ${totaleOrdine.toFixed(2)}`, tableLeft + 450, yPos, { width: 60 });
      
      yPos += 20;
      
      // Nuova pagina se necessario
      if (yPos > doc.page.height - 50) {
        doc.addPage();
        yPos = 50;
      }
    });
  }
  
  // Footer
  doc.fontSize(8).fillColor('#666666');
  doc.text(`Pagina ${doc.bufferedPageRange().count}`, 50, doc.page.height - 30);
  
  // Finalizza documento
  doc.end();
};

// Funzione per generare Excel
const generaExcel = async (res, ordini, periodoLabel, tipo, clienteId = null) => {
  // Crea workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Pastificio Nonna Claudia';
  workbook.created = new Date();
  
  // Aggiungi worksheet principale
  const worksheet = workbook.addWorksheet('Report Ordini');
  
  // Intestazione worksheet
  let titoloReport;
  switch (tipo) {
    case 'giorno':
      titoloReport = `REPORT GIORNALIERO - ${periodoLabel}`;
      break;
    case 'settimana':
      titoloReport = `REPORT SETTIMANALE - ${periodoLabel}`;
      break;
    case 'mese':
      titoloReport = `REPORT MENSILE - ${periodoLabel}`;
      break;
    case 'cliente':
      titoloReport = `REPORT CLIENTE: ${clienteId} - ${periodoLabel}`;
      break;
  }
  
  // Intestazione
  worksheet.mergeCells('A1:G1');
  worksheet.getCell('A1').value = 'PASTIFICIO NONNA CLAUDIA';
  worksheet.getCell('A1').font = { bold: true, size: 18 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A2:G2');
  worksheet.getCell('A2').value = titoloReport;
  worksheet.getCell('A2').font = { bold: true, size: 14 };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A3:G3');
  worksheet.getCell('A3').value = `Generato il: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it })}`;
  worksheet.getCell('A3').alignment = { horizontal: 'center' };
  
  // Calcola totale
  const totaleVendite = ordini.reduce((sum, ordine) => {
    const totaleOrdine = ordine.prodotti.reduce((tot, prod) => 
      tot + (prod.quantita * prod.prezzo), 0
    );
    return sum + totaleOrdine;
  }, 0);
  
  worksheet.mergeCells('A4:C4');
  worksheet.getCell('A4').value = `Numero ordini: ${ordini.length}`;
  worksheet.getCell('A4').font = { bold: true };
  
  worksheet.mergeCells('D4:G4');
  worksheet.getCell('D4').value = `Totale vendite: € ${totaleVendite.toFixed(2)}`;
  worksheet.getCell('D4').font = { bold: true };
  
  // Intestazione tabella
  const headers = ['Data Ritiro', 'Ora', 'Cliente', 'Telefono', 'Prodotti', 'Da Viaggio', 'Totale', 'Note'];
  worksheet.addRow([]);
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Dati
  ordini.forEach(ordine => {
    // Calcola totale ordine
    const totaleOrdine = ordine.prodotti.reduce((tot, prod) => 
      tot + (prod.quantita * prod.prezzo), 0
    );
    
    // Prepara dati prodotti
    const prodottiString = ordine.prodotti
      .map(p => `${p.prodotto} (${p.quantita} ${p.unita || ''})`)
      .join(', ');
    
    // Aggiungi riga
    const row = worksheet.addRow([
      format(new Date(ordine.dataRitiro), 'dd/MM/yyyy', { locale: it }),
      ordine.oraRitiro || '-',
      ordine.nomeCliente,
      ordine.telefono || '-',
      prodottiString,
      ordine.daViaggio ? 'SI' : 'NO',
      totaleOrdine,
      ordine.note || ''
    ]);
    
    // Formatta cella totale come valuta
    row.getCell(7).numFmt = '€ #,##0.00';
    
    // Colora riga se da viaggio
    if (ordine.daViaggio) {
      row.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFE0E0' }
        };
      });
    }
  });
  
  // Aggiungi worksheet riepilogo prodotti
  const worksheetProdotti = workbook.addWorksheet('Riepilogo Prodotti');
  
  // Calcola aggregati
  const prodottiAggregati = {};
  ordini.forEach(ordine => {
    ordine.prodotti.forEach(prod => {
      const chiave = `${prod.prodotto}_${prod.unita || 'pz'}`;
      if (!prodottiAggregati[chiave]) {
        prodottiAggregati[chiave] = {
          prodotto: prod.prodotto,
          quantita: 0,
          unita: prod.unita || 'pz',
          valore: 0
        };
      }
      prodottiAggregati[chiave].quantita += prod.quantita;
      prodottiAggregati[chiave].valore += prod.quantita * prod.prezzo;
    });
  });
  
  // Intestazione prodotti
  worksheetProdotti.mergeCells('A1:D1');
  worksheetProdotti.getCell('A1').value = 'RIEPILOGO PRODOTTI';
  worksheetProdotti.getCell('A1').font = { bold: true, size: 14 };
  worksheetProdotti.getCell('A1').alignment = { horizontal: 'center' };
  
  worksheetProdotti.addRow([]);
  const headersProdotti = ['Prodotto', 'Quantità', 'Unità', 'Valore Totale'];
  const headerRowProdotti = worksheetProdotti.addRow(headersProdotti);
  headerRowProdotti.font = { bold: true };
  headerRowProdotti.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Dati prodotti
  Object.values(prodottiAggregati).forEach(prod => {
    const row = worksheetProdotti.addRow([
      prod.prodotto,
      prod.quantita,
      prod.unita,
      prod.valore
    ]);
    row.getCell(4).numFmt = '€ #,##0.00';
  });
  
  // Formatta colonne per leggibilità
  worksheet.columns.forEach((column, index) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const cellLength = cell.value ? cell.value.toString().length : 10;
      maxLength = Math.max(maxLength, cellLength);
    });
    column.width = Math.min(maxLength + 2, 50);
  });
  
  worksheetProdotti.columns.forEach((column, index) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const cellLength = cell.value ? cell.value.toString().length : 10;
      maxLength = Math.max(maxLength, cellLength);
    });
    column.width = Math.min(maxLength + 2, 40);
  });
  
  // Intestazione per download
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=report_${tipo}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  
  // Salva workbook in response
  await workbook.xlsx.write(res);
  res.end();
};

// Funzione per generare CSV
const generaCSV = (res, ordini, periodoLabel, tipo, clienteId = null) => {
  // Intestazioni CSV
 // Continuazione della funzione generaCSV
  let csvContent = 'Data Ritiro,Ora,Cliente,Telefono,Prodotti,Da Viaggio,Totale,Note\n';
  
  // Dati
  ordini.forEach(ordine => {
    // Calcola totale ordine
    const totaleOrdine = ordine.prodotti.reduce((tot, prod) => 
      tot + (prod.quantita * prod.prezzo), 0
    );
    
    // Prepara dati prodotti (escape caratteri speciali)
    const prodottiString = ordine.prodotti
      .map(p => `${p.prodotto} (${p.quantita} ${p.unita || ''})`)
      .join('; ')
      .replace(/"/g, '""'); // escape doppi apici
    
    // Formatta riga
    csvContent += [
      format(new Date(ordine.dataRitiro), 'dd/MM/yyyy', { locale: it }),
      ordine.oraRitiro || '-',
      `"${ordine.nomeCliente.replace(/"/g, '""')}"`,
      `"${(ordine.telefono || '-').replace(/"/g, '""')}"`,
      `"${prodottiString}"`,
      ordine.daViaggio ? 'SI' : 'NO',
      totaleOrdine.toFixed(2),
      `"${(ordine.note || '').replace(/"/g, '""')}"`
    ].join(',') + '\n';
  });
  
  // Aggiungi riepilogo
  const totaleVendite = ordini.reduce((sum, ordine) => {
    const totaleOrdine = ordine.prodotti.reduce((tot, prod) => 
      tot + (prod.quantita * prod.prezzo), 0
    );
    return sum + totaleOrdine;
  }, 0);
  
  csvContent += '\n\nRIEPILOGO\n';
  csvContent += `Numero ordini,${ordini.length}\n`;
  csvContent += `Totale vendite,${totaleVendite.toFixed(2)}\n`;
  
  // Intestazione per download
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=report_${tipo}_${format(new Date(), 'yyyyMMdd')}.csv`);
  
  // Invia contenuto CSV con BOM per Excel
  res.send('\ufeff' + csvContent);
};

// Genera etichette prodotti
export const generaEtichetteProdotti = async (req, res) => {
  try {
    const { ordineId } = req.params;
    const { formato = 'standard' } = req.query;
    
    // Recupera ordine
    const ordine = await Ordine.findById(ordineId);
    if (!ordine) {
      return res.status(404).json({
        success: false,
        error: 'Ordine non trovato'
      });
    }
    
    // Crea documento PDF per etichette
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 10,
      layout: 'portrait'
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=etichette_${ordineId}.pdf`);
    
    doc.pipe(res);
    
    // Configurazione etichette
    const etichetteLarghezza = 70; // mm -> punti
    const etichetteAltezza = 37;   // mm -> punti
    const colonnePerPagina = 3;
    const righePerPagina = 8;
    const margineX = 20;
    const margineY = 20;
    const spazioX = 5;
    const spazioY = 5;
    
    let contatoreEtichette = 0;
    
    // Genera etichette per ogni prodotto
    for (const prodotto of ordine.prodotti) {
      for (let i = 0; i < prodotto.quantita; i++) {
        const col = contatoreEtichette % colonnePerPagina;
        const row = Math.floor((contatoreEtichette % (colonnePerPagina * righePerPagina)) / colonnePerPagina);
        
        // Nuova pagina se necessario
        if (contatoreEtichette > 0 && contatoreEtichette % (colonnePerPagina * righePerPagina) === 0) {
          doc.addPage();
        }
        
        // Calcola posizione etichetta
        const x = margineX + col * (etichetteLarghezza * 2.83 + spazioX);
        const y = margineY + row * (etichetteAltezza * 2.83 + spazioY);
        
        // Bordo etichetta
        doc.rect(x, y, etichetteLarghezza * 2.83, etichetteAltezza * 2.83)
           .stroke();
        
        // Contenuto etichetta
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('PASTIFICIO NONNA CLAUDIA', x + 5, y + 5, {
          width: etichetteLarghezza * 2.83 - 10,
          align: 'center'
        });
        
        doc.fontSize(12).font('Helvetica');
        doc.text(prodotto.prodotto, x + 5, y + 25, {
          width: etichetteLarghezza * 2.83 - 10,
          align: 'center'
        });
        
        doc.fontSize(8);
        doc.text(`Prodotto: ${format(new Date(), 'dd/MM/yyyy')}`, x + 5, y + 50);
        doc.text(`Consumare entro: ${format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy')}`, x + 5, y + 65);
        
        // QR Code piccolo
        try {
          const qrData = `PROD:${prodotto.prodotto}|DATA:${format(new Date(), 'yyyyMMdd')}`;
          const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 40 });
          const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
          doc.image(qrCodeBuffer, x + etichetteLarghezza * 2.83 - 45, y + 45, { width: 40 });
        } catch (err) {
          logger.error('Errore generazione QR Code etichetta:', err);
        }
        
        contatoreEtichette++;
      }
    }
    
    doc.end();
    
  } catch (error) {
    logger.error(`Errore generazione etichette: ${error.message}`, { 
      service: 'reportController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nella generazione delle etichette'
    });
  }
};

// Genera report statistiche
export const generaReportStatistiche = async (req, res) => {
  try {
    const { dataInizio, dataFine } = req.query;
    
    const startDate = dataInizio ? new Date(dataInizio) : startOfMonth(new Date());
    const endDate = dataFine ? new Date(dataFine) : endOfMonth(new Date());
    
    // Recupera dati per statistiche
    const [ordini, clientiTop, prodottiTop] = await Promise.all([
      // Ordini nel periodo
      Ordine.find({
        dataRitiro: { $gte: startDate, $lte: endDate }
      }),
      
      // Top 10 clienti
      Ordine.aggregate([
        {
          $match: {
            dataRitiro: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$nomeCliente',
            numeroOrdini: { $sum: 1 },
            totaleSpeso: { $sum: '$totaleOrdine' }
          }
        },
        { $sort: { totaleSpeso: -1 } },
        { $limit: 10 }
      ]),
      
      // Top prodotti
      Ordine.aggregate([
        {
          $match: {
            dataRitiro: { $gte: startDate, $lte: endDate }
          }
        },
        { $unwind: '$prodotti' },
        {
          $group: {
            _id: '$prodotti.prodotto',
            quantitaTotale: { $sum: '$prodotti.quantita' },
            valoreTotale: { 
              $sum: { $multiply: ['$prodotti.quantita', '$prodotti.prezzo'] }
            }
          }
        },
        { $sort: { valoreTotale: -1 } },
        { $limit: 10 }
      ])
    ]);
    
    // Genera PDF con grafici
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=statistiche_${format(new Date(), 'yyyyMMdd')}.pdf`);
    
    doc.pipe(res);
    
    // Intestazione
    doc.fontSize(20).text('PASTIFICIO NONNA CLAUDIA', { align: 'center' });
    doc.fontSize(16).text('REPORT STATISTICHE', { align: 'center' });
    doc.fontSize(12).text(`Periodo: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`, { align: 'center' });
    doc.moveDown(2);
    
    // Statistiche generali
    const totaleOrdini = ordini.length;
    const totaleValore = ordini.reduce((sum, ordine) => {
      const tot = ordine.prodotti.reduce((t, p) => t + (p.quantita * p.prezzo), 0);
      return sum + tot;
    }, 0);
    const mediaOrdine = totaleOrdini > 0 ? totaleValore / totaleOrdini : 0;
    
    doc.fontSize(14).text('STATISTICHE GENERALI', { underline: true });
    doc.fontSize(12);
    doc.text(`Totale ordini: ${totaleOrdini}`);
    doc.text(`Valore totale: € ${totaleValore.toFixed(2)}`);
    doc.text(`Media per ordine: € ${mediaOrdine.toFixed(2)}`);
    doc.moveDown();
    
    // Top clienti
    doc.fontSize(14).text('TOP 10 CLIENTI', { underline: true });
    doc.fontSize(10);
    
    clientiTop.forEach((cliente, index) => {
      doc.text(`${index + 1}. ${cliente._id} - Ordini: ${cliente.numeroOrdini} - Totale: € ${(cliente.totaleSpeso || 0).toFixed(2)}`);
    });
    
    doc.moveDown();
    
    // Top prodotti
    doc.fontSize(14).text('TOP 10 PRODOTTI', { underline: true });
    doc.fontSize(10);
    
    prodottiTop.forEach((prodotto, index) => {
      doc.text(`${index + 1}. ${prodotto._id} - Quantità: ${prodotto.quantitaTotale} - Valore: € ${prodotto.valoreTotale.toFixed(2)}`);
    });
    
    doc.end();
    
  } catch (error) {
    logger.error(`Errore generazione report statistiche: ${error.message}`, { 
      service: 'reportController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nella generazione del report statistiche'
    });
  }
};

export default {
  generaReportOrdini,
  generaReportCliente,
  generaDocumentoConsegna,
  generaEtichetteProdotti,
  generaReportStatistiche
};

