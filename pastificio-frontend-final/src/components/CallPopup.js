// components/CallPopup.js - VERSIONE OTTIMIZZATA v2.0
// ✅ Click singolo sui pulsanti
// ✅ Timeout 60 secondi
// ✅ Rimosso debug mode
import React, { useEffect, useState, useCallback } from 'react';
import { Phone, X, User, AlertCircle, Tag as TagIcon } from 'lucide-react';
import TagManager from './TagManager';

export function CallPopup({ isOpen, onClose, onAccept, callData }) {
  const [showTagManager, setShowTagManager] = useState(false);
  const [tags, setTags] = useState([]);
  const [countdown, setCountdown] = useState(60); // ✅ AUMENTATO a 60 secondi

  // ✅ Auto-close dopo 60 secondi + SUONO + VIBRAZIONE
  useEffect(() => {
    if (!isOpen) return;

    setCountdown(60); // Reset countdown
    
    // 🔊 SUONO NOTIFICA
    try {
      const audio = new Audio('/sounds/phone-ring.mp3');
      audio.volume = 0.7;
      audio.play().catch(e => console.log('Audio bloccato dal browser:', e));
    } catch (e) {
      console.log('Errore audio:', e);
    }

    // 📳 VIBRAZIONE (se disponibile)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // ⏰ TIMER AUTO-CLOSE
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          console.log('⏰ [CallPopup] Auto-close per timeout');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  // Tags dal callData
  useEffect(() => {
    if (callData?.chiamataId && callData?.tags) {
      setTags(callData.tags);
    }
  }, [callData]);

  // ✅ HANDLER OTTIMIZZATI - useCallback per prevenire re-render
  const handleIgnore = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🚫 [CallPopup] Ignora chiamata');
    onClose();
  }, [onClose]);

  const handleAccept = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('📞 [CallPopup] Nuovo ordine');
    onAccept();
  }, [onAccept]);

  const handleTagClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTagManager(true);
  }, []);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Se non aperto o senza dati, non renderizzare
  if (!isOpen || !callData) {
    return null;
  }

  const { numero, cliente, noteAutomatiche, chiamataId } = callData;

  const handleTagsUpdated = (nuoviTags) => {
    setTags(nuoviTags);
    console.log('✅ Tags aggiornati:', nuoviTags);
  };

  // ✅ STILE PULSANTE BASE - ottimizzato per click singolo
  const buttonBaseStyle = {
    flex: '1 1 auto',
    minWidth: '120px',
    padding: '16px 20px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'transform 100ms, opacity 100ms',
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    outline: 'none',
  };

  return (
    <>
      {/* Overlay scuro */}
      <div 
        onClick={handleOverlayClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 999998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Popup content */}
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            zIndex: 999999,
          }}
        >
          {/* Barra colorata countdown */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: countdown > 20 ? '#22c55e' : countdown > 10 ? '#f59e0b' : '#ef4444',
            transition: 'background-color 300ms'
          }} />

          {/* Countdown badge */}
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '48px',
            backgroundColor: countdown > 20 ? '#22c55e' : countdown > 10 ? '#f59e0b' : '#ef4444',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 'bold',
            zIndex: 10
          }}>
            {countdown}s
          </div>

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
            paddingTop: '8px'
          }}>
            <Phone style={{ width: '24px', height: '24px', color: '#22c55e' }} />
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              margin: 0,
              flex: 1
            }}>
              📞 Chiamata in arrivo
            </h2>
            <button
              onClick={handleIgnore}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                color: '#666',
                touchAction: 'manipulation',
              }}
            >
              <X style={{ width: '24px', height: '24px' }} />
            </button>
          </div>

          {/* Numero chiamante */}
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#fef3c7',
            border: '4px solid #f59e0b',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#dc2626',
              margin: 0
            }}>
              {numero || 'Numero sconosciuto'}
            </p>
          </div>

          {/* Tags (se presenti) */}
          {tags && tags.length > 0 && (
            <div style={{
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TagIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Tag</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {tags.map((tag, idx) => (
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
            </div>
          )}

          {/* Dati cliente */}
          {cliente ? (
            <div style={{
              backgroundColor: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <User style={{ width: '20px', height: '20px', color: '#059669', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: '#065f46', margin: '0 0 4px 0' }}>
                    {cliente.nome} {cliente.cognome || ''}
                  </p>
                  {cliente.codiceCliente && (
                    <p style={{ fontSize: '14px', color: '#047857', margin: '4px 0' }}>
                      Codice: {cliente.codiceCliente}
                    </p>
                  )}
                  {cliente.livelloFedelta && (
                    <p style={{ fontSize: '14px', color: '#047857', margin: '4px 0' }}>
                      Livello: {cliente.livelloFedelta}
                    </p>
                  )}
                  {cliente.email && (
                    <p style={{ fontSize: '14px', color: '#047857', margin: '4px 0' }}>
                      {cliente.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <User style={{ width: '20px', height: '20px', color: '#d97706', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, color: '#78350f', margin: '0 0 4px 0' }}>
                    Cliente Sconosciuto
                  </p>
                  <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
                    Cliente non trovato nel database
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Note automatiche */}
          {noteAutomatiche && noteAutomatiche.length > 0 && (
            <div style={{
              backgroundColor: '#dbeafe',
              border: '1px solid #3b82f6',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertCircle style={{ width: '20px', height: '20px', color: '#2563eb' }} />
                <p style={{ fontWeight: 600, color: '#1e40af', margin: 0 }}>
                  Note Automatiche
                </p>
              </div>
              {noteAutomatiche.map((nota, index) => (
                <div key={index} style={{
                  fontSize: '14px',
                  color: '#1e3a8a',
                  marginLeft: '28px',
                  marginTop: '4px'
                }}>
                  • {nota.messaggio}
                </div>
              ))}
            </div>
          )}

          {/* ✅ PULSANTI OTTIMIZZATI - CLICK SINGOLO */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            
            {/* Pulsante Tag */}
            {chiamataId && (
              <button
                type="button"
                onClick={handleTagClick}
                style={{
                  ...buttonBaseStyle,
                  backgroundColor: 'white',
                  border: '2px solid #3b82f6',
                  color: '#3b82f6',
                }}
              >
                <TagIcon style={{ width: '18px', height: '18px' }} />
                Tag
              </button>
            )}

            {/* Pulsante Ignora */}
            <button
              type="button"
              onClick={handleIgnore}
              style={{
                ...buttonBaseStyle,
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                color: '#374151',
              }}
            >
              <X style={{ width: '18px', height: '18px' }} />
              Ignora ({countdown}s)
            </button>

            {/* Pulsante Nuovo Ordine */}
            <button
              type="button"
              onClick={handleAccept}
              style={{
                ...buttonBaseStyle,
                backgroundColor: '#22c55e',
                border: '2px solid #22c55e',
                color: 'white',
              }}
            >
              <Phone style={{ width: '18px', height: '18px' }} />
              Nuovo Ordine
            </button>
          </div>
        </div>
      </div>

      {/* TagManager Dialog */}
      {chiamataId && (
        <TagManager
          isOpen={showTagManager}
          onClose={() => setShowTagManager(false)}
          chiamataId={chiamataId}
          tagsAttuali={tags}
          onTagsUpdated={handleTagsUpdated}
        />
      )}
    </>
  );
}

export default CallPopup;
