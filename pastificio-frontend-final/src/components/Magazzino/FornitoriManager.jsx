import React from 'react';
import { Button } from '../ui/button';

const FornitoriManager = ({ fornitori, onAddClick, onEditClick, onDeleteClick, isLoading }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Fornitori</h2>
        <Button onClick={onAddClick}>
          Aggiungi Fornitore
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Nome</th>
              <th className="border p-2 text-left">Referente</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Telefono</th>
              <th className="border p-2 text-left">Indirizzo</th>
              <th className="border p-2 text-left">Note</th>
              <th className="border p-2 text-left">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {fornitori.map(fornitore => (
              <tr key={fornitore.id}>
                <td className="border p-2 font-medium">{fornitore.nome}</td>
                <td className="border p-2">{fornitore.referente || '-'}</td>
                <td className="border p-2">
                  <a 
                    href={`mailto:${fornitore.email}`} 
                    className="text-blue-600 hover:underline"
                  >
                    {fornitore.email}
                  </a>
                </td>
                <td className="border p-2">
                  <a 
                    href={`tel:${fornitore.telefono}`} 
                    className="text-blue-600 hover:underline"
                  >
                    {fornitore.telefono}
                  </a>
                </td>
                <td className="border p-2">{fornitore.indirizzo || '-'}</td>
                <td className="border p-2">{fornitore.note || '-'}</td>
                <td className="border p-2">
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => onEditClick(fornitore)}
                      variant="outline" 
                      size="sm"
                    >
                      Modifica
                    </Button>
                    <Button 
                      onClick={() => onDeleteClick(fornitore.id)}
                      variant="destructive" 
                      size="sm"
                    >
                      Elimina
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {fornitori.length === 0 && (
              <tr>
                <td colSpan="7" className="border p-2 text-center">
                  {isLoading ? 'Caricamento in corso...' : 'Nessun fornitore trovato'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Statistiche */}
      {fornitori.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-bold text-blue-700 mb-2">Totale Fornitori</h3>
            <p className="text-2xl font-bold">{fornitori.length}</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <h3 className="font-bold text-green-700 mb-2">Fornitori con Email</h3>
            <p className="text-2xl font-bold">
              {fornitori.filter(f => f.email && f.email.trim() !== '').length}
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h3 className="font-bold text-purple-700 mb-2">Fornitori con Referente</h3>
            <p className="text-2xl font-bold">
              {fornitori.filter(f => f.referente && f.referente.trim() !== '').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FornitoriManager;