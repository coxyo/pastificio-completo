// popup.js - UI Logic for Extension Popup
// Version: 3.5.0

const CONFIG = {
  BACKEND_URL: 'https://pastificio-completo-production.up.railway.app',
  GESTIONALE_URL: 'https://pastificio-frontend-final.vercel.app',
  VERSION: '3.5.0'
};

// DOM Elements
const elements = {
  loading: document.getElementById('loading'),
  mainContent: document.getElementById('main-content'),
  alertArea: document.getElementById('alert-area'),
  
  // Status indicators
  extensionStatus: document.getElementById('extension-status'),
  extensionText: document.getElementById('extension-text'),
  backendStatus: document.getElementById('backend-status'),
  backendText: document.getElementById('backend-text'),
  lastCall: document.getElementById('last-call'),
  lastNumber: document.getElementById('last-number'),
  callsCount: document.getElementById('calls-count'),
  checkInterval: document.getElementById('check-interval'),
  
  // Buttons
  testBtn: document.getElementById('test-btn'),
  resetBtn: document.getElementById('reset-btn'),
  gestionaleBtn: document.getElementById('gestionale-btn'),
  helpBtn: document.getElementById('help-btn')
};

// Show/hide loading
function setLoading(isLoading) {
  if (isLoading) {
    elements.loading.classList.remove('hidden');
    elements.mainContent.classList.add('hidden');
  } else {
    elements.loading.classList.add('hidden');
    elements.mainContent.classList.remove('hidden');
  }
}

// Show alert
function showAlert(message, type = 'info') {
  const alert = document.createElement('div');
  alert.className = `alert ${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  alert.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  
  elements.alertArea.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Update status indicator
function updateStatus(indicator, text, status) {
  indicator.className = `status-indicator ${status}`;
  text.textContent = status === 'online' ? 'Online' : 
                     status === 'offline' ? 'Offline' : 'Warning';
}

// Check backend health
async function checkBackendHealth() {
  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      updateStatus(elements.backendStatus, elements.backendText, 'online');
      return true;
    } else {
      updateStatus(elements.backendStatus, elements.backendText, 'offline');
      return false;
    }
  } catch (error) {
    console.error('Backend health check failed:', error);
    updateStatus(elements.backendStatus, elements.backendText, 'offline');
    return false;
  }
}

// Load extension state
async function loadExtensionState() {
  try {
    // Check if extension is running
    chrome.runtime.sendMessage({ type: 'ping' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Extension error:', chrome.runtime.lastError);
        updateStatus(elements.extensionStatus, elements.extensionText, 'offline');
        return;
      }

      if (response && response.pong) {
        updateStatus(elements.extensionStatus, elements.extensionText, 'online');
      } else {
        updateStatus(elements.extensionStatus, elements.extensionText, 'warning');
      }
    });

    // Load from storage
    chrome.storage.local.get(['lastCall', 'lastNumber', 'processedCalls'], (result) => {
      if (result.lastCall) {
        elements.lastCall.textContent = result.lastCall;
      }
      
      if (result.lastNumber) {
        elements.lastNumber.textContent = result.lastNumber;
      }
      
      if (result.processedCalls) {
        // Count calls from today
        const today = new Date().toDateString();
        const todayCalls = result.processedCalls.filter(call => {
          // Assume calls are stored as timestamps
          return true; // Simplified for now
        });
        elements.callsCount.textContent = result.processedCalls.length || 0;
      }
    });

  } catch (error) {
    console.error('Failed to load extension state:', error);
    updateStatus(elements.extensionStatus, elements.extensionText, 'offline');
  }
}

// Initialize popup
async function init() {
  console.log('[Popup] Initializing...');
  
  setLoading(true);
  
  // Load states
  await Promise.all([
    loadExtensionState(),
    checkBackendHealth()
  ]);
  
  setLoading(false);
  
  console.log('[Popup] Initialized successfully');
}

// Button handlers
elements.testBtn.addEventListener('click', async () => {
  elements.testBtn.disabled = true;
  elements.testBtn.textContent = '⏳ Testing...';
  
  try {
    // Send test call via background script
    chrome.runtime.sendMessage(
      {
        type: 'SEND_WEBHOOK',
        data: {
          numero: '+393271234567',
          timestamp: new Date().toISOString(),
          callId: `test_${Date.now()}`
        }
      },
      (response) => {
        if (chrome.runtime.lastError) {
          showAlert('Errore: ' + chrome.runtime.lastError.message, 'error');
        } else if (response && response.success) {
          showAlert('✅ Test chiamata inviato con successo!', 'success');
        } else {
          showAlert('❌ Test fallito: ' + (response?.error || 'Unknown error'), 'error');
        }
        
        elements.testBtn.disabled = false;
        elements.testBtn.textContent = '🧪 Test';
      }
    );
  } catch (error) {
    showAlert('Errore: ' + error.message, 'error');
    elements.testBtn.disabled = false;
    elements.testBtn.textContent = '🧪 Test';
  }
});

elements.resetBtn.addEventListener('click', () => {
  if (confirm('Vuoi resettare lo storico chiamate?')) {
    chrome.storage.local.clear(() => {
      showAlert('✅ Storico resettato', 'success');
      elements.lastCall.textContent = 'Nessuna';
      elements.lastNumber.textContent = '-';
      elements.callsCount.textContent = '0';
    });
  }
});

elements.gestionaleBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: CONFIG.GESTIONALE_URL });
});

elements.helpBtn.addEventListener('click', () => {
  const helpText = `
📞 3CX Call Detector v${CONFIG.VERSION}

FUNZIONAMENTO:
• L'estensione controlla la pagina 3CX ogni 2 secondi
• Quando rileva una chiamata in arrivo, invia webhook al backend
• Il backend notifica il gestionale via Pusher
• Il popup appare automaticamente nel gestionale (NON notifica Chrome)

COMANDI DEBUG (Console 3CX):
• window._3cxDetector.test() - Test chiamata
• window._3cxDetector.forceCheck() - Forza check
• window._3cxDetector.extractNumber() - Estrai numero
• window._3cxDetector.resetCooldown() - Reset cooldown

TROUBLESHOOTING:
1. Verifica che l'extension sia attiva su chrome://extensions
2. Verifica che il backend sia online (indicatore verde)
3. Apri console 3CX (F12) per vedere i log
4. Prova il comando test

SUPPORTO:
• Extension attiva solo su pagine 3CX
• Cooldown 30s tra chiamate stesso numero
• Storico max 50 chiamate
  `.trim();
  
  alert(helpText);
});

// Refresh status every 30 seconds
setInterval(() => {
  checkBackendHealth();
  loadExtensionState();
}, 30000);

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

console.log('[Popup] Script loaded, version:', CONFIG.VERSION);