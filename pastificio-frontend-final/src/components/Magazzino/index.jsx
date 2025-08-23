import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import DashboardMagazzino from './DashboardMagazzino';
import IngredientList from './IngredientList';
import FornitoriManager from './FornitoriManager';
import IngredientForm from './IngredientForm';
import FornitoreForm from './FornitoreForm';
import RegistraMovimento from './RegistraMovimento';
import { MagazzinoService } from '../../services/magazzinoService';
import { toast } from 'react-toastify';

const Magazzino = () => {
  // Stati base
  const [activeTab, setActiveTab] = useState('ingredienti');
  const [ingredienti, setIngredienti] = useState([]);
  const [fornitori, setFornitori] = useState([]);
  const [movimenti, setMovimenti] = useState([]);
  const [selectedIngrediente, setSelectedIngrediente] = useState(null);
  const [selectedFornitore, setSelectedFornitore] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Carica i dati all'avvio del componente
  useEffect(() => {
    loadData();
  }, []);

  // Funzione per caricare i dati dal servizio
  const loadData = async () => {
    setIsLoading(true);
    try {
      const ingredientiData = await MagazzinoService.getIngredienti();
      const fornitoriData = await MagazzinoService.getFornitori();
      const movimentiData = await MagazzinoService.getMovimenti();
      
      setIngredienti(ingredientiData);
      setFornitori(fornitoriData);
      setMovimenti(movimentiData);
      
      // Controlla ingredienti sotto soglia
      checkIngredientiBelowThreshold(ingredientiData);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      toast.error('Errore nel caricamento dei dati del magazzino');
    } finally {
      setIsLoading(false);
    }
  };

  // Controlla se ci sono ingredienti sotto la soglia minima
  const checkIngredientiBelowThreshold = (ingredients) => {
    const lowIngredients = ingredients.filter(i => i.quantita <= i.soglia);
    if (lowIngredients.length > 0) {
      toast.warning(`Attenzione: ${lowIngredients.length} ingredienti sotto scorta minima!`);
    }
  };

  // Gestione aggiunta/modifica ingrediente
  const handleSaveIngrediente = async (ingrediente) => {
    try {
      let updatedIngrediente;
      
      if (ingrediente.id) {
        // Modifica ingrediente esistente
        updatedIngrediente = await MagazzinoService.updateIngrediente(ingrediente);
        setIngredienti(prev => prev.map(ing => ing.id === updatedIngrediente.id ? updatedIngrediente : ing));
        toast.success('Ingrediente aggiornato con successo');
      } else {
        // Nuovo ingrediente
        updatedIngrediente = await MagazzinoService.addIngrediente(ingrediente);
        setIngredienti(prev => [...prev, updatedIngrediente]);
        toast.success('Ingrediente aggiunto con successo');
      }
      
      setIsFormVisible(false);
    } catch (error) {
      console.error('Errore salvataggio ingrediente:', error);
      toast.error('Errore nel salvataggio dell\'ingrediente');
    }
  };

  // Gestione aggiunta/modifica fornitore
  const handleSaveFornitore = async (fornitore) => {
    try {
      let updatedFornitore;
      
      if (fornitore.id) {
        // Modifica fornitore esistente
        updatedFornitore = await MagazzinoService.updateFornitore(fornitore);
        setFornitori(prev => prev.map(f => f.id === updatedFornitore.id ? updatedFornitore : f));
        toast.success('Fornitore aggiornato con successo');
      } else {
        // Nuovo fornitore
        updatedFornitore = await MagazzinoService.addFornitore(fornitore);
        setFornitori(prev => [...prev, updatedFornitore]);
        toast.success('Fornitore aggiunto con successo');
      }
      
      setIsFormVisible(false);
    } catch (error) {
      console.error('Errore salvataggio fornitore:', error);
      toast.error('Errore nel salvataggio del fornitore');
    }
  };

  // Gestione registrazione movimento
  const handleSaveMovimento = async (movimento) => {
    try {
      // Aggiunge il movimento
      const newMovimento = await MagazzinoService.addMovimento(movimento);
      setMovimenti(prev => [...prev, newMovimento]);
      
      // Aggiorna la quantità dell'ingrediente
      const ingredienteToUpdate = ingredienti.find(i => i.id === movimento.ingredienteId);
      if (ingredienteToUpdate) {
        const updatedQuantity = 
          movimento.tipo === 'carico' 
            ? ingredienteToUpdate.quantita + movimento.quantita
            : ingredienteToUpdate.quantita - movimento.quantita;
        
        const updatedIngrediente = { 
          ...ingredienteToUpdate, 
          quantita: updatedQuantity 
        };
        
        await MagazzinoService.updateIngrediente(updatedIngrediente);
        
        // Aggiorna l'elenco degli ingredienti
        setIngredienti(prev => prev.map(i => 
          i.id === updatedIngrediente.id ? updatedIngrediente : i
        ));

        // Mostra notifica se la quantità è sotto la soglia
        if (updatedQuantity <= ingredienteToUpdate.soglia) {
          toast.warning(`Attenzione: ${ingredienteToUpdate.nome} sotto scorta minima!`);
        }
      }

      setIsFormVisible(false);
      toast.success('Movimento registrato con successo');
    } catch (error) {
      console.error('Errore registrazione movimento:', error);
      toast.error('Errore nella registrazione del movimento');
    }
  };

  // Eliminazione ingrediente
  const handleDeleteIngrediente = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo ingrediente?')) {
      try {
        await MagazzinoService.deleteIngrediente(id);
        setIngredienti(prev => prev.filter(i => i.id !== id));
        toast.success('Ingrediente eliminato con successo');
      } catch (error) {
        console.error('Errore eliminazione ingrediente:', error);
        toast.error('Errore nell\'eliminazione dell\'ingrediente');
      }
    }
  };

  // Eliminazione fornitore
  const handleDeleteFornitore = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo fornitore?')) {
      try {
        await MagazzinoService.deleteFornitore(id);
        setFornitori(prev => prev.filter(f => f.id !== id));
        toast.success('Fornitore eliminato con successo');
      } catch (error) {
        console.error('Errore eliminazione fornitore:', error);
        toast.error('Errore nell\'eliminazione del fornitore');
      }
    }
  };

  // Filtra gli elementi in base alla ricerca
  const filteredItems = () => {
    const term = searchTerm.toLowerCase();
    
    switch (activeTab) {
      case 'ingredienti':
        return ingredienti.filter(i => 
          i.nome.toLowerCase().includes(term) || 
          i.categoria.toLowerCase().includes(term)
        );
      case 'fornitori':
        return fornitori.filter(f => 
          f.nome.toLowerCase().includes(term) || 
          f.email.toLowerCase().includes(term) ||
          f.telefono.includes(term)
        );
      case 'movimenti':
        return movimenti.filter(m => {
          const ingrediente = ingredienti.find(i => i.id === m.ingredienteId);
          return ingrediente?.nome.toLowerCase().includes(term) ||
                 m.tipo.toLowerCase().includes(term);
        });
      default:
        return [];
    }
  };

  // Componente da renderizzare in base al tab attivo
  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'ingredienti':
        return isFormVisible ? (
          <IngredientForm 
            onSubmit={handleSaveIngrediente}
            onCancel={() => setIsFormVisible(false)}
            fornitori={fornitori}
            ingrediente={selectedIngrediente}
          />
        ) : (
          <IngredientList 
            ingredienti={filteredItems()}
            onAddClick={() => {
              setSelectedIngrediente(null);
              setIsFormVisible(true);
            }}
            onEditClick={(ingrediente) => {
              setSelectedIngrediente(ingrediente);
              setIsFormVisible(true);
            }}
            onDeleteClick={handleDeleteIngrediente}
            isLoading={isLoading}
          />
        );
      case 'fornitori':
        return isFormVisible ? (
          <FornitoreForm 
            onSubmit={handleSaveFornitore}
            onCancel={() => setIsFormVisible(false)}
            fornitore={selectedFornitore}
          />
        ) : (
          <FornitoriManager 
            fornitori={filteredItems()}
            onAddClick={() => {
              setSelectedFornitore(null);
              setIsFormVisible(true);
            }}
            onEditClick={(fornitore) => {
              setSelectedFornitore(fornitore);
              setIsFormVisible(true);
            }}
            onDeleteClick={handleDeleteFornitore}
            isLoading={isLoading}
          />
        );
      case 'movimenti':
        return isFormVisible ? (
          <RegistraMovimento 
            onSubmit={handleSaveMovimento}
            onCancel={() => setIsFormVisible(false)}
            ingredienti={ingredienti}
            fornitori={fornitori}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Movimenti Magazzino</h2>
              <Button onClick={() => setIsFormVisible(true)}>
                Registra Movimento
              </Button>
            </div>
            <table className="min-w-full border-collapse table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Data</th>
                  <th className="border p-2 text-left">Tipo</th>
                  <th className="border p-2 text-left">Ingrediente</th>
                  <th className="border p-2 text-left">Quantità</th>
                  <th className="border p-2 text-left">Fornitore</th>
                  <th className="border p-2 text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems().map(movimento => {
                  const ingrediente = ingredienti.find(i => i.id === movimento.ingredienteId);
                  const fornitore = fornitori.find(f => f.id === movimento.fornitoreId);
                  
                  return (
                    <tr key={movimento.id} className={movimento.tipo === 'scarico' ? 'bg-red-50' : 'bg-green-50'}>
                      <td className="border p-2">{new Date(movimento.data).toLocaleDateString()}</td>
                      <td className="border p-2">
                        <span className={`px-2 py-1 rounded ${movimento.tipo === 'carico' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {movimento.tipo === 'carico' ? 'Carico' : 'Scarico'}
                        </span>
                      </td>
                      <td className="border p-2">{ingrediente?.nome || 'N/A'}</td>
                      <td className="border p-2">{movimento.quantita} {ingrediente?.unitaMisura || ''}</td>
                      <td className="border p-2">{fornitore?.nome || 'N/A'}</td>
                      <td className="border p-2">{movimento.note || ''}</td>
                    </tr>
                  );
                })}
                {filteredItems().length === 0 && (
                  <tr>
                    <td colSpan="6" className="border p-2 text-center">Nessun movimento registrato</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestione Magazzino</h1>
      
      {/* Dashboard */}
      {!isFormVisible && (
        <DashboardMagazzino 
          ingredienti={ingredienti}
          fornitori={fornitori}
          movimenti={movimenti}
        />
      )}

      {/* Ricerca e filtri */}
      {!isFormVisible && (
        <div className="mb-6">
          <Input
            className="w-full md:w-64"
            placeholder="Cerca..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Tabs */}
      {!isFormVisible && (
        <div className="mb-6 border-b border-gray-200">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                className={`inline-block p-4 border-b-2 ${
                  activeTab === 'ingredienti'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('ingredienti')}
              >
                Ingredienti
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block p-4 border-b-2 ${
                  activeTab === 'fornitori'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('fornitori')}
              >
                Fornitori
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block p-4 border-b-2 ${
                  activeTab === 'movimenti'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('movimenti')}
              >
                Movimenti
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Contenuto principale */}
      <Card>
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Caricamento in corso...</p>
            </div>
          ) : (
            renderActiveComponent()
          )}
        </div>
      </Card>
    </div>
  );
};

export default Magazzino;