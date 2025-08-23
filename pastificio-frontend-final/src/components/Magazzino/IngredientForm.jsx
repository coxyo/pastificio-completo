import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const categorieDefault = [
  'Pasta',
  'Farina',
  'Condimenti',
  'Latticini',
  'Uova',
  'Prodotti freschi',
  'Spezie',
  'Prodotti secchi',
  'Imballaggi',
  'Altro'
];

const unitaMisuraOptions = [
  'kg',
  'g',
  'l',
  'ml',
  'pz',
  'un'
];

const IngredientForm = ({ onSubmit, onCancel, fornitori = [], ingrediente = null }) => {
  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    categoria: 'Altro',
    quantita: 0,
    unitaMisura: 'kg',
    soglia: 0,
    prezzoUnitario: 0,
    fornitoreId: '',
    fornitoreNome: '',
    note: ''
  });
  
  const [categoriaPersonalizzata, setCategoriaPersonalizzata] = useState('');
  const [showCategoriaPersonalizzata, setShowCategoriaPersonalizzata] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Popolamento form con i dati dell'ingrediente se in modalità modifica
  useEffect(() => {
    if (ingrediente) {
      setFormData({
        id: ingrediente.id,
        nome: ingrediente.nome || '',
        categoria: ingrediente.categoria || 'Altro',
        quantita: ingrediente.quantita || 0,
        unitaMisura: ingrediente.unitaMisura || 'kg',
        soglia: ingrediente.soglia || 0,
        prezzoUnitario: ingrediente.prezzoUnitario || 0,
        fornitoreId: ingrediente.fornitoreId || '',
        fornitoreNome: ingrediente.fornitoreNome || '',
        note: ingrediente.note || ''
      });
      
      // Controlla se la categoria esiste nell'elenco predefinito
      if (!categorieDefault.includes(ingrediente.categoria)) {
        setShowCategoriaPersonalizzata(true);
        setCategoriaPersonalizzata(ingrediente.categoria);
      }
    }
  }, [ingrediente]);
  
  // Gestione cambiamento dei campi
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;
    
    // Converti valori numerici
    if (type === 'number') {
      parsedValue = parseFloat(value) || 0;
    }
    
    setFormData({
      ...formData,
      [name]: parsedValue
    });
    
    // Reset dell'errore quando l'utente modifica il campo
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // Gestione cambiamento fornitore
  const handleFornitoreChange = (e) => {
    const fornitoreId = e.target.value;
    const fornitore = fornitori.find(f => f.id === parseInt(fornitoreId));
    
    setFormData({
      ...formData,
      fornitoreId: fornitoreId,
      fornitoreNome: fornitore ? fornitore.nome : ''
    });
  };
  
  // Gestione categoria personalizzata
  const handleCategoriaChange = (e) => {
    const value = e.target.value;
    
    if (value === 'personalizzata') {
      setShowCategoriaPersonalizzata(true);
      setCategoriaPersonalizzata('');
    } else {
      setShowCategoriaPersonalizzata(false);
      setFormData({
        ...formData,
        categoria: value
      });
    }
  };
  
  const handleCategoriaPersonalizzataChange = (e) => {
    const value = e.target.value;
    setCategoriaPersonalizzata(value);
    setFormData({
      ...formData,
      categoria: value
    });
  };
  
  // Validazione form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Il nome è obbligatorio';
    }
    
    if (!formData.categoria.trim()) {
      newErrors.categoria = 'La categoria è obbligatoria';
    }
    
    if (formData.quantita < 0) {
      newErrors.quantita = 'La quantità non può essere negativa';
    }
    
    if (formData.soglia < 0) {
      newErrors.soglia = 'La soglia non può essere negativa';
    }
    
    if (formData.prezzoUnitario < 0) {
      newErrors.prezzoUnitario = 'Il prezzo non può essere negativo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Invio form
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {ingrediente ? 'Modifica Ingrediente' : 'Nuovo Ingrediente'}
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
          </div>
          
          {/* Categoria */}
          <div>
            <Label htmlFor="categoria">Categoria *</Label>
            <select
              id="categoria"
              name="categoria"
              value={showCategoriaPersonalizzata ? 'personalizzata' : formData.categoria}
              onChange={handleCategoriaChange}
              className="w-full p-2 border rounded"
            >
              {categorieDefault.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="personalizzata">Personalizzata...</option>
            </select>
            {errors.categoria && <p className="text-red-500 text-sm mt-1">{errors.categoria}</p>}
          </div>
          
          {/* Categoria personalizzata */}
          {showCategoriaPersonalizzata && (
            <div>
              <Label htmlFor="categoriaPersonalizzata">Categoria Personalizzata *</Label>
              <Input
                id="categoriaPersonalizzata"
                name="categoriaPersonalizzata"
                value={categoriaPersonalizzata}
                onChange={handleCategoriaPersonalizzataChange}
              />
            </div>
          )}
          
          {/* Quantità */}
          <div>
            <Label htmlFor="quantita">Quantità *</Label>
            <Input
              id="quantita"
              name="quantita"
              type="number"
              step="0.01"
              value={formData.quantita}
              onChange={handleChange}
              className={errors.quantita ? 'border-red-500' : ''}
            />
            {errors.quantita && <p className="text-red-500 text-sm mt-1">{errors.quantita}</p>}
          </div>
          
          {/* Unità di misura */}
          <div>
            <Label htmlFor="unitaMisura">Unità di Misura *</Label>
            <select
              id="unitaMisura"
              name="unitaMisura"
              value={formData.unitaMisura}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              {unitaMisuraOptions.map(um => (
                <option key={um} value={um}>{um}</option>
              ))}
            </select>
          </div>
          
          {/* Soglia */}
          <div>
            <Label htmlFor="soglia">Soglia Minima *</Label>
            <Input
              id="soglia"
              name="soglia"
              type="number"
              step="0.01"
              value={formData.soglia}
              onChange={handleChange}
              className={errors.soglia ? 'border-red-500' : ''}
            />
            {errors.soglia && <p className="text-red-500 text-sm mt-1">{errors.soglia}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Quantità minima sotto la quale ricevere un avviso
            </p>
          </div>
          
          {/* Prezzo Unitario */}
          <div>
            <Label htmlFor="prezzoUnitario">Prezzo Unitario (€) *</Label>
            <Input
              id="prezzoUnitario"
              name="prezzoUnitario"
              type="number"
              step="0.01"
              value={formData.prezzoUnitario}
              onChange={handleChange}
              className={errors.prezzoUnitario ? 'border-red-500' : ''}
            />
            {errors.prezzoUnitario && <p className="text-red-500 text-sm mt-1">{errors.prezzoUnitario}</p>}
          </div>
          
          {/* Fornitore */}
          <div>
            <Label htmlFor="fornitoreId">Fornitore</Label>
            <select
              id="fornitoreId"
              name="fornitoreId"
              value={formData.fornitoreId}
              onChange={handleFornitoreChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Seleziona un fornitore</option>
              {fornitori.map(fornitore => (
                <option key={fornitore.id} value={fornitore.id}>
                  {fornitore.nome}
                </option>
              ))}
            </select>
          </div>
          
          {/* Note */}
          <div className="md:col-span-2">
            <Label htmlFor="note">Note</Label>
            <textarea
              id="note"
              name="note"
              rows="3"
              value={formData.note}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            ></textarea>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" onClick={onCancel} variant="outline">
            Annulla
          </Button>
          <Button type="submit">
            {ingrediente ? 'Aggiorna' : 'Salva'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default IngredientForm;