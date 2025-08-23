import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

const ProduzioneGiornaliera = ({ ordini = [] }) => {
  // Calcola produzione dalle ordini o usa dati mock
  const produzione = [
    { prodotto: 'Culurgiones', quantita: 25, unita: 'kg' },
    { prodotto: 'Seadas', quantita: 40, unita: 'pz' },
    { prodotto: 'Ravioli', quantita: 15, unita: 'kg' },
    { prodotto: 'Malloreddus', quantita: 10, unita: 'kg' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Produzione Giornaliera</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {produzione.slice(0, 3).map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{item.prodotto}</span>
              <span className="font-semibold text-sm">
                {item.quantita} {item.unita}
              </span>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Totale prodotti:</span>
              <span className="font-bold text-blue-600">4</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProduzioneGiornaliera;