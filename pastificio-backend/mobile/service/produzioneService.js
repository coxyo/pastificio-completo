// mobile/services/produzioneService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from '../config';

// Funzione per ottenere i piani di produzione
export const getPianiProduzione = async (date) => {
  try {
    // Verifica se c'è connessione a internet
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      // Se offline, cerca nel localStorage
      const cachedData = await AsyncStorage.getItem(`piani_produzione_${date}`);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      throw new Error('Nessun dato disponibile offline per questa data');
    }
    
    // Se online, fai la chiamata API
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('Sessione scaduta, effettua nuovamente il login');
    }
    
    const response = await axios.get(`${API_URL}/api/produzione/piani`, {
      params: { data: date },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Salva i dati nel localStorage per uso offline
    await AsyncStorage.setItem(`piani_produzione_${date}`, JSON.stringify(response.data.data));
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching production plans:', error);
    throw new Error(error.response?.data?.error || 'Impossibile recuperare i piani di produzione');
  }
};

// Funzione per avviare una produzione
export const startProduzione = async (pianoId, produzioneIndex) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('Sessione scaduta, effettua nuovamente il login');
    }
    
    const response = await axios.post(
      `${API_URL}/api/produzione/piani/${pianoId}/produzioni/${produzioneIndex}/start`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Error starting production:', error);
    
    // Gestisce l'errore specifico di ingredienti insufficienti
    if (error.response?.data?.ingredientiMancanti) {
      const mancanti = error.response.data.ingredientiMancanti
        .map(ing => `${ing.nome}: disponibile ${ing.disponibile}, necessario ${ing.necessario}`)
        .join('\n');
      
      throw new Error(`Ingredienti insufficienti:\n${mancanti}`);
    }
    
    throw new Error(error.response?.data?.error || 'Impossibile avviare la produzione');
  }
};

// Funzione per completare una produzione
export const completeProduzione = async (pianoId, produzioneIndex, data) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('Sessione scaduta, effettua nuovamente il login');
    }
    
    const response = await axios.post(
      `${API_URL}/api/produzione/piani/${pianoId}/produzioni/${produzioneIndex}/complete`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Error completing production:', error);
    throw new Error(error.response?.data?.error || 'Impossibile completare la produzione');
  }
};

// Funzione per ottenere tutte le ricette
export const getRicette = async () => {
  try {
    // Verifica se c'è connessione a internet
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      // Se offline, cerca nel localStorage
      const cachedData = await AsyncStorage.getItem('ricette');
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      throw new Error('Nessuna ricetta disponibile offline');
    }
    
    // Se online, fai la chiamata API
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('Sessione scaduta, effettua nuovamente il login');
    }
    
    const response = await axios.get(`${API_URL}/api/produzione/ricette`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Salva i dati nel localStorage per uso offline
    await AsyncStorage.setItem('ricette', JSON.stringify(response.data.data));
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw new Error(error.response?.data?.error || 'Impossibile recuperare le ricette');
  }
};

