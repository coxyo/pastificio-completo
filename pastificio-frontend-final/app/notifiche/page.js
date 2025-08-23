'use client';

import dynamic from 'next/dynamic';

const NotificheContent = dynamic(
  () => import('./NotificheContent'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <p style={{ marginTop: '16px', color: '#666' }}>Caricamento notifiche...</p>
        </div>
      </div>
    )
  }
);

export default function NotifichePage() {
  return <NotificheContent />;
}