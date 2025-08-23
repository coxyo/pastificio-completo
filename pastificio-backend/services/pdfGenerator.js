// pastificio-backend/services/pdfGenerator.js
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pdfGenerator = {
  /**
   * Genera PDF per un ordine
   */
  async generateOrdinePDF(ordine, template = 'standard') {
    return new Promise((resolve, reject) => {
      try {
        // Crea cartella temp se non esiste
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Nome file
        const fileName = `ordine_${ordine._id}_${Date.now()}.pdf`;
        const filePath = path.join(tempDir, fileName);

        // Crea documento PDF
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        // Stream al file
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('PASTIFICIO NONNA CLAUDIA', { align: 'center' });
        
        doc.fontSize(14)
           .font('Helvetica')
           .text('Documento di Consegna', { align: 'center' });
        
        doc.moveDown(2);

        // Info ordine
        doc.fontSize(12);
        const infoY = doc.y;
        
        // Colonna sinistra
        doc.text(`Ordine N°: ${ordine._id}`, 50, infoY);
        doc.text(`Data: ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}`, 50, infoY + 20);
        doc.text(`Ora ritiro: ${ordine.oraRitiro || '10:00'}`, 50, infoY + 40);
        
        // Colonna destra
        doc.text(`Cliente: ${ordine.nomeCliente}`, 300, infoY);
        doc.text(`Telefono: ${ordine.telefono}`, 300, infoY + 20);
        if (ordine.deveViaggiare) {
          doc.text('DA VIAGGIO: SÌ', 300, infoY + 40, { 
            width: 200,
            characterSpacing: 1
          });
        }

        doc.moveDown(3);

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

        // Linea sotto intestazione
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

            yPosition += 20;

            // Nuova pagina se necessario
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 50;
            }
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

        // Note
        if (ordine.note) {
          doc.moveDown(2);
          doc.font('Helvetica')
             .fontSize(10)
             .text('Note:', 50);
          doc.fontSize(10)
             .text(ordine.note, 50, doc.y, { width: 500 });
        }

        // Footer
        const pageHeight = doc.page.height;
        doc.font('Helvetica')
           .fontSize(8)
           .text(
             `Documento generato il ${new Date().toLocaleString('it-IT')}`,
             50,
             pageHeight - 100,
             { align: 'center', width: 500 }
           );

        // Finalizza
        doc.end();

        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Genera report PDF
   */
  async generateReportPDF(data, tipo = 'giornaliero') {
    return new Promise((resolve, reject) => {
      try {
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const fileName = `report_${tipo}_${Date.now()}.pdf`;
        const filePath = path.join(tempDir, fileName);

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
           .text(`Report ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, { align: 'center' });
        
        doc.fontSize(12)
           .text(`Data: ${new Date(data.data).toLocaleDateString('it-IT')}`, { align: 'center' });

        doc.moveDown(2);

        // Statistiche
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .text('RIEPILOGO', 50);
        
        doc.font('Helvetica')
           .fontSize(12);

        const statsY = doc.y + 10;
        doc.text(`Totale ordini: ${data.totaleOrdini}`, 50, statsY);
        doc.text(`Valore totale: € ${data.totaleValore.toFixed(2)}`, 250, statsY);
        doc.text(`Media ordine: € ${data.mediaOrdine.toFixed(2)}`, 400, statsY);

        doc.moveDown(2);

        // Produzione giornaliera
        if (data.produzioneGiornaliera && data.produzioneGiornaliera.length > 0) {
          doc.font('Helvetica-Bold')
             .fontSize(14)
             .text('PRODUZIONE', 50);
          
          doc.moveDown();
          
          const tableTop = doc.y;
          doc.fontSize(11);
          doc.text('Categoria', 50, tableTop);
          doc.text('Prodotto', 150, tableTop);
          doc.text('Quantità', 350, tableTop);
          doc.text('Unità', 450, tableTop);

          doc.moveTo(50, tableTop + 15)
             .lineTo(550, tableTop + 15)
             .stroke();

          doc.font('Helvetica');
          let yPos = tableTop + 25;

          data.produzioneGiornaliera.forEach(item => {
            doc.text(item.categoria || '-', 50, yPos);
            doc.text(item.prodotto, 150, yPos);
            doc.text(item.quantita.toString(), 350, yPos);
            doc.text(item.unita || 'pz', 450, yPos);
            yPos += 18;

            if (yPos > 700) {
              doc.addPage();
              yPos = 50;
            }
          });
        }

        // Lista ordini
        if (data.ordini && data.ordini.length > 0) {
          doc.addPage();
          doc.font('Helvetica-Bold')
             .fontSize(14)
             .text('DETTAGLIO ORDINI', 50);
          
          doc.moveDown();

          data.ordini.forEach((ordine, index) => {
            if (doc.y > 700) {
              doc.addPage();
            }

            doc.font('Helvetica-Bold')
               .fontSize(11)
               .text(`Ordine ${index + 1}`, 50);
            
            doc.font('Helvetica')
               .fontSize(10);
            
            const orderY = doc.y + 5;
            doc.text(`Cliente: ${ordine.nomeCliente}`, 50, orderY);
            doc.text(`Ora: ${ordine.oraRitiro || '10:00'}`, 300, orderY);
            doc.text(`Totale: € ${(ordine.totale || 0).toFixed(2)}`, 450, orderY);
            
            doc.moveDown(1.5);
          });
        }

        // Footer
        const pageHeight = doc.page.height;
        doc.font('Helvetica')
           .fontSize(8)
           .text(
             `Report generato il ${new Date().toLocaleString('it-IT')}`,
             50,
             pageHeight - 50,
             { align: 'center', width: 500 }
           );

        doc.end();

        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }
};

export default pdfGenerator;