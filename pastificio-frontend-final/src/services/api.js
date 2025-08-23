// services/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const USE_MOCK = true; // Cambia a false quando il backend è attivo

// Mock data per test
const mockOrdini = [
  {
    _id: '1',
    nomeCliente: 'Mario Rossi',
    telefono: '333 1234567',
    dataRitiro: new Date().toISOString(),
    oraRitiro: '10:00',
    daViaggio: false,
    prodotti: [
      {
        prodotto: 'Culurgiones',
        quantita: 2,
        unita: 'Kg',
        prezzo: 15,
        note: ''
      },
      {
        prodotto: 'Sebadas',
        quantita: 10,
        unita: 'pz',
        prezzo: 2,
        note: 'Con miele'
      }
    ],
    note: 'Chiamare prima del ritiro',
    stato: 'in_preparazione',
    totale: 35
  },
  {
    _id: '2',
    nomeCliente: 'Giuseppe Verdi',
    telefono: '333 7654321',
    dataRitiro: new Date().toISOString(),
    oraRitiro: '15:30',
    daViaggio: true,
    prodotti: [
      {
        prodotto: 'Pardulas',
        quantita: 1,
        unita: 'Kg',
        prezzo: 18,
        note: ''
      },
      {
        prodotto: 'Ravioli ricotta e spinaci',
        quantita: 2,
        unita: 'Kg',
        prezzo: 12,
        note: ''
      }
    ],
    note: '',
    stato: 'confermato',
    totale: 42
  },
  {
    _id: '3',
    nomeCliente: 'Anna Bianchi',
    telefono: '333 9876543',
    dataRitiro: new Date().toISOString(),
    oraRitiro: '11:30',
    daViaggio: false,
    prodotti: [
      {
        prodotto: 'Panadas',
        quantita: 6,
        unita: 'pz',
        prezzo: 3,
        note: ''
      }
    ],
    note: 'Ritiro al banco',
    stato: 'completato',
    totale: 18
  }
];

const mockTemplates = [
  { id: '1', nome: 'Template Standard', tipo: 'ordine' },
  { id: '2', nome: 'Template Ricevuta', tipo: 'ricevuta' },
  { id: '3', nome: 'Template Report', tipo: 'report' }
];

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

// MOVIMENTI MAGAZZINO - Aggiornato con il percorso corretto
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

export const aggiornaMovimento = async (id, data) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true, data: { ...data, _id: id } };
  }

  try {
    const response = await fetch(`${API_URL}/magazzino/movimenti/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore aggiornaMovimento:', error);
    throw error;
  }
};

export const eliminaMovimento = async (id) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true };
  }

  try {
    const response = await fetch(`${API_URL}/magazzino/movimenti/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore eliminaMovimento:', error);
    throw error;
  }
};

// FORNITORI MAGAZZINO
export const caricaFornitori = async () => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [
      { _id: '1', nome: 'Fornitore 1', telefono: '123456789' },
      { _id: '2', nome: 'Fornitore 2', telefono: '987654321' }
    ];
  }

  try {
    const response = await fetch(`${API_URL}/magazzino/fornitori`, {
      headers: getHeaders()
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore caricaFornitori:', error);
    return [];
  }
};

export const salvaFornitore = async (data) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true, data: { ...data, _id: Date.now().toString() } };
  }

  try {
    const response = await fetch(`${API_URL}/magazzino/fornitori`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore salvaFornitore:', error);
    throw error;
  }
};

export const aggiornaFornitore = async (id, data) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true, data: { ...data, _id: id } };
  }

  try {
    const response = await fetch(`${API_URL}/magazzino/fornitori/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore aggiornaFornitore:', error);
    throw error;
  }
};

export const eliminaFornitore = async (id) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true };
  }

  try {
    const response = await fetch(`${API_URL}/magazzino/fornitori/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore eliminaFornitore:', error);
    throw error;
  }
};

