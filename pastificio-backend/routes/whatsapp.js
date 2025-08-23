// routes/whatsapp.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

// Servizio WhatsApp simulato (sostituire con WhatsApp Business API o Twilio)
const whatsappService = {
  isConnected: false,
  qrCode: null,
  
  async initialize() {
    // Simulazione inizializzazione
    this.isConnected = true;
    logger.info('WhatsApp service initialized');
  },
  
  async checkWhatsApp(phoneNumber) {
    // Simula verifica numero
    return {
      hasWhatsapp: true,
      profilePic: null,
      status: 'Disponibile'
    };
  },
  
  async sendMessage(phoneNumber, message) {
    // Simula invio messaggio
    logger.info(`WhatsApp message sent to ${phoneNumber}: ${message.substring(0, 50)}...`);
    return { success: true, messageId: Date.now().toString() };
  },
  
  async sendMedia(phoneNumber, mediaUrl, caption) {
    // Simula invio media
    logger.info(`WhatsApp media sent to ${phoneNumber}`);
    return { success: true, messageId: Date.now().toString() };
  }
};

// Inizializza servizio all'avvio
whatsappService.initialize();

// Ottieni stato connessione e QR code
router.get('/status', protect, (req, res) => {
  res.json({
    success: true,
    isConnected: whatsappService.isConnected,
    qrCode: whatsappService.qrCode
  });
});

// Endpoint per verificare se un numero ha WhatsApp
router.post('/check', protect, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Numero telefono richiesto'
      });
    }
    
    const result = await whatsappService.checkWhatsApp(phoneNumber);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Errore verifica WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Invia messaggio WhatsApp
router.post('/send', protect, async (req, res) => {
  try {
    const { telefono, messaggio, mediaUrl } = req.body;
    
    if (!telefono || !messaggio) {
      return res.status(400).json({
        success: false,
        error: 'Telefono e messaggio sono richiesti'
      });
    }
    
    // Formatta numero (aggiungi prefisso Italia se mancante)
    let formattedPhone = telefono.replace(/\D/g, '');
    if (!formattedPhone.startsWith('39')) {
      formattedPhone = '39' + formattedPhone;
    }
    
    let result;
    if (mediaUrl) {
      result = await whatsappService.sendMedia(formattedPhone, mediaUrl, messaggio);
    } else {
      result = await whatsappService.sendMessage(formattedPhone, messaggio);
    }
    
    // Log per statistiche
    logger.info(`WhatsApp inviato a ${formattedPhone} - Tipo: ${mediaUrl ? 'media' : 'testo'}`);
    
    res.json({
      success: true,
      message: 'Messaggio inviato con successo',
      messageId: result.messageId
    });
    
  } catch (error) {
    logger.error('Errore invio WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Invia messaggio promozionale a lista clienti
router.post('/broadcast', protect, async (req, res) => {
  try {
    const { clienti, messaggio, mediaUrl } = req.body;
    
    if (!clienti || !Array.isArray(clienti) || clienti.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista clienti richiesta'
      });
    }
    
    const results = [];
    const errors = [];
    
    // Invia messaggi con delay per evitare ban
    for (const cliente of clienti) {
      try {
        // Delay di 2 secondi tra ogni messaggio
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        let formattedPhone = cliente.telefono.replace(/\D/g, '');
        if (!formattedPhone.startsWith('39')) {
          formattedPhone = '39' + formattedPhone;
        }
        
        // Personalizza messaggio
        const messaggioPersonalizzato = messaggio
          .replace('{{nome}}', cliente.nome || 'Cliente')
          .replace('{{punti}}', cliente.punti || '0')
          .replace('{{livello}}', cliente.livello || 'Bronze');
        
        const result = await whatsappService.sendMessage(formattedPhone, messaggioPersonalizzato);
        
        results.push({
          cliente: cliente.nome,
          telefono: cliente.telefono,
          success: true,
          messageId: result.messageId
        });
        
      } catch (error) {
        errors.push({
          cliente: cliente.nome,
          telefono: cliente.telefono,
          error: error.message
        });
        logger.error(`Errore invio a ${cliente.telefono}:`, error);
      }
    }
    
    res.json({
      success: true,
      message: `Invio completato: ${results.length} successi, ${errors.length} errori`,
      results,
      errors
    });
    
  } catch (error) {
    logger.error('Errore broadcast WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Template messaggi promozionali
router.get('/templates', protect, (req, res) => {
  const templates = [
    {
      id: 1,
      nome: 'Benvenuto',
      messaggio: 'Ciao {{nome}}! 🌟 Benvenuto nel nostro programma fedeltà! Hai già {{punti}} punti. Continua ad acquistare per sbloccare fantastici premi! 🎁'
    },
    {
      id: 2,
      nome: 'Promemoria Ordine',
      messaggio: 'Ciao {{nome}}! 📅 È passato un po\' di tempo dal tuo ultimo ordine. Ti aspettiamo! Come cliente {{livello}} hai diritto a uno sconto esclusivo! 🎉'
    },
    {
      id: 3,
      nome: 'Nuovo Livello',
      messaggio: 'Congratulazioni {{nome}}! 🎊 Hai raggiunto il livello {{livello}}! Ora hai accesso a vantaggi esclusivi e sconti speciali. Grazie per la tua fedeltà! 💝'
    },
    {
      id: 4,
      nome: 'Reward Disponibile',
      messaggio: 'Ciao {{nome}}! 🎁 Hai {{punti}} punti disponibili! Puoi riscattare fantastici premi. Passa a trovarci per scoprire cosa abbiamo per te! ✨'
    },
    {
      id: 5,
      nome: 'Compleanno',
      messaggio: 'Tanti auguri {{nome}}! 🎂 Per il tuo compleanno ti regaliamo 50 punti extra e uno sconto del 20% sul prossimo ordine! Buon compleanno! 🎉'
    }
  ];
  
  res.json({
    success: true,
    templates
  });
});

// Statistiche invii
router.get('/stats', protect, async (req, res) => {
  try {
    // Qui potresti recuperare statistiche dal database
    const stats = {
      messaggiInviatiOggi: 42,
      messaggiInviatiMese: 1250,
      tassoApertura: '85%',
      tassoRisposta: '32%',
      clientiAttivi: 186,
      ultimoInvio: new Date().toISOString()
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    logger.error('Errore recupero statistiche:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;