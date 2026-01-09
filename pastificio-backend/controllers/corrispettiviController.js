// controllers/corrispettiviController.js
import Corrispettivo from '../models/Corrispettivo.js';
import logger from '../config/logger.js';
import PDFDocument from 'pdfkit';
import emailService from '../services/emailService.js';

/**
 * CONTROLLER CORRISPETTIVI
 * Gestione registro corrispettivi per commercialista
 */

/**
 * @route   POST /api/corrispettivi/registra
 * @desc    Registra corrispettivo giornaliero
 */
export const registraCorrespettivo = async (req, res) => {
  try {
    const { data, totaleCorrispettivi, note } = req.body;

    // Verifica se esiste già
    const esistente = await Corrispettivo.findOne({
      data: new Date(data)
    });

    if (esistente) {
      return res.status(400).json({
        success: false,
        error: 'Corrispettivo già registrato per questa data'
      });
    }

    // Crea nuovo corrispettivo
    const corrispettivo = new Corrispettivo({
      data: new Date(data),
      totaleCorrispettivi,
      note,
      operatore: req.user?.nome || 'Maurizio Mameli'
    });

    await corrispettivo.save();

    logger.info(`✅ Corrispettivo registrato: ${corrispettivo.getDataItaliana()} - €${totaleCorrispettivi}`);

    res.status(201).json({
      success: true,
      data: corrispettivo,
      messaggio: 'Corrispettivo registrato con successo'
    });

  } catch (error) {
    logger.error('❌ Errore registrazione corrispettivo:', error);
    res.status(500).json({
      success: false,
      error: 'Errore registrazione corrispettivo',
      dettagli: error.message
    });
  }
};

/**
 * @route   PUT /api/corrispettivi/:id
 * @desc    Modifica corrispettivo
 */
export const modificaCorrespettivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { totaleCorrispettivi, note, chiuso } = req.body;

    const corrispettivo = await Corrispettivo.findById(id);
    if (!corrispettivo) {
      return res.status(404).json({
        success: false,
        error: 'Corrispettivo non trovato'
      });
    }

    if (totaleCorrispettivi !== undefined) {
      corrispettivo.totaleCorrispettivi = totaleCorrispettivi;
    }
    if (note !== undefined) {
      corrispettivo.note = note;
    }
    if (chiuso !== undefined) {
      corrispettivo.chiuso = chiuso;
    }

    await corrispettivo.save();

    res.json({
      success: true,
      data: corrispettivo,
      messaggio: 'Corrispettivo modificato'
    });

  } catch (error) {
    logger.error('❌ Errore modifica corrispettivo:', error);
    res.status(500).json({
      success: false,
      error: 'Errore modifica corrispettivo'
    });
  }
};

/**
 * @route   GET /api/corrispettivi/mese/:anno/:mese
 * @desc    Ottieni corrispettivi di un mese
 */
export const getCorrespettiviMese = async (req, res) => {
  try {
    const { anno, mese } = req.params;

    const datiMese = await Corrispettivo.getTotaleMensile(
      parseInt(anno),
      parseInt(mese)
    );

    res.json({
      success: true,
      anno: parseInt(anno),
      mese: parseInt(mese),
      ...datiMese
    });

  } catch (error) {
    logger.error('❌ Errore recupero corrispettivi mese:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero dati'
    });
  }
};

/**
 * @route   GET /api/corrispettivi/anno/:anno
 * @desc    Ottieni statistiche anno
 */
export const getStatisticheAnno = async (req, res) => {
  try {
    const { anno } = req.params;

    const statistiche = await Corrispettivo.getStatisticheAnno(parseInt(anno));

    res.json({
      success: true,
      data: statistiche
    });

  } catch (error) {
    logger.error('❌ Errore statistiche anno:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero statistiche'
    });
  }
};

/**
 * @route   POST /api/corrispettivi/chiusura-mensile/:anno/:mese
 * @desc    Genera e invia chiusura mensile
 */
