// src/services/ordiniService.js
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Configurazione axios con interceptor per token
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor per aggiungere token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor per gestire errori globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const ordiniService = {
  // GET - Lista ordini con filtri
  async getOrdini(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Gestione parametri
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.stato && params.stato !== 'tutti') queryParams.append('stato', params.stato);
      if (params.data) queryParams.append('dataRitiro', params.data);
      
      // Gestione periodo
      if (params.periodo) {
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);
        
        switch (params.periodo) {
          case 'oggi':
            queryParams.append('dataRitiro', oggi.toISOString().split('T')[0]);
            break;
          case 'domani':
            const domani = new Date(oggi);
            domani.setDate(domani.getDate() + 1);
            queryParams.append('dataRitiro', domani.toISOString().split('T')[0]);
            break;
          case 'settimana':
            const fineSettimana = new Date(oggi);
            fineSettimana.setDate(fineSettimana.getDate() + 7);
            queryParams.append('startDate', oggi.toISOString());
            queryParams.append('endDate', fineSettimana.toISOString());
            break;
          case 'mese':
            const fineMese = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0);
            queryParams.append('startDate', oggi.toISOString());
            queryParams.append('endDate', fineMese.toISOString());
            break;
        }
      }
      
      const response = await api.get(`/ordini?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Errore recupero ordini:', error);
      throw error;
    }
  },

  // GET - Ordini di oggi
  async getOrdiniOggi() {
    try {
      const response = await api.get('/ordini/oggi');
      return response.data;
    } catch (error) {
      console.error('Errore recupero ordini oggi:', error);
      throw error;
    }
  },

  // GET - Singolo ordine
  async getOrdine(id) {
    try {
      const response = await api.get(`/ordini/${id}`);
      return response.data;
    } catch (error) {
      console.error('Errore recupero ordine:', error);
      throw error;
    }
  },

  // POST - Crea nuovo ordine
  async creaOrdine(datiOrdine) {
    try {
      // Validazione base
      if (!datiOrdine.nomeCliente) throw new Error('Nome cliente obbligatorio');
      if (!datiOrdine.telefono) throw new Error('Telefono obbligatorio');
      if (!datiOrdine.prodotti?.length) throw new Error('Almeno un prodotto richiesto');
      
      // Calcola totale
      const totale = datiOrdine.prodotti.reduce((sum, prod) => {
        const prezzo = prod.unitaMisura === '€' ? prod.quantita : prod.quantita * prod.prezzo;
        return sum + prezzo;
      }, 0);
      
      const ordineCompleto = {
        ...datiOrdine,
        totale: datiOrdine.deveViaggiare ? totale * 1.1 : totale,
        stato: 'nuovo'
      };
      
      const response = await api.post('/ordini', ordineCompleto);
      toast.success('Ordine creato con successo!');
      return response.data;
    } catch (error) {
      const messaggio = error.response?.data?.error || error.message || 'Errore creazione ordine';
      toast.error(messaggio);
      throw error;
    }
  },

  // PUT - Aggiorna ordine
  async aggiornaOrdine(id, datiAggiornati) {
    try {
      const response = await api.put(`/ordini/${id}`, datiAggiornati);
      toast.success('Ordine aggiornato con successo!');
      return response.data;
    } catch (error) {
      const messaggio = error.response?.data?.error || 'Errore aggiornamento ordine';
      toast.error(messaggio);
      throw error;
    }
  },

  // DELETE - Elimina ordine
  async eliminaOrdine(id) {
    try {
      const response = await api.delete(`/ordini/${id}`);
      return response.data;
    } catch (error) {
      console.error('Errore eliminazione ordine:', error);
      throw error;
    }
  },

  // POST - Cambia stato ordine
  async cambiaStato(id, nuovoStato, note = '') {
    try {
      const response = await api.put(`/ordini/${id}`, { 
        stato: nuovoStato,
        note 
      });
      toast.success(`Stato aggiornato a ${nuovoStato}`);
      return response.data;
    } catch (error) {
      const messaggio = error.response?.data?.error || 'Errore cambio stato';
      toast.error(messaggio);
      throw error;
    }
  },

  // POST - Invia promemoria WhatsApp
  async inviaPromemoria(id) {
    try {
      const response = await api.post(`/ordini/invio-promemoria/${id}`);
      return response.data;
    } catch (error) {
      console.error('Errore invio WhatsApp:', error);
      throw error;
    }
  },

  // GET - Statistiche
  async getStatistiche(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.dataInizio) queryParams.append('dataInizio', params.dataInizio);
      if (params.dataFine) queryParams.append('dataFine', params.dataFine);
      
      const response = await api.get(`/ordini/statistiche/giornaliere?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Errore recupero statistiche:', error);
      throw error;
    }
  },

  // Utility - Stampa ordine
  async stampaOrdine(id) {
    try {
      const response = await this.getOrdine(id);
      const ordine = response.data;
      
      // Crea HTML per stampa
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ordine #${ordine.numeroOrdine || id.slice(-6)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info { margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .totale { text-align: right; font-size: 1.2em; font-weight: bold; margin-top: 20px; }
            .footer { margin-top: 50px; text-align: center; font-size: 0.9em; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PASTIFICIO NONNA CLAUDIA</h1>
            <p>Via Roma 123 - Tel: 0782 123456</p>
          </div>
          
          <h2>Ordine #${ordine.numeroOrdine || id.slice(-6)}</h2>
          
          <div class="info">
            <div class="info-row">
              <span><strong>Cliente:</strong> ${ordine.nomeCliente}</span>
              <span><strong>Telefono:</strong> ${ordine.telefono}</span>
            </div>
            <div class="info-row">
              <span><strong>Data Ritiro:</strong> ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}</span>
              <span><strong>Ora:</strong> ${ordine.oraRitiro}</span>
            </div>
            ${ordine.deveViaggiare ? '<div class="info-row"><strong>⚠️ ORDINE DA VIAGGIO (+10%)</strong></div>' : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Prodotto</th>
                <th>Quantità</th>
                <th>Prezzo Unit.</th>
                <th>Totale</th>
              </tr>
            </thead>
            <tbody>
              ${ordine.prodotti.map(p => `
                <tr>
                  <td>${p.nome}</td>
                  <td>${p.quantita} ${p.unitaMisura}</td>
                  <td>€${p.prezzo.toFixed(2)}</td>
                  <td>€${(p.quantita * p.prezzo).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totale">
            TOTALE: €${ordine.totale.toFixed(2)}
          </div>
          
          ${ordine.note ? `<div class="info"><strong>Note:</strong> ${ordine.note}</div>` : ''}
          
          <div class="footer">
            <p>Grazie per aver scelto il nostro pastificio!</p>
            <button onclick="window.print()">Stampa</button>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      
      return true;
    } catch (error) {
      console.error('Errore stampa ordine:', error);
      throw error;
    }
  },

  // Utility - Export Excel
  async exportExcel(filtri = {}) {
    try {
      const response = await this.getOrdini({ ...filtri, limit: 1000 });
      const ordini = response.data;
      
      // Prepara dati per export
      const datiExport = ordini.map(o => ({
        'N° Ordine': o.numeroOrdine || o._id.slice(-6),
        'Cliente': o.nomeCliente,
        'Telefono': o.telefono,
        'Data Ritiro': new Date(o.dataRitiro).toLocaleDateString('it-IT'),
        'Ora': o.oraRitiro,
        'Prodotti': o.prodotti.map(p => `${p.nome} (${p.quantita})`).join(', '),
        'Totale': `€${o.totale.toFixed(2)}`,
        'Stato': o.stato,
        'Note': o.note || ''
      }));
      
      // Converti in CSV
      const csv = this.convertToCSV(datiExport);
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ordini_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success('Export completato!');
      return true;
    } catch (error) {
      console.error('Errore export:', error);
      toast.error('Errore durante l\'export');
      throw error;
    }
  },

  // Helper - Converti array in CSV
  convertToCSV(arr) {
    const headers = Object.keys(arr[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = arr.map(row => {
      return headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
  },

  // Cache management
  clearCache() {
    localStorage.removeItem('ordini_cache');
    localStorage.removeItem('ordini_cache_time');
  },

  // Offline support
  async syncOfflineOrdini() {
    const offlineOrdini = JSON.parse(localStorage.getItem('ordini_offline') || '[]');
    const risultati = [];
    
    for (const ordine of offlineOrdini) {
      try {
        const response = await this.creaOrdine(ordine);
        risultati.push({ success: true, ordine: response.data });
      } catch (error) {
        risultati.push({ success: false, ordine, error: error.message });
      }
    }
    
    // Pulisci ordini sincronizzati
    const nonSincronizzati = offlineOrdini.filter((_, i) => !risultati[i].success);
    localStorage.setItem('ordini_offline', JSON.stringify(nonSincronizzati));
    
    return risultati;
  }
};

export default ordiniService;