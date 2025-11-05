// components/CallPopup.js - VERSIONE ENTERPRISE v7.0
// ✅ Popup chiamata con storico completo cliente

'use client';

import React, { useState, useEffect } from 'react';
import { Phone, X, User, ShoppingCart, Clock, TrendingUp, Award, Calendar, Package } from 'lucide-react';

export default function CallPopup({ 
  isOpen = false, 
  onClose = () => {}, 
  onAccept = () => {}, 
  callData = null 
}) {
  const [storicoChiamate, setStoricoChiamate] = useState([]);
  const [ultimoOrdine, setUltimoOrdine] = useState(null);
  const [statisticheCliente, setStatisticheCliente] = useState(null);
  const [loading, setLoading] = useState(false);

  console.log('🎨 [CallPopup] Render:', { isOpen, callData });

  useEffect(() => {
    if (!callData || !isOpen) return;

    const fetchDatiCliente = async () => {
      if (!callData.cliente?._id) return;

      setLoading(true);
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app/api';

      try {
        // 1. Storico chiamate (da implementare backend)
        try {
          const resChiamate = await fetch(
            `${API_URL}/cx3/history?clienteId=${callData.cliente._id}&limit=5`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          if (resChiamate.ok) {
            const dataChiamate = await resChiamate.json();
            setStoricoChiamate(dataChiamate.chiamate || []);
          }
        } catch (err) {
          console.log('ℹ️ Storico chiamate non disponibile');
        }

        // 2. Ultimo ordine
        const resOrdini = await fetch(
          `${API_URL}/ordini?clienteId=${callData.cliente._id}&limit=1&sort=-dataOrdine`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (resOrdini.ok) {
          const dataOrdini = await resOrdini.json();
          if (dataOrdini.ordini && dataOrdini.ordini.length > 0) {
            setUltimoOrdine(dataOrdini.ordini[0]);
          }
        }

        // 3. Statistiche cliente
        const resStats = await fetch(
          `${API_URL}/clienti/${callData.cliente._id}/statistiche`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (resStats.ok) {
          const dataStats = await resStats.json();
          setStatisticheCliente(dataStats);
        }

      } catch (error) {
        console.error('❌ Errore caricamento dati cliente:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatiCliente();
  }, [callData, isOpen]);

  if (!callData || !isOpen) {
    console.log('⚠️ [CallPopup] No callData o not open');
    return null;
  }

  const { numero, numeroOriginale, cliente, timestamp } = callData;
  const displayNumero = numeroOriginale || numero;

  console.log('✅ [CallPopup] Rendering popup HTML per:', displayNumero);

  return (
    <>
      {/* Overlay scuro */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 999998,
          animation: 'fadeIn 0.2s ease-in-out'
        }}
      />

      {/* Popup principale */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          zIndex: 999999,
          width: '90%',
          maxWidth: '700px',
          maxHeight: '85vh',
          overflow: 'hidden',
          animation: 'slideIn 0.3s ease-out',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            padding: '20px 24px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '3px solid rgba(255,255,255,0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            >
              📞
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                Chiamata in arrivo
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
                {timestamp ? new Date(timestamp).toLocaleString('it-IT') : 'Ora'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'white',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >
            ✕
          </button>
        </div>

        {/* Content Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Numero */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <p
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: '0',
                letterSpacing: '1px'
              }}
            >
              {displayNumero}
            </p>
          </div>

          {/* Info Cliente */}
          {cliente ? (
            <>
              {/* Card Info Base */}
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '2px solid #86efac',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      flexShrink: 0,
                      fontWeight: 'bold'
                    }}
                  >
                    {cliente.nome?.charAt(0)}{cliente.cognome?.charAt(0) || ''}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '22px',
                        fontWeight: '600',
                        color: '#166534'
                      }}
                    >
                      {cliente.nome} {cliente.cognome || ''}
                    </h3>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {cliente.codice && (
                        <p style={{ margin: 0, fontSize: '14px', color: '#15803d' }}>
                          📋 <strong>Codice:</strong> {cliente.codice}
                        </p>
                      )}
                      {cliente.livello && (
                        <p style={{ margin: 0, fontSize: '14px', color: '#15803d' }}>
                          ⭐ <strong>Livello:</strong> {cliente.livello}
                        </p>
                      )}
                      {cliente.email && (
                        <p style={{ margin: 0, fontSize: '14px', color: '#15803d' }}>
                          ✉️ {cliente.email}
                        </p>
                      )}
                      {cliente.punti !== undefined && (
                        <p style={{ margin: 0, fontSize: '14px', color: '#15803d' }}>
                          🎁 <strong>Punti fedeltà:</strong> {cliente.punti}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiche Cliente */}
              {statisticheCliente && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    marginBottom: '20px'
                  }}
                >
                  <div
                    style={{
                      backgroundColor: '#fff',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '16px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>🛒</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                      {statisticheCliente.totaleOrdini || cliente.numeroOrdini || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Ordini
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#fff',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '16px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>💰</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                      €{statisticheCliente.totaleSpeso?.toFixed(0) || '0'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Speso
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#fff',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '16px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>📊</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                      €{statisticheCliente.mediaOrdine?.toFixed(0) || '0'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Media
                    </div>
                  </div>
                </div>
              )}

              {/* Ultimo Ordine */}
              {ultimoOrdine ? (
                <div
                  style={{
                    backgroundColor: '#fef3c7',
                    border: '2px solid #fbbf24',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 12px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#92400e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>📦</span>
                    Ultimo Ordine
                  </h4>
                  <div style={{ display: 'grid', gap: '8px', fontSize: '14px', color: '#78350f' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>Data:</strong></span>
                      <span>{new Date(ultimoOrdine.dataOrdine).toLocaleDateString('it-IT')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>Totale:</strong></span>
                      <span style={{ fontWeight: 'bold' }}>€{ultimoOrdine.totale?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>Prodotti:</strong></span>
                      <span>{ultimoOrdine.prodotti?.length || 0}</span>
                    </div>
                    {ultimoOrdine.stato && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>Stato:</strong></span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: ultimoOrdine.stato === 'completato' ? '#86efac' : '#fbbf24',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {ultimoOrdine.stato}
                        </span>
                      </div>
                    )}
                    {ultimoOrdine.prodotti && ultimoOrdine.prodotti.length > 0 && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #fbbf24' }}>
                        <strong style={{ fontSize: '13px' }}>Prodotti ordinati:</strong>
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px' }}>
                          {ultimoOrdine.prodotti.slice(0, 5).map((p, i) => (
                            <li key={i} style={{ marginBottom: '4px' }}>
                              {p.nome} - {p.quantita} {p.unita} (€{p.prezzo?.toFixed(2)})
                            </li>
                          ))}
                          {ultimoOrdine.prodotti.length > 5 && (
                            <li style={{ color: '#92400e', fontStyle: 'italic' }}>
                              ...e altri {ultimoOrdine.prodotti.length - 5} prodotti
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: '#f3f4f6',
                    border: '2px dashed #d1d5db',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '14px',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
                  <p style={{ margin: 0 }}>Nessun ordine precedente</p>
                </div>
              )}

              {/* Storico Chiamate */}
              {storicoChiamate.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#ede9fe',
                    border: '2px solid #c4b5fd',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 12px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#5b21b6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>📞</span>
                    Ultime Chiamate
                  </h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {storicoChiamate.slice(0, 5).map((chiamata, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px',
                          backgroundColor: 'rgba(255,255,255,0.6)',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#6b21a8'
                        }}
                      >
                        <span>
                          📞 {new Date(chiamata.timestamp).toLocaleDateString('it-IT')}
                        </span>
                        <span style={{ fontSize: '12px', opacity: 0.8 }}>
                          {new Date(chiamata.timestamp).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note Cliente */}
              {cliente.note && (
                <div
                  style={{
                    backgroundColor: '#fce7f3',
                    border: '2px solid #f9a8d4',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#9f1239',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>📝</span>
                    Note
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#831843', lineHeight: '1.6' }}>
                    {cliente.note}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                backgroundColor: '#fef9c3',
                border: '2px solid #fde047',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>❓</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#854d0e' }}>
                Cliente Sconosciuto
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#a16207' }}>
                Numero non presente in anagrafica.<br />
                Puoi comunque creare un nuovo ordine.
              </p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
              <p style={{ margin: 0, fontSize: '14px' }}>Caricamento dati...</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '20px 24px',
            borderTop: '2px solid #f3f4f6',
            backgroundColor: '#fafafa',
            display: 'flex',
            gap: '12px'
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px 20px',
              fontSize: '16px',
              fontWeight: '600',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              backgroundColor: 'white',
              color: '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
              e.target.style.borderColor = '#d1d5db';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            <span style={{ fontSize: '18px' }}>✖️</span>
            Ignora
          </button>

          <button
            onClick={onAccept}
            style={{
              flex: 1,
              padding: '14px 20px',
              fontSize: '16px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '10px',
              backgroundColor: '#16a34a',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#15803d';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(22, 163, 74, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#16a34a';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.3)';
            }}
          >
            <span style={{ fontSize: '18px' }}>📝</span>
            Nuovo Ordine
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -48%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
      `}</style>
    </>
  );
}
