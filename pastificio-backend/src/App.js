// src/App.js
import React, { useState, useEffect } from 'react';
import DashboardUltimate from './components/DashboardUltimate';
import GestoreOrdini from './components/GestoreOrdini';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    checkExistingSession();
    setupUserPresence();
    
    return () => {
      if (user) {
        updateUserStatus('offline');
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      updateUserStatus('online');
      loadUserNotifications();
    }
  }, [user]);

  const checkExistingSession = () => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setCurrentView(userData.ruolo === 'admin' ? 'dashboard' : 'ordini');
      } catch (error) {
        console.error('Sessione non valida');
        localStorage.clear();
      }
    }
    
    setIsLoading(false);
  };

  const setupUserPresence = () => {
    const interval = setInterval(() => {
      if (user) {
        const mockUsers = [
          { nome: 'Maria Rossi', ruolo: 'operatore', status: 'online', ultimaAttivita: new Date() },
          { nome: 'Giuseppe Verdi', ruolo: 'operatore', status: 'busy', ultimaAttivita: new Date() }
        ];
        setActiveUsers(mockUsers);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  };

  const updateUserStatus = (status) => {
    console.log(`User ${user?.username} is ${status}`);
  };

  const loadUserNotifications = () => {
    const mockNotifications = [
      { id: 1, tipo: 'info', messaggio: 'Benvenuto nel sistema!', letta: false, data: new Date() },
      { id: 2, tipo: 'ordine', messaggio: '5 nuovi ordini da processare', letta: false, data: new Date() }
    ];
    setNotifications(mockNotifications);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        
        if (data.user.ruolo === 'admin') {
          setCurrentView('dashboard');
        } else if (data.user.ruolo === 'operatore') {
          setCurrentView('ordini');
        } else {
          setCurrentView('dashboard');
        }
        
        setUsername('');
        setPassword('');
        setLoginError('');
      } else {
        setLoginError(data.error || 'Credenziali non valide');
      }
    } catch (error) {
      setLoginError('Errore di connessione al server. Verifica che il backend sia attivo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUsername('');
    setPassword('');
    setCurrentView('dashboard');
    setShowUserMenu(false);
    updateUserStatus('offline');
  };

  const handleQuickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setTimeout(() => {
      document.getElementById('loginForm')?.requestSubmit();
    }, 100);
  };

  // LOADING SCREEN
  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🍝</div>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>Pastificio Nonna Claudia</div>
          <div>Caricamento...</div>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: '450px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍝</div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#1f2937' }}>
              Pastificio Nonna Claudia
            </h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              Sistema Gestionale Multi-Utente
            </p>
          </div>
          
          <form id="loginForm" onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                Nome Utente
              </label>
              <input
                type="text"
                placeholder="Inserisci username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Inserisci password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>
            
            {loginError && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                ⚠️ {loginError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: isLoading ? '#9ca3af' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>
          
          <div style={{ 
            marginTop: '32px', 
            paddingTop: '24px', 
            borderTop: '2px solid #e5e7eb' 
          }}>
            <p style={{ 
              fontSize: '12px', 
              color: '#9ca3af', 
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              ACCESSO RAPIDO TEST
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                style={{
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '20px' }}>👨‍💼</div>
                <div style={{ fontWeight: '600' }}>Admin</div>
              </button>
              
              <button
                type="button"
                onClick={() => handleQuickLogin('maria', 'maria123')}
                style={{
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '20px' }}>👩</div>
                <div style={{ fontWeight: '600' }}>Maria</div>
              </button>
              
              <button
                type="button"
                onClick={() => handleQuickLogin('giuseppe', 'giuseppe123')}
                style={{
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '20px' }}>👨</div>
                <div style={{ fontWeight: '600' }}>Giuseppe</div>
              </button>
              
              <button
                type="button"
                onClick={() => handleQuickLogin('anna', 'anna123')}
                style={{
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '20px' }}>👩</div>
                <div style={{ fontWeight: '600' }}>Anna</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN APPLICATION (LOGGATO)
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header Multi-Utente */}
      <div style={{
        backgroundColor: '#667eea',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>
            🍝 Pastificio Multi-Utente
          </h2>
          <nav style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setCurrentView('dashboard')}
              style={{
                padding: '8px 16px',
                backgroundColor: currentView === 'dashboard' ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setCurrentView('ordini')}
              style={{
                padding: '8px 16px',
                backgroundColor: currentView === 'ordini' ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🛒 Ordini
            </button>
          </nav>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* User Info */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>👤</span>
            <span>{user.nome || user.username}</span>
            <span style={{ opacity: 0.8 }}>|</span>
            <span>{user.ruolo === 'admin' ? '👨‍💼 Admin' : '👷 Operatore'}</span>
          </div>
          
          {/* Notifiche */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                padding: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'white',
                fontSize: '18px'
              }}
            >
              🔔
              {notifications.filter(n => !n.letta).length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {notifications.filter(n => !n.letta).length}
                </span>
              )}
            </button>
          </div>
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🚪 Esci
          </button>
        </div>
      </div>
      
      {/* Utenti Online */}
      {activeUsers.length > 0 && (
        <div style={{
          backgroundColor: '#fef3c7',
          padding: '8px 24px',
          borderBottom: '1px solid #fbbf24',
          fontSize: '13px',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span>👥 Utenti online:</span>
          {activeUsers.map((u, i) => (
            <span key={i} style={{
              padding: '2px 8px',
              backgroundColor: u.status === 'online' ? '#10b981' : '#f59e0b',
              color: 'white',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              {u.nome.split(' ')[0]}
            </span>
          ))}
        </div>
      )}
      
      {/* Contenuto Principale */}
      <div style={{ padding: '24px' }}>
        {currentView === 'dashboard' ? (
          <DashboardUltimate />
        ) : (
          <GestoreOrdini />
        )}
      </div>
    </div>
  );
}

export default App;