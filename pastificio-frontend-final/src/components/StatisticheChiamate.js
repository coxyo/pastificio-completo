// components/StatisticheChiamate.js
import React, { useState, useEffect } from 'react';
import { 
  Phone, TrendingUp, TrendingDown, Minus, 
  Users, Calendar, Clock, Tag as TagIcon,
  Download, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

export function StatisticheChiamate() {
  const [statistiche, setStatistiche] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mese'); // oggi, settimana, mese, anno

  useEffect(() => {
    caricaStatistiche();
  }, [periodo]);

  const caricaStatistiche = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // ✅ FIX: Usa endpoint corretto /api/chiamate/statistiche
      const response = await axios.get(
        `${API_URL}/chiamate/statistiche?periodo=${periodo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // ✅ FIX: I dati sono in response.data.data
      setStatistiche(response.data.data || response.data);
      console.log('📊 Statistiche caricate:', response.data);
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
      setStatistiche(null);
    } finally {
      setLoading(false);
    }
  };

  const exportStatistiche = async () => {
    try {
      const token = localStorage.getItem('token');
      // ✅ FIX: Usa endpoint corretto
      const response = await axios.get(
        `${API_URL}/chiamate/statistiche/export?periodo=${periodo}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `statistiche_chiamate_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Errore export:', error);
      // ✅ Fallback: export locale se endpoint non disponibile
      if (statistiche) {
        const csv = [
          ['Metrica', 'Valore'].join(','),
          ['Totale Chiamate', statistiche.kpi?.totaleChiamate || 0].join(','),
          ['Media Giornaliera', statistiche.kpi?.mediaGiornaliera || 0].join(','),
          ['Tasso Conversione', statistiche.kpi?.tassoConversione || 0].join(','),
          ['Chiamate con Ordine', statistiche.kpi?.chiamateConOrdine || 0].join(',')
        ].join('\n');
        
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statistiche_chiamate_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <p>Caricamento statistiche...</p>
      </div>
    );
  }

  if (!statistiche) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
        <p>Errore nel caricamento delle statistiche</p>
      </div>
    );
  }

  // ✅ CORREZIONE: Aggiungo valori di default per campi opzionali
  const {
    kpi = {
      totaleChiamate: 0,
      mediaGiornaliera: 0,
      tassoConversione: 0,
      chiamateConOrdine: 0
    },
    trend = {
      direzione: 'stabile',
      variazione: 0
    },
    grafici = {
      chiamatePerGiorno: [],
      chiamatePerTag: [],
      distribuzioneOraria: []
    },
    topClienti = [],
    durata = {
      media: 0,
      totale: 0
    },
    ordini = {
      count: 0,
      valoreMedio: 0,
      valoreTotale: 0
    }
  } = statistiche;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            📊 Statistiche Chiamate
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Analisi dettagliata delle performance
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Selettore periodo */}
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="oggi">Oggi</option>
            <option value="settimana">Ultima Settimana</option>
            <option value="mese">Ultimo Mese</option>
            <option value="anno">Ultimo Anno</option>
          </select>

          {/* Pulsante export */}
          <button
            onClick={exportStatistiche}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Download style={{ width: '16px', height: '16px' }} />
            Esporta CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Totale Chiamate */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px 0', fontWeight: 600 }}>
                TOTALE CHIAMATE
              </p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                {kpi.totaleChiamate || 0}
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#3b82f620',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Phone style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {trend.direzione === 'crescita' ? (
              <>
                <TrendingUp style={{ width: '16px', height: '16px', color: '#22c55e' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>
                  +{Math.abs(trend.variazione || 0)}%
                </span>
              </>
            ) : trend.direzione === 'calo' ? (
              <>
                <TrendingDown style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>
                  {trend.variazione || 0}%
                </span>
              </>
            ) : (
              <>
                <Minus style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
                  0%
                </span>
              </>
            )}
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>vs settimana scorsa</span>
          </div>
        </div>

        {/* Media Giornaliera */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px 0', fontWeight: 600 }}>
                MEDIA GIORNALIERA
              </p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                {kpi.mediaGiornaliera || 0}
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#8b5cf620',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar style={{ width: '24px', height: '24px', color: '#8b5cf6' }} />
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
            {kpi.totaleChiamate || 0} chiamate nel periodo
          </p>
        </div>

        {/* Tasso Conversione */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px 0', fontWeight: 600 }}>
                TASSO CONVERSIONE
              </p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                {kpi.tassoConversione || 0}%
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#22c55e20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp style={{ width: '24px', height: '24px', color: '#22c55e' }} />
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
            {kpi.chiamateConOrdine || 0} ordini generati
          </p>
        </div>

        {/* Valore Medio Ordini */}
        {ordini.count > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px 0', fontWeight: 600 }}>
                  VALORE MEDIO ORDINE
                </p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  €{ordini.valoreMedio.toFixed(2)}
                </p>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#f59e0b20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '24px' }}>💰</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
              €{ordini.valoreTotale.toFixed(2)} totale
            </p>
          </div>
        )}
      </div>

      {/* Grafici */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Chiamate per Giorno */}
        {grafici.chiamatePerGiorno && grafici.chiamatePerGiorno.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <BarChart3 style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                Chiamate per Giorno (Ultimi 30 giorni)
              </h3>
            </div>
            <div style={{ position: 'relative', height: '240px' }}>
              {/* Grafico a barre semplice */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '200px' }}>
                {grafici.chiamatePerGiorno.map((item, idx) => {
                  const maxCount = Math.max(...grafici.chiamatePerGiorno.map(i => i.count));
                  const height = (item.count / maxCount) * 100;
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        title={`${item._id}: ${item.count} chiamate`}
                        style={{
                          width: '100%',
                          height: `${height}%`,
                          backgroundColor: '#3b82f6',
                          borderRadius: '4px 4px 0 0',
                          transition: 'all 150ms',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                      />
                      {idx % 5 === 0 && (
                        <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', transform: 'rotate(-45deg)' }}>
                          {new Date(item._id).getDate()}/{new Date(item._id).getMonth() + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Chiamate per Tag */}
        {grafici.chiamatePerTag && grafici.chiamatePerTag.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <PieChartIcon style={{ width: '20px', height: '20px', color: '#8b5cf6' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                Top 10 Tag Utilizzati
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {grafici.chiamatePerTag.map((item, idx) => {
                const maxCount = grafici.chiamatePerTag[0].count;
                const percentage = (item.count / maxCount) * 100;
                const colors = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{item._id}</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>{item.count}</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          backgroundColor: colors[idx % colors.length],
                          borderRadius: '4px',
                          transition: 'width 300ms'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Top Clienti */}
      {topClienti && topClienti.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Users style={{ width: '20px', height: '20px', color: '#22c55e' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              Top 5 Clienti per Chiamate
            </h3>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {topClienti.map((cliente, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'][idx] + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    color: ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'][idx]
                  }}>
                    #{idx + 1}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 2px 0' }}>
                      {cliente.nome} {cliente.cognome}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                      {cliente.telefono}
                    </p>
                  </div>
                </div>
                <div style={{
                  backgroundColor: ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'][idx],
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  {cliente.count} chiamate
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distribuzione Oraria */}
      {grafici.distribuzioneOraria && grafici.distribuzioneOraria.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Clock style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              Distribuzione Oraria Chiamate
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px' }}>
            {Array.from({ length: 24 }, (_, ora) => {
              const dato = grafici.distribuzioneOraria.find(d => d._id === ora);
              const count = dato ? dato.count : 0;
              const maxCount = Math.max(...grafici.distribuzioneOraria.map(d => d.count), 1);
              const height = (count / maxCount) * 100;
              return (
                <div key={ora} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    title={`${ora}:00 - ${count} chiamate`}
                    style={{
                      width: '100%',
                      height: `${height}%`,
                      backgroundColor: count > 0 ? '#f59e0b' : '#e5e7eb',
                      borderRadius: '4px 4px 0 0',
                      cursor: 'pointer',
                      transition: 'all 150ms'
                    }}
                    onMouseOver={(e) => count > 0 && (e.currentTarget.style.backgroundColor = '#d97706')}
                    onMouseOut={(e) => count > 0 && (e.currentTarget.style.backgroundColor = '#f59e0b')}
                  />
                  {ora % 3 === 0 && (
                    <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                      {ora}:00
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatisticheChiamate;
