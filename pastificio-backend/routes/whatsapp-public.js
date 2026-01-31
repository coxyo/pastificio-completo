// routes/whatsapp-public.js
// ✅ ENDPOINT PUBBLICI WHATSAPP (senza auth)
import express from 'express';
import * as whatsappService from '../services/whatsappService.js';
import logger from '../config/logger.js';

const router = express.Router();

// GET /api/whatsapp-public/qr - QR Code E PAIRING CODE PUBBLICO
router.get('/qr', async (req, res) => {
  try {
    logger.info('📱 Richiesta QR/Pairing code (pubblico)');
    
    const qrCode = whatsappService.getQRCode ? whatsappService.getQRCode() : null;
    const pairingCode = whatsappService.getPairingCode ? whatsappService.getPairingCode() : null;
    const status = whatsappService.getStatus ? whatsappService.getStatus() : {};
    
    if (!qrCode && !pairingCode && status.connected) {
      // Già connesso
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp Baileys - Connesso</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: Arial; 
              text-align: center; 
              padding: 50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .card {
              background: white;
              color: #333;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 500px;
              margin: 0 auto;
            }
            h1 { color: #25D366; margin: 0; font-size: 36px; }
            .status { 
              font-size: 24px; 
              margin: 20px 0;
              padding: 15px;
              background: #e8f5e9;
              border-radius: 10px;
            }
            .info { font-size: 14px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>✅ WhatsApp Connesso!</h1>
            <div class="status">
              📱 Numero: 389 887 9833<br>
              🟢 Stato: Online e Pronto
            </div>
            <div class="info">
              <p>✅ Il sistema è pronto per inviare messaggi automaticamente!</p>
              <p>Promemoria automatici: ore 18:00 ogni giorno</p>
            </div>
          </div>
        </body>
        </html>
      `);
    } else if (qrCode || pairingCode) {
      // Mostra QR e/o Pairing Code
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp - Collegamento Dispositivo</title>
          <meta charset="utf-8">
          <meta http-equiv="refresh" content="5">
          <style>
            body { 
              font-family: Arial; 
              text-align: center; 
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .card {
              background: white;
              color: #333;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 700px;
              margin: 0 auto;
            }
            h1 { color: #25D366; margin: 0 0 20px 0; }
            .methods {
              display: flex;
              gap: 30px;
              justify-content: center;
              margin: 30px 0;
            }
            .method {
              flex: 1;
              padding: 20px;
              background: #f5f5f5;
              border-radius: 15px;
            }
            .method h2 {
              color: #25D366;
              font-size: 20px;
              margin: 0 0 15px 0;
            }
            .pairing-code {
              font-size: 48px;
              font-weight: bold;
              color: #25D366;
              background: white;
              padding: 20px;
              border-radius: 10px;
              letter-spacing: 8px;
              margin: 20px 0;
              font-family: 'Courier New', monospace;
            }
            img { 
              border: 5px solid #25D366; 
              border-radius: 15px;
              max-width: 300px;
              width: 100%;
            }
            .steps {
              text-align: left;
              margin: 20px 0;
              padding: 15px;
              background: white;
              border-radius: 10px;
              font-size: 14px;
            }
            .steps li { margin: 8px 0; }
            .refresh { color: #666; font-size: 14px; margin-top: 20px; }
            .recommended {
              background: #25D366;
              color: white;
              padding: 5px 10px;
              border-radius: 5px;
              font-size: 12px;
              margin-left: 10px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>📱 Collegamento WhatsApp</h1>
            <p style="font-size: 18px; color: #666;">Scegli il metodo che preferisci:</p>
            
            <div class="methods">
              ${pairingCode ? `
              <div class="method">
                <h2>🔢 Codice a 8 cifre <span class="recommended">CONSIGLIATO</span></h2>
                <div class="pairing-code">${pairingCode}</div>
                <div class="steps">
                  <strong>Come usarlo:</strong>
                  <ol>
                    <li>Apri WhatsApp su <strong>389 887 9833</strong></li>
                    <li><strong>Dispositivi collegati</strong></li>
                    <li><strong>Collega con numero di telefono</strong></li>
                    <li>Inserisci: <strong>${pairingCode}</strong></li>
                  </ol>
                </div>
              </div>
              ` : ''}
              
              ${qrCode ? `
              <div class="method">
                <h2>📷 QR Code</h2>
                <img src="${qrCode}" alt="QR Code">
                <div class="steps">
                  <strong>Come usarlo:</strong>
                  <ol>
                    <li>Apri WhatsApp</li>
                    <li>Dispositivi collegati</li>
                    <li>Scansiona QR</li>
                  </ol>
                </div>
              </div>
              ` : ''}
            </div>
            
            <div class="refresh">
              🔄 Pagina si aggiorna ogni 5 secondi...
            </div>
          </div>
        </body>
        </html>
      `);
    } else {
      // Inizializzazione
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp Baileys - Inizializzazione</title>
          <meta charset="utf-8">
          <meta http-equiv="refresh" content="3">
          <style>
            body { 
              font-family: Arial; 
              text-align: center; 
              padding: 50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .card {
              background: white;
              color: #333;
              padding: 40px;
              border-radius: 20px;
              max-width: 500px;
              margin: 0 auto;
            }
            .spinner {
              border: 5px solid #f3f3f3;
              border-top: 5px solid #25D366;
              border-radius: 50%;
              width: 60px;
              height: 60px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>⏳ Inizializzazione...</h1>
            <div class="spinner"></div>
            <p>Attendere generazione QR code...</p>
            <p style="font-size: 14px; color: #666;">Pagina si aggiorna automaticamente</p>
          </div>
        </body>
        </html>
      `);
    }
  } catch (error) {
    logger.error('❌ Errore QR endpoint:', error);
    res.status(500).send(`
      <h1>❌ Errore</h1>
      <p>${error.message}</p>
      <button onclick="location.reload()">🔄 Riprova</button>
    `);
  }
});

// GET /api/whatsapp-public/status - Status PUBBLICO
router.get('/status', async (req, res) => {
  try {
    const status = whatsappService.getStatus ? whatsappService.getStatus() : { connected: false };
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    logger.error('Errore status WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;