import React from 'react';
import { Button } from '../ui/button';

const IngredientList = ({ ingredienti, onAddClick, onEditClick, onDeleteClick, isLoading }) => {
  // Calcola il valore totale di ogni ingrediente
  const calcolaValore = (ing) => {
    return (ing.prezzoUnitario || 0) * (ing.quantita || 0);
  };
  
  // Ottieni le categorie uniche per il filtro
  const categorie = [...new Set(ingredienti.map(ing => ing.categoria))];
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Ingredienti</h2>
        <Button onClick={onAddClick}>
          Aggiungi Ingrediente
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Nome</th>
              <th className="border p-2 text-left">Categoria</th>
              <th className="border p-2 text-left">Quantità</th>
              <th className="border p-2 text-left">Soglia</th>
              <th className="border p-2 text-left">Prezzo Unitario</th>
              <th className="border p-2 text-left">Valore Totale</th>
              <th className="border p-2 text-left">Fornitore</th>
              <th className="border p-2 text-left">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {ingredienti.map(ingrediente => (
              <tr 
                key={ingrediente.id} 
                className={ingrediente.quantita <= ingrediente.soglia ? 'bg-red-50' : ''}
              >
                <td className="border p-2 font-medium">{ingrediente.nome}</td>
                <td className="border p-2">{ingrediente.categoria}</td>
                <td className={`border p-2 ${ingrediente.quantita <= ingrediente.soglia ? 'text-red-600 font-bold' : ''}`}>
                  {ingrediente.quantita} {ingrediente.unitaMisura}
                </td>
                <td className="border p-2">{ingrediente.soglia} {ingrediente.unitaMisura}</td>
                <td className="border p-2">€{ingrediente.prezzoUnitario.toFixed(2)}</td>
                <td className="border p-2">€{calcolaValore(ingrediente).toFixed(2)}</td>
                <td className="border p-2">{ingrediente.fornitoreNome || 'N/A'}</td>
                <td className="border p-2">
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => onEditClick(ingrediente)}
                      variant="outline" 
                      size="sm"
                    >
                      Modifica
                    </Button>
                    <Button 
                      onClick={() => onDeleteClick(ingrediente.id)}
                      variant="destructive" 
                      size="sm"
                    >
                      Elimina
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {ingredienti.length === 0 && (
              <tr>
                <td colSpan="8" className="border p-2 text-center">
                  {isLoading ? 'Caricamento in corso...' : 'Nessun ingrediente trovato'}
                </td>
              </tr>
            )}
          </tbody>
          {ingredienti.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td colSpan="5" className="border p-2 text-right">Valore Totale Inventario:</td>
                <td className="border p-2">
                  €{ingredienti.reduce((acc, ing) => acc + calcolaValore(ing), 0).toFixed(2)}
                </td>
                <td colSpan="2" className="border p-2"></td>
              </tr>
<tr className="bg-gray-50 text-sm">
                <td colSpan="2" className="border p-2 text-right">Totale Ingredienti:</td>
                <td colSpan="6" className="border p-2">{ingredienti.length}</td>
              </tr>
              <tr className="bg-gray-50 text-sm">
                <td colSpan="2" className="border p-2 text-right">Ingredienti Sotto Soglia:</td>
                <td colSpan="6" className="border p-2 text-red-600">
                  {ingredienti.filter(ing => ing.quantita <= ing.soglia).length}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      
      {/* Statistiche per categoria */}
      {ingredienti.length > 0 && categorie.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-2">Statistiche per Categoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorie.map(categoria => {
              const ingredientiCategoria = ingredienti.filter(ing => ing.categoria === categoria);
              const valoreTotale = ingredientiCategoria.reduce((acc, ing) => acc + calcolaValore(ing), 0);
              const sottoSoglia = ingredientiCategoria.filter(ing => ing.quantita <= ing.soglia).length;
              
              return (
                <div key={categoria} className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-bold mb-2">{categoria}</h4>
                  <div className="space-y-1 text-sm">
                    <p>Ingredienti: <span className="font-semibold">{ingredientiCategoria.length}</span></p>
                    <p>Valore: <span className="font-semibold">€{valoreTotale.toFixed(2)}</span></p>
                    <p>
                      Sotto soglia: 
                      <span className={`font-semibold ${sottoSoglia > 0 ? 'text-red-600' : ''}`}>
                        {sottoSoglia}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientList;