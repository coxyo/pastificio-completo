// utils/pdfGenerator.js
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import QRCode from 'qrcode';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PDFGenerator {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async generateOrdinePDF(ordine, template = 'standard') {
    const filename = `ordine_${ordine._id}_${Date.now()}.pdf`;
    const filepath = path.join(this.tempDir, filename);
    
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filepath);
        
        doc.pipe(stream);
        
        // Header
        this.generateHeader(doc, 'DOCUMENTO DI CONSEGNA');
        
        // Info ordine
        doc.fontSize(12);
        doc.text(`Ordine N°: ${ordine._id.toString().slice(-8).toUpperCase()}`);
        doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it })}`);
        doc.moveDown();
        
        // Info cliente
        doc.text(`Cliente: ${ordine.nomeCliente}`);
        doc.text(`Telefono: ${ordine.telefono || 'Non specificato'}`);
        doc.text(`Data Ritiro: ${format(new Date(ordine.dataRitiro), 'dd/MM/yyyy', { locale: it })}`);
        doc.text(`Ora Ritiro: ${ordine.oraRitiro || 'Non specificata'}`);
        
        // QR Code
        if (template === 'standard') {
          await this.addQRCode(doc, ordine);
        }
        
        doc.moveDown();
        
        // Tabella prodotti
        this.generateProductTable(doc, ordine.prodotti);
        
        // Note
        if (ordine.note) {
          doc.moveDown();
          doc.fontSize(12).text('Note:', { underline: true });
          doc.fontSize(10).text(ordine.note);
        }
        
        // Footer
        this.generateFooter(doc);
        
        doc.end();
        
        stream.on('finish', () => {
          logger.info(`PDF generato: ${filename}`);
          resolve(filepath);
        });
        
      } catch (error) {
        logger.error('Errore generazione PDF:', error);
        reject(error);
      }
    });
  }

  async generateReportPDF(data, tipo) {
    const filename = `report_${tipo}_${Date.now()}.pdf`;
    const filepath = path.join(this.tempDir, filename);
    
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filepath);
        
        doc.pipe(stream);
        
        // Header specifico per tipo
        switch (tipo) {
          case 'giornaliero':
            this.generateHeader(doc, 'REPORT GIORNALIERO');
            await this.generateDailyReport(doc, data);
            break;
          case 'settimanale':
            this.generateHeader(doc, 'REPORT SETTIMANALE');
            await this.generateWeeklyReport(doc, data);
            break;
          case 'mensile':
            this.generateHeader(doc, 'REPORT MENSILE');
            await this.generateMonthlyReport(doc, data);
            break;
        }
        
        this.generateFooter(doc);
        doc.end();
        
        stream.on('finish', () => {
          logger.info(`Report PDF generato: ${filename}`);
          resolve(filepath);
        });
        
      } catch (error) {
        logger.error('Errore generazione report PDF:', error);
        reject(error);
      }
    });
  }

  generateHeader(doc, title) {
    doc.fontSize(20).text('PASTIFICIO NONNA CLAUDIA', { align: 'center' });
    doc.fontSize(16).text(title, { align: 'center' });
    doc.moveDown();
  }

  generateFooter(doc) {
    const pageHeight = doc.page.height;
    doc.fontSize(8).fillColor('#666666');
    doc.text(
      'Pastificio Nonna Claudia - Via Example, 123 - Tel: 070 123456',
      50,
      pageHeight - 50,
      { align: 'center', width: doc.page.width - 100 }
    );
  }

  generateProductTable(doc, prodotti) {
    doc.fontSize(14).fillColor('black').text('Prodotti Ordinati', { underline: true });
    doc.moveDown();
    
    // Intestazioni
    const tableTop = doc.y;
    const colWidths = [250, 80, 80, 100];
    
    doc.fontSize(10);
    doc.text('Prodotto', 50, tableTop);
    doc.text('Quantità', 50 + colWidths[0], tableTop);
    doc.text('Prezzo Un.', 50 + colWidths[0] + colWidths[1], tableTop);
    doc.text('Totale', 50 + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
    
    // Linea
    doc.moveTo(50, tableTop + 15)
       .lineTo(50 + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
       .stroke();
    
    // Prodotti
    let yPos = tableTop + 20;
    let totale = 0;
    
    prodotti.forEach((prodotto) => {
      const subtotale = prodotto.quantita * prodotto.prezzo;
      totale += subtotale;
      
      doc.text(prodotto.prodotto, 50, yPos);
      doc.text(`${prodotto.quantita} ${prodotto.unita || ''}`, 50 + colWidths[0], yPos);
      doc.text(`€ ${prodotto.prezzo.toFixed(2)}`, 50 + colWidths[0] + colWidths[1], yPos);
      doc.text(`€ ${subtotale.toFixed(2)}`, 50 + colWidths[0] + colWidths[1] + colWidths[2], yPos);
      
      yPos += 20;
    });
    
    // Totale
    doc.moveTo(50, yPos)
       .lineTo(50 + colWidths.reduce((a, b) => a + b, 0), yPos)
       .stroke();
    
    yPos += 10;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Totale:', 50 + colWidths[0] + colWidths[1], yPos);
    doc.text(`€ ${totale.toFixed(2)}`, 50 + colWidths[0] + colWidths[1] + colWidths[2], yPos);
    doc.font('Helvetica');
  }

  async addQRCode(doc, ordine) {
    try {
      const qrData = JSON.stringify({
        id: ordine._id,
        cliente: ordine.nomeCliente,
        data: ordine.dataRitiro
      });
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, { 
        width: 100,
        margin: 1
      });
      
      const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      doc.image(qrCodeBuffer, 450, 100, { width: 100 });
      
    } catch (error) {
      logger.error('Errore generazione QR Code:', error);
    }
  }

  async generateDailyReport(doc, data) {
    doc.fontSize(12);
    doc.text(`Data: ${format(data.data, 'dd MMMM yyyy', { locale: it })}`);
    doc.text(`Totale ordini: ${data.totaleOrdini}`);
    doc.text(`Totale vendite: € ${data.totaleValore.toFixed(2)}`);
    doc.text(`Media per ordine: € ${data.mediaOrdine.toFixed(2)}`);
    doc.moveDown();
    
    // Produzione giornaliera
    if (data.produzioneGiornaliera && data.produzioneGiornaliera.length > 0) {
      doc.fontSize(14).text('Produzione Giornaliera', { underline: true });
      doc.moveDown();
      
      const categorie = {};
      data.produzioneGiornaliera.forEach(item => {
        if (!categorie[item.categoria]) {
          categorie[item.categoria] = [];
        }
        categorie[item.categoria].push(item);
      });
      
      Object.entries(categorie).forEach(([categoria, prodotti]) => {
        doc.fontSize(12).font('Helvetica-Bold').text(categoria);
        doc.font('Helvetica').fontSize(10);
        
        prodotti.forEach(prod => {
          doc.text(`  ${prod.prodotto}: ${prod.quantita} ${prod.unita}`);
        });
        doc.moveDown();
      });
    }
    
    // Lista ordini
    if (data.ordini && data.ordini.length > 0) {
      doc.addPage();
      doc.fontSize(14).text('Dettaglio Ordini', { underline: true });
      doc.moveDown();
      
      data.ordini.forEach((ordine, index) => {
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text(`${index + 1}. ${ordine.nomeCliente} - ${ordine.oraRitiro || 'Ora non specificata'}`);
        doc.font('Helvetica').fontSize(10);
        doc.text(`   Tel: ${ordine.telefono || 'Non specificato'}`);
        
        ordine.prodotti.forEach(prod => {
          doc.text(`   - ${prod.prodotto}: ${prod.quantita} ${prod.unita || ''}`);
        });
        
        if (ordine.note) {
          doc.text(`   Note: ${ordine.note}`);
        }
        
        doc.moveDown();
      });
    }
  }

  async generateWeeklyReport(doc, data) {
    doc.fontSize(12);
    doc.text(`Periodo: ${data.periodo}`);
    doc.text(`Totale ordini: ${data.totaleOrdini}`);
    doc.text(`Totale vendite: € ${data.totaleValore.toFixed(2)}`);
    doc.text(`Media per ordine: € ${data.mediaOrdine.toFixed(2)}`);
    doc.moveDown();
    
    // Grafico settimanale (simulato con testo)
    doc.fontSize(14).text('Andamento Settimanale', { underline: true });
    doc.moveDown();
    
    // Raggruppa per giorno
    const ordiniPerGiorno = {};
    const giorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    
    data.ordini.forEach(ordine => {
      const giorno = new Date(ordine.dataRitiro).getDay();
      const nomeGiorno = giorni[giorno === 0 ? 6 : giorno - 1];
      
      if (!ordiniPerGiorno[nomeGiorno]) {
        ordiniPerGiorno[nomeGiorno] = {
          count: 0,
          totale: 0
        };
      }
      
      ordiniPerGiorno[nomeGiorno].count++;
      const totaleOrdine = ordine.prodotti.reduce((tot, prod) => 
        tot + (prod.quantita * prod.prezzo), 0
      );
      ordiniPerGiorno[nomeGiorno].totale += totaleOrdine;
    });
    
    doc.fontSize(10);
    giorni.forEach(giorno => {
      const dati = ordiniPerGiorno[giorno] || { count: 0, totale: 0 };
      doc.text(`${giorno}: ${dati.count} ordini - € ${dati.totale.toFixed(2)}`);
    });
  }

  async generateMonthlyReport(doc, data) {
    doc.fontSize(12);
    doc.text(`Mese: ${data.periodo}`);
    doc.text(`Totale ordini: ${data.totaleOrdini}`);
    doc.text(`Totale vendite: € ${data.totaleValore.toFixed(2)}`);
    doc.text(`Media per ordine: € ${data.mediaOrdine.toFixed(2)}`);
    doc.moveDown();
    
    // Statistiche mensili
    doc.fontSize(14).text('Statistiche Mensili', { underline: true });
    doc.moveDown();
    
    // Top prodotti del mese
    const prodottiAggregati = {};
    data.ordini.forEach(ordine => {
      ordine.prodotti.forEach(prod => {
        if (!prodottiAggregati[prod.prodotto]) {
          prodottiAggregati[prod.prodotto] = {
            quantita: 0,
            valore: 0
          };
        }
        prodottiAggregati[prod.prodotto].quantita += prod.quantita;
       prodottiAggregati[prod.prodotto].valore += prod.quantita * prod.prezzo;
      });
    });
    
    // Ordina per valore
    const topProdotti = Object.entries(prodottiAggregati)
      .sort((a, b) => b[1].valore - a[1].valore)
      .slice(0, 10);
    
    doc.fontSize(12).text('Top 10 Prodotti', { underline: true });
    doc.fontSize(10);
    topProdotti.forEach(([prodotto, dati], index) => {
      doc.text(`${index + 1}. ${prodotto}: ${dati.quantita} unità - € ${dati.valore.toFixed(2)}`);
    });
    
    doc.moveDown();
    
    // Top clienti del mese
    const clientiAggregati = {};
    data.ordini.forEach(ordine => {
      if (!clientiAggregati[ordine.nomeCliente]) {
        clientiAggregati[ordine.nomeCliente] = {
          ordini: 0,
          totale: 0
        };
      }
      clientiAggregati[ordine.nomeCliente].ordini++;
      const totaleOrdine = ordine.prodotti.reduce((tot, prod) => 
        tot + (prod.quantita * prod.prezzo), 0
      );
      clientiAggregati[ordine.nomeCliente].totale += totaleOrdine;
    });
    
    const topClienti = Object.entries(clientiAggregati)
      .sort((a, b) => b[1].totale - a[1].totale)
      .slice(0, 10);
    
    doc.fontSize(12).text('Top 10 Clienti', { underline: true });
    doc.fontSize(10);
    topClienti.forEach(([cliente, dati], index) => {
      doc.text(`${index + 1}. ${cliente}: ${dati.ordini} ordini - € ${dati.totale.toFixed(2)}`);
    });
  }

  // Pulizia file temporanei
  cleanupTempFiles() {
    const now = Date.now();
    const maxAge = 3600000; // 1 ora
    
    fs.readdir(this.tempDir, (err, files) => {
      if (err) {
        logger.error('Errore lettura directory temp:', err);
        return;
      }
      
      files.forEach(file => {
        const filepath = path.join(this.tempDir, file);
        fs.stat(filepath, (err, stats) => {
          if (err) return;
          
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlink(filepath, err => {
              if (err) {
                logger.error(`Errore eliminazione file temp ${file}:`, err);
              } else {
                logger.info(`File temp eliminato: ${file}`);
              }
            });
          }
        });
      });
    });
  }
}

// Singleton
const pdfGenerator = new PDFGenerator();

// Pulizia periodica
setInterval(() => {
  pdfGenerator.cleanupTempFiles();
}, 3600000); // ogni ora

export default pdfGenerator;