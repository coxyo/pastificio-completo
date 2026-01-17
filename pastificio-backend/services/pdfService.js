// services/pdfCorrispettivi.js
// ✅ GENERATORE PDF E CSV PER CORRISPETTIVI MENSILI

import PDFDocument from 'pdfkit';
import logger from '../config/logger.js';
import Corrispettivo from '../models/Corrispettivo.js';

/**
 * SERVIZIO GENERAZIONE PDF/CSV CORRISPETTIVI
 * - PDF report mensile formattato
 * - CSV export per Excel/LibreOffice
 */

class PdfCorrispettiviService {

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📄 GENERA PDF REPORT CORRISPETTIVI
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async generaPdfCorrispettivi(anno, mese) {
    try {
      logger.info(`📄 Generazione PDF corrispettivi ${mese}/${anno}...`);

      // Recupera dati dal database
      const corrispettivi = await Corrispettivo.find({ anno, mese }).sort({ giorno: 1 });

      if (corrispettivi.length === 0) {
        throw new Error(`Nessun corrispettivo trovato per ${mese}/${anno}`);
      }

      // Calcola totali
      const totali = this.calcolaTotali(corrispettivi);

      // Crea documento PDF
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Registro Corrispettivi ${mese}/${anno}`,
          Author: 'Pastificio Nonna Claudia',
          Subject: 'Registro Corrispettivi Mensile',
          Keywords: 'corrispettivi, iva, fatturazione'
        }
      });

      // Array per accumulare chunks
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      // Promise per fine documento
      const pdfPromise = new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
      });

      // ━━━ HEADER ━━━
      this.aggiungiHeader(doc, anno, mese);

      // ━━━ RIEPILOGO GENERALE ━━━
      this.aggiungiRiepilogoGenerale(doc, totali);

      // ━━━ DETTAGLIO IVA ━━━
      this.aggiungiDettaglioIva(doc, totali);

      // ━━━ TABELLA GIORNALIERA ━━━
      this.aggiungiTabellaGiornaliera(doc, corrispettivi, anno, mese);

      // ━━━ FOOTER ━━━
      this.aggiungiFooter(doc);

      // Finalizza documento
      doc.end();

      // Attendi completamento
      const buffer = await pdfPromise;

      logger.info(`✅ PDF generato: ${buffer.length} bytes`);
      return buffer;

    } catch (error) {
      logger.error('❌ Errore generazione PDF corrispettivi:', error);
      throw error;
    }
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📊 GENERA CSV EXPORT CORRISPETTIVI
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async generaCsvCorrispettivi(anno, mese) {
    try {
      logger.info(`📊 Generazione CSV corrispettivi ${mese}/${anno}...`);

      const corrispettivi = await Corrispettivo.find({ anno, mese }).sort({ giorno: 1 });

      if (corrispettivi.length === 0) {
        throw new Error(`Nessun corrispettivo trovato per ${mese}/${anno}`);
      }

      // Header CSV
      let csv = 'Data,Giorno,Totale,IVA 22%,IVA 10%,IVA 4%,Esente,Note,Operatore\n';

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
        const operatore = c.operatore || '';

        csv += `${data},${giorno},${totale},${iva22},${iva10},${iva4},${esente},${note},${operatore}\n`;
      });

      // Riga totale
      const totali = this.calcolaTotali(corrispettivi);
      csv += `\nTOTALE,,${totali.totaleMese.toFixed(2)},${totali.iva22.toFixed(2)},${totali.iva10.toFixed(2)},${totali.iva4.toFixed(2)},${totali.esente.toFixed(2)},,\n`;

      const buffer = Buffer.from(csv, 'utf-8');

      logger.info(`✅ CSV generato: ${buffer.length} bytes`);
      return buffer;

    } catch (error) {
      logger.error('❌ Errore generazione CSV corrispettivi:', error);
      throw error;
    }
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🛠️ FUNZIONI HELPER PDF
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */

  aggiungiHeader(doc, anno, mese) {
    const nomeMese = this.getNomeMese(mese - 1);

    // Logo/Title
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#2196F3')
      .text('🍰 Pastificio Nonna Claudia', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(18)
      .fillColor('#333')
      .text(`Registro Corrispettivi`, { align: 'center' })
      .moveDown(0.2);

    doc
      .fontSize(14)
      .fillColor('#666')
      .text(`${nomeMese} ${anno}`, { align: 'center' })
      .moveDown(1.5);

    // Linea separatore
    doc
      .strokeColor('#2196F3')
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown(1);
  }

  aggiungiRiepilogoGenerale(doc, totali) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#2196F3')
      .text('📊 RIEPILOGO GENERALE', { underline: true })
      .moveDown(0.5);

    const startY = doc.y;
    const boxWidth = 160;
    const boxHeight = 80;
    const gap = 15;

    // Box 1: Totale Mese
    this.disegnaBoxStatistica(doc, 50, startY, boxWidth, boxHeight, 
      'Incasso Totale', `€${totali.totaleMese.toFixed(2)}`, '#4CAF50');

    // Box 2: Media Giornaliera
    this.disegnaBoxStatistica(doc, 50 + boxWidth + gap, startY, boxWidth, boxHeight,
      'Media Giornaliera', `€${totali.mediaGiornaliera.toFixed(2)}`, '#2196F3');

    // Box 3: Giorni Apertura
    this.disegnaBoxStatistica(doc, 50 + (boxWidth + gap) * 2, startY, boxWidth, boxHeight,
      'Giorni Apertura', `${totali.giorniConIncasso}/${totali.giorniTotali}`, '#FF9800');

    doc.y = startY + boxHeight + 20;
  }

  disegnaBoxStatistica(doc, x, y, width, height, label, value, color) {
    // Bordo box
    doc
      .rect(x, y, width, height)
      .fillAndStroke('#f8f9fa', '#ddd');

    // Label
    doc
      .fontSize(10)
      .fillColor('#666')
      .text(label, x + 10, y + 15, { width: width - 20, align: 'center' });

    // Valore
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor(color)
      .text(value, x + 10, y + 35, { width: width - 20, align: 'center' });
  }

  aggiungiDettaglioIva(doc, totali) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#2196F3')
      .text('💶 DETTAGLIO IVA', { underline: true })
      .moveDown(0.5);

    const startY = doc.y;
    const colWidths = [100, 120, 120, 120];
    const rowHeight = 25;

    // Header tabella
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#fff');

    let currentX = 50;
    ['Aliquota', 'Imponibile + IVA', 'IVA Scorporata', 'Imponibile'].forEach((header, i) => {
      doc
        .rect(currentX, startY, colWidths[i], rowHeight)
        .fill('#2196F3');
      
      doc
        .fillColor('#fff')
        .text(header, currentX + 5, startY + 8, { width: colWidths[i] - 10 });
      
      currentX += colWidths[i];
    });

    doc.y = startY + rowHeight;

    // Righe IVA
    const righeIva = [
      { label: '22% (Ord.)', totale: totali.iva22, divisore: 1.22 },
      { label: '10% (Rid.)', totale: totali.iva10, divisore: 1.10 },
      { label: '4% (Super)', totale: totali.iva4, divisore: 1.04 },
      { label: 'Esente', totale: totali.esente, divisore: 1 }
    ];

    doc.font('Helvetica');

    righeIva.forEach((riga, index) => {
      if (riga.totale > 0) {
        const y = doc.y;
        const fill = index % 2 === 0 ? '#f8f9fa' : '#fff';

        currentX = 50;

        // Background alternato
        doc.rect(50, y, 460, rowHeight).fill(fill);

        doc.fillColor('#333');

        // Aliquota
        doc.text(riga.label, currentX + 5, y + 8, { width: colWidths[0] - 10 });
        currentX += colWidths[0];

        // Totale
        doc.text(`€${riga.totale.toFixed(2)}`, currentX + 5, y + 8, { 
          width: colWidths[1] - 10, 
          align: 'right' 
        });
        currentX += colWidths[1];

        // IVA scorporata
        const ivaScorporata = riga.totale - (riga.totale / riga.divisore);
        doc.text(`€${ivaScorporata.toFixed(2)}`, currentX + 5, y + 8, { 
          width: colWidths[2] - 10, 
          align: 'right' 
        });
        currentX += colWidths[2];

        // Imponibile
        const imponibile = riga.totale / riga.divisore;
        doc.text(`€${imponibile.toFixed(2)}`, currentX + 5, y + 8, { 
          width: colWidths[3] - 10, 
          align: 'right' 
        });

        doc.y = y + rowHeight;
      }
    });

    doc.moveDown(1);
  }

  aggiungiTabellaGiornaliera(doc, corrispettivi, anno, mese) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#2196F3')
      .text('📅 DETTAGLIO GIORNALIERO', { underline: true })
      .moveDown(0.5);

    const startY = doc.y;
    const colWidths = [80, 100, 280];
    const rowHeight = 20;

    // Header
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#fff');

    let currentX = 50;
    ['Data', 'Incasso', 'Note'].forEach((header, i) => {
      doc
        .rect(currentX, startY, colWidths[i], rowHeight)
        .fill('#2196F3');
      
      doc
        .fillColor('#fff')
        .text(header, currentX + 5, startY + 6, { width: colWidths[i] - 10 });
      
      currentX += colWidths[i];
    });

    doc.y = startY + rowHeight;

    // Righe dati
    doc.font('Helvetica').fontSize(8);

    corrispettivi.forEach((c, index) => {
      const y = doc.y;

      // Controllo pagina (se supera 700, nuova pagina)
      if (y > 700) {
        doc.addPage();
        doc.y = 50;
      }

      const fill = index % 2 === 0 ? '#f8f9fa' : '#fff';

      currentX = 50;

      // Background
      doc.rect(50, doc.y, 460, rowHeight).fill(fill);

      doc.fillColor('#333');

      // Data
      doc.text(`${c.giorno}/${mese}/${anno}`, currentX + 5, doc.y + 6, { 
        width: colWidths[0] - 10 
      });
      currentX += colWidths[0];

      // Incasso
      doc.text(`€${(c.totale || 0).toFixed(2)}`, currentX + 5, doc.y + 6, { 
        width: colWidths[1] - 10,
        align: 'right'
      });
      currentX += colWidths[1];

      // Note
      doc.text(c.note || '-', currentX + 5, doc.y + 6, { 
        width: colWidths[2] - 10 
      });

      doc.y += rowHeight;
    });

    doc.moveDown(1);
  }

  aggiungiFooter(doc) {
    const now = new Date();
    const data = now.toLocaleDateString('it-IT');
    const ora = now.toLocaleTimeString('it-IT');

    doc
      .fontSize(8)
      .fillColor('#999')
      .text(`Documento generato automaticamente il ${data} alle ${ora}`, 50, 750, {
        align: 'center'
      });

    doc.text('Pastificio Nonna Claudia - Via Carmine 20/B, Assemini (CA) - Tel: 389 887 9833', {
      align: 'center'
    });
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🛠️ UTILITY
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */

  calcolaTotali(corrispettivi) {
    const totali = {
      totaleMese: 0,
      iva22: 0,
      iva10: 0,
      iva4: 0,
      esente: 0,
      giorniConIncasso: 0,
      giorniTotali: corrispettivi.length,
      mediaGiornaliera: 0
    };

    corrispettivi.forEach(c => {
      totali.totaleMese += c.totale || 0;
      
      if (c.dettaglioIva) {
        totali.iva22 += c.dettaglioIva.iva22 || 0;
        totali.iva10 += c.dettaglioIva.iva10 || 0;
        totali.iva4 += c.dettaglioIva.iva4 || 0;
        totali.esente += c.dettaglioIva.esente || 0;
      }

      if (c.totale > 0) {
        totali.giorniConIncasso++;
      }
    });

    totali.mediaGiornaliera = totali.giorniConIncasso > 0 
      ? totali.totaleMese / totali.giorniConIncasso 
      : 0;

    return totali;
  }

  getNomeMese(numeroMese) {
    const mesi = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return mesi[numeroMese];
  }
}

export default new PdfCorrispettiviService();