// components/CallPopup.js - VERSIONE CORRETTA
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, User, ShoppingCart, X, Star } from 'lucide-react';

export default function CallPopup({ chiamata, onClose, onSaveNote }) {
  const [loading, setLoading] = useState(false);

  // Estrai dati cliente dal payload
  const cliente = chiamata?.cliente;
  const numero = chiamata?.numero || 'Numero sconosciuto';
  const callId = chiamata?.callId;

  // Determina nome completo
  const nomeCompleto = cliente 
    ? `${cliente.nome || ''} ${cliente.cognome || ''}`.trim() || 'Cliente Sconosciuto'
    : 'Cliente Sconosciuto';

  // Iniziali per badge
  const iniziali = cliente
    ? `${(cliente.nome?.[0] || '')}${(cliente.cognome?.[0] || '')}`.toUpperCase() || '?'
    : '?';

  // Livello fedeltà con colori
  const livelloColors = {
    'bronze': 'bg-orange-500',
    'argento': 'bg-gray-400',
    'oro': 'bg-yellow-500',
    'platino': 'bg-purple-500',
    'base': 'bg-gray-300'
  };

  const livelloFedelta = cliente?.livelloFedelta || 'base';
  const badgeColor = livelloColors[livelloFedelta.toLowerCase()] || 'bg-gray-300';

  // Statistiche cliente
  const punti = cliente?.punti || 0;
  const totaleSpeso = cliente?.totaleSpesoStorico || 0;
  const codiceCliente = cliente?.codiceCliente || 'N/A';

  // Handler nuovo ordine
  const handleNuovoOrdine = () => {
    if (cliente) {
      // Naviga a pagina ordini con cliente preselezionato
      window.location.href = `/?cliente=${cliente._id}`;
    } else {
      // Apri form nuovo ordine senza cliente
      window.location.href = '/';
    }
    onClose();
  };

  // Handler apri scheda cliente
  const handleAprirScheda = () => {
    if (cliente?._id) {
      window.location.href = `/clienti?id=${cliente._id}`;
    }
    onClose();
  };

  // Audio notification (opzionale)
  useEffect(() => {
    if (chiamata) {
      try {
        const audio = new Audio('/sounds/incoming-call.mp3');
        audio.volume = 0.5;
        audio.play().catch(err => console.warn('⚠️ Audio non disponibile:', err));
      } catch (error) {
        console.warn('⚠️ Impossibile riprodurre audio:', error);
      }
    }
  }, [chiamata]);

  if (!chiamata) return null;

  return (
    <Dialog open={!!chiamata} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600 animate-pulse" />
            Chiamata in arrivo
          </DialogTitle>
          <DialogDescription>
            {numero}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Badge Cliente */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full ${badgeColor} flex items-center justify-center text-white text-2xl font-bold`}>
              {iniziali}
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{nomeCompleto}</h3>
              {cliente && (
                <>
                  <p className="text-sm text-gray-500">{codiceCliente}</p>
                  <Badge variant="outline" className="mt-1">
                    {livelloFedelta.toUpperCase()}
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Statistiche Cliente */}
          {cliente && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Punti</p>
                <p className="text-xl font-bold flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {punti}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Totale Speso</p>
                <p className="text-xl font-bold">€{totaleSpeso.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Informazioni Aggiuntive */}
          {cliente && (
            <div className="text-sm space-y-1">
              {cliente.email && (
                <p className="text-gray-600">📧 {cliente.email}</p>
              )}
              {cliente.citta && (
                <p className="text-gray-600">📍 {cliente.citta}</p>
              )}
            </div>
          )}

          {/* Alert se cliente non trovato */}
          {!cliente && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Cliente non trovato nel database. Puoi comunque creare un nuovo ordine.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Ignora
          </Button>

          {cliente && (
            <Button
              variant="secondary"
              onClick={handleAprirScheda}
              className="flex-1"
            >
              <User className="h-4 w-4 mr-2" />
              Scheda Cliente
            </Button>
          )}

          <Button
            onClick={handleNuovoOrdine}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Nuovo Ordine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}