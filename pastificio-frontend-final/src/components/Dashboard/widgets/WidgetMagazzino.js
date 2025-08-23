import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';

const WidgetMagazzino = ({ onNavigateToMagazzino }) => {
  const riepilogoMagazzino = {
    prodottiTotali: 42,
    prodottiSottoScorta: 3,
    valoreInventario: 2450,
    ultimoAggiornamento: 'Oggi, 14:30'
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">📦 Stato Magazzino</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-600">Prodotti</p>
              <p className="font-bold text-lg">{riepilogoMagazzino.prodottiTotali}</p>
            </div>
            <div>
              <p className="text-gray-600">Sotto scorta</p>
              <p className="font-bold text-lg text-orange-600">
                {riepilogoMagazzino.prodottiSottoScorta}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500">
              Valore inventario: €{riepilogoMagazzino.valoreInventario}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Aggiornato: {riepilogoMagazzino.ultimoAggiornamento}
            </p>
          </div>
          <Button 
            onClick={onNavigateToMagazzino}
            className="w-full h-8 text-xs"
            variant="outline"
          >
            Gestisci Inventario
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WidgetMagazzino;