import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';

const AlertScorte = ({ onOpenMagazzino }) => {
  const scorteInEsaurimento = [
    { nome: 'Farina 00', quantita: 15, minimo: 50, unita: 'kg' },
    { nome: 'Semola', quantita: 8, minimo: 20, unita: 'kg' },
    { nome: 'Uova', quantita: 30, minimo: 100, unita: 'pz' }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex justify-between items-center">
          ⚠️ Alert Scorte
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
            {scorteInEsaurimento.length} critiche
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-3">
          {scorteInEsaurimento.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{item.nome}</span>
              <span className="text-red-600 font-semibold">
                {item.quantita}/{item.minimo} {item.unita}
              </span>
            </div>
          ))}
        </div>
        <Button 
          onClick={onOpenMagazzino}
          className="w-full h-8 text-xs"
          variant="outline"
        >
          Vai al Magazzino
        </Button>
      </CardContent>
    </Card>
  );
};

export default AlertScorte;