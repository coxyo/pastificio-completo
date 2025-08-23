// src/components/Fidelizzazione/FidelizzazioneClienti.js
import React, { useState, useEffect } from 'react';

const FidelizzazioneClienti = ({ ordini }) => {
  const [clienti, setClienti] = useState([]);
  const [dialogPromo, setDialogPromo] = useState(false);
  const [clienteSelezionato, setClienteSelezionato] = useState(null);
  const [dialogDettagli, setDialogDettagli] = useState(false);
  const [filtroLivello, setFiltroLivello] = useState('tutti');
  const [ordinamento, setOrdinamento] = useState('punti');
  const [showRewards, setShowRewards] = useState(false);
  const [rewardSelezionato, setRewardSelezionato] = useState(null);

  // Configurazione livelli e rewards
  const LIVELLI = {
    Bronze: { min: 0, max: 199, colore: '#CD7F32', sconto: 5, icon: '🥉' },
    Silver: { min: 200, max: 499, colore: '#C0C0C0', sconto: 10, icon: '🥈' },
    Gold: { min: 500, max: 999, colore: '#FFD700', sconto: 15, icon: '🥇' },
    Platinum: { min: 1000, max: Infinity, colore: '#E5E4E2', sconto: 20, icon: '💎' }
  };

  const REWARDS = [
    { id: 1, nome: 'Sconto 10€', puntiRichiesti: 100, tipo: 'sconto', valore: 10 },
    { id: 2, nome: 'Prodotto Omaggio', puntiRichiesti: 150, tipo: 'omaggio', valore: 'Pardulas 500g' },
    { id: 3, nome: 'Sconto 20%', puntiRichiesti: 200, tipo: 'percentuale', valore: 20 },
    { id: 4, nome: 'Consegna Gratuita', puntiRichiesti: 50, tipo: 'consegna', valore: 0 },
    { id: 5, nome: 'Box Degustazione', puntiRichiesti: 300, tipo: 'box', valore: 'Box 6 prodotti' },
    { id: 6, nome: 'Sconto 50€', puntiRichiesti: 500, tipo: 'sconto', valore: 50 }
  ];

  useEffect(() => {
    analizzaClienti();
  }, [ordini, filtroLivello, ordinamento]);

  const analizzaClienti = () => {
    const clientiMap = {};
    
    ordini.forEach(ordine => {
      const key = ordine.telefono;
      if (!key) return;
      
      if (!clientiMap[key]) {
        clientiMap[key] = {
          nome: ordine.nomeCliente || ordine.cliente,
          telefono: ordine.telefono,
          email: ordine.email || '',
          ordini: [],
          punti: 0,
          puntiUtilizzati: 0,
          totaleSpeso: 0,
          prodottiPreferiti: {},
          primoOrdine: ordine.createdAt || ordine.dataRitiro,
          ultimoOrdine: ordine.createdAt || ordine.dataRitiro,
          mediaOrdine: 0,
          frequenzaGiorni: 0,
          prossimoOrdineStimato: null,
          livello: 'Bronze',
          badge: [],
          rewardsDisponibili: [],
          storiaRewards: []
        };
      }
      
      clientiMap[key].ordini.push(ordine);
      const totaleOrdine = ordine.totale || 0;
      clientiMap[key].totaleSpeso += totaleOrdine;
      clientiMap[key].punti += Math.floor(totaleOrdine / 10); // 1 punto ogni 10€
      
      // Aggiorna date
      const dataOrdine = new Date(ordine.createdAt || ordine.dataRitiro);
      const primaData = new Date(clientiMap[key].primoOrdine);
      const ultimaData = new Date(clientiMap[key].ultimoOrdine);
      
      if (dataOrdine < primaData) clientiMap[key].primoOrdine = ordine.createdAt || ordine.dataRitiro;
      if (dataOrdine > ultimaData) clientiMap[key].ultimoOrdine = ordine.createdAt || ordine.dataRitiro;
      
      // Analizza prodotti preferiti
      (ordine.prodotti || []).forEach(prod => {
        const nomeProdotto = prod.nome || prod.prodotto;
        if (!clientiMap[key].prodottiPreferiti[nomeProdotto]) {
          clientiMap[key].prodottiPreferiti[nomeProdotto] = 0;
        }
        clientiMap[key].prodottiPreferiti[nomeProdotto] += prod.quantita || 0;
      });
    });
    
    // Calcola statistiche e livelli
    Object.values(clientiMap).forEach(cliente => {
      // Calcola livello
      if (cliente.punti >= 1000) cliente.livello = 'Platinum';
      else if (cliente.punti >= 500) cliente.livello = 'Gold';
      else if (cliente.punti >= 200) cliente.livello = 'Silver';
      else cliente.livello = 'Bronze';
      
      // Media ordine
      cliente.mediaOrdine = cliente.ordini.length > 0 
        ? cliente.totaleSpeso / cliente.ordini.length 
        : 0;
      
      // Frequenza ordini (giorni tra ordini)
      if (cliente.ordini.length > 1) {
        const giorniTotali = Math.floor(
          (new Date(cliente.ultimoOrdine) - new Date(cliente.primoOrdine)) / (1000 * 60 * 60 * 24)
        );
        cliente.frequenzaGiorni = Math.floor(giorniTotali / (cliente.ordini.length - 1));
        
        // Stima prossimo ordine
        const ultimaData = new Date(cliente.ultimoOrdine);
        const prossimaData = new Date(ultimaData);
        prossimaData.setDate(prossimaData.getDate() + cliente.frequenzaGiorni);
        cliente.prossimoOrdineStimato = prossimaData;
      }
      
      // Assegna badge
      cliente.badge = calcolaBadge(cliente);
      
      // Calcola rewards disponibili
      cliente.rewardsDisponibili = REWARDS.filter(r => r.puntiRichiesti <= cliente.punti);
      
      // Top 3 prodotti preferiti
      cliente.topProdotti = Object.entries(cliente.prodottiPreferiti)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([nome, quantita]) => ({ nome, quantita }));
    });
    
    // Filtra e ordina
    let clientiFiltrati = Object.values(clientiMap);
    
    if (filtroLivello !== 'tutti') {
      clientiFiltrati = clientiFiltrati.filter(c => c.livello === filtroLivello);
    }
    
    // Ordinamento
    clientiFiltrati.sort((a, b) => {
      switch(ordinamento) {
        case 'punti': return b.punti - a.punti;
        case 'spesa': return b.totaleSpeso - a.totaleSpeso;
        case 'ordini': return b.ordini.length - a.ordini.length;
        case 'recenti': return new Date(b.ultimoOrdine) - new Date(a.ultimoOrdine);
        default: return b.punti - a.punti;
      }
    });
    
    setClienti(clientiFiltrati);
  };

  const calcolaBadge = (cliente) => {
    const badges = [];
    
    if (cliente.ordini.length >= 50) badges.push({ icon: '👑', nome: 'Re del Pastificio', desc: '50+ ordini' });
    else if (cliente.ordini.length >= 20) badges.push({ icon: '⭐', nome: 'Cliente VIP', desc: '20+ ordini' });
    else if (cliente.ordini.length >= 10) badges.push({ icon: '🌟', nome: 'Cliente Fedele', desc: '10+ ordini' });
    else if (cliente.ordini.length >= 5) badges.push({ icon: '💫', nome: 'Cliente Affezionato', desc: '5+ ordini' });
    
    if (cliente.totaleSpeso >= 5000) badges.push({ icon: '💰', nome: 'Big Spender', desc: '€5000+ spesi' });
    else if (cliente.totaleSpeso >= 2000) badges.push({ icon: '💵', nome: 'Premium', desc: '€2000+ spesi' });
    else if (cliente.totaleSpeso >= 1000) badges.push({ icon: '💴', nome: 'Supporter', desc: '€1000+ spesi' });
    
    if (cliente.frequenzaGiorni > 0 && cliente.frequenzaGiorni <= 7) {
      badges.push({ icon: '🔥', nome: 'Habitué', desc: 'Ordina ogni settimana' });
    }
    
    // Badge primo ordine
    const giorniDaPrimoOrdine = Math.floor(
      (new Date() - new Date(cliente.primoOrdine)) / (1000 * 60 * 60 * 24)
    );
    if (giorniDaPrimoOrdine >= 365) {
      badges.push({ icon: '🎂', nome: 'Veterano', desc: 'Cliente da 1+ anno' });
    }
    
    return badges;
  };

  const inviaPromozione = async () => {
    if (!clienteSelezionato) return;
    
    const messaggio = generaMessaggioPromo(clienteSelezionato);
    
    // Simula invio WhatsApp
    console.log('Invio promo WhatsApp:', {
      to: clienteSelezionato.telefono,
      message: messaggio
    });
    
    // Se hai un servizio WhatsApp configurato
    try {
      const response = await fetch('http://localhost:5000/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          telefono: clienteSelezionato.telefono,
          messaggio: messaggio
        })
      });
      
      if (response.ok) {
        alert('✅ Promozione inviata con successo!');
      } else {
        alert('📱 Servizio WhatsApp non disponibile - Messaggio copiato negli appunti');
        navigator.clipboard.writeText(messaggio);
      }
    } catch (error) {
      console.log('WhatsApp non configurato, copio negli appunti');
      navigator.clipboard.writeText(messaggio);
      alert('📋 Messaggio copiato negli appunti!');
    }
    
    setDialogPromo(false);
  };

  const generaMessaggioPromo = (cliente) => {
    const livelloInfo = LIVELLI[cliente.livello];
    const reward = cliente.rewardsDisponibili[0];
    
    let messaggio = `Ciao ${cliente.nome}! 🌟\n\n`;
    messaggio += `Come nostro cliente ${livelloInfo.icon} ${cliente.livello}, `;
    messaggio += `hai accumulato ${cliente.punti} punti fedeltà! 🎉\n\n`;
    
    if (reward) {
      messaggio += `✨ Puoi riscattare: ${reward.nome}\n`;
    }
    
    messaggio += `🎁 Sconto esclusivo del ${livelloInfo.sconto}% sul prossimo ordine\n`;
    
    if (cliente.topProdotti && cliente.topProdotti[0]) {
      messaggio += `\n🥐 Il tuo preferito "${cliente.topProdotti[0].nome}" ti aspetta!\n`;
    }
    
    if (cliente.prossimoOrdineStimato) {
      const giorni = Math.floor((cliente.prossimoOrdineStimato - new Date()) / (1000 * 60 * 60 * 24));
      if (giorni > 0 && giorni < 7) {
        messaggio += `\n📅 Ti aspettiamo tra ${giorni} giorni circa!\n`;
      }
    }
    
    messaggio += `\nGrazie per la tua fiducia! 🙏\nPastificio Nonna Claudia`;
    
    return messaggio;
  };

  const riscattaReward = (cliente, reward) => {
    if (cliente.punti < reward.puntiRichiesti) {
      alert('Punti insufficienti!');
      return;
    }
    
    // Qui implementeresti la logica per riscattare il reward
    console.log('Riscatto reward:', { cliente, reward });
    
    // Genera codice sconto
    const codiceSconto = `${reward.tipo.toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
    
    alert(`✅ Reward riscattato!\n\nCodice: ${codiceSconto}\n${reward.nome}`);
    
    // Aggiorna punti (nella vera implementazione salveresti nel database)
    cliente.punti -= reward.puntiRichiesti;
    cliente.puntiUtilizzati += reward.puntiRichiesti;
    cliente.storiaRewards.push({
      reward,
      data: new Date(),
      codice: codiceSconto
    });
    
    setShowRewards(false);
    analizzaClienti(); // Ricarica dati
  };

  const getLivelloProgress = (punti) => {
    if (punti >= 1000) return 100;
    if (punti >= 500) return ((punti - 500) / 500) * 100;
    if (punti >= 200) return ((punti - 200) / 300) * 100;
    return (punti / 200) * 100;
  };

  const getNextLivello = (livello, punti) => {
    if (livello === 'Bronze' && punti < 200) return { nome: 'Silver', puntiMancanti: 200 - punti };
    if (livello === 'Silver' && punti < 500) return { nome: 'Gold', puntiMancanti: 500 - punti };
    if (livello === 'Gold' && punti < 1000) return { nome: 'Platinum', puntiMancanti: 1000 - punti };
    return null;
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', color: '#1f2937', marginBottom: '8px' }}>
          🎁 Programma Fedeltà
        </h1>
        <p style={{ color: '#6b7280' }}>
          Gestisci e premia i tuoi clienti più fedeli
        </p>
      </div>

      {/* Statistiche Generali */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{ 
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{clienti.length}</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Clienti Totali</div>
        </div>
        
        <div style={{ 
          padding: '20px',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {clienti.reduce((sum, c) => sum + c.punti, 0)}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Punti Totali</div>
        </div>
        
        <div style={{ 
          padding: '20px',
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            €{clienti.reduce((sum, c) => sum + c.totaleSpeso, 0).toFixed(0)}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Valore Totale</div>
        </div>
        
        <div style={{ 
          padding: '20px',
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {clienti.filter(c => c.livello === 'Gold' || c.livello === 'Platinum').length}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Clienti Premium</div>
        </div>
      </div>

      {/* Filtri e Ordinamento */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <select
          value={filtroLivello}
          onChange={(e) => setFiltroLivello(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: 'white',
            fontSize: '14px'
          }}
        >
          <option value="tutti">Tutti i Livelli</option>
          <option value="Bronze">🥉 Bronze</option>
          <option value="Silver">🥈 Silver</option>
          <option value="Gold">🥇 Gold</option>
          <option value="Platinum">💎 Platinum</option>
        </select>
        
        <select
          value={ordinamento}
          onChange={(e) => setOrdinamento(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: 'white',
            fontSize: '14px'
          }}
        >
          <option value="punti">Ordina per Punti</option>
          <option value="spesa">Ordina per Spesa</option>
          <option value="ordini">Ordina per N° Ordini</option>
          <option value="recenti">Ordini Recenti</option>
        </select>
        
        <button
          onClick={() => setShowRewards(true)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          🎁 Catalogo Rewards
        </button>
      </div>

      {/* Lista Clienti */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '16px'
      }}>
        {clienti.slice(0, 20).map((cliente, index) => {
          const livelloInfo = LIVELLI[cliente.livello];
          const prossimoLivello = getNextLivello(cliente.livello, cliente.punti);
          const progress = getLivelloProgress(cliente.punti);
          
          return (
            <div key={index} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
            onClick={() => {
              setClienteSelezionato(cliente);
              setDialogDettagli(true);
            }}
            >
              {/* Ribbon Livello */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: livelloInfo.colore,
                color: 'white',
                padding: '4px 12px',
                borderBottomLeftRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {livelloInfo.icon} {cliente.livello}
              </div>
              
              {/* Info Cliente */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: livelloInfo.colore,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginRight: '12px'
                }}>
                  {index + 1}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1f2937' }}>
                    {cliente.nome}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    📞 {cliente.telefono}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                    {cliente.punti}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>punti</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  <span>{cliente.livello}</span>
                  {prossimoLivello && (
                    <span>{prossimoLivello.puntiMancanti} punti al {prossimoLivello.nome}</span>
                  )}
                </div>
                <div style={{
                  height: '6px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: livelloInfo.colore,
                    transition: 'width 0.3s'
                  }}></div>
                </div>
              </div>
              
              {/* Statistiche */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                    €{cliente.totaleSpeso.toFixed(0)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>Totale</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
                    {cliente.ordini.length}
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>Ordini</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6' }}>
                    €{cliente.mediaOrdine.toFixed(0)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>Media</div>
                </div>
              </div>
              
              {/* Badge */}
              {cliente.badge.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  gap: '4px',
                  marginBottom: '12px',
                  flexWrap: 'wrap'
                }}>
                  {cliente.badge.slice(0, 3).map((badge, i) => (
                    <div key={i} title={badge.desc} style={{
                      padding: '2px 8px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '12px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{badge.icon}</span>
                      <span>{badge.nome}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Prodotti Preferiti */}
              {cliente.topProdotti && cliente.topProdotti.length > 0 && (
                <div style={{
                  padding: '8px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                    🥐 Preferiti:
                  </div>
                  <div style={{ fontSize: '12px', color: '#1f2937' }}>
                    {cliente.topProdotti.slice(0, 2).map(p => p.nome).join(', ')}
                  </div>
                </div>
              )}
              
              {/* Azioni */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setClienteSelezionato(cliente);
                    setDialogPromo(true);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  📱 Invia Promo
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setClienteSelezionato(cliente);
                    setRewardSelezionato(cliente.rewardsDisponibili[0]);
                    if (cliente.rewardsDisponibili.length > 0) {
                      if (confirm(`Riscattare ${cliente.rewardsDisponibili[0].nome} per ${cliente.nome}?`)) {
                        riscattaReward(cliente, cliente.rewardsDisponibili[0]);
                      }
                    }
                  }}
                  disabled={cliente.rewardsDisponibili.length === 0}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: cliente.rewardsDisponibili.length > 0 ? '#10b981' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: cliente.rewardsDisponibili.length > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  🎁 Reward
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog Invio Promozione */}
      {dialogPromo && clienteSelezionato && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>
              📱 Invia Promozione a {clienteSelezionato.nome}
            </h3>
            
            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6'
            }}>
              {generaMessaggioPromo(clienteSelezionato)}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDialogPromo(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Annulla
              </button>
              <button
                onClick={inviaPromozione}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Invia WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Dettagli Cliente */}
      {dialogDettagli && clienteSelezionato && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>
              📊 Dettagli Cliente
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <h4>{clienteSelezionato.nome}</h4>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                📞 {clienteSelezionato.telefono} | 
                Livello: {LIVELLI[clienteSelezionato.livello].icon} {clienteSelezionato.livello}
              </p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Punti Attuali</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                  {clienteSelezionato.punti}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Totale Speso</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  €{clienteSelezionato.totaleSpeso.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Ordini Totali</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {clienteSelezionato.ordini.length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Media Ordine</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                  €{clienteSelezionato.mediaOrdine.toFixed(2)}
                </div>
              </div>
            </div>
            
            {/* Badges */}
            {clienteSelezionato.badge.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ marginBottom: '12px', color: '#374151' }}>🏅 Badge Conquistati</h5>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {clienteSelezionato.badge.map((badge, i) => (
                    <div key={i} style={{
                      padding: '8px 12px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}>
                      {badge.icon} {badge.nome}
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{badge.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Prodotti Preferiti */}
            {clienteSelezionato.topProdotti && clienteSelezionato.topProdotti.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ marginBottom: '12px', color: '#374151' }}>🥐 Prodotti Preferiti</h5>
                <div>
                  {clienteSelezionato.topProdotti.map((prod, i) => (
                    <div key={i} style={{
                      padding: '8px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>{prod.nome}</span>
                      <span style={{ color: '#6b7280' }}>Ordinato {prod.quantita} volte</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Rewards Disponibili */}
            {clienteSelezionato.rewardsDisponibili.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ marginBottom: '12px', color: '#374151' }}>🎁 Rewards Disponibili</h5>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {clienteSelezionato.rewardsDisponibili.map((reward, i) => (
                    <div key={i} style={{
                      padding: '12px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>{reward.nome}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {reward.puntiRichiesti} punti
                        </div>
                      </div>
                      <button
                        onClick={() => riscattaReward(clienteSelezionato, reward)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Riscatta
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={() => setDialogDettagli(false)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* Dialog Catalogo Rewards */}
      {showRewards && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>
              🎁 Catalogo Rewards
            </h3>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              {REWARDS.map((reward) => (
                <div key={reward.id} style={{
                  padding: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                        {reward.nome}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                        {reward.tipo === 'sconto' && `Sconto di €${reward.valore}`}
                        {reward.tipo === 'percentuale' && `Sconto del ${reward.valore}%`}
                        {reward.tipo === 'omaggio' && `Prodotto: ${reward.valore}`}
                        {reward.tipo === 'consegna' && 'Consegna gratuita sul prossimo ordine'}
                        {reward.tipo === 'box' && reward.valore}
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 16px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      color: '#667eea'
                    }}>
                      {reward.puntiRichiesti} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setShowRewards(false)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FidelizzazioneClienti;