// app/login/page.js
'use client';

export default function LoginPage() {
  const handleLogin = () => {
    console.log('Login button clicked');
    
    // Salva i dati nel localStorage
    localStorage.setItem('token', 'test-token-123');
    localStorage.setItem('user', JSON.stringify({
      id: '1',
      username: 'admin',
      ruolo: 'admin'
    }));
    
    // Usa location.replace per un redirect completo
    window.location.replace('/dashboard');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1>Pastificio Nonna Claudia</h1>
        <h2>Accedi al Gestionale</h2>
        
        <input 
          type="text" 
          placeholder="Username" 
          value="admin"
          readOnly
          style={{
            width: '100%',
            padding: '10px',
            margin: '10px 0',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        
        <input 
          type="password" 
          placeholder="Password" 
          value="admin123"
          readOnly
          style={{
            width: '100%',
            padding: '10px',
            margin: '10px 0',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        
        <button 
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '10px',
            margin: '10px 0',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ACCEDI
        </button>
        
        <p style={{ marginTop: '20px', color: '#666' }}>
          Clicca su ACCEDI per entrare
        </p>
      </div>
    </div>
  );
}