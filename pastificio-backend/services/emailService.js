// services/emailService.js
// ✅ VERSIONE CON SENDGRID + GMAIL FALLBACK
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import logger from '../config/logger.js';
import Corrispettivo from '../models/Corrispettivo.js';

/**
 * SERVIZIO EMAIL AUTOMATICHE
 * - Usa SendGrid (preferito su Railway)
 * - Fallback su Gmail SMTP se SendGrid non configurato
 */

class EmailService {
  constructor() {
    this.useSendGrid = false;
    this.transporter = null;
    this.setupEmail();
  }

  /**
   * Setup email (SendGrid o Gmail)
   */
  setupEmail() {
    try {
      // OPZIONE 1: SendGrid (raccomandato per Railway)
      if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.useSendGrid = true;
        logger.info('✅ Email configurato con SendGrid');
        return;
      }

      // OPZIONE 2: Gmail SMTP (fallback)
      logger.info('⚠️ SendGrid non configurato, uso Gmail SMTP...');
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        connectionTimeout: 30000,
        greetingTimeout: 20000,
        socketTimeout: 60000
      });

      logger.info('✅ Email configurato con Gmail SMTP (porta 465)');
    } catch (error) {
      logger.error('❌ Errore configurazione email:', error);
    }
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📊 REPORT MENSILE CORRISPETTIVI COMMERCIALISTA
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  async inviaReportCorrispettiviMensile(anno, mese, pdfBuffer, csvBuffer) {
    try {
      logger.info(`📧 Preparazione report corrispettivi ${mese}/${anno}...`);

      // Recupera dati
      const corrispettivi = await Corrispettivo.find({ anno, mese }).sort({ giorno: 1 });

      if (corrispettivi.length === 0) {
        logger.warn(`⚠️ Nessun corrispettivo trovato per ${mese}/${anno}`);
        return { success: false, reason: 'no_data' };
      }

      // Calcola totali
      const totali = this.calcolaTotaliCorrispettivi(corrispettivi);

      // HTML email
      const htmlEmail = this.generaHtmlReportCorrispettivi(anno, mese, totali, corrispettivi);

      const nomeMese = this.getNomeMese(mese - 1);
      const oggetto = `📊 Report Corrispettivi ${nomeMese} ${anno} - Pastificio Nonna Claudia`;

      // ━━━ INVIO CON SENDGRID (preferito) ━━━
      if (this.useSendGrid) {
        logger.info('📤 Invio con SendGrid...');

        const attachments = [];
        
        if (pdfBuffer) {
          attachments.push({
            content: pdfBuffer.toString('base64'),
            filename: `Corrispettivi_${anno}-${String(mese).padStart(2, '0')}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          });
        }

        if (csvBuffer) {
          attachments.push({
            content: csvBuffer.toString('base64'),
            filename: `Corrispettivi_${anno}-${String(mese).padStart(2, '0')}.csv`,
            type: 'text/csv',
            disposition: 'attachment'
          });
        }

        const msg = {
          to: process.env.EMAIL_COMMERCIALISTA,
          from: process.env.EMAIL_USER,
          cc: process.env.EMAIL_USER, // Copia a te stesso
          subject: oggetto,
          html: htmlEmail,
          attachments: attachments
        };

        const [response] = await sgMail.send(msg);

        logger.info(`✅ Email inviata con SendGrid!`);
        logger.info(`   StatusCode: ${response.statusCode}`);
        logger.info(`   Destinatario: ${process.env.EMAIL_COMMERCIALISTA}`);

        return {
          success: true,
          messageId: response.headers['x-message-id'],
          recipient: process.env.EMAIL_COMMERCIALISTA,
          provider: 'SendGrid'
        };
      }

      // ━━━ INVIO CON GMAIL SMTP (fallback) ━━━
      else {
        logger.info('📤 Invio con Gmail SMTP...');

        const attachments = [];
        
        if (pdfBuffer) {
          attachments.push({
            filename: `Corrispettivi_${anno}-${String(mese).padStart(2, '0')}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          });
        }

        if (csvBuffer) {
          attachments.push({
            filename: `Corrispettivi_${anno}-${String(mese).padStart(2, '0')}.csv`,
            content: csvBuffer,
            contentType: 'text/csv'
          });
        }

        const info = await this.transporter.sendMail({
          from: `"Pastificio Nonna Claudia" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_COMMERCIALISTA,
          cc: process.env.EMAIL_USER,
          subject: oggetto,
          html: htmlEmail,
          attachments: attachments
        });

        logger.info(`✅ Email inviata con Gmail!`);
        logger.info(`   MessageID: ${info.messageId}`);
        logger.info(`   Destinatario: ${process.env.EMAIL_COMMERCIALISTA}`);

        return {
          success: true,
          messageId: info.messageId,
          recipient: process.env.EMAIL_COMMERCIALISTA,
          provider: 'Gmail'
        };
      }

    } catch (error) {
      logger.error('❌ Errore invio email corrispettivi:', {
        message: error.message,
        code: error.code,
        response: error.response?.body || 'N/A'
      });
      
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
    body { font-family: Arial, sans-serif; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 30px; }
    .stat-box { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #2196F3; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
    .stat-value { font-size: 28px; font-weight: bold; color: #2196F3; }
    .stat-value.green { color: #4CAF50; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; text-transform: uppercase; font-size: 12px; }
    .footer { text-align: center; padding: 25px; background: #f8f9fa; font-size: 13px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍰 Pastificio Nonna Claudia</h1>
      <p>Report Corrispettivi ${nomeMese} ${anno}</p>
    </div>

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

    <div style="padding: 25px 30px; border-bottom: 1px solid #eee;">
      <h2 style="color: #2196F3; margin-top: 0;">💶 Dettaglio IVA</h2>
      <table>
        <thead>
          <tr>
            <th>Aliquota</th>
            <th style="text-align: right;">Totale</th>
            <th style="text-align: right;">IVA Scorp.</th>
            <th style="text-align: right;">Imponibile</th>
          </tr>
        </thead>
        <tbody>
          ${totali.iva22 > 0 ? `
          <tr>
            <td>22%</td>
            <td style="text-align: right;">€${totali.iva22.toFixed(2)}</td>
            <td style="text-align: right;">€${(totali.iva22 - totali.iva22 / 1.22).toFixed(2)}</td>
            <td style="text-align: right;">€${(totali.iva22 / 1.22).toFixed(2)}</td>
          </tr>
          ` : ''}
          ${totali.iva10 > 0 ? `
          <tr>
            <td>10%</td>
            <td style="text-align: right;">€${totali.iva10.toFixed(2)}</td>
            <td style="text-align: right;">€${(totali.iva10 - totali.iva10 / 1.10).toFixed(2)}</td>
            <td style="text-align: right;">€${(totali.iva10 / 1.10).toFixed(2)}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p><strong>📎 Allegati PDF e CSV con dettagli completi</strong></p>
      <p>Report generato ${new Date().toLocaleString('it-IT')}</p>
      <p>Pastificio Nonna Claudia - Via Carmine 20/B, Assemini (CA)<br>
      Tel: 389 887 9833 | Email: pastificionc@gmail.com</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Nome mese italiano
   */
  getNomeMese(numeroMese) {
    const mesi = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return mesi[numeroMese];
  }

  /**
   * Test connessione
   */
  async testConnection() {
    try {
      if (this.useSendGrid) {
        logger.info('✅ SendGrid configurato correttamente');
        return true;
      }

      await this.transporter.verify();
      logger.info('✅ Gmail SMTP verificato con successo');
      return true;
    } catch (error) {
      logger.error('❌ Errore verifica email:', error);
      return false;
    }
  }
}

export default new EmailService();