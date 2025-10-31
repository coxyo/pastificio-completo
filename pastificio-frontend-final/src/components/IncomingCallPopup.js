// components/IncomingCallPopup.js - Popup chiamate 3CX
import React, { useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, X, User, MapPin, Mail, Award } from 'lucide-react';

// Configura Pusher
const pusher = new Pusher('42b401f9c8d3e8e59f91', {
  cluster: 'eu',
  forceTLS: true
});

export default function IncomingCallPopup() {
  const [chiamata, setChiamata] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
    console.log('🔔 Inizializzazione listener chiamate Pusher...');

    // Sottoscrivi al canale "chiamate"
    const channel = pusher.subscribe('chiamate');

    // Listener evento "nuova-chiamata"
    channel.bind('nuova-chiamata', (data) => {
      console.log('📞 Chiamata in arrivo ricevuta:', data);
      
      setChiamata(data);
      
      // Riproduci suono notifica
      playNotificationSound();
      
      // Auto-chiudi dopo 30 secondi
      setTimeout(() => {
        setChiamata(null);
        setAudioPlaying(false);
      }, 30000);
    });

    // Cleanup
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/incoming-call.mp3');
      audio.volume = 0.8;
      audio.play();
      setAudioPlaying(true);
      
      // Loop suono ogni 3 secondi
      const interval = setInterval(() => {
        if (chiamata) {
          audio.play();
        } else {
          clearInterval(interval);
        }
      }, 3000);
    } catch (error) {
      console.warn('⚠️ Impossibile riprodurre suono:', error);
    }
  };

  const apriSchedaCliente = () => {
    if (chiamata?.cliente?._id) {
      window.location.href = `/clienti/${chiamata.cliente._id}`;
    }
  };

  const creaNuovoCliente = () => {
    const telefono = encodeURIComponent(chiamata.numero);
    window.location.href = `/clienti/nuovo?telefono=${telefono}`;
  };

  const chiudiPopup = () => {
    setChiamata(null);
    setAudioPlaying(false);
  };

  // Se nessuna chiamata, non mostrare nulla
  if (!chiamata) return null;

  const { cliente, numero, callId, timestamp } = chiamata;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <Card className="w-96 shadow-2xl border-2 border-green-500 bg-white">
        <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="h-6 w-6 animate-bounce" />
              <CardTitle className="text-xl font-bold">
                📞 CHIAMATA IN ARRIVO
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={chiudiPopup}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Numero chiamante */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 mb-1">Numero</p>
            <p className="text-2xl font-bold text-gray-900">{numero}</p>
          </div>

          {cliente ? (
            <>
              {/* Cliente trovato */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <User className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-lg text-gray-900">
                      {cliente.nome} {cliente.cognome}
                    </p>
                    {cliente.ragioneSociale && (
                      <p className="text-sm text-gray-600">{cliente.ragioneSociale}</p>
                    )}
                  </div>
                </div>

                {/* Badge livello fedeltà */}
                {cliente.livelloFedelta && (
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <Badge variant={cliente.livelloFedelta === 'oro' ? 'default' : 'secondary'}>
                      {cliente.livelloFedelta.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {cliente.punti} punti
                    </span>
                  </div>
                )}

                {/* Info cliente */}
                <div className="space-y-2 text-sm">
                  {cliente.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{cliente.email}</span>
                    </div>
                  )}
                  
                  {cliente.citta && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{cliente.citta} {cliente.provincia ? `(${cliente.provincia})` : ''}</span>
                    </div>
                  )}

                  {cliente.totaleSpesoStorico > 0 && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="text-gray-700">
                        <span className="font-semibold">Totale speso:</span>{' '}
                        <span className="text-green-600 font-bold">
                          €{cliente.totaleSpesoStorico.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Note cliente */}
              {cliente.note && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                  <p className="text-sm font-semibold text-yellow-800 mb-1">📝 Note:</p>
                  <p className="text-sm text-gray-700">{cliente.note}</p>
                </div>
              )}

              {/* Bottone azione */}
              <Button
                onClick={apriSchedaCliente}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                size="lg"
              >
                Apri Scheda Cliente
              </Button>
            </>
          ) : (
            <>
              {/* Cliente NON trovato */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <User className="h-5 w-5 text-orange-600" />
                  <p className="font-semibold text-gray-900">
                    Cliente non registrato
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  Questo numero non è presente nell'anagrafica clienti.
                </p>
              </div>

              {/* Bottone crea cliente */}
              <Button
                onClick={creaNuovoCliente}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                size="lg"
              >
                Crea Nuovo Cliente
              </Button>
            </>
          )}

          {/* Info chiamata */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              ID Chiamata: {callId}
            </p>
            <p className="text-xs text-gray-500 text-center">
              {new Date(timestamp).toLocaleString('it-IT')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Audio elemento (nascosto) */}
      {audioPlaying && (
        <audio autoPlay loop>
          <source src="/sounds/incoming-call.mp3" type="audio/mpeg" />
        </audio>
      )}
    </div>
  );
}