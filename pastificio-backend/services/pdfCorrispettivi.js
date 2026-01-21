// services/pdfCorrispettivi.js
// 🎯 VERSIONE DEFINITIVA - TUTTO PERFETTO
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';
import Corrispettivo from '../models/Corrispettivo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PdfCorrispettiviService {

  /**
   * GENERA PDF PROFESSIONALE
   */
  async generaPdfCorrispettivi(anno, mese) {
    try {
      logger.info(`📄 Generazione PDF ${mese}/${anno}...`);

      const corrispettivi = await Corrispettivo.find({ anno, mese }).sort({ giorno: 1 });

      if (corrispettivi.length === 0) {
        throw new Error(`Nessun corrispettivo trovato per ${mese}/${anno}`);
      }

      const totali = this.calcolaTotali(corrispettivi);
      const nomeMese = this.getNomeMese(mese - 1);

      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 30, bottom: 40, left: 40, right: 40 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      const pdfPromise = new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
      });

      // ━━━ HEADER OTTIMIZZATO ━━━
      // Background blu
      doc.rect(0, 0, doc.page.width, 100).fill('#2196F3');

      // Logo (più piccolo, 100x65)
      const logoPath = path.join(__dirname, '../assets/logo.jpg');
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 40, 20, { width: 100, height: 65 });
        } catch (err) {
          doc.fontSize(35).fillColor('#FFFFFF').text('🍰', 40, 30);
        }
      } else {
        doc.fontSize(35).fillColor('#FFFFFF').text('🍰', 40, 30);
      }

      // Testo azienda (a destra del logo)
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#FFFFFF')
         .text('Pastificio Nonna Claudia', 155, 25);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#E3F2FD')
         .text('Via Carmine 20/B, Assemini (CA) | Tel: 389 887 9833', 155, 50);

      // Box giallo report (in basso a destra, non sovrapposto)
      doc.rect(doc.page.width - 220, 20, 180, 65).fill('#FFEB3B');
      
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('CORRISPETTIVI', doc.page.width - 210, 28, { width: 160, align: 'center' });
      
      doc.fontSize(16)
         .fillColor('#2196F3')
         .text(`${nomeMese.toUpperCase()} ${anno}`, doc.page.width - 210, 48, { width: 160, align: 'center' });

      doc.y = 120;

      // ━━━ KPI CARDS ━━━
      const cardY = doc.y;
      const cardWidth = 120;
      const cardHeight = 65;
      const cardGap = 8;

      const giornoMax = corrispettivi.reduce((max, c) => 
        (c.totale > max.totale) ? c : max, { totale: 0, giorno: 0 }
      );

      const cards = [
        { label: 'Incasso Totale', value: `€${totali.totaleMese.toFixed(2)}`, color: '#4CAF50' },
        { label: 'Media/Giorno', value: `€${totali.mediaGiornaliera.toFixed(2)}`, color: '#2196F3' },
        { label: 'Giorni Attivi', value: `${totali.giorniConIncasso}/${totali.giorniTotali}`, color: '#FF9800' },
        { label: 'Top', value: `${giornoMax.giorno}/${mese}`, color: '#9C27B0' }
      ];

      cards.forEach((card, i) => {
        const x = 42 + (i * (cardWidth + cardGap));
        
        doc.rect(x, cardY, cardWidth, cardHeight).fillAndStroke('#F5F5F5', '#E0E0E0');
        doc.rect(x, cardY, cardWidth, 3).fill(card.color);
        
        doc.fontSize(8).fillColor('#666666')
           .text(card.label, x + 5, cardY + 12, { width: cardWidth - 10, align: 'center' });
        
        doc.fontSize(12).font('Helvetica-Bold').fillColor(card.color)
           .text(card.value, x + 5, cardY + 32, { width: cardWidth - 10, align: 'center' });
      });

      doc.y = cardY + cardHeight + 20;

      // ━━━ DETTAGLIO IVA ━━━
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#2196F3')
         .text('DETTAGLIO IVA', 40);

      doc.moveDown(0.2);

      const tabellaY = doc.y;
      const colW = [105, 105, 105, 105];
      const rowH = 22;

      // Header
      ['Aliquota', 'Totale', 'IVA Scorp.', 'Imponibile'].forEach((h, i) => {
        const x = 42 + colW.slice(0, i).reduce((a, b) => a + b, 0);
        doc.rect(x, tabellaY, colW[i], rowH).fill('#4CAF50');
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF')
           .text(h, x + 5, tabellaY + 7, { width: colW[i] - 10, align: 'center' });
      });

      let currentY = tabellaY + rowH;

      // Righe IVA
      const righe = [];
      if (totali.iva22 > 0) righe.push({ label: '22%', totale: totali.iva22, div: 1.22 });
      if (totali.iva10 > 0) righe.push({ label: '10%', totale: totali.iva10, div: 1.10 });
      if (totali.iva4 > 0) righe.push({ label: '4%', totale: totali.iva4, div: 1.04 });
      if (totali.esente > 0) righe.push({ label: 'Esente', totale: totali.esente, div: 1 });

      righe.forEach((r, idx) => {
        const fill = idx % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
        doc.rect(42, currentY, colW.reduce((a, b) => a + b), rowH).fill(fill);

        const vals = [
          r.label,
          `€${r.totale.toFixed(2)}`,
          `€${(r.totale - r.totale / r.div).toFixed(2)}`,
          `€${(r.totale / r.div).toFixed(2)}`
        ];

        vals.forEach((v, i) => {
          const x = 42 + colW.slice(0, i).reduce((a, b) => a + b, 0);
          doc.fontSize(8).font('Helvetica').fillColor('#333333')
             .text(v, x + 5, currentY + 7, { width: colW[i] - 10, align: i === 0 ? 'left' : 'right' });
        });

        currentY += rowH;
      });

      // Totale
      doc.rect(42, currentY, colW.reduce((a, b) => a + b), rowH).fill('#FFEB3B');

      const totVals = [
        'TOTALE',
        `€${totali.totaleMese.toFixed(2)}`,
        `€${((totali.iva22 - totali.iva22/1.22) + (totali.iva10 - totali.iva10/1.10) + (totali.iva4 - totali.iva4/1.04)).toFixed(2)}`,
        `€${(totali.iva22/1.22 + totali.iva10/1.10 + totali.iva4/1.04 + totali.esente).toFixed(2)}`
      ];

      totVals.forEach((v, i) => {
        const x = 42 + colW.slice(0, i).reduce((a, b) => a + b, 0);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
           .text(v, x + 5, currentY + 7, { width: colW[i] - 10, align: i === 0 ? 'left' : 'right' });
      });

      doc.y = currentY + rowH + 20;

      // ━━━ TABELLA GIORNALIERA ━━━
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#2196F3')
         .text('DETTAGLIO GIORNALIERO', 40);

      doc.moveDown(0.2);

      const detailY = doc.y;
      const detailColW = [65, 85, 270];
      const detailRowH = 16;

      // Header
      ['Data', 'Incasso', 'Note'].forEach((h, i) => {
        const x = 42 + detailColW.slice(0, i).reduce((a, b) => a + b, 0);
        doc.rect(x, detailY, detailColW[i], detailRowH).fill('#2196F3');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF')
           .text(h, x + 5, detailY + 4, { width: detailColW[i] - 10 });
      });

      currentY = detailY + detailRowH;

      // Dati
      corrispettivi.forEach((c, idx) => {
        if (currentY > 730) {
          doc.addPage();
          currentY = 50;
        }

        const fill = idx % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
        doc.rect(42, currentY, detailColW.reduce((a, b) => a + b), detailRowH).fill(fill);

        const vals = [
          `${c.giorno}/${mese}/${anno}`,
          `€${(c.totale || 0).toFixed(2)}`,
          c.note || '-'
        ];

        vals.forEach((v, i) => {
          const x = 42 + detailColW.slice(0, i).reduce((a, b) => a + b, 0);
          doc.fontSize(7).font('Helvetica').fillColor('#333333')
             .text(v, x + 5, currentY + 4, { 
               width: detailColW[i] - 10, 
               align: i === 1 ? 'right' : 'left' 
             });
        });

        currentY += detailRowH;
      });

      // Footer
      const footerY = doc.page.height - 50;
      doc.moveTo(40, footerY).lineTo(doc.page.width - 40, footerY).stroke('#E0E0E0');
      
      doc.fontSize(7).fillColor('#999999')
         .text(`Generato il ${new Date().toLocaleString('it-IT')} | Pastificio Nonna Claudia`, 40, footerY + 8);

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
   * GENERA CSV MIGLIORATO
   */
  async generaCsvCorrispettivi(anno, mese) {
    try {
      logger.info(`📊 Generazione CSV ${mese}/${anno}...`);

      const corrispettivi = await Corrispettivo.find({ anno, mese }).sort({ giorno: 1 });

      if (corrispettivi.length === 0) {
        throw new Error(`Nessun corrispettivo trovato`);
      }

      const totali = this.calcolaTotali(corrispettivi);
      const nomeMese = this.getNomeMese(mese - 1);

      // Header con info azienda e periodo
      let csv = `PASTIFICIO NONNA CLAUDIA - REGISTRO CORRISPETTIVI ${nomeMese.toUpperCase()} ${anno}\n`;
      csv += `Via Carmine 20/B - Assemini (CA) - Tel: 389 887 9833\n`;
      csv += `Generato il: ${new Date().toLocaleDateString('it-IT')}\n\n`;

      // Header colonne
      csv += 'Data,Giorno,Totale €,IVA 22% €,IVA 10% €,IVA 4% €,Esente €,Note\n';

      // Righe dati
      corrispettivi.forEach(c => {
        const data = `${c.giorno}/${mese}/${anno}`;
        const giorno = c.giorno;
        const totale = (c.totale || 0).toFixed(2);
        const iva22 = (c.dettaglioIva?.iva22 || 0).toFixed(2);
        const iva10 = (c.dettaglioIva?.iva10 || 0).toFixed(2);
        const iva4 = (c.dettaglioIva?.iva4 || 0).toFixed(2);
        const esente = (c.dettaglioIva?.esente || 0).toFixed(2);
        const note = c.note ? `"${c.note.replace(/"/g, '""')}"` : '';

        csv += `${data},${giorno},${totale},${iva22},${iva10},${iva4},${esente},${note}\n`;
      });

      // Riga totale
      csv += `\nTOTALE,,${totali.totaleMese.toFixed(2)},${totali.iva22.toFixed(2)},${totali.iva10.toFixed(2)},${totali.iva4.toFixed(2)},${totali.esente.toFixed(2)},\n`;

      // Riepilogo IVA
      csv += `\nRIEPILOGO IVA:\n`;
      csv += `Aliquota,Totale,IVA Scorporata,Imponibile\n`;
      
      if (totali.iva22 > 0) {
        csv += `22%,${totali.iva22.toFixed(2)},${(totali.iva22 - totali.iva22/1.22).toFixed(2)},${(totali.iva22/1.22).toFixed(2)}\n`;
      }
      if (totali.iva10 > 0) {
        csv += `10%,${totali.iva10.toFixed(2)},${(totali.iva10 - totali.iva10/1.10).toFixed(2)},${(totali.iva10/1.10).toFixed(2)}\n`;
      }
      if (totali.iva4 > 0) {
        csv += `4%,${totali.iva4.toFixed(2)},${(totali.iva4 - totali.iva4/1.04).toFixed(2)},${(totali.iva4/1.04).toFixed(2)}\n`;
      }
      if (totali.esente > 0) {
        csv += `Esente,${totali.esente.toFixed(2)},0.00,${totali.esente.toFixed(2)}\n`;
      }

      csv += `\nSTATISTICHE:\n`;
      csv += `Media Giornaliera,${totali.mediaGiornaliera.toFixed(2)}\n`;
      csv += `Giorni con Incasso,${totali.giorniConIncasso}\n`;
      csv += `Giorni Totali,${totali.giorniTotali}\n`;

      const buffer = Buffer.from(csv, 'utf-8');

      logger.info(`✅ CSV generato: ${buffer.length} bytes`);
      return buffer;

    } catch (error) {
      logger.error('❌ Errore CSV:', error);
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