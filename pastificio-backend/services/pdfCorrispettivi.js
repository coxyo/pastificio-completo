// services/pdfCorrispettivi.js
// 🏆 VERSIONE PERFETTA - SCRITTA SOTTO + DATE FORMATTATE
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';
import Corrispettivo from '../models/Corrispettivo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PdfCorrispettiviService {

  async generaPdfCorrispettivi(anno, mese) {
    try {
      logger.info(`📄 PDF ${mese}/${anno}...`);

      const corrispettivi = await Corrispettivo.find({ anno, mese }).sort({ giorno: 1 });
      if (!corrispettivi.length) throw new Error(`Nessun corrispettivo`);

      const totali = this.calcolaTotali(corrispettivi);
      const nomeMese = this.getNomeMese(mese - 1);

      const doc = new PDFDocument({ size: 'A4', margins: { top: 30, bottom: 40, left: 40, right: 40 } });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      const pdfPromise = new Promise((res, rej) => {
        doc.on('end', () => res(Buffer.concat(chunks)));
        doc.on('error', rej);
      });

      // HEADER BLU
      doc.rect(0, 0, doc.page.width, 85).fill('#2196F3');

      // Logo
      const logoPath = path.join(__dirname, '../assets/logo.jpg');
      if (fs.existsSync(logoPath)) {
        try { doc.image(logoPath, 40, 15, { width: 100, height: 65 }); }
        catch { doc.fontSize(35).fillColor('#FFF').text('🍰', 40, 25); }
      } else {
        doc.fontSize(35).fillColor('#FFF').text('🍰', 40, 25);
      }

      doc.fontSize(20).font('Helvetica-Bold').fillColor('#FFF').text('Pastificio Nonna Claudia', 155, 20);
      doc.fontSize(10).font('Helvetica').fillColor('#E3F2FD').text('Via Carmine 20/B, Assemini (CA) | Tel: 389 887 9833', 155, 45);

      // TITOLO SOTTO HEADER
      doc.rect(0, 85, doc.page.width, 35).fill('#FFEB3B');
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#000')
         .text(`CORRISPETTIVI ${nomeMese.toUpperCase()} ${anno}`, 40, 95, { width: doc.page.width - 80, align: 'center' });

      doc.y = 135;

      // KPI CARDS
      const cardY = doc.y, cW = 120, cH = 65, gap = 8;
      const maxG = corrispettivi.reduce((m, c) => (c.totale > m.totale) ? c : m, { totale: 0, giorno: 0 });
      
      [
        { l: 'Incasso', v: `€${totali.totaleMese.toFixed(2)}`, c: '#4CAF50' },
        { l: 'Media/Gg', v: `€${totali.mediaGiornaliera.toFixed(2)}`, c: '#2196F3' },
        { l: 'Gg Attivi', v: `${totali.giorniConIncasso}/${totali.giorniTotali}`, c: '#FF9800' },
        { l: 'Top', v: `${maxG.giorno}/${mese}`, c: '#9C27B0' }
      ].forEach((cd, i) => {
        const x = 42 + (i * (cW + gap));
        doc.rect(x, cardY, cW, cH).fillAndStroke('#F5F5F5', '#E0E0E0');
        doc.rect(x, cardY, cW, 3).fill(cd.c);
        doc.fontSize(8).fillColor('#666').text(cd.l, x + 5, cardY + 12, { width: cW - 10, align: 'center' });
        doc.fontSize(12).font('Helvetica-Bold').fillColor(cd.c).text(cd.v, x + 5, cardY + 32, { width: cW - 10, align: 'center' });
      });

      doc.y = cardY + cH + 20;

      // TABELLA IVA
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#2196F3').text('DETTAGLIO IVA', 40);
      doc.moveDown(0.2);

      const tY = doc.y, colW = [105, 105, 105, 105], rH = 22;
      ['Aliquota', 'Totale', 'IVA Scorp.', 'Imponibile'].forEach((h, i) => {
        const x = 42 + colW.slice(0, i).reduce((a, b) => a + b, 0);
        doc.rect(x, tY, colW[i], rH).fill('#4CAF50');
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFF').text(h, x + 5, tY + 7, { width: colW[i] - 10, align: 'center' });
      });

      let cY = tY + rH;
      const righe = [];
      if (totali.iva22 > 0) righe.push({ l: '22%', t: totali.iva22, d: 1.22 });
      if (totali.iva10 > 0) righe.push({ l: '10%', t: totali.iva10, d: 1.10 });
      if (totali.iva4 > 0) righe.push({ l: '4%', t: totali.iva4, d: 1.04 });
      if (totali.esente > 0) righe.push({ l: 'Esente', t: totali.esente, d: 1 });

      righe.forEach((r, idx) => {
        const fill = idx % 2 === 0 ? '#F8F9FA' : '#FFF';
        doc.rect(42, cY, colW.reduce((a, b) => a + b), rH).fill(fill);
        const vals = [r.l, `€${r.t.toFixed(2)}`, `€${(r.t - r.t / r.d).toFixed(2)}`, `€${(r.t / r.d).toFixed(2)}`];
        vals.forEach((v, i) => {
          const x = 42 + colW.slice(0, i).reduce((a, b) => a + b, 0);
          doc.fontSize(8).font('Helvetica').fillColor('#333').text(v, x + 5, cY + 7, { width: colW[i] - 10, align: i === 0 ? 'left' : 'right' });
        });
        cY += rH;
      });

      doc.rect(42, cY, colW.reduce((a, b) => a + b), rH).fill('#FFEB3B');
      const totVals = ['TOTALE', `€${totali.totaleMese.toFixed(2)}`,
        `€${((totali.iva22-totali.iva22/1.22)+(totali.iva10-totali.iva10/1.10)+(totali.iva4-totali.iva4/1.04)).toFixed(2)}`,
        `€${(totali.iva22/1.22+totali.iva10/1.10+totali.iva4/1.04+totali.esente).toFixed(2)}`];
      totVals.forEach((v, i) => {
        const x = 42 + colW.slice(0, i).reduce((a, b) => a + b, 0);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000').text(v, x + 5, cY + 7, { width: colW[i] - 10, align: i === 0 ? 'left' : 'right' });
      });

      doc.y = cY + rH + 20;

      // DETTAGLIO GIORNALIERO
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#2196F3').text('DETTAGLIO GIORNALIERO', 40);
      doc.moveDown(0.2);

      const dY = doc.y, dColW = [80, 85, 255], dRH = 16;
      ['Data', 'Incasso', 'Note'].forEach((h, i) => {
        const x = 42 + dColW.slice(0, i).reduce((a, b) => a + b, 0);
        doc.rect(x, dY, dColW[i], dRH).fill('#2196F3');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFF').text(h, x + 5, dY + 4, { width: dColW[i] - 10 });
      });

      cY = dY + dRH;
      corrispettivi.forEach((c, idx) => {
        if (cY > 730) { doc.addPage(); cY = 50; }
        const fill = idx % 2 === 0 ? '#F8F9FA' : '#FFF';
        doc.rect(42, cY, dColW.reduce((a, b) => a + b), dRH).fill(fill);

        const dataF = `${String(c.giorno).padStart(2,'0')}/${String(mese).padStart(2,'0')}/${anno}`;
        const vals = [dataF, `€${(c.totale || 0).toFixed(2)}`, c.note || '-'];

        vals.forEach((v, i) => {
          const x = 42 + dColW.slice(0, i).reduce((a, b) => a + b, 0);
          doc.fontSize(7).font('Helvetica').fillColor('#333').text(v, x + 5, cY + 4, { width: dColW[i] - 10, align: i === 1 ? 'right' : 'left' });
        });
        cY += dRH;
      });

      // Footer
      const fY = doc.page.height - 50;
      doc.moveTo(40, fY).lineTo(doc.page.width - 40, fY).stroke('#E0E0E0');
      doc.fontSize(7).fillColor('#999').text(`Generato il ${new Date().toLocaleString('it-IT')} | Pastificio Nonna Claudia`, 40, fY + 8);

      doc.end();
      const buffer = await pdfPromise;
      logger.info(`✅ PDF: ${buffer.length} bytes`);
      return buffer;

    } catch (error) {
      logger.error('❌ PDF:', error);
      throw error;
    }
  }

  async generaCsvCorrispettivi(anno, mese) {
    try {
      logger.info(`📊 CSV ${mese}/${anno}...`);

      const corrispettivi = await Corrispettivo.find({ anno, mese }).sort({ giorno: 1 });
      if (!corrispettivi.length) throw new Error(`Nessun corrispettivo`);

      const totali = this.calcolaTotali(corrispettivi);
      const nomeMese = this.getNomeMese(mese - 1);

      let csv = `PASTIFICIO NONNA CLAUDIA - REGISTRO CORRISPETTIVI ${nomeMese.toUpperCase()} ${anno}\n`;
      csv += `Via Carmine 20/B - Assemini (CA) - Tel: 389 887 9833\n`;
      csv += `Generato il: ${new Date().toLocaleDateString('it-IT')}\n\n`;
      csv += 'Data,Giorno,Totale €,IVA 22% €,IVA 10% €,IVA 4% €,Esente €,Note\n';

      corrispettivi.forEach(c => {
        const data = `${String(c.giorno).padStart(2,'0')}/${String(mese).padStart(2,'0')}/${anno}`;
        const tot = (c.totale || 0).toFixed(2);
        const i22 = (c.dettaglioIva?.iva22 || 0).toFixed(2);
        const i10 = (c.dettaglioIva?.iva10 || 0).toFixed(2);
        const i4 = (c.dettaglioIva?.iva4 || 0).toFixed(2);
        const es = (c.dettaglioIva?.esente || 0).toFixed(2);
        const note = c.note ? `"${c.note.replace(/"/g,'""')}"` : '';
        csv += `${data},${c.giorno},${tot},${i22},${i10},${i4},${es},${note}\n`;
      });

      csv += `\nTOTALE,,${totali.totaleMese.toFixed(2)},${totali.iva22.toFixed(2)},${totali.iva10.toFixed(2)},${totali.iva4.toFixed(2)},${totali.esente.toFixed(2)},\n`;

      csv += `\nRIEPILOGO IVA:\nAliquota,Totale,IVA Scorporata,Imponibile\n`;
      if (totali.iva22 > 0) csv += `22%,${totali.iva22.toFixed(2)},${(totali.iva22-totali.iva22/1.22).toFixed(2)},${(totali.iva22/1.22).toFixed(2)}\n`;
      if (totali.iva10 > 0) csv += `10%,${totali.iva10.toFixed(2)},${(totali.iva10-totali.iva10/1.10).toFixed(2)},${(totali.iva10/1.10).toFixed(2)}\n`;
      if (totali.iva4 > 0) csv += `4%,${totali.iva4.toFixed(2)},${(totali.iva4-totali.iva4/1.04).toFixed(2)},${(totali.iva4/1.04).toFixed(2)}\n`;
      if (totali.esente > 0) csv += `Esente,${totali.esente.toFixed(2)},0.00,${totali.esente.toFixed(2)}\n`;

      csv += `\nSTATISTICHE:\nMedia Giornaliera,${totali.mediaGiornaliera.toFixed(2)}\nGiorni con Incasso,${totali.giorniConIncasso}\nGiorni Totali,${totali.giorniTotali}\n`;

      const buffer = Buffer.from(csv, 'utf-8');
      logger.info(`✅ CSV: ${buffer.length} bytes`);
      return buffer;

    } catch (error) {
      logger.error('❌ CSV:', error);
      throw error;
    }
  }

  calcolaTotali(corrispettivi) {
    const t = { totaleMese: 0, iva22: 0, iva10: 0, iva4: 0, esente: 0, giorniConIncasso: 0, giorniTotali: corrispettivi.length, mediaGiornaliera: 0 };
    corrispettivi.forEach(c => {
      t.totaleMese += c.totale || 0;
      if (c.dettaglioIva) {
        t.iva22 += c.dettaglioIva.iva22 || 0;
        t.iva10 += c.dettaglioIva.iva10 || 0;
        t.iva4 += c.dettaglioIva.iva4 || 0;
        t.esente += c.dettaglioIva.esente || 0;
      }
      if (c.totale > 0) t.giorniConIncasso++;
    });
    t.mediaGiornaliera = t.giorniConIncasso > 0 ? t.totaleMese / t.giorniConIncasso : 0;
    return t;
  }

  getNomeMese(n) {
    return ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'][n];
  }
}

export default new PdfCorrispettiviService();