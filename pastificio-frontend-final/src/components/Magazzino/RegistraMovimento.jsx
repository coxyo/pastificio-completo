import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const RegistraMovimento = ({ onSubmit, onCancel, ingredienti = [], fornitori = [] }) => {
  const [formData, setFormData] = useState({
    tipo: 'carico',
    ingredienteId: '',
    quantita: 1,
    fornitoreId: '',
    data: new Date().toISOString().split('T')[0],
    note: ''
  });
  
  const [errors, setErrors] = useState({});
  
  // Ottieni l'ingrediente selezionato
  const ingredienteSelezionato = ingredienti.find(ing => ing.id === parseInt(formData.ingredienteId));
  
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
  
  // Validazione form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.ingredienteId) {
      newErrors.ingredienteId = 'Seleziona un ingrediente';
    }
    
    if (formData.quantita <= 0) {
      newErrors.quantita = 'La quantità deve essere maggiore di zero';
    }
    
    if (formData.tipo === 'carico' && !formData.fornitoreId) {
      newErrors.fornitoreId = 'Seleziona un fornitore per il carico';
    }
    
    // Verifica che in caso di scarico ci sia disponibilità sufficiente
    if (formData.tipo === 'scarico' && ingredienteSelezionato) {
      if (ingredienteSelezionato.quantita < formData.quantita) {
        newErrors.quantita = `Quantità insufficiente. Disponibile: ${ingredienteSelezionato.quantita} ${ingredienteSelezionato.unitaMisura}`;
      }
    }
    
    if (!formData.data) {
      newErrors.data = 'La data è obbligatoria';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Invio form
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Preparazione del movimento con informazioni aggiuntive
      const movimento = {
        ...formData,
        ingredienteId: parseInt(formData.ingredienteId),
fornitoreId: formData.fornitoreId ? parseInt(formData.fornitoreId) : null,
        data: formData.data,
        timestamp: new Date().toISOString()
      };
      
      onSubmit(movimento);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Registra Movimento</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo movimento */}
          <div>
            <Label htmlFor="tipo">Tipo Movimento *</Label>
            <div className="flex mt-1 space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="tipo"
                  value="carico"
                  checked={formData.tipo === 'carico'}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-gray-700">Carico</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="tipo"
                  value="scarico"
                  checked={formData.tipo === 'scarico'}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-red-600"
                />
                <span className="ml-2 text-gray-700">Scarico</span>
              </label>
            </div>
          </div>
          
          {/* Data */}
          <div>
            <Label htmlFor="data">Data *</Label>
            <Input
              id="data"
              name="data"
              type="date"
              value={formData.data}
              onChange={handleChange}
              className={errors.data ? 'border-red-500' : ''}
            />
            {errors.data && <p className="text-red-500 text-sm mt-1">{errors.data}</p>}
          </div>
          
          {/* Ingrediente */}
          <div>
            <Label htmlFor="ingredienteId">Ingrediente *</Label>
            <select
              id="ingredienteId"
              name="ingredienteId"
              value={formData.ingredienteId}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.ingredienteId ? 'border-red-500' : ''}`}
            >
              <option value="">Seleziona un ingrediente</option>
              {ingredienti.map(ing => (
                <option key={ing.id} value={ing.id}>
                  {ing.nome} - Disponibile: {ing.quantita} {ing.unitaMisura}
                </option>
              ))}
            </select>
            {errors.ingredienteId && <p className="text-red-500 text-sm mt-1">{errors.ingredienteId}</p>}
          </div>
          
          {/* Quantità */}
          <div>
            <Label htmlFor="quantita">Quantità *</Label>
            <div className="flex items-center">
              <Input
                id="quantita"
                name="quantita"
                type="number"
                step="0.01"
                value={formData.quantita}
                onChange={handleChange}
                className={`flex-1 ${errors.quantita ? 'border-red-500' : ''}`}
              />
              <span className="ml-2">{ingredienteSelezionato?.unitaMisura || ''}</span>
            </div>
            {errors.quantita && <p className="text-red-500 text-sm mt-1">{errors.quantita}</p>}
          </div>
          
          {/* Fornitore (solo per carico) */}
          {formData.tipo === 'carico' && (
            <div>
              <Label htmlFor="fornitoreId">Fornitore *</Label>
              <select
                id="fornitoreId"
                name="fornitoreId"
                value={formData.fornitoreId}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.fornitoreId ? 'border-red-500' : ''}`}
              >
                <option value="">Seleziona un fornitore</option>
                {fornitori.map(fornitore => (
                  <option key={fornitore.id} value={fornitore.id}>
                    {fornitore.nome}
                  </option>
                ))}
              </select>
              {errors.fornitoreId && <p className="text-red-500 text-sm mt-1">{errors.fornitoreId}</p>}
            </div>
          )}
          
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
              placeholder={formData.tipo === 'scarico' ? 'Motivo dello scarico...' : 'Dettagli del carico...'}
            ></textarea>
          </div>
        </div>
        
        {/* Sommario e informazioni utili */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="font-bold mb-2">Riepilogo movimento</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <span className="font-medium">Tipo:</span> 
              <span className={formData.tipo === 'carico' ? 'text-green-600' : 'text-red-600'}>
                {formData.tipo === 'carico' ? ' Carico' : ' Scarico'}
              </span>
            </li>
            {ingredienteSelezionato && (
              <>
                <li>
                  <span className="font-medium">Ingrediente:</span> {ingredienteSelezionato.nome}
                </li>
                <li>
                  <span className="font-medium">Quantità attuale:</span> {ingredienteSelezionato.quantita} {ingredienteSelezionato.unitaMisura}
                </li>
                <li>
                  <span className="font-medium">Nuova quantità:</span> 
                  <span className={formData.tipo === 'scarico' && ingredienteSelezionato.quantita - formData.quantita < ingredienteSelezionato.soglia ? 'text-red-600 font-bold' : ''}>
                    {' '}
                    {formData.tipo === 'carico' 
                      ? (ingredienteSelezionato.quantita + formData.quantita).toFixed(2)
                      : (ingredienteSelezionato.quantita - formData.quantita).toFixed(2)
                    } {ingredienteSelezionato.unitaMisura}
                  </span>
                </li>
                {formData.tipo === 'scarico' && ingredienteSelezionato.quantita - formData.quantita < ingredienteSelezionato.soglia && (
                  <li className="text-red-600">
                    Attenzione: questo scarico porterà la quantità sotto la soglia minima!
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" onClick={onCancel} variant="outline">
            Annulla
          </Button>
          <Button 
            type="submit" 
            className={formData.tipo === 'carico' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {formData.tipo === 'carico' ? 'Registra Carico' : 'Registra Scarico'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegistraMovimento;