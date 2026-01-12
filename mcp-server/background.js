// background.js - Service Worker per Pastificio WhatsApp Auto-Send

console.log('🚀 Pastificio WhatsApp Auto-Send - Background service attivo');

// Listener per installazione estensione
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('✅ Estensione Pastificio installata con successo!');
  } else if (details.reason === 'update') {
    console.log('🔄 Estensione Pastificio aggiornata');
  }
});

// Listener per click sull'icona estensione
chrome.action.onClicked.addListener((tab) => {
  console.log('🖱️ Click su icona estensione');
  
  // Mostra alert con stato
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      alert('🤖 Estensione Pastificio WhatsApp Auto-Send ATTIVA\n\n' +
            'Quando apri WhatsApp Web dal gestionale con "Segna come Pronto",\n' +
            'il messaggio verrà inviato automaticamente!\n\n' +
            'Versione: 1.0.0');
    }
  });
});

// Monitor tab create per debug
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.url && tab.url.includes('web.whatsapp.com')) {
    console.log('📱 Nuova tab WhatsApp aperta:', tab.url);
    
    // Controlla se ha parametro auto_send
    if (tab.url.includes('auto_send=true')) {
      console.log('🤖 Auto-send RILEVATO nella nuova tab');
    }
  }
});

// Monitor tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('web.whatsapp.com') && 
      tab.url.includes('auto_send=true')) {
    
    console.log('✅ WhatsApp caricato con auto-send, content-script dovrebbe attivarsi');
  }
});