// Ottieni ricetta per ID
export const getRicettaById = async (recipeId) => {
  try {
    // Verifica se c'è connessione a internet
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      // Se offline, cerca nel localStorage
      const cachedData = await AsyncStorage.getItem('ricette');
      if (cachedData) {
        const ricette = JSON.parse(cachedData);
        const ricetta = ricette.find(r => r._id === recipeId);
        
        if (ricetta) {
          return ricetta;
        }
      }
      throw new Error('Nessun dato disponibile offline per questa ricetta');
    }
    
    // Se online, fai la chiamata API
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('Sessione scaduta, effettua nuovamente il login');
    }
    
    const response = await axios.get(`${API_URL}/api/produzione/ricette/${recipeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching recipe:', error);
    throw new Error(error.response?.data?.error || 'Impossibile recuperare la ricetta');
  }
};

// Calcola costo ricetta
export const calcolaCostoRicetta = async (recipeId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('Sessione scaduta, effettua nuovamente il login');
    }
    
    const response = await axios.get(`${API_URL}/api/produzione/ricette/${recipeId}/calcolacosto`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error calculating recipe cost:', error);
    throw new Error(error.response?.data?.error || 'Impossibile calcolare il costo della ricetta');
  }
};

// Crea nuova ricetta
export const createRicetta = async (ricettaData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('Sessione scaduta, effettua nuovamente il login');
    }
    
    const response = await axios.post(
      `${API_URL}/api/produzione/ricette`,
      ricettaData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Aggiorna la cache delle ricette
    const cachedData = await AsyncStorage.getItem('ricette');
    if (cachedData) {
      const ricette = JSON.parse(cachedData);
      ricette.push(response.data.data);
      await AsyncStorage.setItem('ricette', JSON.stringify(ricette));
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error creating recipe:', error);
    throw new Error(error.response?.data?.error || 'Impossibile creare la ricetta');
  }
};

// Aggiorna ricetta esistente
export const updateRicetta = async (recipeId, ricettaData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('Sessione scaduta, effettua nuovamente il login');
    }
    
    const response = await axios.put(
      `${API_URL}/api/produzione/ricette/${recipeId}`,
      ricettaData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Aggiorna la cache delle ricette
    const cachedData = await AsyncStorage.getItem('ricette');
    if (cachedData) {
      let ricette = JSON.parse(cachedData);
      ricette = ricette.map(r => r._id === recipeId ? response.data.data : r);
      await AsyncStorage.setItem('ricette', JSON.stringify(ricette));
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw new Error(error.response?.data?.error || 'Impossibile aggiornare la ricetta');
  }
};

// Ottieni tutti gli ingredienti
export const getIngredienti = async () => {
  try {
    // Verifica se c'è connessione a internet
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      // Se offline, cerca nel localStorage
      const cachedData = await AsyncStorage.getItem('ingredienti');
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      throw new Error('Nessun ingrediente disponibile offline');
    }
    
    // Se online, fai la chiamata API
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('Sessione scaduta, effettua nuovamente il login');
    }
    
    const response = await axios.get(`${API_URL}/api/magazzino/ingredienti`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Salva i dati nel localStorage per uso offline
    await AsyncStorage.setItem('ingredienti', JSON.stringify(response.data.data));
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    throw new Error(error.response?.data?.error || 'Impossibile recuperare gli ingredienti');
  }
};

// Crea un piano di produzione
export const createPianoProduzione = async (pianoData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('Sessione scaduta, effettua nuovamente il login');
    }
    
    const response = await axios.post(
      `${API_URL}/api/produzione/piani`,
      pianoData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Aggiorna la cache del piano per la data specifica
    const data = response.data.data;
    const dateString = new Date(data.data).toISOString().split('T')[0];
    
    // Aggiorna la cache delle ricette
    const cachedData = await AsyncStorage.getItem(`piani_produzione_${dateString}`);
    if (cachedData) {
      const piani = JSON.parse(cachedData);
      piani.push(data);
      await AsyncStorage.setItem(`piani_produzione_${dateString}`, JSON.stringify(piani));
    }
    
    return data;
  } catch (error) {
    console.error('Error creating production plan:', error);
    throw new Error(error.response?.data?.error || 'Impossibile creare il piano di produzione');
  }
};

// Ottieni statistiche di produzione
export const getStatisticheProduzione = async (periodo = 'settimanale') => {
  try {
    // Verifica se c'è connessione a internet
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      // Se offline, cerca nel localStorage
      const cachedData = await AsyncStorage.getItem(`statistiche_produzione_${periodo}`);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      throw new Error('Nessuna statistica disponibile offline');
    }
    
    // Se online, fai la chiamata API
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('Sessione scaduta, effettua nuovamente il login');
    }
    
    const response = await axios.get(`${API_URL}/api/produzione/statistiche`, {
      params: { periodo },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Salva i dati nel localStorage per uso offline
    await AsyncStorage.setItem(`statistiche_produzione_${periodo}`, JSON.stringify(response.data.data));
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching production statistics:', error);
    throw new Error(error.response?.data?.error || 'Impossibile recuperare le statistiche di produzione');
  }
};

// Sincronizza dati offline
export const syncOfflineData = async () => {
  try {
    // Verifica se ci sono dati da sincronizzare
    const offlineActions = await AsyncStorage.getItem('offline_actions');
    
    if (!offlineActions) {
      return { success: true, message: 'Nessun dato da sincronizzare' };
    }
    
    const actions = JSON.parse(offlineActions);
    
    if (actions.length === 0) {
      return { success: true, message: 'Nessun dato da sincronizzare' };
    }
    
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('Sessione scaduta, effettua nuovamente il login');
    }
    
    // Invia tutte le azioni offline
    const response = await axios.post(
      `${API_URL}/api/sync`,
      { actions },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Rimuovi le azioni sincronizzate
    await AsyncStorage.removeItem('offline_actions');
    
    return {
      success: true,
      message: `Sincronizzate ${actions.length} azioni`,
      dettagli: response.data
    };
  } catch (error) {
    console.error('Error syncing offline data:', error);
    throw new Error(error.response?.data?.error || 'Impossibile sincronizzare i dati offline');
  }
};

// Registra azione offline
export const registerOfflineAction = async (action) => {
  try {
    // Recupera azioni offline esistenti
    const offlineActions = await AsyncStorage.getItem('offline_actions');
    let actions = offlineActions ? JSON.parse(offlineActions) : [];
    
    // Aggiungi timestamp e id all'azione
    const actionWithMeta = {
      ...action,
      timestamp: new Date().toISOString(),
      actionId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
    
    // Aggiungi la nuova azione
    actions.push(actionWithMeta);
    
    // Salva la lista aggiornata
    await AsyncStorage.setItem('offline_actions', JSON.stringify(actions));
    
    return { success: true, actionId: actionWithMeta.actionId };
  } catch (error) {
    console.error('Error registering offline action:', error);
    throw new Error('Impossibile registrare l\'azione offline');
  }
};

export default {
  getPianiProduzione,
  startProduzione,
  completeProduzione,
  getRicette,
  getRicettaById,
  calcolaCostoRicetta,
  createRicetta,
  updateRicetta,
  getIngredienti,
  createPianoProduzione,
  getStatisticheProduzione,
  syncOfflineData,
  registerOfflineAction
};