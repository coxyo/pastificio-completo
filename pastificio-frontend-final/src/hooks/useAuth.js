// hooks/useAuth.js - Hook per gestione auth automatica
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      // Prova a prendere token da cookies (più sicuro)
      let token = Cookies.get('token');
      
      // Fallback a localStorage se non in cookies
      if (!token) {
        token = localStorage.getItem('token');
        // Se trovato in localStorage, salva anche in cookies
        if (token) {
          Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'strict' });
        }
      }

      if (token) {
        // Verifica se token è valido (decodifica payload)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = Date.now() >= payload.exp * 1000;

          if (isExpired) {
            console.warn('⚠️ Token scaduto, logout automatico');
            logout();
            return;
          }

          // Token valido
          const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
          setUser(savedUser);
          setIsAuthenticated(true);
          console.log('✅ Utente autenticato:', savedUser.email || savedUser.nome);
        } catch (e) {
          console.error('❌ Token non valido:', e);
          logout();
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Errore checkAuth:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Rimuovi da entrambi i posti
    Cookies.remove('token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setIsAuthenticated(false);
    setUser(null);
    
    console.log('🚪 Logout effettuato');
    router.push('/login');
  };

  const refreshAuth = () => {
    setLoading(true);
    checkAuth();
  };

  return {
    isAuthenticated,
    user,
    loading,
    logout,
    refreshAuth
  };
}