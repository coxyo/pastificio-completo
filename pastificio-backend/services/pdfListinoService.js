// services/pdfListinoService.js
import PDFDocument from 'pdfkit';
import Prodotto from '../models/Prodotto.js';
import logger from '../config/logger.js';

class PDFListinoService {
  /**
   * Genera PDF del listino prezzi
   * @param {Object} options - Opzioni di generazione
   * @returns {PDFDocument} - Stream PDF
   */
  async generaListinoPDF(options = {}) {
    try {
      const {
        categoria = null,
        disponibiliOnly = true,
        includiVarianti = true,
        includiDescrizioni = false
      } = options;

      // Carica prodotti dal database
      const filtri = { attivo: true };
      if (categoria) filtri.categoria = categoria;
      if (disponibiliOnly) filtri.disponibile = true;

      const prodotti = await Prodotto.find(filtri)
        .sort({ categoria: 1, ordine: 1, nome: 1 })
        .lean();

      // Crea documento PDF
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      // Header
      this.aggiungiHeader(doc);

      // Data generazione
      doc.fontSize(10)
         .text(`Data: ${new Date().toLocaleDateString('it-IT')}`, 50, 100, { align: 'right' })
         .moveDown();

      // Raggruppa per categoria
      const prodottiPerCategoria = this.raggruppaProdotti(prodotti);

      let y = 140;

      for (const [categoria, listaProdotti] of Object.entries(prodottiPerCategoria)) {
        // Verifica spazio disponibile
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        // Titolo categoria
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor('#2563eb')
           .text(categoria, 50, y);
        
        y += 25;
        doc.moveTo(50, y).lineTo(550, y).stroke('#cbd5e1');
        y += 15;

        // Prodotti della categoria
        for (const prodotto of listaProdotti) {
          // Verifica spazio
          const altezzaProdotto = this.calcolaAltezzaProdotto(prodotto, includiVarianti, includiDescrizioni);
          if (y + altezzaProdotto > 750) {
            doc.addPage();
            y = 50;
          }

          y = this.aggiungiProdotto(doc, prodotto, y, includiVarianti, includiDescrizioni);
          y += 10; // Spazio tra prodotti
        }

        y += 10; // Spazio tra categorie
      }

      // Footer
      this.aggiungiFooter(doc);

      // Finalizza
      doc.end();

      logger.info(`PDF listino generato: ${prodotti.length} prodotti`);

      return doc;
    } catch (error) {
      logger.error('Errore generazione PDF listino:', error);
      throw error;
    }
  }

  /**
   * Aggiunge header al PDF
   */
  aggiungiHeader(doc) {
    doc.fontSize(22)
       .font('Helvetica-Bold')
       .fillColor('#000')
       .text('PASTIFICIO NONNA CLAUDIA', 50, 50, { align: 'center' });
    
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#666')
       .text('Listino Prezzi', 50, 75, { align: 'center' });
  }

  /**
   * Aggiunge footer al PDF
   */
  aggiungiFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc.fontSize(9)
         .fillColor('#999')
         .text(
           `Pagina ${i + 1} di ${pageCount} - Generato il ${new Date().toLocaleDateString('it-IT')}`,
           50,
           780,
           { align: 'center' }
         );
    }
  }

  /**
   * Raggruppa prodotti per categoria
   */
  raggruppaProdotti(prodotti) {
    return prodotti.reduce((acc, prodotto) => {
      const cat = prodotto.categoria || 'Altro';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(prodotto);
      return acc;
    }, {});
  }

  /**
   * Calcola altezza necessaria per un prodotto
   */
  calcolaAltezzaProdotto(prodotto, includiVarianti, includiDescrizioni) {
    let altezza = 30; // Altezza base (nome + prezzo)
    
    if (includiDescrizioni && prodotto.descrizione) {
      altezza += 20;
    }
    
    if (includiVarianti && prodotto.hasVarianti && prodotto.varianti) {
      altezza += prodotto.varianti.length * 15 + 10;
    }
    
    if (prodotto.pezziPerKg) {
      altezza += 15;
    }
    
    return altezza;
  }

  /**
   * Aggiunge un prodotto al PDF
   */
  aggiungiProdotto(doc, prodotto, y, includiVarianti, includiDescrizioni) {
    const startY = y;

    // Nome prodotto
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#000')
       .text(prodotto.nome, 50, y, { width: 300 });

    // Prezzi
    let prezziText = [];
    if (prodotto.prezzoKg) {
      prezziText.push(`€${prodotto.prezzoKg.toFixed(2)}/Kg`);
    }
    if (prodotto.prezzoPezzo) {
      prezziText.push(`€${prodotto.prezzoPezzo.toFixed(2)}/pz`);
    }

    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#2563eb')
       .text(prezziText.join(' • '), 380, y, { width: 150, align: 'right' });

    y += 18;

    // Pezzi per Kg
    if (prodotto.pezziPerKg) {
      doc.fontSize(9)
         .fillColor('#666')
         .text(`${prodotto.pezziPerKg} pezzi per Kg`, 70, y);
      y += 15;
    }

    // Descrizione
    if (includiDescrizioni && prodotto.descrizione) {
      doc.fontSize(9)
         .fillColor('#666')
         .text(prodotto.descrizione, 70, y, { width: 470 });
      y += 20;
    }

    // Varianti
    if (includiVarianti && prodotto.hasVarianti && prodotto.varianti && prodotto.varianti.length > 0) {
      y += 5;
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#666')
         .text('Varianti:', 70, y);
      y += 12;

      prodotto.varianti.forEach(variante => {
        const variantePrezzi = [];
        if (variante.prezzoKg) variantePrezzi.push(`€${variante.prezzoKg.toFixed(2)}/Kg`);
        if (variante.prezzoPezzo) variantePrezzi.push(`€${variante.prezzoPezzo.toFixed(2)}/pz`);

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#666')
           .text(`• ${variante.label}`, 85, y, { width: 250, continued: true })
           .fillColor('#2563eb')
           .text(` - ${variantePrezzi.join(' • ')}`, { align: 'left' });
        
        y += 15;
      });
    }

    // Linea separatore sottile
    y += 5;
    doc.moveTo(50, y).lineTo(550, y).stroke('#e5e7eb');

    return y + 5;
  }

  /**
   * Genera PDF semplificato (una colonna)
   */
  async generaListinoSemplice() {
    try {
      const prodotti = await Prodotto.find({ attivo: true, disponibile: true })
        .sort({ categoria: 1, nome: 1 })
        .lean();

      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      // Titolo
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .text('LISTINO PREZZI', { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(10)
         .text(`Aggiornato al ${new Date().toLocaleDateString('it-IT')}`, { align: 'center' });
      
      doc.moveDown(2);

      // Prodotti
      prodotti.forEach(prodotto => {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(prodotto.nome, { continued: true })
           .font('Helvetica')
           .text(` - €${(prodotto.prezzoKg || prodotto.prezzoPezzo || 0).toFixed(2)}`);
        
        doc.moveDown(0.5);
      });

      doc.end();

      return doc;
    } catch (error) {
      logger.error('Errore generazione PDF semplice:', error);
      throw error;
    }
  }
}

export default new PDFListinoService();