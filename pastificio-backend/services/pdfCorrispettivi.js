// services/pdfCorrispettivi.js
// 🎨 VERSIONE PROFESSIONALE - PDF E EXCEL BELLISSIMI
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import logger from '../config/logger.js';
import Corrispettivo from '../models/Corrispettivo.js';

/**
 * SERVIZIO GENERAZIONE REPORT CORRISPETTIVI
 * - PDF professionale con layout moderno
 * - Excel formattato con grafici
 */

class PdfCorrispettiviService {

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📄 GENERA PDF PROFESSIONALE
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async generaPdfCorrispettivi(anno, mese) {
    try {
      logger.info(`📄 Generazione PDF professionale ${mese}/${anno}...`);

      const corrispettivi = await Corrispettivo.find({ anno, mese }).sort({ giorno: 1 });

      if (corrispettivi.length === 0) {
        throw new Error(`Nessun corrispettivo trovato per ${mese}/${anno}`);
      }

      const totali = this.calcolaTotali(corrispettivi);

      // Crea documento PDF con margini ottimizzati
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        info: {
          Title: `Report Corrispettivi ${mese}/${anno}`,
          Author: 'Pastificio Nonna Claudia',
          Subject: 'Report Mensile Corrispettivi',
          Keywords: 'corrispettivi, iva, fatturazione',
          Creator: 'Sistema Gestionale Pastificio'
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      const pdfPromise = new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
      });

      // ━━━ COSTRUISCI PDF ━━━
      this.aggiungiHeaderProfessionale(doc, anno, mese);
      this.aggiungiKpiCards(doc, totali, corrispettivi);
      this.aggiungiDettaglioIvaProfessionale(doc, totali);
      this.aggiungiTabellaGiornalieraProfessionale(doc, corrispettivi, anno, mese);
      this.aggiungiFooterProfessionale(doc, totali);

      doc.end();

      const buffer = await pdfPromise;
      logger.info(`✅ PDF professionale generato: ${buffer.length} bytes`);
      return buffer;

    } catch (error) {
      logger.error('❌ Errore generazione PDF:', error);
      throw error;
    }
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📊 GENERA EXCEL PROFESSIONALE CON GRAFICI
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async generaCsvCorrispettivi(anno, mese) {
    try {
      logger.info(`📊 Generazione Excel professionale ${mese}/${anno}...`);

      const corrispettivi = await Corrispettivo.find({ anno, mese }).sort({ giorno: 1 });

      if (corrispettivi.length === 0) {
        throw new Error(`Nessun corrispettivo trovato per ${mese}/${anno}`);
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Pastificio Nonna Claudia';
      workbook.created = new Date();

      // ━━━ SHEET 1: DETTAGLIO GIORNALIERO ━━━
      const sheetDettaglio = workbook.addWorksheet('Dettaglio Giornaliero', {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
      });

      // Header con stile
      const headerRow = sheetDettaglio.addRow([
        'Data', 'Giorno', 'Totale €', 'IVA 22%', 'IVA 10%', 'IVA 4%', 'Esente', 'Note', 'Operatore'
      ]);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2196F3' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Dati con formattazione alternata
      corrispettivi.forEach((c, index) => {
        const row = sheetDettaglio.addRow([
          `${c.giorno}/${mese}/${anno}`,
          c.giorno,
          c.totale || 0,
          c.dettaglioIva?.iva22 || 0,
          c.dettaglioIva?.iva10 || 0,
          c.dettaglioIva?.iva4 || 0,
          c.dettaglioIva?.esente || 0,
          c.note || '',
          c.operatore || 'Sistema'
        ]);

        // Formattazione Euro
        [3, 4, 5, 6, 7].forEach(colNum => {
          const cell = row.getCell(colNum);
          cell.numFmt = '€#,##0.00';
        });

        // Background alternato
        if (index % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8F9FA' }
            };
          });
        }

        // Bordi
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
        });
      });

      // Riga TOTALE con formule
      const totaliRow = sheetDettaglio.addRow([
        'TOTALE', '', 
        { formula: `SUM(C2:C${corrispettivi.length + 1})` },
        { formula: `SUM(D2:D${corrispettivi.length + 1})` },
        { formula: `SUM(E2:E${corrispettivi.length + 1})` },
        { formula: `SUM(F2:F${corrispettivi.length + 1})` },
        { formula: `SUM(G2:G${corrispettivi.length + 1})` },
        '', ''
      ]);

      totaliRow.eachCell((cell, colNum) => {
        cell.font = { bold: true, size: 12 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEB3B' }
        };
        if (colNum >= 3 && colNum <= 7) {
          cell.numFmt = '€#,##0.00';
        }
      });

      // Larghezze colonne
      sheetDettaglio.columns = [
        { width: 12 }, // Data
        { width: 8 },  // Giorno
        { width: 12 }, // Totale
        { width: 12 }, // IVA 22%
        { width: 12 }, // IVA 10%
        { width: 12 }, // IVA 4%
        { width: 12 }, // Esente
        { width: 30 }, // Note
        { width: 15 }  // Operatore
      ];

      // ━━━ SHEET 2: RIEPILOGO IVA ━━━
      const sheetRiepilogo = workbook.addWorksheet('Riepilogo IVA');

      const totali = this.calcolaTotali(corrispettivi);

      // Titolo
      const titleRow = sheetRiepilogo.addRow(['RIEPILOGO MENSILE CORRISPETTIVI']);
      titleRow.font = { bold: true, size: 16, color: { argb: 'FF2196F3' } };
      sheetRiepilogo.mergeCells('A1:E1');
      titleRow.alignment = { horizontal: 'center' };
      
      sheetRiepilogo.addRow([]);

      // Mese/Anno
      const meseRow = sheetRiepilogo.addRow([
        `Periodo: ${this.getNomeMese(mese - 1)} ${anno}`
      ]);
      meseRow.font = { bold: true, size: 12 };
      sheetRiepilogo.mergeCells(`A${meseRow.number}:E${meseRow.number}`);
      meseRow.alignment = { horizontal: 'center' };

      sheetRiepilogo.addRow([]);

      // KPI Cards
      const kpiLabels = sheetRiepilogo.addRow([
        '💰 Incasso Totale', 
        '📅 Giorni Apertura', 
        '📈 Media Giornaliera',
        '🏆 Giorno Migliore'
      ]);
      kpiLabels.font = { bold: true, size: 11 };
      kpiLabels.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE3F2FD' }
        };
        cell.alignment = { horizontal: 'center' };
      });

      const giornoMax = corrispettivi.reduce((max, c) => 
        (c.totale > max.totale) ? c : max, { totale: 0, giorno: 0 }
      );

      const kpiValues = sheetRiepilogo.addRow([
        totali.totaleMese,
        `${totali.giorniConIncasso}/${totali.giorniTotali}`,
        totali.mediaGiornaliera,
        `${giornoMax.giorno}/${mese} (€${giornoMax.totale.toFixed(2)})`
      ]);
      
      kpiValues.getCell(1).numFmt = '€#,##0.00';
      kpiValues.getCell(3).numFmt = '€#,##0.00';
      
      kpiValues.eachCell((cell) => {
        cell.font = { bold: true, size: 13, color: { argb: 'FF1976D2' } };
        cell.alignment = { horizontal: 'center' };
      });

      sheetRiepilogo.addRow([]);
      sheetRiepilogo.addRow([]);

      // Tabella IVA
      const ivaHeaderRow = sheetRiepilogo.addRow([
        'Aliquota IVA', 'Imponibile + IVA', 'IVA Scorporata', 'Imponibile Netto', '% sul Totale'
      ]);
      
      ivaHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4CAF50' }
        };
        cell.alignment = { horizontal: 'center' };
      });

      // Righe IVA
      const righeIva = [
        { label: '22% (Ordinaria)', totale: totali.iva22, divisore: 1.22 },
        { label: '10% (Ridotta)', totale: totali.iva10, divisore: 1.10 },
        { label: '4% (Super Ridotta)', totale: totali.iva4, divisore: 1.04 },
        { label: 'Esente/Non Imponibile', totale: totali.esente, divisore: 1 }
      ];

      righeIva.forEach((riga, index) => {
        if (riga.totale > 0) {
          const ivaScorp = riga.totale - (riga.totale / riga.divisore);
          const imponibile = riga.totale / riga.divisore;
          const percentuale = (riga.totale / totali.totaleMese * 100);

          const row = sheetRiepilogo.addRow([
            riga.label,
            riga.totale,
            ivaScorp,
            imponibile,
            percentuale / 100
          ]);

          [2, 3, 4].forEach(colNum => {
            row.getCell(colNum).numFmt = '€#,##0.00';
          });
          
          row.getCell(5).numFmt = '0.00%';

          if (index % 2 === 0) {
            row.eachCell((cell) => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8F9FA' }
              };
            });
          }
        }
      });

      // Riga totale IVA
      const totalIvaRow = sheetRiepilogo.addRow([
        'TOTALE',
        totali.totaleMese,
        (totali.iva22 - totali.iva22 / 1.22) + 
        (totali.iva10 - totali.iva10 / 1.10) + 
        (totali.iva4 - totali.iva4 / 1.04),
        totali.iva22 / 1.22 + totali.iva10 / 1.10 + totali.iva4 / 1.04 + totali.esente,
        1
      ]);

      totalIvaRow.eachCell((cell, colNum) => {
        cell.font = { bold: true, size: 12 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEB3B' }
        };
        if (colNum >= 2 && colNum <= 4) {
          cell.numFmt = '€#,##0.00';
        }
        if (colNum === 5) {
          cell.numFmt = '0.00%';
        }
      });

      // Larghezze colonne
      sheetRiepilogo.columns = [
        { width: 25 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 15 }
      ];

      // ━━━ GENERA BUFFER ━━━
      const buffer = await workbook.xlsx.writeBuffer();

      logger.info(`✅ Excel professionale generato: ${buffer.length} bytes`);
      return buffer;

    } catch (error) {
      logger.error('❌ Errore generazione Excel:', error);
      throw error;
    }
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🎨 FUNZIONI RENDERING PDF PROFESSIONALE
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */

  aggiungiHeaderProfessionale(doc, anno, mese) {
    const nomeMese = this.getNomeMese(mese - 1);
    const pageWidth = doc.page.width - 80;

    // Background header con gradiente simulato
    doc.rect(40, 40, pageWidth, 100)
       .fill('#2196F3');

    // Logo/Emoji grande
    doc.fontSize(48)
       .fillColor('#FFFFFF')
       .text('🍰', 50, 55);

    // Titolo azienda
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF')
       .text('Pastificio Nonna Claudia', 120, 60);

    // Sottotitolo
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#E3F2FD')
       .text('Via Carmine 20/B, Assemini (CA) | Tel: 389 887 9833', 120, 90);

    // Titolo report
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#1976D2')
       .text(`Report Corrispettivi - ${nomeMese} ${anno}`, 40, 160, {
         align: 'center',
         width: pageWidth
       });

    doc.moveDown(2);
  }

  aggiungiKpiCards(doc, totali, corrispettivi) {
    const startY = doc.y + 20;
    const cardWidth = 130;
    const cardHeight = 70;
    const gap = 10;
    const startX = 50;

    const giornoMax = corrispettivi.reduce((max, c) => 
      (c.totale > max.totale) ? c : max, { totale: 0, giorno: 0 }
    );

    const cards = [
      { 
        label: 'Incasso Totale', 
        value: `€${totali.totaleMese.toFixed(2)}`,
        color: '#4CAF50'
      },
      { 
        label: 'Media Giornaliera', 
        value: `€${totali.mediaGiornaliera.toFixed(2)}`,
        color: '#2196F3'
      },
      { 
        label: 'Giorni Apertura', 
        value: `${totali.giorniConIncasso}/${totali.giorniTotali}`,
        color: '#FF9800'
      },
      { 
        label: 'Giorno Migliore', 
        value: `${giornoMax.giorno} (€${giornoMax.totale.toFixed(2)})`,
        color: '#9C27B0'
      }
    ];

    cards.forEach((card, index) => {
      const x = startX + (index * (cardWidth + gap));

      // Bordo card
      doc.rect(x, startY, cardWidth, cardHeight)
         .fillAndStroke('#F5F5F5', '#E0E0E0');

      // Barra colorata top
      doc.rect(x, startY, cardWidth, 5)
         .fill(card.color);

      // Label
      doc.fontSize(9)
         .fillColor('#666666')
         .text(card.label, x + 5, startY + 15, {
           width: cardWidth - 10,
           align: 'center'
         });

      // Valore
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor(card.color)
         .text(card.value, x + 5, startY + 35, {
           width: cardWidth - 10,
           align: 'center'
         });
    });

    doc.y = startY + cardHeight + 30;
  }

  aggiungiDettaglioIvaProfessionale(doc, totali) {
    // Titolo sezione
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2196F3')
       .text('💶 DETTAGLIO IVA', 40);

    doc.moveDown(0.5);

    const startY = doc.y;
    const colWidths = [110, 110, 110, 110];
    const rowHeight = 25;
    const startX = 50;

    // Header tabella
    const headers = ['Aliquota', 'Imponibile+IVA', 'IVA Scorp.', 'Imponibile'];
    
    headers.forEach((header, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      
      doc.rect(x, startY, colWidths[i], rowHeight)
         .fill('#4CAF50');
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#FFFFFF')
         .text(header, x + 5, startY + 8, {
           width: colWidths[i] - 10,
           align: 'center'
         });
    });

    let currentY = startY + rowHeight;

    // Righe IVA
    const righeIva = [
      { label: '10% (Ridotta)', totale: totali.iva10, divisore: 1.10 }
    ];

    if (totali.iva22 > 0) {
      righeIva.unshift({ label: '22% (Ordinaria)', totale: totali.iva22, divisore: 1.22 });
    }
    if (totali.iva4 > 0) {
      righeIva.push({ label: '4% (Super)', totale: totali.iva4, divisore: 1.04 });
    }
    if (totali.esente > 0) {
      righeIva.push({ label: 'Esente', totale: totali.esente, divisore: 1 });
    }

    righeIva.forEach((riga, index) => {
      const fill = index % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
      
      // Background riga
      doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b), rowHeight)
         .fill(fill);

      const ivaScorp = riga.totale - (riga.totale / riga.divisore);
      const imponibile = riga.totale / riga.divisore;

      const values = [
        riga.label,
        `€${riga.totale.toFixed(2)}`,
        `€${ivaScorp.toFixed(2)}`,
        `€${imponibile.toFixed(2)}`
      ];

      values.forEach((value, i) => {
        const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#333333')
           .text(value, x + 5, currentY + 8, {
             width: colWidths[i] - 10,
             align: i === 0 ? 'left' : 'right'
           });
      });

      currentY += rowHeight;
    });

    // Riga TOTALE
    doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b), rowHeight)
       .fill('#FFEB3B');

    const totalValues = [
      'TOTALE',
      `€${totali.totaleMese.toFixed(2)}`,
      `€${((totali.iva22 - totali.iva22/1.22) + (totali.iva10 - totali.iva10/1.10) + (totali.iva4 - totali.iva4/1.04)).toFixed(2)}`,
      `€${(totali.iva22/1.22 + totali.iva10/1.10 + totali.iva4/1.04 + totali.esente).toFixed(2)}`
    ];

    totalValues.forEach((value, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text(value, x + 5, currentY + 8, {
           width: colWidths[i] - 10,
           align: i === 0 ? 'left' : 'right'
         });
    });

    doc.y = currentY + rowHeight + 30;
  }

  aggiungiTabellaGiornalieraProfessionale(doc, corrispettivi, anno, mese) {
    // Titolo sezione
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2196F3')
       .text('📅 DETTAGLIO GIORNALIERO', 40);

    doc.moveDown(0.5);

    const startY = doc.y;
    const colWidths = [80, 100, 290];
    const rowHeight = 20;
    const startX = 50;

    // Header
    const headers = ['Data', 'Incasso', 'Note'];
    
    headers.forEach((header, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      
      doc.rect(x, startY, colWidths[i], rowHeight)
         .fill('#2196F3');
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#FFFFFF')
         .text(header, x + 5, startY + 5, {
           width: colWidths[i] - 10,
           align: 'left'
         });
    });

    let currentY = startY + rowHeight;

    // Righe dati
    corrispettivi.forEach((c, index) => {
      // Check nuova pagina
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const fill = index % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
      
      doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b), rowHeight)
         .fill(fill);

      const values = [
        `${c.giorno}/${mese}/${anno}`,
        `€${(c.totale || 0).toFixed(2)}`,
        c.note || '-'
      ];

      values.forEach((value, i) => {
        const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#333333')
           .text(value, x + 5, currentY + 5, {
             width: colWidths[i] - 10,
             align: i === 1 ? 'right' : 'left'
           });
      });

      currentY += rowHeight;
    });

    doc.y = currentY + 20;
  }

  aggiungiFooterProfessionale(doc, totali) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 60;

    // Linea separatore
    doc.moveTo(40, footerY)
       .lineTo(doc.page.width - 40, footerY)
       .stroke('#E0E0E0');

    // Info documento
    const now = new Date();
    const dataGenerazione = now.toLocaleString('it-IT');

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#999999')
       .text(`Documento generato automaticamente il ${dataGenerazione}`, 40, footerY + 10);

    doc.text('Pastificio Nonna Claudia | Sistema Gestionale Enterprise', 40, footerY + 25);

    // Numero pagina
    doc.text(`Pagina 1`, doc.page.width - 100, footerY + 10, {
      width: 50,
      align: 'right'
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