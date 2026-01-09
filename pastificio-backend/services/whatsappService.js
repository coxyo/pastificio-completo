// services/whatsappService.js - ✅ VERSIONE COMPLETA CON AUTO-SEND (ES MODULES)
import axios from 'axios';
import Cliente from '../models/Cliente.js';
import logger from '../config/logger.js';

/**
 * ✅ NUOVA FUNZIONE: Genera link WhatsApp
 * Crea un link wa.me con numero e messaggio preformattato
 */
const generaLinkWhatsApp = (numero, messaggio) => {
  if (!numero) {
    throw new Error('Numero di telefono mancante');
  }
  
  // Rimuovi tutti i caratteri non numerici
  const numeroSanitized = numero.replace(/[^0-9]/g, '');
  
  // Verifica che sia un numero valido italiano (inizia con 39)
  if (!numeroSanitized.startsWith('39')) {
    throw new Error('Numero di telefono non valido (deve iniziare con +39)');
  }
  
  // Encode del messaggio per URL
  const messaggioEncoded = encodeURIComponent(messaggio);
  
  // Genera link wa.me
  const link = `https://wa.me/${numeroSanitized}?text=${messaggioEncoded}`;
  
  logger.info(`Link WhatsApp generato per ${numeroSanitized}`);
  return link;
};

/**
 * ✅ FUNZIONE ESISTENTE: Invia messaggio WhatsApp
 * Trova il cliente, genera il messaggio e restituisce il link
 */
const inviaMessaggio = async (ordine, tipo = 'promemoria', autoSend = false) => {
  try {
    logger.info(`Invio WhatsApp ${tipo} per ordine ${ordine.numeroOrdine || ordine._id}`);
    
    // Trova cliente
    const cliente = await Cliente.findById(ordine.cliente);
    if (!cliente) {
      throw new Error('Cliente non trovato');
    }
    
    if (!cliente.telefono) {
      throw new Error('Cliente senza numero di telefono');
    }
    
    // Genera messaggio in base al tipo
    let messaggio = '';
    
    if (tipo === 'promemoria') {
      const dataRitiro = new Date(ordine.dataRitiro).toLocaleDateString('it-IT');
      messaggio = `Ciao ${cliente.nome}! 🍝\n\nTi ricordiamo che il tuo ordine sarà pronto per il ${dataRitiro} alle ${ordine.oraRitiro}.\n\nGrazie!\nPastificio Nonna Claudia`;
    } else if (tipo === 'pronto') {
      messaggio = `Ciao ${cliente.nome}! ✅\n\nIl tuo ordine è pronto per il ritiro!\n\nTi aspettiamo.\nPastificio Nonna Claudia`;
    } else if (tipo === 'conferma') {
      const dataRitiro = new Date(ordine.dataRitiro).toLocaleDateString('it-IT');
      messaggio = `Ciao ${cliente.nome}! ✅\n\nAbbiamo ricevuto il tuo ordine per il ${dataRitiro} alle ${ordine.oraRitiro}.\n\nGrazie!\nPastificio Nonna Claudia`;
    }
    
    // Genera link WhatsApp
    const link = generaLinkWhatsApp(cliente.telefono, messaggio);
    
    logger.info(`✅ Link WhatsApp generato: ${link.substring(0, 50)}...`);
    
    return {
      success: true,
      link,
      messaggio,
      numeroDestinatario: cliente.telefono,
      autoSend  // ✅ NUOVO: indica se deve aprire automaticamente
    };
    
  } catch (error) {
    logger.error('Errore invio WhatsApp:', error);
    throw error;
  }
};

/**
 * ✅ NUOVA FUNZIONE: Invia WhatsApp quando ordine è pronto
 * Questa funzione viene chiamata automaticamente da GestoreOrdini
 */
const inviaWhatsAppPronto = async (ordine) => {
  try {
    logger.info(`📱 Invio WhatsApp automatico per ordine pronto: ${ordine.numeroOrdine || ordine._id}`);
    
    // Usa la funzione esistente con tipo 'pronto' e autoSend=true
    const risultato = await inviaMessaggio(ordine, 'pronto', true);
    
    logger.info(`✅ WhatsApp pronto inviato con successo`);
    return risultato;
    
  } catch (error) {
    logger.error('❌ Errore invio WhatsApp pronto:', error);
    throw error;
  }
};

// ✅ ES Modules export (per compatibility con backend)
export {
  inviaMessaggio,
  generaLinkWhatsApp,
  inviaWhatsAppPronto
};
