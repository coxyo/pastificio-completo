// components/CallPopup.js - VERSIONE CON NOTE AUTOMATICHE
import React from 'react';
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
  if (!callData) return null;

  const { numero, cliente, noteAutomatiche } = callData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-500 animate-pulse" />
            Chiamata in arrivo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Numero chiamante */}
          <div className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900">
              {numero}
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

          {/* ✅ NUOVO: Note automatiche */}
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

          {/* ✅ NUOVO: Storico chiamate */}
          {cliente && (
            <div className="border-t pt-4">
              <StoricoChiamate clienteId={cliente._id} numero={numero} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Ignora
            </Button>
            <Button
              onClick={onAccept}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Phone className="w-4 h-4 mr-2" />
              Nuovo Ordine
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CallPopup;
