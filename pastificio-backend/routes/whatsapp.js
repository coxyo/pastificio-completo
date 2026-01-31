// routes/whatsapp_BAILEYS.js
// ✅ Routes per Baileys con QR Code endpoint
import express from 'express';
import * as whatsappService from '../services/whatsappService.js';
import logger from '../config/logger.js';
import Ordine from '../models/Ordine.js';

const router = express.Router();

// ========== ENDPOINT BAILEYS ==========

// GET /api/whatsapp/qr - Mostra QR Code per connessione
router.get('/qr', async (req, res) => {
  try {
    const qrCode = whatsappService.getQRCode ? whatsappService.getQRCode() : null;
    const status = whatsappService.getStatus();
    
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
            button {
              padding: 15px 30px;
              font-size: 16px;
              background: #25D366;
              color: white;
              border: none;
              border-radius: 10px;
              cursor: pointer;
              margin: 10px;
            }
            button:hover { background: #128C7E; }
            .info { font-size: 14px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>✅ WhatsApp Connesso!</h1>
            <div class="status">
              📱 Numero: ${status.numero || '389 887 9833'}<br>
              🟢 Stato: Online e Pronto
            </div>
            <button onclick="location.href='/api/whatsapp/status'">🔍 Verifica Stato</button>
            <button onclick="location.href='/api/whatsapp/test'">🧪 Test Invio</button>
            <button onclick="if(confirm('Sicuro?')) location.href='/api/whatsapp/disconnect'">🔌 Disconnetti</button>
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
      // Errore o inizializzazione
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
    logger.error('Errore recupero QR:', error);
    res.status(500).send(`
      <h1>❌ Errore</h1>
      <p>${error.message}</p>
      <button onclick="location.reload()">🔄 Riprova</button>
    `);
  }
});

// GET /api/whatsapp/status - Stato connessione
router.get('/status', async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    logger.error('Errore recupero stato WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/whatsapp/info - Info servizio
router.get('/info', async (req, res) => {
  try {
    const info = whatsappService.getInfo();
    res.json({
      success: true,
      info: info
    });
  } catch (error) {
    logger.error('Errore recupero info WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/whatsapp/test - Test connessione
router.get('/test', async (req, res) => {
  try {
    const result = await whatsappService.testConnection();
    res.json(result);
  } catch (error) {
    logger.error('Errore test WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/whatsapp/disconnect - Disconnetti
router.get('/disconnect', async (req, res) => {
  try {
    await whatsappService.disconnect();
    res.json({
      success: true,
      message: 'WhatsApp disconnesso. Riavvia il server per riconnettere.'
    });
  } catch (error) {
    logger.error('Errore disconnessione WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== ENDPOINT INVIO MESSAGGI ==========

// POST /api/whatsapp/send - Endpoint UNIVERSALE
router.post('/send', async (req, res) => {
  try {
    logger.info('📱 WhatsApp /send chiamato');
    
    const { numero, messaggio, to, message, template, variabili } = req.body;
    
    let numeroFinale, messaggioFinale;
    
    if (numero && messaggio) {
      numeroFinale = numero;
      messaggioFinale = messaggio;
    } else if (to && message) {
      numeroFinale = to;
      messaggioFinale = message;
    } else if (numero && template) {
      numeroFinale = numero;
      messaggioFinale = whatsappService.generaMessaggioDaTemplate(template, variabili || {});
    } else {
      return res.status(400).json({
        success: false,
        error: 'Parametri mancanti: serve {numero, messaggio} o {numero, template, variabili}'
      });
    }
    
    if (!numeroFinale) {
      return res.status(400).json({
        success: false,
        error: 'Numero telefono mancante'
      });
    }
    
    // ✅ INVIO AUTOMATICO BAILEYS
    const result = await whatsappService.inviaMessaggio(numeroFinale, messaggioFinale);
    
    if (result.success) {
      logger.info(`✅ Messaggio inviato automaticamente a ${numeroFinale}`);
    } else {
      logger.error(`❌ Errore invio a ${numeroFinale}: ${result.error}`);
    }
    
    res.json(result);
    
  } catch (error) {
    logger.error('❌ Errore invio messaggio WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/invia-messaggio
router.post('/invia-messaggio', async (req, res) => {
  try {
    const { numero, messaggio } = req.body;
    
    if (!numero || !messaggio) {
      return res.status(400).json({
        success: false,
        error: 'Numero e messaggio sono obbligatori'
      });
    }
    
    const result = await whatsappService.inviaMessaggio(numero, messaggio);
    res.json(result);
    
  } catch (error) {
    logger.error('Errore invio messaggio WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/invia-promemoria/:ordineId
router.post('/invia-promemoria/:ordineId', async (req, res) => {
  try {
    const { ordineId } = req.params;
    let ordine = req.body;
    
    if (!ordine || !ordine.telefono) {
      ordine = await Ordine.findById(ordineId);
      if (!ordine) {
        return res.status(404).json({
          success: false,
          error: 'Ordine non trovato'
        });
      }
    }
    
    const telefono = ordine.telefono || ordine.cliente?.telefono;
    
    if (!telefono) {
      return res.status(400).json({
        success: false,
        error: 'Numero telefono mancante'
      });
    }
    
    const prodottiLista = (ordine.prodotti || [])
      .slice(0, 5)
      .map(p => `• ${p.nome}: ${p.quantita} ${p.unita || 'Kg'}`)
      .join('\n');
    
    const variabili = {
      nomeCliente: ordine.nomeCliente || 'Cliente',
      dataRitiro: new Date(ordine.dataRitiro).toLocaleDateString('it-IT'),
      oraRitiro: ordine.oraRitiro || '10:00',
      prodottiBreve: prodottiLista
    };
    
    const result = await whatsappService.inviaMessaggioConTemplate(
      telefono,
      'promemoria-giorno-prima',
      variabili
    );
    
    res.json(result);
    
  } catch (error) {
    logger.error('Errore invio promemoria:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/invia-ordine-pronto/:ordineId
router.post('/invia-ordine-pronto/:ordineId', async (req, res) => {
  try {
    const { ordineId } = req.params;
    let ordine = req.body;
    
    if (!ordine || !ordine.telefono) {
      ordine = await Ordine.findById(ordineId);
      if (!ordine) {
        return res.status(404).json({
          success: false,
          error: 'Ordine non trovato'
        });
      }
    }
    
    const telefono = ordine.telefono || ordine.cliente?.telefono;
    
    if (!telefono) {
      return res.status(400).json({
        success: false,
        error: 'Numero telefono mancante'
      });
    }
    
    const variabili = {
      nomeCliente: ordine.nomeCliente || 'Cliente',
      oraRitiro: ordine.oraRitiro || '10:00'
    };
    
    const result = await whatsappService.inviaMessaggioConTemplate(
      telefono,
      'ordine-pronto',
      variabili
    );
    
    res.json(result);
    
  } catch (error) {
    logger.error('Errore invio ordine pronto:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/restart
router.post('/restart', async (req, res) => {
  try {
    await whatsappService.restart();
    res.json({
      success: true,
      message: 'WhatsApp service riavviato'
    });
  } catch (error) {
    logger.error('Errore riavvio WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;