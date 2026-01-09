// services/emailService.js
import nodemailer from 'nodemailer';
import logger from '../config/logger.js';
import Ordine from '../models/Ordine.js';
import Cliente from '../models/Cliente.js';

/**
 * SERVIZIO EMAIL AUTOMATICHE
 * Gestisce invio email a commercialista, clienti, fornitori
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
          user: process.env.EMAIL_USER, // es: pastificionc@gmail.com
          pass: process.env.EMAIL_PASSWORD // App Password Gmail
        }
      });

      logger.info('✅ Email transporter configurato correttamente');
    } catch (error) {
      logger.error('❌ Errore configurazione email transporter:', error);
    }
  }

  /**
   * REPORT MENSILE COMMERCIALISTA
   * Invia riepilogo ordini, incassi, statistiche del mese
   */
  async inviaReportMensileCommercialista() {
    try {
      logger.info('📧 Preparazione report mensile commercialista...');

      // Calcola date mese corrente
      const oggi = new Date();
      const primoGiornoMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
      const ultimoGiornoMese = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0);

      // Query ordini del mese
      const ordiniMese = await Ordine.find({
        dataRitiro: {
          $gte: primoGiornoMese,
          $lte: ultimoGiornoMese
        }
      }).populate('cliente');

      // Calcola statistiche
      const statistiche = this.calcolaStatisticheMensili(ordiniMese);

      // Genera HTML email
      const htmlEmail = this.generaHtmlReportCommercialista(statistiche, ordiniMese);

      // Invia email
      const info = await this.transporter.sendMail({
        from: `"Pastificio Nonna Claudia" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_COMMERCIALISTA, // es: commercialista@studio.it
        subject: `Report Mensile - ${this.getNomeMese(oggi.getMonth())} ${oggi.getFullYear()}`,
        html: htmlEmail,
        attachments: [
          {
            filename: `report_${oggi.getFullYear()}_${String(oggi.getMonth() + 1).padStart(2, '0')}.csv`,
            content: this.generaCSVOrdini(ordiniMese)
          }
        ]
      });

      logger.info(`✅ Report mensile inviato con successo! MessageID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };

    } catch (error) {
      logger.error('❌ Errore invio report commercialista:', error);
      throw error;
    }
  }

  /**
   * Calcola statistiche mensili
   */
  calcolaStatisticheMensili(ordini) {
    const stats = {
      totaleOrdini: ordini.length,
      totaleIncasso: 0,
      ordiniPerStato: {
        pending: 0,
        confermato: 0,
        pronto: 0,
        consegnato: 0,
        annullato: 0
      },
      prodottiVenduti: {},
      topClienti: {},
      incassoPerGiorno: {}
    };

    ordini.forEach(ordine => {
      // Totale incasso
      stats.totaleIncasso += ordine.totale || 0;

      // Ordini per stato
      stats.ordiniPerStato[ordine.stato]++;

      // Prodotti venduti
      ordine.prodotti.forEach(prod => {
        const nomeProdotto = prod.nome;
        if (!stats.prodottiVenduti[nomeProdotto]) {
          stats.prodottiVenduti[nomeProdotto] = {
            quantita: 0,
            incasso: 0
          };
        }
        stats.prodottiVenduti[nomeProdotto].quantita += prod.quantita;
        stats.prodottiVenduti[nomeProdotto].incasso += prod.prezzo * prod.quantita;
      });

      // Top clienti
      const nomeCliente = ordine.cliente?.nome || 'Cliente Sconosciuto';
      if (!stats.topClienti[nomeCliente]) {
        stats.topClienti[nomeCliente] = {
          ordini: 0,
          totaleSpeso: 0
        };
      }
      stats.topClienti[nomeCliente].ordini++;
      stats.topClienti[nomeCliente].totaleSpeso += ordine.totale || 0;

      // Incasso per giorno
      const dataGiorno = ordine.dataRitiro.toISOString().split('T')[0];
      stats.incassoPerGiorno[dataGiorno] = (stats.incassoPerGiorno[dataGiorno] || 0) + (ordine.totale || 0);
    });

    return stats;
  }

  /**
   * Genera HTML report per commercialista
   */
  generaHtmlReportCommercialista(stats, ordini) {
    const mese = this.getNomeMese(new Date().getMonth());
    const anno = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
    .section { margin: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .stat-box { display: inline-block; margin: 10px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    .stat-label { font-size: 12px; color: #666; }
    .stat-value { font-size: 24px; font-weight: bold; color: #2196F3; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🍝 Pastificio Nonna Claudia</h1>
    <h2>Report Mensile - ${mese} ${anno}</h2>
  </div>

  <div class="section">
    <h3>📊 Riepilogo Generale</h3>
    <div class="stat-box">
      <div class="stat-label">Totale Ordini</div>
      <div class="stat-value">${stats.totaleOrdini}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Incasso Totale</div>
      <div class="stat-value">€${stats.totaleIncasso.toFixed(2)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Ticket Medio</div>
      <div class="stat-value">€${(stats.totaleIncasso / stats.totaleOrdini || 0).toFixed(2)}</div>
    </div>
  </div>

  <div class="section">
    <h3>📦 Ordini per Stato</h3>
    <table>
      <tr>
        <th>Stato</th>
        <th>Numero Ordini</th>
        <th>Percentuale</th>
      </tr>
      ${Object.entries(stats.ordiniPerStato).map(([stato, count]) => `
        <tr>
          <td>${this.tradStato(stato)}</td>
          <td>${count}</td>
          <td>${((count / stats.totaleOrdini) * 100).toFixed(1)}%</td>
        </tr>
      `).join('')}
    </table>
  </div>

  <div class="section">
    <h3>🏆 Top 10 Prodotti Venduti</h3>
    <table>
      <tr>
        <th>Prodotto</th>
        <th>Quantità</th>
        <th>Incasso</th>
      </tr>
      ${Object.entries(stats.prodottiVenduti)
        .sort((a, b) => b[1].incasso - a[1].incasso)
        .slice(0, 10)
        .map(([nome, data]) => `
        <tr>
          <td>${nome}</td>
          <td>${data.quantita}</td>
          <td>€${data.incasso.toFixed(2)}</td>
        </tr>
      `).join('')}
    </table>
  </div>

  <div class="section">
    <h3>👥 Top 10 Clienti</h3>
    <table>
      <tr>
        <th>Cliente</th>
        <th>Ordini</th>
        <th>Totale Speso</th>
      </tr>
      ${Object.entries(stats.topClienti)
        .sort((a, b) => b[1].totaleSpeso - a[1].totaleSpeso)
        .slice(0, 10)
        .map(([nome, data]) => `
        <tr>
          <td>${nome}</td>
          <td>${data.ordini}</td>
          <td>€${data.totaleSpeso.toFixed(2)}</td>
        </tr>
      `).join('')}
    </table>
  </div>

  <div class="footer">
    <p>Report generato automaticamente il ${new Date().toLocaleDateString('it-IT')}</p>
    <p>Pastificio Nonna Claudia - Via Carmine 20/B, Assemini (CA)</p>
    <p>Tel: 389 887 9833 | Email: pastificionc@gmail.com</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Genera CSV ordini per allegato
   */
  generaCSVOrdini(ordini) {
    let csv = 'Data,Numero Ordine,Cliente,Totale,Stato,Prodotti\n';
    
    ordini.forEach(ordine => {
      const data = ordine.dataRitiro.toLocaleDateString('it-IT');
      const numeroOrdine = ordine.numeroOrdine || ordine._id;
      const cliente = ordine.cliente?.nome || 'N/A';
      const totale = ordine.totale.toFixed(2);
      const stato = ordine.stato;
      const prodotti = ordine.prodotti.map(p => `${p.nome}(${p.quantita})`).join('; ');
      
      csv += `"${data}","${numeroOrdine}","${cliente}","${totale}","${stato}","${prodotti}"\n`;
    });

    return csv;
  }

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
    .btn { display: inline-block; padding: 15px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
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
      <p>Grazie per averci scelto! 🍝</p>
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
      <p>Ci vediamo domani! 🍝</p>
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
   * UTILITY: Traduzione stati
   */
  tradStato(stato) {
    const traduzioni = {
      pending: 'In Attesa',
      confermato: 'Confermato',
      pronto: 'Pronto',
      consegnato: 'Consegnato',
      annullato: 'Annullato'
    };
    return traduzioni[stato] || stato;
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