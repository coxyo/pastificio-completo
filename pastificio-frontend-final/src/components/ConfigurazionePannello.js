'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { LoggingService } from '../services/loggingService';
import { BackupService } from '../services/backupService';

const ConfigurazionePannello = () => {
  // Configurazione pastificio
  const [configurazionePastificio, setConfigurazionePastificio] = useState({
    nome: 'Pastificio',
    indirizzo: '',
    telefono: '',
    email: '',
    partitaIva: ''
  });
  
  // Configurazione orari
  const [orariApertura, setOrariApertura] = useState({
    lunedi: { aperto: true, apertura: '08:00', chiusura: '19:00' },
    martedi: { aperto: true, apertura: '08:00', chiusura: '19:00' },
    mercoledi: { aperto: true, apertura: '08:00', chiusura: '19:00' },
    giovedi: { aperto: true, apertura: '08:00', chiusura: '19:00' },
    venerdi: { aperto: true, apertura: '08:00', chiusura: '19:00' },
    sabato: { aperto: true, apertura: '08:00', chiusura: '14:00' },
    domenica: { aperto: false, apertura: '08:00', chiusura: '14:00' }
  });
  
  // Configurazione backup
  const [configurazioneBackup, setConfigurazioneBackup] = useState({
    backupAutomatico: true,
    frequenza: 'giornaliero',
    oraBackup: '23:00',
    conservazione: 30 // giorni
  });
  
  // Configurazione notifiche
  const [configurazioneNotifiche, setConfigurazioneNotifiche] = useState({
    nuovoOrdine: true,
    modificaOrdine: true,
    eliminazioneOrdine: true,
    backupCompletato: true,
    erroreSincronizzazione: true
  });
  
  // Configurazione utenti
  const [utenti, setUtenti] = useState([]);
  const [nuovoUtente, setNuovoUtente] = useState({
    username: '',
    password: '',
    ruolo: 'operatore'
  });
  
  // Notifiche e stato
  const [notifica, setNotifica] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabAttiva, setTabAttiva] = useState('pastificio');
  
  // Inizializza configurazioni se non esistono
  const inizializzaConfigurazioni = useCallback(() => {
    try {
      // Verifica e inizializza configurazione pastificio
      if (!localStorage.getItem('configurazione_pastificio')) {
        const configPastificioDefault = {
          nome: 'Pastificio',
          indirizzo: '',
          telefono: '',
          email: '',
          partitaIva: ''
        };
        localStorage.setItem('configurazione_pastificio', JSON.stringify(configPastificioDefault));
        LoggingService.info('Configurazione pastificio inizializzata');
      }
      
      // Verifica e inizializza configurazione orari
      if (!localStorage.getItem('configurazione_orari')) {
        const configOrariDefault = {
          lunedi: { aperto: true, apertura: '08:00', chiusura: '19:00' },
          martedi: { aperto: true, apertura: '08:00', chiusura: '19:00' },
          mercoledi: { aperto: true, apertura: '08:00', chiusura: '19:00' },
          giovedi: { aperto: true, apertura: '08:00', chiusura: '19:00' },
          venerdi: { aperto: true, apertura: '08:00', chiusura: '19:00' },
          sabato: { aperto: true, apertura: '08:00', chiusura: '14:00' },
          domenica: { aperto: false, apertura: '08:00', chiusura: '14:00' }
        };
        localStorage.setItem('configurazione_orari', JSON.stringify(configOrariDefault));
        LoggingService.info('Configurazione orari inizializzata');
      }
      
      // Verifica e inizializza configurazione backup
      if (!localStorage.getItem('configurazione_backup')) {
        const configBackupDefault = {
          backupAutomatico: true,
          frequenza: 'giornaliero',
          oraBackup: '23:00',
          conservazione: 30
        };
        localStorage.setItem('configurazione_backup', JSON.stringify(configBackupDefault));
        LoggingService.info('Configurazione backup inizializzata');
      }
      
      // Verifica e inizializza configurazione notifiche
      if (!localStorage.getItem('configurazione_notifiche')) {
        const configNotificheDefault = {
          nuovoOrdine: true,
          modificaOrdine: true,
          eliminazioneOrdine: true,
          backupCompletato: true,
          erroreSincronizzazione: true
        };
        localStorage.setItem('configurazione_notifiche', JSON.stringify(configNotificheDefault));
        LoggingService.info('Configurazione notifiche inizializzata');
      }
    } catch (error) {
      LoggingService.error('Errore inizializzazione configurazioni', error);
    }
  }, []);
  
  // Carica le configurazioni esistenti
  const caricaConfigurazioni = useCallback(async () => {
    try {
      LoggingService.info('Caricamento configurazioni');
      
      // Inizializza configurazioni se non esistono
      inizializzaConfigurazioni();
      
      // Carica configurazione pastificio
      try {
        const configPastificio = localStorage.getItem('configurazione_pastificio');
        if (configPastificio) {
          setConfigurazionePastificio(JSON.parse(configPastificio));
        }
      } catch (error) {
        LoggingService.error('Errore parsing configurazione pastificio', error);
        mostraNotifica('Errore nel formato della configurazione pastificio', 'error');
      }
      
      // Carica configurazione orari
      try {
        const configOrari = localStorage.getItem('configurazione_orari');
        if (configOrari) {
          setOrariApertura(JSON.parse(configOrari));
        }
      } catch (error) {
        LoggingService.error('Errore parsing configurazione orari', error);
        mostraNotifica('Errore nel formato della configurazione orari', 'error');
      }
      
      // Carica configurazione backup
      try {
        const configBackup = localStorage.getItem('configurazione_backup');
        if (configBackup) {
          setConfigurazioneBackup(JSON.parse(configBackup));
        }
      } catch (error) {
        LoggingService.error('Errore parsing configurazione backup', error);
        mostraNotifica('Errore nel formato della configurazione backup', 'error');
      }
      
      // Carica configurazione notifiche
      try {
        const configNotifiche = localStorage.getItem('configurazione_notifiche');
        if (configNotifiche) {
          setConfigurazioneNotifiche(JSON.parse(configNotifiche));
        }
      } catch (error) {
        LoggingService.error('Errore parsing configurazione notifiche', error);
        mostraNotifica('Errore nel formato della configurazione notifiche', 'error');
      }
      
      // Carica utenti dal server
      if (navigator.onLine) {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const response = await fetch('http://localhost:5000/api/auth/users', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              setUtenti(data.users || []);
            } else {
              throw new Error('Errore caricamento utenti');
            }
          }
        } catch (error) {
          LoggingService.error('Errore caricamento utenti', error);
          // Non mostrare notifica per questo errore, è meno critico
        }
      }
      
      LoggingService.info('Configurazioni caricate con successo');
    } catch (error) {
      LoggingService.error('Errore caricamento configurazioni', error);
      mostraNotifica('Errore durante il caricamento delle configurazioni', 'error');
    } finally {
      setLoading(false);
    }
  }, [inizializzaConfigurazioni]);
  
  // Carica le configurazioni all'avvio
  useEffect(() => {
    caricaConfigurazioni();
  }, [caricaConfigurazioni]);
  
  // Mostra notifica
  const mostraNotifica = (messaggio, tipo = 'info') => {
    setNotifica({ messaggio, tipo });
    
    // Auto-chiusura dopo 5 secondi
    setTimeout(() => {
      setNotifica(null);
    }, 5000);
  };
  
  // Salva impostazioni pastificio
  const salvaPastificio = () => {
    try {
      localStorage.setItem('configurazione_pastificio', JSON.stringify(configurazionePastificio));
      LoggingService.info('Configurazione pastificio salvata');
      mostraNotifica('Configurazione pastificio salvata', 'success');
    } catch (error) {
      LoggingService.error('Errore salvataggio configurazione pastificio', error);
      mostraNotifica('Errore durante il salvataggio della configurazione', 'error');
    }
  };
  
  // Salva impostazioni orari
  const salvaOrari = () => {
    try {
      localStorage.setItem('configurazione_orari', JSON.stringify(orariApertura));
      LoggingService.info('Configurazione orari salvata');
      mostraNotifica('Configurazione orari salvata', 'success');
    } catch (error) {
      LoggingService.error('Errore salvataggio configurazione orari', error);
      mostraNotifica('Errore durante il salvataggio degli orari', 'error');
    }
  };
  
  // Salva impostazioni backup
  const salvaBackup = () => {
    try {
      localStorage.setItem('configurazione_backup', JSON.stringify(configurazioneBackup));
      LoggingService.info('Configurazione backup salvata');
      
      // Configura il servizio di backup con le nuove impostazioni
      try {
        BackupService.configura(configurazioneBackup);
      } catch (error) {
        LoggingService.error('Errore configurazione servizio backup', error);
        // Non interrompiamo il flusso principale per questo errore
      }
      
      mostraNotifica('Configurazione backup salvata', 'success');
    } catch (error) {
      LoggingService.error('Errore salvataggio configurazione backup', error);
      mostraNotifica('Errore durante il salvataggio della configurazione backup', 'error');
    }
  };
  
  // Salva impostazioni notifiche
  const salvaNotifiche = () => {
    try {
      localStorage.setItem('configurazione_notifiche', JSON.stringify(configurazioneNotifiche));
      LoggingService.info('Configurazione notifiche salvata');
      mostraNotifica('Configurazione notifiche salvata', 'success');
    } catch (error) {
      LoggingService.error('Errore salvataggio configurazione notifiche', error);
      mostraNotifica('Errore durante il salvataggio delle notifiche', 'error');
    }
  };
  
  // Aggiunta nuovo utente
  const aggiungiUtente = async () => {
    if (!nuovoUtente.username || !nuovoUtente.password) {
      mostraNotifica('Username e password sono obbligatori', 'warning');
      return;
    }
    
    try {
      if (navigator.onLine) {
        const token = localStorage.getItem('token');
        if (!token) {
          mostraNotifica('Sessione scaduta, effettua nuovamente il login', 'error');
          return;
        }
        
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(nuovoUtente)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Errore creazione utente');
        }
        
        const data = await response.json();
        setUtenti([...utenti, data.user]);
        setNuovoUtente({
          username: '',
          password: '',
          ruolo: 'operatore'
        });
        
        LoggingService.info('Nuovo utente creato', { username: nuovoUtente.username });
        mostraNotifica('Nuovo utente creato con successo', 'success');
      } else {
        mostraNotifica('Impossibile creare utenti in modalità offline', 'warning');
      }
    } catch (error) {
      LoggingService.error('Errore creazione utente', error);
      mostraNotifica('Errore durante la creazione dell\'utente: ' + (error.message || 'Errore sconosciuto'), 'error');
    }
  };
  
  // Elimina utente
  const eliminaUtente = async (id) => {
    try {
      if (navigator.onLine) {
        const token = localStorage.getItem('token');
        if (!token) {
          mostraNotifica('Sessione scaduta, effettua nuovamente il login', 'error');
          return;
        }
        
        const response = await fetch(`http://localhost:5000/api/auth/users/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Errore eliminazione utente');
        }
        
        setUtenti(utenti.filter(user => user._id !== id));
        LoggingService.info('Utente eliminato', { id });
        mostraNotifica('Utente eliminato con successo', 'success');
      } else {
        mostraNotifica('Impossibile eliminare utenti in modalità offline', 'warning');
      }
    } catch (error) {
      LoggingService.error('Errore eliminazione utente', error);
      mostraNotifica('Errore durante l\'eliminazione dell\'utente: ' + (error.message || 'Errore sconosciuto'), 'error');
    }
  };
  
  // Esegui backup manuale
  const eseguiBackupManuale = async () => {
    try {
      setLoading(true);
      
      if (!BackupService || typeof BackupService.eseguiBackup !== 'function') {
        throw new Error('Servizio di backup non disponibile');
      }
      
      const risultato = await BackupService.eseguiBackup();
      LoggingService.info('Backup manuale eseguito', risultato);
      mostraNotifica('Backup eseguito con successo', 'success');
    } catch (error) {
      LoggingService.error('Errore esecuzione backup manuale', error);
      mostraNotifica('Errore durante l\'esecuzione del backup: ' + (error.message || 'Errore sconosciuto'), 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Gestione delle modifiche agli orari
  const handleOrarioChange = (giorno, campo, valore) => {
    setOrariApertura({
      ...orariApertura,
      [giorno]: {
        ...orariApertura[giorno],
        [campo]: valore
      }
    });
  };

  // Render delle tabs
  const renderTab = () => {
    switch(tabAttiva) {
      case 'pastificio':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome azienda</label>
              <input 
                type="text" 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                placeholder="Pastificio"
                value={configurazionePastificio.nome}
                onChange={(e) => setConfigurazionePastificio({
                  ...configurazionePastificio,
                  nome: e.target.value
                })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Indirizzo</label>
              <input 
                type="text" 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                placeholder="Via Roma, 123"
                value={configurazionePastificio.indirizzo}
                onChange={(e) => setConfigurazionePastificio({
                  ...configurazionePastificio,
                  indirizzo: e.target.value
                })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Telefono</label>
              <input 
                type="text" 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                placeholder="+39 0123456789"
                value={configurazionePastificio.telefono}
                onChange={(e) => setConfigurazionePastificio({
                  ...configurazionePastificio,
                  telefono: e.target.value
                })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                placeholder="info@pastificio.it"
                value={configurazionePastificio.email}
                onChange={(e) => setConfigurazionePastificio({
                  ...configurazionePastificio,
                  email: e.target.value
                })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Partita IVA</label>
              <input 
                type="text" 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                placeholder="IT12345678910"
                value={configurazionePastificio.partitaIva}
                onChange={(e) => setConfigurazionePastificio({
                  ...configurazionePastificio,
                  partitaIva: e.target.value
                })}
              />
            </div>
            
            <div className="mt-6">
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={salvaPastificio}
              >
                Salva impostazioni
              </button>
            </div>
          </div>
        );
        
      case 'orari':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Orari di apertura</h3>
            
            {Object.keys(orariApertura).map(giorno => (
              <div key={giorno} className="flex items-center space-x-4 border-b pb-4">
                <div className="w-1/4">
                  <span className="capitalize">{giorno}</span>
                </div>
                <div className="w-1/4">
                  <label className="inline-flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2 h-4 w-4"
                      checked={orariApertura[giorno].aperto}
                      onChange={(e) => handleOrarioChange(giorno, 'aperto', e.target.checked)}
                    />
                    Aperto
                  </label>
                </div>
                <div className="w-1/4">
                  <input 
                    type="time" 
                    className="block w-full p-2 border border-gray-300 rounded-md"
                    value={orariApertura[giorno].apertura}
                    onChange={(e) => handleOrarioChange(giorno, 'apertura', e.target.value)}
                    disabled={!orariApertura[giorno].aperto}
                  />
                </div>
                <div className="w-1/4">
                  <input 
                    type="time" 
                    className="block w-full p-2 border border-gray-300 rounded-md"
                    value={orariApertura[giorno].chiusura}
                    onChange={(e) => handleOrarioChange(giorno, 'chiusura', e.target.value)}
                    disabled={!orariApertura[giorno].aperto}
                  />
                </div>
              </div>
            ))}
            
            <div className="mt-6">
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={salvaOrari}
              >
                Salva orari
              </button>
            </div>
          </div>
        );
        
      case 'backup':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Configurazione backup</h3>
            
            <div className="space-y-4">
              <div>
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2 h-4 w-4"
                    checked={configurazioneBackup.backupAutomatico}
                    onChange={(e) => setConfigurazioneBackup({
                      ...configurazioneBackup,
                      backupAutomatico: e.target.checked
                    })}
                  />
                  Backup automatico
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Frequenza</label>
                <select 
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  value={configurazioneBackup.frequenza}
                  onChange={(e) => setConfigurazioneBackup({
                    ...configurazioneBackup,
                    frequenza: e.target.value
                  })}
                  disabled={!configurazioneBackup.backupAutomatico}
                >
                  <option value="giornaliero">Giornaliero</option>
                  <option value="settimanale">Settimanale</option>
                  <option value="mensile">Mensile</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Ora backup</label>
                <input 
                  type="time" 
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  value={configurazioneBackup.oraBackup}
                  onChange={(e) => setConfigurazioneBackup({
                    ...configurazioneBackup,
                    oraBackup: e.target.value
                  })}
                  disabled={!configurazioneBackup.backupAutomatico}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Giorni di conservazione</label>
                <input 
                  type="number" 
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  value={configurazioneBackup.conservazione}
                  onChange={(e) => setConfigurazioneBackup({
                    ...configurazioneBackup,
                    conservazione: parseInt(e.target.value)
                  })}
                  min="1"
                  max="365"
                />
              </div>
              
              <div className="flex space-x-4 mt-6">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={salvaBackup}
                >
                  Salva configurazione
                </button>
                
                <button 
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  onClick={eseguiBackupManuale}
                  disabled={loading}
                >
                  {loading ? 'Backup in corso...' : 'Esegui backup manuale'}
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'notifiche':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Configurazione notifiche</h3>
            
            <div className="space-y-4">
              <div>
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2 h-4 w-4"
                    checked={configurazioneNotifiche.nuovoOrdine}
                    onChange={(e) => setConfigurazioneNotifiche({
                      ...configurazioneNotifiche,
                      nuovoOrdine: e.target.checked
                    })}
                  />
                  Notifica nuovo ordine
                </label>
              </div>
              
              <div>
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2 h-4 w-4"
                    checked={configurazioneNotifiche.modificaOrdine}
                    onChange={(e) => setConfigurazioneNotifiche({
                      ...configurazioneNotifiche,
                      modificaOrdine: e.target.checked
                    })}
                  />
                  Notifica modifica ordine
                </label>
              </div>
              
              <div>
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2 h-4 w-4"
                    checked={configurazioneNotifiche.eliminazioneOrdine}
                    onChange={(e) => setConfigurazioneNotifiche({
                      ...configurazioneNotifiche,
                      eliminazioneOrdine: e.target.checked
                    })}
                  />
                  Notifica eliminazione ordine
                </label>
              </div>
              
              <div>
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2 h-4 w-4"
                    checked={configurazioneNotifiche.backupCompletato}
                    onChange={(e) => setConfigurazioneNotifiche({
                      ...configurazioneNotifiche,
                      backupCompletato: e.target.checked
                    })}
                  />
                  Notifica backup completato
                </label>
              </div>
              
              <div>
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2 h-4 w-4"
                    checked={configurazioneNotifiche.erroreSincronizzazione}
                    onChange={(e) => setConfigurazioneNotifiche({
                      ...configurazioneNotifiche,
                      erroreSincronizzazione: e.target.checked
                    })}
                  />
                  Notifica errore sincronizzazione
                </label>
              </div>
              
              <div className="mt-6">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={salvaNotifiche}
                >
                  Salva configurazione notifiche
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'utenti':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Gestione utenti</h3>
            
            <div className="bg-white rounded-md shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruolo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {utenti.length > 0 ? (
                    utenti.map(utente => (
                      <tr key={utente._id}>
                        <td className="px-6 py-4 whitespace-nowrap">{utente.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap capitalize">{utente.ruolo}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => eliminaUtente(utente._id)}
                          >
                            Elimina
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                       {navigator.onLine 
                          ? 'Nessun utente trovato o errore di caricamento'
                          : 'Connessione offline. Impossibile caricare gli utenti'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 bg-gray-50 p-4 rounded-md">
              <h4 className="text-md font-medium mb-4">Aggiungi nuovo utente</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    value={nuovoUtente.username}
                    onChange={(e) => setNuovoUtente({
                      ...nuovoUtente,
                      username: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input 
                    type="password" 
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    value={nuovoUtente.password}
                    onChange={(e) => setNuovoUtente({
                      ...nuovoUtente,
                      password: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ruolo</label>
                  <select 
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    value={nuovoUtente.ruolo}
                    onChange={(e) => setNuovoUtente({
                      ...nuovoUtente,
                      ruolo: e.target.value
                    })}
                  >
                    <option value="operatore">Operatore</option>
                    <option value="admin">Amministratore</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={aggiungiUtente}
                  disabled={!navigator.onLine}
                >
                  Aggiungi utente
                </button>
                {!navigator.onLine && (
                  <p className="mt-2 text-sm text-yellow-600">
                    La creazione di utenti è disponibile solo quando sei online
                  </p>
                )}
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Impostazioni</h1>
      
      {/* Notifica */}
      {notifica && (
        <div className={`mb-4 p-4 rounded ${
          notifica.tipo === 'success' ? 'bg-green-100 text-green-800' :
          notifica.tipo === 'error' ? 'bg-red-100 text-red-800' :
          notifica.tipo === 'warning' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {notifica.messaggio}
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              tabAttiva === 'pastificio'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setTabAttiva('pastificio')}
          >
            Informazioni Pastificio
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              tabAttiva === 'orari'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setTabAttiva('orari')}
          >
            Orari di Apertura
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              tabAttiva === 'backup'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setTabAttiva('backup')}
          >
            Backup
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              tabAttiva === 'notifiche'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setTabAttiva('notifiche')}
          >
            Notifiche
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              tabAttiva === 'utenti'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setTabAttiva('utenti')}
          >
            Utenti
          </button>
        </nav>
      </div>
      
      {/* Contenuto principale */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {tabAttiva === 'pastificio' ? 'Configurazione Pastificio' : 
             tabAttiva === 'orari' ? 'Configurazione Orari' :
             tabAttiva === 'backup' ? 'Configurazione Backup' :
             tabAttiva === 'notifiche' ? 'Configurazione Notifiche' :
             'Gestione Utenti'}
          </h2>
          <p className="text-gray-600 mb-4">
            {tabAttiva === 'pastificio' ? 'Configura le informazioni principali del pastificio che verranno mostrate nei documenti e nelle stampe.' : 
             tabAttiva === 'orari' ? 'Gestisci gli orari di apertura del tuo pastificio.' :
             tabAttiva === 'backup' ? 'Configura il sistema di backup automatico e gestisci i backup manuali.' :
             tabAttiva === 'notifiche' ? 'Personalizza le notifiche del sistema.' :
             'Gestisci gli utenti che possono accedere al sistema e i loro permessi.'}
          </p>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            renderTab()
          )}
        </div>
      </Card>
    </div>
  );
};

export default ConfigurazionePannello;