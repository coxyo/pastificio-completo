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
    } else if (qrCode) {
      // Mostra QR + Istruzioni Pairing Manuale
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
            .container {
              max-width: 1200px;
              margin: 0 auto;
            }
            .card {
              background: white;
              color: #333;
              padding: 30px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              margin-bottom: 20px;
            }
            h1 { color: #25D366; margin: 0 0 10px 0; font-size: 28px; }
            .subtitle { color: #666; font-size: 16px; margin-bottom: 30px; }
            .methods {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin: 20px 0;
            }
            .method {
              padding: 25px;
              background: #f8f9fa;
              border-radius: 15px;
              text-align: left;
            }
            .method h2 {
              color: #25D366;
              font-size: 22px;
              margin: 0 0 15px 0;
              text-align: center;
            }
            .method-icon {
              font-size: 48px;
              text-align: center;
              margin-bottom: 15px;
            }
            img { 
              border: 5px solid #25D366; 
              border-radius: 15px;
              max-width: 280px;
              width: 100%;
              display: block;
              margin: 0 auto 20px;
            }
            .steps {
              background: white;
              padding: 20px;
              border-radius: 10px;
              margin-top: 15px;
            }
            .steps ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            .steps li { 
              margin: 12px 0; 
              font-size: 15px;
              line-height: 1.5;
            }
            .highlight {
              background: #fff3cd;
              padding: 2px 6px;
              border-radius: 4px;
              font-weight: bold;
            }
            .recommended {
              background: #25D366;
              color: white;
              padding: 5px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              display: inline-block;
              margin-left: 10px;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: left;
            }
            .refresh { 
              color: #666; 
              font-size: 14px; 
              margin-top: 20px;
              padding: 15px;
              background: rgba(255,255,255,0.9);
              border-radius: 10px;
            }
            .phone-number {
              font-size: 20px;
              font-weight: bold;
              color: #25D366;
              background: #e8f5e9;
              padding: 10px 20px;
              border-radius: 10px;
              display: inline-block;
              margin: 15px 0;
            }
            @media (max-width: 768px) {
              .methods {
                grid-template-columns: 1fr;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <h1>📱 Collegamento WhatsApp Business</h1>
              <p class="subtitle">Scegli il metodo più comodo per te</p>
              
              <div class="phone-number">
                📞 Numero: 389 887 9833
              </div>

              <div class="methods">
                <!-- METODO 1: QR CODE -->
                <div class="method">
                  <div class="method-icon">📷</div>
                  <h2>Metodo 1: QR Code</h2>
                  <img src="${qrCode}" alt="QR Code">
                  <div class="steps">
                    <strong>Come procedere:</strong>
                    <ol>
                      <li>Apri <strong>WhatsApp</strong> sul telefono <span class="highlight">389 887 9833</span></li>
                      <li>Vai su <span class="highlight">Impostazioni ⚙️</span></li>
                      <li>Tap su <span class="highlight">Dispositivi collegati</span></li>
                      <li>Tap su <span class="highlight">[+] Collega un dispositivo</span></li>
                      <li><strong>Scansiona questo QR code</strong></li>
                      <li>✅ Connesso!</li>
                    </ol>
                  </div>
                </div>

                <!-- METODO 2: PAIRING CODE -->
                <div class="method">
                  <div class="method-icon">🔢</div>
                  <h2>Metodo 2: Codice a 8 Cifre <span class="recommended">PIÙ FACILE</span></h2>
                  <div class="steps">
                    <strong>Se il QR non funziona:</strong>
                    <ol>
                      <li>Apri <strong>WhatsApp</strong> sul telefono <span class="highlight">389 887 9833</span></li>
                      <li>Vai su <span class="highlight">Impostazioni ⚙️</span></li>
                      <li>Tap su <span class="highlight">Dispositivi collegati</span></li>
                      <li>Tap su <span class="highlight">[+] Collega un dispositivo</span></li>
                      <li><strong>⚠️ NON scansionare il QR!</strong></li>
                      <li>Tap su <span class="highlight">"Collega con numero di telefono"</span></li>
                      <li>WhatsApp ti <strong>mostrerà un codice</strong> di 8 caratteri (es: <code>A1B2C3D4</code>)</li>
                      <li>Aspetta 2-3 secondi</li>
                      <li>✅ WhatsApp si collega automaticamente!</li>
                    </ol>
                  </div>
                  
                  <div class="warning">
                    <strong>💡 Suggerimento:</strong><br>
                    Il pairing code funziona meglio se:
                    <ul>
                      <li>Il QR non si scansiona bene</li>
                      <li>C'è poca luce</li>
                      <li>La fotocamera ha problemi</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="warning">
                <strong>⚠️ Importante:</strong> Usa il telefono con numero <strong>389 887 9833</strong>. Altri numeri non funzioneranno!
              </div>

              <div class="refresh">
                🔄 Questa pagina si aggiorna automaticamente ogni 5 secondi<br>
                Quando connesso, vedrai conferma automaticamente
              </div>
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