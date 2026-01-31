// routes/whatsapp-public.js
// ✅ ENDPOINT PUBBLICI WHATSAPP (senza auth)
import express from 'express';
import * as whatsappService from '../services/whatsappService.js';
import logger from '../config/logger.js';

const router = express.Router();

// GET /api/whatsapp-public/qr - QR Code PUBBLICO
router.get('/qr', async (req, res) => {
  try {
    logger.info('📱 Richiesta QR code (pubblico)');
    
    const qrCode = whatsappService.getQRCode ? whatsappService.getQRCode() : null;
    const status = whatsappService.getStatus ? whatsappService.getStatus() : {};
    
    if (!qrCode && status.connected) {
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
    } else if (qrCode) {
      // Mostra QR
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp Baileys - Scansiona QR</title>
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
              max-width: 600px;
              margin: 0 auto;
            }
            h1 { color: #25D366; margin: 0 0 20px 0; }
            img { 
              border: 5px solid #25D366; 
              border-radius: 15px;
              max-width: 400px;
              width: 100%;
            }
            .steps {
              text-align: left;
              margin: 30px 0;
              padding: 20px;
              background: #f5f5f5;
              border-radius: 10px;
            }
            .steps li { margin: 10px 0; font-size: 16px; }
            .refresh { color: #666; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>📱 Scansiona QR Code</h1>
            <img src="${qrCode}" alt="QR Code">
            <div class="steps">
              <strong>Come connettere:</strong>
              <ol>
                <li>Apri WhatsApp sul telefono (<strong>389 887 9833</strong>)</li>
                <li>Vai su <strong>Impostazioni</strong> → <strong>Dispositivi collegati</strong></li>
                <li>Tap su <strong>Collega un dispositivo</strong></li>
                <li>Scansiona questo QR code</li>
                <li>✅ Connesso! La pagina si aggiornerà automaticamente</li>
              </ol>
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