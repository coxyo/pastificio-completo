// src/utils/reportHelpers.js

export const reportHelpers = {
  // Calcola totale ordine
  calcolaTotaleOrdine: (ordine) => {
    if (!ordine || !ordine.prodotti) return 0;
    
    return ordine.prodotti.reduce((totale, prodotto) => {
      const prezzo = parseFloat(prodotto.prezzo) || 0;
      const quantita = parseFloat(prodotto.quantita) || 0;
      return totale + (prezzo * quantita);
    }, 0);
  },

  // Raggruppa ordini per data
  raggruppaPer: (ordini, campo) => {
    return ordini.reduce((gruppi, ordine) => {
      const chiave = ordine[campo];
      if (!gruppi[chiave]) {
        gruppi[chiave] = [];
      }
      gruppi[chiave].push(ordine);
      return gruppi;
    }, {});
  },

  // Calcola statistiche
  calcolaStatistiche: (ordini) => {
    const totaleOrdini = ordini.length;
    const totaleValore = ordini.reduce((sum, ordine) => 
      sum + reportHelpers.calcolaTotaleOrdine(ordine), 0
    );
    const ticketMedio = totaleOrdini > 0 ? totaleValore / totaleOrdini : 0;

    // Prodotti più venduti
    const prodottiMap = {};
    ordini.forEach(ordine => {
      if (ordine.prodotti) {
        ordine.prodotti.forEach(prod => {
          const nome = prod.prodotto || prod.nome;
          if (!prodottiMap[nome]) {
            prodottiMap[nome] = { quantita: 0, valore: 0 };
          }
          prodottiMap[nome].quantita += parseFloat(prod.quantita) || 0;
          prodottiMap[nome].valore += (parseFloat(prod.prezzo) || 0) * (parseFloat(prod.quantita) || 0);
        });
      }
    });

    const prodottiOrdinati = Object.entries(prodottiMap)
      .map(([nome, dati]) => ({ nome, ...dati }))
      .sort((a, b) => b.valore - a.valore);

    return {
      totaleOrdini,
      totaleValore,
      ticketMedio,
      prodottiTop: prodottiOrdinati.slice(0, 5)
    };
  }
};