export const chiusuraMensile = async (req, res) => {
  try {
    const { anno, mese } = req.params;

    logger.info(`📊 Generazione chiusura mensile: ${anno}/${mese}`);

    // Recupera dati mese
    const datiMese = await Corrispettivo.getTotaleMensile(
      parseInt(anno),
      parseInt(mese)
    );

    if (datiMese.giorni === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nessun corrispettivo registrato per questo mese'
      });
    }

    // Genera PDF
    const pdfBuffer = await generaPDFChiusura(anno, mese, datiMese);

    // Genera CSV
    const csvData = generaCSVChiusura(anno, mese, datiMese);

    // Invia email commercialista
    await inviaEmailChiusuraMensile(anno, mese, datiMese, pdfBuffer, csvData);

    logger.info(`✅ Chiusura mensile inviata: ${anno}/${mese}`);

    res.json({
      success: true,
      messaggio: 'Chiusura mensile generata e inviata',
      pdf: pdfBuffer.toString('base64'),
      csv: csvData
    });

  } catch (error) {
    logger.error('❌ Errore chiusura mensile:', error);
    res.status(500).json({
      success: false,
      error: 'Errore generazione chiusura',
      dettagli: error.message
    });
  }
};

/**
 * @route   POST /api/corrispettivi/import
 * @desc    Import dati storici (2022-2025)
 */
export const importDatiStorici = async (req, res) => {
  try {
    const { dati } = req.body; // Array di { data, totaleCorrispettivi }

    let importati = 0;
    let errori = 0;

    for (const item of dati) {
      try {
        // Verifica se esiste già
        const esistente = await Corrispettivo.findOne({
          data: new Date(item.data)
        });

        if (!esistente && item.totaleCorrispettivi > 0) {
          const corrispettivo = new Corrispettivo({
            data: new Date(item.data),
            totaleCorrispettivi: item.totaleCorrispettivi,
            importato: true
          });

          await corrispettivo.save();
          importati++;
        }
      } catch (err) {
        errori++;
        logger.error(`Errore import: ${item.data}`, err);
      }
    }

    logger.info(`✅ Import completato: ${importati} registrati, ${errori} errori`);

    res.json({
      success: true,
      importati,
      errori,
      messaggio: `Importati ${importati} corrispettivi`
    });

  } catch (error) {
    logger.error('❌ Errore import dati storici:', error);
    res.status(500).json({
      success: false,
      error: 'Errore import'
    });
  }
};

/**
 * UTILITY: Genera PDF chiusura mensile
 */
async function generaPDFChiusura(anno, mese, datiMese) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

      // HEADER
      doc.fontSize(20).text('REGISTRO DEI CORRISPETTIVI', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).text(`Mese: ${mesi[mese - 1]} ${anno}`, { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(12).text('PASTIFICIO NONNA CLAUDIA DI MAMELI MAURIZIO', { align: 'left' });
      doc.text('Via Carmine 20/B', { align: 'left' });
      doc.text('09032 Assemini (CA)', { align: 'left' });
      doc.moveDown(2);

      // TABELLA
      const tableTop = doc.y;
      const colWidths = [60, 80, 120, 100, 80, 120];
      const headers = ['Giorno', 'Mese', 'Totale Corrisp.', 'Imponibile 10%', 'IVA 10%', 'Note'];

      // Header tabella
      let x = 50;
      doc.fontSize(10).font('Helvetica-Bold');
      headers.forEach((header, i) => {
        doc.text(header, x, tableTop, { width: colWidths[i], align: 'center' });
        x += colWidths[i];
      });

      // Linea sotto header
      doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

      // Dati
      let y = tableTop + 30;
      doc.font('Helvetica').fontSize(9);

      datiMese.corrispettivi.forEach(c => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        x = 50;
        const row = [
          c.giorno.toString(),
          c.mese,
          `€ ${c.totaleCorrispettivi.toFixed(2)}`,
          `€ ${c.imponibile10.toFixed(2)}`,
          `€ ${c.iva10.toFixed(2)}`,
          c.note || ''
        ];

        row.forEach((text, i) => {
          doc.text(text, x, y, { width: colWidths[i], align: i >= 2 && i <= 4 ? 'right' : 'left' });
          x += colWidths[i];
        });

        y += 20;
      });

      // TOTALI
      doc.moveDown(2);
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text(`TOTALE MESE: € ${datiMese.totaleCorrispettivi.toFixed(2)}`, { align: 'right' });
      doc.text(`IMPONIBILE: € ${datiMese.imponibile10.toFixed(2)}`, { align: 'right' });
      doc.text(`IVA 10%: € ${datiMese.iva10.toFixed(2)}`, { align: 'right' });

      // FOOTER
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, { align: 'center' });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * UTILITY: Genera CSV chiusura mensile
 */
