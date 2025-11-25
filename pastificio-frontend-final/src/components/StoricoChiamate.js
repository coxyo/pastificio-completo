// components/StoricoChiamate.js
import React, { useState, useEffect } from 'react';
import { Phone, Tag as TagIcon, User, Calendar, Clock, Search, Filter, Download } from 'lucide-react';
import axios from 'axios';
import TagManager from './TagManager';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app';

export function StoricoChiamate() {
  const [chiamate, setChiamate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtri, setFiltri] = useState({
    cerca: '',
    tag: '',
    esito: '',
    dataInizio: '',
    dataFine: ''
  });
  const [tuttiITags, setTuttiITags] = useState([]);
  const [selectedChiamata, setSelectedChiamata] = useState(null);
  const [showTagManager, setShowTagManager] = useState(false);

  useEffect(() => {
    caricaChiamate();
    caricaTuttiITags();
  }, [filtri]);

  const caricaChiamate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filtri.tag) params.append('tag', filtri.tag);
      if (filtri.esito) params.append('esito', filtri.esito);
      if (filtri.dataInizio) params.append('dataInizio', filtri.dataInizio);
      if (filtri.dataFine) params.append('dataFine', filtri.dataFine);
      params.append('limit', '100');
      params.append('sort', '-dataChiamata');

      const response = await axios.get(
        `${API_URL}/chiamate?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let risultati = response.data.data || [];

      // Filtro locale per ricerca
      if (filtri.cerca) {
        const cerca = filtri.cerca.toLowerCase();
        risultati = risultati.filter(c => 
          c.numeroTelefono?.includes(cerca) ||
          c.cliente?.nome?.toLowerCase().includes(cerca) ||
          c.cliente?.cognome?.toLowerCase().includes(cerca) ||
          c.note?.toLowerCase().includes(cerca)
        );
      }

      setChiamate(risultati);
    } catch (error) {
      console.error('Errore caricamento chiamate:', error);
    } finally {
      setLoading(false);
    }
  };

  const caricaTuttiITags = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chiamate/tags/all`, {

        headers: { Authorization: `Bearer ${token}` }
      });
      setTuttiITags(response.data.data || []);
    } catch (error) {
      console.error('Errore caricamento tags:', error);
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Data', 'Ora', 'Numero', 'Cliente', 'Esito', 'Tags', 'Ordine', 'Note'].join(','),
      ...chiamate.map(c => [
        new Date(c.dataChiamata).toLocaleDateString('it-IT'),
        new Date(c.dataChiamata).toLocaleTimeString('it-IT'),
        c.numeroTelefono,
        c.cliente ? `${c.cliente.nome} ${c.cliente.cognome}` : 'Sconosciuto',
        c.esito,
        c.tags.join('; '),
        c.ordineGenerato ? 'Sì' : 'No',
        (c.note || '').replace(/,/g, ';')
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storico_chiamate_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getEsitoColor = (esito) => {
    switch (esito) {
      case 'risposto': return '#22c55e';
      case 'non-risposto': return '#f59e0b';
      case 'occupato': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getEsitoLabel = (esito) => {
    switch (esito) {
      case 'risposto': return '✓ Risposto';
      case 'non-risposto': return '✗ Non risposto';
      case 'occupato': return '⊗ Occupato';
      default: return esito;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
          📞 Storico Chiamate
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Visualizza e gestisci tutte le chiamate ricevute
        </p>
      </div>

      {/* Filtri */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Filtri</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Ricerca */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Cerca
            </label>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#9ca3af' }} />
              <input
                type="text"
                value={filtri.cerca}
                onChange={(e) => setFiltri({...filtri, cerca: e.target.value})}
                placeholder="Nome, numero, note..."
                style={{
                  width: '100%',
                  padding: '10px 10px 10px 36px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Tag */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Tag
            </label>
            <select
              value={filtri.tag}
              onChange={(e) => setFiltri({...filtri, tag: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">Tutti i tag</option>
              {tuttiITags.map(t => (
                <option key={t.tag} value={t.tag}>{t.tag} ({t.count})</option>
              ))}
            </select>
          </div>

          {/* Esito */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Esito
            </label>
            <select
              value={filtri.esito}
              onChange={(e) => setFiltri({...filtri, esito: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">Tutti</option>
              <option value="risposto">Risposto</option>
              <option value="non-risposto">Non risposto</option>
              <option value="occupato">Occupato</option>
            </select>
          </div>

          {/* Data inizio */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Da
            </label>
            <input
              type="date"
              value={filtri.dataInizio}
              onChange={(e) => setFiltri({...filtri, dataInizio: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Data fine */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              A
            </label>
            <input
              type="date"
              value={filtri.dataFine}
              onChange={(e) => setFiltri({...filtri, dataFine: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={() => setFiltri({ cerca: '', tag: '', esito: '', dataInizio: '', dataFine: '' })}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reset Filtri
          </button>
          <button
            onClick={exportCSV}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download style={{ width: '16px', height: '16px' }} />
            Esporta CSV
          </button>
        </div>
      </div>

      {/* Lista chiamate */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
          Caricamento chiamate...
        </div>
      ) : chiamate.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center',
          color: '#9ca3af',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <Phone style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#d1d5db' }} />
          <p style={{ fontSize: '16px', fontWeight: 600 }}>Nessuna chiamata trovata</p>
          <p style={{ fontSize: '14px' }}>Prova a modificare i filtri</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {chiamate.map(chiamata => (
            <div
              key={chiamata._id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 150ms'
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                {/* Icona */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: getEsitoColor(chiamata.esito) + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Phone style={{ width: '24px', height: '24px', color: getEsitoColor(chiamata.esito) }} />
                </div>

                {/* Contenuto */}
                <div style={{ flex: 1 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0', color: '#111827' }}>
                        {chiamata.numeroTelefono}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#6b7280' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar style={{ width: '14px', height: '14px' }} />
                          {new Date(chiamata.dataChiamata).toLocaleDateString('it-IT')}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock style={{ width: '14px', height: '14px' }} />
                          {new Date(chiamata.dataChiamata).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Esito */}
                    <span style={{
                      backgroundColor: getEsitoColor(chiamata.esito) + '20',
                      color: getEsitoColor(chiamata.esito),
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 600
                    }}>
                      {getEsitoLabel(chiamata.esito)}
                    </span>
                  </div>

                  {/* Cliente */}
                  {chiamata.cliente && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                      padding: '8px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px'
                    }}>
                      <User style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                        {chiamata.cliente.nome} {chiamata.cliente.cognome}
                      </span>
                      {chiamata.cliente.codiceCliente && (
                        <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                          ({chiamata.cliente.codiceCliente})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {chiamata.tags && chiamata.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {chiamata.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Note */}
                  {chiamata.note && (
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '8px 0 0 0',
                      fontStyle: 'italic'
                    }}>
                      "{chiamata.note}"
                    </p>
                  )}

                  {/* Actions */}
                  <div style={{ marginTop: '12px' }}>
                    <button
                      onClick={() => {
                        setSelectedChiamata(chiamata);
                        setShowTagManager(true);
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'white',
                        border: '2px solid #3b82f6',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#3b82f6',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <TagIcon style={{ width: '14px', height: '14px' }} />
                      Gestisci Tag
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TagManager */}
      {selectedChiamata && (
        <TagManager
          isOpen={showTagManager}
          onClose={() => {
            setShowTagManager(false);
            setSelectedChiamata(null);
          }}
          chiamataId={selectedChiamata._id}
          tagsAttuali={selectedChiamata.tags}
          onTagsUpdated={() => {
            caricaChiamate();
            setShowTagManager(false);
            setSelectedChiamata(null);
          }}
        />
      )}
    </div>
  );
}

export default StoricoChiamate;