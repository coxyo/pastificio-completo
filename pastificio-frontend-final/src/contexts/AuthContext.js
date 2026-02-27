// src/contexts/AuthContext.js - ✅ NUOVO: Gestione Autenticazione Centralizzata
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

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
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('[AUTH] Errore caricamento sessione:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    setLoading(false);
    setInitialized(true);
  }, []);

  // ✅ Verifica validità token periodicamente (ogni 5 minuti)
  useEffect(() => {
    if (!token || typeof window === 'undefined') return;

    const checkToken = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/verify`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (!data.valid) {
          console.log('[AUTH] Token non più valido, logout...');
          logout(data.expired ? 'Sessione scaduta, effettua nuovamente l\'accesso' : null);
        }
      } catch (error) {
        console.error('[AUTH] Errore verifica token:', error);
      }
    };

    // Prima verifica dopo 30 secondi, poi ogni 5 minuti
    const initialTimer = setTimeout(checkToken, 30000);
    const interval = setInterval(checkToken, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [token]);

  // ✅ Intercetta risposte 401 da tutte le API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Se la risposta è 401 e abbiamo un token, la sessione è scaduta
      if (response.status === 401 && token) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        // Non fare logout se è la chiamata di login stessa
        if (!url.includes('/auth/login') && !url.includes('/auth/verify')) {
          try {
            const clone = response.clone();
            const data = await clone.json();
            if (data.expired) {
              logout('Sessione scaduta, effettua nuovamente l\'accesso');
            }
          } catch (e) {
            // Ignora errori di parsing
          }
        }
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);

  // ✅ LOGIN
  const login = useCallback(async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password, username })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
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
    // Notifica backend (best effort)
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
        const updatedUser = { ...user, passwordTemporanea: false };
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