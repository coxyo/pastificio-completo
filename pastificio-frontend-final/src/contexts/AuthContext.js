// src/contexts/AuthContext.js - ✅ OTTIMIZZATO PERFORMANCE 03/03/2026
// Rimossa verifica token al server ogni 5 minuti (causa rallentamento)
// Il JWT si auto-verifica localmente controllando la scadenza
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

// ✅ Helper: decodifica JWT senza librerie esterne
function decodeJWT(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (e) {
    return null;
  }
}

// ✅ Helper: controlla se JWT è scaduto (localmente, senza chiamata API)
function isTokenExpired(token) {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  // Scade 5 minuti prima per sicurezza
  return Date.now() >= (payload.exp * 1000) - (5 * 60 * 1000);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // ✅ Carica utente da localStorage all'avvio
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        // ✅ OTTIMIZZATO: Verifica scadenza JWT localmente (nessuna chiamata API!)
        if (isTokenExpired(savedToken)) {
          console.log('[AUTH] Token scaduto, rimuovo sessione...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      }
    } catch (e) {
      console.error('[AUTH] Errore caricamento sessione:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    setLoading(false);
    setInitialized(true);
  }, []);

  // ✅ OTTIMIZZATO: Controlla scadenza token ogni 30 minuti (LOCALMENTE, senza API)
  // Prima era: chiamata API ogni 5 minuti = 12 chiamate/ora per dispositivo
  // Ora è: controllo locale ogni 30 minuti = 0 chiamate API
  useEffect(() => {
    if (!token || typeof window === 'undefined') return;

    const checkExpiry = () => {
      if (isTokenExpired(token)) {
        console.log('[AUTH] Token sta per scadere, logout automatico...');
        logout('Sessione scaduta, effettua nuovamente l\'accesso');
      }
    };

    // Controlla ogni 30 minuti (solo localmente)
    const interval = setInterval(checkExpiry, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  // ✅ LOGIN
  const login = useCallback(async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);

        return { 
          success: true, 
          user: data.user,
          mustChangePassword: data.user?.passwordTemporanea || data.user?.mustChangePassword
        };
      } else {
        return { 
          success: false, 
          message: data.message || 'Credenziali non valide',
          locked: data.locked,
          minutiRimanenti: data.minutiRimanenti
        };
      }
    } catch (error) {
      return { success: false, message: 'Errore di connessione al server' };
    }
  }, []);

  // ✅ LOGOUT
  const logout = useCallback((message = null) => {
    // Notifica backend (best effort, non bloccante)
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${savedToken}`,
          'Content-Type': 'application/json'
        }
      }).catch(() => {}); // Ignora errori
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);

    // Salva messaggio per la pagina login
    if (message) {
      localStorage.setItem('logoutMessage', message);
    }
  }, []);

  // ✅ CAMBIO PASSWORD
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const res = await fetch(`${API_URL}/auth/changepassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        
        // Aggiorna user senza passwordTemporanea
        const updatedUser = { ...user, passwordTemporanea: false, mustChangePassword: false };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      return data;
    } catch (error) {
      return { success: false, message: 'Errore di connessione' };
    }
  }, [token, user]);

  // ✅ HELPER: Controlla permessi
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    if (typeof roles === 'string') return user.role === roles;
    return roles.includes(user.role);
  }, [user]);

  const isAdmin = useCallback(() => user?.role === 'admin', [user]);
  const isOperatore = useCallback(() => user?.role === 'operatore', [user]);
  const isVisualizzatore = useCallback(() => user?.role === 'visualizzatore', [user]);
  
  // ✅ Può scrivere? (admin o operatore)
  const canWrite = useCallback(() => {
    return user?.role === 'admin' || user?.role === 'operatore';
  }, [user]);

  // ✅ Può eliminare? (solo admin)
  const canDelete = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  const value = {
    user,
    token,
    loading,
    initialized,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    changePassword,
    hasRole,
    isAdmin,
    isOperatore,
    isVisualizzatore,
    canWrite,
    canDelete
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider');
  }
  return context;
}

export default AuthContext;