// src/components/Dashboard/index.js
// Dashboard PULITA - Solo dati REALI (no magazzino, no AI)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('settimana'); // settimana, mese, anno
  const [stats, setStats] = useState({
    ordiniOggi: 0,
    incassoOggi: 0,
    ticketMedio: 0,
    clientiUnici: 0,
    prodottiTop: [],
    trendGiornaliero: [],
    distribuzioneOraria: [],
    confrontoPeriodo: { attuale: 0, precedente: 0 }
  });

  useEffect(() => {
    caricaDati();
  }, [periodo]);

  const caricaDati = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch ordini
      const { data } = await axios.get(`${API_URL}/api/ordini`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const ordini = data.data || [];
      calcolaStatistiche(ordini);
      
    } catch (error) {
      console.error('Errore caricamento dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcolaStatistiche = (ordini) => {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    // Filtra ordini periodo
    const giorniPeriodo = periodo === 'settimana' ? 7 : periodo === 'mese' ? 30 : 365;
    const dataInizio = new Date();
    dataInizio.setDate(dataInizio.getDate() - giorniPeriodo);

    const ordiniPeriodo = ordini.filter(o => {
      const dataOrdine = new Date(o.dataRitiro || o.createdAt);
      return dataOrdine >= dataInizio;
    });

    // Ordini oggi
    const ordiniOggi = ordini.filter(o => {
      const dataOrdine = new Date(o.dataRitiro || o.createdAt);
      return dataOrdine >= oggi;
    });

    const incassoOggi = ordiniOggi.reduce((sum, o) => sum + (o.totale || 0), 0);
    const ticketMedio = ordiniOggi.length > 0 ? incassoOggi / ordiniOggi.length : 0;

    // Clienti unici periodo
    const clientiUnici = new Set(ordiniPeriodo.map(o => o.nomeCliente)).size;

    // Prodotti più venduti (periodo)
    const prodottiConteggio = {};
    ordiniPeriodo.forEach(ordine => {
      (ordine.prodotti || []).forEach(prod => {
        const nome = prod.nome || 'Sconosciuto';
        if (!prodottiConteggio[nome]) {
          prodottiConteggio[nome] = { nome, quantita: 0, valore: 0 };
        }
        prodottiConteggio[nome].quantita += prod.quantita || 0;
        prodottiConteggio[nome].valore += (prod.quantita || 0) * (prod.prezzo || 0);
      });
    });

    const prodottiTop = Object.values(prodottiConteggio)
      .sort((a, b) => b.valore - a.valore)
      .slice(0, 5);

    // Trend giornaliero (ultimi giorni del periodo)
    const trendGiornaliero = [];
    const giorniTrend = Math.min(giorniPeriodo, 30); // Max 30 giorni per visualizzazione
    
    for (let i = giorniTrend - 1; i >= 0; i--) {
      const giorno = new Date();
      giorno.setDate(giorno.getDate() - i);
      giorno.setHours(0, 0, 0, 0);
      
      const giornoSuccessivo = new Date(giorno);
      giornoSuccessivo.setDate(giornoSuccessivo.getDate() + 1);

      const ordiniGiorno = ordini.filter(o => {
        const dataOrdine = new Date(o.dataRitiro || o.createdAt);
        return dataOrdine >= giorno && dataOrdine < giornoSuccessivo;
      });

      const valoreGiorno = ordiniGiorno.reduce((sum, o) => sum + (o.totale || 0), 0);

      trendGiornaliero.push({
        data: giorno.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
        ordini: ordiniGiorno.length,
        valore: valoreGiorno
      });
    }

    // Distribuzione oraria (periodo)
    const distribuzioneOraria = Array(24).fill(0).map((_, ora) => {
      const ordiniOra = ordiniPeriodo.filter(o => {
        const oraRitiro = parseInt(o.oraRitiro?.split(':')[0] || '10');
        return oraRitiro === ora;
      });

      return {
        ora: `${ora}:00`,
        ordini: ordiniOra.length,
        valore: ordiniOra.reduce((sum, o) => sum + (o.totale || 0), 0)
      };
    }).filter(h => h.ordini > 0 || (parseInt(h.ora) >= 8 && parseInt(h.ora) <= 20));

    // Confronto con periodo precedente
    const dataInizioPrecedente = new Date(dataInizio);
    dataInizioPrecedente.setDate(dataInizioPrecedente.getDate() - giorniPeriodo);
    
    const ordiniPrecedenti = ordini.filter(o => {
      const dataOrdine = new Date(o.dataRitiro || o.createdAt);
      return dataOrdine >= dataInizioPrecedente && dataOrdine < dataInizio;
    });

    const valorePrecedente = ordiniPrecedenti.reduce((sum, o) => sum + (o.totale || 0), 0);
    const valoreAttuale = ordiniPeriodo.reduce((sum, o) => sum + (o.totale || 0), 0);

    setStats({
      ordiniOggi: ordiniOggi.length,
      incassoOggi,
      ticketMedio,
      clientiUnici,
      prodottiTop,
      trendGiornaliero,
      distribuzioneOraria,
      confrontoPeriodo: {
        attuale: valoreAttuale,
        precedente: valorePrecedente,
        variazione: valorePrecedente > 0 
          ? ((valoreAttuale - valorePrecedente) / valorePrecedente * 100).toFixed(1)
          : 0
      }
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '18px',
        color: '#666'
      }}>
        Caricamento dashboard...
      </div>
    );
  }

  const COLORS = ['#667eea', '#764ba2', '#84fab0', '#8fd3f4', '#f093fb', '#f5576c'];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          📊 Dashboard
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Panoramica completa delle tue attività
        </p>
      </div>

      {/* Selettore Periodo */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
        {['settimana', 'mese', 'anno'].map(p => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: periodo === p ? '#667eea' : 'white',
              color: periodo === p ? 'white' : '#374151',
              fontWeight: periodo === p ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Ordini Oggi */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #667eea'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            📦 Ordini Oggi
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>
            {stats.ordiniOggi}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            Totali di oggi
          </div>
        </div>

        {/* Incasso Oggi */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #10b981'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            💰 Incasso Oggi
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
            €{stats.incassoOggi.toFixed(0)}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            {stats.confrontoPeriodo.variazione > 0 ? '↗️' : '↘️'} {Math.abs(stats.confrontoPeriodo.variazione)}% vs periodo precedente
          </div>
        </div>

        {/* Ticket Medio */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            📊 Ticket Medio
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>
            €{stats.ticketMedio.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            Media per ordine oggi
          </div>
        </div>

        {/* Clienti Unici */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #f093fb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            👥 Clienti Attivi
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f093fb', marginBottom: '4px' }}>
            {stats.clientiUnici}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            Nel periodo selezionato
          </div>
        </div>
      </div>

      {/* Grafici */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Trend Vendite */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
            📈 Trend Vendite
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.trendGiornaliero}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" orientation="left" stroke="#667eea" />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value, name) => {
                  if (name === 'Valore') return `€${value.toFixed(2)}`;
                  return value;
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="valore" stroke="#667eea" strokeWidth={2} dot={{ r: 4 }} name="Valore" />
              <Line yAxisId="right" type="monotone" dataKey="ordini" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Ordini" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuzione Oraria */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
            🕐 Distribuzione Oraria
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.distribuzioneOraria}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="ora" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value, name) => {
                  if (name === 'Valore') return `€${value.toFixed(2)}`;
                  return value;
                }}
              />
              <Legend />
              <Bar dataKey="ordini" fill="#f093fb" name="Ordini" />
              <Bar dataKey="valore" fill="#764ba2" name="Valore" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prodotti Top */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '24px', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
          🏆 Top 5 Prodotti - {periodo === 'settimana' ? 'Ultima Settimana' : periodo === 'mese' ? 'Ultimo Mese' : 'Quest\'anno'}
        </h3>
        
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* Lista Prodotti */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.prodottiTop.map((prod, index) => (
                <div 
                  key={index}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${COLORS[index % COLORS.length]}`
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                      {index + 1}. {prod.nome}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {prod.quantita.toFixed(1)} unità vendute
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: COLORS[index % COLORS.length] 
                  }}>
                    €{prod.valore.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grafico Torta */}
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.prodottiTop}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nome, valore }) => {
                    const total = stats.prodottiTop.reduce((sum, p) => sum + p.valore, 0);
                    const percent = ((valore / total) * 100).toFixed(0);
                    return `${percent}%`;
                  }}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="valore"
                >
                  {stats.prodottiTop.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {stats.prodottiTop.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#9ca3af' 
          }}>
            Nessun prodotto venduto nel periodo selezionato
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
