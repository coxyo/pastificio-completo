// backend/services/pdfService.js
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PDFService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Genera report giornaliero
   */
  async generateDailyReport(data) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `report_giornaliero_${new Date(data.data).toISOString().split('T')[0]}.pdf`;
        const filePath = path.join(this.tempDir, fileName);

        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('PASTIFICIO NONNA CLAUDIA', { align: 'center' });
        
        doc.fontSize(16)
           .font('Helvetica')
           .text('Report Giornaliero', { align: 'center' });
        
        doc.fontSize(12)
           .text(`Data: ${new Date(data.data).toLocaleDateString('it-IT', {
             weekday: 'long',
             year: 'numeric',
             month: 'long',
             day: 'numeric'
           })}`, { align: 'center' });

        doc.moveDown(2);

        // Statistiche
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .text('STATISTICHE GENERALI', 50);
        
        doc.moveDown();
        
        // Box statistiche
        const statsY = doc.y;
        doc.rect(50, statsY, 500, 80)
           .stroke();

        doc.font('Helvetica')
           .fontSize(11);
        
        doc.text(`Totale Ordini: ${data.totaleOrdini}`, 70, statsY + 15);
        doc.text(`Valore Totale: € ${data.valoreTotale}`, 250, statsY + 15);
        doc.text(`Ordini Completati: ${data.ordini.filter(o => o.stato === 'completato').length}`, 70, statsY + 35);
        doc.text(`Ordini da Viaggio: ${data.ordini.filter(o => o.deveViaggiare).length}`, 250, statsY + 35);
        doc.text(`Clienti Serviti: ${new Set(data.ordini.map(o => o.nomeCliente)).size}`, 70, statsY + 55);
        doc.text(`Media per Ordine: € ${(parseFloat(data.valoreTotale) / (data.totaleOrdini || 1)).toFixed(2)}`, 250, statsY + 55);

        doc.moveDown(6);

        // Riepilogo per categoria
        if (data.riepilogoCategorie && Object.keys(data.riepilogoCategorie).length > 0) {
          doc.font('Helvetica-Bold')
             .fontSize(14)
             .text('RIEPILOGO PER CATEGORIA', 50);
          
          doc.moveDown();

          const tableTop = doc.y;
          
          // Headers tabella
          doc.fontSize(11);
          doc.text('Categoria', 50, tableTop);
          doc.text('Quantità', 250, tableTop);
          doc.text('Valore', 400, tableTop);

          doc.moveTo(50, tableTop + 15)
             .lineTo(550, tableTop + 15)
             .stroke();

          doc.font('Helvetica');
          let yPos = tableTop + 25;

          Object.entries(data.riepilogoCategorie).forEach(([categoria, dati]) => {
            doc.text(categoria, 50, yPos);
            doc.text(dati.quantita.toString(), 250, yPos);
            doc.text(`€ ${dati.valore.toFixed(2)}`, 400, yPos);
            yPos += 20;
          });
        }

        // Nuova pagina per lista ordini
        doc.addPage();
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .text('DETTAGLIO ORDINI', 50, 50);
        
        doc.moveDown();

        // Lista ordini
        let currentY = doc.y;
        doc.font('Helvetica')
           .fontSize(10);

        data.ordini.forEach((ordine, index) => {
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          // Box ordine
          doc.rect(50, currentY, 500, 80)
             .stroke();

          doc.font('Helvetica-Bold')
             .fontSize(11)
             .text(`${ordine.oraRitiro} - ${ordine.nomeCliente}`, 60, currentY + 10);
          
          doc.font('Helvetica')
             .fontSize(10);
          
          doc.text(`Tel: ${ordine.telefono}`, 300, currentY + 10);
          doc.text(`Totale: € ${ordine.totale}`, 450, currentY + 10);
          
          doc.text(`Prodotti: ${ordine.numeroProdotti}`, 60, currentY + 30);
          doc.text(`Stato: ${ordine.stato}`, 300, currentY + 30);
          
          if (ordine.note) {
            doc.text(`Note: ${ordine.note.substring(0, 50)}...`, 60, currentY + 50);
          }

          currentY += 90;
        });

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.font('Helvetica')
             .fontSize(8)
             .text(
               `Pagina ${i + 1} di ${pageCount} - Report generato il ${new Date().toLocaleString('it-IT')}`,
               50,
               doc.page.height - 50,
               { align: 'center', width: 500 }
             );
        }

        doc.end();

        stream.on('finish', () => {
          resolve({ 
            filepath: filePath, 
            filename: fileName 
          });
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Genera report settimanale
   */
  async generateWeeklyReport(data) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `report_settimanale_${data.settimana}.pdf`;
        const filePath = path.join(this.tempDir, fileName);

        const doc = new PDFDocument({
          size: 'A4',
          landscape: true,
          margin: 40
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('PASTIFICIO NONNA CLAUDIA', { align: 'center' });
        
        doc.fontSize(16)
           .font('Helvetica')
           .text(`Report Settimanale - Settimana ${data.settimana}`, { align: 'center' });
        
        doc.fontSize(12)
           .text(`Dal ${new Date(data.dataInizio).toLocaleDateString('it-IT')} al ${new Date(data.dataFine).toLocaleDateString('it-IT')}`, { align: 'center' });

        doc.moveDown(2);

        // KPI principali
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .text('KEY PERFORMANCE INDICATORS', 50);
        
        doc.moveDown();

        // Box KPI
        const kpiY = doc.y;
        const kpiBoxWidth = 170;
        const kpiBoxHeight = 60;
        const kpiSpacing = 10;

        // KPI 1: Totale Ordini
        doc.rect(50, kpiY, kpiBoxWidth, kpiBoxHeight)
           .stroke();
        doc.fontSize(20)
           .text(data.kpi.totaleOrdini.toString(), 50, kpiY + 15, { align: 'center', width: kpiBoxWidth });
        doc.fontSize(10)
           .text('Ordini Totali', 50, kpiY + 40, { align: 'center', width: kpiBoxWidth });

        // KPI 2: Valore Totale
        doc.rect(50 + kpiBoxWidth + kpiSpacing, kpiY, kpiBoxWidth, kpiBoxHeight)
           .stroke();
        doc.fontSize(20)
           .text(`€ ${data.kpi.valoreTotale.toFixed(0)}`, 50 + kpiBoxWidth + kpiSpacing, kpiY + 15, { align: 'center', width: kpiBoxWidth });
        doc.fontSize(10)
           .text('Valore Totale', 50 + kpiBoxWidth + kpiSpacing, kpiY + 40, { align: 'center', width: kpiBoxWidth });

        // KPI 3: Ticket Medio
        doc.rect(50 + (kpiBoxWidth + kpiSpacing) * 2, kpiY, kpiBoxWidth, kpiBoxHeight)
           .stroke();
        doc.fontSize(20)
           .text(`€ ${data.kpi.ticketMedio.toFixed(2)}`, 50 + (kpiBoxWidth + kpiSpacing) * 2, kpiY + 15, { align: 'center', width: kpiBoxWidth });
        doc.fontSize(10)
           .text('Ticket Medio', 50 + (kpiBoxWidth + kpiSpacing) * 2, kpiY + 40, { align: 'center', width: kpiBoxWidth });

        // KPI 4: Tasso Completamento
        doc.rect(50 + (kpiBoxWidth + kpiSpacing) * 3, kpiY, kpiBoxWidth, kpiBoxHeight)
           .stroke();
        doc.fontSize(20)
           .text(`${data.kpi.tassoCompletamento.toFixed(0)}%`, 50 + (kpiBoxWidth + kpiSpacing) * 3, kpiY + 15, { align: 'center', width: kpiBoxWidth });
        doc.fontSize(10)
           .text('Completamento', 50 + (kpiBoxWidth + kpiSpacing) * 3, kpiY + 40, { align: 'center', width: kpiBoxWidth });

        doc.moveDown(6);

        // Trend giornaliero
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .text('TREND GIORNALIERO', 50);
        
        doc.moveDown();

        const trendTableTop = doc.y;
        doc.fontSize(10);
        
        // Headers
        doc.text('Giorno', 50, trendTableTop);
        doc.text('Data', 150, trendTableTop);
        doc.text('N° Ordini', 300, trendTableTop);
        doc.text('Valore', 450, trendTableTop);

        doc.moveTo(50, trendTableTop + 15)
           .lineTo(750, trendTableTop + 15)
           .stroke();

        doc.font('Helvetica');
        let trendY = trendTableTop + 25;

        data.trend.forEach(giorno => {
          doc.text(giorno.giorno, 50, trendY);
          doc.text(giorno.data, 150, trendY);
          doc.text(giorno.ordini.toString(), 300, trendY);
          doc.text(`€ ${giorno.valore.toFixed(2)}`, 450, trendY);
          trendY += 20;
        });

        // Nuova pagina per top prodotti e clienti
        doc.addPage();

        // Top Prodotti
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .text('TOP 10 PRODOTTI', 50, 50);
        
        doc.moveDown();

        const prodottiTableTop = doc.y;
        doc.fontSize(10);

        // Headers
        doc.text('Prodotto', 50, prodottiTableTop);
        doc.text('Quantità', 300, prodottiTableTop);
        doc.text('Valore', 500, prodottiTableTop);

        doc.moveTo(50, prodottiTableTop + 15)
           .lineTo(700, prodottiTableTop + 15)
           .stroke();

        doc.font('Helvetica');
        let prodY = prodottiTableTop + 25;

        data.topProdotti.forEach((prodotto, index) => {
          doc.text(`${index + 1}. ${prodotto.prodotto}`, 50, prodY);
          doc.text(prodotto.quantita.toString(), 300, prodY);
          doc.text(`€ ${prodotto.valore.toFixed(2)}`, 500, prodY);
          prodY += 20;
        });

        // Top Clienti
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .text('TOP 5 CLIENTI', 50, prodY + 30);
        
        const clientiTableTop = prodY + 50;
        doc.fontSize(10);

        // Headers
        doc.text('Cliente', 50, clientiTableTop);
        doc.text('N° Ordini', 300, clientiTableTop);
        doc.text('Valore Totale', 500, clientiTableTop);

        doc.moveTo(50, clientiTableTop + 15)
           .lineTo(700, clientiTableTop + 15)
           .stroke();

        doc.font('Helvetica');
        let clientiY = clientiTableTop + 25;

        data.analisiClienti.topClienti.forEach((cliente, index) => {
          doc.text(`${index + 1}. ${cliente.cliente}`, 50, clientiY);
          doc.text(cliente.ordini.toString(), 300, clientiY);
          doc.text(`€ ${cliente.valore.toFixed(2)}`, 500, clientiY);
          clientiY += 20;
        });

        // Analisi clienti
        doc.moveDown(2);
        doc.fontSize(11);
        doc.text(`Totale Clienti Serviti: ${data.analisiClienti.totaleClienti}`, 50);
        doc.text(`Clienti Ricorrenti: ${data.analisiClienti.clientiRicorrenti}`, 250);

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.font('Helvetica')
             .fontSize(8)
             .text(
               `Pagina ${i + 1} di ${pageCount} - Report generato il ${new Date().toLocaleString('it-IT')}`,
               50,
               doc.page.height - 30,
               { align: 'center', width: 700 }
             );
        }

        doc.end();

        stream.on('finish', () => {
          resolve({ 
            filepath: filePath, 
            filename: fileName 
          });
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Genera ricevuta ordine
   */
  async generateOrderReceipt(ordine) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `ricevuta_${ordine._id}.pdf`;
        const filePath = path.join(this.tempDir, fileName);

        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('PASTIFICIO NONNA CLAUDIA', { align: 'center' });
        
        doc.fontSize(14)
           .font('Helvetica')
           .text('Ricevuta Ordine', { align: 'center' });
        
        doc.moveDown(2);

        // Info ordine
        doc.fontSize(12);
        const infoY = doc.y;
        
        // Box info
        doc.rect(50, infoY, 500, 100)
           .stroke();

        doc.text(`Ordine N°: ${ordine._id}`, 70, infoY + 15);
        doc.text(`Data: ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}`, 70, infoY + 35);
        doc.text(`Ora ritiro: ${ordine.oraRitiro}`, 70, infoY + 55);
        doc.text(`Stato: ${ordine.stato}`, 70, infoY + 75);

        doc.text(`Cliente: ${ordine.nomeCliente}`, 300, infoY + 15);
        doc.text(`Telefono: ${ordine.telefono}`, 300, infoY + 35);
        if (ordine.deveViaggiare) {
          doc.font('Helvetica-Bold')
             .text('DA VIAGGIO', 300, infoY + 55);
          doc.font('Helvetica');
        }

        doc.moveDown(7);

        // Linea separatrice
        doc.moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();

        doc.moveDown();

        // Intestazione tabella prodotti
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Prodotto', 50, tableTop);
        doc.text('Quantità', 300, tableTop);
        doc.text('Prezzo', 400, tableTop);
        doc.text('Totale', 480, tableTop);

        doc.moveTo(50, tableTop + 20)
           .lineTo(550, tableTop + 20)
           .stroke();

        // Prodotti
        doc.font('Helvetica');
        let yPosition = tableTop + 30;
        let totaleOrdine = 0;

        if (ordine.prodotti && ordine.prodotti.length > 0) {
          ordine.prodotti.forEach(prodotto => {
            const totaleRiga = (prodotto.quantita || 0) * (prodotto.prezzo || 0);
            totaleOrdine += totaleRiga;

            doc.text(prodotto.prodotto, 50, yPosition);
            doc.text(`${prodotto.quantita} ${prodotto.unita || 'pz'}`, 300, yPosition);
            doc.text(`€ ${(prodotto.prezzo || 0).toFixed(2)}`, 400, yPosition);
            doc.text(`€ ${totaleRiga.toFixed(2)}`, 480, yPosition);

            if (prodotto.note) {
              yPosition += 15;
              doc.fontSize(9)
                 .text(`  Note: ${prodotto.note}`, 70, yPosition);
              doc.fontSize(11);
            }

            yPosition += 25;
          });
        }

        // Linea sopra totale
        doc.moveTo(400, yPosition + 10)
           .lineTo(550, yPosition + 10)
           .stroke();

        // Totale
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .text('TOTALE:', 400, yPosition + 20);
        doc.text(`€ ${(ordine.totale || totaleOrdine).toFixed(2)}`, 480, yPosition + 20);

        // Note ordine
        if (ordine.note) {
          doc.moveDown(3);
          doc.font('Helvetica')
             .fontSize(10)
             .text('Note ordine:', 50);
          doc.fontSize(10)
             .text(ordine.note, 50, doc.y + 10, { width: 500 });
        }

        // Footer
        doc.font('Helvetica')
           .fontSize(10)
           .text(
             'Grazie per aver scelto il nostro pastificio!',
             50,
             doc.page.height - 100,
             { align: 'center', width: 500 }
           );

        doc.fontSize(8)
           .text(
             `Ricevuta generata il ${new Date().toLocaleString('it-IT')}`,
             50,
             doc.page.height - 80,
             { align: 'center', width: 500 }
           );

        doc.end();

        stream.on('finish', () => {
          resolve({ 
            filepath: filePath, 
            filename: fileName 
          });
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Genera etichette prodotti
   */
  async generateProductLabels(prodotti, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `etichette_${Date.now()}.pdf`;
        const filePath = path.join(this.tempDir, fileName);

        // Formato etichetta (default A4 con 21 etichette)
        const labelWidth = options.width || 70;
        const labelHeight = options.height || 42.3;
        const marginX = options.marginX || 5;
        const marginY = options.marginY || 10;
        const columns = options.columns || 3;
        const rows = options.rows || 7;

        const doc = new PDFDocument({
          size: 'A4',
          margin: 0
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        let currentColumn = 0;
        let currentRow = 0;
        let currentPage = 0;

        prodotti.forEach((prodotto, index) => {
          // Calcola posizione etichetta
          const x = marginX + (currentColumn * (labelWidth + marginX));
          const y = marginY + (currentRow * (labelHeight + marginY));

          // Box etichetta
          doc.rect(x, y, labelWidth, labelHeight)
             .stroke();

          // Contenuto etichetta
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text(prodotto.nome, x + 5, y + 5, {
               width: labelWidth - 10,
               height: 15,
               ellipsis: true
             });

          doc.fontSize(8)
             .font('Helvetica')
             .text(`€ ${prodotto.prezzo.toFixed(2)}`, x + 5, y + 20);

          if (prodotto.codice) {
            doc.fontSize(6)
               .text(`Cod: ${prodotto.codice}`, x + 5, y + 32);
          }

          // Avanza alla prossima posizione
          currentColumn++;
          if (currentColumn >= columns) {
            currentColumn = 0;
            currentRow++;
            if (currentRow >= rows) {
              currentRow = 0;
              if (index < prodotti.length - 1) {
                doc.addPage();
              }
            }
          }
        });

        doc.end();

        stream.on('finish', () => {
          resolve({ 
            filepath: filePath, 
            filename: fileName 
          });
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Pulizia file temporanei
   */
  cleanupTempFiles(hoursOld = 24) {
    const now = Date.now();
    const maxAge = hoursOld * 60 * 60 * 1000;

    fs.readdir(this.tempDir, (err, files) => {
      if (err) return;

      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;

          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlink(filePath, err => {
              if (err) console.error(`Errore eliminazione file: ${file}`, err);
            });
          }
        });
      });
    });
  }
}

export default new PDFService();