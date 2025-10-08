// src/components/FormOrdineCompleto.js
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import DropdownClientiAlfabetico from './DropdownClientiAlfabetico';
import { PRODOTTI_CONFIG, getProdottoConVarianti } from '../config/prodottiConfig';
import { calcolaPrezzoOrdine } from '../utils/calcoliPrezzi';

const FormOrdineCompleto = ({ 
  clienti, 
  onSalvaOrdine, 
  onNuovoCliente,
  ordineInModifica 
}) => {
  // State principale
  const [clienteSelezionato, setClienteSelezionato] = useState(null);
  const [dataRitiro, setDataRitiro] = useState('');
  const [oraRitiro, setOraRitiro] = useState('');
  const [prodotti, setProdotti] = useState([]);
  const [note, setNote] = useState('');
  
  // State per prodotto corrente
  const [prodottoSelezionato, setProdottoSelezionato] = useState('');
  const [varianteSelezionata, setVarianteSelezionata] = useState('');
  const [quantita, setQuantita] = useState('');
  const [unita, setUnita] = useState('Kg');
  const [prezzoCalcolato, setPrezzoCalcolato] = useState(0);
  const [daViaggio, setDaViaggio] = useState(false); // ✅ State per switch Da Viaggio
  
  // Ottieni prodotto con varianti
  const prodottoConVarianti = prodottoSelezionato 
    ? getProdottoConVarianti(prodottoSelezionato) 
    : null;
  
  // Aggiorna prezzo quando cambiano i valori
  useEffect(() => {
    if (prodottoSelezionato && quantita) {
      const prodotto = prodottoConVarianti;
      let prezzoKg = prodotto.prezzoKg;
      
      // Se ha varianti, usa il prezzo della variante
      if (prodotto.varianti && varianteSelezionata) {
        const variante = prodotto.varianti.find(v => v.nome === varianteSelezionata);
        if (variante?.prezzoKg) {
          prezzoKg = variante.prezzoKg;
        }
      }
      
      const risultato = calcolaPrezzoOrdine(
        { ...prodotto, prezzoKg }, 
        parseFloat(quantita), 
        unita
      );
      
      setPrezzoCalcolato(risultato.prezzoTotale);
    }
  }, [prodottoSelezionato, varianteSelezionata, quantita, unita]);
  
  // Reset variante quando cambia prodotto
  useEffect(() => {
    setVarianteSelezionata('');
  }, [prodottoSelezionato]);
  
  const handleAggiungiProdotto = () => {
    if (!prodottoSelezionato || !quantita || quantita <= 0) {
      alert('Seleziona un prodotto e inserisci una quantità valida');
      return;
    }
    
    const prodotto = prodottoConVarianti;
    let prezzoKg = prodotto.prezzoKg;
    let nomeCompleto = prodottoSelezionato;
    
    // Gestione varianti
    if (prodotto.varianti && varianteSelezionata) {
      const variante = prodotto.varianti.find(v => v.nome === varianteSelezionata);
      if (variante?.prezzoKg) {
        prezzoKg = variante.prezzoKg;
      }
      nomeCompleto = `${prodottoSelezionato} ${varianteSelezionata !== 'Base' ? `(${varianteSelezionata})` : ''}`;
    }
    
    const nuovoProdotto = {
      id: Date.now(),
      nome: nomeCompleto,
      nomeProdotto: prodottoSelezionato,
      variante: varianteSelezionata || null,
      quantita: parseFloat(quantita),
      unita,
      prezzoUnitario: prezzoKg,
      prezzoTotale: prezzoCalcolato,
      daViaggio, // ✅ Salva flag Da Viaggio
    };
    
    setProdotti([...prodotti, nuovoProdotto]);
    
    // Reset form prodotto
    setProdottoSelezionato('');
    setVarianteSelezionata('');
    setQuantita('');
    setUnita('Kg');
    setPrezzoCalcolato(0);
    setDaViaggio(false);
  };
  
  const handleRimuoviProdotto = (id) => {
    setProdotti(prodotti.filter(p => p.id !== id));
  };
  
  const calcolaTotaleOrdine = () => {
    return prodotti.reduce((sum, p) => sum + p.prezzoTotale, 0);
  };
  
  const handleSalvaOrdine = () => {
    if (!clienteSelezionato) {
      alert('Seleziona un cliente');
      return;
    }
    
    if (prodotti.length === 0) {
      alert('Aggiungi almeno un prodotto');
      return;
    }
    
    const ordine = {
      cliente: clienteSelezionato,
      dataRitiro,
      oraRitiro,
      prodotti,
      note,
      totale: calcolaTotaleOrdine(),
      stato: 'nuovo',
      createdAt: new Date().toISOString(),
    };
    
    onSalvaOrdine(ordine);
    
    // Reset form completo
    setClienteSelezionato(null);
    setDataRitiro('');
    setOraRitiro('');
    setProdotti([]);
    setNote('');
  };
  
  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Sezione Cliente */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Dati Cliente
        </h3>
        
        <DropdownClientiAlfabetico
          clienti={clienti}
          clienteSelezionato={clienteSelezionato}
          onSelezionaCliente={setClienteSelezionato}
          onNuovoCliente={onNuovoCliente}
        />
      </div>
      
      {/* Sezione Data e Ora */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Data Ritiro *</label>
          <input
            type="date"
            value={dataRitiro}
            onChange={(e) => setDataRitiro(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Ora Ritiro</label>
          <input
            type="time"
            value={oraRitiro}
            onChange={(e) => setOraRitiro(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>
      
      {/* Sezione Prodotti */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Prodotti</h3>
        
        {/* Form aggiunta prodotto */}
        <div className="border rounded-lg p-4 bg-gray-50 mb-4">
          <div className="grid grid-cols-12 gap-3">
            {/* Selezione prodotto */}
            <div className="col-span-4">
              <label className="block text-sm font-medium mb-1">Prodotto *</label>
              <select
                value={prodottoSelezionato}
                onChange={(e) => setProdottoSelezionato(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">-- Seleziona --</option>
                {Object.entries(PRODOTTI_CONFIG).map(([categoria, prodotti]) => (
                  <optgroup key={categoria} label={categoria}>
                    {prodotti.map((p) => (
                      <option key={p.nome} value={p.nome}>
                        {p.nome} (€{p.prezzoKg.toFixed(2)}/{p.unitaMisura})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            
            {/* Variante (se disponibile) */}
            {prodottoConVarianti?.varianti && (
              <div className="col-span-3">
                <label className="block text-sm font-medium mb-1">Variante *</label>
                <select
                  value={varianteSelezionata}
                  onChange={(e) => setVarianteSelezionata(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">-- Seleziona --</option>
                  {prodottoConVarianti.varianti.map((v) => (
                    <option key={v.nome} value={v.nome}>
                      {v.nome} {v.prezzoKg ? `(€${v.prezzoKg.toFixed(2)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Quantità */}
            <div className={prodottoConVarianti?.varianti ? 'col-span-2' : 'col-span-3'}>
              <label className="block text-sm font-medium mb-1">Quantità *</label>
              <input
                type="number"
                step="0.01"
                value={quantita}
                onChange={(e) => setQuantita(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="0.00"
              />
            </div>
            
            {/* Unità */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Unità</label>
              <select
                value={unita}
                onChange={(e) => setUnita(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="Kg">Kg</option>
                <option value="Pezzo">Pezzo</option>
              </select>
            </div>
            
            {/* Prezzo calcolato */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Prezzo</label>
              <div className="h-10 flex items-center justify-center bg-green-100 rounded-lg font-bold text-green-700">
                €{prezzoCalcolato.toFixed(2)}
              </div>
            </div>
            
            {/* Pulsante aggiungi */}
            <div className="col-span-1 flex items-end">
              <button
                onClick={handleAggiungiProdotto}
                className="w-full h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-5 h-5 mx-auto" />
              </button>
            </div>
          </div>
          
          {/* ✅ SWITCH DA VIAGGIO */}
          <div className="mt-3 flex items-center">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={daViaggio}
                  onChange={(e) => setDaViaggio(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full shadow-inner transition-colors ${
                  daViaggio ? 'bg-blue-500' : 'bg-gray-300'
                }`}></div>
                <div className={`absolute w-4 h-4 bg-white rounded-full shadow top-1 transition-transform ${
                  daViaggio ? 'transform translate-x-5' : 'translate-x-1'
                }`}></div>
              </div>
              <span className="ml-3 text-sm font-medium">
                🎒 Prodotto da viaggio
              </span>
            </label>
          </div>
        </div>
        
        {/* Lista prodotti aggiunti */}
        {prodotti.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Prodotto</th>
                  <th className="px-4 py-2 text-center">Quantità</th>
                  <th className="px-4 py-2 text-center">Prezzo</th>
                  <th className="px-4 py-2 text-center">Viaggio</th>
                  <th className="px-4 py-2 text-center">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {prodotti.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">{p.nome}</td>
                    <td className="px-4 py-2 text-center">
                      {p.quantita} {p.unita}
                    </td>
                    <td className="px-4 py-2 text-center font-semibold">
                      €{p.prezzoTotale.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {p.daViaggio && <span className="text-2xl">🎒</span>}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleRimuoviProdotto(p.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Totale */}
        {prodotti.length > 0 && (
          <div className="mt-4 bg-green-50 rounded-lg p-4 flex justify-between items-center">
            <span className="text-lg font-semibold">TOTALE ORDINE:</span>
            <span className="text-2xl font-bold text-green-700">
              €{calcolaTotaleOrdine().toFixed(2)}
            </span>
          </div>
        )}
      </div>
      
      {/* Note */}
      <div>
        <label className="block text-sm font-medium mb-1">Note aggiuntive</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          rows="3"
          placeholder="Aggiungi note per l'ordine..."
        />
      </div>
      
      {/* Pulsanti azione */}
      <div className="flex gap-3">
        <button
          onClick={handleSalvaOrdine}
          disabled={!clienteSelezionato || prodotti.length === 0}
          className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          💾 Salva Ordine (€{calcolaTotaleOrdine().toFixed(2)})
        </button>
      </div>
    </div>
  );
};

export default FormOrdineCompleto;