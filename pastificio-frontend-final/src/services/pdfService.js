// src/services/pdfService.js
class PDFService {
  constructor() {
    this.defaultOptions = {
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    };
  }

  async generateDailyProductionReport(data) {
    console.log('📋 Generazione report produzione:', data);
    
    // Mock implementation
    return {
      save: (filename) => {
        console.log(`💾 Salvando report produzione: ${filename}`);
        // Simula download
        const content = `
REPORT PRODUZIONE GIORNALIERA
==============================
Data: ${new Date().toLocaleDateString('it-IT')}
Totale Ordini: ${data.totalOrders}
Totale Prodotti: ${data.totalProducts}
Valore Totale: €${data.totalValue}
Clienti Unici: ${data.uniqueCustomers}

PRODOTTI PER CATEGORIA:
${JSON.stringify(data.ordersByCategory, null, 2)}

TIMELINE ORDINI:
${data.ordersByTime.map(o => `${o.time} - ${o.customerName}`).join('\n')}
        `;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    };
  }

  async generateSalesReport(data, period) {
    console.log('📊 Generazione report vendite:', data, period);
    
    return {
      save: (filename) => {
        console.log(`💾 Salvando report vendite: ${filename}`);
        alert(`Report ${period} generato (mock)`);
      }
    };
  }

  async generateProductLabels(products, options = {}) {
    console.log('🏷️ Generazione etichette:', products);
    
    return {
      save: (filename) => {
        console.log(`💾 Salvando etichette: ${filename}`);
        
        // Mock etichette
        const content = products.map(p => `
ETICHETTA: ${p.name}
Peso: ${p.weight}
Lotto: ${p.batch}
Produzione: ${new Date(p.productionDate).toLocaleDateString('it-IT')}
Scadenza: ${new Date(p.expiryDate).toLocaleDateString('it-IT')}
Prezzo: €${p.price}
Cliente: ${p.customerName}
        `).join('\n---\n');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    };
  }

  async generateOrderReceipt(order) {
    console.log('🧾 Generazione ricevuta:', order);
    
    return {
      save: (filename) => {
        console.log(`💾 Salvando ricevuta: ${filename}`);
        
        // Mock ricevuta
        const content = `
PASTIFICIO NONNA CLAUDIA
========================
RICEVUTA ORDINE

Ordine: ${order.id}
Data: ${new Date(order.date).toLocaleDateString('it-IT')}
Cliente: ${order.customerName}
Telefono: ${order.phone || 'N/D'}
Ritiro: ${order.pickupDate} ${order.pickupTime}
${order.isTravel ? '*** DA VIAGGIO ***' : ''}

PRODOTTI:
${order.products.map(p => `- ${p.name}: ${p.quantity} ${p.unit} - €${p.price}`).join('\n')}

TOTALE: €${order.products.reduce((sum, p) => sum + (p.quantity * p.price), 0).toFixed(2)}

${order.notes ? `Note: ${order.notes}` : ''}

Grazie e arrivederci!
        `;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    };
  }

  async generateFromHTML(element, options = {}) {
    console.log('📄 Generazione da HTML');
    
    return {
      save: (filename) => {
        console.log(`💾 Salvando documento HTML: ${filename}`);
        window.print();
      }
    };
  }

  save(doc, filename) {
    console.log(`💾 Salvando documento: ${filename}`);
    if (doc && doc.save) {
      doc.save(filename);
    } else {
      alert(`Documento salvato: ${filename} (mock)`);
    }
  }

  getBlob(doc) {
    return new Blob(['PDF content'], { type: 'application/pdf' });
  }

  getBase64(doc) {
    return 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKNCAwIG9iago=';
  }

  print(doc) {
    console.log('🖨️ Stampa documento');
    window.print();
  }
}

export const pdfService = new PDFService();
export default pdfService;