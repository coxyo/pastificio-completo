// src/services/integrationService.js
class IntegrationService {
  // Crea fattura da ordine
  static async createInvoiceFromOrder(ordine) {
    try {
      // Recupera impostazioni azienda
      const impostazioni = JSON.parse(localStorage.getItem('impostazioniAzienda') || '{}');
      
      // Recupera dati cliente
      const clienti = JSON.parse(localStorage.getItem('clienti') || '[]');
      const cliente = clienti.find(c => 
        c.nome === ordine.nomeCliente || 
        `${c.nome} ${c.cognome}` === ordine.nomeCliente ||
        c.ragioneSociale === ordine.nomeCliente
      );
      
      // Genera numero fattura
      const numeroFattura = `${impostazioni.prefissoFattura}/${impostazioni.annoFatturazione}/${String(impostazioni.proximoNumeroFattura).padStart(4, '0')}`;
      
      // Calcola totali
      const imponibile = ordine.prodotti.reduce((sum, p) => sum + (p.prezzo * p.quantita), 0);
      const iva = imponibile * (impostazioni.aliquotaIva / 100);
      const totale = imponibile + iva;
      
      const fattura = {
        id: Date.now(),
        numero: numeroFattura,
        data: new Date().toISOString(),
        cliente: cliente || {
          nome: ordine.nomeCliente,
          telefono: ordine.telefono
        },
        ordineId: ordine._id,
        righe: ordine.prodotti.map(p => ({
          descrizione: p.prodotto,
          quantita: p.quantita,
          prezzo: p.prezzo,
          totale: p.prezzo * p.quantita
        })),
        imponibile,
        iva,
        totale,
        stato: 'emessa',
        note: ordine.note
      };
      
      // Salva fattura
      const fatture = JSON.parse(localStorage.getItem('fatture') || '[]');
      fatture.push(fattura);
      localStorage.setItem('fatture', JSON.stringify(fatture));
      
      // Aggiorna numero fattura
      impostazioni.proximoNumeroFattura++;
      localStorage.setItem('impostazioniAzienda', JSON.stringify(impostazioni));
      
      // Aggiorna ordine
      ordine.fatturaId = fattura.id;
      ordine.statoFatturazione = 'fatturato';
      
      return fattura;
    } catch (error) {
      console.error('Errore creazione fattura:', error);
      throw error;
    }
  }
  
  // Aggiorna credito cliente
  static updateClienteCredito(clienteId, importo, tipo = 'addebito') {
    const clienti = JSON.parse(localStorage.getItem('clienti') || '[]');
    const cliente = clienti.find(c => c.id === clienteId);
    
    if (cliente) {
      if (!cliente.credito) cliente.credito = 0;
      cliente.credito += tipo === 'addebito' ? importo : -importo;
      
      localStorage.setItem('clienti', JSON.stringify(clienti));
    }
  }
  
  // Report integrato
  static getIntegratedReport(dataInizio, dataFine) {
    const ordini = JSON.parse(localStorage.getItem('ordini') || '[]');
    const fatture = JSON.parse(localStorage.getItem('fatture') || '[]');
    const clienti = JSON.parse(localStorage.getItem('clienti') || '[]');
    
    // Filtra per data
    const ordiniFiltrati = ordini.filter(o => {
      const data = new Date(o.dataRitiro);
      return data >= dataInizio && data <= dataFine;
    });
    
    const fattureFiltrate = fatture.filter(f => {
      const data = new Date(f.data);
      return data >= dataInizio && data <= dataFine;
    });
    
    return {
      ordini: {
        totale: ordiniFiltrati.length,
        valore: ordiniFiltrati.reduce((sum, o) => 
          sum + o.prodotti.reduce((s, p) => s + (p.prezzo * p.quantita), 0), 0
        ),
        completati: ordiniFiltrati.filter(o => o.stato === 'completato').length,
        inLavorazione: ordiniFiltrati.filter(o => o.stato === 'in_lavorazione').length
      },
      fatture: {
        totale: fattureFiltrate.length,
        imponibile: fattureFiltrate.reduce((sum, f) => sum + f.imponibile, 0),
        iva: fattureFiltrate.reduce((sum, f) => sum + f.iva, 0),
        totale: fattureFiltrate.reduce((sum, f) => sum + f.totale, 0)
      },
      clienti: {
        attivi: new Set(ordiniFiltrati.map(o => o.nomeCliente)).size,
        nuovi: clienti.filter(c => {
          const data = new Date(c.dataCreazione);
          return data >= dataInizio && data <= dataFine;
        }).length
      }
    };
  }
}

export default IntegrationService;