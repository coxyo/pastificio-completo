// services/api.js
import config from '../config/config.js';

const API_URL = config.API_URL + '/api';
const USE_MOCK = false; // Disabilita mock per produzione

// Mock data per test
const mockOrdini = [];
const mockTemplates = [];

// Funzione helper per gestire le risposte
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
    throw new Error(error.message || `Errore HTTP: ${response.status}`);
  }
  return response.json();
};

// Funzione helper per ottenere gli headers
const getHeaders = (includeContentType = true) => {
  const token = localStorage.getItem('token');
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

// MOVIMENTI MAGAZZINO
export const salvaMovimentoBackend = async (data) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true, data: { ...data, _id: Date.now().toString() } };
  }

  try {
    const response = await fetch(`${API_URL}/magazzino/movimenti`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore salvaMovimentoBackend:', error);
    throw error;
  }
};

export const caricaMovimenti = async (filtri = {}) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  }

  try {
    const queryParams = new URLSearchParams(filtri).toString();
    const url = `${API_URL}/magazzino/movimenti${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url, {
      headers: getHeaders()
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore caricaMovimenti:', error);
    return [];
  }
};

// ORDINI
export const salvaOrdine = async (ordine) => {
  try {
    const response = await fetch(`${API_URL}/ordini`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(ordine)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore salvaOrdine:', error);
    throw error;
  }
};

export const caricaOrdini = async (filtri = {}) => {
  try {
    const queryParams = new URLSearchParams(filtri).toString();
    const url = `${API_URL}/ordini${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url, {
      headers: getHeaders()
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore caricaOrdini:', error);
    return [];
  }
};

export const aggiornaOrdine = async (id, data) => {
  try {
    const response = await fetch(`${API_URL}/ordini/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore aggiornaOrdine:', error);
    throw error;
  }
};

export const eliminaOrdine = async (id) => {
  try {
    const response = await fetch(`${API_URL}/ordini/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore eliminaOrdine:', error);
    throw error;
  }
};

// Export oggetto api per compatibilitÃ 
export const api = {
  caricaOrdini,
  salvaOrdine,
  aggiornaOrdine,
  eliminaOrdine,
  caricaMovimenti,
  salvaMovimentoBackend
};

export default api;

