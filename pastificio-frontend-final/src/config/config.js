// src/config/config.js
const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app',
  API_BASE: process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app',
  WS_URL: process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app',
};

// Funzione helper per ottenere URL completo
export const getApiUrl = (endpoint = '') => {
  const baseUrl = config.API_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

export default config;
