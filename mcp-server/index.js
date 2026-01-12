#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ordine from './models/Ordine.js';
import Cliente from './models/Cliente.js';
import Prodotto from './models/Prodotto.js';

// Carica variabili ambiente
dotenv.config();

// Connessione MongoDB
let dbConnected = false;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    dbConnected = true;
    console.error('✅ MongoDB connesso');
  })
  .catch(err => {
    console.error('❌ Errore connessione MongoDB:', err);
  });

// Inizializza server MCP
const server = new Server(
  {
    name: 'pastificio-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper: Formatta data italiana
function formatDate(date) {
  return new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Helper: Formatta valuta
function formatEuro(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

// ============================================
// LISTA TOOLS DISPONIBILI
// ============================================
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query_ordini',
        description: 'Cerca ordini nel database con filtri opzionali (data inizio/fine, cliente, stato)',
        inputSchema: {
          type: 'object',
          properties: {
            dataInizio: {
              type: 'string',
              description: 'Data inizio ricerca (formato: YYYY-MM-DD). Esempio: 2025-01-01'
            },
            dataFine: {
              type: 'string',
              description: 'Data fine ricerca (formato: YYYY-MM-DD). Esempio: 2025-01-31'
            },
            cliente: {
              type: 'string',
              description: 'Nome o parte del nome del cliente. Esempio: "Mario"'
            },
            stato: {
              type: 'string',
              description: 'Stato ordine: in_attesa, confermato, in_preparazione, pronto, consegnato, annullato'
            },
            limit: {
              type: 'number',
              description: 'Numero massimo di ordini da restituire (default: 50)'
            }
          }
        }
      },
      {
        name: 'statistiche_giornaliere',
        description: 'Ottieni statistiche della giornata corrente (ordini, fatturato, media ordine)',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'statistiche_periodo',
        description: 'Statistiche personalizzate per un periodo specifico',
        inputSchema: {
          type: 'object',
          properties: {
            dataInizio: {
              type: 'string',
              description: 'Data inizio (YYYY-MM-DD)'
            },
            dataFine: {
              type: 'string',
              description: 'Data fine (YYYY-MM-DD)'
            }
          },
          required: ['dataInizio', 'dataFine']
        }
      },
      {
        name: 'dettaglio_ordine',
        description: 'Ottieni dettagli completi di un ordine specifico',
        inputSchema: {
          type: 'object',
          properties: {
            ordineId: {
              type: 'string',
              description: 'ID MongoDB dell\'ordine (formato: 507f1f77bcf86cd799439011)'
            }
          },
          required: ['ordineId']
        }
      },
      {
        name: 'cerca_cliente',
        description: 'Cerca clienti per nome, cognome, telefono o codice',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Testo da cercare (nome, cognome, telefono o codice cliente)'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'storico_cliente',
        description: 'Visualizza tutti gli ordini di un cliente specifico',
        inputSchema: {
          type: 'object',
          properties: {
            clienteId: {
              type: 'string',
              description: 'ID MongoDB del cliente'
            }
          },
          required: ['clienteId']
        }
      },
      {
        name: 'prodotti_disponibili',
        description: 'Lista tutti i prodotti disponibili con prezzi e giacenze',
        inputSchema: {
          type: 'object',
          properties: {
            categoria: {
              type: 'string',
              description: 'Filtra per categoria: ravioli, dolci, pardulas, panadas, pasta, altro'
            },
            disponibili: {
              type: 'boolean',
              description: 'true = solo disponibili, false = solo non disponibili'
            }
          }
        }
      },
      {
        name: 'scorte_magazzino',
        description: 'Mostra prodotti sotto scorta minima o con giacenza bassa',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'top_clienti',
        description: 'Classifica clienti per fatturato o numero ordini',
        inputSchema: {
          type: 'object',
          properties: {
            criterio: {
              type: 'string',
              description: 'Ordina per: fatturato o ordini'
            },
            limit: {
              type: 'number',
              description: 'Numero di clienti da restituire (default: 10)'
            }
          }
        }
      },
      {
        name: 'top_prodotti',
        description: 'Prodotti più venduti per quantità o fatturato',
        inputSchema: {
          type: 'object',
          properties: {
            periodo: {
              type: 'string',
              description: 'Periodo: oggi, settimana, mese, anno, tutto'
            },
            limit: {
              type: 'number',
              description: 'Numero prodotti (default: 10)'
            }
          }
        }
      }
    ]
  };
});

