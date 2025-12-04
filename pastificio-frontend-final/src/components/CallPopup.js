// components/CallPopup.js - VERSIONE v3.0 CON SALVA CLIENTE
// ✅ Click singolo sui pulsanti
// ✅ Timeout 60 secondi
// ✅ Mini-form per salvare cliente sconosciuto
import React, { useEffect, useState, useCallback } from 'react';
import { Phone, X, User, AlertCircle, Tag as TagIcon, UserPlus, Save, Loader } from 'lucide-react';
import TagManager from './TagManager';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app';

export function CallPopup({ isOpen, onClose, onAccept, callData }) {
  const [showTagManager, setShowTagManager] = useState(false);
  const [tags, setTags] = useState([]);
  const [countdown, setCountdown] = useState(60);
  
  // ✅ NUOVO: Stati per mini-form salva cliente
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [nomeCliente, setNomeCliente] = useState('');
  const [cognomeCliente, setCognomeCliente] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedCliente, setSavedCliente] = useState(null);

  // Auto-close dopo 60 secondi + SUONO + VIBRAZIONE
  useEffect(() => {
    if (!isOpen) return;

    setCountdown(60);
    setShowSaveForm(false);
    setNomeCliente('');
    setCognomeCliente('');
    setSaveError(null);
    setSavedCliente(null);
    
    // 🔊 SUONO NOTIFICA
    try {
      const audio = new Audio('/sounds/phone-ring.mp3');
      audio.volume = 0.7;
      audio.play().catch(e => console.log('Audio bloccato dal browser:', e));
    } catch (e) {
      console.log('Errore audio:', e);
    }

    // 📳 VIBRAZIONE
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // ⏰ TIMER AUTO-CLOSE (si ferma se form salva cliente è aperto)
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

  // ✅ PAUSA COUNTDOWN quando form salva cliente è aperto
  useEffect(() => {
    if (!isOpen) return;
    
    let pauseTimer;
    if (showSaveForm) {
      // Mantieni il countdown fermo resettandolo ogni secondo
      pauseTimer = setInterval(() => {
        setCountdown(prev => Math.max(prev, 30)); // Mantieni almeno 30 secondi
      }, 1000);
      console.log('⏸️ [CallPopup] Countdown in pausa - form salva cliente aperto');
    }
    
    return () => {
      if (pauseTimer) clearInterval(pauseTimer);
    };
  }, [isOpen, showSaveForm]);

  // Tags dal callData
  useEffect(() => {
    if (callData?.chiamataId && callData?.tags) {
      setTags(callData.tags);
    }
  }, [callData]);

  // ✅ HANDLER per salvare il cliente
  const handleSaveCliente = async () => {
    if (!nomeCliente.trim()) {
      setSaveError('Inserisci almeno il nome');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Recupera token per autenticazione
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/clienti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          nome: nomeCliente.trim(),
          cognome: cognomeCliente.trim() || '',
          telefono: callData?.numero?.replace(/\D/g, '') || '',
          email: '',
          note: `Cliente aggiunto da chiamata del ${new Date().toLocaleDateString('it-IT')}`
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ [CallPopup] Cliente salvato:', data);
        setSavedCliente(data.cliente || data.data);
        setShowSaveForm(false);
        
        // ✅ Aggiorna callData con il nuovo cliente
        if (callData) {
          callData.cliente = data.cliente || data.data;
        }
      } else {
        throw new Error(data.message || data.error || 'Errore durante il salvataggio');
      }
    } catch (error) {
      console.error('❌ [CallPopup] Errore salvataggio cliente:', error);
      setSaveError(error.message || 'Errore di connessione');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler ottimizzati
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
  
  // Usa cliente salvato se disponibile
  const clienteAttuale = savedCliente || cliente;
  const isClienteSconosciuto = !clienteAttuale;

  const handleTagsUpdated = (nuoviTags) => {
    setTags(nuoviTags);
    console.log('✅ Tags aggiornati:', nuoviTags);
  };

  // Stile pulsante base
  const buttonBaseStyle = {
    flex: '1 1 auto',
    minWidth: '100px',
    padding: '14px 16px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'transform 100ms, opacity 100ms',
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    outline: 'none',
    border: 'none',
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

          {/* Dati cliente - ESISTENTE o APPENA SALVATO */}
          {clienteAttuale ? (
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
                    {clienteAttuale.nome} {clienteAttuale.cognome || ''}
                    {savedCliente && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#10b981' }}>✓ Appena salvato</span>}
                  </p>
                  {clienteAttuale.codiceCliente && (
                    <p style={{ fontSize: '14px', color: '#047857', margin: '4px 0' }}>
                      Codice: {clienteAttuale.codiceCliente}
                    </p>
                  )}
                  {clienteAttuale.livelloFedelta && (
                    <p style={{ fontSize: '14px', color: '#047857', margin: '4px 0' }}>
                      Livello: {clienteAttuale.livelloFedelta}
                    </p>
                  )}
                  {clienteAttuale.email && (
                    <p style={{ fontSize: '14px', color: '#047857', margin: '4px 0' }}>
                      {clienteAttuale.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Cliente Sconosciuto - con opzione salvataggio */}
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <User style={{ width: '20px', height: '20px', color: '#d97706', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: '#78350f', margin: '0 0 4px 0' }}>
                      Cliente Sconosciuto
                    </p>
                    <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
                      Cliente non trovato nel database
                    </p>
                  </div>
                </div>

                {/* ✅ MINI-FORM SALVA CLIENTE */}
                {!showSaveForm ? (
                  <button
                    type="button"
                    onClick={() => setShowSaveForm(true)}
                    style={{
                      marginTop: '12px',
                      padding: '10px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      width: '100%',
                      justifyContent: 'center',
                      touchAction: 'manipulation',
                    }}
                  >
                    <UserPlus style={{ width: '16px', height: '16px' }} />
                    Salva Cliente
                  </button>
                ) : (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        placeholder="Nome *"
                        value={nomeCliente}
                        onChange={(e) => setNomeCliente(e.target.value)}
                        disabled={isSaving}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: '2px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        autoFocus
                      />
                      <input
                        type="text"
                        placeholder="Cognome"
                        value={cognomeCliente}
                        onChange={(e) => setCognomeCliente(e.target.value)}
                        disabled={isSaving}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: '2px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      />
                    </div>
                    
                    {saveError && (
                      <p style={{ color: '#dc2626', fontSize: '13px', margin: '0 0 8px 0' }}>
                        ⚠️ {saveError}
                      </p>
                    )}
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSaveForm(false);
                          setNomeCliente('');
                          setCognomeCliente('');
                          setSaveError(null);
                        }}
                        disabled={isSaving}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          touchAction: 'manipulation',
                        }}
                      >
                        Annulla
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCliente}
                        disabled={isSaving || !nomeCliente.trim()}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          backgroundColor: isSaving ? '#9ca3af' : '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: isSaving ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          touchAction: 'manipulation',
                        }}
                      >
                        {isSaving ? (
                          <>
                            <Loader style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                            Salvo...
                          </>
                        ) : (
                          <>
                            <Save style={{ width: '16px', height: '16px' }} />
                            Salva
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
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

          {/* PULSANTI AZIONE */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            
            {/* Pulsante Tag */}
            {chiamataId && (
              <button
                type="button"
                onClick={handleTagClick}
                style={{
                  ...buttonBaseStyle,
                  backgroundColor: '#f3f4f6',
                  color: '#3b82f6',
                }}
              >
                <TagIcon style={{ width: '16px', height: '16px' }} />
                Tag
              </button>
            )}

            {/* Pulsante Ignora */}
            <button
              type="button"
              onClick={handleIgnore}
              style={{
                ...buttonBaseStyle,
                backgroundColor: '#f3f4f6',
                color: '#374151',
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
              Ignora ({countdown}s)
            </button>

            {/* Pulsante Nuovo Ordine */}
            <button
              type="button"
              onClick={handleAccept}
              style={{
                ...buttonBaseStyle,
                flex: '2 1 auto',
                backgroundColor: '#22c55e',
                color: 'white',
              }}
            >
              <Phone style={{ width: '16px', height: '16px' }} />
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

      {/* CSS per animazione spinner */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default CallPopup;
