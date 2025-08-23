// services/fattureService.js
import axios from 'axios';
import { handleError } from '../utils/errorHandler';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Ottieni tutte le fatture con filtri e paginazione
export const getFatture = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/fatture`, { 
      params,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Errore nel recupero fatture');
  }
};

// Ottieni una singola fattura per ID
export const getFattura = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/fatture/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Errore nel recupero fattura');
  }
};

// Crea una nuova fattura
export const creaFattura = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/fatture`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Errore nella creazione fattura');
  }
};

// Aggiorna una fattura esistente
export const aggiornaFattura = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/fatture/${id}`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Errore nell\'aggiornamento fattura');
  }
};

// Elimina una fattura
export const eliminaFattura = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/fatture/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Errore nell\'eliminazione fattura');
  }
};

// Registra un pagamento
export const registraPagamento = async (id, data) => {
  try {
    const response = await axios.post(`${API_URL}/fatture/${id}/pagamenti`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Errore nella registrazione pagamento');
  }
};

// Genera il PDF della fattura
export const generaPDF = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/fatture/${id}/pdf`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      responseType: 'blob'
    });
    
    // Crea un URL per il blob e apri in nuova finestra o scarica
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    return { success: true };
  } catch (error) {
    return handleError(error, 'Errore nella generazione PDF');
  }
};

// Invia la fattura via email
export const inviaFatturaEmail = async (id, data) => {
  try {
    const response = await axios.post(`${API_URL}/fatture/${id}/email`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Errore nell\'invio email');
  }
};

// Ottieni statistiche fatturazione
export const getStatisticheFatturazione = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/fatture/statistiche`, {
      params,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
   return handleError(error, 'Errore nel recupero statistiche');
  }
};

export default {
  getFatture,
  getFattura,
  creaFattura,
  aggiornaFattura,
  eliminaFattura,
  registraPagamento,
  generaPDF,
  inviaFatturaEmail,
  getStatisticheFatturazione
};