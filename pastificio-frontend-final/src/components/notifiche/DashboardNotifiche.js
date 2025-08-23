// src/components/Notifiche/DashboardNotifiche.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const DashboardNotifiche = ({ showAlert, preferenze }) => {
  const [stats, setStats] = useState({
    email: { active: false, count: 0 },
    sms: { active: false, count: 0 },
    browser: { active: false, count: 0 },
    totali: 0,
    successo: 0,
    fallite: 0
  });
  const [loading, setLoading] = useState(true);
  const [prossimieventi, setProssimiEventi] = useState([]);

  useEffect(() => {
    // Simula il caricamento dei dati
    const timer = setTimeout(() => {
      caricaDati();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const caricaDati = async () => {
    try {
      // Carica preferenze da localStorage se non passate come prop
      const savedPreferences = localStorage.getItem('notificationPreferences');
      const prefs = preferenze || (savedPreferences ? JSON.parse(savedPreferences) : null);
      
      // Simula dati per la dashboard
      setStats({
        email: { active: prefs?.email?.abilitato || false, count: 0 },
        sms: { active: prefs?.sms?.abilitato || false, count: 0 },
        browser: { active: prefs?.push?.abilitato || false, count: 0 },
        totali: 0,
        successo: 0,
        fallite: 0
      });

      // Simula eventi programmati
      setProssimiEventi([
        {
          id: 1,
          tipo: 'Report Giornaliero',
          ora: 'Ogni giorno alle 07:00',
          icon: <Clock className="h-4 w-4" />
        },
        {
          id: 2,
          tipo: 'Controllo Scorte',
          ora: 'Ogni ora',
          icon: <AlertCircle className="h-4 w-4" />
        },
        {
          id: 3,
          tipo: 'Controllo Scadenze',
          ora: 'Ogni giorno alle 08:00',
          icon: <Clock className="h-4 w-4" />
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Errore caricamento dati dashboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stato Canali */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Stato Canali di Notifica</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <div className={`h-2 w-2 rounded-full ${stats.email.active ? 'bg-green-500' : 'bg-red-500'}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {stats.email.active ? 'Attivo' : 'Disattivato'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  SMS
                </div>
                <div className={`h-2 w-2 rounded-full ${stats.sms.active ? 'bg-green-500' : 'bg-red-500'}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {stats.sms.active ? 'Attivo' : 'Disattivato'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Browser
                </div>
                <div className={`h-2 w-2 rounded-full ${stats.browser.active ? 'bg-green-500' : 'bg-red-500'}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {stats.browser.active ? 'Attivo' : 'Disattivato'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Statistiche */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Statistiche</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notifiche Totali</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totali}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tasso di Successo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {stats.totali > 0 ? Math.round((stats.successo / stats.totali) * 100) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notifiche Recenti */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Notifiche Recenti</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8 text-gray-500">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>Nessuna notifica recente</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prossimi Eventi */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Prossimi Eventi Programmati
        </h3>
        <div className="space-y-3">
          {prossimieventi.map(evento => (
            <Card key={evento.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {evento.icon}
                    <div>
                      <p className="font-medium">{evento.tipo}</p>
                      <p className="text-sm text-gray-600">{evento.ora}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardNotifiche;