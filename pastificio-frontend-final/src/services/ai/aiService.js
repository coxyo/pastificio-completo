// src/services/ai/aiService.js
class AIService {
  constructor() {
    this.predictions = {};
  }

  // Predizione vendite basata su storico
  predizioneVendite(ordiniStorici) {
    const oggi = new Date();
    const giornoSettimana = oggi.getDay();
    const meseCorrente = oggi.getMonth();
    
    // Analizza pattern storici
    const patternGiornaliero = this.analizzaPatternGiornaliero(ordiniStorici, giornoSettimana);
    const patternMensile = this.analizzaPatternMensile(ordiniStorici, meseCorrente);
    const trendCrescita = this.calcolaTrendCrescita(ordiniStorici);
    
    // Calcola previsioni
    const previsione = {
      ordiniPrevisti: Math.round(patternGiornaliero.mediaOrdini * trendCrescita),
      fatturatoPrevistoattore: patternGiornaliero.mediaFatturato * trendCrescita,
      prodottiConsigliati: this.getProdottiConsigliati(ordiniStorici, giornoSettimana),
      orePointe: this.getOrePunta(ordiniStorici, giornoSettimana),
      alertScorte: this.checkScorteMinime(ordiniStorici),
      suggerimenti: this.generaSuggerimenti(patternGiornaliero, patternMensile, trendCrescita)
    };
    
    return previsione;
  }

  analizzaPatternGiornaliero(ordini, giornoSettimana) {
    const ordiniGiorno = ordini.filter(o => {
      const data = new Date(o.dataRitiro || o.createdAt);
      return data.getDay() === giornoSettimana;
    });
    
    return {
      mediaOrdini: ordiniGiorno.length / Math.max(1, Math.floor(ordini.length / 30)),
      mediaFatturato: ordiniGiorno.reduce((sum, o) => sum + (o.totale || 0), 0) / Math.max(1, ordiniGiorno.length),
      prodottiFrequenti: this.analizzaProdottiFrequenti(ordiniGiorno)
    };
  }

  analizzaPatternMensile(ordini, mese) {
    const ordiniMese = ordini.filter(o => {
      const data = new Date(o.dataRitiro || o.createdAt);
      return data.getMonth() === mese;
    });
    
    return {
      totaleOrdini: ordiniMese.length,
      totaleFatturato: ordiniMese.reduce((sum, o) => sum + (o.totale || 0), 0)
    };
  }

  calcolaTrendCrescita(ordini) {
    if (ordini.length < 14) return 1.0;
    
    const oggi = new Date();
    const settimanaPrecedente = ordini.filter(o => {
      const data = new Date(o.dataRitiro || o.createdAt);
      const diff = (oggi - data) / (1000 * 60 * 60 * 24);
      return diff >= 7 && diff < 14;
    });
    
    const settimanaCorrente = ordini.filter(o => {
      const data = new Date(o.dataRitiro || o.createdAt);
      const diff = (oggi - data) / (1000 * 60 * 60 * 24);
      return diff < 7;
    });
    
    const crescita = settimanaCorrente.length / Math.max(1, settimanaPrecedente.length);
    return Math.min(1.5, Math.max(0.5, crescita)); // Limita tra 0.5 e 1.5
  }

