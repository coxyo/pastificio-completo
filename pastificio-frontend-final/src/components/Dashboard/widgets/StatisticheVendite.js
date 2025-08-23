import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

const StatisticheVendite = ({ ordini = [], periodo = 'oggi' }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Statistiche {periodo}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Ordini:</span>
            <span className="font-semibold">0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Incasso:</span>
            <span className="font-semibold">0 €</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatisticheVendite;