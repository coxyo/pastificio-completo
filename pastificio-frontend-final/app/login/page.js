// app/login/page.js - VERSIONE CORRETTA 14/01/2026
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check se già loggato all'avvio
  useEffect(() => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    if (token) {
      console.log('✅ Già loggato, redirect a dashboard...');
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app';
      
      console.log('🔐 Tentativo login:', { email, API_URL });

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('📡 Risposta server:', data);

      if (data.success && data.token) {
        // Salva in ENTRAMBI i posti per massima compatibilità
        Cookies.set('token', data.token, { 
          expires: 7, // 7 giorni
          secure: true, // Solo HTTPS
          sameSite: 'strict' // Protezione CSRF
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        console.log('✅ Login effettuato con successo!');
        console.log('🔑 Token salvato in cookies e localStorage');

        // Redirect al dashboard
        router.push('/dashboard');
      } else {
        setError(data.message || data.error || 'Credenziali non valide');
        console.error('❌ Login fallito:', data);
      }
    } catch (error) {
      console.error('❌ Errore login:', error);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  // Quick login per test
  const quickLogin = (userEmail, userPassword) => {
    setEmail(userEmail);
    setPassword(userPassword);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '48px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '450px'
      }}>
        {/* Logo e Titolo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>
            🍝
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            Pastificio Nonna Claudia
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0
          }}>
            Accedi al Sistema Gestionale
          </p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@pastificio.com"
              autoComplete="email"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Errore */}
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              {error}
            </div>
          )}

          {/* Pulsante Login */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#9ca3af' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 6px rgba(102, 126, 234, 0.4)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#5568d3';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(102, 126, 234, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#667eea';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px rgba(102, 126, 234, 0.4)';
              }
            }}
          >
            {loading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Accesso in corso...
              </div>
            ) : (
              '🔐 ACCEDI AL GESTIONALE'
            )}
          </button>
        </form>

        {/* Quick Login Buttons */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{
            fontSize: '13px',
            color: '#9ca3af',
            marginBottom: '16px',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            🚀 Accesso Rapido (Test):
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px'
          }}>
            {/* ✅ CREDENZIALI CORRETTE */}
            {[
              { name: 'Admin', email: 'admin@pastificio.com', password: 'Pastificio2025!', icon: '👨‍💼' },
              { name: 'Maria', email: 'maria@pastificio.it', password: 'Pastificio2025!', icon: '👩' },
              { name: 'Giuseppe', email: 'giuseppe@pastificio.it', password: 'Pastificio2025!', icon: '👨' },
              { name: 'Anna', email: 'anna@pastificio.it', password: 'Pastificio2025!', icon: '👩' }
            ].map((user) => (
              <button
                key={user.email}
                onClick={() => quickLogin(user.email, user.password)}
                type="button"
                style={{
                  padding: '10px',
                  backgroundColor: '#f3f4f6',
                  border: '2px solid transparent',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e5e7eb';
                  e.target.style.borderColor = '#667eea';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.borderColor = 'transparent';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <span style={{ fontSize: '18px' }}>{user.icon}</span>
                {user.name}
              </button>
            ))}
          </div>
        </div>

        {/* Info Credenziali - AGGIORNATE */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #bfdbfe'
        }}>
          <div style={{
            fontSize: '13px',
            color: '#1e40af',
            marginBottom: '8px',
            fontWeight: '600'
          }}>
            ℹ️ Credenziali di Test:
          </div>
          <div style={{
            fontSize: '12px',
            color: '#3b82f6',
            lineHeight: '1.6'
          }}>
            <strong>Email:</strong> admin@pastificio.com<br />
            <strong>Password:</strong> Pastificio2025!<br />
            <strong>Durata Token:</strong> 7 giorni
          </div>
        </div>

        {/* Footer */}
        <p style={{
          marginTop: '24px',
          fontSize: '12px',
          color: '#9ca3af',
          textAlign: 'center'
        }}>
          Sistema Gestionale v2.0.2 • Produzione
        </p>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}