  analizzaProdottiFrequenti(ordini) {
    const prodotti = {};
    ordini.forEach(ordine => {
      (ordine.prodotti || []).forEach(prod => {
        const nome = prod.nome || prod.prodotto;
        prodotti[nome] = (prodotti[nome] || 0) + prod.quantita;
      });
    });
    
    return Object.entries(prodotti)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, quantita]) => ({ nome, quantita }));
  }

  getProdottiConsigliati(ordini, giornoSettimana) {
    const ordiniGiorno = ordini.filter(o => {
      const data = new Date(o.dataRitiro || o.createdAt);
      return data.getDay() === giornoSettimana;
    });
    
    const prodotti = this.analizzaProdottiFrequenti(ordiniGiorno);
    
    return prodotti.map(p => ({
      ...p,
      quantitaConsigliata: Math.ceil(p.quantita * 1.2), // +20% per sicurezza
      probabilitaVendita: Math.min(95, 60 + (p.quantita * 2)) // Score probabilità
    }));
  }

  getOrePunta(ordini, giornoSettimana) {
    const ordiniGiorno = ordini.filter(o => {
      const data = new Date(o.dataRitiro || o.createdAt);
      return data.getDay() === giornoSettimana;
    });
    
    const oreDistribuzione = {};
    ordiniGiorno.forEach(ordine => {
      const ora = parseInt(ordine.oraRitiro?.split(':')[0] || '10');
      oreDistribuzione[ora] = (oreDistribuzione[ora] || 0) + 1;
    });
    
    return Object.entries(oreDistribuzione)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([ora, count]) => ({
        ora: `${ora}:00`,
        percentuale: (count / ordiniGiorno.length * 100).toFixed(1)
      }));
  }

  checkScorteMinime(ordini) {
    const ultimiOrdini = ordini.slice(-20); // Ultimi 20 ordini
    const prodottiVenduti = {};
    
    ultimiOrdini.forEach(ordine => {
      (ordine.prodotti || []).forEach(prod => {
        const nome = prod.nome || prod.prodotto;
        prodottiVenduti[nome] = (prodottiVenduti[nome] || 0) + prod.quantita;
      });
    });
    
    // Simula controllo scorte (in produzione si collegherebbe al magazzino)
    return Object.entries(prodottiVenduti)
      .filter(([_, quantita]) => quantita > 10) // Prodotti ad alto consumo
      .map(([nome, quantita]) => ({
        prodotto: nome,
        consumoSettimanale: quantita,
        giorniRimanenti: Math.floor(Math.random() * 7 + 1), // Simulato
        livelloAlert: quantita > 20 ? 'critico' : 'attenzione'
      }));
  }

  generaSuggerimenti(patternGiornaliero, patternMensile, trendCrescita) {
    const suggerimenti = [];
    
    if (trendCrescita > 1.2) {
      suggerimenti.push({
        tipo: 'crescita',
        messaggio: '📈 Crescita del +' + ((trendCrescita - 1) * 100).toFixed(0) + '% questa settimana!',
        azione: 'Aumenta le scorte dei prodotti più venduti'
      });
    }
    
    if (patternGiornaliero.mediaOrdini > 10) {
      suggerimenti.push({
        tipo: 'performance',
        messaggio: '🎯 Giornata ad alto volume prevista',
        azione: 'Prepara ' + Math.ceil(patternGiornaliero.mediaOrdini * 1.1) + ' ordini circa'
      });
    }
    
    if (patternGiornaliero.prodottiFrequenti.length > 0) {
      suggerimenti.push({
        tipo: 'prodotti',
        messaggio: '🥐 Prodotto star: ' + patternGiornaliero.prodottiFrequenti[0].nome,
        azione: 'Assicurati di avere scorte sufficienti'
      });
    }
    
    return suggerimenti;
  }

  // Suggerimenti personalizzati per cliente
  suggerimentiCliente(telefono, storicoOrdini) {
    const ordiniCliente = storicoOrdini.filter(o => o.telefono === telefono);
    
    if (ordiniCliente.length === 0) {
      return { nuovoCliente: true, suggerimenti: ['Offri sconto benvenuto 10%'] };
    }
    
    // Analisi preferenze
    const prodottiPreferiti = {};
    let totaleSpeso = 0;
    
    ordiniCliente.forEach(ordine => {
      totaleSpeso += ordine.totale || 0;
      (ordine.prodotti || []).forEach(prod => {
        const nome = prod.nome || prod.prodotto;
        prodottiPreferiti[nome] = (prodottiPreferiti[nome] || 0) + 1;
      });
    });
    
    // Calcola frequenza ordini
    const primoOrdine = new Date(ordiniCliente[0].createdAt);
    const ultimoOrdine = new Date(ordiniCliente[ordiniCliente.length - 1].createdAt);
    const giorniAttivita = Math.max(1, (ultimoOrdine - primoOrdine) / (1000 * 60 * 60 * 24));
    const frequenzaOrdini = ordiniCliente.length / Math.max(1, giorniAttivita / 30);
    
    // Calcola prossimo ordine probabile
    const intervalloMedio = giorniAttivita / Math.max(1, ordiniCliente.length - 1);
    const giorniDaUltimoOrdine = (new Date() - ultimoOrdine) / (1000 * 60 * 60 * 24);
    const probabileRiordino = giorniDaUltimoOrdine >= intervalloMedio * 0.8;
    
    return {
      nuovoCliente: false,
      clienteFedele: ordiniCliente.length >= 5,
      prodottiPreferiti: Object.entries(prodottiPreferiti)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([nome]) => nome),
      totaleSpeso,
      mediaOrdine: totaleSpeso / ordiniCliente.length,
      frequenzaOrdini: frequenzaOrdini.toFixed(1),
      probabileRiordino,
      giorniAlProssimoOrdine: Math.max(0, Math.ceil(intervalloMedio - giorniDaUltimoOrdine)),
      suggerimenti: this.generaSuggerimentiCliente(ordiniCliente, prodottiPreferiti, probabileRiordino)
    };
  }

  generaSuggerimentiCliente(ordiniCliente, prodottiPreferiti, probabileRiordino) {
    const suggerimenti = [];
    
    if (probabileRiordino) {
      suggerimenti.push('📱 Invia promemoria WhatsApp - cliente pronto per riordinare');
    }
    
    if (ordiniCliente.length >= 10) {
      suggerimenti.push('⭐ Cliente VIP - Offri sconto fedeltà 15%');
    } else if (ordiniCliente.length >= 5) {
      suggerimenti.push('🎁 Cliente fedele - Proponi programma punti');
    }
    
    const topProdotto = Object.entries(prodottiPreferiti).sort((a, b) => b[1] - a[1])[0];
    if (topProdotto) {
      suggerimenti.push(`💡 Suggerisci: ${topProdotto[0]} (ordinato ${topProdotto[1]} volte)`);
    }
    
    return suggerimenti;
  }
}

export default new AIService();