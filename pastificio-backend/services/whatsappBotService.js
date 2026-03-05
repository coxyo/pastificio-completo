// services/whatsappBotService.js
// FAQ Bot WhatsApp - Pastificio Nonna Claudia
// Usa Claude API solo per classificare l'intent, risposte sono template statici

import Anthropic from '@anthropic-ai/sdk';
import logger from '../config/logger.js';

// ═══════════════════════════════════════════════════════════════════════════
// CATALOGO PRODOTTI (sincronizzato con prodottiConfig.js)
// ═══════════════════════════════════════════════════════════════════════════
const CATALOGO = {
  ravioli: {
    nome: 'Ravioli',
    prezzoKg: 11.00,
    pezziPerKg: 30,
    varianti: [
      { nome: 'ricotta', prezzoKg: 11.00 },
      { nome: 'ricotta e spinaci', prezzoKg: 11.00 },
      { nome: 'ricotta e zafferano', prezzoKg: 11.00 },
      { nome: 'formaggio', prezzoKg: 16.00, pezziPerKg: 30 },
      { nome: 'piccoli (ricotta)', prezzoKg: 11.00, pezziPerKg: 40 },
    ],
    ingredienti: 'semola, farina, uova, ricotta, sale',
    allergeni: ['GLUTINE', 'UOVA', 'LATTE'],
    scadenza: '3 giorni',
  },
  culurgiones: {
    nome: 'Culurgiones',
    prezzoKg: 16.00,
    pezziPerKg: 32,
    ingredienti: 'semola, farina, uova, patate, cipolla, menta, aglio, olio, sale',
    allergeni: ['GLUTINE', 'UOVA'],
    scadenza: '3 giorni',
  },
  pardulas: {
    nome: 'Pardulas',
    prezzoKg: 20.00,
    prezzoPezzo: 0.76,
    pezziPerKg: 25,
    varianti: ['base', 'con glassa', 'con zucchero a velo'],
    ingredienti: 'ricotta, zucchero, uova, farina, strutto, lievito, scorza di limone, zafferano',
    allergeni: ['GLUTINE', 'UOVA', 'LATTE'],
    scadenza: '7 giorni',
  },
  ciambelle: {
    nome: 'Ciambelle',
    prezzoKg: 17.00,
    pezziPerKg: 30,
    varianti: ['semplici', 'con marmellata albicocca', 'con marmellata ciliegia', 'con nutella', 'con zucchero a velo', 'miste marmellata-nutella', 'miste marmellata-zucchero a velo'],
    ingredienti: 'farina, strutto, zucchero, uova, lievito, scorza di limone + farcitura',
    allergeni: ['GLUTINE', 'UOVA', 'FRUTTA A GUSCIO (versione nutella)'],
    scadenza: '7 giorni',
  },
  chiacchere: {
    nome: 'Chiacchiere',
    prezzoKg: 17.00,
    pezziPerKg: 67,
    pesoPezzo: '15g',
    varianti: ['con zucchero a velo', 'con zucchero granulato', 'con cioccolato'],
    allergeni: ['GLUTINE', 'UOVA'],
    scadenza: '7 giorni',
  },
  sebadas: {
    nome: 'Sebadas',
    prezzoPezzo: 2.00,
    varianti: [
      { nome: 'classica', prezzoPezzo: 2.00 },
      { nome: 'al mirto', prezzoPezzo: 2.50 },
    ],
    ingredienti: 'semola, farina, strutto, formaggio fresco, limone, miele',
    allergeni: ['GLUTINE', 'LATTE'],
    scadenza: '7 giorni',
  },
  amaretti: {
    nome: 'Amaretti',
    prezzoKg: 22.00,
    pezziPerKg: 35,
    ingredienti: 'mandorle, zucchero, albume d\'uovo, miele',
    allergeni: ['FRUTTA A GUSCIO', 'UOVA'],
    scadenza: '7 giorni',
  },
  bianchini: {
    nome: 'Bianchini',
    prezzoKg: 15.00,
    pezziPerKg: 100,
    ingredienti: 'albume d\'uovo, zucchero, mandorle',
    allergeni: ['UOVA', 'FRUTTA A GUSCIO'],
    scadenza: '7 giorni',
  },
  papassinas: {
    nome: 'Papassinas',
    prezzoKg: 22.00,
    pezziPerKg: 30,
    ingredienti: 'farina, mandorle, noci, uva passa, miele, uova, scorza d\'arancia',
    allergeni: ['GLUTINE', 'UOVA', 'FRUTTA A GUSCIO'],
    scadenza: '7 giorni',
  },
  gueffus: {
    nome: 'Gueffus',
    prezzoKg: 22.00,
    pezziPerKg: 65,
    ingredienti: 'mandorle, zucchero, acqua di fiori d\'arancio, glassa',
    allergeni: ['FRUTTA A GUSCIO'],
    scadenza: '7 giorni',
  },
  zeppole: {
    nome: 'Zeppole',
    prezzoKg: 21.00,
    pezziPerKg: 24,
    allergeni: ['GLUTINE', 'UOVA'],
    scadenza: '7 giorni',
  },
  torta_di_saba: {
    nome: 'Torta di saba',
    prezzoKg: 26.00,
    prezzoPezzo: 15.00,
    scadenza: '7 giorni',
  },
  panada_agnello: {
    nome: 'Panada di Agnello',
    prezzoKg: 25.00,
    ingredienti: 'semola, farina, strutto, agnello, pomodori secchi, aglio, pepe, prezzemolo',
    allergeni: ['GLUTINE'],
    opzioni: 'disponibile con/senza aglio, con/senza pepe, con/senza pomodori secchi, con contorno (patate/piselli)',
    scadenza: '3 giorni',
  },
  panada_maiale: {
    nome: 'Panada di Maiale',
    prezzoKg: 30.00,
    allergeni: ['GLUTINE'],
    opzioni: 'disponibile con/senza aglio, con/senza pepe, con/senza pomodori secchi, con contorno (patate/piselli)',
    scadenza: '3 giorni',
  },
  panada_anguille: {
    nome: 'Panada di Anguille',
    prezzoKg: 30.00,
    allergeni: ['GLUTINE', 'PESCE'],
    opzioni: 'disponibile con/senza aglio, con/senza pepe, con/senza pomodori secchi, con contorno (patate/piselli)',
    scadenza: '3 giorni',
  },
  panada_verdure: {
    nome: 'Panada di Verdure',
    prezzoKg: 28.00,
    ingredienti: 'semola, farina, strutto, carciofi, fave, piselli, aglio, prezzemolo',
    allergeni: ['GLUTINE'],
    scadenza: '3 giorni',
  },
  panadine: {
    nome: 'Panadine',
    prezzoPezzo: 1.00,
    varianti: ['di carne', 'di verdura', 'miste (a scelta del pastificio)'],
    scadenza: '3 giorni',
  },
  lasagne: {
    nome: 'Lasagne',
    ingredienti: 'semola, farina, uova, sale',
    allergeni: ['GLUTINE', 'UOVA'],
    scadenza: '3 giorni',
  },
  dolci_misti: {
    nome: 'Vassoio dolci misti',
    prezzoKg: 19.00,
    note: 'composizione personalizzabile con pardulas, ciambelle, amaretti e altri dolci',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ORARI DI APERTURA
// ═══════════════════════════════════════════════════════════════════════════
const ORARI = {
  lunedi:    { mattina: { apertura: '08:00', chiusura: '13:00' }, pomeriggio: { apertura: '16:30', chiusura: '19:30' } },
  martedi:   { mattina: { apertura: '08:00', chiusura: '13:00' }, pomeriggio: { apertura: '16:30', chiusura: '19:30' } },
  mercoledi: { mattina: { apertura: '08:00', chiusura: '13:00' }, pomeriggio: { apertura: '16:30', chiusura: '19:30' } },
  giovedi:   { mattina: { apertura: '08:00', chiusura: '13:00' }, pomeriggio: { apertura: '16:30', chiusura: '19:30' } },
  venerdi:   { mattina: { apertura: '08:00', chiusura: '13:00' }, pomeriggio: { apertura: '16:30', chiusura: '19:30' } },
  sabato:    { mattina: { apertura: '08:00', chiusura: '13:00' }, pomeriggio: null },
  domenica:  null,
};

// Fuso orario Europa/Roma
const TIMEZONE = 'Europe/Rome';

/**
 * Verifica se siamo in orario di apertura.
 * @returns {{ aperto: boolean, giorno: string, messaggio: string }}
 */
export function verificaOrario() {
  const ora = new Date();
  const formatter = new Intl.DateTimeFormat('it-IT', {
    timeZone: TIMEZONE,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(ora);
  const giornoNome = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
  const oreStr = parts.find(p => p.type === 'hour')?.value || '0';
  const minutiStr = parts.find(p => p.type === 'minute')?.value || '0';
  const oreCorrente = parseInt(oreStr, 10);
  const minutiCorrenti = parseInt(minutiStr, 10);
  const minutiTotali = oreCorrente * 60 + minutiCorrenti;

  const giornoMap = {
    lunedì: 'lunedi', martedì: 'martedi', mercoledì: 'mercoledi',
    giovedì: 'giovedi', venerdì: 'venerdi', sabato: 'sabato', domenica: 'domenica',
  };
  const giornoKey = giornoMap[giornoNome] || giornoNome;
  const turni = ORARI[giornoKey];

  if (!turni) {
    return { aperto: false, giorno: giornoNome, messaggio: 'domenica' };
  }

  const inFascia = (fascia) => {
    if (!fascia) return false;
    const [hA, mA] = fascia.apertura.split(':').map(Number);
    const [hC, mC] = fascia.chiusura.split(':').map(Number);
    const minAp = hA * 60 + mA;
    const minCh = hC * 60 + mC;
    return minutiTotali >= minAp && minutiTotali < minCh;
  };

  const apertoMattina = inFascia(turni.mattina);
  const apertoPomeriggio = inFascia(turni.pomeriggio);

  if (apertoMattina || apertoPomeriggio) {
    return { aperto: true, giorno: giornoNome, messaggio: 'aperto' };
  }

  return { aperto: false, giorno: giornoNome, messaggio: 'fuori_orario' };
}

/**
 * Formatta il testo orari per la risposta al cliente.
 */
function testoOrari() {
  return (
    `🕐 *I nostri orari:*\n` +
    `📅 *Lunedì - Venerdì:*\n` +
    `   ☀️ Mattina: 08:00 - 13:00\n` +
    `   🌤️ Pomeriggio: 16:30 - 19:30\n\n` +
    `📅 *Sabato:*\n` +
    `   ☀️ Solo mattina: 08:00 - 13:00\n\n` +
    `📅 *Domenica:* chiusi 🔒\n\n` +
    `📍 Via Carmine 20/B, Assemini (CA)\n` +
    `📞 389 887 9833`
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICAZIONE INTENT CON CLAUDE API
// ═══════════════════════════════════════════════════════════════════════════

let anthropicClient = null;

function getAnthropicClient() {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

/**
 * Classifica l'intent di un messaggio WhatsApp.
 * @param {string} testo
 * @returns {Promise<{ tipo: string, prodotto: string|null, confidenza: number }>}
 *
 * Tipi possibili:
 *   prezzi | grammature | orari | prodotti_disponibili | ingredienti_allergeni |
 *   ordine | saluto | non_riconosciuto
 */
export async function classificaIntent(testo) {
  if (!testo || testo.trim().length === 0) {
    return { tipo: 'non_riconosciuto', prodotto: null, confidenza: 1.0 };
  }

  // ── Classificazione regex veloce (evita chiamata API per casi ovvi) ──
  const t = testo.toLowerCase().trim();

  // Saluti senza richiesta
  if (/^(ciao|salve|buongiorno|buonasera|buon giorno|buona sera|hey|hei|salve)\s*[!.?]*$/.test(t)) {
    return { tipo: 'saluto', prodotto: null, confidenza: 1.0 };
  }

  // Orari
  if (/\b(or[ae]ri?|aper[to|ta]|chiud[ete|e]|quando\s+siete|quando\s+aprite|domenica\s+fate|sabato)\b/.test(t)) {
    return { tipo: 'orari', prodotto: null, confidenza: 0.95 };
  }

  // Ordine
  if (/\b(ordin[are|o]|vorrei\s+ordinare|prenotar[e|o]|prenotazion[e]|posso\s+ordinare|voglio\s+ordinare)\b/.test(t)) {
    return { tipo: 'ordine', prodotto: null, confidenza: 0.95 };
  }

  // ── Per tutto il resto usa Claude ──
  const client = getAnthropicClient();
  if (!client) {
    logger.warn('ANTHROPIC_API_KEY non configurata, uso classificazione fallback');
    return classificaIntentFallback(t);
  }

  try {
    const prodottiLista = Object.values(CATALOGO).map(p => p.nome).join(', ');

    const systemPrompt = `Sei un classificatore di messaggi WhatsApp per il Pastificio Nonna Claudia di Assemini (Sardegna).
Devi classificare il messaggio del cliente in UNA delle seguenti categorie:

- prezzi: domande su quanto costano i prodotti (es. "quanto costano i ravioli?", "prezzi pardulas")
- grammature: domande su quanti pezzi per kg, quanto pesa un pezzo, grammature (es. "quante pardulas fanno 1kg?", "quanti pezzi per kg?")
- orari: domande su orari di apertura, giorni di apertura, se sono aperti (es. "siete aperti sabato?", "a che ora chiudete?")
- prodotti_disponibili: domande su cosa fanno, quali prodotti hanno, se hanno un prodotto specifico (es. "cosa fate?", "avete le sebadas?", "che dolci avete?")
- ingredienti_allergeni: domande su ingredienti o allergeni (es. "ci sono uova?", "è senza glutine?", "ingredienti ciambelle")
- ordine: vuole fare un ordine o prenotare (es. "vorrei ordinare", "posso prenotare", "mi può fare 1kg di ravioli per venerdì?")
- saluto: solo un saluto senza domanda specifica
- non_riconosciuto: non rientra in nessuna categoria sopra

I prodotti del pastificio sono: ${prodottiLista}

Rispondi SOLO con un oggetto JSON valido, nessun altro testo:
{"tipo": "categoria", "prodotto": "nome_prodotto_o_null", "confidenza": 0.0-1.0}

Il campo "prodotto" deve contenere il nome del prodotto menzionato (es. "ravioli", "pardulas") oppure null.
La confidenza è un numero da 0 a 1.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: systemPrompt,
      messages: [{ role: 'user', content: testo }],
    });

    const raw = response.content[0]?.text?.trim() || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    // Validazione
    const tipiValidi = ['prezzi', 'grammature', 'orari', 'prodotti_disponibili', 'ingredienti_allergeni', 'ordine', 'saluto', 'non_riconosciuto'];
    if (!tipiValidi.includes(result.tipo)) {
      result.tipo = 'non_riconosciuto';
    }

    logger.info(`🤖 Intent classificato: ${result.tipo} (prodotto: ${result.prodotto}, confidenza: ${result.confidenza})`, { testo });
    return result;

  } catch (err) {
    logger.error('Errore classificazione intent Claude:', err);
    return classificaIntentFallback(t);
  }
}

/**
 * Classificazione fallback senza API (regex estesa).
 */
function classificaIntentFallback(t) {
  if (/\b(costo|cost[a|ano]|prez[zo|zi]|quant[o|i]\s+cost[a|ano]|quanto\s+vien[e])\b/.test(t)) {
    const prodotto = estraiProdottoDaTesto(t);
    return { tipo: 'prezzi', prodotto, confidenza: 0.7 };
  }
  if (/\b(pezz[i|o]\s+per\s+kg|quant[i|e]\s+(son[o]|fann[o]|pezz)|gramm[i|i]|gram|pesa|peso)\b/.test(t)) {
    const prodotto = estraiProdottoDaTesto(t);
    return { tipo: 'grammature', prodotto, confidenza: 0.7 };
  }
  if (/\b(avete|fate|produc[ete|e]|cosa\s+(fate|avete|vendete)|prodott[i|o]|catalogo|listino)\b/.test(t)) {
    const prodotto = estraiProdottoDaTesto(t);
    return { tipo: 'prodotti_disponibili', prodotto, confidenza: 0.6 };
  }
  if (/\b(ingredienti?|allergen[i|e]|contiene|glutine|lattosio|uova|senza|intolleranza)\b/.test(t)) {
    const prodotto = estraiProdottoDaTesto(t);
    return { tipo: 'ingredienti_allergeni', prodotto, confidenza: 0.7 };
  }
  return { tipo: 'non_riconosciuto', prodotto: null, confidenza: 0.5 };
}

/**
 * Estrae il nome di un prodotto dal testo (per il fallback).
 */
function estraiProdottoDaTesto(t) {
  const nomi = [
    'ravioli', 'culurgiones', 'pardulas', 'ciambelle', 'chiacchiere', 'chiacchere',
    'sebadas', 'amaretti', 'bianchini', 'papassinas', 'pabassine', 'gueffus',
    'zeppole', 'torta di saba', 'panada', 'panadine', 'lasagne', 'dolci misti',
  ];
  for (const nome of nomi) {
    if (t.includes(nome)) return nome;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERATORI DI RISPOSTA (template statici)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genera risposta per domande sui prezzi.
 */
function rispostaPrezzi(prodottoNome) {
  const suffisso = _suffissoOrario();

  // Se chiede di un prodotto specifico
  if (prodottoNome) {
    const key = _trovaCatalogo(prodottoNome);
    if (key) {
      const p = CATALOGO[key];
      let righe = [`💰 *Prezzi ${p.nome}:*\n`];

      if (p.prezzoKg) righe.push(`• Al kg: *€${p.prezzoKg.toFixed(2)}/kg*`);
      if (p.prezzoPezzo) righe.push(`• Al pezzo: *€${p.prezzoPezzo.toFixed(2)}/pz*`);

      if (p.varianti && Array.isArray(p.varianti)) {
        if (typeof p.varianti[0] === 'object') {
          const conPrezzi = p.varianti.filter(v => v.prezzoKg || v.prezzoPezzo);
          if (conPrezzi.length > 0) {
            righe.push(`\nVarianti:`);
            conPrezzi.forEach(v => {
              const pr = v.prezzoKg ? `€${v.prezzoKg.toFixed(2)}/kg` : `€${v.prezzoPezzo.toFixed(2)}/pz`;
              righe.push(`  • ${v.nome}: ${pr}`);
            });
          }
        }
      }

      righe.push(`\nPer ordinare scrivi qui o chiamaci al 📞 389 887 9833`);
      if (suffisso) righe.push(`\n${suffisso}`);
      return righe.join('\n');
    }
  }

  // Listino generale
  const listino = [
    `💰 *I nostri prezzi:*\n`,
    `🍝 *Pasta fresca:*`,
    `  • Ravioli ricotta: €11.00/kg (30 pz/kg)`,
    `  • Ravioli formaggio: €16.00/kg`,
    `  • Culurgiones: €16.00/kg (32 pz/kg)`,
    `  • Lasagne: su richiesta\n`,
    `🍮 *Dolci sardi:*`,
    `  • Pardulas: €20.00/kg (25 pz/kg = ~€0.76/pz)`,
    `  • Ciambelle: €17.00/kg (30 pz/kg)`,
    `  • Chiacchiere: €17.00/kg (67 pz/kg)`,
    `  • Sebadas: €2.00/pz (mirto €2.50/pz)`,
    `  • Amaretti: €22.00/kg (35 pz/kg)`,
    `  • Gueffus: €22.00/kg (65 pz/kg)`,
    `  • Bianchini: €15.00/kg (100 pz/kg)`,
    `  • Papassinas: €22.00/kg`,
    `  • Zeppole: €21.00/kg (24 pz/kg)`,
    `  • Torta di saba: €26.00/kg`,
    `  • Dolci misti: €19.00/kg\n`,
    `🥧 *Panadas:*`,
    `  • Agnello: €25.00/kg`,
    `  • Maiale / Anguille / Vitella: €30.00/kg`,
    `  • Verdure: €28.00/kg`,
    `  • Panadine: €1.00/pz\n`,
    `📞 Per ordinare: 389 887 9833`,
  ];

  if (suffisso) listino.push(`\n${suffisso}`);
  return listino.join('\n');
}

/**
 * Genera risposta per domande sulle grammature / pezzi per kg.
 */
function rispostaGrammature(prodottoNome) {
  const suffisso = _suffissoOrario();

  if (prodottoNome) {
    const key = _trovaCatalogo(prodottoNome);
    if (key) {
      const p = CATALOGO[key];
      let righe = [`⚖️ *Grammature ${p.nome}:*\n`];

      if (p.pezziPerKg) {
        const grammiPezzo = Math.round(1000 / p.pezziPerKg);
        righe.push(`• Circa *${p.pezziPerKg} pezzi per kg*`);
        righe.push(`• Circa *${grammiPezzo}g a pezzo*`);
      } else if (p.pesoPezzo) {
        righe.push(`• Peso a pezzo: *${p.pesoPezzo}*`);
      } else if (p.prezzoPezzo && !p.pezziPerKg) {
        righe.push(`• Vendute al pezzo (€${p.prezzoPezzo.toFixed(2)}/pz)`);
        righe.push(`• Il peso varia leggermente a seconda della produzione`);
      }

      if (p.varianti && Array.isArray(p.varianti) && typeof p.varianti[0] === 'object') {
        const conPezzi = p.varianti.filter(v => v.pezziPerKg && v.pezziPerKg !== p.pezziPerKg);
        if (conPezzi.length > 0) {
          righe.push(`\nEccezioni:`);
          conPezzi.forEach(v => {
            const g = Math.round(1000 / v.pezziPerKg);
            righe.push(`  • ${v.nome}: ${v.pezziPerKg} pz/kg (~${g}g)`);
          });
        }
      }

      if (suffisso) righe.push(`\n${suffisso}`);
      return righe.join('\n');
    }
  }

  // Grammature generali
  const righe = [
    `⚖️ *Pezzi per kg (indicativi):*\n`,
    `🍝 Ravioli: ~30 pz/kg (~33g cad)`,
    `🍝 Ravioli piccoli: ~40 pz/kg (~25g cad)`,
    `🍝 Culurgiones: ~32 pz/kg (~31g cad)\n`,
    `🍮 Pardulas: ~25 pz/kg (~40g cad)`,
    `🍮 Ciambelle: ~30 pz/kg (~33g cad)`,
    `🍮 Chiacchiere: ~67 pz/kg (~15g cad)`,
    `🍮 Amaretti: ~35 pz/kg (~29g cad)`,
    `🍮 Bianchini: ~100 pz/kg (~10g cad)`,
    `🍮 Gueffus: ~65 pz/kg (~15g cad)`,
    `🍮 Papassinas: ~30 pz/kg (~33g cad)`,
    `🍮 Zeppole: ~24 pz/kg (~42g cad)\n`,
    `🥧 Sebadas: vendute al pezzo (~€2.00/pz)`,
    `🥧 Panadine: vendute al pezzo (€1.00/pz)\n`,
    `_Le grammature sono indicative, i prodotti sono artigianali_`,
  ];

  if (suffisso) righe.push(`\n${suffisso}`);
  return righe.join('\n');
}

/**
 * Genera risposta per domande sugli orari.
 */
function rispostaOrari() {
  const { aperto, giorno, messaggio } = verificaOrario();

  let stato = '';
  if (messaggio === 'domenica') {
    stato = `ℹ️ Oggi è domenica, siamo chiusi. Vi aspettiamo da lunedì!\n\n`;
  } else if (messaggio === 'fuori_orario') {
    stato = `ℹ️ In questo momento siamo chiusi. Ecco quando ci trovate:\n\n`;
  } else {
    stato = `✅ Siamo *aperti* in questo momento!\n\n`;
  }

  return stato + testoOrari();
}

/**
 * Genera risposta per domande sui prodotti disponibili.
 */
function rispostaProdottiDisponibili(prodottoNome) {
  const suffisso = _suffissoOrario();

  // Se chiede di un prodotto specifico
  if (prodottoNome) {
    const key = _trovaCatalogo(prodottoNome);
    if (key) {
      const p = CATALOGO[key];
      return `✅ Sì, facciamo le *${p.nome}*! 😊\n\nPer prezzi e per ordinare scrivi qui o chiama il 📞 389 887 9833${suffisso ? '\n\n' + suffisso : ''}`;
    } else {
      return `Mmh, non sono sicura di quel prodotto! 🤔\n\nPer informazioni specifiche chiama direttamente Maurizio al 📞 389 887 9833, ti risponde lui! 😊${suffisso ? '\n\n' + suffisso : ''}`;
    }
  }

  const righe = [
    `🍝🍮 *Cosa facciamo al Pastificio Nonna Claudia:*\n`,
    `*Pasta fresca sarda:*`,
    `• Ravioli (ricotta, spinaci, zafferano, formaggio)`,
    `• Culurgiones`,
    `• Lasagne\n`,
    `*Dolci sardi tipici:*`,
    `• Pardulas · Ciambelle · Chiacchiere`,
    `• Sebadas · Amaretti · Bianchini`,
    `• Gueffus · Papassinas · Zeppole`,
    `• Torta di saba · Vassoi dolci misti\n`,
    `*Panadas artigianali:*`,
    `• Agnello · Maiale · Anguille · Vitella · Verdure`,
    `• Panadine (€1.00/pz)\n`,
    `Tutto rigorosamente *artigianale e fatto da noi* ogni giorno! 💪\n`,
    `Per ordinare o sapere cosa c'è disponibile oggi: 📞 389 887 9833`,
  ];

  if (suffisso) righe.push(`\n${suffisso}`);
  return righe.join('\n');
}

/**
 * Genera risposta per domande su ingredienti e allergeni.
 */
function rispostaIngredientiAllergeni(prodottoNome) {
  const suffisso = _suffissoOrario();

  if (prodottoNome) {
    const key = _trovaCatalogo(prodottoNome);
    if (key) {
      const p = CATALOGO[key];
      let righe = [`🔍 *Ingredienti ${p.nome}:*\n`];

      if (p.ingredienti) {
        righe.push(`📋 ${p.ingredienti}\n`);
      }

      if (p.allergeni && p.allergeni.length > 0) {
        righe.push(`⚠️ *Allergeni: ${p.allergeni.join(', ')}*`);
      } else if (p.allergeni && p.allergeni.length === 0) {
        righe.push(`✅ Nessun allergene principale rilevato`);
      }

      if (p.scadenza) {
        righe.push(`\n📅 Scadenza: ${p.scadenza} dalla produzione`);
      }

      if (p.opzioni) {
        righe.push(`\n🔧 Note: ${p.opzioni}`);
      }

      righe.push(`\n_Per allergie gravi ti consigliamo di chiamarci direttamente: 📞 389 887 9833_`);
      if (suffisso) righe.push(`\n${suffisso}`);
      return righe.join('\n');
    }
  }

  // Risposta generica allergeni
  const righe = [
    `⚠️ *Allergeni principali nei nostri prodotti:*\n`,
    `• *GLUTINE* → ravioli, culurgiones, pardulas, ciambelle, panadas, lasagne, panadine`,
    `• *UOVA* → ravioli, culurgiones, pardulas, ciambelle, chiacchiere, lasagne, amaretti, bianchini, papassinas`,
    `• *LATTE* → ravioli, pardulas, sebadas`,
    `• *FRUTTA A GUSCIO* → amaretti, bianchini, papassinas, gueffus (mandorle/noci)`,
    `• *PESCE* → panada di anguille\n`,
    `✅ *Prodotti senza glutine:* amaretti, bianchini, gueffus, sebadas\n`,
    `_Per allergie gravi o intolleranze specifiche ti consigliamo sempre di chiamarci: 📞 389 887 9833_`,
    `_I nostri prodotti sono artigianali e potrebbero esserci tracce trasversali._`,
  ];

  if (suffisso) righe.push(`\n${suffisso}`);
  return righe.join('\n');
}

/**
 * Genera risposta per richiesta di ordine (escalation all'umano).
 */
function rispostaOrdine(nomeCliente) {
  const saluto = nomeCliente ? `Ciao ${nomeCliente}! 😊` : `Ciao! 😊`;
  const { aperto } = verificaOrario();

  if (aperto) {
    return (
      `${saluto}\n\n` +
      `Grazie per voler ordinare! 🍝\n\n` +
      `Ti rispondo a breve per confermare disponibilità e orario di ritiro.\n\n` +
      `📞 Se hai fretta puoi anche chiamarci direttamente: *389 887 9833*\n\n` +
      `_A prestissimo!_ 😊`
    );
  } else {
    return (
      `${saluto}\n\n` +
      `Grazie per voler ordinare! 🍝\n\n` +
      `In questo momento siamo chiusi, ma ti risponderemo appena riapriamo.\n\n` +
      `${testoOrari()}\n\n` +
      `_Il tuo messaggio è stato registrato, ti ricontattiamo presto!_ 😊`
    );
  }
}

/**
 * Genera risposta di benvenuto per saluto senza domanda.
 */
function rispostaSaluto(nomeCliente) {
  const saluto = nomeCliente ? `Ciao ${nomeCliente}! 😊` : `Ciao! 😊`;
  const { aperto } = verificaOrario();

  const stato = aperto
    ? `✅ Siamo aperti in questo momento!`
    : `ℹ️ In questo momento siamo chiusi.`;

  return (
    `${saluto}\n\n` +
    `Benvenuto al *Pastificio Nonna Claudia* di Assemini! 🍝\n\n` +
    `${stato}\n\n` +
    `Posso aiutarti con:\n` +
    `• 💰 *Prezzi* dei nostri prodotti\n` +
    `• ⚖️ *Grammature* e pezzi per kg\n` +
    `• 🕐 *Orari* di apertura\n` +
    `• 🛒 *Prodotti disponibili*\n` +
    `• 🔍 *Ingredienti e allergeni*\n\n` +
    `Per gli *ordini* ti metto subito in contatto con noi! 📞\n\n` +
    `Scrivi pure la tua domanda 😊`
  );
}

/**
 * Genera risposta per messaggi non riconosciuti (escalation).
 */
function rispostaNonRiconosciuta(nomeCliente) {
  const saluto = nomeCliente ? `Ciao ${nomeCliente}! 😊` : `Ciao! 😊`;

  return (
    `${saluto}\n\n` +
    `Ti rispondo a breve! 😊\n\n` +
    `Se hai fretta puoi chiamarci direttamente: 📞 *389 887 9833*\n\n` +
    `${testoOrari()}`
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Processa un messaggio WhatsApp e restituisce la risposta da inviare.
 *
 * @param {string} testo - Testo del messaggio ricevuto
 * @param {Object} opts
 * @param {string|null} opts.nomeCliente - Nome del cliente se trovato nel DB
 * @param {boolean} [opts.botEnabled=true] - Kill switch dal .env
 * @returns {Promise<{
 *   risposta: string,
 *   intent: Object,
 *   escalation: boolean,
 *   motivo: string|null
 * }>}
 */
export async function processaMessaggio(testo, opts = {}) {
  const { nomeCliente = null, botEnabled = true } = opts;

  if (!botEnabled || process.env.BOT_ENABLED === 'false') {
    return {
      risposta: null,
      intent: { tipo: 'disabilitato', prodotto: null, confidenza: 1.0 },
      escalation: true,
      motivo: 'bot_disabilitato',
    };
  }

  let intent;
  try {
    intent = await classificaIntent(testo);
  } catch (err) {
    logger.error('Errore classificazione, uso fallback:', err);
    intent = { tipo: 'non_riconosciuto', prodotto: null, confidenza: 0 };
  }

  let risposta = null;
  let escalation = false;
  let motivo = null;

  switch (intent.tipo) {
    case 'saluto':
      risposta = rispostaSaluto(nomeCliente);
      break;

    case 'prezzi':
      risposta = rispostaPrezzi(intent.prodotto);
      break;

    case 'grammature':
      risposta = rispostaGrammature(intent.prodotto);
      break;

    case 'orari':
      risposta = rispostaOrari();
      break;

    case 'prodotti_disponibili':
      risposta = rispostaProdottiDisponibili(intent.prodotto);
      break;

    case 'ingredienti_allergeni':
      risposta = rispostaIngredientiAllergeni(intent.prodotto);
      break;

    case 'ordine':
      risposta = rispostaOrdine(nomeCliente);
      escalation = true;
      motivo = 'richiesta_ordine';
      break;

    case 'non_riconosciuto':
    default:
      risposta = rispostaNonRiconosciuta(nomeCliente);
      escalation = true;
      motivo = 'messaggio_non_riconosciuto';
      break;
  }

  return { risposta, intent, escalation, motivo };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTO NOTIFICA OPERATORI
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genera il testo della notifica WhatsApp agli operatori.
 * @param {string} numeroMittente
 * @param {string} testoOriginale
 * @param {string|null} nomeCliente
 * @param {string} motivo
 */
export function testoNotificaOperatori(numeroMittente, testoOriginale, nomeCliente, motivo) {
  const motivoLeggibile = {
    richiesta_ordine: 'vuole fare un ordine',
    messaggio_non_riconosciuto: 'ha scritto qualcosa che non ho capito',
    bot_disabilitato: 'bot disabilitato',
  }[motivo] || motivo;

  const cliente = nomeCliente ? `👤 Cliente: *${nomeCliente}*` : `👤 Numero: *${numeroMittente}*`;

  return (
    `🔔 *MESSAGGIO WHATSAPP DA GESTIRE*\n\n` +
    `${cliente}\n` +
    `📱 ${numeroMittente}\n` +
    `💬 "${testoOriginale}"\n\n` +
    `ℹ️ Motivo: ${motivoLeggibile}\n\n` +
    `_Rispondi direttamente su WhatsApp_`
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS INTERNI
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Trova la chiave nel catalogo per un nome prodotto (ricerca flessibile).
 */
function _trovaCatalogo(nomeProdotto) {
  if (!nomeProdotto) return null;

  const t = nomeProdotto.toLowerCase().replace(/[àáâäèéêëìíîïòóôöùúûü]/g, c =>
    ({ à: 'a', á: 'a', â: 'a', ä: 'a', è: 'e', é: 'e', ê: 'e', ë: 'e', ì: 'i', í: 'i', î: 'i', ï: 'i', ò: 'o', ó: 'o', ô: 'o', ö: 'o', ù: 'u', ú: 'u', û: 'u', ü: 'u' }[c] || c)
  );

  // Match diretto
  for (const key of Object.keys(CATALOGO)) {
    if (key === t || key.includes(t) || t.includes(key)) return key;
    const nomeKey = CATALOGO[key].nome.toLowerCase();
    if (nomeKey === t || nomeKey.includes(t) || t.includes(nomeKey.split(' ')[0])) return key;
  }

  // Match fuzzy per parole chiave comuni
  const mapping = {
    chiacchere: 'chiacchere', chiacchiere: 'chiacchere',
    raviolo: 'ravioli', ravioli: 'ravioli',
    culurgion: 'culurgiones',
    pardula: 'pardulas',
    ciambella: 'ciambelle',
    sebada: 'sebadas',
    amaretto: 'amaretti',
    bianchino: 'bianchini',
    papassina: 'papassinas', pabassina: 'papassinas',
    gueffu: 'gueffus',
    zeppola: 'zeppole',
    panada: 'panada_agnello',
    panadina: 'panadine',
    lasagna: 'lasagne',
    dolci: 'dolci_misti',
  };

  for (const [pattern, key] of Object.entries(mapping)) {
    if (t.includes(pattern)) return key;
  }

  return null;
}

/**
 * Aggiunge il suffisso "fuori orario" se necessario.
 */
function _suffissoOrario() {
  const { aperto, messaggio } = verificaOrario();
  if (aperto) return null;
  if (messaggio === 'domenica') {
    return `_Oggi siamo chiusi (domenica). Per gli ordini ti scriviamo da lunedì 😊_`;
  }
  return `_Siamo chiusi in questo momento. Per gli ordini ti rispondiamo appena riapriamo 😊_`;
}