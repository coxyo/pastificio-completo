// services/reportService.js - VERSIONE COMPLETA CON MOCK
import axios from 'axios';
import { UtilityService } from './utilityService';

const API_URL = process.env.REACT_APP_API_URL || '/api';
const USE_MOCK = true; // Cambia a false quando il backend è attivo

// Mock templates
const mockTemplates = [
  {
    id: 'daily',
    nome: 'Report Giornaliero',
    descrizione: 'Riepilogo completo degli ordini del giorno',
    tipo: 'report'
  },
  {
    id: 'weekly',
    nome: 'Report Settimanale',
    descrizione: 'Analisi settimanale con trend e statistiche',
    tipo: 'report'
  },
  {
    id: 'order',
    nome: 'Ricevuta Ordine',
    descrizione: 'Ricevuta dettagliata per singolo ordine',
    tipo: 'ricevuta'
  },
  {
    id: 'labels',
    nome: 'Etichette Prodotti',
    descrizione: 'Etichette stampabili per prodotti',
    tipo: 'etichetta'
  },
  {
    id: 'production',
    nome: 'Scheda Produzione',
    descrizione: 'Lista produzione per reparto',
    tipo: 'produzione'
  },
  {
    id: 'inventory',
    nome: 'Report Inventario',
    descrizione: 'Stato attuale del magazzino',
    tipo: 'inventario'
  }
];

const reportService = {
  // === METODI API CON MOCK ===
  fetchTemplates: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockTemplates;
    }

    try {
      const response = await axios.get(`${API_URL}/report/templates`);
      return response.data.data;
    } catch (error) {
      console.error('Errore nel recupero dei template', error);
      // Fallback ai mock in caso di errore
      return mockTemplates;
    }
  },

  generateOrderPDF: async (orderId, templateId = 'standard') => {
    if (USE_MOCK) {
      console.log(`Generando PDF per ordine ${orderId} con template ${templateId}`);
      // Simula generazione PDF con mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      return '#mock-pdf-url';
    }

    try {
      return `${API_URL}/report/ordine/${orderId}?template=${templateId}`;
    } catch (error) {
      console.error('Errore nella generazione del PDF dell\'ordine', error);
      return '#error-pdf';
    }
  },

  generateDailyReport: async (date) => {
    if (USE_MOCK) {
      console.log(`Generando report giornaliero per ${date}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return '#mock-daily-report';
    }

    try {
      const formattedDate = date.toISOString().split('T')[0];
      return `${API_URL}/report/giornaliero?data=${formattedDate}`;
    } catch (error) {
      console.error('Errore nella generazione del report giornaliero', error);
      return '#error-daily-report';
    }
  },

  generateWeeklyReport: async (startDate, endDate) => {
    if (USE_MOCK) {
      console.log(`Generando report settimanale dal ${startDate} al ${endDate}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return '#mock-weekly-report';
    }

    try {
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
      return `${API_URL}/report/settimanale?start=${start}&end=${end}`;
    } catch (error) {
      console.error('Errore nella generazione del report settimanale', error);
      return '#error-weekly-report';
    }
  },

  generateProductionSheet: async (date, reparto = 'tutti') => {
    if (USE_MOCK) {
      console.log(`Generando scheda produzione per ${date}, reparto: ${reparto}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return '#mock-production-sheet';
    }

    try {
      const formattedDate = date.toISOString().split('T')[0];
      return `${API_URL}/report/produzione?data=${formattedDate}&reparto=${reparto}`;
    } catch (error) {
      console.error('Errore nella generazione della scheda produzione', error);
      return '#error-production-sheet';
    }
  },

  // === METODI DI STAMPA LOCALE ===
  generatePrintDocument: (orders, options = {}) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Impossibile aprire la finestra di stampa');
      return;
    }

    const doc = printWindow.document;

    // Stili CSS per la stampa
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stampa Ordini - ${UtilityService.formatDate(new Date())}</title>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #333;
          }
          .header h1 { 
            font-size: 28px; 
            margin-bottom: 10px;
            color: #2c3e50;
          }
          .header p { 
            font-size: 14px; 
            color: #7f8c8d;
          }
          .order { 
            margin-bottom: 30px; 
            border: 1px solid #ddd; 
            padding: 20px;
            background: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .order-header { 
            border-bottom: 2px solid #eee; 
            padding-bottom: 15px;
            margin-bottom: 15px;
          }
          .order-header h2 { 
            font-size: 20px; 
            color: #34495e;
            margin-bottom: 8px;
          }
          .order-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .order-info span {
            font-size: 14px;
            color: #555;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            background: #e74c3c;
            color: white;
            border-radius: 3px;
            font-size: 12px;
            margin-left: 10px;
          }
          .products { 
            margin: 20px 0; 
          }
          .products h3 { 
            font-size: 16px; 
            margin-bottom: 10px;
            color: #2c3e50;
          }
          .product-item { 
            margin: 8px 0;
            padding: 8px;
            background: #f8f9fa;
            border-left: 3px solid #3498db;
          }
          .product-name {
            font-weight: 600;
            color: #2c3e50;
          }
          .product-details {
            font-size: 14px;
            color: #555;
            margin-top: 4px;
          }
          .product-note {
            font-size: 12px;
            color: #7f8c8d;
            font-style: italic;
            margin-top: 4px;
          }
          .summary { 
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid #eee;
          }
          .summary .total {
            font-size: 18px;
            font-weight: bold;
            color: #27ae60;
            text-align: right;
          }
          .notes {
            margin-top: 10px;
            padding: 10px;
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 4px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
          }
          @media print {
            body { margin: 10px; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
            .order { 
              box-shadow: none; 
              border: 1px solid #ccc;
            }
          }
        </style>
      </head>
      <body>
    `);

    // Header
    doc.write(`
      <div class="header">
        <h1>Pastificio Nonna Claudia</h1>
        <p>Ordini del ${UtilityService.formatDate(new Date())}</p>
        <p>Totale ordini: ${orders.length}</p>
      </div>
    `);

    // Ordini
    orders.forEach((order, index) => {
      if (index > 0 && options.pageBreak) {
        doc.write('<div class="page-break"></div>');
      }

      const orderTotal = UtilityService.calculateOrderTotal(order.prodotti || []);
      
      doc.write(`
        <div class="order">
          <div class="order-header">
            <h2>
              ${order.nomeCliente}
              ${order.daViaggio ? '<span class="badge">DA VIAGGIO</span>' : ''}
            </h2>
            <div class="order-info">
              <span><strong>Data Ritiro:</strong> ${UtilityService.formatDate(order.dataRitiro)}</span>
              <span><strong>Ora:</strong> ${order.oraRitiro || 'Non specificata'}</span>
            </div>
            ${order.telefono ? `
              <div class="order-info">
                <span><strong>Telefono:</strong> ${order.telefono}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="products">
            <h3>Prodotti Ordinati:</h3>
            ${(order.prodotti || []).map(p => `
              <div class="product-item">
                <div class="product-name">${p.prodotto}</div>
                <div class="product-details">
                  Quantità: ${UtilityService.formatQuantity(p.quantita, p.unita)} | 
                  Prezzo: ${UtilityService.formatPrice(p.prezzo)} | 
                  Subtotale: ${UtilityService.formatPrice((p.quantita || 0) * (p.prezzo || 0))}
                </div>
                ${p.note ? `<div class="product-note">Note: ${p.note}</div>` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="summary">
            <div class="total">
              TOTALE ORDINE: ${UtilityService.formatPrice(orderTotal)}
            </div>
            ${order.note ? `
              <div class="notes">
                <strong>Note ordine:</strong> ${order.note}
              </div>
            ` : ''}
          </div>
        </div>
      `);
    });

    // Footer
    doc.write(`
      <div class="footer">
        <p>Documento generato il ${new Date().toLocaleString('it-IT')}</p>
        <p>© ${new Date().getFullYear()} Pastificio Nonna Claudia - Tutti i diritti riservati</p>
      </div>
      
      <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="
          padding: 10px 20px;
          font-size: 16px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">Stampa Documento</button>
        <button onclick="window.close()" style="
          padding: 10px 20px;
          font-size: 16px;
          background: #95a5a6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-left: 10px;
        ">Chiudi</button>
      </div>
    `);

    doc.write('</body></html>');
    doc.close();

    // Auto-focus sulla finestra di stampa
    printWindow.focus();
  },

  // === EXPORT CSV ===
  exportToCSV: (orders, filename = null) => {
    if (!orders || orders.length === 0) {
      console.warn('Nessun ordine da esportare');
      return;
    }

    const headers = [
      'ID Ordine',
      'Data Ritiro',
      'Ora Ritiro',
      'Cliente',
      'Telefono',
      'Prodotto',
      'Quantità',
      'Unità',
      'Prezzo Unitario',
      'Subtotale',
      'Da Viaggio',
      'Note Prodotto',
      'Note Ordine',
      'Stato',
      'Data Creazione'
    ];

    const rows = [];
    
    orders.forEach(order => {
      if (order.prodotti && order.prodotti.length > 0) {
        order.prodotti.forEach((prodotto, index) => {
          rows.push([
            order._id || order.id || '',
            UtilityService.formatDate(order.dataRitiro),
            order.oraRitiro || '',
            order.nomeCliente || '',
            order.telefono || '',
            prodotto.prodotto || '',
            prodotto.quantita || 0,
            prodotto.unita || '',
            prodotto.prezzo || 0,
            (prodotto.quantita || 0) * (prodotto.prezzo || 0),
            index === 0 ? (order.daViaggio ? 'Sì' : 'No') : '',
            prodotto.note || '',
            index === 0 ? (order.note || '') : '',
            order.stato || 'in_attesa',
            order.createdAt ? new Date(order.createdAt).toLocaleString('it-IT') : ''
          ]);
        });
      } else {
        // Ordine senza prodotti
        rows.push([
          order._id || order.id || '',
          UtilityService.formatDate(order.dataRitiro),
          order.oraRitiro || '',
          order.nomeCliente || '',
          order.telefono || '',
          '',
          '',
          '',
          '',
          '',
          order.daViaggio ? 'Sì' : 'No',
          '',
          order.note || '',
          order.stato || 'in_attesa',
          order.createdAt ? new Date(order.createdAt).toLocaleString('it-IT') : ''
        ]);
      }
    });

    // Converti in formato CSV
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => {
        // Gestione valori con virgole o virgolette
        const cellStr = String(cell || '');
        if (cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(';'))
    ].join('\n');

    // Aggiungi BOM per Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Crea link per download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || `ordini_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(link.href);
  },

  // === EXPORT EXCEL (MOCK) ===
  exportToExcel: async (orders, options = {}) => {
    if (USE_MOCK) {
      console.log('Export Excel con opzioni:', options);
      // Fallback a CSV per mock
      reportService.exportToCSV(orders, `ordini_${new Date().toISOString().split('T')[0]}.csv`);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/report/export/excel`, {
        orders,
        options
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = options.filename || `ordini_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Errore export Excel, fallback a CSV', error);
      reportService.exportToCSV(orders);
    }
  },

  // === GENERAZIONE ETICHETTE ===
  generateLabels: (products, options = {}) => {
    const labelsPerPage = options.labelsPerPage || 12;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const doc = printWindow.document;

    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etichette Prodotti</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { margin: 0; padding: 0; }
          .labels-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 5mm;
            padding: 10mm;
          }
          .label {
            border: 1px solid #ddd;
            padding: 10px;
            height: 80mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            text-align: center;
            page-break-inside: avoid;
          }
          .product-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .product-info {
            font-size: 12px;
            margin: 5px 0;
          }
          .barcode {
            height: 30px;
            background: repeating-linear-gradient(
              90deg,
              #000,
              #000 2px,
              #fff 2px,
              #fff 4px
            );
            margin: 10px 0;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="labels-container">
    `);

    products.forEach((product, index) => {
      if (index > 0 && index % labelsPerPage === 0) {
        doc.write('</div><div class="labels-container" style="page-break-before: always;">');
      }

      doc.write(`
        <div class="label">
          <div class="product-name">${product.nome || product.prodotto}</div>
          <div class="product-info">
            ${product.prezzo ? `Prezzo: ${UtilityService.formatPrice(product.prezzo)}` : ''}
          </div>
          <div class="product-info">
            ${product.quantita ? `Quantità: ${UtilityService.formatQuantity(product.quantita, product.unita)}` : ''}
          </div>
          <div class="barcode"></div>
          <div class="product-info">
            ${new Date().toLocaleDateString('it-IT')}
          </div>
        </div>
      `);
    });

    doc.write(`
        </div>
        <div class="no-print" style="text-align: center; margin: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px;">Stampa Etichette</button>
        </div>
      </body>
      </html>
    `);

    doc.close();
    printWindow.focus();
  },

  // === STATISTICHE REPORT ===
  generateStatisticsReport: (orders, period = 'daily') => {
    const stats = {
      totaleOrdini: orders.length,
      totaleValore: 0,
      prodottiVenduti: {},
      clientiServiti: new Set(),
      ordiniDaViaggio: 0
    };

    orders.forEach(order => {
      const orderTotal = UtilityService.calculateOrderTotal(order.prodotti || []);
      stats.totaleValore += orderTotal;
      
      if (order.nomeCliente) {
        stats.clientiServiti.add(order.nomeCliente);
      }
      
      if (order.daViaggio) {
        stats.ordiniDaViaggio++;
      }

      (order.prodotti || []).forEach(p => {
        if (!stats.prodottiVenduti[p.prodotto]) {
          stats.prodottiVenduti[p.prodotto] = {
            quantita: 0,
            valore: 0
          };
        }
        stats.prodottiVenduti[p.prodotto].quantita += p.quantita || 0;
        stats.prodottiVenduti[p.prodotto].valore += (p.quantita || 0) * (p.prezzo || 0);
      });
    });

    return {
      ...stats,
      clientiServiti: stats.clientiServiti.size,
      ticketMedio: orders.length > 0 ? stats.totaleValore / orders.length : 0,
      percentualeDaViaggio: orders.length > 0 ? (stats.ordiniDaViaggio / orders.length) * 100 : 0
    };
  }
};

export default reportService;