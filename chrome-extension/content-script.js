// content-script.js - Pastificio WhatsApp Auto-Send
// Rileva se WhatsApp è stato aperto dal gestionale con flag auto_send

console.log('🤖 Pastificio WhatsApp Auto-Send - Estensione attiva');

// Controlla URL per parametro auto_send
const urlParams = new URLSearchParams(window.location.search);
const autoSendEnabled = urlParams.get('auto_send') === 'true';

if (autoSendEnabled) {
  console.log('✅ Auto-send ATTIVATO dal Pastificio');
  
  // Aggiungi indicatore visivo
  const indicator = document.createElement('div');
  indicator.id = 'pastificio-autosend-indicator';
  indicator.innerHTML = '🤖 Invio automatico in corso...';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #25D366;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: bold;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: fadeIn 0.3s ease-in;
  `;
  document.body.appendChild(indicator);
  
  // Funzione per trovare e cliccare il bottone Invio
  let attempts = 0;
  const maxAttempts = 30; // 30 tentativi = 15 secondi
  
  const sendInterval = setInterval(() => {
    attempts++;
    
    // Cerca il bottone Invio con vari selettori (WhatsApp cambia spesso)
    const sendButton = 
      document.querySelector('[data-icon="send"]')?.closest('button') ||
      document.querySelector('button[aria-label="Invia"]') ||
      document.querySelector('button[aria-label="Send"]') ||
      document.querySelector('span[data-icon="send"]')?.closest('button');
    
    // Controlla se il bottone è abilitato
    if (sendButton && !sendButton.disabled) {
      console.log('✅ Bottone Invio trovato! Invio in corso...');
      
      // Click sul bottone
      sendButton.click();
      
      // Aggiorna indicatore
      indicator.innerHTML = '✅ Messaggio inviato!';
      indicator.style.background = '#128C7E';
      
      // Chiudi tab dopo 1.5 secondi
      setTimeout(() => {
        console.log('🚪 Chiudo tab...');
        window.close();
      }, 1500);
      
      clearInterval(sendInterval);
      return;
    }
    
    // Timeout dopo 15 secondi
    if (attempts >= maxAttempts) {
      console.warn('⏱️ Timeout: Bottone Invio non trovato dopo 15 secondi');
      indicator.innerHTML = '⚠️ Invio manuale necessario';
      indicator.style.background = '#FF6B6B';
      
      // Rimuovi indicatore dopo 3 secondi
      setTimeout(() => {
        indicator.remove();
      }, 3000);
      
      clearInterval(sendInterval);
    }
    
  }, 500); // Controlla ogni 500ms
  
} else {
  // Modalità normale (senza auto-send)
  console.log('ℹ️ Auto-send NON attivo (modalità normale)');
}

// Listener per messaggi dal background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkAutoSend') {
    sendResponse({ autoSendEnabled: autoSendEnabled });
  }
});
