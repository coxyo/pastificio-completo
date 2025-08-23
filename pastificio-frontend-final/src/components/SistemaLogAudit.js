'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { LoggingService } from '../services/loggingService';

const SistemaLogAudit = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifica, setNotifica] = useState(null);
  
  // Filtri
  const [filtroData, setFiltroData] = useState({
    da: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    a: new Date().toISOString().split('T')[0]
  });
  const [filtroLivello, setFiltroLivello] = useState('tutti');
  const [filtroCategoria, setFiltroCategoria] = useState('tutti');
  const [filtroUtente, setFiltroUtente] = useState('');
  const [filtroTesto, setFiltroTesto] = useState('');
  
  // Opzioni per i filtri
  const livelli = ['tutti', 'info', 'warning', 'error', 'debug'];
  const categorie = ['tutti', 'ordini', 'utenti', 'sistema', 'backup', 'sicurezza'];
  
  useEffect(() => {
    const caricaLog = async () => {
      try {
        setLoading(true);
        
        // Simula il caricamento dei log dal backend o localStorage
        // In un'applicazione reale, qui faresti una chiamata API
        const logsStorati = localStorage.getItem('system_logs');
        let logData = [];
        
        if (logsStorati) {
          logData = JSON.parse(logsStorati);
        } else {
          // Crea alcuni log di esempio
          logData = generaLogDiEsempio();
          localStorage.setItem('system_logs', JSON.stringify(logData));
        }
        
        // Aggiungi i log più recenti dal servizio di logging
        const logRecenti = LoggingService.getRecenti();
        logData = [...logRecenti, ...logData];
        
        // Salva i log aggiornati
        localStorage.setItem('system_logs', JSON.stringify(logData.slice(0, 1000))); // Limita a 1000 log
        
        setLogs(logData);
        applicaFiltri(logData);
        
      } catch (error) {
        console.error('Errore caricamento log', error);
        mostraNotifica('Errore durante il caricamento dei log', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    caricaLog();
  }, []);
  
  // Applica i filtri ai log
  const applicaFiltri = (logData = logs) => {
    try {
      let risultato = [...logData];
      
      // Filtro per data
      if (filtroData.da) {
        const dataInizio = new Date(filtroData.da);
        risultato = risultato.filter(log => new Date(log.timestamp) >= dataInizio);
      }
      
      if (filtroData.a) {
        const dataFine = new Date(filtroData.a);
        dataFine.setHours(23, 59, 59, 999); // Fine della giornata
        risultato = risultato.filter(log => new Date(log.timestamp) <= dataFine);
      }
      
      // Filtro per livello
      if (filtroLivello !== 'tutti') {
        risultato = risultato.filter(log => log.livello === filtroLivello);
      }
      
      // Filtro per categoria
      if (filtroCategoria !== 'tutti') {
        risultato = risultato.filter(log => log.categoria === filtroCategoria);
      }
      
      // Filtro per utente
      if (filtroUtente) {
        risultato = risultato.filter(log => 
          log.utente && log.utente.toLowerCase().includes(filtroUtente.toLowerCase())
        );
      }
      
      // Filtro per testo nel messaggio
      if (filtroTesto) {
        risultato = risultato.filter(log => 
          log.messaggio.toLowerCase().includes(filtroTesto.toLowerCase())
        );
      }
      
      setFilteredLogs(risultato);
    } catch (error) {
      console.error('Errore applicazione filtri', error);
      mostraNotifica('Errore durante l\'applicazione dei filtri', 'error');
    }
  };
  
  // Resetta i filtri
  const resetFiltri = () => {
    setFiltroData({
      da: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
      a: new Date().toISOString().split('T')[0]
    });
    setFiltroLivello('tutti');
    setFiltroCategoria('tutti');
    setFiltroUtente('');
    setFiltroTesto('');
    
    // Riapplica i filtri
    setTimeout(() => applicaFiltri(), 0);
  };
  
  // Esporta i log filtrati come CSV
  const esportaCSV = () => {
    try {
      const headers = ['Timestamp', 'Livello', 'Categoria', 'Utente', 'Messaggio', 'Dettagli'];
      
      // Converte ogni log in una riga CSV
      const righe = filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.livello,
        log.categoria,
        log.utente || '',
        log.messaggio,
        log.dettagli ? JSON.stringify(log.dettagli) : ''
      ]);
      
      // Unisce le righe con newline e le celle con virgole
      const csvContent = [
        headers.join(','),
        ...righe.map(r => r.join(','))
      ].join('\n');
      
      // Crea un blob e un link per il download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `log_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      mostraNotifica('Log esportati con successo', 'success');
    } catch (error) {
      console.error('Errore esportazione CSV', error);
      mostraNotifica('Errore durante l\'esportazione dei log', 'error');
    }
  };
  
  // Genera log di esempio per scopi di test
  const generaLogDiEsempio = () => {
    const logEsempio = [];
    const livelli = ['info', 'warning', 'error', 'debug'];
    const categorie = ['ordini', 'utenti', 'sistema', 'backup', 'sicurezza'];
    const utenti = ['admin', 'operatore1', 'operatore2', '', ''];
    const messaggi = [
      'Login effettuato',
      'Nuovo ordine creato',
      'Ordine modificato',
      'Ordine eliminato',
      'Backup completato',
      'Sincronizzazione fallita',
      'Configurazione aggiornata',
      'Utente creato',
      'Sessione scaduta',
      'Errore connessione al server'
    ];
    
    // Genera 100 log di esempio
    const oggi = new Date();
    
    for (let i = 0; i < 100; i++) {
      const data = new Date(oggi);
      data.setDate(data.getDate() - Math.floor(Math.random() * 30)); // Fino a 30 giorni fa
      data.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
      
      const livello = livelli[Math.floor(Math.random() * livelli.length)];
      const categoria = categorie[Math.floor(Math.random() * categorie.length)];
      const utente = utenti[Math.floor(Math.random() * utenti.length)];
      const messaggio = messaggi[Math.floor(Math.random() * messaggi.length)];
      
      logEsempio.push({
        timestamp: data.toISOString(),
        livello,
        categoria,
        utente,
        messaggio,
        dettagli: livello === 'error' ? { stack: 'Error: Esempio errore\n    at function (file.js:line:column)' } : null
      });
    }
    
    // Ordina per data decrescente
    return logEsempio.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };
  
  // Mostra notifica
  const mostraNotifica = (messaggio, tipo = 'info') => {
    setNotifica({ messaggio, tipo });
    
    // Auto-chiusura dopo 5 secondi
    setTimeout(() => {
      setNotifica(null);
    }, 5000);
  };
  
  // Formatta la data per la visualizzazione
  const formattaData = (isoString) => {
    try {
      return new Date(isoString).toLocaleString();
    } catch (error) {
      return isoString;
    }
  };
  
  // Determina il colore in base al livello del log
  const getColoreLog = (livello) => {
    switch (livello) {
      case 'error':
        return 'text-red-700 bg-red-100';
      case 'warning':
        return 'text-yellow-700 bg-yellow-100';
      case 'info':
        return 'text-blue-700 bg-blue-100';
      case 'debug':
        return 'text-gray-700 bg-gray-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Sistema di Log e Audit</h1>
      
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
      
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Filtri</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data da</label>
              <input 
                type="date" 
                className="block w-full p-2 border border-gray-300 rounded-md"
                value={filtroData.da}
                onChange={(e) => {
                  setFiltroData({...filtroData, da: e.target.value});
                  setTimeout(() => applicaFiltri(), 0);
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data a</label>
              <input 
                type="date" 
                className="block w-full p-2 border border-gray-300 rounded-md"
                value={filtroData.a}
                onChange={(e) => {
                  setFiltroData({...filtroData, a: e.target.value});
                  setTimeout(() => applicaFiltri(), 0);
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Livello</label>
              <select 
                className="block w-full p-2 border border-gray-300 rounded-md"
                value={filtroLivello}
                onChange={(e) => {
                  setFiltroLivello(e.target.value);
                  setTimeout(() => applicaFiltri(), 0);
                }}
              >
                {livelli.map(livello => (
                  <option key={livello} value={livello} className="capitalize">
                    {livello === 'tutti' ? 'Tutti i livelli' : livello}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select 
                className="block w-full p-2 border border-gray-300 rounded-md"
                value={filtroCategoria}
                onChange={(e) => {
                  setFiltroCategoria(e.target.value);
                  setTimeout(() => applicaFiltri(), 0);
                }}
              >
                {categorie.map(categoria => (
                  <option key={categoria} value={categoria} className="capitalize">
                    {categoria === 'tutti' ? 'Tutte le categorie' : categoria}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Utente</label>
              <input 
                type="text" 
                className="block w-full p-2 border border-gray-300 rounded-md"
                value={filtroUtente}
                onChange={(e) => {
                  setFiltroUtente(e.target.value);
                  setTimeout(() => applicaFiltri(), 0);
                }}
                placeholder="Cerca per utente..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ricerca testo</label>
              <input 
                type="text" 
                className="block w-full p-2 border border-gray-300 rounded-md"
                value={filtroTesto}
                onChange={(e) => {
                  setFiltroTesto(e.target.value);
                  setTimeout(() => applicaFiltri(), 0);
                }}
                placeholder="Cerca nel messaggio..."
              />
            </div>
          </div>
          
          <div className="flex justify-between mb-6">
            <button 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              onClick={resetFiltri}
            >
              Reset filtri
            </button>
            
            <button 
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={esportaCSV}
              disabled={filteredLogs.length === 0}
            >
              Esporta CSV
            </button>
          </div>
          
          <h2 className="text-xl font-bold mb-4">Log ({filteredLogs.length})</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="bg-gray-50 p-8 text-center text-gray-500 rounded-md">
              Nessun log trovato con i filtri selezionati
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Livello</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messaggio</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log, index) => (
                    <tr key={index} className={`${getColoreLog(log.livello)} hover:opacity-90`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formattaData(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium capitalize">
                        {log.livello}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                        {log.categoria}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.utente || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {log.messaggio}
                        {log.dettagli && (
                          <details className="mt-1">
                            <summary className="text-xs cursor-pointer hover:underline">Dettagli</summary>
                            <pre className="mt-1 text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded">{JSON.stringify(log.dettagli, null, 2)}</pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SistemaLogAudit;