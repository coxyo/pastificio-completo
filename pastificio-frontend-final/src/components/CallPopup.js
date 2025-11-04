// components/CallPopup.js - VERSIONE HTML PURA v6.0
'use client';

import React from 'react';

export default function CallPopup({ 
  isOpen = false, 
  onClose = () => {}, 
  onAccept = () => {}, 
  callData = null 
}) {
  console.log('🎨 [CallPopup] Render:', { isOpen, callData });

  if (!callData || !isOpen) {
    console.log('⚠️ [CallPopup] No callData o not open');
    return null;
  }

  const { numero, numeroOriginale, cliente, timestamp } = callData;
  const displayNumero = numeroOriginale || numero;

  console.log('✅ [CallPopup] Rendering popup HTML per:', displayNumero);

  return (
    <>
      {/* Overlay scuro di sfondo */}
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
          minWidth: '400px',
          maxWidth: '500px',
          padding: '0',
          animation: 'slideIn 0.3s ease-out',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            padding: '24px',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            color: 'white',
            position: 'relative'
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
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                {timestamp ? new Date(timestamp).toLocaleTimeString('it-IT') : 'Ora'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
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
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '2px solid #86efac',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0
                  }}
                >
                  👤
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: '0 0 4px 0',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#166534'
                    }}
                  >
                    {cliente.nome} {cliente.cognome || ''}
                  </p>
                  {cliente.codice && (
                    <p style={{ margin: '2px 0', fontSize: '14px', color: '#15803d' }}>
                      📋 Codice: {cliente.codice}
                    </p>
                  )}
                  {cliente.livello && (
                    <p style={{ margin: '2px 0', fontSize: '14px', color: '#15803d' }}>
                      ⭐ Livello: {cliente.livello}
                    </p>
                  )}
                  {cliente.numeroOrdini && (
                    <p style={{ margin: '2px 0', fontSize: '14px', color: '#15803d' }}>
                      🛒 Ordini: {cliente.numeroOrdini}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#fef9c3',
                border: '2px solid #fde047',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#ca8a04',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}
                >
                  ❓
                </div>
                <div>
                  <p
                    style={{
                      margin: '0 0 4px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#854d0e'
                    }}
                  >
                    Cliente Sconosciuto
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#a16207' }}>
                    Numero non presente in anagrafica
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
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
