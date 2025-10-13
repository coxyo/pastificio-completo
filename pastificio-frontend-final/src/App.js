// src/App.js - SISTEMA MULTI-UTENTE COMPLETO + GESTIONE PRODOTTI
import React, { useState, useEffect } from 'react';
import GestoreOrdini from './components/GestoreOrdini';
import GestioneProdotti from './components/GestioneProdotti'; // ✅ NUOVO IMPORT

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentView, setCurrentView] = useState('ordini'); // ✅ NUOVO STATE per navigazione
  
  // Auto-login per test
  useEffect(() => {
    // Simula auto-login come admin
    setUser({ 
      nome: 'Admin', 
      username: 'admin', 
      ruolo: 'admin',
      id: '1'
    });
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // Login simulato
    if (username === 'admin' && password === 'admin123') {
      setUser({ nome: 'Admin', username: 'admin', ruolo: 'admin' });
    } else if (username === 'maria' && password === 'maria123') {
      setUser({ nome: 'Maria', username: 'maria', ruolo: 'operatore' });
    } else {
      alert('Credenziali errate!');
    }
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    setShowLogin(true);
    setCurrentView('ordini'); // Reset alla vista ordini
  };

  // Mostra login se richiesto
  if (showLogin || !user) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          width: '400px'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
            🍝 Pastificio Login
          </h2>
          
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '20px',
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Accedi
            </button>
          </form>
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#666' }}>Test rapido:</p>
            <button
              onClick={() => {
                setUser({ nome: 'Admin', username: 'admin', ruolo: 'admin' });
                setShowLogin(false);
              }}
              style={{
                margin: '5px',
                padding: '8px 16px',
                backgroundColor: '#f0f0f0',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Login come Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // INTERFACCIA PRINCIPALE MULTI-UTENTE
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* HEADER MULTI-UTENTE COLORATO */}
      <div style={{
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '15px 30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo e Titolo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>
              🍝 Pastificio Nonna Claudia
            </h1>
            <span style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '14px'
            }}>
              Sistema Multi-Utente v2.0
            </span>
          </div>
          
          {/* Info Utente e Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '8px 16px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>👤</span>
              <span>{user.nome}</span>
              <span style={{ opacity: 0.7 }}>|</span>
              <span>{user.ruolo === 'admin' ? '👨‍💼 Admin' : '👷 Operatore'}</span>
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 20px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              🚪 Esci
            </button>
          </div>
        </div>
      </div>
      
      {/* BARRA UTENTI ONLINE */}
      <div style={{
        backgroundColor: '#fbbf24',
        padding: '10px 30px',
        fontSize: '14px',
        color: '#92400e',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <span>👥 Utenti online:</span>
        <span style={{
          backgroundColor: '#10b981',
          color: 'white',
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '12px'
        }}>
          Maria (Produzione)
        </span>
        <span style={{
          backgroundColor: '#10b981',
          color: 'white',
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '12px'
        }}>
          Giuseppe (Ordini)
        </span>
        <span style={{
          backgroundColor: '#f59e0b',
          color: 'white',
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '12px'
        }}>
          Anna (Pausa)
        </span>
      </div>
      
      {/* MENU NAVIGAZIONE */}
      <div style={{
        backgroundColor: 'white',
        padding: '10px 30px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap' // ✅ Per responsive
      }}>
        <button 
          onClick={() => setCurrentView('dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentView === 'dashboard' ? '#667eea' : 'white',
            color: currentView === 'dashboard' ? 'white' : '#667eea',
            border: currentView === 'dashboard' ? 'none' : '2px solid #667eea',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: currentView === 'dashboard' ? 'bold' : 'normal'
          }}
        >
          📊 Dashboard
        </button>
        
        <button 
          onClick={() => setCurrentView('ordini')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentView === 'ordini' ? '#667eea' : 'white',
            color: currentView === 'ordini' ? 'white' : '#667eea',
            border: currentView === 'ordini' ? 'none' : '2px solid #667eea',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: currentView === 'ordini' ? 'bold' : 'normal'
          }}
        >
          🛒 Ordini
        </button>
        
        {/* ✅ NUOVO PULSANTE GESTIONE PRODOTTI */}
        <button 
          onClick={() => setCurrentView('prodotti')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentView === 'prodotti' ? '#667eea' : 'white',
            color: currentView === 'prodotti' ? 'white' : '#667eea',
            border: currentView === 'prodotti' ? 'none' : '2px solid #667eea',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: currentView === 'prodotti' ? 'bold' : 'normal',
            position: 'relative'
          }}
        >
          📦 Gestione Prodotti
          {/* Badge NEW */}
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '10px',
            fontWeight: 'bold'
          }}>
            NEW
          </span>
        </button>
        
        <button 
          onClick={() => setCurrentView('magazzino')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentView === 'magazzino' ? '#667eea' : 'white',
            color: currentView === 'magazzino' ? 'white' : '#667eea',
            border: currentView === 'magazzino' ? 'none' : '2px solid #667eea',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: currentView === 'magazzino' ? 'bold' : 'normal'
          }}
        >
          📦 Magazzino
        </button>
        
        {user.ruolo === 'admin' && (
          <button 
            onClick={() => setCurrentView('impostazioni')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentView === 'impostazioni' ? '#667eea' : 'white',
              color: currentView === 'impostazioni' ? 'white' : '#667eea',
              border: currentView === 'impostazioni' ? 'none' : '2px solid #667eea',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: currentView === 'impostazioni' ? 'bold' : 'normal'
            }}
          >
            ⚙️ Impostazioni
          </button>
        )}
      </div>
      
      {/* ✅ CONTENUTO PRINCIPALE - ROUTING MANUALE */}
      <div style={{ padding: '20px' }}>
        {currentView === 'ordini' && <GestoreOrdini />}
        
        {currentView === 'prodotti' && <GestioneProdotti />}
        
        {currentView === 'dashboard' && (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h2>📊 Dashboard</h2>
            <p>Vista Dashboard in arrivo...</p>
          </div>
        )}
        
        {currentView === 'magazzino' && (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h2>📦 Magazzino</h2>
            <p>Vista Magazzino in arrivo...</p>
          </div>
        )}
        
        {currentView === 'impostazioni' && (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h2>⚙️ Impostazioni</h2>
            <p>Vista Impostazioni in arrivo...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;