// ============================================
// ESECUZIONE TOOLS
// ============================================
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!dbConnected) {
    return {
      content: [{
        type: 'text',
        text: '❌ Errore: Database non connesso. Verifica la configurazione MongoDB.'
      }]
    };
  }

  try {
    // ===== TOOL 1: QUERY ORDINI =====
    if (name === 'query_ordini') {
      const query = {};
      
      if (args.dataInizio || args.dataFine) {
        query.dataOrdine = {};
        if (args.dataInizio) query.dataOrdine.$gte = new Date(args.dataInizio);
        if (args.dataFine) query.dataOrdine.$lte = new Date(args.dataFine);
      }
      
      if (args.cliente) {
        const clienti = await Cliente.find({
          $or: [
            { nome: new RegExp(args.cliente, 'i') },
            { cognome: new RegExp(args.cliente, 'i') }
          ]
        }).select('_id');
        query.cliente = { $in: clienti.map(c => c._id) };
      }
      
      if (args.stato) {
        query.stato = args.stato;
      }
      
      const ordini = await Ordine
        .find(query)
        .populate('cliente', 'nome cognome telefono codice')
        .sort({ dataOrdine: -1 })
        .limit(args.limit || 50);
      
      let output = `📋 **ORDINI TROVATI: ${ordini.length}**\n\n`;
      
      ordini.forEach(ord => {
        output += `🆔 ${ord._id}\n`;
        output += `👤 Cliente: ${ord.cliente.nome} ${ord.cliente.cognome || ''} (${ord.cliente.codice})\n`;
        output += `📅 Ordine: ${formatDate(ord.dataOrdine)}\n`;
        output += `🕐 Ritiro: ${formatDate(ord.dataRitiro)} ore ${ord.oraRitiro || 'N/A'}\n`;
        output += `💶 Totale: ${formatEuro(ord.totale)}\n`;
        output += `📊 Stato: ${ord.stato}\n`;
        output += `🛒 Prodotti: ${ord.prodotti.length}\n`;
        output += `---\n`;
      });
      
      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    }

    // ===== TOOL 2: STATISTICHE GIORNALIERE =====
    if (name === 'statistiche_giornaliere') {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      const domani = new Date(oggi);
      domani.setDate(domani.getDate() + 1);
      
      const ordini = await Ordine.find({
        dataOrdine: { $gte: oggi, $lt: domani }
      });
      
      const totaleOrdini = ordini.length;
      const fatturato = ordini.reduce((sum, ord) => sum + ord.totale, 0);
      const mediaOrdine = totaleOrdini > 0 ? fatturato / totaleOrdini : 0;
      
      const perStato = ordini.reduce((acc, ord) => {
        acc[ord.stato] = (acc[ord.stato] || 0) + 1;
        return acc;
      }, {});
      
      let output = `📊 **STATISTICHE GIORNALIERE** - ${formatDate(oggi)}\n\n`;
      output += `📦 Ordini totali: ${totaleOrdini}\n`;
      output += `💰 Fatturato: ${formatEuro(fatturato)}\n`;
      output += `📈 Media ordine: ${formatEuro(mediaOrdine)}\n\n`;
      output += `**Ordini per stato:**\n`;
      
      Object.entries(perStato).forEach(([stato, count]) => {
        output += `  • ${stato}: ${count}\n`;
      });
      
      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    }

    // ===== TOOL 3: STATISTICHE PERIODO =====
    if (name === 'statistiche_periodo') {
      const ordini = await Ordine.find({
        dataOrdine: {
          $gte: new Date(args.dataInizio),
          $lte: new Date(args.dataFine)
        }
      });
      
      const totaleOrdini = ordini.length;
      const fatturato = ordini.reduce((sum, ord) => sum + ord.totale, 0);
      const mediaOrdine = totaleOrdini > 0 ? fatturato / totaleOrdini : 0;
      
      let output = `📊 **STATISTICHE PERIODO**\n`;
      output += `📅 Dal ${formatDate(args.dataInizio)} al ${formatDate(args.dataFine)}\n\n`;
      output += `📦 Ordini totali: ${totaleOrdini}\n`;
      output += `💰 Fatturato: ${formatEuro(fatturato)}\n`;
      output += `📈 Media ordine: ${formatEuro(mediaOrdine)}\n`;
      
      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    }

    // ===== TOOL 4: DETTAGLIO ORDINE =====
    if (name === 'dettaglio_ordine') {
      const ordine = await Ordine
        .findById(args.ordineId)
        .populate('cliente', 'nome cognome telefono codice email');
      
      if (!ordine) {
        return {
          content: [{
            type: 'text',
            text: '❌ Ordine non trovato'
          }]
        };
      }
      
      let output = `📋 **DETTAGLIO ORDINE #${ordine._id}**\n\n`;
      output += `👤 **CLIENTE**\n`;
      output += `  Nome: ${ordine.cliente.nome} ${ordine.cliente.cognome || ''}\n`;
      output += `  Codice: ${ordine.cliente.codice}\n`;
      output += `  Telefono: ${ordine.cliente.telefono}\n`;
      if (ordine.cliente.email) output += `  Email: ${ordine.cliente.email}\n`;
      output += `\n📅 **DATE**\n`;
      output += `  Ordine: ${formatDate(ordine.dataOrdine)}\n`;
      output += `  Ritiro: ${formatDate(ordine.dataRitiro)} ore ${ordine.oraRitiro || 'N/A'}\n`;
      output += `\n🛒 **PRODOTTI**\n`;
      
      ordine.prodotti.forEach((p, idx) => {
        output += `  ${idx + 1}. ${p.nome}`;
        if (p.variante) output += ` (${p.variante})`;
        output += ` - ${p.quantita} ${p.unita} × ${formatEuro(p.prezzo)} = ${formatEuro(p.quantita * p.prezzo)}\n`;
        if (p.note) output += `     Note: ${p.note}\n`;
      });
      
      output += `\n💶 **TOTALE: ${formatEuro(ordine.totale)}**\n`;
      output += `💳 Pagamento: ${ordine.modalitaPagamento}\n`;
      output += `📊 Stato: ${ordine.stato}\n`;
      
      if (ordine.note) output += `\n📝 Note: ${ordine.note}\n`;
      
      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    }

    // ===== TOOL 5: CERCA CLIENTE =====
    if (name === 'cerca_cliente') {
      const clienti = await Cliente.find({
        $or: [
          { nome: new RegExp(args.query, 'i') },
          { cognome: new RegExp(args.query, 'i') },
          { telefono: new RegExp(args.query, 'i') },
          { codice: new RegExp(args.query, 'i') }
        ]
      }).limit(20);
      
      if (clienti.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `❌ Nessun cliente trovato per: "${args.query}"`
          }]
        };
      }
      
      let output = `👥 **CLIENTI TROVATI: ${clienti.length}**\n\n`;
      
      clienti.forEach(c => {
        output += `🆔 ${c._id}\n`;
        output += `👤 ${c.nome} ${c.cognome || ''}\n`;
        output += `📋 Codice: ${c.codice}\n`;
        output += `📞 Tel: ${c.telefono}\n`;
        if (c.email) output += `📧 Email: ${c.email}\n`;
        output += `🌟 Livello fedeltà: ${c.fedelta.livello} (${c.fedelta.punti} punti)\n`;
        output += `📊 Ordini: ${c.statistiche.totaleOrdini} | Speso: ${formatEuro(c.statistiche.totaleSpeso)}\n`;
        output += `---\n`;
      });
      
      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    }

    // ===== TOOL 6: STORICO CLIENTE =====
    if (name === 'storico_cliente') {
      const cliente = await Cliente.findById(args.clienteId);
      if (!cliente) {
        return {
          content: [{
            type: 'text',
            text: '❌ Cliente non trovato'
          }]
        };
      }
      
      const ordini = await Ordine
        .find({ cliente: args.clienteId })
        .sort({ dataOrdine: -1 })
        .limit(50);
      
      let output = `📋 **STORICO ORDINI - ${cliente.nome} ${cliente.cognome || ''}**\n\n`;
      output += `📊 Totale ordini: ${ordini.length}\n`;
      output += `💰 Totale speso: ${formatEuro(cliente.statistiche.totaleSpeso)}\n\n`;
      
      ordini.forEach(ord => {
        output += `📅 ${formatDate(ord.dataOrdine)} | ${formatEuro(ord.totale)} | ${ord.stato}\n`;
        output += `   Ritiro: ${formatDate(ord.dataRitiro)} ${ord.oraRitiro || ''}\n`;
        output += `   Prodotti: ${ord.prodotti.map(p => p.nome).join(', ')}\n`;
        output += `---\n`;
      });
      
      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    }

    // ===== TOOL 7: PRODOTTI DISPONIBILI =====
    if (name === 'prodotti_disponibili') {
      const query = {};
      if (args.categoria) query.categoria = args.categoria;
      if (args.disponibili !== undefined) query.disponibile = args.disponibili;
      
      const prodotti = await Prodotto.find(query).sort({ categoria: 1, nome: 1 });
      
      let output = `🛒 **PRODOTTI** (${prodotti.length})\n\n`;
      
      let categoriaCorrente = '';
      prodotti.forEach(p => {
        if (p.categoria !== categoriaCorrente) {
          categoriaCorrente = p.categoria;
          output += `\n📦 **${categoriaCorrente.toUpperCase()}**\n`;
        }
        
        output += `  • ${p.nome} - ${formatEuro(p.prezzo)}/${p.unita}`;
        if (!p.disponibile) output += ` [NON DISPONIBILE]`;
        if (p.giacenza !== undefined) output += ` | Giacenza: ${p.giacenza}`;
        output += `\n`;
        
        if (p.varianti && p.varianti.length > 0) {
          output += `    Varianti: ${p.varianti.map(v => v.nome).join(', ')}\n`;
        }
      });
      
      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    }

    // ===== TOOL 8: SCORTE MAGAZZINO =====
    if (name === 'scorte_magazzino') {
      const prodottiSottoScorta = await Prodotto.find({
        $expr: { $lt: ['$giacenza', '$minimoScorta'] },
        disponibile: true
      }).sort({ categoria: 1 });
      
      if (prodottiSottoScorta.length === 0) {
        return {
          content: [{
            type: 'text',
            text: '✅ Nessun prodotto sotto scorta minima'
          }]
        };
      }
      
      let output = `⚠️ **ALERT SCORTE** - ${prodottiSottoScorta.length} prodotti sotto minimo\n\n`;
      
      prodottiSottoScorta.forEach(p => {
        output += `❗ ${p.nome}\n`;
        output += `   Giacenza: ${p.giacenza} ${p.unita}\n`;
        output += `   Minimo: ${p.minimoScorta} ${p.unita}\n`;
        output += `   Categoria: ${p.categoria}\n`;
        output += `---\n`;
      });
      
      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    }

    // ===== TOOL 9: TOP CLIENTI =====
    if (name === 'top_clienti') {
      const limit = args.limit || 10;
      const sortBy = args.criterio === 'ordini' ? 'statistiche.totaleOrdini' : 'statistiche.totaleSpeso';
      
      const clienti = await Cliente
        .find({})
        .sort({ [sortBy]: -1 })
        .limit(limit);
      
      let output = `🏆 **TOP ${limit} CLIENTI** - Per ${args.criterio || 'fatturato'}\n\n`;
      
      clienti.forEach((c, idx) => {
        output += `${idx + 1}. ${c.nome} ${c.cognome || ''}\n`;
        output += `   📞 ${c.telefono}\n`;
        output += `   💰 ${formatEuro(c.statistiche.totaleSpeso)}\n`;
        output += `   📦 ${c.statistiche.totaleOrdini} ordini\n`;
        output += `   🌟 ${c.fedelta.livello} (${c.fedelta.punti} punti)\n`;
        output += `---\n`;
      });
      
      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    }

    // ===== TOOL 10: TOP PRODOTTI =====
    if (name === 'top_prodotti') {
      let dataInizio = new Date(0); // Default: dall'inizio
      
      if (args.periodo === 'oggi') {
        dataInizio = new Date();
        dataInizio.setHours(0, 0, 0, 0);
      } else if (args.periodo === 'settimana') {
        dataInizio = new Date();
        dataInizio.setDate(dataInizio.getDate() - 7);
      } else if (args.periodo === 'mese') {
        dataInizio = new Date();
        dataInizio.setMonth(dataInizio.getMonth() - 1);
      } else if (args.periodo === 'anno') {
        dataInizio = new Date();
        dataInizio.setFullYear(dataInizio.getFullYear() - 1);
      }
      
      const topProdotti = await Ordine.aggregate([
        { $match: { dataOrdine: { $gte: dataInizio } } },
        { $unwind: '$prodotti' },
        {
          $group: {
            _id: '$prodotti.nome',
            quantitaTotale: { $sum: '$prodotti.quantita' },
            fatturatoTotale: { $sum: { $multiply: ['$prodotti.quantita', '$prodotti.prezzo'] } },
            numeroOrdini: { $sum: 1 }
          }
        },
        { $sort: { fatturatoTotale: -1 } },
        { $limit: args.limit || 10 }
      ]);
      
      let output = `🏆 **TOP PRODOTTI** - ${args.periodo || 'sempre'}\n\n`;
      
      topProdotti.forEach((p, idx) => {
        output += `${idx + 1}. ${p._id}\n`;
        output += `   💰 Fatturato: ${formatEuro(p.fatturatoTotale)}\n`;
        output += `   📦 Quantità: ${p.quantitaTotale.toFixed(2)}\n`;
        output += `   🛒 In ${p.numeroOrdini} ordini\n`;
        output += `---\n`;
      });
      
      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    }

    // Tool non riconosciuto
    return {
      content: [{
        type: 'text',
        text: `❌ Tool sconosciuto: ${name}`
      }]
    };

  } catch (error) {
    console.error('Errore esecuzione tool:', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Errore: ${error.message}`
      }]
    };
  }
});

// Avvio server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ MCP Server Pastificio avviato');
}

main().catch(console.error);
