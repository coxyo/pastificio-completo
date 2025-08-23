import React from 'react';
import { Card } from '../ui/card';

const DashboardMagazzino = ({ ingredienti, fornitori, movimenti }) => {
  // Calcola statistiche
  const ingredientiSottoSoglia = ingredienti.filter(i => i.quantita <= i.soglia);
  
  const valoreInventario = ingredienti.reduce((acc, ing) => {
    return acc + (ing.prezzoUnitario || 0) * (ing.quantita || 0);
  }, 0);
  
  const movimentiRecenti = movimenti
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 5);
  
  const movimentiOggi = movimenti.filter(m => {
    const oggi = new Date().toISOString().split('T')[0];
    return m.data.startsWith(oggi);
  });
  
  const caricamentiOggi = movimentiOggi
    .filter(m => m.tipo === 'carico')
    .reduce((acc, m) => acc + m.quantita, 0);
  
  const scarichiOggi = movimentiOggi
    .filter(m => m.tipo === 'scarico')
    .reduce((acc, m) => acc + m.quantita, 0);

  return (
    <div className="mb-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-500 text-white p-4">
          <h3 className="font-bold mb-2">Ingredienti</h3>
          <p className="text-3xl font-bold">{ingredienti.length}</p>
        </Card>
        
        <Card className="bg-green-500 text-white p-4">
          <h3 className="font-bold mb-2">Valore Inventario</h3>
          <p className="text-3xl font-bold">€{valoreInventario.toFixed(2)}</p>
        </Card>
        
        <Card className="bg-red-500 text-white p-4">
          <h3 className="font-bold mb-2">Sotto Soglia</h3>
          <p className="text-3xl font-bold">{ingredientiSottoSoglia.length}</p>
        </Card>
        
        <Card className="bg-yellow-500 text-white p-4">
          <h3 className="font-bold mb-2">Fornitori</h3>
          <p className="text-3xl font-bold">{fornitori.length}</p>
        </Card>
      </div>
      
      {/* Seconda riga di statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Riepilogo movimenti di oggi */}
        <Card className="p-4">
          <h3 className="text-lg font-bold mb-3">Movimenti Oggi</h3>
          <div className="flex justify-between items-center">
            <div className="text-center p-3 bg-green-100 rounded-lg">
              <p className="text-sm text-green-700">Carico</p>
              <p className="text-xl font-bold text-green-600">{caricamentiOggi.toFixed(2)}</p>
            </div>
            <div className="text-center p-3 bg-red-100 rounded-lg">
              <p className="text-sm text-red-700">Scarico</p>
              <p className="text-xl font-bold text-red-600">{scarichiOggi.toFixed(2)}</p>
            </div>
            <div className="text-center p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-700">Saldo</p>
              <p className="text-xl font-bold text-blue-600">{(caricamentiOggi - scarichiOggi).toFixed(2)}</p>
            </div>
          </div>
        </Card>
        
        {/* Ultimi movimenti */}
        <Card className="p-4">
          <h3 className="text-lg font-bold mb-3">Ultimi Movimenti</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-2 py-1">Data</th>
                  <th className="px-2 py-1">Tipo</th>
                  <th className="px-2 py-1">Ingrediente</th>
                  <th className="px-2 py-1">Quantità</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {movimentiRecenti.map(movimento => {
                  const ingrediente = ingredienti.find(i => i.id === movimento.ingredienteId);
                  return (
                    <tr key={movimento.id}>
                      <td className="px-2 py-1 whitespace-nowrap text-sm">{new Date(movimento.data).toLocaleDateString()}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-sm">
                        <span className={`inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1 ${
                          movimento.tipo === 'carico' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {movimento.tipo === 'carico' ? 'Carico' : 'Scarico'}
                        </span>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-sm">{ingrediente?.nome || 'N/A'}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-sm">{movimento.quantita} {ingrediente?.unitaMisura || ''}</td>
                    </tr>
                  );
                })}
                {movimentiRecenti.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-2 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      Nessun movimento recente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      
      {/* Ingredienti sotto soglia */}
      {ingredientiSottoSoglia.length > 0 && (
        <Card className="p-4 mt-4">
          <h3 className="text-lg font-bold text-red-600 mb-3">
            Ingredienti Sotto Scorta Minima
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-2 py-1">Nome</th>
                  <th className="px-2 py-1">Categoria</th>
                  <th className="px-2 py-1">Quantità</th>
                  <th className="px-2 py-1">Soglia</th>
                  <th className="px-2 py-1">Fornitore</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ingredientiSottoSoglia.map(ingrediente => {
                  const fornitore = fornitori.find(f => f.id === ingrediente.fornitoreId);
                  return (
                    <tr key={ingrediente.id} className="bg-red-50">
                      <td className="px-2 py-1 whitespace-nowrap text-sm font-medium">{ingrediente.nome}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-sm">{ingrediente.categoria}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-sm font-bold text-red-600">
                        {ingrediente.quantita} {ingrediente.unitaMisura}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-sm">{ingrediente.soglia} {ingrediente.unitaMisura}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-sm">{fornitore?.nome || 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardMagazzino;