// components/NuovoOrdine.js
import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'react-hot-toast';
import { Plus, Save, X, Calendar, Clock, Phone, User, Package, Euro, Cookie } from 'lucide-react';

const NuovoOrdine = ({ onSave, clienti = [] }) => {
  const [ordine, setOrdine] = useState({
    nomeCliente: '',
    telefono: '',
    dataRitiro: new Date().toISOString().split('T')[0],
    oraRitiro: '',
    prodotti: [],
    note: '',
    stato: 'nuovo'
  });

  const [prodottoCorrente, setProdottoCorrente] = useState({
    nome: '',
    quantita: 1,
    unita: 'kg',
    prezzo: 0
  });

  // Lista prodotti predefiniti con prezzi
  const prodottiPredefiniti = [
    // Pasta fresca
    { nome: 'Malloreddus', prezzo: 12, unita: 'kg', categoria: 'pasta' },
    { nome: 'Culurgiones', prezzo: 18, unita: 'kg', categoria: 'pasta' },
    { nome: 'Ravioli ricotta e spinaci', prezzo: 15, unita: 'kg', categoria: 'pasta' },
    { nome: 'Ravioli di carne', prezzo: 16, unita: 'kg', categoria: 'pasta' },
    { nome: 'Gnocchetti sardi', prezzo: 10, unita: 'kg', categoria: 'pasta' },
    { nome: 'Fregola', prezzo: 8, unita: 'kg', categoria: 'pasta' },
    { nome: 'Tagliatelle', prezzo: 10, unita: 'kg', categoria: 'pasta' },
    { nome: 'Lasagne', prezzo: 12, unita: 'kg', categoria: 'pasta' },
    { nome: 'Cannelloni', prezzo: 14, unita: 'kg', categoria: 'pasta' },
    
    // Dolci
    { nome: 'Seadas', prezzo: 4, unita: 'pezzi', categoria: 'dolci' },
    { nome: 'Pardulas', prezzo: 2.5, unita: 'pezzi', categoria: 'dolci' },
    { nome: 'Papassini', prezzo: 18, unita: 'kg', categoria: 'dolci' },
    { nome: 'Amaretti', prezzo: 20, unita: 'kg', categoria: 'dolci' },
    { nome: 'Bianchini', prezzo: 22, unita: 'kg', categoria: 'dolci' },
    { nome: 'Gueffus', prezzo: 25, unita: 'kg', categoria: 'dolci' },
    { nome: 'Candelaus', prezzo: 20, unita: 'kg', categoria: 'dolci' },
    
    // Pane
    { nome: 'Pane carasau', prezzo: 8, unita: 'kg', categoria: 'pane' },
    { nome: 'Pane civraxiu', prezzo: 5, unita: 'kg', categoria: 'pane' },
    { nome: 'Coccoi', prezzo: 6, unita: 'kg', categoria: 'pane' },
    { nome: 'Pistoccu', prezzo: 7, unita: 'kg', categoria: 'pane' },
    { nome: 'Moddizzosu', prezzo: 4, unita: 'kg', categoria: 'pane' },
    
    // Altri prodotti
    { nome: 'Sebadas', prezzo: 4, unita: 'pezzi', categoria: 'dolci' },
    { nome: 'Pabassinas', prezzo: 20, unita: 'kg', categoria: 'dolci' },
    { nome: 'Ricotta fresca', prezzo: 8, unita: 'kg', categoria: 'altro' },
    { nome: 'Formaggelle', prezzo: 3, unita: 'pezzi', categoria: 'altro' },
    { nome: 'Panadas', prezzo: 5, unita: 'pezzi', categoria: 'altro' },
    { nome: 'Dolci misti', prezzo: 0, unita: '€', categoria: 'dolci' },
    { nome: 'Ciambelle con marmellata', prezzo: 18, unita: 'kg', categoria: 'dolci' }
  ];

  const aggiungiProdotto = () => {
    if (!prodottoCorrente.nome) {
      toast.error('Seleziona un prodotto');
      return;
    }

    const nuovoProdotto = {
      ...prodottoCorrente,
      // Non includere la quantità nel nome
      nome: prodottoCorrente.nome,
      // Calcola il totale
      totale: prodottoCorrente.quantita * prodottoCorrente.prezzo
    };

    setOrdine({
      ...ordine,
      prodotti: [...ordine.prodotti, nuovoProdotto]
    });

    // Reset prodotto corrente
    setProdottoCorrente({
      nome: '',
      quantita: 1,
      unita: 'kg',
      prezzo: 0
    });

    toast.success('Prodotto aggiunto');
  };

  const rimuoviProdotto = (index) => {
    setOrdine({
      ...ordine,
      prodotti: ordine.prodotti.filter((_, i) => i !== index)
    });
    toast.success('Prodotto rimosso');
  };

  const handleProdottoChange = (nomeProdotto) => {
    const prodotto = prodottiPredefiniti.find(p => p.nome === nomeProdotto);
    if (prodotto) {
      setProdottoCorrente({
        ...prodottoCorrente,
        nome: prodotto.nome,
        prezzo: prodotto.prezzo,
        unita: prodotto.unita
      });
    }
  };

  const calcolaTotale = () => {
    return ordine.prodotti.reduce((sum, p) => sum + (p.quantita * p.prezzo), 0);
  };

  const handleSubmit = () => {
    if (!ordine.nomeCliente) {
      toast.error('Inserisci il nome del cliente');
      return;
    }

    if (ordine.prodotti.length === 0) {
      toast.error('Aggiungi almeno un prodotto');
      return;
    }

    if (!ordine.dataRitiro || !ordine.oraRitiro) {
      toast.error('Inserisci data e ora di ritiro');
      return;
    }

    const ordineCompleto = {
      ...ordine,
      totale: calcolaTotale(),
      _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    onSave(ordineCompleto);
    
    // Reset form
    setOrdine({
      nomeCliente: '',
      telefono: '',
      dataRitiro: new Date().toISOString().split('T')[0],
      oraRitiro: '',
      prodotti: [],
      note: '',
      stato: 'nuovo'
    });
    
    toast.success('Ordine creato con successo!');
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Cookie className="h-6 w-6 text-blue-600" />
            Nuovo Ordine
          </h2>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('it-IT', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Dati Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Nome Cliente *
            </label>
            <Input
              value={ordine.nomeCliente}
              onChange={(e) => setOrdine({ ...ordine, nomeCliente: e.target.value })}
              placeholder="Mario Rossi"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              <Phone className="inline h-4 w-4 mr-1" />
              Telefono
            </label>
            <Input
              value={ordine.telefono}
              onChange={(e) => setOrdine({ ...ordine, telefono: e.target.value })}
              placeholder="+39 xxx xxx xxxx"
              className="w-full"
            />
          </div>
        </div>

        {/* Data e Ora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Data Ritiro *
            </label>
            <Input
              type="date"
              value={ordine.dataRitiro}
              onChange={(e) => setOrdine({ ...ordine, dataRitiro: e.target.value })}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Ora Ritiro *
            </label>
            <Input
              type="time"
              value={ordine.oraRitiro}
              onChange={(e) => setOrdine({ ...ordine, oraRitiro: e.target.value })}
              className="w-full"
            />
          </div>
        </div>

        {/* Sezione Prodotti */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Prodotti
          </h3>
          
          {/* Form aggiungi prodotto */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium mb-1">Prodotto</label>
                <Select value={prodottoCorrente.nome} onValueChange={handleProdottoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Seleziona --</SelectItem>
                    {prodottiPredefiniti.map(p => (
                      <SelectItem key={p.nome} value={p.nome}>
                        {p.nome} - €{p.prezzo}/{p.unita}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">Quantità</label>
                <Input
                  type="number"
                  value={prodottoCorrente.quantita}
                  onChange={(e) => setProdottoCorrente({
                    ...prodottoCorrente,
                    quantita: parseFloat(e.target.value) || 0
                  })}
                  step="0.1"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">Unità</label>
                <Select 
                  value={prodottoCorrente.unita} 
                  onValueChange={(v) => setProdottoCorrente({ ...prodottoCorrente, unita: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="pezzi">pezzi</SelectItem>
                    <SelectItem value="€">€</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">Prezzo/unità</label>
                <Input
                  type="number"
                  value={prodottoCorrente.prezzo}
                  onChange={(e) => setProdottoCorrente({
                    ...prodottoCorrente,
                    prezzo: parseFloat(e.target.value) || 0
                  })}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            
            <Button onClick={aggiungiProdotto} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Prodotto
            </Button>
          </div>

          {/* Lista prodotti aggiunti */}
          {ordine.prodotti.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Prodotto</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Qtà</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Unità</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Prezzo/u</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Totale</th>
                    <th className="px-4 py-2 text-center text-sm font-medium">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ordine.prodotti.map((p, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{p.nome}</td>
                      <td className="px-4 py-2 text-sm">{p.quantita}</td>
                      <td className="px-4 py-2 text-sm">{p.unita}</td>
                      <td className="px-4 py-2 text-sm">€{p.prezzo.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm font-semibold">
                        €{(p.quantita * p.prezzo).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          onClick={() => rimuoviProdotto(index)}
                          size="sm"
                          variant="destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-right font-semibold">
                      Totale Ordine:
                    </td>
                    <td colSpan="2" className="px-4 py-3 text-lg font-bold text-green-600">
                      €{calcolaTotale().toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-2">Note</label>
          <textarea
            value={ordine.note}
            onChange={(e) => setOrdine({ ...ordine, note: e.target.value })}
            className="w-full p-3 border rounded-lg"
            rows="3"
            placeholder="Note aggiuntive per l'ordine..."
          />
        </div>

        {/* Pulsanti azione */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            onClick={() => {
              setOrdine({
                nomeCliente: '',
                telefono: '',
                dataRitiro: new Date().toISOString().split('T')[0],
                oraRitiro: '',
                prodotti: [],
                note: '',
                stato: 'nuovo'
              });
              toast.success('Form resettato');
            }}
            variant="outline"
          >
            <X className="h-4 w-4 mr-2" />
            Cancella
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={!ordine.nomeCliente || ordine.prodotti.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Salva Ordine
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default NuovoOrdine;