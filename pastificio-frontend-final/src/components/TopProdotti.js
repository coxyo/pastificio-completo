// src/components/TopProdotti.js
import React from 'react';
import { Card } from './ui/card';

const TopProdotti = ({ prodotti = [] }) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Prodotti Più Venduti</h3>
      <div className="divide-y">
        {prodotti.map((prodotto) => (
          <div key={prodotto._id} className="py-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{prodotto._id}</span>
              <span>{prodotto.quantitaTotale} pz</span>
            </div>
            <div className="text-sm text-gray-600">
              €{prodotto.valoreTotale.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TopProdotti;