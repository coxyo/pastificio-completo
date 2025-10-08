// src/components/DropdownClientiAlfabetico.js
import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, User } from 'lucide-react';

const DropdownClientiAlfabetico = ({ 
  clienti, 
  clienteSelezionato, 
  onSelezionaCliente,
  onNuovoCliente 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [letteraSelezionata, setLetteraSelezionata] = useState('');
  
  // Genera lettere alfabeto con conteggio clienti
  const alfabeto = useMemo(() => {
    const lettere = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    return lettere.map(lettera => {
      const count = clienti.filter(c => 
        c.nome.toUpperCase().startsWith(lettera)
      ).length;
      
      return { lettera, count, disabled: count === 0 };
    });
  }, [clienti]);
  
  // Filtra clienti per lettera e ricerca
  const clientiFiltrati = useMemo(() => {
    let filtrati = [...clienti];
    
    // Filtro per lettera selezionata
    if (letteraSelezionata) {
      filtrati = filtrati.filter(c => 
        c.nome.toUpperCase().startsWith(letteraSelezionata)
      );
    }
    
    // Filtro per ricerca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtrati = filtrati.filter(c =>
        c.nome.toLowerCase().includes(searchLower) ||
        c.telefono?.includes(searchTerm) ||
        c.codiceCliente?.toLowerCase().includes(searchLower)
      );
    }
    
    // Ordina alfabeticamente
    return filtrati.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [clienti, letteraSelezionata, searchTerm]);
  
  const handleSelezionaCliente = (cliente) => {
    onSelezionaCliente(cliente);
    setIsOpen(false);
    setSearchTerm('');
    setLetteraSelezionata('');
  };
  
  const handleClearSelection = () => {
    onSelezionaCliente(null);
    setSearchTerm('');
    setLetteraSelezionata('');
  };

  return (
    <div className="relative">
      {/* Input principale */}
      <div 
        className="flex items-center border rounded-lg px-3 py-2 bg-white cursor-pointer hover:border-blue-500 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <User className="w-5 h-5 text-gray-400 mr-2" />
        
        {clienteSelezionato ? (
          <div className="flex-1 flex items-center justify-between">
            <div>
              <div className="font-medium">{clienteSelezionato.nome}</div>
              {clienteSelezionato.telefono && (
                <div className="text-sm text-gray-500">{clienteSelezionato.telefono}</div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearSelection();
              }}
              className="ml-2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        ) : (
          <span className="text-gray-400">Seleziona cliente esistente o aggiungine uno nuovo</span>
        )}
      </div>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border rounded-lg shadow-xl max-h-[500px] overflow-hidden">
          {/* Header: Ricerca */}
          <div className="p-3 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome, telefono o codice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          {/* Filtro alfabetico */}
          <div className="p-2 border-b bg-white overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              <button
                onClick={() => setLetteraSelezionata('')}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  !letteraSelezionata 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tutti
              </button>
              
              {alfabeto.map(({ lettera, count, disabled }) => (
                <button
                  key={lettera}
                  onClick={() => !disabled && setLetteraSelezionata(lettera)}
                  disabled={disabled}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    letteraSelezionata === lettera
                      ? 'bg-blue-500 text-white'
                      : disabled
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={disabled ? 'Nessun cliente' : `${count} client${count === 1 ? 'e' : 'i'}`}
                >
                  {lettera}
                  {!disabled && count > 0 && (
                    <span className="ml-1 text-[10px] opacity-70">({count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Lista clienti */}
          <div className="max-h-[300px] overflow-y-auto">
            {clientiFiltrati.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nessun cliente trovato</p>
                {searchTerm && (
                  <p className="text-sm mt-1">
                    Prova a modificare la ricerca
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {clientiFiltrati.map((cliente) => (
                  <div
                    key={cliente._id || cliente.codiceCliente}
                    onClick={() => handleSelezionaCliente(cliente)}
                    className={`p-3 hover:bg-blue-50 cursor-pointer transition-colors ${
                      clienteSelezionato?._id === cliente._id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {cliente.nome}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {cliente.telefono && (
                            <span className="mr-3">📞 {cliente.telefono}</span>
                          )}
                          {cliente.codiceCliente && (
                            <span className="text-blue-600 font-mono">
                              {cliente.codiceCliente}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {cliente.livelloFedelta && (
                        <div className="ml-3 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          {cliente.livelloFedelta}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer: Nuovo cliente */}
          <div className="p-3 border-t bg-gray-50">
            <button
              onClick={() => {
                onNuovoCliente();
                setIsOpen(false);
              }}
              className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              + Aggiungi Nuovo Cliente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownClientiAlfabetico;