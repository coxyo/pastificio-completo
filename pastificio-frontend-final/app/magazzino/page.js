// app/magazzino/page.js
'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Importa il componente dinamicamente per evitare problemi di hydration
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
        flexDirection: 'column'
      }}>
        <div className="spinner" />
        <p style={{ marginTop: '16px', color: '#666' }}>Caricamento magazzino...</p>
        <style jsx>{`
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }
);

export default function MagazzinoPage() {
  return <MovimentiMagazzino />;
}