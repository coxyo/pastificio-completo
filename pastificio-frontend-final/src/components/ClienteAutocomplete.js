// components/ClienteAutocomplete.js
import React, { useState, useEffect } from 'react';
import { 
  Autocomplete, 
  TextField, 
  Box, 
  Typography, 
  Chip,
  CircularProgress 
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const ClienteAutocomplete = ({ 
  value, 
  onChange, 
  onClienteSelezionato,
  disabled = false 
}) => {
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Carica clienti dal database
  useEffect(() => {
    caricaClienti();
  }, []);

  const caricaClienti = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/clienti`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setClienti(data.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento clienti:', error);
      // Fallback a localStorage se l'API non funziona
      const ordiniSalvati = JSON.parse(localStorage.getItem('ordini') || '[]');
      const clientiUnici = new Map();
      
      ordiniSalvati.forEach(ordine => {
        if (ordine.nomeCliente && ordine.telefono) {
          const key = ordine.telefono;
          if (!clientiUnici.has(key)) {
            clientiUnici.set(key, {
              _id: key,
              nome: ordine.nomeCliente,
              telefono: ordine.telefono,
              email: ordine.email || '',
              indirizzo: ordine.indirizzo || '',
              note: ordine.noteCliente || '',
              ultimoOrdine: ordine.dataRitiro
            });
          }
        }
      });
      
      setClienti(Array.from(clientiUnici.values()));
    } finally {
      setLoading(false);
    }
  };

  // Cerca cliente mentre digiti
  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    onChange({ target: { name: 'nomeCliente', value: newInputValue } });
  };

  // Quando selezioni un cliente dalla lista
  const handleClienteSelezionato = (event, cliente) => {
    if (cliente) {
      // Compila automaticamente i campi
      onClienteSelezionato({
        nomeCliente: cliente.nome || cliente.nomeCliente,
        telefono: cliente.telefono,
        email: cliente.email || '',
        indirizzo: cliente.indirizzo || '',
        noteCliente: cliente.note || ''
      });
    }
  };

  return (
    <Autocomplete
      freeSolo
      options={clienti}
      loading={loading}
      value={value}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleClienteSelezionato}
      disabled={disabled}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return option.nome || option.nomeCliente || '';
      }}
      filterOptions={(options, { inputValue }) => {
        const filterValue = inputValue.toLowerCase();
        return options.filter(option => 
          (option.nome || option.nomeCliente || '').toLowerCase().includes(filterValue) ||
          (option.telefono || '').includes(filterValue)
        );
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <PersonIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {option.nome || option.nomeCliente}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 3 }}>
              {option.telefono && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {option.telefono}
                  </Typography>
                </Box>
              )}
              {option.indirizzo && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOnIcon sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {option.indirizzo}
                  </Typography>
                </Box>
              )}
            </Box>
            {option.ultimoOrdine && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 3, display: 'block', mt: 0.5 }}>
                Ultimo ordine: {new Date(option.ultimoOrdine).toLocaleDateString('it-IT')}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Nome Cliente"
          required
          placeholder="Digita per cercare o aggiungi nuovo..."
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          helperText="Inizia a digitare per cercare clienti esistenti o inserisci un nuovo nome"
        />
      )}
    />
  );
};

export default ClienteAutocomplete;