import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

const GraficoTrend = ({ ordini = [] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Trend Settimanale</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-32 flex items-center justify-center text-gray-400">
          Grafico trend in sviluppo
        </div>
      </CardContent>
    </Card>
  );
};

export default GraficoTrend;