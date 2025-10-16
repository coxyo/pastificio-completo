// services/pdfListinoService.js - ✅ FIX LOOP INFINITO
import PDFDocument from 'pdfkit';
import Prodotto from '../models/Prodotto.js';
import logger from '../config/logger.js';

const pdfListinoService = {
  /**
   * Genera PDF del listino prezzi
   */
  generaListinoPDF: async (options = {}) => {
    try {
      const {
        disponibiliOnly = true,
        includiVarianti = false,
        includiDescrizioni = false,
        includiAllergeni = false
      } = options;

      // Recupera prodotti
      const filter = { attivo: true };
      if (disponibiliOnly) filter.disponibile = true;

      const prodotti = await Prodotto.find(filter)
        .sort({ categoria: 1, ordinamento: 1, nome: 1 });

      if (prodotti.length === 0) {
        throw new Error('Nessun prodotto trovato per il listino');
      }

      // Crea documento PDF - ✅ SENZA bufferPages e SENZA evento pageAdded
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 100, left: 50, right: 50 }
      });

      // ✅ AGGIUNGI FOOTER MANUALMENTE SOLO ALLA FINE
      let currentPage = 1;

      // Header
      addHeader(doc);
      doc.moveDown(2);

      // Raggruppa prodotti per categoria
      const prodottiPerCategoria = prodotti.reduce((acc, prodotto) => {
        if (!acc[prodotto.categoria]) {
          acc[prodotto.categoria] = [];
        }
        acc[prodotto.categoria].push(prodotto);
        return acc;
      }, {});

      // Ordine categorie
      const ordineCategorie = ['Ravioli', 'Dolci', 'Pardulas', 'Panadas', 'Pasta', 'Altro'];

      // Stampa prodotti per categoria
      for (const categoria of ordineCategorie) {
        if (!prodottiPerCategoria[categoria] || prodottiPerCategoria[categoria].length === 0) {
          continue;
        }

        // Check spazio pagina (lascia 130px per footer)
        if (doc.y > 650) {
          addFooterToCurrentPage(doc, currentPage);
          doc.addPage();
          currentPage++;
        }

        // Titolo categoria
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#e74c3c')
           .text(categoria.toUpperCase(), { underline: true });

        doc.moveDown(0.5);

        // Prodotti della categoria
        for (const prodotto of prodottiPerCategoria[categoria]) {
          // Check spazio pagina
          if (doc.y > 650) {
            addFooterToCurrentPage(doc, currentPage);
            doc.addPage();
            currentPage++;
          }

          // Nome prodotto
          doc.fontSize(11)
             .font('Helvetica-Bold')
             .fillColor('#2c3e50')
             .text(prodotto.nome);

          // Descrizione
          if (includiDescrizioni && prodotto.descrizione) {
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor('#7f8c8d')
               .text(`   ${prodotto.descrizione}`, { indent: 20 });
          }

          // Prezzi
          const prezzi = [];
          if (prodotto.prezzoKg > 0) {
            prezzi.push(`€${prodotto.prezzoKg.toFixed(2)}/Kg`);
          }
          if (prodotto.prezzoPezzo > 0) {
            prezzi.push(`€${prodotto.prezzoPezzo.toFixed(2)}/pz`);
          }

          if (prezzi.length > 0) {
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .fillColor('#27ae60')
               .text(`   ${prezzi.join(' - ')}`, { indent: 20 });
          }

          // Unità di misura
          if (prodotto.unitaMisuraDisponibili && prodotto.unitaMisuraDisponibili.length > 0) {
            doc.fontSize(8)
               .font('Helvetica')
               .fillColor('#95a5a6')
               .text(`   Disponibile in: ${prodotto.unitaMisuraDisponibili.join(', ')}`, { indent: 20 });
          }

          // Varianti
          if (includiVarianti && prodotto.varianti && prodotto.varianti.length > 0) {
            doc.fontSize(8)
               .fillColor('#95a5a6')
               .text('   Varianti:', { indent: 20 });

            prodotto.varianti.forEach(variante => {
              if (variante.disponibile) {
                const prezziVariante = [];
                if (variante.prezzoKg > 0) prezziVariante.push(`€${variante.prezzoKg.toFixed(2)}/Kg`);
                if (variante.prezzoPezzo > 0) prezziVariante.push(`€${variante.prezzoPezzo.toFixed(2)}/pz`);
                
                if (prezziVariante.length > 0) {
                  doc.text(`     • ${variante.nome}: ${prezziVariante.join(' - ')}`, { indent: 30 });
                }
              }
            });
          }

          // Allergeni
          if (includiAllergeni && prodotto.allergeni && prodotto.allergeni.length > 0) {
            doc.fontSize(7)
               .fillColor('#e67e22')
               .text(`   ⚠️ Allergeni: ${prodotto.allergeni.join(', ')}`, { indent: 20 });
          }

          doc.moveDown(0.8);
        }

        doc.moveDown();
      }

      // ✅ AGGIUNGI FOOTER ALL'ULTIMA PAGINA
      addFooterToCurrentPage(doc, currentPage);

      logger.info(`Listino PDF generato: ${prodotti.length} prodotti, ${currentPage} pagine`);

      return doc;

    } catch (error) {
      logger.error('Errore generazione listino PDF:', error);
      throw error;
    }
  },

  /**
   * Genera PDF listino per singola categoria
   */
  generaListinoCategoriaPDF: async (categoria, options = {}) => {
    try {
      const prodotti = await Prodotto.find({
        categoria,
        attivo: true,
        disponibile: true
      }).sort({ ordinamento: 1, nome: 1 });

      if (prodotti.length === 0) {
        throw new Error(`Nessun prodotto trovato per categoria: ${categoria}`);
      }

      const doc = new PDFDocument({ 
        size: 'A4', 
        margins: { top: 50, bottom: 100, left: 50, right: 50 }
      });

      let currentPage = 1;

      // Header
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text(`LISTINO ${categoria.toUpperCase()}`, { align: 'center' });

      doc.moveDown();
      doc.fontSize(12)
         .fillColor('#7f8c8d')
         .text('Pastificio Nonna Claudia', { align: 'center' });

      doc.fontSize(10)
         .fillColor('#95a5a6')
         .text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, { align: 'center' });

      doc.moveDown(2);
      drawLine(doc);
      doc.moveDown();

      // Prodotti
      prodotti.forEach(prodotto => {
        if (doc.y > 650) {
          addFooterToCurrentPage(doc, currentPage);
          doc.addPage();
          currentPage++;
        }

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text(prodotto.nome);

        const prezzi = [];
        if (prodotto.prezzoKg > 0) prezzi.push(`€${prodotto.prezzoKg.toFixed(2)}/Kg`);
        if (prodotto.prezzoPezzo > 0) prezzi.push(`€${prodotto.prezzoPezzo.toFixed(2)}/pz`);

        if (prezzi.length > 0) {
          doc.fontSize(11)
             .font('Helvetica')
             .fillColor('#27ae60')
             .text(`   ${prezzi.join(' - ')}`);
        }

        if (prodotto.descrizione) {
          doc.fontSize(9)
             .fillColor('#7f8c8d')
             .text(`   ${prodotto.descrizione}`);
        }

        doc.moveDown();
      });

      // Footer ultima pagina
      addFooterToCurrentPage(doc, currentPage);

      logger.info(`Listino categoria PDF generato: ${categoria}, ${prodotti.length} prodotti`);

      return doc;

    } catch (error) {
      logger.error('Errore generazione listino categoria PDF:', error);
      throw error;
    }
  }
};

/**
 * ✅ Helper: Aggiungi header
 */
function addHeader(doc) {
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor('#2c3e50')
     .text('PASTIFICIO NONNA CLAUDIA', { align: 'center' });

  doc.fontSize(16)
     .font('Helvetica')
     .fillColor('#7f8c8d')
     .text('Listino Prezzi', { align: 'center' });

  doc.moveDown();
  doc.fontSize(10)
     .fillColor('#95a5a6')
     .text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, { align: 'center' });

  doc.moveDown();
  drawLine(doc);
  doc.moveDown();

  // Info contatti
  doc.fontSize(9)
     .fillColor('#34495e')
     .text('📍 Via Carmine 20/B, Assemini (CA)', { align: 'center' })
     .text('📞 Tel: 389 887 9833', { align: 'center' })
     .text('✉️ info@pastificiodc.it', { align: 'center' });
}

/**
 * ✅ Helper: Aggiungi footer SOLO alla pagina corrente (senza triggering eventi)
 */
function addFooterToCurrentPage(doc, pageNumber) {
  const footerY = doc.page.height - 80;
  
  // Salva stato corrente
  const currentY = doc.y;
  
  // Vai alla posizione footer
  doc.y = footerY;
  
  // Linea footer
  doc.save();
  doc.moveTo(50, footerY)
     .lineTo(doc.page.width - 50, footerY)
     .strokeColor('#bdc3c7')
     .lineWidth(0.5)
     .stroke();
  doc.restore();

  // Testo footer - ✅ SENZA width per evitare line wrap
  doc.fontSize(8)
     .fillColor('#95a5a6')
     .text(
       `Listino valido fino a nuova comunicazione - Pag. ${pageNumber}`,
       50,
       footerY + 15,
       { align: 'center', lineBreak: false } // ✅ lineBreak: false evita creazione nuova pagina
     );
}

/**
 * Helper: Disegna linea orizzontale
 */
function drawLine(doc) {
  doc.save();
  doc.moveTo(50, doc.y)
     .lineTo(doc.page.width - 50, doc.y)
     .strokeColor('#bdc3c7')
     .lineWidth(1)
     .stroke();
  doc.restore();
}

export default pdfListinoService;