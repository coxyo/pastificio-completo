import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

const UltimiMovimenti = () => {
  const movimenti = [
    { tipo: 'entrata', descrizione: 'Farina 00', quantita: '+50 kg', ora: '10:30' },
    { tipo: 'uscita', descrizione: 'Culurgiones', quantita: '-20 kg', ora: '11:45' },
    { tipo: 'entrata', descrizione: 'Uova', quantita: '+200 pz', ora: '14:20' },
    { tipo: 'uscita', descrizione: 'Seadas', quantita: '-30 pz', ora: '15:00' }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">📋 Ultimi Movimenti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {movimenti.slice(0, 4).map((mov, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  mov.tipo === 'entrata' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-gray-600">{mov.descrizione}</span>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  mov.tipo === 'entrata' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {mov.quantita}
                </p>
                <p className="text-xs text-gray-400">{mov.ora}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UltimiMovimenti;