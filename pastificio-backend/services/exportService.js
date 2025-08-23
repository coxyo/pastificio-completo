// services/exportService.js
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from '../config/logger.js';
import Ordine from '../models/Ordine.js';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ExportService {
  constructor() {
    this.exportPath = path.join(__dirname, '..', 'exports');
    this.ensureExportDirectory();
  }

  async ensureExportDirectory() {
    try {
      await fs.mkdir(this.exportPath, { recursive: true });
    } catch (error) {
      logger.error('Errore creazione directory export:', error);
    }
  }

  // Export Excel
  async exportToExcel(data, type = 'ordini', filters = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      // Stili
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };

      // Configura colonne in base al tipo
      if (type === 'ordini') {
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Data', key: 'data', width: 12 },
          { header: 'Cliente', key: 'cliente', width: 20 },
          { header: 'Telefono', key: 'telefono', width: 15 },
          { header: 'Prodotti', key: 'prodotti', width: 40 },
          { header: 'Totale', key: 'totale', width: 12 },
          { header: 'Stato', key: 'stato', width: 15 },
          { header: 'Note', key: 'note', width: 30 }
        ];

        // Applica stile header
        worksheet.getRow(1).eachCell(cell => {
          Object.assign(cell, headerStyle);
        });

        // Aggiungi dati
        data.forEach(ordine => {
          worksheet.addRow({
            id: ordine._id?.toString().slice(-6) || '',
            data: format(new Date(ordine.dataRitiro), 'dd/MM/yyyy'),
            cliente: ordine.nomeCliente,
            telefono: ordine.telefono,
            prodotti: ordine.prodotti?.map(p => 
              `${p.nome} (${p.quantita}${p.unita})`
            ).join(', ') || '',
            totale: `€ ${ordine.totale?.toFixed(2) || '0.00'}`,
            stato: ordine.stato || 'da preparare',
            note: ordine.note || ''
          });
        });

        // Formattazione automatica
        worksheet.columns.forEach(column => {
          column.eachCell({ includeEmpty: false }, cell => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });

      } else if (type === 'statistiche') {
        worksheet.columns = [
          { header: 'Periodo', key: 'periodo', width: 15 },
          { header: 'Numero Ordini', key: 'numeroOrdini', width: 15 },
          { header: 'Totale Vendite', key: 'totaleVendite', width: 15 },
          { header: 'Media Ordini', key: 'mediaOrdini', width: 15 },
          { header: 'Prodotto più venduto', key: 'topProdotto', width: 25 }
        ];

        worksheet.getRow(1).eachCell(cell => {
          Object.assign(cell, headerStyle);
        });

        data.forEach(stat => {
          worksheet.addRow(stat);
        });
      }

      // Aggiungi totali
      if (type === 'ordini' && data.length > 0) {
        const totaleGenerale = data.reduce((sum, ord) => sum + (ord.totale || 0), 0);
        worksheet.addRow({});
        const totalsRow = worksheet.addRow({
          prodotti: 'TOTALE',
          totale: `€ ${totaleGenerale.toFixed(2)}`
        });
        totalsRow.font = { bold: true };
      }

      // Salva file
      const filename = `export_${type}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      const filepath = path.join(this.exportPath, filename);
      await workbook.xlsx.writeFile(filepath);

      logger.info('Export Excel creato:', filename);
      return { success: true, filename, filepath };

    } catch (error) {
      logger.error('Errore export Excel:', error);
      throw error;
    }
  }

  // Export PDF
  async exportToPDF(data, type = 'ordini', filters = {}) {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `export_${type}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
      const filepath = path.join(this.exportPath, filename);
      
      // Stream to file
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20)
         .text('Pastificio Nonna Claudia', { align: 'center' })
         .fontSize(16)
         .text(`Report ${type.charAt(0).toUpperCase() + type.slice(1)}`, { align: 'center' })
         .fontSize(10)
         .text(`Generato il: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, { align: 'center' })
         .moveDown(2);

      if (type === 'ordini') {
        // Tabella ordini
        doc.fontSize(12);
        let yPosition = doc.y;

        data.forEach((ordine, index) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          doc.text(`Ordine #${ordine._id?.toString().slice(-6) || index + 1}`, 50, yPosition);
          yPosition += 20;

          doc.fontSize(10)
             .text(`Cliente: ${ordine.nomeCliente} - Tel: ${ordine.telefono}`, 70, yPosition);
          yPosition += 15;

          doc.text(`Data ritiro: ${format(new Date(ordine.dataRitiro), 'dd/MM/yyyy')}`, 70, yPosition);
          yPosition += 15;

          doc.text('Prodotti:', 70, yPosition);
          yPosition += 15;

          ordine.prodotti?.forEach(prod => {
            doc.text(`- ${prod.nome}: ${prod.quantita}${prod.unita} (€ ${prod.prezzo?.toFixed(2) || '0.00'})`, 90, yPosition);
            yPosition += 15;
          });

          doc.text(`Totale: € ${ordine.totale?.toFixed(2) || '0.00'}`, 70, yPosition);
          yPosition += 30;
        });

        // Riepilogo
        const totaleGenerale = data.reduce((sum, ord) => sum + (ord.totale || 0), 0);
        doc.fontSize(14)
           .text(`TOTALE GENERALE: € ${totaleGenerale.toFixed(2)}`, { align: 'right' });
      }

      // Fine documento
      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          logger.info('Export PDF creato:', filename);
          resolve({ success: true, filename, filepath });
        });
        stream.on('error', reject);
      });

    } catch (error) {
      logger.error('Errore export PDF:', error);
      throw error;
    }
  }

  // Export dati per periodo
  async exportPeriodData(startDate, endDate, format = 'excel') {
    try {
      const ordini = await Ordine.find({
        dataRitiro: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ dataRitiro: 1 });

      if (format === 'excel') {
        return await this.exportToExcel(ordini, 'ordini', { startDate, endDate });
      } else if (format === 'pdf') {
        return await this.exportToPDF(ordini, 'ordini', { startDate, endDate });
      }

    } catch (error) {
      logger.error('Errore export periodo:', error);
      throw error;
    }
  }

  // Pulizia file vecchi
  async cleanupOldExports(daysToKeep = 30) {
    try {
      const files = await fs.readdir(this.exportPath);
      const now = Date.now();
      const cutoffTime = daysToKeep * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.exportPath, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > cutoffTime) {
          await fs.unlink(filePath);
          logger.info('File export eliminato:', file);
        }
      }
    } catch (error) {
      logger.error('Errore pulizia export:', error);
    }
  }
}

export default new ExportService();
