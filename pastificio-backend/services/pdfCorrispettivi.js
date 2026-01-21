// services/pdfCorrispettivi.js
// 🎨 VERSIONE CORRETTA - CON LOGO REALE
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';
import Corrispettivo from '../models/Corrispettivo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PdfCorrispettiviService {

  /**
   * GENERA PDF PROFESSIONALE CON LOGO
   */
  async generaPdfCorrispettivi(anno, mese) {
    try {
      logger.info(`📄 Generazione PDF professionale ${mese}/${anno}...`);

      const corrispettivi = await Corrispettivo.find({ anno, mese }).sort({ giorno: 1 });

      if (corrispettivi.length === 0) {
        throw new Error(`Nessun corrispettivo trovato per ${mese}/${anno}`);
      }

      const totali = this.calcolaTotali(corrispettivi);
      const nomeMese = this.getNomeMese(mese - 1);

      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      const pdfPromise = new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
      });

      const pageWidth = doc.page.width - 80;

      // ━━━ HEADER CON LOGO ━━━
      // Background header
      doc.rect(40, 40, pageWidth, 110).fill('#2196F3');

      // Logo (se esiste)
      const logoPath = path.join(__dirname, '../assets/logo.jpg');
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, 50, { width: 120, height: 80 });
        } catch (err) {
          // Fallback emoji se logo non carica
          doc.fontSize(40).fillColor('#FFFFFF').text('🍰', 50, 55);
        }
      } else {
        doc.fontSize(40).fillColor('#FFFFFF').text('🍰', 50, 55);
      }

      // Titolo azienda
      doc.fontSize(22)
         .font('Helvetica-Bold')
         .fillColor('#FFFFFF')
         .text('Pastificio Nonna Claudia', 190, 55);

      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#E3F2FD')
         .text('Via Carmine 20/B, Assemini (CA)', 190, 85);
      
      doc.text('Tel: 389 887 9833', 190, 100);

      // Titolo report (destra)
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#FFEB3B')
         .text(`CORRISPETTIVI ${nomeMese.toUpperCase()} ${anno}`, 
               pageWidth - 220, 70, { width: 200, align: 'right' });

      doc.y = 170;

      // ━━━ KPI CARDS ━━━
      const cardY = doc.y;
      const cardWidth = 125;
      const cardHeight = 70;
      const cardGap = 10;

      const giornoMax = corrispettivi.reduce((max, c) => 
        (c.totale > max.totale) ? c : max, { totale: 0, giorno: 0 }
      );

      const cards = [
        { label: 'Incasso Totale', value: `€${totali.totaleMese.toFixed(2)}`, color: '#4CAF50' },
        { label: 'Media Giornaliera', value: `€${totali.mediaGiornaliera.toFixed(2)}`, color: '#2196F3' },
        { label: 'Giorni Apertura', value: `${totali.giorniConIncasso}/${totali.giorniTotali}`, color: '#FF9800' },
        { label: 'Giorno Top', value: `${giornoMax.giorno}/${mese}`, color: '#9C27B0' }
      ];

      cards.forEach((card, i) => {
        const x = 45 + (i * (cardWidth + cardGap));
        
        doc.rect(x, cardY, cardWidth, cardHeight).fillAndStroke('#F5F5F5', '#E0E0E0');
        doc.rect(x, cardY, cardWidth, 4).fill(card.color);
        
        doc.fontSize(9).fillColor('#666666')
           .text(card.label, x + 5, cardY + 15, { width: cardWidth - 10, align: 'center' });
        
        doc.fontSize(13).font('Helvetica-Bold').fillColor(card.color)
           .text(card.value, x + 5, cardY + 35, { width: cardWidth - 10, align: 'center' });
      });

      doc.y = cardY + cardHeight + 25;

      // ━━━ DETTAGLIO IVA ━━━
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#2196F3')
         .text('DETTAGLIO IVA', 40);

      doc.moveDown(0.3);

      const tabellaY = doc.y;
      const colW = [110, 110, 110, 110];
      const rowH = 25;

      // Header
      ['Aliquota', 'Totale', 'IVA Scorp.', 'Imponibile'].forEach((h, i) => {
        const x = 45 + colW.slice(0, i).reduce((a, b) => a + b, 0);
        doc.rect(x, tabellaY, colW[i], rowH).fill('#4CAF50');
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF')
           .text(h, x + 5, tabellaY + 8, { width: colW[i] - 10, align: 'center' });
      });

      let currentY = tabellaY + rowH;

      // Righe IVA
      const righe = [
        { label: '10% (Ridotta)', totale: totali.iva10, div: 1.10 }
      ];

      if (totali.iva22 > 0) righe.unshift({ label: '22% (Ord.)', totale: totali.iva22, div: 1.22 });
      if (totali.iva4 > 0) righe.push({ label: '4% (Super)', totale: totali.iva4, div: 1.04 });
      if (totali.esente > 0) righe.push({ label: 'Esente', totale: totali.esente, div: 1 });

      righe.forEach((r, idx) => {
        const fill = idx % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
        doc.rect(45, currentY, colW.reduce((a, b) => a + b), rowH).fill(fill);

        const vals = [
          r.label,
          `€${r.totale.toFixed(2)}`,
          `€${(r.totale - r.totale / r.div).toFixed(2)}`,
          `€${(r.totale / r.div).toFixed(2)}`
        ];

        vals.forEach((v, i) => {
          const x = 45 + colW.slice(0, i).reduce((a, b) => a + b, 0);
          doc.fontSize(9).font('Helvetica').fillColor('#333333')
             .text(v, x + 5, currentY + 8, { width: colW[i] - 10, align: i === 0 ? 'left' : 'right' });
        });

        currentY += rowH;
      });

      // Totale
      doc.rect(45, currentY, colW.reduce((a, b) => a + b), rowH).fill('#FFEB3B');

      const totVals = [
        'TOTALE',
        `€${totali.totaleMese.toFixed(2)}`,
        `€${((totali.iva22 - totali.iva22/1.22) + (totali.iva10 - totali.iva10/1.10) + (totali.iva4 - totali.iva4/1.04)).toFixed(2)}`,
        `€${(totali.iva22/1.22 + totali.iva10/1.10 + totali.iva4/1.04 + totali.esente).toFixed(2)}`
      ];

      totVals.forEach((v, i) => {
        const x = 45 + colW.slice(0, i).reduce((a, b) => a + b, 0);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
           .text(v, x + 5, currentY + 8, { width: colW[i] - 10, align: i === 0 ? 'left' : 'right' });
      });

      doc.y = currentY + rowH + 25;

      // ━━━ TABELLA GIORNALIERA ━━━
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#2196F3')
         .text('DETTAGLIO GIORNALIERO', 40);

      doc.moveDown(0.3);

      const detailY = doc.y;
      const detailColW = [70, 90, 280];
      const detailRowH = 18;

      // Header
      ['Data', 'Incasso', 'Note'].forEach((h, i) => {
        const x = 45 + detailColW.slice(0, i).reduce((a, b) => a + b, 0);
        doc.rect(x, detailY, detailColW[i], detailRowH).fill('#2196F3');
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF')
           .text(h, x + 5, detailY + 5, { width: detailColW[i] - 10 });
      });

      currentY = detailY + detailRowH;

      // Dati
      corrispettivi.forEach((c, idx) => {
        if (currentY > 720) {
          doc.addPage();
          currentY = 50;
        }

        const fill = idx % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
        doc.rect(45, currentY, detailColW.reduce((a, b) => a + b), detailRowH).fill(fill);

        const vals = [
          `${c.giorno}/${mese}/${anno}`,
          `€${(c.totale || 0).toFixed(2)}`,
          c.note || '-'
        ];

        vals.forEach((v, i) => {
          const x = 45 + detailColW.slice(0, i).reduce((a, b) => a + b, 0);
          doc.fontSize(8).font('Helvetica').fillColor('#333333')
             .text(v, x + 5, currentY + 5, { 
               width: detailColW[i] - 10, 
               align: i === 1 ? 'right' : 'left' 
             });
        });

        currentY += detailRowH;
      });

      // Footer
      const footerY = doc.page.height - 60;
      doc.moveTo(40, footerY).lineTo(doc.page.width - 40, footerY).stroke('#E0E0E0');
      
      doc.fontSize(8).fillColor('#999999')
         .text(`Documento generato il ${new Date().toLocaleString('it-IT')}`, 40, footerY + 10);
      
      doc.text('Pastificio Nonna Claudia - Sistema Gestionale', 40, footerY + 25);

      doc.end();

      const buffer = await pdfPromise;
      logger.info(`✅ PDF generato: ${buffer.length} bytes`);
      return buffer;

    } catch (error) {
      logger.error('❌ Errore PDF:', error);
      throw error;
    }
  }

  /**
   * GENERA EXCEL PULITO
   */
  async generaCsvCorrispettivi(anno, mese) {
    try {
      logger.info(`📊 Generazione Excel ${mese}/${anno}...`);

      const corrispettivi = await Corrispettivo.find({ anno, mese }).sort({ giorno: 1 });

      if (corrispettivi.length === 0) {
        throw new Error(`Nessun corrispettivo trovato`);
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Corrispettivi');

      // Header
      const headerRow = sheet.addRow([
        'Data', 'Giorno', 'Totale', 'IVA 22%', 'IVA 10%', 'IVA 4%', 'Esente', 'Note'
      ]);

      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2196F3' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Dati
      corrispettivi.forEach((c, i) => {
        const row = sheet.addRow([
          `${c.giorno}/${mese}/${anno}`,
          c.giorno,
          c.totale || 0,
          c.dettaglioIva?.iva22 || 0,
          c.dettaglioIva?.iva10 || 0,
          c.dettaglioIva?.iva4 || 0,
          c.dettaglioIva?.esente || 0,
          c.note || ''
        ]);

        [3, 4, 5, 6, 7].forEach(col => {
          row.getCell(col).numFmt = '"€"#,##0.00';
        });

        if (i % 2 === 0) {
          row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
          });
        }
      });

      // Totale
      const totRow = sheet.addRow([
        'TOTALE', '',
        { formula: `SUM(C2:C${corrispettivi.length + 1})` },
        { formula: `SUM(D2:D${corrispettivi.length + 1})` },
        { formula: `SUM(E2:E${corrispettivi.length + 1})` },
        { formula: `SUM(F2:F${corrispettivi.length + 1})` },
        { formula: `SUM(G2:G${corrispettivi.length + 1})` },
        ''
      ]);

      totRow.eachCell((cell, col) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } };
        if (col >= 3 && col <= 7) {
          cell.numFmt = '"€"#,##0.00';
        }
      });

      // Larghezze
      sheet.columns = [
        { width: 12 }, { width: 8 }, { width: 12 }, { width: 12 },
        { width: 12 }, { width: 12 }, { width: 12 }, { width: 30 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      logger.info(`✅ Excel generato: ${buffer.length} bytes`);
      return buffer;

    } catch (error) {
      logger.error('❌ Errore Excel:', error);
      throw error;
    }
  }

  /**
   * UTILITY
   */
  calcolaTotali(corrispettivi) {
    const totali = {
      totaleMese: 0, iva22: 0, iva10: 0, iva4: 0, esente: 0,
      giorniConIncasso: 0, giorniTotali: corrispettivi.length, mediaGiornaliera: 0
    };

    corrispettivi.forEach(c => {
      totali.totaleMese += c.totale || 0;
      if (c.dettaglioIva) {
        totali.iva22 += c.dettaglioIva.iva22 || 0;
        totali.iva10 += c.dettaglioIva.iva10 || 0;
        totali.iva4 += c.dettaglioIva.iva4 || 0;
        totali.esente += c.dettaglioIva.esente || 0;
      }
      if (c.totale > 0) totali.giorniConIncasso++;
    });

    totali.mediaGiornaliera = totali.giorniConIncasso > 0 
      ? totali.totaleMese / totali.giorniConIncasso : 0;

    return totali;
  }

  getNomeMese(n) {
    return ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
            'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'][n];
  }
}

export default new PdfCorrispettiviService();