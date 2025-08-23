// utils/reportUtils.js

export const generaPDF = async (datiReport) => {
  // Placeholder per la generazione PDF
  console.log('Generazione PDF con dati:', datiReport);
  
  // Per ora simuliamo un download
  const contenuto = JSON.stringify(datiReport, null, 2);
  const blob = new Blob([contenuto], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${datiReport.tipo}_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  alert('Report PDF in fase di implementazione. Per ora scaricato in formato JSON.');
};

export const generaExcel = async (datiReport) => {
  // Placeholder per la generazione Excel
  console.log('Generazione Excel con dati:', datiReport);
  
  // Crea un CSV con BOM per Excel (per supportare caratteri speciali italiani)
  const BOM = '\uFEFF';
  let csv = BOM + 'Report ' + datiReport.tipo.toUpperCase() + '\n';
  csv += 'Periodo: ' + datiReport.periodo + '\n';
  csv += 'Generato: ' + datiReport.generato + '\n';
  csv += 'Totale Ordini: ' + datiReport.totaleOrdini + '\n\n';
  
  if (datiReport.tipo === 'vendite' && datiReport.venditePerGiorno) {
    // Aggiungi statistiche generali
    csv += 'STATISTICHE GENERALI\n';
    csv += `Valore Totale: €${datiReport.totaleValore?.toFixed(2) || '0.00'}\n`;
    csv += `Ticket Medio: €${datiReport.ticketMedio?.toFixed(2) || '0.00'}\n\n`;
    
    // Dettaglio vendite per giorno
    csv += 'VENDITE PER GIORNO\n';
    csv += 'Data;Ordini;Valore (€)\n';
    datiReport.venditePerGiorno.forEach(giorno => {
      csv += `${giorno.data};${giorno.ordini};${giorno.valore.toFixed(2)}\n`;
    });
    
  } else if (datiReport.tipo === 'prodotti' && datiReport.prodotti) {
    csv += 'REPORT PRODOTTI\n';
    csv += `Totale Prodotti: ${datiReport.totaleProdotti || 0}\n\n`;
    csv += 'Prodotto;Quantità;N° Ordini;Valore (€)\n';
    datiReport.prodotti.forEach(prod => {
      csv += `${prod.nome};${prod.quantita};${prod.ordini};${prod.valore.toFixed(2)}\n`;
    });
    
  } else if (datiReport.tipo === 'clienti' && datiReport.clienti) {
    csv += 'REPORT CLIENTI\n';
    csv += `Totale Clienti: ${datiReport.totaleClienti || 0}\n\n`;
    csv += 'Cliente;Telefono;N° Ordini;Valore Totale (€)\n';
    datiReport.clienti.forEach(cliente => {
      csv += `${cliente.nome};${cliente.telefono || 'N/A'};${cliente.ordini};${cliente.valore.toFixed(2)}\n`;
    });
    
  } else if (datiReport.tipo === 'giornaliero') {
    csv += 'RIEPILOGO GIORNALIERO\n';
    csv += `Data: ${datiReport.data}\n`;
    csv += `Totale Ordini: ${datiReport.ordiniOggi?.length || 0}\n`;
    csv += `Valore Totale: €${datiReport.totaleOggi?.toFixed(2) || '0.00'}\n\n`;
    
    if (datiReport.ordiniOggi && datiReport.ordiniOggi.length > 0) {
      csv += 'DETTAGLIO ORDINI\n';
      csv += 'Cliente;Telefono;Prodotti;Totale (€)\n';
      datiReport.ordiniOggi.forEach(ordine => {
        const prodottiStr = ordine.prodotti ? 
          ordine.prodotti.map(p => `${p.prodotto || p.nome} (${p.quantita})`).join(' - ') : 
          'N/A';
        const totale = ordine.totaleOrdine || ordine.totale || 0;
        csv += `${ordine.nomeCliente};${ordine.telefono || 'N/A'};${prodottiStr};${totale.toFixed(2)}\n`;
      });
    }
  }
  
  // Scarica il CSV con encoding corretto per Excel
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${datiReport.tipo}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const generaCSV = async (datiReport) => {
  // Usa la stessa logica di Excel ma con separatore virgola invece di punto e virgola
  console.log('Generazione CSV con dati:', datiReport);
  
  let csv = 'Report ' + datiReport.tipo.toUpperCase() + '\n';
  csv += 'Periodo: ' + datiReport.periodo + '\n';
  csv += 'Generato: ' + datiReport.generato + '\n';
  csv += 'Totale Ordini: ' + datiReport.totaleOrdini + '\n\n';
  
  if (datiReport.tipo === 'vendite' && datiReport.venditePerGiorno) {
    csv += 'STATISTICHE GENERALI\n';
    csv += 'Valore Totale: ' + (datiReport.totaleValore?.toFixed(2) || '0.00') + '\n';
    csv += 'Ticket Medio: ' + (datiReport.ticketMedio?.toFixed(2) || '0.00') + '\n\n';
    
    csv += 'Data,Ordini,Valore\n';
    datiReport.venditePerGiorno.forEach(giorno => {
      csv += `${giorno.data},${giorno.ordini},${giorno.valore.toFixed(2)}\n`;
    });
    
  } else if (datiReport.tipo === 'prodotti' && datiReport.prodotti) {
    csv += 'Totale Prodotti: ' + (datiReport.totaleProdotti || 0) + '\n\n';
    csv += 'Prodotto,Quantita,Ordini,Valore\n';
    datiReport.prodotti.forEach(prod => {
      // Gestisci virgole nel nome del prodotto
      const nome = prod.nome.includes(',') ? `"${prod.nome}"` : prod.nome;
      csv += `${nome},${prod.quantita},${prod.ordini},${prod.valore.toFixed(2)}\n`;
    });
    
  } else if (datiReport.tipo === 'clienti' && datiReport.clienti) {
    csv += 'Totale Clienti: ' + (datiReport.totaleClienti || 0) + '\n\n';
    csv += 'Cliente,Telefono,Ordini,Valore\n';
    datiReport.clienti.forEach(cliente => {
      // Gestisci virgole nel nome del cliente
      const nome = cliente.nome.includes(',') ? `"${cliente.nome}"` : cliente.nome;
      csv += `${nome},${cliente.telefono || 'N/A'},${cliente.ordini},${cliente.valore.toFixed(2)}\n`;
    });
  }
  
  // Scarica il CSV standard
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${datiReport.tipo}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Funzione helper per formattare le date in italiano
export const formatDateIT = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

// Funzione helper per formattare la valuta
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value || 0);
};