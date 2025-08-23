import mongoose from 'mongoose';
import TemplateMessaggio from '../models/templateMessaggio.js';
import dotenv from 'dotenv';

dotenv.config();

const templates = [
  {
    nome: 'conferma_ordine',
    categoria: 'ordine',
    oggetto: 'Conferma Ordine',
    testo: `🎉 *Ordine Confermato!*

Ciao {{nomeCliente}},
Il tuo ordine #{{numeroOrdine}} è stato ricevuto!

📅 Data ritiro: {{dataRitiro}}
⏰ Ora: {{oraRitiro}}

📦 Prodotti:
{{listaProdotti}}

💰 Totale: €{{totale}}

{{note}}

Ti invieremo un promemoria il giorno prima del ritiro.

Grazie! 🍝`,
    variabili: [
      { nome: 'nomeCliente', descrizione: 'Nome del cliente' },
      { nome: 'numeroOrdine', descrizione: 'Numero ordine' },
      { nome: 'dataRitiro', descrizione: 'Data di ritiro' },
      { nome: 'oraRitiro', descrizione: 'Ora di ritiro' },
      { nome: 'listaProdotti', descrizione: 'Lista dei prodotti' },
      { nome: 'totale', descrizione: 'Totale ordine' },
      { nome: 'note', descrizione: 'Note aggiuntive' }
    ]
  },
  {
    nome: 'promemoria_ritiro',
    categoria: 'ordine',
    oggetto: 'Promemoria Ritiro',
    testo: `🔔 *Promemoria*

Ciao {{nomeCliente}},
Ti ricordiamo il ritiro del tuo ordine!

📅 {{dataRitiro}}
⏰ {{oraRitiro}}
📦 Ordine #{{numeroOrdine}}

A presto! 👋`,
    variabili: [
      { nome: 'nomeCliente', descrizione: 'Nome del cliente' },
      { nome: 'numeroOrdine', descrizione: 'Numero ordine' },
      { nome: 'dataRitiro', descrizione: 'Data di ritiro' },
      { nome: 'oraRitiro', descrizione: 'Ora di ritiro' }
    ]
  },
  {
    nome: 'ordine_pronto',
    categoria: 'ordine',
    oggetto: 'Ordine Pronto',
    testo: `✅ *Ordine Pronto!*

{{nomeCliente}}, il tuo ordine #{{numeroOrdine}} è pronto!

Puoi ritirarlo negli orari di apertura.

Grazie! 🙏`,
    variabili: [
      { nome: 'nomeCliente', descrizione: 'Nome del cliente' },
      { nome: 'numeroOrdine', descrizione: 'Numero ordine' }
    ]
  },
  {
    nome: 'promozione_settimanale',
    categoria: 'marketing',
    oggetto: 'Promozione Settimanale',
    testo: `🎁 *Offerta Speciale!*

Ciao {{nomeCliente}},

Questa settimana:
{{offerta}}

Valida fino al {{dataScadenza}}

Prenota ora! 📱`,
    variabili: [
      { nome: 'nomeCliente', descrizione: 'Nome del cliente' },
      { nome: 'offerta', descrizione: 'Descrizione offerta' },
      { nome: 'dataScadenza', descrizione: 'Data scadenza offerta' }
    ]
  },
  {
    nome: 'auguri_compleanno',
    categoria: 'marketing',
    oggetto: 'Auguri di Compleanno',
    testo: `🎂 *Buon Compleanno {{nomeCliente}}!*

Il Pastificio ti augura un fantastico compleanno!

Come regalo, hai diritto a uno sconto del 10% sul tuo prossimo ordine!

Codice: COMPLEANNO{{codice}}

Auguri! 🎉`,
    variabili: [
      { nome: 'nomeCliente', descrizione: 'Nome del cliente' },
      { nome: 'codice', descrizione: 'Codice sconto' }
    ]
  },
  {
    nome: 'chiusura_festiva',
    categoria: 'servizio',
    oggetto: 'Chiusura Festiva',
    testo: `📢 *Avviso*

Caro/a {{nomeCliente}},

Ti informiamo che saremo chiusi:
{{periodoChiusura}}

Per ordini urgenti, contattaci entro {{dataLimite}}.

Buone feste! 🎄`,
    variabili: [
      { nome: 'nomeCliente', descrizione: 'Nome del cliente' },
      { nome: 'periodoChiusura', descrizione: 'Periodo di chiusura' },
      { nome: 'dataLimite', descrizione: 'Data limite ordini' }
    ]
  }
];

async function inizializzaTemplates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connesso a MongoDB');
    
    // Pulisci templates esistenti
    await TemplateMessaggio.deleteMany({});
    console.log('Templates esistenti rimossi');
    
    // Inserisci nuovi templates
    await TemplateMessaggio.insertMany(templates);
    console.log(`${templates.length} templates inseriti con successo`);
    
    process.exit(0);
  } catch (error) {
    console.error('Errore inizializzazione templates:', error);
    process.exit(1);
  }
}

inizializzaTemplates();