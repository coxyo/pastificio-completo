'use client';

import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    ordiniOggi: 0,
    valoreOggi: 0,
    ticketMedio: 0,
    ordiniCompletati: 0,
    ordiniTotali: 0,
    ultimiOrdini: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Step 1: Login
      const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@pastificio.com',
          password: 'admin123'
        })
      });
      
      const { token } = await loginResponse.json();
      
      // Step 2: Get Orders
      const ordersResponse = await fetch('http://localhost:5000/api/ordini', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const ordersData = await ordersResponse.json();
      const orders = ordersData.data || [];
      
      // Step 3: Calculate Stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || order.dataRitiro);
        return orderDate >= today;
      });
      
      const todayValue = todayOrders.reduce((sum, order) => {
        if (order.totale) return sum + order.totale;
        if (order.prodotti) {
          return sum + order.prodotti.reduce((s, p) => s + (p.prezzo * p.quantita), 0);
        }
        return sum;
      }, 0);
      
      setData({
        ordiniOggi: todayOrders.length,
        valoreOggi: todayValue,
        ticketMedio: todayOrders.length > 0 ? todayValue / todayOrders.length : 0,
        ordiniCompletati: todayOrders.filter(o => o.stato === 'completato').length,
        ordiniTotali: orders.length,
        ultimiOrdini: orders.slice(0, 5)
      });
      
    } catch (error) {
      console.error('Dashboard Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Caricamento Dashboard...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>Dashboard</h1>
      
      {/* KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '8px',
          border: '1px solid #90caf9'
        }}>
          <div style={{ fontSize: '14px', color: '#1565c0', marginBottom: '8px' }}>
            🛒 Ordini Oggi
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976d2' }}>
            {data.ordiniOggi}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Totale: {data.ordiniOggi}
          </div>
        </div>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#e8f5e9', 
          borderRadius: '8px',
          border: '1px solid #81c784'
        }}>
          <div style={{ fontSize: '14px', color: '#2e7d32', marginBottom: '8px' }}>
            💰 Valore Oggi
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#388e3c' }}>
            €{data.valoreOggi.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Totale: €{data.valoreOggi.toFixed(2)}
          </div>
        </div>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fff3e0', 
          borderRadius: '8px',
          border: '1px solid '#ffb74d'
        }}>
          <div style={{ fontSize: '14px', color: '#e65100', marginBottom: '8px' }}>
            📊 Ticket Medio
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f57c00' }}>
            €{data.ticketMedio.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Generale: €{data.ticketMedio.toFixed(2)}
          </div>
        </div>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fce4ec', 
          borderRadius: '8px',
          border: '1px solid #f06292'
        }}>
          <div style={{ fontSize: '14px', color: '#c2185b', marginBottom: '8px' }}>
            ⏳ In Lavorazione
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#d81b60' }}>
            {data.ordiniCompletati}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Completati: {data.ordiniCompletati}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>
            Prodotti Più Venduti Oggi
          </h2>
          <p style={{ color: '#999' }}>Nessun prodotto venduto oggi</p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>
            Ultimi Ordini
          </h2>
          {data.ultimiOrdini.length === 0 ? (
            <p style={{ color: '#999' }}>Nessun ordine disponibile</p>
          ) : (
            data.ultimiOrdini.map((order, index) => (
              <div key={order._id || index} style={{ 
                padding: '12px 0', 
                borderBottom: index < data.ultimiOrdini.length - 1 ? '1px solid #f0f0f0' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{order.nomeCliente}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(order.dataRitiro || order.createdAt).toLocaleDateString('it-IT')}
                  </div>
                </div>
                <div style={{ fontWeight: 'bold', color: '#388e3c' }}>
                  €{(order.totale || 0).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}