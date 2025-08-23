import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const FornitoreForm = ({ onSubmit, onCancel, fornitore = null }) => {
  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    referente: '',
    email: '',
    telefono: '',
    indirizzo: '',
    note: ''
  });
  
  const [errors, setErrors] = useState({});
  
  // Popolamento form con i dati del fornitore se in modalità modifica
  useEffect(() => {
    if (fornitore) {
      setFormData({
        id: fornitore.id,
        nome: fornitore.nome || '',
        referente: fornitore.referente || '',
        email: fornitore.email || '',
        telefono: fornitore.telefono || '',
        indirizzo: fornitore.indirizzo || '',
        note: fornitore.note || ''
      });
    }
  }, [fornitore]);
  
  // Gestione cambiamento dei campi
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
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
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Il nome è obbligatorio';
    }
    
    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Email non valida';
    }
    
    if (formData.telefono && !isValidPhone(formData.telefono)) {
      newErrors.telefono = 'Numero di telefono non valido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validazione email
  const isValidEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };
  
  // Validazione telefono
  const isValidPhone = (phone) => {
    // Accetta numeri con formato internazionale o locale, può contenere spazi, trattini o parentesi
    const re = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return re.test(String(phone));
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
          {fornitore ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div>
            <Label htmlFor="nome">Nome Fornitore *</Label>
            <Input
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
          </div>
          
          {/* Referente */}
          <div>
            <Label htmlFor="referente">Referente</Label>
            <Input
              id="referente"
              name="referente"
              value={formData.referente}
              onChange={handleChange}
            />
          </div>
          
          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          
          {/* Telefono */}
          <div>
            <Label htmlFor="telefono">Telefono</Label>
            <Input
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className={errors.telefono ? 'border-red-500' : ''}
            />
            {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
          </div>
          
          {/* Indirizzo */}
          <div className="md:col-span-2">
            <Label htmlFor="indirizzo">Indirizzo</Label>
            <Input
              id="indirizzo"
              name="indirizzo"
              value={formData.indirizzo}
              onChange={handleChange}
            />
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
            {fornitore ? 'Aggiorna' : 'Salva'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FornitoreForm;