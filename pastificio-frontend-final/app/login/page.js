// app/login/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    
    try {
      // Genera token demo valido
      const tokenDemo = btoa(JSON.stringify({
        userId: 'demo-user-001',
        username: 'Demo User',
        email: 'demo@pastificio.com',
        exp: Date.now() + 86400000 // 24 ore
      }));

      // Salva nel localStorage
      localStorage.setItem('token', tokenDemo);
      localStorage.setItem('user', JSON.stringify({
        id: 'demo-user-001',
        username: 'Demo User',
        email: 'demo@pastificio.com',
        ruolo: 'admin'
      }));

      console.log('✅ Login effettuato con successo!');
      console.log('🔄 Reindirizzamento a dashboard...');

      // Forza reload per inizializzare WebSocket
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('❌ Errore login:', error);
      alert('Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '48px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        {/* Logo */}
        <div style={{
          fontSize: '48px',
          marginBottom: '16px'
        }}>
          🍝
        </div>

        {/* Titolo */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1976d2',
          margin: '0 0 8px 0'
        }}>
          Pastificio Nonna Claudia
        </h1>
        
        <h2 style={{
          fontSize: '16px',
          color: '#666',
          fontWeight: 'normal',
          margin: '0 0 32px 0'
        }}>
          Accedi al Gestionale
        </h2>

        {/* Info credenziali */}
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#1565c0',
            marginBottom: '8px',
            fontWeight: 'bold'
          }}>
            📋 Credenziali Demo:
          </div>
          <div style={{
            fontSize: '13px',
            color: '#424242',
            lineHeight: '1.6'
          }}>
            <strong>Username:</strong> Demo User<br />
            <strong>Token:</strong> Generato automaticamente<br />
            <strong>Validità:</strong> 24 ore
          </div>
        </div>

        {/* Pulsante Login */}
        <button 
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: loading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.target.style.backgroundColor = '#1565c0';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.target.style.backgroundColor = '#1976d2';
          }}
        >
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid white',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Accesso in corso...
            </div>
          ) : (
            '🔐 ACCEDI AL GESTIONALE'
          )}
        </button>

        {/* Features */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          textAlign: 'left'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#666',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            ✨ Funzionalità attive:
          </div>
          <ul style={{
            fontSize: '11px',
            color: '#888',
            margin: 0,
            paddingLeft: '20px',
            lineHeight: '1.8'
          }}>
            <li>Gestione ordini real-time</li>
            <li>Magazzino con notifiche</li>
            <li>Dashboard analytics AI</li>
            <li>Backup automatico</li>
            <li>WebSocket sync</li>
          </ul>
        </div>

        {/* Footer */}
        <p style={{
          marginTop: '24px',
          fontSize: '12px',
          color: '#999'
        }}>
          Sistema Gestionale v2.0.1 - Produzione
        </p>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}