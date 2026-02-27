// src/components/Login.js - ✅ AGGIORNATO: Blocco tentativi + Feedback visivo + Cambio password temporanea
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const { login, changePassword, user } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ✅ Stato blocco
  const [locked, setLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // ✅ Cambio password temporanea
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [changePwdError, setChangePwdError] = useState('');
  const [changePwdLoading, setChangePwdLoading] = useState(false);

  // ✅ Messaggio logout/scadenza
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const msg = localStorage.getItem('logoutMessage');
    if (msg) {
      setInfo(msg);
      localStorage.removeItem('logoutMessage');
    }
  }, []);

  // ✅ Se l'utente ha password temporanea, mostra form cambio
  useEffect(() => {
    if (user?.passwordTemporanea) {
      setShowChangePassword(true);
    }
  }, [user]);

  // ✅ Countdown blocco account
  useEffect(() => {
    if (!locked || countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setLocked(false);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [locked, countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;
    
    setError('');
    setInfo('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      // Se password temporanea, il useEffect mostrerà il form cambio
      if (result.user?.passwordTemporanea) {
        setCurrentPwd(password); // Pre-compila password attuale
      }
    } else {
      if (result.locked) {
        setLocked(true);
        setCountdown((result.minutiRimanenti || 15) * 60);
        setError(result.message);
      } else {
        setError(result.message);
      }
    }
    
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePwdError('');

    // Validazione
    if (newPwd.length < 8 || !/\d/.test(newPwd)) {
      setChangePwdError('La password deve avere almeno 8 caratteri e contenere almeno un numero');
      return;
    }
    if (newPwd !== confirmPwd) {
      setChangePwdError('Le password non corrispondono');
      return;
    }

    setChangePwdLoading(true);
    const result = await changePassword(currentPwd, newPwd);
    
    if (result.success) {
      setShowChangePassword(false);
      // Il login continua automaticamente con il nuovo token
    } else {
      setChangePwdError(result.message || 'Errore nel cambio password');
    }
    setChangePwdLoading(false);
  };

  const formatCountdown = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // ═══════════════════════════════════════════════
  // FORM CAMBIO PASSWORD TEMPORANEA
  // ═══════════════════════════════════════════════
  if (showChangePassword) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔐</div>
            <h2 style={{ fontSize: '22px', color: '#1f2937', marginBottom: '8px' }}>
              Cambia Password
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              La tua password è temporanea. Scegli una nuova password per continuare.
            </p>
          </div>

          <form onSubmit={handleChangePassword}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Nuova Password</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Almeno 8 caratteri con un numero"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Conferma Password</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Ripeti la nuova password"
                required
                style={styles.input}
              />
            </div>

            {changePwdError && (
              <div style={styles.errorBox}>⚠️ {changePwdError}</div>
            )}

            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
              La password deve avere almeno 8 caratteri e contenere almeno un numero
            </div>

            <button
              type="submit"
              disabled={changePwdLoading}
              style={{
                ...styles.button,
                backgroundColor: changePwdLoading ? '#9ca3af' : '#10b981'
              }}
            >
              {changePwdLoading ? 'Salvataggio...' : '✅ Salva Nuova Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // FORM LOGIN PRINCIPALE
  // ═══════════════════════════════════════════════
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', color: '#1f2937', marginBottom: '8px' }}>
            🍝 Pastificio
          </h1>
          <p style={{ color: '#6b7280' }}>Nonna Claudia - Sistema Gestionale</p>
        </div>

        {/* ✅ Messaggio informativo (sessione scaduta, ecc.) */}
        {info && (
          <div style={styles.infoBox}>
            ℹ️ {info}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={locked}
              autoComplete="username"
              style={{
                ...styles.input,
                opacity: locked ? 0.5 : 1
              }}
            />
          </div>

          <div style={{ ...styles.fieldGroup, marginBottom: '24px' }}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={locked}
              autoComplete="current-password"
              style={{
                ...styles.input,
                opacity: locked ? 0.5 : 1
              }}
            />
          </div>

          {/* ✅ Errore con colore diverso per blocco */}
          {error && (
            <div style={locked ? styles.warningBox : styles.errorBox}>
              {locked ? '🔒' : '⚠️'} {error}
              {locked && countdown > 0 && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  color: '#92400e',
                  fontFamily: 'monospace'
                }}>
                  ⏱️ {formatCountdown(countdown)}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || locked}
            style={{
              ...styles.button,
              backgroundColor: loading || locked ? '#9ca3af' : '#667eea',
              cursor: loading || locked ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Accesso in corso...' : locked ? `Bloccato (${formatCountdown(countdown)})` : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
// STILI
// ═══════════════════════════════════════════════
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    width: '420px',
    maxWidth: '90%'
  },
  fieldGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '14px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600'
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  warningBox: {
    padding: '12px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    border: '1px solid #f59e0b',
    textAlign: 'center'
  },
  infoBox: {
    padding: '12px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px'
  }
};

export default Login;