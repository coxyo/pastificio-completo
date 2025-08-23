// src/config/api.js
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
export const WS_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me'
  },
  ORDINI: {
    BASE: '/api/ordini',
    OGGI: '/api/ordini/oggi',
    STATISTICHE: '/api/ordini/statistiche'
  },
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    KPI: '/api/dashboard/kpi',
    PRODOTTI: '/api/dashboard/prodotti',
    TREND: '/api/dashboard/trend',
    PRODUZIONE: '/api/dashboard/produzione',
    ALERTS: '/api/dashboard/alerts'
  },
  MAGAZZINO: {
    MOVIMENTI: '/api/magazzino/movimenti',
    GIACENZE: '/api/magazzino/giacenze',
    VALORE: '/api/magazzino/valore'
  },
  REPORT: {
    GIORNALIERO: '/api/report/giornaliero',
    SETTIMANALE: '/api/report/settimanale',
    MENSILE: '/api/report/mensile'
  },
  WHATSAPP: {
    STATUS: '/api/whatsapp/status',
    QR: '/api/whatsapp/qr',
    INVIA: '/api/whatsapp/invia',
    BROADCAST: '/api/whatsapp/broadcast'
  },
  CLIENTI: {
    BASE: '/api/clienti',
    SEARCH: '/api/clienti/search'
  }
};

// Helper functions per costruire URL completi
export const buildUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

export const buildHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Funzione helper per fare richieste API
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildUrl(endpoint);
  const defaultOptions = {
    headers: buildHeaders(options.includeAuth !== false),
  };
  
  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token scaduto o non valido
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Sessione scaduta');
      }
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};