// services/magazzinoSyncService.js
import { MagazzinoService } from './magazzinoService';
import WebSocketService from './webSocketService';

// Chiavi localStorage per la gestione dei dati offline
const STORAGE_KEYS = {
  PENDING_CHANGES: 'magazzino_pending_changes',
  LAST_SYNC: 'magazzino_last_sync',
  OFFLINE_CACHE: {
    INGREDIENTI: 'magazzino_cache_ingredienti',
    FORNITORI: 'magazzino_cache_fornitori',
    MOVIMENTI: 'magazzino_cache_movimenti',
    ORDINI: 'magazzino_cache_ordini',
    RICETTE: 'magazzino_cache_ricette'
  }
};

// Tipi di entità del magazzino
const ENTITY_TYPES = {
  INGREDIENTE: 'ingrediente',
  FORNITORE: 'fornitore',
  MOVIMENTO: 'movimento',
  ORDINE: 'ordine',
  RICETTA: 'ricetta'
};

// Tipi di operazioni
const OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
};

// Utility per generare ID univoci locali
const generateLocalId = () => {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Servizio di sincronizzazione per la gestione del magazzino
 * Gestisce la sincronizzazione dei dati tra client e server,
 * funzionamento offline, risoluzione conflitti
 */
export const MagazzinoSyncService = {
  /**
   * Recupera i dati dal localStorage o dal server
   * @param {string} entityType - Tipo di entità (ingrediente, fornitore, ecc.)
   * @param {Object} options - Opzioni aggiuntive
   * @returns {Promise<Array>} - Dati recuperati
   */
  async fetchData(entityType, options = {}) {
    // Verifica se siamo online
    const isOnline = navigator.onLine;
    
    try {
      // Se siamo online, prova a recuperare dal server
      if (isOnline) {
        let data;
        
        switch (entityType) {
          case ENTITY_TYPES.INGREDIENTE:
            data = await MagazzinoService.getIngredienti(options);
            break;
          case ENTITY_TYPES.FORNITORE:
            data = await MagazzinoService.getFornitori(options);
            break;
          case ENTITY_TYPES.MOVIMENTO:
            data = await MagazzinoService.getMovimenti(options);
            break;
          case ENTITY_TYPES.ORDINE:
            data = await MagazzinoService.getOrdini(options);
            break;
          case ENTITY_TYPES.RICETTA:
            data = await MagazzinoService.getRicette(options);
            break;
          default:
            throw new Error(`Tipo di entità sconosciuto: ${entityType}`);
        }
        
        // Salva nella cache locale
        this.saveToLocalCache(entityType, data);
        
        return data;
      }
    } catch (error) {
      console.warn(`Errore nel recupero dati dal server per ${entityType}:`, error);
      // Se c'è un errore, fallback alla cache locale
    }
    
    // Recupera dalla cache locale
    return this.getFromLocalCache(entityType);
  },
  
  /**
   * Esegue operazioni CRUD con supporto per il funzionamento offline
   * @param {string} entityType - Tipo di entità
   * @param {string} operationType - Tipo di operazione (create, update, delete)
   * @param {Object} data - Dati dell'operazione
   * @param {string|number} id - ID dell'entità (per update/delete)
   * @returns {Promise<Object>} - Risultato dell'operazione
   */
  async performOperation(entityType, operationType, data, id = null) {
    // Verifica se siamo online
    const isOnline = navigator.onLine;
    
    // Se siamo offline, salva l'operazione per la sincronizzazione successiva
    if (!isOnline) {
      const operation = {
        id: id || (data.id || generateLocalId()),
        entityType,
        operationType,
        data,
        timestamp: new Date().toISOString()
      };
      
      this.addPendingOperation(operation);
      
      // Aggiorna la cache locale
      this.updateLocalCache(entityType, operationType, data, id);
      
      return { ...data, id: operation.id, _isOffline: true };
    }
    
    // Se siamo online, esegui l'operazione sul server
    try {
      let result;
      
      switch (entityType) {
        case ENTITY_TYPES.INGREDIENTE:
          if (operationType === OPERATION_TYPES.CREATE) {
            result = await MagazzinoService.addIngrediente(data);
          } else if (operationType === OPERATION_TYPES.UPDATE) {
            result = await MagazzinoService.updateIngrediente(data);
          } else if (operationType === OPERATION_TYPES.DELETE) {
            result = await MagazzinoService.deleteIngrediente(id);
          }
          break;
          
        case ENTITY_TYPES.FORNITORE:
          if (operationType === OPERATION_TYPES.CREATE) {
            result = await MagazzinoService.addFornitore(data);
          } else if (operationType === OPERATION_TYPES.UPDATE) {
            result = await MagazzinoService.updateFornitore(data);
          } else if (operationType === OPERATION_TYPES.DELETE) {
            result = await MagazzinoService.deleteFornitore(id);
          }
          break;
          
        case ENTITY_TYPES.MOVIMENTO:
          if (operationType === OPERATION_TYPES.CREATE) {
            result = await MagazzinoService.addMovimento(data);
          } else if (operationType === OPERATION_TYPES.DELETE) {
            result = await MagazzinoService.deleteMovimento(id);
          }
          break;
          
        case ENTITY_TYPES.ORDINE:
          if (operationType === OPERATION_TYPES.CREATE) {
            result = await MagazzinoService.addOrdine(data);
          } else if (operationType === OPERATION_TYPES.UPDATE) {
            result = await MagazzinoService.updateOrdine(data);
          } else if (operationType === OPERATION_TYPES.DELETE) {
            result = await MagazzinoService.deleteOrdine(id);
          }
          break;
          
        case ENTITY_TYPES.RICETTA:
          if (operationType === OPERATION_TYPES.CREATE) {
            result = await MagazzinoService.addRicetta(data);
          } else if (operationType === OPERATION_TYPES.UPDATE) {
            result = await MagazzinoService.updateRicetta(data);
          } else if (operationType === OPERATION_TYPES.DELETE) {
            result = await MagazzinoService.deleteRicetta(id);
          }
          break;
          
        default:
          throw new Error(`Tipo di entità sconosciuto: ${entityType}`);
      }
      
      // Aggiorna la cache locale
      if (operationType !== OPERATION_TYPES.DELETE) {
        this.updateLocalCache(entityType, operationType, result, id);
      } else {
        this.updateLocalCache(entityType, operationType, null, id);
      }
      
      // Notifica tramite WebSocket se necessario
      this.notifyChangesViaWebSocket(entityType, operationType, result, id);
      
      return result;
    } catch (error) {
      console.error(`Errore nell'operazione ${operationType} per ${entityType}:`, error);
      
      // In caso di errore, salva l'operazione per riprovare dopo
      const operation = {
        id: id || (data.id || generateLocalId()),
        entityType,
        operationType,
        data,
        timestamp: new Date().toISOString(),
        error: error.message
      };
      
      this.addPendingOperation(operation);
      
      throw error;
    }
  },
  
  /**
   * Sincronizza le operazioni in sospeso con il server
   * @returns {Promise<Object>} - Risultato della sincronizzazione
   */
  async sincronizza() {
    // Verifica se siamo online
    if (!navigator.onLine) {
      return { 
        success: false, 
        error: 'Offline', 
        message: 'Impossibile sincronizzare in modalità offline' 
      };
    }
    
    const pendingOperations = this.getPendingOperations();
    
    if (pendingOperations.length === 0) {
      return { 
        success: true, 
        message: 'Nessuna operazione in sospeso da sincronizzare' 
      };
    }
    
    const results = {
      success: true,
      totalOperations: pendingOperations.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    // Ordina le operazioni per timestamp e tipo
    // Prima create, poi update, infine delete
    const sortedOperations = [...pendingOperations].sort((a, b) => {
      if (a.operationType !== b.operationType) {
        if (a.operationType === OPERATION_TYPES.CREATE) return -1;
        if (b.operationType === OPERATION_TYPES.CREATE) return 1;
        if (a.operationType === OPERATION_TYPES.UPDATE) return -1;
        if (b.operationType === OPERATION_TYPES.UPDATE) return 1;
      }
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    for (const operation of sortedOperations) {
      try {
        await this.executeOperation(operation);
        results.successful++;
        
        // Rimuovi l'operazione dalla lista delle operazioni in sospeso
        this.removePendingOperation(operation.id);
      } catch (error) {
        results.failed++;
        results.errors.push({
          operation,
          error: error.message
        });
        
        // Aggiorna l'errore nell'operazione in sospeso
        this.updatePendingOperation(operation.id, {
          lastError: error.message,
          lastAttempt: new Date().toISOString()
        });
      }
    }
    
    // Aggiorna il timestamp dell'ultima sincronizzazione
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    
    results.success = results.failed === 0;
    
    return results;
  },
  
  /**
   * Esegue un'operazione specifica
   * @param {Object} operation - Operazione da eseguire
   * @returns {Promise<Object>} - Risultato dell'operazione
   */
  async executeOperation(operation) {
    const { entityType, operationType, data, id } = operation;
    
    switch (entityType) {
      case ENTITY_TYPES.INGREDIENTE:
        if (operationType === OPERATION_TYPES.CREATE) {
          return await MagazzinoService.addIngrediente(data);
        } else if (operationType === OPERATION_TYPES.UPDATE) {
          return await MagazzinoService.updateIngrediente(data);
        } else if (operationType === OPERATION_TYPES.DELETE) {
          return await MagazzinoService.deleteIngrediente(id);
        }
        break;
        
      case ENTITY_TYPES.FORNITORE:
        if (operationType === OPERATION_TYPES.CREATE) {
          return await MagazzinoService.addFornitore(data);
        } else if (operationType === OPERATION_TYPES.UPDATE) {
          return await MagazzinoService.updateFornitore(data);
        } else if (operationType === OPERATION_TYPES.DELETE) {
          return await MagazzinoService.deleteFornitore(id);
        }
        break;
        
      case ENTITY_TYPES.MOVIMENTO:
        if (operationType === OPERATION_TYPES.CREATE) {
          return await MagazzinoService.addMovimento(data);
        } else if (operationType === OPERATION_TYPES.DELETE) {
          return await MagazzinoService.deleteMovimento(id);
        }
        break;
        
      case ENTITY_TYPES.ORDINE:
        if (operationType === OPERATION_TYPES.CREATE) {
          return await MagazzinoService.addOrdine(data);
        } else if (operationType === OPERATION_TYPES.UPDATE) {
          return await MagazzinoService.updateOrdine(data);
        } else if (operationType === OPERATION_TYPES.DELETE) {
          return await MagazzinoService.deleteOrdine(id);
        }
        break;
        
      case ENTITY_TYPES.RICETTA:
        if (operationType === OPERATION_TYPES.CREATE) {
          return await MagazzinoService.addRicetta(data);
        } else if (operationType === OPERATION_TYPES.UPDATE) {
          return await MagazzinoService.updateRicetta(data);
        } else if (operationType === OPERATION_TYPES.DELETE) {
          return await MagazzinoService.deleteRicetta(id);
        }
        break;
        
      default:
        throw new Error(`Tipo di entità sconosciuto: ${entityType}`);
    }
  },
  
  /**
   * Backup dei dati del magazzino
   * @returns {Promise<Object>} - Risultato del backup
   */
  async backupData() {
    try {
      // Recupera tutti i dati
      const ingredienti = await this.fetchData(ENTITY_TYPES.INGREDIENTE);
      const fornitori = await this.fetchData(ENTITY_TYPES.FORNITORE);
      const movimenti = await this.fetchData(ENTITY_TYPES.MOVIMENTO);
      const ordini = await this.fetchData(ENTITY_TYPES.ORDINE);
      const ricette = await this.fetchData(ENTITY_TYPES.RICETTA);
      
      const backup = {
        timestamp: new Date().toISOString(),
        data: {
          ingredienti,
          fornitori,
          movimenti,
          ordini,
          ricette
        }
      };
      
      // Salva il backup in localStorage
      const backups = JSON.parse(localStorage.getItem('magazzino_backups') || '[]');
      backups.push(backup);
      
      // Mantieni solo gli ultimi 5 backup
      if (backups.length > 5) {
        backups.shift();
      }
      
      localStorage.setItem('magazzino_backups', JSON.stringify(backups));
      
      // Se online, effettua anche il backup sul server
      if (navigator.onLine) {
        await MagazzinoService.backupDati();
      }
      
      return { success: true, message: 'Backup completato con successo', timestamp: backup.timestamp };
    } catch (error) {
      console.error('Errore nel backup dei dati:', error);
      return { success: false, error: error.message, message: 'Errore nel backup dei dati' };
    }
  },
  
  /**
   * Ripristina i dati da un backup
   * @param {string} timestamp - Timestamp del backup da ripristinare
   * @returns {Promise<Object>} - Risultato del ripristino
   */
  async restoreBackup(timestamp) {
    try {
      const backups = JSON.parse(localStorage.getItem('magazzino_backups') || '[]');
      const backup = backups.find(b => b.timestamp === timestamp);
      
      if (!backup) {
        throw new Error(`Backup con timestamp ${timestamp} non trovato`);
      }
      
      // Salva tutti i dati nella cache locale
      this.saveToLocalCache(ENTITY_TYPES.INGREDIENTE, backup.data.ingredienti);
      this.saveToLocalCache(ENTITY_TYPES.FORNITORE, backup.data.fornitori);
      this.saveToLocalCache(ENTITY_TYPES.MOVIMENTO, backup.data.movimenti);
      this.saveToLocalCache(ENTITY_TYPES.ORDINE, backup.data.ordini);
      this.saveToLocalCache(ENTITY_TYPES.RICETTA, backup.data.ricette);
      
      return { success: true, message: 'Ripristino completato con successo' };
    } catch (error) {
      console.error('Errore nel ripristino dei dati:', error);
      return { success: false, error: error.message, message: 'Errore nel ripristino dei dati' };
    }
  },
  
  /**
   * Recupera la lista dei backup disponibili
   * @returns {Array} - Lista dei backup
   */
  getBackups() {
    const backups = JSON.parse(localStorage.getItem('magazzino_backups') || '[]');
    return backups.map(backup => ({
      timestamp: backup.timestamp,
      date: new Date(backup.timestamp).toLocaleString()
    }));
  },
  
  /**
   * Notifica i cambiamenti tramite WebSocket
   * @param {string} entityType - Tipo di entità
   * @param {string} operationType - Tipo di operazione
   * @param {Object} data - Dati dell'operazione
   * @param {string|number} id - ID dell'entità
   */
  notifyChangesViaWebSocket(entityType, operationType, data, id) {
    if (!WebSocketService || !WebSocketService.isConnected()) {
      return;
    }
    
    const event = {
      type: `${entityType}_${operationType}`,
      data: data,
      id: id,
      timestamp: new Date().toISOString()
    };
    
    WebSocketService.emit('magazzino_update', event);
  },
  
  /**
   * Salva i dati nella cache locale
   * @param {string} entityType - Tipo di entità
   * @param {Array} data - Dati da salvare
   */
  saveToLocalCache(entityType, data) {
    let storageKey;
    
    switch (entityType) {
      case ENTITY_TYPES.INGREDIENTE:
        storageKey = STORAGE_KEYS.OFFLINE_CACHE.INGREDIENTI;
        break;
      case ENTITY_TYPES.FORNITORE:
        storageKey = STORAGE_KEYS.OFFLINE_CACHE.FORNITORI;
        break;
      case ENTITY_TYPES.MOVIMENTO:
        storageKey = STORAGE_KEYS.OFFLINE_CACHE.MOVIMENTI;
        break;
      case ENTITY_TYPES.ORDINE:
        storageKey = STORAGE_KEYS.OFFLINE_CACHE.ORDINI;
        break;
      case ENTITY_TYPES.RICETTA:
        storageKey = STORAGE_KEYS.OFFLINE_CACHE.RICETTE;
        break;
      default:
        throw new Error(`Tipo di entità sconosciuto: ${entityType}`);
    }
    
    localStorage.setItem(storageKey, JSON.stringify(data));
  },
  
  /**
   * Recupera i dati dalla cache locale
   * @param {string} entityType - Tipo di entità
   * @returns {Array} - Dati recuperati
   */
  getFromLocalCache(entityType) {
    let storageKey;
    
    switch (entityType) {
      case ENTITY_TYPES.INGREDIENTE:
        storageKey = STORAGE_KEYS.OFFLINE_CACHE.INGREDIENTI;
        break;
      case ENTITY_TYPES.FORNITORE:
        storageKey = STORAGE_KEYS.OFFLINE_CACHE.FORNITORI;
        break;
      case ENTITY_TYPES.MOVIMENTO:
        storageKey = STORAGE_KEYS.OFFLINE_CACHE.MOVIMENTI;
        break;
      case ENTITY_TYPES.ORDINE:
        storageKey = STORAGE_KEYS.OFFLINE_CACHE.ORDINI;
        break;
      case ENTITY_TYPES.RICETTA:
        storageKey = STORAGE_KEYS.OFFLINE_CACHE.RICETTE;
        break;
      default:
        throw new Error(`Tipo di entità sconosciuto: ${entityType}`);
    }
    
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  },
  
  /**
   * Aggiorna la cache locale in base all'operazione
   * @param {string} entityType - Tipo di entità
   * @param {string} operationType - Tipo di operazione
   * @param {Object} data - Dati dell'operazione
   * @param {string|number} id - ID dell'entità
   */
  updateLocalCache(entityType, operationType, data, id) {
    const cachedData = this.getFromLocalCache(entityType);
    
    let updatedData;
    
    switch (operationType) {
      case OPERATION_TYPES.CREATE:
        updatedData = [...cachedData, data];
        break;
        
      case OPERATION_TYPES.UPDATE:
        updatedData = cachedData.map(item => 
          item.id === data.id ? data : item
        );
        break;
        
      case OPERATION_TYPES.DELETE:
        updatedData = cachedData.filter(item => item.id !== id);
        break;
        
      default:
        throw new Error(`Tipo di operazione sconosciuto: ${operationType}`);
    }
    
    this.saveToLocalCache(entityType, updatedData);
  },
  
  /**
   * Aggiunge un'operazione in sospeso
   * @param {Object} operation - Operazione da aggiungere
   */
  addPendingOperation(operation) {
    const pendingOperations = this.getPendingOperations();
    pendingOperations.push(operation);
    localStorage.setItem(STORAGE_KEYS.PENDING_CHANGES, JSON.stringify(pendingOperations));
  },
  
  /**
   * Recupera le operazioni in sospeso
   * @returns {Array} - Operazioni in sospeso
   */
  getPendingOperations() {
    const pendingOperations = localStorage.getItem(STORAGE_KEYS.PENDING_CHANGES);
    return pendingOperations ? JSON.parse(pendingOperations) : [];
  },
  
  /**
   * Rimuove un'operazione in sospeso
   * @param {string} operationId - ID dell'operazione da rimuovere
   */
  removePendingOperation(operationId) {
    const pendingOperations = this.getPendingOperations();
    const updatedOperations = pendingOperations.filter(op => op.id !== operationId);
    localStorage.setItem(STORAGE_KEYS.PENDING_CHANGES, JSON.stringify(updatedOperations));
  },
  
  /**
   * Aggiorna un'operazione in sospeso
   * @param {string} operationId - ID dell'operazione da aggiornare
   * @param {Object} updates - Aggiornamenti da applicare
   */
  updatePendingOperation(operationId, updates) {
    const pendingOperations = this.getPendingOperations();
    const updatedOperations = pendingOperations.map(op => {
      if (op.id === operationId) {
        return { ...op, ...updates };
      }
      return op;
    });
    localStorage.setItem(STORAGE_KEYS.PENDING_CHANGES, JSON.stringify(updatedOperations));
  },
  
  /**
   * Verifica se ci sono operazioni in sospeso
   * @returns {boolean} - true se ci sono operazioni in sospeso
   */
  hasPendingOperations() {
    return this.getPendingOperations().length > 0;
  },
  
  /**
   * Recupera il timestamp dell'ultima sincronizzazione
   * @returns {string|null} - Timestamp dell'ultima sincronizzazione
   */
  getLastSyncTimestamp() {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  },
  
  /**
   * Controlla se il dispositivo è online
   * @returns {boolean} - true se il dispositivo è online
   */
  isOnline() {
    return navigator.onLine;
  },
  
  // Costanti esportate per l'utilizzo esterno
  ENTITY_TYPES,
  OPERATION_TYPES
};

export default MagazzinoSyncService;