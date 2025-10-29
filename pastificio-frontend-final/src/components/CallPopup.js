// components/CallPopup.js - VERSIONE SEMPLIFICATA SENZA UI COMPONENTS
import { useState, useEffect } from 'react';
import { Phone, User, ShoppingCart, X, Star } from 'lucide-react';

export default function CallPopup({ chiamata, onClose, onSaveNote }) {
  if (!chiamata) return null;

  // Estrai dati cliente
  const cliente = chiamata?.cliente;
  const numero = chiamata?.numero || 'Numero sconosciuto';

  // Nome completo
  const nomeCompleto = cliente 
    ? `${cliente.nome || ''} ${cliente.cognome || ''}`.trim() || 'Cliente Sconosciuto'
    : 'Cliente Sconosciuto';

  // Iniziali
  const iniziali = cliente
    ? `${(cliente.nome?.[0] || '')}${(cliente.cognome?.[0] || '')}`.toUpperCase() || '?'
    : '?';

  // Livello fedeltà
  const livelloColors = {
    'bronze': 'bg-orange-500',
    'argento': 'bg-gray-400',
    'oro': 'bg-yellow-500',
    'platino': 'bg-purple-500',
    'base': 'bg-gray-300'
  };

  const livelloFedelta = cliente?.livelloFedelta || 'base';
  const badgeColor = livelloColors[livelloFedelta.toLowerCase()] || 'bg-gray-300';

  // Statistiche
  const punti = cliente?.punti || 0;
  const totaleSpeso = cliente?.totaleSpesoStorico || 0;
  const codiceCliente = cliente?.codiceCliente || 'N/A';

  // Handlers
  const handleNuovoOrdine = () => {
    if (cliente) {
      window.location.href = `/?cliente=${cliente._id}`;
    } else {
      window.location.href = '/';
    }
    onClose();
  };

  const handleAprirScheda = () => {
    if (cliente?._id) {
      window.location.href = `/clienti?id=${cliente._id}`;
    }
    onClose();
  };

  // Audio notification
  useEffect(() => {
    if (chiamata) {
      try {
        const audio = new Audio('/sounds/incoming-call.mp3');
        audio.volume = 0.5;
        audio.play().catch(err => console.warn('⚠️ Audio non disponibile'));
      } catch (error) {
        // Ignora errori audio
      }
    }
  }, [chiamata]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600 animate-pulse" />
            <h2 className="text-xl font-semibold">Chiamata in arrivo</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Numero */}
        <p className="text-sm text-gray-500">{numero}</p>

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
                <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold border border-gray-300 rounded">
                  {livelloFedelta.toUpperCase()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Statistiche */}
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

        {/* Info aggiuntive */}
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

        {/* Alert cliente non trovato */}
        {!cliente && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Cliente non trovato nel database. Puoi comunque creare un nuovo ordine.
            </p>
          </div>
        )}

        {/* Pulsanti */}
        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <X className="h-4 w-4" />
            Ignora
          </button>

          {cliente && (
            <button
              onClick={handleAprirScheda}
              className="flex-1 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <User className="h-4 w-4" />
              Scheda
            </button>
          )}

          <button
            onClick={handleNuovoOrdine}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Ordine
          </button>
        </div>
      </div>
    </div>
  );
}