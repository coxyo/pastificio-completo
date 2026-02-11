// services/dispositivoService.js
// Servizio per gestire le preferenze del dispositivo corrente

const STORAGE_KEY = 'pastificio_dispositivo_config';

// Configurazione di default per ogni tipo di dispositivo
const DEFAULT_CONFIG = {
  'ufficio': {
    nome: 'Ufficio',
    descrizione: 'PC principale ufficio',
    notifiche: {
      fatture: true,
      pulizie: true,
      chiamate3cx: true,
      ordiniScadenza: true,
      scorteBasse: true,
      backupReminder: true
    }
  },
  'laboratorio': {
    nome: 'Computer Laboratorio',
    descrizione: 'PC nel laboratorio di produzione',
    notifiche: {
      fatture: false,
      pulizie: false,
      chiamate3cx: true,
      ordiniScadenza: false,
      scorteBasse: false,
      backupReminder: false
    }
  },
  'punto-vendita': {
    nome: 'Punto Vendita',
    descrizione: 'Tablet/PC nel negozio',
    notifiche: {
      fatture: false,
      pulizie: false,
      chiamate3cx: false,
      ordiniScadenza: false,
      scorteBasse: false,
      backupReminder: false
    }
  },
  'mobile': {
    nome: 'Mobile',
    descrizione: 'Smartphone o tablet mobile',
    notifiche: {
      fatture: false,
      pulizie: false,
      chiamate3cx: false,
      ordiniScadenza: false,
      scorteBasse: false,
      backupReminder: false
    }
  },
  'personalizzato': {
    nome: 'Personalizzato',
    descrizione: 'Configurazione personalizzata',
    notifiche: {
      fatture: false,
      pulizie: false,
      chiamate3cx: false,
      ordiniScadenza: false,
      scorteBasse: false,
      backupReminder: false
    }
  }
};

// Lista delle notifiche disponibili con descrizioni
export const NOTIFICHE_DISPONIBILI = [
  {
    id: 'fatture',
    nome: 'Import Fatture',
    descrizione: 'Promemoria giornaliero per scaricare e importare fatture da Danea',
    icona: '📄'
  },
  {
    id: 'pulizie',
    nome: 'Promemoria Pulizie',
    descrizione: 'Notifiche per le pulizie programmate HACCP',
    icona: '🧹'
  },
  {
    id: 'chiamate3cx',
    nome: 'Chiamate 3CX',
    descrizione: 'Popup quando arriva una chiamata dal centralino 3CX',
    icona: '📞'
  },
  {
    id: 'ordiniScadenza',
    nome: 'Ordini in Scadenza',
    descrizione: 'Avviso per ordini da consegnare oggi o in ritardo',
    icona: '⏰'
  },
  {
    id: 'scorteBasse',
    nome: 'Scorte Basse',
    descrizione: 'Avviso quando un ingrediente scende sotto la soglia minima',
    icona: '📦'
  },
  {
    id: 'backupReminder',
    nome: 'Promemoria Backup',
    descrizione: 'Promemoria periodico per verificare i backup',
    icona: '💾'
  }
];

// Lista dei tipi di dispositivo
export const TIPI_DISPOSITIVO = [
  { id: 'ufficio', nome: 'Ufficio', icona: '🖥️' },
  { id: 'laboratorio', nome: 'Computer Laboratorio', icona: '🏭' },
  { id: 'punto-vendita', nome: 'Punto Vendita', icona: '🏪' },
  { id: 'mobile', nome: 'Mobile', icona: '📱' },
  { id: 'personalizzato', nome: 'Personalizzato', icona: '⚙️' }
];

class DispositivoService {
  constructor() {
    this.config = null;
    this.listeners = [];
  }

  // Carica configurazione da localStorage
  caricaConfig() {
    if (typeof window === 'undefined') return null;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.config = JSON.parse(saved);
        return this.config;
      }
    } catch (e) {
      console.error('Errore caricamento config dispositivo:', e);
    }
    
    return null;
  }

  // Salva configurazione in localStorage
  salvaConfig(config) {
    if (typeof window === 'undefined') return;
    
    try {
      this.config = config;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      
      // Notifica listeners
      this.listeners.forEach(fn => fn(config));
    } catch (e) {
      console.error('Errore salvataggio config dispositivo:', e);
    }
  }

  // Ottieni configurazione corrente (o default)
  getConfig() {
    if (!this.config) {
      this.caricaConfig();
    }
    return this.config;
  }

  // Verifica se il dispositivo è configurato
  isConfigurato() {
    return !!this.getConfig();
  }

  // Ottieni tipo dispositivo corrente
  getTipoDispositivo() {
    const config = this.getConfig();
    return config?.tipo || null;
  }

  // Ottieni nome dispositivo
  getNomeDispositivo() {
    const config = this.getConfig();
    return config?.nomePersonalizzato || DEFAULT_CONFIG[config?.tipo]?.nome || 'Non configurato';
  }

  // Verifica se una specifica notifica è abilitata
  isNotificaAbilitata(notificaId) {
    const config = this.getConfig();
    if (!config) return false;
    
    return config.notifiche?.[notificaId] === true;
  }

  // Imposta tipo dispositivo (applica preset)
  setTipoDispositivo(tipo, nomePersonalizzato = '') {
    const preset = DEFAULT_CONFIG[tipo];
    if (!preset) return false;

    const config = {
      tipo,
      nomePersonalizzato: nomePersonalizzato || preset.nome,
      notifiche: { ...preset.notifiche },
      dataConfigurazione: new Date().toISOString(),
      deviceId: this.getDeviceId()
    };

    this.salvaConfig(config);
    return true;
  }

  // Aggiorna singola notifica
  setNotifica(notificaId, abilitata) {
    const config = this.getConfig();
    if (!config) return false;

    config.notifiche = config.notifiche || {};
    config.notifiche[notificaId] = abilitata;
    
    // Se modifica manuale, diventa "personalizzato"
    if (config.tipo !== 'personalizzato') {
      const presetOriginale = DEFAULT_CONFIG[config.tipo];
      const isModificato = Object.keys(config.notifiche).some(
        key => config.notifiche[key] !== presetOriginale?.notifiche?.[key]
      );
      if (isModificato) {
        config.tipo = 'personalizzato';
      }
    }

    this.salvaConfig(config);
    return true;
  }

  // Genera ID univoco per questo dispositivo/browser
  getDeviceId() {
    if (typeof window === 'undefined') return 'server';
    
    let deviceId = localStorage.getItem('pastificio_device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('pastificio_device_id', deviceId);
    }
    return deviceId;
  }

  // Resetta configurazione
  reset() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    this.config = null;
    this.listeners.forEach(fn => fn(null));
  }

  // Aggiungi listener per cambiamenti
  addListener(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(f => f !== fn);
    };
  }
}

// Singleton
const dispositivoService = new DispositivoService();
export default dispositivoService;