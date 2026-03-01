// next.config.js - ✅ FIXED 14/01/2026
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ottimizzazione imports per Material-UI
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
  
  // ✅ FIXED: Variabili d'ambiente SENZA /api nel path
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://pastificio-completo-production.up.railway.app',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app',
    NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
    NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  },
  
  // Configurazioni del compilatore
  compiler: {
    // Rimuove console.log in produzione
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Configurazione immagini
  images: {
    domains: ['localhost', 'pastificio-completo-production.up.railway.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pastificio-completo-production.up.railway.app',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
  
  // Headers per CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
      // ✅ NUOVO: Headers per Service Worker (Web Push Notifications)
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
  
  // ✅ REMOVED: Rewrites non necessari
  
  // Configurazioni per TypeScript/JavaScript
  reactStrictMode: true,
  
  // Disabilita x-powered-by header per sicurezza
  poweredByHeader: false,
  
  // Configurazione per trailing slash
  trailingSlash: false,
  
  // Output standalone per Docker se necessario
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
}

module.exports = nextConfig;

// Injected content via Sentry wizard below
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    org: "pastificio-nonna-claudia",
    project: "javascript-nextjs",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    tunnelRoute: "/monitoring",
    disableLogger: true,
    automaticVercelMonitors: true,
  }
);