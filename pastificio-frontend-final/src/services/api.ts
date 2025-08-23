// src/services/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Errore nella richiesta');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Ordini
  getOrdini: (data?: string) =>
    fetchWithAuth(`/ordini${data ? `?data=${data}` : ''}`),

  createOrdine: (ordine: any) =>
    fetchWithAuth('/ordini', {
      method: 'POST',
      body: JSON.stringify(ordine),
    }),

  updateOrdine: (id: string, ordine: any) =>
    fetchWithAuth(`/ordini/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ordine),
    }),

  deleteOrdine: (id: string) =>
    fetchWithAuth(`/ordini/${id}`, {
      method: 'DELETE',
    }),

  // Altri metodi API...
};