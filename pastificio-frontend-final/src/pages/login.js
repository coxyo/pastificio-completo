// src/pages/login.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Restaurant as RestaurantIcon
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Verifica se già loggato
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prova auto-login
      if (username.toLowerCase() === 'admin') {
        const autoLoginResponse = await fetch(`${API_URL}/auth/auto-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'admin',
            autoLoginKey: password
          })
        });

        const autoLoginData = await autoLoginResponse.json();

        if (autoLoginData.success && autoLoginData.token) {
          localStorage.setItem('token', autoLoginData.token);
          localStorage.setItem('user', JSON.stringify(autoLoginData.user));
          
          console.log('✅ Auto-login riuscito');
          router.push('/');
          return;
        }
      }

      // Login normale
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login fallito');
      }

      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('✅ Login riuscito');
        router.push('/');
      } else {
        throw new Error('Token non ricevuto');
      }

    } catch (error) {
      console.error('❌ Errore login:', error);
      setError(error.message || 'Errore durante il login. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoLoginQuick = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/auto-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          autoLoginKey: 'pastificio2024'
        })
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('✅ Auto-login veloce riuscito');
        router.push('/');
      } else {
        throw new Error('Auto-login fallito');
      }
    } catch (error) {
      console.error('❌ Errore auto-login:', error);
      setError('Errore auto-login. Usa il form manuale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'white'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <RestaurantIcon sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Pastificio Nonna Claudia
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sistema Gestionale
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              autoComplete="username"
              autoFocus
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)'
                }
              }}
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Oppure
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleAutoLoginQuick}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              🚀 Auto-Login Veloce
            </Button>
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              <strong>Credenziali:</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Username: <code>admin</code>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Password: <code>pastificio2024</code>
            </Typography>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              © 2025 Pastificio Nonna Claudia
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
```

---

## 📝 PASSO 2: Modifica `App.js` (NON _app.js)

Modifica il tuo file esistente:
```
C:\Users\Maurizio Mameli\pastificio-completo\pastificio-frontend-final\src\pages\App.js