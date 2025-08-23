// src/components/Report/Preview.js
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

// Dati di esempio per l'anteprima
const sampleData = {
  consegna: {
    tipoDocumento: 'DOCUMENTO DI CONSEGNA',
    nomeCliente: 'Mario Rossi',
    telefono: '123456789',
    dataRitiro: '15/03/2025',
    prodotti: [
      { prodotto: 'Culurgiones', quantita: 2, unita: 'Kg', prezzo: 15.00 },
      { prodotto: 'Sebadas', quantita: 10, unita: 'pz', prezzo: 1.50 }
    ],
    totaleOrdine: 45.00,
    note: 'Consegna al piano terra'
  },
  fattura: {
    tipoDocumento: 'FATTURA',
    nomeCliente: 'Ristorante Da Luigi',
    telefono: '987654321',
    dataRitiro: '10/03/2025',
    prodotti: [
      { prodotto: 'Pasta fresca', quantita: 5, unita: 'Kg', prezzo: 12.00 },
      { prodotto: 'Dolci sardi', quantita: 20, unita: 'pz', prezzo: 2.50 }
    ],
    totaleOrdine: 110.00,
    note: 'Fattura con rimessa diretta'
  },
  report: {
    tipoDocumento: 'REPORT GIORNALIERO',
    data: '15/03/2025',
    ordini: [
      { cliente: 'Mario Rossi', prodotti: 'Culurgiones (2 Kg)', totale: 30.00 },
      { cliente: 'Giuseppe Verdi', prodotti: 'Sebadas (10 pz)', totale: 15.00 }
    ],
    totaleGiorno: 45.00
  }
};

// Funzione per rendere il markdown con handlebars-like templates
const renderTemplate = (template, data) => {
  // Implementazione molto semplificata di un engine template
  let output = template;
  
  // Sostituisci le variabili {{var}}
  output = output.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], data);
    return value !== undefined ? value : match;
  });
  
  // Gestione basilare del ciclo each
  const eachRegex = /\{\{#each ([^{}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  output = output.replace(eachRegex, (match, collection, template) => {
    const items = collection.split('.').reduce((obj, k) => obj?.[k], data);
    if (!Array.isArray(items)) return '';
    
    return items.map(item => {
      let itemTemplate = template;
      // Sostituisci le variabili dell'item
      return itemTemplate.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
        return item[key] !== undefined ? item[key] : match;
      });
    }).join('');
  });
  
  // Gestione condizionale dell'if
  const ifRegex = /\{\{#if ([^{}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  output = output.replace(ifRegex, (match, condition, template) => {
    const value = condition.split('.').reduce((obj, k) => obj?.[k], data);
    return value ? template : '';
  });
  
  return output;
};

const Preview = ({ templateContent, templateType }) => {
  // Seleziona i dati di esempio in base al tipo di template
  const data = sampleData[templateType] || sampleData.report;
  
  // Renderizza il template
  const renderedContent = renderTemplate(templateContent, data);
  
  return (
    <Paper sx={{ p: 3, maxHeight: 500, overflow: 'auto' }}>
      <Box sx={{ whiteSpace: 'pre-wrap' }}>
        {renderedContent}
      </Box>
    </Paper>
  );
};

export default Preview;