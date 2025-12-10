// components/CallPopup.js - VERSIONE v3.4
// ✅ Click singolo sui pulsanti
// ✅ Timeout 60 secondi (pausa durante salvataggio)
// ✅ Mini-form per salvare cliente sconosciuto
// ✅ URL backend hardcoded
// ✅ NOME GRANDE per clienti conosciuti, telefono piccolo
// ✅ NUOVO: Campo unico con autocomplete clienti esistenti
import React, { useEffect, useState, useCallback } from 'react';
import { Phone, X, User, AlertCircle, Tag as TagIcon, UserPlus, Save, Loader, Check } from 'lucide-react';
import TagManager from './TagManager';

// ✅ URL BACKEND CORRETTO - hardcoded per sicurezza
const API_URL = 'https://pastificio-completo-production.up.railway.app';

export function CallPopup({ isOpen, onClose, onAccept, callData }) {
  const [showTagManager, setShowTagManager] = useState(false);
  const [tags, setTags] = useState([]);
  const [countdown, setCountdown] = useState(60);
  
  // ✅ NUOVO: Stati per mini-form salva cliente con autocomplete
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [nomeCompleto, setNomeCompleto] = useState(''); // Campo unico
  const [nomeCliente, setNomeCliente] = useState('');
  const [cognomeCliente, setCognomeCliente] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedCliente, setSavedCliente] = useState(null);
  
  // ✅ NUOVO: Stati per autocomplete clienti
  const [clientiLista, setClientiLista] = useState([]);
  const [suggerimenti, setSuggerimenti] = useState([]);
  const [clienteEsistente, setClienteEsistente] = useState(null);

  // ✅ NUOVO: Carica lista clienti quando si apre il form
  useEffect(() => {
    if (showSaveForm && clientiLista.length === 0) {
      const fetchClienti = async () => {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          const response = await fetch(`${API_URL}/api/clienti`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : ''
            }
          });
          if (response.ok) {
            const data = await response.json();
            const lista = data.data || data || [];
            setClientiLista(lista);
            console.log(`✅ [CallPopup] Caricati ${lista.length} clienti per autocomplete`);
          }
        } catch (error) {
          console.error('Errore caricamento clienti:', error);
        }
      };
      fetchClienti();
    }
  }, [showSaveForm, clientiLista.length]);

  // ✅ NUOVO: Cerca clienti mentre si digita
  useEffect(() => {
    if (nomeCompleto.length < 2) {
      setSuggerimenti([]);
      setClienteEsistente(null);
      return;
    }
    
    const cerca = nomeCompleto.toLowerCase().trim();
    const risultati = clientiLista.filter(c => {
      const nomeC = `${c.nome || ''} ${c.cognome || ''}`.toLowerCase();
      return nomeC.includes(cerca) || (c.nome || '').toLowerCase().includes(cerca);
    }).slice(0, 5); // Max 5 suggerimenti
    
    setSuggerimenti(risultati);
    
    // Controlla se è un match esatto
    const matchEsatto = risultati.find(c => {
      const nomeC = `${c.nome || ''} ${c.cognome || ''}`.toLowerCase().trim();
      return nomeC === cerca;
    });
    setClienteEsistente(matchEsatto || null);
  }, [nomeCompleto, clientiLista]);

  // Auto-close dopo 60 secondi + SUONO + VIBRAZIONE
  useEffect(() => {
    if (!isOpen) return;

    setCountdown(60);
    setShowSaveForm(false);
    setNomeCompleto(''); // ✅ Campo unico
    setNomeCliente('');
    setCognomeCliente('');
    setSaveError(null);
    setSavedCliente(null);
    setSuggerimenti([]); // ✅ Reset suggerimenti
    setClienteEsistente(null); // ✅ Reset cliente esistente
    
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

          {/* ✅ SEZIONE PRINCIPALE: Cliente conosciuto vs Sconosciuto */}
          {clienteAttuale ? (
            /* CLIENTE CONOSCIUTO: Nome GRANDE, telefono piccolo */
            <div style={{
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#d1fae5',
              border: '4px solid #10b981',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#065f46',
                margin: '0 0 8px 0'
              }}>
                {clienteAttuale.nome} {clienteAttuale.cognome || ''}
              </p>
              {clienteAttuale.codiceCliente && (
                <p style={{ fontSize: '14px', color: '#047857', margin: '4px 0' }}>
                  {clienteAttuale.codiceCliente} • {clienteAttuale.livelloFedelta || 'bronzo'}
                </p>
              )}
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '8px 0 0 0'
              }}>
                📞 {numero}
              </p>
              {savedCliente && (
                <p style={{ fontSize: '12px', color: '#10b981', marginTop: '8px' }}>
                  ✓ Appena salvato
                </p>
              )}
            </div>
          ) : (
            /* CLIENTE SCONOSCIUTO: Numero GRANDE + form salvataggio */
            <>
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
                <p style={{
                  fontSize: '14px',
                  color: '#92400e',
                  margin: '8px 0 0 0'
                }}>
                  Cliente non trovato nel database
                </p>
              </div>

              {/* Mini-form salva cliente */}
              <div style={{
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                {!showSaveForm ? (
                  <button
                    type="button"
                    onClick={() => setShowSaveForm(true)}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      justifyContent: 'center',
                      touchAction: 'manipulation',
                    }}
                  >
                    <UserPlus style={{ width: '20px', height: '20px' }} />
                    Salva Cliente
                  </button>
                ) : (
                  <div>
                    {/* ✅ CAMPO UNICO con autocomplete */}
                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                      <input
                        type="text"
                        placeholder="Nome e Cognome *"
                        value={nomeCompleto}
                        onChange={(e) => {
                          setNomeCompleto(e.target.value);
                          // Splitta automaticamente nome/cognome
                          const parti = e.target.value.trim().split(' ');
                          setNomeCliente(parti[0] || '');
                          setCognomeCliente(parti.slice(1).join(' ') || '');
                        }}
                        disabled={isSaving || clienteEsistente}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: clienteEsistente ? '2px solid #f59e0b' : '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '18px',
                          outline: 'none',
                          backgroundColor: clienteEsistente ? '#fef3c7' : 'white'
                        }}
                        onFocus={(e) => !clienteEsistente && (e.target.style.borderColor = '#3b82f6')}
                        onBlur={(e) => !clienteEsistente && (e.target.style.borderColor = '#d1d5db')}
                        autoFocus
                      />
                      
                      {/* ✅ Lista suggerimenti */}
                      {suggerimenti.length > 0 && !clienteEsistente && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          marginTop: '4px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 100,
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}>
                          {suggerimenti.map((cliente, idx) => (
                            <div
                              key={cliente._id || idx}
                              onClick={() => {
                                setClienteEsistente(cliente);
                                setNomeCompleto(`${cliente.nome} ${cliente.cognome || ''}`.trim());
                                setSuggerimenti([]);
                              }}
                              style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: idx < suggerimenti.length - 1 ? '1px solid #e5e7eb' : 'none',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            >
                              <span style={{ fontWeight: 500 }}>
                                {cliente.nome} {cliente.cognome || ''}
                              </span>
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                {cliente.codiceCliente || cliente.telefono || ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* ✅ Avviso cliente esistente */}
                    {clienteEsistente && (
                      <div style={{
                        backgroundColor: '#fef3c7',
                        border: '1px solid #f59e0b',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Check style={{ width: '20px', height: '20px', color: '#d97706' }} />
                        <div>
                          <p style={{ fontWeight: 600, color: '#92400e', margin: 0 }}>
                            Cliente già esistente!
                          </p>
                          <p style={{ fontSize: '14px', color: '#78350f', margin: '4px 0 0 0' }}>
                            {clienteEsistente.codiceCliente} - Tel: {clienteEsistente.telefono || 'N/D'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setClienteEsistente(null);
                            setNomeCompleto('');
                          }}
                          style={{
                            marginLeft: 'auto',
                            padding: '6px 12px',
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Nuovo
                        </button>
                      </div>
                    )}
                    
                    {saveError && (
                      <p style={{ color: '#dc2626', fontSize: '14px', margin: '0 0 12px 0' }}>
                        ⚠️ {saveError}
                      </p>
                    )}
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSaveForm(false);
                          setNomeCompleto('');
                          setNomeCliente('');
                          setCognomeCliente('');
                          setSaveError(null);
                          setSuggerimenti([]);
                          setClienteEsistente(null);
                        }}
                        disabled={isSaving}
                        style={{
                          flex: 1,
                          padding: '12px 14px',
                          backgroundColor: 'white',
                          color: '#374151',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '16px',
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
                        disabled={isSaving || !nomeCliente.trim() || clienteEsistente}
                        style={{
                          flex: 1,
                          padding: '12px 14px',
                          backgroundColor: (isSaving || clienteEsistente) ? '#9ca3af' : '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: 600,
                          cursor: (isSaving || clienteEsistente) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          touchAction: 'manipulation',
                        }}
                      >
                        {isSaving ? (
                          <>
                            <Loader style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                            Salvo...
                          </>
                        ) : (
                          <>
                            <Save style={{ width: '18px', height: '18px' }} />
                            {clienteEsistente ? 'Già salvato' : 'Salva'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

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
