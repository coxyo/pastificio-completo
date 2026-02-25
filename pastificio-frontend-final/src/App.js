// src/App.js - SISTEMA MULTI-UTENTE COMPLETO + RINTRACCIABILITÀ
import React, { useState, useEffect } from 'react';
import GestoreOrdini from './components/GestoreOrdini';
import GestioneProdotti from './components/GestioneProdotti';
import TabellaRintracciabilita from './components/TabellaRintracciabilita'; // ✅ NUOVO IMPORT

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentView, setCurrentView] = useState('ordini');
  
  // Auto-login per test
  useEffect(() => {
    setUser({ 
      nome: 'Admin', 
      username: 'admin', 
      ruolo: 'admin',
      id: '1'
    });
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
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
    setCurrentView('ordini');
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
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Accedi
            </button>
          </form>

          <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
            <p>Test: admin / admin123</p>
            <p>Test: maria / maria123</p>
          </div>
        </div>
      </div>
    );
  }

  // Interfaccia principale
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f5f5f5'
    }}>
      {/* HEADER */}
      <div style={{
        backgroundColor: '#667eea',
        color: 'white',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>
            🍝 Pastificio Nonna Claudia
          </h1>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px'
          }}>
            v2.0 - Sistema Completo
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            👤 {user.nome} ({user.ruolo})
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Esci
          </button>
        </div>
      </div>

      {/* NAVIGATION BAR */}
      <div style={{
        backgroundColor: 'white',
        padding: '16px 32px',
        display: 'flex',
        gap: '12px',
        borderBottom: '1px solid #e0e0e0',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setCurrentView('dashboard')}
          style={{
            padding: '10px 20px',
            backgroundColor: currentView === 'dashboard' ? '#667eea' : 'white',
            color: currentView === 'dashboard' ? 'white' : '#667eea',
            border: currentView === 'dashboard' ? 'none' : '2px solid #667eea',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: currentView === 'dashboard' ? 'bold' : 'normal',
            transition: 'all 0.3s ease'
          }}
        >
          📊 Dashboard
        </button>
        
        <button
          onClick={() => setCurrentView('ordini')}
          style={{
            padding: '10px 20px',
            backgroundColor: currentView === 'ordini' ? '#667eea' : 'white',
            color: currentView === 'ordini' ? 'white' : '#667eea',
            border: currentView === 'ordini' ? 'none' : '2px solid #667eea',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: currentView === 'ordini' ? 'bold' : 'normal',
            transition: 'all 0.3s ease'
          }}
        >
          🛒 Ordini
        </button>

        <button
          onClick={() => setCurrentView('prodotti')}
          style={{
            padding: '10px 20px',
            backgroundColor: currentView === 'prodotti' ? '#667eea' : 'white',
            color: currentView === 'prodotti' ? 'white' : '#667eea',
            border: currentView === 'prodotti' ? 'none' : '2px solid #667eea',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: currentView === 'prodotti' ? 'bold' : 'normal',
            transition: 'all 0.3s ease'
          }}
        >
          📦 Gestione Prodotti
        </button>

        {/* ✅ NUOVO BOTTONE RINTRACCIABILITÀ */}
        <button
          onClick={() => setCurrentView('rintracciabilita')}
          style={{
            padding: '10px 20px',
            backgroundColor: currentView === 'rintracciabilita' ? '#667eea' : 'white',
            color: currentView === 'rintracciabilita' ? 'white' : '#667eea',
            border: currentView === 'rintracciabilita' ? 'none' : '2px solid #667eea',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: currentView === 'rintracciabilita' ? 'bold' : 'normal',
            transition: 'all 0.3s ease'
          }}
        >
          📋 Rintracciabilità HACCP
        </button>

        <button
          onClick={() => setCurrentView('magazzino')}
          style={{
            padding: '10px 20px',
            backgroundColor: currentView === 'magazzino' ? '#667eea' : 'white',
            color: currentView === 'magazzino' ? 'white' : '#667eea',
            border: currentView === 'magazzino' ? 'none' : '2px solid #667eea',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: currentView === 'magazzino' ? 'bold' : 'normal',
            transition: 'all 0.3s ease'
          }}
        >
          📦 Magazzino
        </button>

        {user.ruolo === 'admin' && (
          <button
            onClick={() => setCurrentView('impostazioni')}
            style={{
              padding: '10px 20px',
              backgroundColor: currentView === 'impostazioni' ? '#667eea' : 'white',
              color: currentView === 'impostazioni' ? 'white' : '#667eea',
              border: currentView === 'impostazioni' ? 'none' : '2px solid #667eea',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: currentView === 'impostazioni' ? 'bold' : 'normal',
              transition: 'all 0.3s ease'
            }}
          >
            ⚙️ Impostazioni
          </button>
        )}
      </div>

      {/* CONTENT AREA */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '0'
      }}>
        {currentView === 'ordini' && <GestoreOrdini />}
        
        {currentView === 'prodotti' && <GestioneProdotti />}
        
        {/* ✅ NUOVA VISTA RINTRACCIABILITÀ */}
        {currentView === 'rintracciabilita' && <TabellaRintracciabilita />}
        
        {currentView === 'dashboard' && (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <h2>📊 Dashboard</h2>
            <p>Statistiche e grafici in arrivo...</p>
          </div>
        )}
        
        {currentView === 'magazzino' && (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <h2>📦 Magazzino</h2>
            <p>Gestione scorte in arrivo...</p>
          </div>
        )}
        
        {currentView === 'impostazioni' && (
          <div style={{ padding: '32px' }}>
            <h2>⚙️ Impostazioni</h2>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <h3>Informazioni Sistema</h3>
              <p><strong>Versione:</strong> 2.0</p>
              <p><strong>Utente:</strong> {user.nome}</p>
              <p><strong>Ruolo:</strong> {user.ruolo}</p>
              <p><strong>Funzionalità:</strong></p>
              <ul style={{ textAlign: 'left' }}>
                <li>✅ Gestione Ordini</li>
                <li>✅ Gestione Prodotti</li>
                <li>✅ Rintracciabilità HACCP</li>
                <li>✅ Magazzino</li>
                <li>⏳ Dashboard Statistiche</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;