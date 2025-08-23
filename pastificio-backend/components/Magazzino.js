import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui';

const Dashboard = () => {
  const [stats, setStats] = useState({
    ordiniOggi: 12,
    inLavorazione: 5,
    valoreInventario: 3250.75,
    ingredientiCritici: 3
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card Ordini Oggi */}
        <Card className="bg-blue-500 text-white">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Ordini Oggi</h3>
            <p className="text-5xl font-bold">{stats.ordiniOggi}</p>
          </CardContent>
        </Card>
        
        {/* Card In Lavorazione */}
        <Card className="bg-orange-500 text-white">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">In Lavorazione</h3>
            <p className="text-5xl font-bold">{stats.inLavorazione}</p>
          </CardContent>
        </Card>
        
        {/* Card Valore Inventario */}
        <Card className="bg-green-500 text-white">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-