// services/emailService.js
// ✅ VERSIONE COMPLETA CON REPORT CORRISPETTIVI MENSILE
import nodemailer from 'nodemailer';
import logger from '../config/logger.js';
import Ordine from '../models/Ordine.js';
import Cliente from '../models/Cliente.js';
import Corrispettivo from '../models/Corrispettivo.js';

/**
 * SERVIZIO EMAIL AUTOMATICHE
 * - Report corrispettivi mensile commercialista
 * - Ordini pronti clienti
 * - Promemoria ritiri
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.setupTransporter();
  }

  /**
   * Configura trasporto email con Gmail SMTP
   */
  setupTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'pastificionc@gmail.com',
          pass: process.env.EMAIL_PASSWORD || 'jhzu xlld djxb jgnu'
        }
      });

      logger.info('✅ Email transporter configurato correttamente');
    } catch (error) {
      logger.error('❌ Errore configurazione email transporter:', error);
    }
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📊 REPORT MENSILE CORRISPETTIVI COMMERCIALISTA (NUOVO)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * Invia riepilogo corrispettivi del mese chiuso
   * Chiamato automaticamente il 3° giorno del mese (cron job)
   */
  async inviaReportCorrispettiviMensile(anno, mese, pdfBuffer, csvBuffer) {
    try {
      logger.info(`📧 Preparazione report corrispettivi ${mese}/${anno} per commercialista...`);

      // Recupera dati corrispettivi dal database
      const corrispettivi = await Corrispettivo.find({ anno, mese }).sort({ giorno: 1 });

      if (corrispettivi.length === 0) {
        logger.warn(`⚠️ Nessun corrispettivo trovato per ${mese}/${anno}`);
        return { success: false, reason: 'no_data' };
      }

      // Calcola totali
      const totali = this.calcolaTotaliCorrispettivi(corrispettivi);

      // Genera HTML email
      const htmlEmail = this.generaHtmlReportCorrispettivi(anno, mese, totali, corrispettivi);

      // Prepara allegati
      const attachments = [];
      
      if (pdfBuffer) {
        attachments.push({
          filename: `Corrispettivi_${anno}_${String(mese).padStart(2, '0')}.pdf`,
          content: pdfBuffer
        });
      }

      if (csvBuffer) {
        attachments.push({
          filename: `Corrispettivi_${anno}_${String(mese).padStart(2, '0')}.csv`,
          content: csvBuffer
        });
      }

      // Invia email
      const info = await this.transporter.sendMail({
        from: `"Pastificio Nonna Claudia" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_COMMERCIALISTA, // es: commercialista@studio.it
        cc: process.env.EMAIL_CC || '', // Copia conoscenza opzionale
        subject: `📊 Report Corrispettivi - ${this.getNomeMese(mese - 1)} ${anno}`,
        html: htmlEmail,
        attachments: attachments
      });

      logger.info(`✅ Report corrispettivi inviato! MessageID: ${info.messageId}`);
      
      return { 
        success: true, 
        messageId: info.messageId,
        totali: totali
      };

    } catch (error) {
      logger.error('❌ Errore invio report corrispettivi:', error);
      throw error;
    }
  }

  /**
   * Calcola totali corrispettivi
   */
  calcolaTotaliCorrispettivi(corrispettivi) {
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

  /**
   * Genera HTML email report corrispettivi
   */
  generaHtmlReportCorrispettivi(anno, mese, totali, corrispettivi) {
    const nomeMese = this.getNomeMese(mese - 1);

    // Trova giorno con incasso massimo
    const giornoMax = corrispettivi.reduce((max, c) => 
      (c.totale > max.totale) ? c : max
    , { totale: 0, giorno: 0 });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      color: #333; 
      background: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
      color: white; 
      padding: 30px; 
      text-align: center; 
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .section { 
      padding: 25px 30px;
      border-bottom: 1px solid #eee;
    }
    .section:last-child {
      border-bottom: none;
    }
    .section h2 {
      color: #2196F3;
      margin-top: 0;
      font-size: 20px;
      border-bottom: 2px solid #2196F3;
      padding-bottom: 10px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-box { 
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border-left: 4px solid #2196F3;
    }
    .stat-label { 
      font-size: 12px; 
      color: #666; 
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .stat-value { 
      font-size: 28px; 
      font-weight: bold; 
      color: #2196F3; 
    }
    .stat-value.green {
      color: #4CAF50;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 15px; 
      font-size: 14px;
    }
    th, td { 
      padding: 12px; 
      text-align: left; 
      border-bottom: 1px solid #eee; 
    }
    th { 
      background: #f8f9fa;
      font-weight: 600;
      color: #555;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    tr:hover {
      background: #f8f9fa;
    }
    .footer { 
      text-align: center; 
      padding: 25px 30px;
      background: #f8f9fa;
      font-size: 13px; 
      color: #666; 
    }
    .footer p {
      margin: 5px 0;
    }
    .highlight {
      background: #FFF3E0;
      padding: 2px 6px;
      border-radius: 3px;
      color: #F57C00;
      font-weight: 600;
    }
    .alert-box {
      background: #E3F2FD;
      border-left: 4px solid #2196F3;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .alert-box strong {
      color: #1976D2;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍰 Pastificio Nonna Claudia</h1>
      <p>Report Corrispettivi - ${nomeMese} ${anno}</p>
    </div>

    <div class="section">
      <h2>📊 Riepilogo Generale</h2>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">Incasso Totale</div>
          <div class="stat-value green">€${totali.totaleMese.toFixed(2)}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Media Giornaliera</div>
          <div class="stat-value">€${totali.mediaGiornaliera.toFixed(2)}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Giorni Apertura</div>
          <div class="stat-value">${totali.giorniConIncasso}/${totali.giorniTotali}</div>
        </div>
      </div>

      <div class="alert-box">
        <strong>📈 Giorno migliore:</strong> 
        ${giornoMax.giorno}/${mese}/${anno} con 
        <span class="highlight">€${giornoMax.totale.toFixed(2)}</span>
      </div>
    </div>

    <div class="section">
      <h2>💶 Dettaglio IVA</h2>
      <table>
        <thead>
          <tr>
            <th>Aliquota IVA</th>
            <th style="text-align: right;">Imponibile + IVA</th>
            <th style="text-align: right;">IVA Scorporata</th>
            <th style="text-align: right;">Imponibile</th>
          </tr>
        </thead>
        <tbody>
          ${totali.iva22 > 0 ? `
          <tr>
            <td>22% (Ordinaria)</td>
            <td style="text-align: right;">€${totali.iva22.toFixed(2)}</td>
            <td style="text-align: right;">€${(totali.iva22 - totali.iva22 / 1.22).toFixed(2)}</td>
            <td style="text-align: right;">€${(totali.iva22 / 1.22).toFixed(2)}</td>
          </tr>
          ` : ''}
          ${totali.iva10 > 0 ? `
          <tr>
            <td>10% (Ridotta)</td>
            <td style="text-align: right;">€${totali.iva10.toFixed(2)}</td>
            <td style="text-align: right;">€${(totali.iva10 - totali.iva10 / 1.10).toFixed(2)}</td>
            <td style="text-align: right;">€${(totali.iva10 / 1.10).toFixed(2)}</td>
          </tr>
          ` : ''}
          ${totali.iva4 > 0 ? `
          <tr>
            <td>4% (Super ridotta)</td>
            <td style="text-align: right;">€${totali.iva4.toFixed(2)}</td>
            <td style="text-align: right;">€${(totali.iva4 - totali.iva4 / 1.04).toFixed(2)}</td>
            <td style="text-align: right;">€${(totali.iva4 / 1.04).toFixed(2)}</td>
          </tr>
          ` : ''}
          ${totali.esente > 0 ? `
          <tr>
            <td>Esente/Non imponibile</td>
            <td style="text-align: right;">€${totali.esente.toFixed(2)}</td>
            <td style="text-align: right;">€0.00</td>
            <td style="text-align: right;">€${totali.esente.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr style="font-weight: bold; background: #f0f0f0;">
            <td>TOTALE</td>
            <td style="text-align: right;">€${totali.totaleMese.toFixed(2)}</td>
            <td style="text-align: right;">€${(
              (totali.iva22 - totali.iva22 / 1.22) + 
              (totali.iva10 - totali.iva10 / 1.10) + 
              (totali.iva4 - totali.iva4 / 1.04)
            ).toFixed(2)}</td>
            <td style="text-align: right;">€${(
              totali.iva22 / 1.22 + 
              totali.iva10 / 1.10 + 
              totali.iva4 / 1.04 + 
              totali.esente
            ).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>📅 Dettaglio Giornaliero (Prime 10 giornate)</h2>
      <table>
        <thead>
          <tr>
            <th>Giorno</th>
            <th style="text-align: right;">Incasso</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          ${corrispettivi.slice(0, 10).map(c => `
            <tr>
              <td>${c.giorno}/${mese}/${anno}</td>
              <td style="text-align: right;">€${(c.totale || 0).toFixed(2)}</td>
              <td style="font-size: 12px; color: #666;">${c.note || '-'}</td>
            </tr>
          `).join('')}
          ${corrispettivi.length > 10 ? `
            <tr>
              <td colspan="3" style="text-align: center; font-style: italic; color: #999;">
                ... e altri ${corrispettivi.length - 10} giorni (vedi allegato completo)
              </td>
            </tr>
          ` : ''}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p><strong>📎 Allegati:</strong> PDF e CSV completi con tutti i dettagli</p>
      <p style="margin-top: 15px;">Report generato automaticamente il ${new Date().toLocaleString('it-IT')}</p>
      <p>Pastificio Nonna Claudia - Via Carmine 20/B, Assemini (CA)</p>
      <p>Tel: 389 887 9833 | Email: pastificionc@gmail.com</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📧 ALTRE FUNZIONI EMAIL (ORDINI, PROMEMORIA)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */

  /**
   * EMAIL ORDINE PRONTO (alternativa a WhatsApp)
   */
  async inviaEmailOrdinePronto(ordine) {
    try {
      if (!ordine.cliente?.email) {
        logger.warn('⚠️ Cliente senza email, skip invio');
        return { success: false, reason: 'no_email' };
      }

      const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Il Tuo Ordine è Pronto!</h1>
    </div>
    <div class="content">
      <p>Ciao <strong>${ordine.cliente.nome}</strong>,</p>
      <p>Il tuo ordine <strong>#${ordine.numeroOrdine}</strong> è pronto per il ritiro!</p>
      
      <h3>📦 Dettagli Ordine:</h3>
      <ul>
        ${ordine.prodotti.map(p => `<li>${p.nome} - ${p.quantita} ${p.unita}</li>`).join('')}
      </ul>
      
      <p><strong>Totale:</strong> €${ordine.totale.toFixed(2)}</p>
      <p><strong>Orario Ritiro:</strong> ${ordine.oraRitiro}</p>
      
      <p>Ti aspettiamo al Pastificio Nonna Claudia!</p>
      <p>📍 Via Carmine 20/B, Assemini (CA)<br>
         📞 389 887 9833</p>
    </div>
    <div class="footer">
      <p>Grazie per averci scelto! 🍰</p>
    </div>
  </div>
</body>
</html>
      `;

      const info = await this.transporter.sendMail({
        from: `"Pastificio Nonna Claudia" <${process.env.EMAIL_USER}>`,
        to: ordine.cliente.email,
        subject: `✅ Il tuo ordine #${ordine.numeroOrdine} è pronto!`,
        html: htmlEmail
      });

      logger.info(`✅ Email ordine pronto inviata a ${ordine.cliente.email}`);
      return { success: true, messageId: info.messageId };

    } catch (error) {
      logger.error('❌ Errore invio email ordine pronto:', error);
      throw error;
    }
  }

  /**
   * EMAIL PROMEMORIA RITIRO
   */
  async inviaEmailPromemoriaRitiro(ordine) {
    try {
      if (!ordine.cliente?.email) return { success: false, reason: 'no_email' };

      const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Promemoria Ritiro</h1>
    </div>
    <div class="content">
      <p>Ciao <strong>${ordine.cliente.nome}</strong>,</p>
      <p>Ti ricordiamo che domani alle <strong>${ordine.oraRitiro}</strong> potrai ritirare il tuo ordine!</p>
      
      <h3>📦 Riepilogo:</h3>
      <ul>
        ${ordine.prodotti.map(p => `<li>${p.nome} - ${p.quantita} ${p.unita}</li>`).join('')}
      </ul>
      
      <p><strong>Totale:</strong> €${ordine.totale.toFixed(2)}</p>
      <p>Ci vediamo domani! 🍰</p>
    </div>
  </div>
</body>
</html>
      `;

      const info = await this.transporter.sendMail({
        from: `"Pastificio Nonna Claudia" <${process.env.EMAIL_USER}>`,
        to: ordine.cliente.email,
        subject: `⏰ Promemoria ritiro ordine #${ordine.numeroOrdine}`,
        html: htmlEmail
      });

      logger.info(`✅ Email promemoria inviata a ${ordine.cliente.email}`);
      return { success: true, messageId: info.messageId };

    } catch (error) {
      logger.error('❌ Errore invio email promemoria:', error);
      throw error;
    }
  }

  /**
   * UTILITY: Nome mese italiano
   */
  getNomeMese(numeroMese) {
    const mesi = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return mesi[numeroMese];
  }

  /**
   * Test connessione email
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      logger.info('✅ Connessione email verificata con successo');
      return true;
    } catch (error) {
      logger.error('❌ Errore verifica connessione email:', error);
      return false;
    }
  }
}

export default new EmailService();