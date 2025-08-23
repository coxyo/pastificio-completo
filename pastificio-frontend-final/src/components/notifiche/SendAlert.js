// src/components/Notifiche/SendAlert.js
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Send, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import loggingService from '../../services/loggingService';

export default function SendAlert({ showAlert, onAlertSent }) {
  const [formData, setFormData] = useState({
    titolo: '',
    messaggio: '',
    tipo: 'info',
    canale: 'email'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // Verifica se siamo in modalità demo al mount
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setDemoMode(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Rimuovi errore quando l'utente inizia a digitare
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validazione
    if (!formData.titolo.trim()) {
      setError('Il titolo è obbligatorio');
      return;
    }
    
    if (!formData.messaggio.trim()) {
      setError('Il messaggio è obbligatorio');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      if (!token || demoMode) {
        // Modalità demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSuccess(true);
        
        if (showAlert) {
          showAlert('Alert inviato con successo! (Modalità Demo)', 'success');
        }
        
        // Log dell'invio
        loggingService.log('info', 'Alert inviato (demo)', formData);
        
        // Reset form dopo 2 secondi
        setTimeout(() => {
          setFormData({
            titolo: '',
            messaggio: '',
            tipo: 'info',
            canale: 'email'
          });
          setSuccess(false);
        }, 2000);
        
        if (onAlertSent) {
          onAlertSent({
            success: true,
            demo: true,
            data: formData,
            timestamp: new Date().toISOString()
          });
        }
        
        return;
      }
      
      // Chiamata API reale
      const response = await fetch(`${API_URL}/api/notifiche/send-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString()
        })
      });

      // Log della risposta per debug
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      // Accetta come successo anche status 200-299
      if (response.ok || data.success) {
        setSuccess(true);
        
        const messaggioSuccesso = data.risultati 
          ? `Alert inviato con successo! (${data.risultati.inviate} notifiche inviate)`
          : 'Alert inviato con successo!';
        
        if (showAlert) {
          showAlert(messaggioSuccesso, 'success');
        }
        
        // Log dell'invio
        loggingService.log('info', 'Alert inviato con successo', {
          ...formData,
          risultati: data.risultati
        });
        
        // Reset form dopo 2 secondi
        setTimeout(() => {
          setFormData({
            titolo: '',
            messaggio: '',
            tipo: 'info',
            canale: 'email'
          });
          setSuccess(false);
        }, 2000);
        
        if (onAlertSent) {
          onAlertSent(data);
        }
        
        // Aggiorna lo storico
        window.dispatchEvent(new CustomEvent('refreshStoricoNotifiche'));
      } else {
        throw new Error(data.error || data.message || 'Errore invio notifica');
      }
      
    } catch (error) {
      console.error('Errore invio alert:', error);
      
      // Gestione errori specifici
      let errorMessage = 'Errore durante l\'invio dell\'alert';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Impossibile contattare il server. Verifica la connessione.';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Sessione scaduta. Effettua nuovamente il login.';
        // Rimuovi il token non valido
        localStorage.removeItem('token');
        setDemoMode(true);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      if (showAlert) {
        showAlert(errorMessage, 'error');
      }
      
      // Log dell'errore
      loggingService.log('error', 'Errore invio alert', {
        error: error.message,
        formData
      });
    } finally {
      setLoading(false);
    }
  };

  const getIconByType = () => {
    switch(formData.tipo) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Invia Alert
          {demoMode && (
            <span className="text-sm font-normal text-gray-500 ml-2">(Modalità Demo)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Alert inviato con successo!
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="titolo">Titolo *</Label>
            <Input
              id="titolo"
              name="titolo"
              value={formData.titolo}
              onChange={handleChange}
              placeholder="Inserisci il titolo dell'alert"
              required
              disabled={loading}
              className={error && !formData.titolo ? 'border-red-500' : ''}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="messaggio">Messaggio *</Label>
            <textarea
              id="messaggio"
              name="messaggio"
              value={formData.messaggio}
              onChange={handleChange}
              placeholder="Inserisci il messaggio"
              required
              rows={4}
              disabled={loading}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error && !formData.messaggio ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <div className="flex items-center gap-2">
                {getIconByType()}
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  disabled={loading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="info">Info</option>
                  <option value="success">Successo</option>
                  <option value="warning">Avviso</option>
                  <option value="error">Errore</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="canale">Canale di invio</Label>
              <select
                id="canale"
                name="canale"
                value={formData.canale}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Notifica Push</option>
                <option value="broadcast">Tutti i canali</option>
              </select>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={loading || (!formData.titolo.trim() || !formData.messaggio.trim())}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Invio in corso...' : 'Invia Alert'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}