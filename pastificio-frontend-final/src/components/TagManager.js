// components/TagManager.js
import React, { useState, useEffect } from 'react';
import { X, Tag, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app';

// Tag predefiniti con colori
const TAGS_PREDEFINITI = [
  { nome: 'URGENTE', colore: '#ef4444', categoria: 'priorita' },
  { nome: 'IMPORTANTE', colore: '#f59e0b', categoria: 'priorita' },
  { nome: 'NORMALE', colore: '#10b981', categoria: 'priorita' },
  { nome: 'CLIENTE-VIP', colore: '#8b5cf6', categoria: 'cliente' },
  { nome: 'CLIENTE-NUOVO', colore: '#06b6d4', categoria: 'cliente' },
  { nome: 'ORDINE', colore: '#3b82f6', categoria: 'azione' },
  { nome: 'RECLAMO', colore: '#dc2626', categoria: 'azione' },
  { nome: 'INFORMAZIONI', colore: '#6b7280', categoria: 'azione' },
  { nome: 'PREVENTIVO', colore: '#14b8a6', categoria: 'azione' },
  { nome: 'RICHIAMALE', colore: '#f97316', categoria: 'follow-up' },
  { nome: 'DA-GESTIRE', colore: '#eab308', categoria: 'follow-up' },
  { nome: 'GESTITO', colore: '#22c55e', categoria: 'follow-up' }
];

export function TagManager({ isOpen, onClose, chiamataId, tagsAttuali = [], onTagsUpdated }) {
  const [tagsSelezionati, setTagsSelezionati] = useState(tagsAttuali);
  const [nuovoTag, setNuovoTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tuttiITags, setTuttiITags] = useState([]);

  // Carica tutti i tag usati
  useEffect(() => {
    if (isOpen) {
      caricaTuttiITags();
      setTagsSelezionati(tagsAttuali);
    }
  }, [isOpen, tagsAttuali]);

  const caricaTuttiITags = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/chiamate/tags/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTuttiITags(response.data.data || []);
    } catch (err) {
      console.error('Errore caricamento tags:', err);
    }
  };

  const getColorForTag = (nomeTag) => {
    const predefinito = TAGS_PREDEFINITI.find(t => t.nome === nomeTag);
    if (predefinito) return predefinito.colore;
    
    // Colore basato sul tag usato
    const tagUsato = tuttiITags.find(t => t.tag === nomeTag);
    if (tagUsato) {
      // Genera colore consistente basato sul nome
      const hash = nomeTag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hue = hash % 360;
      return `hsl(${hue}, 70%, 50%)`;
    }
    
    return '#6b7280'; // Grigio default
  };

  const toggleTag = (nomeTag) => {
    setTagsSelezionati(prev => 
      prev.includes(nomeTag)
        ? prev.filter(t => t !== nomeTag)
        : [...prev, nomeTag]
    );
  };

  const aggiungiNuovoTag = () => {
    const tag = nuovoTag.trim().toUpperCase();
    if (tag && !tagsSelezionati.includes(tag)) {
      setTagsSelezionati(prev => [...prev, tag]);
      setNuovoTag('');
    }
  };

  const rimuoviTag = (nomeTag) => {
    setTagsSelezionati(prev => prev.filter(t => t !== nomeTag));
  };

  const salvaTags = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Aggiorna i tag della chiamata
      await axios.put(
        `${API_URL}/api/chiamate/${chiamataId}`,
        { tags: tagsSelezionati },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Tags aggiornati con successo');
      
      // Notifica il parent component
      if (onTagsUpdated) {
        onTagsUpdated(tagsSelezionati);
      }
      
      onClose();
    } catch (err) {
      console.error('Errore salvataggio tags:', err);
      setError(err.response?.data?.message || 'Errore nel salvataggio dei tag');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 200ms ease-out'
        }}
      >
        {/* Dialog */}
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideIn 300ms ease-out'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                Gestisci Tag
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#666'
              }}
            >
              <X style={{ width: '24px', height: '24px' }} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '16px',
              color: '#991b1b',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Tags selezionati */}
          {tagsSelezionati.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                Tag Selezionati ({tagsSelezionati.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {tagsSelezionati.map(tag => (
                  <div
                    key={tag}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: getColorForTag(tag),
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => rimuoviTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        color: 'white'
                      }}
                    >
                      <X style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tag predefiniti per categoria */}
          {['priorita', 'cliente', 'azione', 'follow-up'].map(categoria => {
            const tagCategoria = TAGS_PREDEFINITI.filter(t => t.categoria === categoria);
            const nomeCategoria = {
              priorita: '🔥 Priorità',
              cliente: '👤 Cliente',
              azione: '⚡ Azione',
              'follow-up': '🔔 Follow-up'
            }[categoria];

            return (
              <div key={categoria} style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                  {nomeCategoria}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {tagCategoria.map(tag => (
                    <button
                      key={tag.nome}
                      onClick={() => toggleTag(tag.nome)}
                      style={{
                        backgroundColor: tagsSelezionati.includes(tag.nome) ? tag.colore : 'white',
                        color: tagsSelezionati.includes(tag.nome) ? 'white' : tag.colore,
                        border: `2px solid ${tag.colore}`,
                        borderRadius: '16px',
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 150ms'
                      }}
                    >
                      {tag.nome}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Tag personalizzato */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Aggiungi Tag Personalizzato
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={nuovoTag}
                onChange={(e) => setNuovoTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && aggiungiNuovoTag()}
                placeholder="Nome tag (es. EVENTO-SPECIALE)"
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={aggiungiNuovoTag}
                disabled={!nuovoTag.trim()}
                style={{
                  backgroundColor: nuovoTag.trim() ? '#3b82f6' : '#e5e7eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  cursor: nuovoTag.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Aggiungi
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#374151'
              }}
            >
              Annulla
            </button>
            <button
              onClick={salvaTags}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: 600,
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Salvataggio...' : '✓ Salva Tag'}
            </button>
          </div>
        </div>
      </div>

      {/* Animazioni */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}

export default TagManager;