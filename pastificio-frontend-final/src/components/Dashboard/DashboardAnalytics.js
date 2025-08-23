// src/components/Dashboard/DashboardAnalytics.js
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter
} from 'recharts';

const DashboardAnalytics = ({ ordini, periodo = 'settimana' }) => {
  const [metriche, setMetriche] = useState(null);
  const COLORS = ['#667eea', '#764ba2', '#84fab0', '#8fd3f4', '#f093fb', '#f5576c'];

  useEffect(() => {
    calcolaMetricheAvanzate();
  }, [ordini, periodo]);

  const calcolaMetricheAvanzate = () => {
    const oggi = new Date();
    
    // Filtra ordini per periodo
    const giorni = periodo === 'giorno' ? 1 : periodo === 'settimana' ? 7 : 30;
    const ordiniPeriodo = ordini.filter(o => {
      const dataOrdine = new Date(o.dataRitiro || o.createdAt);
      const diffTime = oggi - dataOrdine;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays <= giorni;
    });

    // Analisi per ora del giorno
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
    });

    // Analisi per giorno della settimana
    const giorniSettimana = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const distribuzioneSettimanale = giorniSettimana.map((giorno, index) => {
      const ordiniGiorno = ordiniPeriodo.filter(o => {
        const data = new Date(o.dataRitiro || o.createdAt);
        return data.getDay() === index;
      });

      return {
        giorno,
        ordini: ordiniGiorno.length,
        valore: ordiniGiorno.reduce((sum, o) => sum + (o.totale || 0), 0),
        media: ordiniGiorno.length > 0 
          ? ordiniGiorno.reduce((sum, o) => sum + (o.totale || 0), 0) / ordiniGiorno.length 
          : 0
      };
    });

    // Trend crescita
    const trendCrescita = [];
    for (let i = 29; i >= 0; i--) {
      const giorno = new Date();
      giorno.setDate(giorno.getDate() - i);
      
      const ordiniGiorno = ordini.filter(o => {
        const dataOrdine = new Date(o.dataRitiro || o.createdAt);
        return dataOrdine.toDateString() === giorno.toDateString();
      });

      if (i % 5 === 0) { // Prendi un punto ogni 5 giorni
        trendCrescita.push({
          data: giorno.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
          ordini: ordiniGiorno.length,
          valore: ordiniGiorno.reduce((sum, o) => sum + (o.totale || 0), 0),
          mediaOrdine: ordiniGiorno.length > 0 
            ? ordiniGiorno.reduce((sum, o) => sum + (o.totale || 0), 0) / ordiniGiorno.length
            : 0
        });
      }
    }

    // Analisi categorie prodotti
    const categorieAnalisi = {};
    ordiniPeriodo.forEach(ordine => {
      (ordine.prodotti || []).forEach(prod => {
        const categoria = prod.categoria || 'Altro';
        if (!categorieAnalisi[categoria]) {
          categorieAnalisi[categoria] = {
            quantita: 0,
            valore: 0,
            ordini: new Set()
          };
        }
        categorieAnalisi[categoria].quantita += prod.quantita || 0;
        categorieAnalisi[categoria].valore += (prod.quantita || 0) * (prod.prezzo || 0);
        categorieAnalisi[categoria].ordini.add(ordine._id);
      });
    });

    const categorieData = Object.entries(categorieAnalisi).map(([nome, data]) => ({
      nome,
      quantita: data.quantita,
      valore: data.valore,
      ordiniUnici: data.ordini.size,
      percentuale: (data.valore / ordiniPeriodo.reduce((sum, o) => sum + (o.totale || 0), 0) * 100) || 0
    }));

    // Heatmap vendite (giorni x ore)
    const heatmapData = [];
    for (let giorno = 0; giorno < 7; giorno++) {
      for (let ora = 8; ora < 20; ora++) {
        const ordiniSlot = ordiniPeriodo.filter(o => {
          const data = new Date(o.dataRitiro || o.createdAt);
          const oraRitiro = parseInt(o.oraRitiro?.split(':')[0] || '10');
          return data.getDay() === giorno && oraRitiro === ora;
        });

        heatmapData.push({
          giorno: giorniSettimana[giorno],
          ora: `${ora}:00`,
          valore: ordiniSlot.length,
          totale: ordiniSlot.reduce((sum, o) => sum + (o.totale || 0), 0)
        });
      }
    }

    setMetriche({
      distribuzioneOraria,
      distribuzioneSettimanale,
      trendCrescita,
      categorieData,
      heatmapData,
      statistiche: {
        totaleOrdini: ordiniPeriodo.length,
        totaleValore: ordiniPeriodo.reduce((sum, o) => sum + (o.totale || 0), 0),
        ticketMedio: ordiniPeriodo.length > 0 
          ? ordiniPeriodo.reduce((sum, o) => sum + (o.totale || 0), 0) / ordiniPeriodo.length 
          : 0,
        prodottoTop: categorieData.sort((a, b) => b.valore - a.valore)[0]?.nome || 'N/A'
      }
    });
  };

  if (!metriche) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Caricamento analytics...</div>;
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '24px', color: '#1f2937' }}>
        📊 Analytics Avanzate - {periodo === 'settimana' ? 'Ultima Settimana' : periodo === 'mese' ? 'Ultimo Mese' : 'Oggi'}
      </h2>

      {/* Grid Grafici */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
        
        {/* Trend Crescita */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#374151' }}>📈 Trend Crescita (30 giorni)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={metriche.trendCrescita}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="data" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" orientation="left" stroke="#667eea" />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value, name) => {
                  if (name === 'valore') return `€${value.toFixed(2)}`;
                  if (name === 'mediaOrdine') return `€${value.toFixed(2)}`;
                  return value;
                }}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="valore" stroke="#667eea" fill="url(#colorValue)" name="Fatturato" />
              <Bar yAxisId="right" dataKey="ordini" fill="#10b981" name="N° Ordini" />
              <Line yAxisId="left" type="monotone" dataKey="mediaOrdine" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Ticket Medio" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuzione Settimanale */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#374151' }}>📅 Performance per Giorno</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={metriche.distribuzioneSettimanale}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="giorno" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
              <Radar name="Ordini" dataKey="ordini" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
              <Radar name="Valore (€/10)" dataKey="valore" stroke="#10b981" fill="#10b981" fillOpacity={0.6} 
                     data={metriche.distribuzioneSettimanale.map(d => ({ ...d, valore: d.valore / 10 }))} />
              <Legend />
              <Tooltip formatter={(value, name) => {
                if (name === 'Valore (€/10)') return `€${(value * 10).toFixed(2)}`;
                return value;
              }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuzione Oraria */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#374151' }}>🕐 Distribuzione Oraria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metriche.distribuzioneOraria.filter(h => h.ora >= '08:00' && h.ora <= '20:00')}>
              <defs>
                <linearGradient id="colorOrdini" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f093fb" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f093fb" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="ora" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value, name) => {
                  if (name === 'valore') return `€${value.toFixed(2)}`;
                  return value;
                }}
              />
              <Area type="monotone" dataKey="ordini" stroke="#f093fb" fill="url(#colorOrdini)" name="Ordini" />
              <Area type="monotone" dataKey="valore" stroke="#764ba2" fill="transparent" strokeWidth={2} name="Valore" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Analisi Categorie */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#374151' }}>🥧 Vendite per Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metriche.categorieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ nome, percentuale }) => `${nome} ${percentuale.toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="valore"
              >
                {metriche.categorieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statistiche Riepilogo */}
      <div style={{ 
        marginTop: '24px', 
        padding: '20px', 
        backgroundColor: 'white', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#374151' }}>📊 Riepilogo Statistiche</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
              {metriche.statistiche.totaleOrdini}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Ordini Totali</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              €{metriche.statistiche.totaleValore.toFixed(2)}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Fatturato Totale</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
              €{metriche.statistiche.ticketMedio.toFixed(2)}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Ticket Medio</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f093fb' }}>
              {metriche.statistiche.prodottoTop}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Prodotto Top</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;