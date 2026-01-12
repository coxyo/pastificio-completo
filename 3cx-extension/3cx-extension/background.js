// background.js - 3CX Call Detector Extension
// Version: 3.6.0 - MANUAL INJECTION
// Data: 11/01/2026
// Fix: Injection manuale per supportare 3CX SPA

const CONFIG = {
  BACKEND_URL: 'https://pastificio-completo-production.up.railway.app',
  GESTIONALE_URL: 'https://pastificio-frontend-final.vercel.app',
  WEBHOOK_ENDPOINT: '/api/chiamate/webhook',
  HEALTH_ENDPOINT: '/api/health',
  API_KEY: 'pastificio-chiamate-2025',
  VERSION: '3.6.0'
};

console.log('[3CX Extension v3.6.0] Background script caricato - Manual injection mode');

// ===== INJECTION AUTOMATICO SU 3CX =====
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Controlla se è una pagina 3CX e se è completamente caricata
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('3cx.cloud') || 
        tab.url.includes('3cx.com') || 
        tab.url.includes('3cx.it')) {
      
      console.log('[3CX Extension] 🎯 Pagina 3CX rilevata:', tab.url);
      console.log('[3CX Extension] 💉 Injection content script...');
      
      // Inietta il content script manualmente
      chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: true },
        files: ['content.js']
      })
      .then(() => {
        console.log('[3CX Extension] ✅ Content script iniettato con successo!');
      })
      .catch(err => {
        console.error('[3CX Extension] ❌ Errore injection:', err);
      });
    }
  }
});

// Gestione messaggi dal content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[3CX Extension] Messaggio ricevuto:', message.type);

  if (message.type === 'SEND_WEBHOOK') {
    sendWebhook(message.data)
      .then(result => {
        console.log('[3CX Extension] ✅ Webhook inviato con successo:', result);
        sendResponse({ success: true, data: result });
        
        // Salva ultima chiamata per statistiche
        chrome.storage.local.set({ 
          lastCall: new Date().toLocaleTimeString('it-IT'),
          lastNumber: message.data.numero
        });
      })
      .catch(error => {
        console.error('[3CX Extension] ❌ Errore webhook:', error);
        sendResponse({ success: false, error: error.message });
        
        // Mostra notifica SOLO per errori critici
        showNotification(
          'Errore Invio Chiamata',
          `Impossibile inviare al gestionale\n${error.message}`,
          'error'
        );
      });
    
    return true; // Indica che la risposta sarà asincrona
  }

  if (message.type === 'ping') {
    sendResponse({ pong: true, version: CONFIG.VERSION });
    return false;
  }

  if (message.type === 'extension-loaded') {
    console.log('[3CX Extension] ✅ Content script caricato su:', message.url);
    sendResponse({ success: true });
    return false;
  }

  return false;
});

// Funzione per inviare webhook al backend
async function sendWebhook(data) {
  const url = `${CONFIG.BACKEND_URL}${CONFIG.WEBHOOK_ENDPOINT}`;
  
  console.log('[3CX Extension] 📤 Invio webhook a:', url);
  console.log('[3CX Extension] 📦 Payload:', data);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': CONFIG.API_KEY,
        'User-Agent': `3CX-Extension/${CONFIG.VERSION}`
      },
      body: JSON.stringify(data)
    });

    console.log('[3CX Extension] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[3CX Extension] Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[3CX Extension] ✅ Webhook completato:', result);

    return result;

  } catch (error) {
    console.error('[3CX Extension] ❌ Errore webhook:', error);
    throw error;
  }
}

// Mostra notifica Chrome (solo per errori)
function showNotification(title, message, type = 'basic') {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png',
    title: title,
    message: message,
    priority: type === 'error' ? 2 : 1
  });
}

// Health check periodico (ogni 5 minuti)
setInterval(async () => {
  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}${CONFIG.HEALTH_ENDPOINT}`);
    if (response.ok) {
      console.log('[3CX Extension] ✅ Backend online');
      chrome.storage.local.set({ backendStatus: 'online', lastCheck: Date.now() });
    } else {
      console.warn('[3CX Extension] ⚠️ Backend health check fallito');
      chrome.storage.local.set({ backendStatus: 'warning', lastCheck: Date.now() });
    }
  } catch (error) {
    console.error('[3CX Extension] ❌ Backend non raggiungibile:', error.message);
    chrome.storage.local.set({ backendStatus: 'offline', lastCheck: Date.now() });
  }
}, 5 * 60 * 1000);

// Health check immediato all'avvio
(async () => {
  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}${CONFIG.HEALTH_ENDPOINT}`);
    console.log('[3CX Extension] Health check iniziale:', response.ok ? 'OK' : 'FAIL');
  } catch (error) {
    console.error('[3CX Extension] Health check iniziale fallito:', error.message);
  }
})();

console.log('[3CX Extension] ✅ Background script pronto - Manual injection attivo');