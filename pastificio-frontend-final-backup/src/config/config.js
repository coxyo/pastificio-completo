// src/config/config.js
const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend.onrender.com',
  API_BASE: process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend.onrender.com',
  WS_URL: process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend.onrender.com',
};

// Funzione helper per ottenere URL completo
export const getApiUrl = (endpoint = '') => {
  const baseUrl = config.API_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

export default config;