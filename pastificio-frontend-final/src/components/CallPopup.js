// components/CallPopup.js - VERSIONE SEMPLIFICATA v4.0
// ✅ Popup chiamata in arrivo

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, X, User } from 'lucide-react';

export function CallPopup({ 
  isOpen = false, 
  onClose = () => {}, 
  onAccept = () => {}, 
  callData = null 
}) {
  if (!callData) return null;

  const { numero, cliente } = callData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
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
                  {cliente.codice && (
                    <p className="text-sm text-green-700">
                      Codice: {cliente.codice}
                    </p>
                  )}
                  {cliente.livello && (
                    <p className="text-sm text-green-700">
                      Livello: {cliente.livello}
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
                    Cliente non trovato nel database. Puoi comunque creare un nuovo ordine.
                  </p>
                </div>
              </div>
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
              Ordine
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CallPopup;