function generaCSVChiusura(anno, mese, datiMese) {
  let csv = 'Giorno,Mese,Totale Corrispettivi,Imponibile 10%,IVA 10%,Note\n';

  datiMese.corrispettivi.forEach(c => {
    csv += `${c.giorno},${c.mese},${c.totaleCorrispettivi.toFixed(2)},${c.imponibile10.toFixed(2)},${c.iva10.toFixed(2)},"${c.note || ''}"\n`;
  });

  csv += `\nTOTALE,,${datiMese.totaleCorrispettivi.toFixed(2)},${datiMese.imponibile10.toFixed(2)},${datiMese.iva10.toFixed(2)}\n`;

  return csv;
}

/**
 * UTILITY: Invia email commercialista
 */
async function inviaEmailChiusuraMensile(anno, mese, datiMese, pdfBuffer, csvData) {
  const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: right; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: bold; }
    .totale { background: #e3f2fd; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Chiusura Mensile Corrispettivi</h1>
      <h2>${mesi[mese - 1]} ${anno}</h2>
    </div>
    <div class="content">
      <p>Gentile Commercialista,</p>
      <p>In allegato la chiusura mensile dei corrispettivi per il mese di <strong>${mesi[mese - 1]} ${anno}</strong>.</p>
      
      <table>
        <tr>
          <th>Descrizione</th>
          <th>Importo</th>
        </tr>
        <tr>
          <td>Giorni apertura</td>
          <td>${datiMese.giorni}</td>
        </tr>
        <tr>
          <td>Totale Corrispettivi</td>
          <td>€ ${datiMese.totaleCorrispettivi.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Imponibile IVA 10%</td>
          <td>€ ${datiMese.imponibile10.toFixed(2)}</td>
        </tr>
        <tr class="totale">
          <td>IVA 10%</td>
          <td>€ ${datiMese.iva10.toFixed(2)}</td>
        </tr>
      </table>

      <p><strong>Allegati:</strong></p>
      <ul>
        <li>registro_corrispettivi_${anno}_${String(mese).padStart(2, '0')}.pdf</li>
        <li>registro_corrispettivi_${anno}_${String(mese).padStart(2, '0')}.csv</li>
      </ul>

      <p>Cordiali saluti,</p>
      <p><strong>Pastificio Nonna Claudia</strong><br>
      Maurizio Mameli<br>
      Via Carmine 20/B - 09032 Assemini (CA)<br>
      Tel: 389 887 9833</p>
    </div>
  </div>
</body>
</html>
  `;

  // Invia email tramite emailService
  const transporter = emailService.transporter;
  
  await transporter.sendMail({
    from: `"Pastificio Nonna Claudia" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_COMMERCIALISTA,
    cc: process.env.EMAIL_USER, // Copia a te
    subject: `Chiusura Corrispettivi ${mesi[mese - 1]} ${anno} - Pastificio Nonna Claudia`,
    html: htmlEmail,
    attachments: [
      {
        filename: `registro_corrispettivi_${anno}_${String(mese).padStart(2, '0')}.pdf`,
        content: pdfBuffer
      },
      {
        filename: `registro_corrispettivi_${anno}_${String(mese).padStart(2, '0')}.csv`,
        content: csvData
      }
    ]
  });

  logger.info(`✅ Email chiusura mensile inviata: ${mesi[mese - 1]} ${anno}`);
}

export default {
  registraCorrespettivo,
  modificaCorrespettivo,
  getCorrespettiviMese,
  getStatisticheAnno,
  chiusuraMensile,
  importDatiStorici
};