// INVENTARIO MAGAZZINO
export const caricaInventario = async () => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [
      { _id: '1', prodotto: 'Farina', quantita: 100, unita: 'Kg' },
      { _id: '2', prodotto: 'Uova', quantita: 200, unita: 'pz' }
    ];
  }

  try {
    const response = await fetch(`${API_URL}/magazzino/inventario`, {
      headers: getHeaders()
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore caricaInventario:', error);
    return [];
  }
};

// ORDINI
export const salvaOrdine = async (ordine) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const newOrder = {
      ...ordine,
      _id: Date.now().toString(),
      dataCreazione: new Date().toISOString(),
      stato: 'confermato'
    };
    mockOrdini.push(newOrder);
    return { success: true, data: newOrder };
  }

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
  if (USE_MOCK) {
    // Simula delay di rete
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockOrdini;
  }
  
  try {
    const queryParams = new URLSearchParams(filtri).toString();
    const url = `${API_URL}/ordini${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url, {
      headers: getHeaders()
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore caricaOrdini:', error);
    // Fallback ai dati mock in caso di errore
    return mockOrdini;
  }
};

export const aggiornaOrdine = async (id, data) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockOrdini.findIndex(o => o._id === id);
    if (index !== -1) {
      mockOrdini[index] = { ...mockOrdini[index], ...data };
      return { success: true, data: mockOrdini[index] };
    }
    throw new Error('Ordine non trovato');
  }

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
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockOrdini.findIndex(o => o._id === id);
    if (index !== -1) {
      mockOrdini.splice(index, 1);
      return { success: true };
    }
    throw new Error('Ordine non trovato');
  }

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

// AUTENTICAZIONE
export const login = async (credentials) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const mockUser = {
      id: '1',
      username: credentials.username,
      role: 'admin'
    };
    localStorage.setItem('token', 'mock-token-123');
    localStorage.setItem('user', JSON.stringify(mockUser));
    return { success: true, token: 'mock-token-123', user: mockUser };
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await handleResponse(response);
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  } catch (error) {
    console.error('Errore login:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// DASHBOARD
export const getDashboardStats = async () => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      ordiniOggi: mockOrdini.length,
      ordiniSettimana: mockOrdini.length * 7,
      fatturatoOggi: 95,
      fatturatoSettimana: 665
    };
  }

  try {
    const response = await fetch(`${API_URL}/dashboard/stats`, {
      headers: getHeaders()
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore getDashboardStats:', error);
    return {
      ordiniOggi: 0,
      ordiniSettimana: 0,
      fatturatoOggi: 0,
      fatturatoSettimana: 0
    };
  }
};

// BACKUP
export const creaBackup = async () => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true, message: 'Backup creato con successo (mock)' };
  }

  try {
    const response = await fetch(`${API_URL}/backup/create`, {
      method: 'POST',
      headers: getHeaders()
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore creaBackup:', error);
    throw error;
  }
};

export const ripristinaBackup = async (backupId) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true, message: 'Backup ripristinato con successo (mock)' };
  }

  try {
    const response = await fetch(`${API_URL}/backup/restore/${backupId}`, {
      method: 'POST',
      headers: getHeaders()
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Errore ripristinaBackup:', error);
    throw error;
  }
};

// EXPORT
export const esportaDati = async (formato = 'excel', filtri = {}) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100));
    // Simula download file
    const blob = new Blob(['Mock export data'], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-mock-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return { success: true };
  }

  try {
    const queryParams = new URLSearchParams({ formato, ...filtri }).toString();
    const response = await fetch(`${API_URL}/export?${queryParams}`, {
      headers: getHeaders(false)
    });

    if (!response.ok) {
      throw new Error('Errore nell\'esportazione');
    }

    // Ottieni il blob dal response
    const blob = await response.blob();
    
    // Crea un URL per il download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${new Date().toISOString().split('T')[0]}.${formato}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true };
  } catch (error) {
    console.error('Errore esportaDati:', error);
    throw error;
  }
};

// Export oggetto api per compatibilità
export const api = {
  caricaOrdini,
  salvaOrdine,
  aggiornaOrdine,
  eliminaOrdine,
  login,
  logout,
  getUser,
  isAuthenticated,
  getDashboardStats,
  creaBackup,
  ripristinaBackup,
  esportaDati,
  caricaInventario,
  caricaFornitori,
  salvaFornitore,
  aggiornaFornitore,
  eliminaFornitore,
  caricaMovimenti,
  salvaMovimentoBackend,
  aggiornaMovimento,
  eliminaMovimento
};

export default api;