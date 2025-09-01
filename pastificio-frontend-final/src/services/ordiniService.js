// src/services/ordiniService.js
import axios from 'axios';
import { toast } from 'react-toastify';
import config from '../config/config.js';

const API_URL = config.API_URL + '/api';

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
  async getOrdini(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.stato && params.stato !== 'tutti') queryParams.append('stato', params.stato);
      if (params.data) queryParams.append('dataRitiro', params.data);
      
      const response = await api.get(`/ordini?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Errore recupero ordini:', error);
      throw error;
    }
  },

  async getOrdiniOggi() {
    try {
      const response = await api.get('/ordini/oggi');
      return response.data;
    } catch (error) {
      console.error('Errore recupero ordini oggi:', error);
      throw error;
    }
  },

  async getOrdine(id) {
    try {
      const response = await api.get(`/ordini/${id}`);
      return response.data;
    } catch (error) {
      console.error('Errore recupero ordine:', error);
      throw error;
    }
  },

  async creaOrdine(datiOrdine) {
    try {
      if (!datiOrdine.nomeCliente) throw new Error('Nome cliente obbligatorio');
      if (!datiOrdine.telefono) throw new Error('Telefono obbligatorio');
      if (!datiOrdine.prodotti?.length) throw new Error('Almeno un prodotto richiesto');
      
      const totale = datiOrdine.prodotti.reduce((sum, prod) => {
        const prezzo = prod.unitaMisura === 'â‚¬' ? prod.quantita : prod.quantita * prod.prezzo;
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

  async eliminaOrdine(id) {
    try {
      const response = await api.delete(`/ordini/${id}`);
      return response.data;
    } catch (error) {
      console.error('Errore eliminazione ordine:', error);
      throw error;
    }
  },

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

  async inviaPromemoria(id) {
    try {
      const response = await api.post(`/ordini/invio-promemoria/${id}`);
      return response.data;
    } catch (error) {
      console.error('Errore invio WhatsApp:', error);
      throw error;
    }
  }
};

export default ordiniService;

