// app/magazzino/movimenti/page.js
'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Importa dinamicamente il componente per evitare problemi SSR
const MovimentiMagazzino = dynamic(
  () => import('@/components/Magazzino/MovimentiMagazzino'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #1976d2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <p style={{ marginTop: '16px', color: '#666' }}>Caricamento magazzino...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }
);

export default function MovimentiPage() {
  return <MovimentiMagazzino />;
}