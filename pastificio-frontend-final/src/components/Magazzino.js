import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useRouter } from 'next/navigation'; // Cambiato da react-router-dom
import { toast } from 'react-toastify';

const Magazzino = () => {
  const router = useRouter(); // Cambiato da userouter.push
  
  // Stati
  const [movimenti, setMovimenti] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [ricerca, setRicerca] = useState('');
  const [activeTab, setActiveTab] = useState('movimenti');
  const [loading, setLoading] = useState(false);
  const [giacenze, setGiacenze] = useState([]);
  const [valoremagazzino, setValoreMagazzino] = useState(null);
  
  // Stati per i modali
  const [modalMovimentoAperta, setModalMovimentoAperta] = useState(false);
  const [movimentoForm, setMovimentoForm] = useState({
    tipo: 'carico',
    prodotto: {
      nome: '',
      categoria: 'Materie Prime'
    },
    quantita: '',
    unita: 'Kg',
    prezzoUnitario: '',
    fornitore: {
      nome: ''
    },
    documentoRiferimento: {
      numero: ''
    },
    note: ''
  });

  // Categorie disponibili
  const categorie = ['Materie Prime', 'Prodotti Finiti', 'Imballaggio', 'Altro'];
  const unitaMisura = ['Kg', 'g', 'L', 'ml', 'pz'];
  
  // Lista fornitori mock
  const fornitori = [
    { nome: 'Molino Rossi' },
    { nome: 'Fattoria Bio' },
    { nome: 'Fornitore Generico' }
  ];
  
  // Lista prodotti mock
  const prodotti = [
    { nome: 'Farina 00', categoria: 'Materie Prime' },
    { nome: 'Semola', categoria: 'Materie Prime' },
    { nome: 'Uova', categoria: 'Materie Prime' },
    { nome: 'Sale', categoria: 'Materie Prime' },
    { nome: 'Olio', categoria: 'Materie Prime' },
    { nome: 'Pomodoro', categoria: 'Materie Prime' },
    { nome: 'Scatole', categoria: 'Imballaggio' },
    { nome: 'Etichette', categoria: 'Imballaggio' }
  ];

  const API_URL = 'http://localhost:5000/api';

  // Funzione per ottenere il token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Headers per le richieste API
  const getHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  // Carica movimenti
  const loadMovimenti = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/magazzino/movimenti`, {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login'); // Cambiato da router.push
          return;
        }
        throw new Error(`Errore HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setMovimenti(data.data || []);
    } catch (error) {
      console.error('Errore caricamento movimenti:', error);
      toast.error('Errore nel caricamento dei movimenti');
    } finally {
      setLoading(false);
    }
  };

  // Carica giacenze
  const loadGiacenze = async () => {
    try {
      const response = await fetch(`${API_URL}/magazzino/giacenze`, {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Errore HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setGiacenze(data.data || []);
    } catch (error) {
      console.error('Errore caricamento giacenze:', error);
    }
  };

  // Carica valore magazzino
  const loadValoreMagazzino = async () => {
    try {
      const response = await fetch(`${API_URL}/magazzino/valore`, {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Errore HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setValoreMagazzino(data.data);
    } catch (error) {
      console.error('Errore caricamento valore magazzino:', error);
    }
  };

  // useEffect per caricare i dati all'avvio
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login'); // Cambiato da router.push
      return;
    }
    
    loadMovimenti();
    loadGiacenze();
    loadValoreMagazzino();
  }, []);

  // Gestione del form movimento
  const handleChangeMovimento = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setMovimentoForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setMovimentoForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Crea movimento
  const creaMovimento = async () => {
    try {
      // Validazione
      if (!movimentoForm.prodotto.nome || !movimentoForm.quantita) {
        toast.error('Nome prodotto e quantità sono obbligatori');
        return;
      }

      // Prepara i dati
      const dataToSend = {
        tipo: movimentoForm.tipo,
        prodotto: {
          nome: movimentoForm.prodotto.nome,
          categoria: movimentoForm.prodotto.categoria
        },
        quantita: parseFloat(movimentoForm.quantita),
        unita: movimentoForm.unita,
        prezzoUnitario: parseFloat(movimentoForm.prezzoUnitario) || 0,
        fornitore: movimentoForm.fornitore.nome ? { nome: movimentoForm.fornitore.nome } : null,
        documentoRiferimento: movimentoForm.documentoRiferimento.numero ? {
          numero: movimentoForm.documentoRiferimento.numero
        } : null,
        note: movimentoForm.note
      };

      console.log('Invio movimento:', dataToSend);

      const response = await fetch(`${API_URL}/magazzino/movimenti`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dataToSend)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || `Errore HTTP ${response.status}`);
      }
      
      toast.success('Movimento registrato con successo');
      setModalMovimentoAperta(false);
      resetFormMovimento();
      
      // Ricarica i dati
      loadMovimenti();
      loadGiacenze();
      loadValoreMagazzino();
      
    } catch (error) {
      console.error('Errore creazione movimento:', error);
      toast.error(error.message || 'Errore nella registrazione del movimento');
    }
  };

  // Reset form movimento
  const resetFormMovimento = () => {
    setMovimentoForm({
      tipo: 'carico',
      prodotto: {
        nome: '',
        categoria: 'Materie Prime'
      },
      quantita: '',
      unita: 'Kg',
      prezzoUnitario: '',
      fornitore: {
        nome: ''
      },
      documentoRiferimento: {
        numero: ''
      },
      note: ''
    });
  };

  // Filtra movimenti
  const movimentiFiltrati = movimenti.filter(movimento => {
    const corrispondeRicerca = ricerca 
      ? movimento.prodotto?.nome?.toLowerCase().includes(ricerca.toLowerCase()) ||
        movimento.fornitore?.nome?.toLowerCase().includes(ricerca.toLowerCase())
      : true;
    return corrispondeRicerca;
  });

  // Se sta caricando
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestione Magazzino</h1>
      
      {/* Statistiche */}
      {valoremagazzino && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm text-gray-600">Valore Totale Magazzino</h3>
              <p className="text-2xl font-bold">€ {valoremagazzino.valoreToTale?.toFixed(2) || '0.00'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm text-gray-600">Prodotti Sotto Scorta</h3>
              <p className="text-2xl font-bold">{giacenze.filter(g => g.quantitaAttuale < 10).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm text-gray-600">Movimenti Oggi</h3>
              <p className="text-2xl font-bold">{movimenti.filter(m => 
                new Date(m.dataMovimento).toDateString() === new Date().toDateString()
              ).length}</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Toolbar */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <Input 
            placeholder="Cerca prodotto o fornitore..." 
            value={ricerca} 
            onChange={(e) => setRicerca(e.target.value)}
            className="w-64"
          />
        </div>
        
        <Button 
          onClick={() => setModalMovimentoAperta(true)} 
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          NUOVO MOVIMENTO
        </Button>
      </div>
      
      {/* Tabs */}
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <ul className="flex -mb-px">
            <li className="mr-1">
              <button
                className={`inline-block p-4 ${
                  activeTab === 'movimenti'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('movimenti')}
              >
                MOVIMENTI
              </button>
            </li>
            <li className="mr-1">
              <button
                className={`inline-block p-4 ${
                  activeTab === 'giacenze'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('giacenze')}
              >
                GIACENZE
              </button>
            </li>
            <li className="mr-1">
              <button
                className={`inline-block p-4 ${
                  activeTab === 'sottoscorta'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('sottoscorta')}
              >
                SOTTO SCORTA ({giacenze.filter(g => g.quantitaAttuale < 10).length})
              </button>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Tab Movimenti */}
      {activeTab === 'movimenti' && (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="py-3 px-4 text-left">Data</th>
                    <th className="py-3 px-4 text-left">Tipo</th>
                    <th className="py-3 px-4 text-left">Prodotto</th>
                    <th className="py-3 px-4 text-left">Quantità</th>
                    <th className="py-3 px-4 text-left">Prezzo Unit.</th>
                    <th className="py-3 px-4 text-left">Valore</th>
                    <th className="py-3 px-4 text-left">Fornitore</th>
                    <th className="py-3 px-4 text-left">Documento</th>
                    <th className="py-3 px-4 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentiFiltrati.map((movimento) => (
                    <tr key={movimento._id}>
                      <td className="py-3 px-4 border-b">
                        {new Date(movimento.dataMovimento).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 border-b">
                        <span className={`px-2 py-1 rounded text-xs ${
                          movimento.tipo === 'carico' 
                            ? 'bg-green-500 text-white' 
                            : movimento.tipo === 'scarico'
                            ? 'bg-red-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}>
                          {movimento.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b">
                        {movimento.prodotto?.nome || '-'}
                        <br />
                        <span className="text-xs text-gray-500">
                          {movimento.prodotto?.categoria || ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b">
                        {movimento.quantita} {movimento.unita || 'kg'}
                      </td>
                      <td className="py-3 px-4 border-b">
                        {movimento.prezzoUnitario ? `€ ${movimento.prezzoUnitario.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-4 border-b">
                        {movimento.valoreMovimento ? `€ ${movimento.valoreMovimento.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-4 border-b">
                        {movimento.fornitore?.nome || '-'}
                      </td>
                      <td className="py-3 px-4 border-b">
                        {movimento.documentoRiferimento?.numero || '-'}
                      </td>
                      <td className="py-3 px-4 border-b">{movimento.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Giacenze */}
      {activeTab === 'giacenze' && (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="py-3 px-4 text-left">Prodotto</th>
                    <th className="py-3 px-4 text-left">Categoria</th>
                    <th className="py-3 px-4 text-left">Giacenza</th>
                    <th className="py-3 px-4 text-left">Valore Medio</th>
                    <th className="py-3 px-4 text-left">Valore Totale</th>
                    <th className="py-3 px-4 text-left">Ultimo Movimento</th>
                    <th className="py-3 px-4 text-left">Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {giacenze.map((giacenza) => (
                    <tr key={giacenza._id} className={giacenza.quantitaAttuale < 10 ? 'bg-red-50' : ''}>
                      <td className="py-3 px-4 border-b">{giacenza._id}</td>
                      <td className="py-3 px-4 border-b">{giacenza.prodotto?.categoria || '-'}</td>
                      <td className="py-3 px-4 border-b">
                        {giacenza.quantitaAttuale.toFixed(2)} {giacenza.unita || 'kg'}
                      </td>
                      <td className="py-3 px-4 border-b">
                        € {giacenza.valoreMedio?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 px-4 border-b">
                        € {(giacenza.quantitaAttuale * (giacenza.valoreMedio || 0)).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 border-b">
                        {giacenza.ultimoMovimento?.data 
                          ? new Date(giacenza.ultimoMovimento.data).toLocaleDateString('it-IT')
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4 border-b">
                        {giacenza.quantitaAttuale < 10 ? (
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                            Sotto scorta
                          </span>
                        ) : giacenza.quantitaAttuale < 50 ? (
                          <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                            Scorta bassa
                          </span>
                        ) : (
                          <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                            Ok
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Sotto Scorta */}
      {activeTab === 'sottoscorta' && (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="py-3 px-4 text-left">Prodotto</th>
                    <th className="py-3 px-4 text-left">Giacenza Attuale</th>
                    <th className="py-3 px-4 text-left">Scorta Minima</th>
                    <th className="py-3 px-4 text-left">Da Ordinare</th>
                    <th className="py-3 px-4 text-left">Ultimo Carico</th>
                    <th className="py-3 px-4 text-left">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {giacenze
                    .filter(g => g.quantitaAttuale < 10)
                    .map((giacenza) => (
                      <tr key={giacenza._id} className="bg-red-50">
                        <td className="py-3 px-4 border-b font-semibold">{giacenza._id}</td>
                        <td className="py-3 px-4 border-b text-red-600 font-bold">
                          {giacenza.quantitaAttuale.toFixed(2)} {giacenza.unita || 'kg'}
                        </td>
                        <td className="py-3 px-4 border-b">10 {giacenza.unita || 'kg'}</td>
                        <td className="py-3 px-4 border-b font-semibold">
                          {Math.max(50 - giacenza.quantitaAttuale, 0).toFixed(2)} {giacenza.unita || 'kg'}
                        </td>
                        <td className="py-3 px-4 border-b">
                          {giacenza.ultimoMovimento?.data 
                            ? new Date(giacenza.ultimoMovimento.data).toLocaleDateString('it-IT')
                            : '-'
                          }
                        </td>
                        <td className="py-3 px-4 border-b">
                          <Button
                            onClick={() => {
                              setMovimentoForm(prev => ({
                                ...prev,
                                tipo: 'carico',
                                prodotto: {
                                  nome: giacenza._id,
                                  categoria: giacenza.prodotto?.categoria || 'Materie Prime'
                                },
                                quantita: Math.max(50 - giacenza.quantitaAttuale, 0).toFixed(2)
                              }));
                              setModalMovimentoAperta(true);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded"
                          >
                            Ordina
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Nuovo Movimento */}
      {modalMovimentoAperta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nuovo Movimento</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo" className="block mb-1">Tipo Movimento *</Label>
                <select
                  id="tipo"
                  name="tipo"
                  value={movimentoForm.tipo}
                  onChange={handleChangeMovimento}
                  className="w-full border rounded p-2"
                >
                  <option value="carico">Carico</option>
                  <option value="scarico">Scarico</option>
                  <option value="rettifica">Rettifica</option>
                  <option value="inventario">Inventario</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="prodotto.nome" className="block mb-1">Nome Prodotto *</Label>
                <select
                  id="prodotto.nome"
                  name="prodotto.nome"
                  value={movimentoForm.prodotto.nome}
                  onChange={handleChangeMovimento}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="">Seleziona prodotto</option>
                  {prodotti.map((p, idx) => (
                    <option key={idx} value={p.nome}>
                      {p.nome} - {p.categoria}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="prodotto.categoria" className="block mb-1">Categoria</Label>
                <select
                  id="prodotto.categoria"
                  name="prodotto.categoria"
                  value={movimentoForm.prodotto.categoria}
                  onChange={handleChangeMovimento}
                  className="w-full border rounded p-2"
                >
                  {categorie.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="quantita" className="block mb-1">Quantità *</Label>
                <Input 
                  id="quantita" 
                  name="quantita" 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={movimentoForm.quantita} 
                  onChange={handleChangeMovimento} 
                  className="w-full"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="unita" className="block mb-1">Unità</Label>
                <select
                  id="unita"
                  name="unita"
                  value={movimentoForm.unita}
                  onChange={handleChangeMovimento}
                  className="w-full border rounded p-2"
                >
                  {unitaMisura.map(um => (
                    <option key={um} value={um}>{um}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="prezzoUnitario" className="block mb-1">Prezzo Unitario (€)</Label>
                <Input 
                  id="prezzoUnitario" 
                  name="prezzoUnitario" 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={movimentoForm.prezzoUnitario} 
                  onChange={handleChangeMovimento} 
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="fornitore.nome" className="block mb-1">Fornitore</Label>
                <select
                  id="fornitore.nome"
                  name="fornitore.nome"
                  value={movimentoForm.fornitore.nome}
                  onChange={handleChangeMovimento}
                  className="w-full border rounded p-2"
                >
                  <option value="">Seleziona fornitore</option>
                  {fornitori.map((f, idx) => (
                    <option key={idx} value={f.nome}>{f.nome}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="documentoRiferimento.numero" className="block mb-1">Numero Documento</Label>
                <Input 
                  id="documentoRiferimento.numero" 
                  name="documentoRiferimento.numero" 
                  value={movimentoForm.documentoRiferimento.numero} 
                  onChange={handleChangeMovimento} 
                  className="w-full"
                  placeholder="DDT/2024/001"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="note" className="block mb-1">Note</Label>
              <textarea
                id="note"
                name="note"
                value={movimentoForm.note}
                onChange={handleChangeMovimento}
                className="w-full border rounded p-2"
                rows="3"
              />
            </div>
            
            {movimentoForm.quantita && movimentoForm.prezzoUnitario && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <p className="text-lg font-semibold">
                  Valore Totale Movimento: € {(parseFloat(movimentoForm.quantita) * parseFloat(movimentoForm.prezzoUnitario)).toFixed(2)}
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                onClick={() => {
                  setModalMovimentoAperta(false);
                  resetFormMovimento();
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800"
              >
                ANNULLA
              </Button>
              <Button 
                onClick={creaMovimento}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                disabled={!movimentoForm.prodotto.nome || !movimentoForm.quantita}
              >
                SALVA
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Magazzino;