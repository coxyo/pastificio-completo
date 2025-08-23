// src/components/Notifiche/StoricoNotifiche.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { 
  History, 
  RefreshCw, 
  Mail, 
  MessageSquare, 
  Bell,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import loggingService from '../../services/loggingService';

const StoricoNotifiche = ({ showAlert, onRefresh }) => {
  const [notifiche, setNotifiche] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    caricaStorico();
    
    // Listener per refresh forzato
    const handleRefresh = () => caricaStorico();
    window.addEventListener('refreshStoricoNotifiche', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshStoricoNotifiche', handleRefresh);
    };
  }, []);

  const caricaStorico = async (append = false) => {
    setLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Se non c'è token, mostra dati di esempio
        setNotifiche([
          {
            _id: '1',
            type: 'Demo',
            channel: 'email',
            success: true,
            sentAt: new Date().toISOString()
          }
        ]);
        setHasMore(false);
        return;
      }
      
      const response = await fetch(
        `${API_URL}/api/notifiche/history?skip=${append ? skip : 0}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Se l'endpoint non esiste, mostra array vuoto
          setNotifiche([]);
          setHasMore(false);
          return;
        }
        throw new Error('Errore nel caricamento dello storico');
      }

      const data = await response.json();
      
      if (data.success) {
        if (append) {
          setNotifiche(prev => [...prev, ...(data.history || [])]);
        } else {
          setNotifiche(data.history || []);
        }
        
        setHasMore(data.history && data.history.length === limit);
        setSkip(append ? skip + limit : limit);
        
        loggingService.log('info', 'Storico notifiche caricato', {
          count: data.history ? data.history.length : 0,
          total: data.total
        });
      }
    } catch (error) {
      console.error('Errore caricamento storico:', error);
      // Non mostrare errore, solo array vuoto
      setNotifiche([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSkip(0);
    caricaStorico(false);
    if (onRefresh) {
      onRefresh();
    }
  };

  const loadMore = () => {
    caricaStorico(true);
  };

  const getIcon = (canale) => {
    switch (canale) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'push':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (success) => {
    return success 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Data non disponibile';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Storico Notifiche
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {notifiche.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nessuna notifica nello storico</p>
          </div>
        )}

        <div className="space-y-3">
          {notifiche.map((notifica, index) => (
            <div
              key={notifica._id || index}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getIcon(notifica.channel)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {notifica.type || 'Notifica'}
                      </span>
                      {getStatusIcon(notifica.success)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Canale: {notifica.channel}
                    </p>
                    {notifica.error && (
                      <p className="text-sm text-red-600 mt-1">
                        Errore: {notifica.error}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatDate(notifica.sentAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && notifiche.length > 0 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Caricamento...' : 'Carica altre'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StoricoNotifiche;