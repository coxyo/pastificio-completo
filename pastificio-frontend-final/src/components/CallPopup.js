// components/CallPopup.js - VERSIONE DEBUG AVANZATA
import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, X, User, AlertCircle } from 'lucide-react';
import StoricoChiamate from './StoricoChiamate';

export function CallPopup({ isOpen, onClose, onAccept, callData }) {
  // 🔍 DEBUG: Log ogni render del componente
  useEffect(() => {
    console.log('🚨🚨🚨 CALLPOPUP RENDER 🚨🚨🚨');
    console.log('📞 isOpen:', isOpen);
    console.log('📞 callData:', callData);
    console.log('📞 onClose:', typeof onClose);
    console.log('📞 onAccept:', typeof onAccept);
  }, [isOpen, callData, onClose, onAccept]);

  // 🔍 DEBUG: Log specifico quando isOpen cambia
  useEffect(() => {
    if (isOpen) {
      console.log('✅✅✅ POPUP DOVREBBE ESSERE VISIBILE! ✅✅✅');
      console.log('CallData ricevuto:', JSON.stringify(callData, null, 2));
    } else {
      console.log('❌❌❌ POPUP CHIUSO ❌❌❌');
    }
  }, [isOpen, callData]);

  // 🔍 DEBUG: Alert browser per forzare visualizzazione
  useEffect(() => {
    if (isOpen && callData) {
      // Commenta dopo il test!
      // alert('🚨 POPUP DOVREBBE APRIRSI!\nNumero: ' + callData.numero);
      console.log('🔔 ALERT TEST: Popup sta per aprirsi per:', callData.numero);
    }
  }, [isOpen, callData]);

  // Guard: Se non ci sono dati, non renderizzare
  if (!callData) {
    console.warn('⚠️ CallPopup: callData è null/undefined!');
    return null;
  }

  const { numero, cliente, noteAutomatiche } = callData;

  console.log('🎨 Rendering CallPopup con dati:', { numero, cliente: !!cliente });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* 🔍 DEBUG: Indicatore visibile sempre */}
        <div className="absolute top-0 left-0 w-full h-2 bg-red-500 animate-pulse" />
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-500 animate-pulse" />
            🚨 DEBUG MODE - Chiamata in arrivo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Numero chiamante */}
          <div className="text-center py-4 bg-yellow-100 border-4 border-yellow-500">
            <p className="text-3xl font-bold text-red-600">
              {numero || 'NUMERO MANCANTE'}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Debug: isOpen={String(isOpen)}, callData={callData ? 'OK' : 'NULL'}
            </p>
          </div>

          {/* Dati cliente */}
          {cliente ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900">
                    {cliente.nome} {cliente.cognome || ''}
                  </p>
                  {cliente.codiceCliente && (
                    <p className="text-sm text-green-700">
                      Codice: {cliente.codiceCliente}
                    </p>
                  )}
                  {cliente.livelloFedelta && (
                    <p className="text-sm text-green-700">
                      Livello: {cliente.livelloFedelta}
                    </p>
                  )}
                  {cliente.email && (
                    <p className="text-sm text-green-700">
                      {cliente.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900">
                    Cliente Sconosciuto
                  </p>
                  <p className="text-sm text-yellow-700">
                    Cliente non trovato nel database
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Note automatiche */}
          {noteAutomatiche && noteAutomatiche.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <p className="font-semibold text-blue-900">Note Automatiche</p>
              </div>
              {noteAutomatiche.map((nota, index) => (
                <div key={index} className="text-sm text-blue-800 pl-7">
                  {nota.messaggio}
                </div>
              ))}
            </div>
          )}

          {/* Storico chiamate */}
          {cliente && (
            <div className="border-t pt-4">
              <StoricoChiamate clienteId={cliente._id} numero={numero} />
            </div>
          )}

          {/* Actions - CON DEBUG */}
          <div className="flex gap-3">
            <Button
              onClick={() => {
                console.log('🔴 IGNORA CHIAMATA CLICCATO');
                onClose();
              }}
              variant="outline"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Ignora
            </Button>
            <Button
              onClick={() => {
                console.log('🟢 ACCETTA CHIAMATA CLICCATO');
                onAccept();
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Phone className="w-4 h-4 mr-2" />
              Nuovo Ordine
            </Button>
          </div>

          {/* 🔍 DEBUG INFO PANEL */}
          <div className="bg-gray-100 p-3 rounded text-xs font-mono space-y-1">
            <p><strong>Debug Info:</strong></p>
            <p>isOpen: {String(isOpen)}</p>
            <p>numero: {numero}</p>
            <p>cliente: {cliente ? 'TROVATO' : 'NON TROVATO'}</p>
            <p>callData: {callData ? 'OK' : 'NULL'}</p>
            <p>timestamp: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CallPopup;
