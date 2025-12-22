// components/RiepilogoStampabile.js

// 🖨️ RIEPILOGO GIORNALIERO STAMPABILE - A4 LANDSCAPE

// Fogli separati: Ravioli, Pardulas, Dolci, Altri

// ✅ AGGIORNATO 20/11/2025: Raggruppamento per cliente+prodotto+quantità (es. "3 x 1 Kg")



import React, { useMemo } from 'react';

import {

  Dialog,

  DialogTitle,

  DialogContent,

  DialogActions,

  Button,

  Box,

  Typography

} from '@mui/material';

import { Print as PrintIcon, Close as CloseIcon } from '@mui/icons-material';



// ========== CONFIGURAZIONE ==========



// Abbreviazioni prodotti (ULTRA-COMPATTE)

const ABBREVIAZIONI = {

  // Ravioli

  'Ravioli ricotta e spinaci': 'R.Spin',

  'Ravioli ricotta e zafferano': 'R.Zaff',

  'Ravioli ricotta dolci': 'R.Dolci',

  'Ravioli ricotta poco dolci': 'R.PocoDolci',

  'Ravioli ricotta molto dolci': 'R.MoltoDolci',

  'Ravioli ricotta piccoli': 'R.Piccoli',

  'Ravioli di formaggio': 'R.Form',

  'Culurgiones': 'Culurg',

  

  // Pardulas

  'Pardulas': 'P',

  'Pardulas (base)': 'P',

  'Pardulas con glassa': 'P.Glass',

  'Pardulas con zucchero a velo': 'P.Zucch',

  

  // Dolci

  'Amaretti': 'A',

  'Bianchini': 'B',

  'Papassinas': 'PAB',

  'Papassine': 'PAB',

  'Pabassine': 'PAB',

  'Pabassinas': 'PAB',

  'Gueffus': 'G',
  'PPAPASSINI': 'PAB',


  'Ciambelle': 'C',
  'CIMBELLE': 'C',

  'Ciambelle con marmellata di albicocca': 'C.Albic',

  'Ciambelle con marmellata di ciliegia': 'C.Cileg',

  'Ciambelle con nutella': 'C.Nut',

  'Ciambelle con zucchero a velo': 'C.Nude',

  'Ciambelle semplici': 'C.Nude',

  'Ciambelle miste': 'C.Miste',

  'Sebadas': 'Sebad',

  'Torta di saba': 'T.Saba',

  'Vassoio Dolci Misti': 'Vass.Mix',

  'Dolci misti': 'Dolci Mix',

  

  // Panadas

  'Panada di Agnello': 'Pan.Agn',

  'Panada di Maiale': 'Pan.Maia',

  'Panada di Vitella': 'Pan.Vite',

  'Panada di verdure': 'Pan.Verd',

  'Panadine': 'Pndn',

  

  // Pasta

  'Fregula': 'Freg',

  'Pizzette sfoglia': 'Pizz',

  'Pasta per panada e pizza': 'Pasta',

  'Sfoglia per lasagne': 'Sfog'

};



// ✅ FATTORI CONVERSIONE PEZZI -> KG

const PEZZI_PER_KG = {

  // Ravioli

  'Ravioli ricotta e spinaci': 30,

  'Ravioli ricotta e zafferano': 30,

  'Ravioli ricotta dolci': 30,

  'Ravioli ricotta poco dolci': 30,

  'Ravioli ricotta molto dolci': 30,

  'Ravioli ricotta piccoli': 40,

  'Ravioli di formaggio': 30,

  'Culurgiones': 32,

  

  // Pardulas

  'Pardulas': 25,

  'Pardulas (base)': 25,

  'Pardulas con glassa': 25,

  'Pardulas con zucchero a velo': 25,

  

  // Dolci

  'Amaretti': 35,

  'Bianchini': 100,

  'Papassinas': 30,

  'Papassine': 30,

  'Pabassine': 30,

  'Pabassinas': 30,

  'Gueffus': 65,

  'Ciambelle': 30,

  'Ciambelle con marmellata di albicocca': 30,

  'Ciambelle con marmellata di ciliegia': 30,

  'Ciambelle con nutella': 30,

  'Ciambelle con zucchero a velo': 30,

  'Ciambelle semplici': 30,

  

  // Pasta

  'Pizzette sfoglia': 30,
  'Sebadas': 10, // ~100g ciascuna
  'Torta di saba': 1,
  'Panada di Agnello': 4,
  'Panada di Maiale': 4,
  'Panada di Vitella': 4,
  'Panada di verdure': 4,
  'Panadine': 20,
  'Zeppole': 24

};

// ✅ COMPOSIZIONE DOLCI MISTI (per 1 kg)
const COMPOSIZIONE_DOLCI_MISTI = {
  'Pardulas': 0.40,    // 400g
  'Ciambelle': 0.25,   // 250g
  'Amaretti': 0.15,    // 150g
  'Gueffus': 0.05,     // 50g
  'Pabassine': 0.05,   // 50g
  'Bianchini': 0.03    // 30g (3 pezzi)
};



// ✅ Prodotti venduti SOLO a pezzo (non convertibili in Kg)
// ✅ AGGIORNATO 10/12/2025: Vuoto - ora tutto viene convertito in Kg

const SOLO_PEZZO = [];



// Categorie prodotti

const CATEGORIE = {

  RAVIOLI: {

    nome: 'RAVIOLI',

    prodotti: ['Ravioli', 'Culurgiones'],

    colore: '#FF6B6B'

  },

  PARDULAS: {

    nome: 'PARDULAS',

    prodotti: ['Pardulas'],

    colore: '#4ECDC4'

  },

  DOLCI: {

    nome: 'DOLCI',

    prodotti: ['Amaretti', 'Bianchini', 'Papassinas', 'Papassine', 'Pabassine', 'Pabassinas', 

               'Gueffus', 'Ciambelle', 'Sebadas', 'Torta di saba', 'Vassoio', 'Dolci misti'],

    colore: '#FFE66D'

  },

  PANADE: {

    nome: 'PANADE',

    prodotti: ['Panada', 'Panadine'],

    colore: '#FFA07A'

  },

  ALTRI: {

    nome: 'ALTRI PRODOTTI',

    prodotti: ['Fregula', 'Pizzette', 'Pasta', 'Sfoglia'],

    colore: '#95E1D3'

  }

};



// ✅ AGGIORNATO: Tipi varianti ravioli (colonne principali)

const VARIANTI_RAVIOLI = {

  spinaci: ['spinaci', 'spinac'],

  zafferano: ['zafferano', 'zaff'],

  dolci: ['dolci'],  // Solo "dolci" base

  culurgiones: ['culurgiones', 'culurgio'],

  formaggio: ['formaggio', 'form']

};



// ✅ AGGIORNATO: Varianti speciali che vanno nelle NOTE

const VARIANTI_NOTE = {

  piccoli: ['più piccoli', 'piccoli'],

  grandi: ['più grandi', 'grandi'],

  molto_dolci: ['molto dolci'],

  poco_dolci: ['poco dolci'],

  piu_spinaci: ['più spinaci'],

  piu_zafferano: ['più zafferano'],

  pasta_grossa: ['pasta più grossa', 'pasta grossa']

};



// ========== FUNZIONI HELPER ==========



const abbreviaProdotto = (nome) => {

  // ✅ NON abbreviare Panade e Panadine

  if (nome.toLowerCase().includes('panada') || nome.toLowerCase().includes('panadine')) {

    return nome;

  }

  

  // Cerca match esatto

  if (ABBREVIAZIONI[nome]) {

    return ABBREVIAZIONI[nome];

  }

  

  // Cerca case-insensitive

  const nomeLC = nome.toLowerCase();

  for (const [key, abbr] of Object.entries(ABBREVIAZIONI)) {

    if (key.toLowerCase() === nomeLC) {

      return abbr;

    }

  }

  

  // Cerca match parziale (contiene)

  for (const [key, abbr] of Object.entries(ABBREVIAZIONI)) {

    if (nomeLC.includes(key.toLowerCase()) || key.toLowerCase().includes(nomeLC)) {

      return abbr;

    }

  }

  

  return nome;

};

// ✅ NUOVO 22/11/2025: Normalizza nome prodotto per totali
// Raggruppa varianti dello stesso prodotto (es. tutte le Ciambelle insieme)
const normalizzaNomeProdotto = (nome) => {
  const nomeLC = nome.toLowerCase();
  
  // Ravioli - tutte le varianti diventano "Ravioli"
  if (nomeLC.includes('ravioli') && !nomeLC.includes('culurgiones')) {
    return 'Ravioli';
  }
  
  // Ciambelle - tutte le varianti diventano "Ciambelle"
  if (nomeLC.includes('ciambelle') || nomeLC.includes('cimbelle')) {
    return 'Ciambelle';
  }
  
  // Pardulas - tutte le varianti diventano "Pardulas"
  if (nomeLC.includes('pardulas')) {
    return 'Pardulas';
  }
  
  // Papassinas - tutte le varianti diventano "Papassinas"
  if (nomeLC.includes('papassin') || nomeLC.includes('pabassin') || nomeLC.includes('pabas')) {
    return 'Papassinas';
  }
  
  // Altri prodotti rimangono invariati
  return nome;
};



const getCategoriaProdotto = (nomeProdotto) => {

  const nomeLC = nomeProdotto.toLowerCase();

  

  for (const [key, categoria] of Object.entries(CATEGORIE)) {

    if (categoria.prodotti.some(p => nomeLC.includes(p.toLowerCase()))) {

      return key;

    }

  }

  

  return 'ALTRI';

};



// ✅ NUOVO: Funzione che rileva TUTTE le varianti (ritorna array)

const getVariantiRavioli = (nomeProdotto) => {

  const nomeLC = nomeProdotto.toLowerCase();

  const varianti = [];

  

  // Controlla ogni variante principale

  if (VARIANTI_RAVIOLI.spinaci.some(v => nomeLC.includes(v))) {

    varianti.push('SPIN');

  }

  if (VARIANTI_RAVIOLI.zafferano.some(v => nomeLC.includes(v))) {

    varianti.push('ZAFF');

  }

  if (VARIANTI_RAVIOLI.formaggio.some(v => nomeLC.includes(v))) {

    varianti.push('FORM');

  }

  if (VARIANTI_RAVIOLI.culurgiones.some(v => nomeLC.includes(v))) {

    varianti.push('CULUR');

  }

  

  // Dolci: verifica che non sia molto/poco dolci (quelli vanno nelle note)

  // Ma se è "molto dolci" o "poco dolci", conta comunque come DOLCI nella colonna

  if (nomeLC.includes('dolci')) {

    varianti.push('DOLCI');

  }

  

  return varianti;

};



// ✅ MANTENUTA per retrocompatibilità (non usata nel render)

const getVarianteRavioli = (nomeProdotto) => {

  const varianti = getVariantiRavioli(nomeProdotto);

  return varianti.length > 0 ? varianti[0] : null;

};



// ✅ AGGIORNATO 20/11/2025: Combina TUTTE le note (speciali + noteCottura)

const getNoteRavioli = (nomeProdotto, noteCottura = '') => {

  const nomeLC = nomeProdotto.toLowerCase();

  const noteLC = (noteCottura || '').toLowerCase();

  const combinato = `${nomeLC} ${noteLC}`;

  const note = [];

  

  // Controlla nel nome e nelle note

  if (VARIANTI_NOTE.piccoli.some(v => combinato.includes(v))) {

    note.push('piccoli');

  }

  if (VARIANTI_NOTE.grandi.some(v => combinato.includes(v))) {

    note.push('grandi');

  }

  if (VARIANTI_NOTE.molto_dolci.some(v => combinato.includes(v))) {

    note.push('molto dolci');

  }

  if (VARIANTI_NOTE.poco_dolci.some(v => combinato.includes(v))) {

    note.push('poco dolci');

  }

  if (VARIANTI_NOTE.piu_spinaci.some(v => combinato.includes(v))) {

    note.push('+ spinaci');

  }

  if (VARIANTI_NOTE.piu_zafferano.some(v => combinato.includes(v))) {

    note.push('+ zafferano');

  }

  if (VARIANTI_NOTE.pasta_grossa.some(v => combinato.includes(v))) {

    note.push('pasta grossa');

  }

  

  // ✅ NUOVO: Estrai parti di noteCottura che non sono già nelle note speciali

  if (noteCottura) {

    // Controlla se contiene info extra (es. "Vassoio nr X")

    const partiNoteCottura = noteCottura.split(',').map(p => p.trim());

    

    partiNoteCottura.forEach(parte => {

      const parteLC = parte.toLowerCase();

      // Se non è già inclusa come nota speciale, aggiungila

      const giaInclusa = note.some(n => parteLC.includes(n.toLowerCase())) ||

                        Object.values(VARIANTI_NOTE).some(variants => 

                          variants.some(v => parteLC.includes(v))

                        );

      

      if (!giaInclusa && parte.length > 0) {

        note.push(parte);

      }

    });

  }

  

  // ✅ AGGIORNATO 26/11/2025: Filtra packaging e dimensione vassoio, restituisci MAIUSCOLO

  const noteFiltrate = note.filter(n => {

    const nLC = n.toLowerCase();

    return !nLC.includes('packaging') && 

           !nLC.includes('dimensione vassoio') && 

           !nLC.includes('dim. vassoio');

  });

  

  return noteFiltrate.map(n => n.toUpperCase()).join(', ');

};



// ✅ NUOVO 20/11/2025: Helper per combinare note + noteCottura per prodotti generici

const getNoteCombinate = (prodotto) => {

  const note = prodotto.note || '';

  const noteCottura = prodotto.noteCottura || '';

  

  // Se sono uguali, ritorna solo una

  if (note === noteCottura) {

    return note;

  }

  

  // Se una è vuota, ritorna l'altra

  if (!note) return noteCottura;

  if (!noteCottura) return note;

  

  // Combina entrambe, evitando duplicati

  const partiNote = note.split(',').map(p => p.trim().toLowerCase());

  const partiNoteCottura = noteCottura.split(',').map(p => p.trim());

  

  const risultato = [note];

  

  partiNoteCottura.forEach(parte => {

    if (!partiNote.includes(parte.toLowerCase())) {

      risultato.push(parte);

    }

  });

  

  return risultato.join(', ');

};



// ✅ Funzione per ottenere pezzi/Kg di un prodotto
// ✅ AGGIORNATO 10/12/2025: Ritorna sempre un valore (default 30)

const getPezziPerKg = (nomeProdotto) => {

  // Cerca prima il nome esatto

  if (PEZZI_PER_KG[nomeProdotto]) {

    return PEZZI_PER_KG[nomeProdotto];

  }

  

  // Cerca per nome parziale

  for (const [nome, pezziKg] of Object.entries(PEZZI_PER_KG)) {

    if (nomeProdotto.toLowerCase().includes(nome.toLowerCase()) ||

        nome.toLowerCase().includes(nomeProdotto.toLowerCase())) {

      return pezziKg;

    }

  }

  
  // ✅ DEFAULT: 30 pezzi per Kg (stima media)
  console.log(`⚠️ Prodotto "${nomeProdotto}" non trovato in PEZZI_PER_KG, uso default 30`);
  return 30;

};



// ✅ Verifica se prodotto è solo pezzo

const isSoloPezzo = (nomeProdotto) => {

  return SOLO_PEZZO.some(p => nomeProdotto.toLowerCase().includes(p.toLowerCase()));

};



// ✅ VERSIONE FINALE PULITA: Usa array composizione

const getComposizioneProdotto = (prodotto) => {

  // Controlla se esiste array composizione

  if (!prodotto.dettagliCalcolo?.composizione || !Array.isArray(prodotto.dettagliCalcolo.composizione)) {

    return ''; // Ritorna vuoto per prodotti normali

  }

  
  // ✅ FIX 22/12/2025: Includi varianti nelle abbreviazioni
  const items = prodotto.dettagliCalcolo.composizione.map(item => {

    let abbr = abbreviaProdotto(item.nome);
    
    // Se c'è una variante, aggiungila all'abbreviazione
    if (item.variante) {
      const varianteLower = item.variante.toLowerCase();
      
      // Ciambelle con varianti
      if (abbr === 'C' || item.nome.toLowerCase().includes('ciambelle')) {
        if (varianteLower.includes('albicocca')) abbr = 'C.Albic';
        else if (varianteLower.includes('nutella')) abbr = 'C.Nut';
        else if (varianteLower.includes('ciliegia') || varianteLower.includes('cilieg')) abbr = 'C.Cileg';
        else abbr = `C.${item.variante.substring(0, 3)}`;
      }
      
      // Pardulas con varianti
      else if (abbr === 'P' || item.nome.toLowerCase().includes('pardulas')) {
        if (varianteLower.includes('glassa')) abbr = 'P.Glass';
        else abbr = 'P';
      }
      
      // Sebadas con varianti
      else if (item.nome.toLowerCase().includes('sebadas') || item.nome.toLowerCase().includes('sebada')) {
        if (varianteLower.includes('form')) abbr = 'Seb.Form';
        else if (varianteLower.includes('carne')) abbr = 'Seb.Carn';
        else if (varianteLower.includes('verd')) abbr = 'Seb.Verd';
        else abbr = `Seb.${item.variante.substring(0, 4)}`;
      }
    }

    const qta = Math.round(parseFloat(item.quantita) * 100) / 100;

    return { abbr, qta };

  });

  

  // Se tutte le quantità sono uguali e < 1, mostra solo lettere (es: "ABG")

  const quantita_arr = items.map(i => i.qta);

  const tutteUguali = quantita_arr.every((q, i, arr) => Math.abs(q - arr[0]) < 0.01);

  const tutteMinoriDi1 = quantita_arr.every(q => q < 1);

  

  if (tutteUguali && tutteMinoriDi1 && items.length > 1) {

    return items.map(i => i.abbr).join(' ').toUpperCase();

  }

  

  // Altrimenti mostra con quantità

  return items

    .map(i => {
      // ✅ FIX: Se intero mostra senza decimali, altrimenti 1 decimale
      const qtaStr = Number.isInteger(i.qta) ? i.qta.toString() : i.qta.toFixed(1);
      return `${i.abbr} ${qtaStr.replace('.', ',')}`;
    })

    .join(' ')

    .toUpperCase();

};



// ✅ NUOVO 26/11/2025: Formatta quantità con unità in MAIUSCOLO (es: "1 KG", "20 €", "59 PEZZI", "1 VASSOIO")

const formattaQuantitaConUnitaMaiuscola = (prodotto) => {

  const { quantita, unita } = prodotto;

  

  if (!quantita) return '';

  

  // Mappa unità -> testo maiuscolo

  const unitaMap = {

    'kg': 'KG',

    'Kg': 'KG',

    'g': 'G',

    'pezzi': 'PEZZI',

    'Pezzi': 'PEZZI',

    'pz': 'PZ',

    'euro': '€',

    '€': '€',

    'vassoio': 'VASSOIO',

    'Vassoio': 'VASSOIO'

  };

  

  const unitaFormattata = unitaMap[unita] || unita.toUpperCase();

  

  // Se è euro, metti simbolo dopo

  if (unitaFormattata === '€') {

    return `${quantita} €`;

  }

  

  return `${quantita} ${unitaFormattata}`;

};



// ✅ NUOVO 26/11/2025: Filtra note eliminando packaging e dimensione vassoio

const filtraNote = (note) => {

  if (!note) return '';

  

  const noteLC = note.toLowerCase();

  

  // Escludi note su packaging e dimensione vassoio

  if (noteLC.includes('packaging') || 

      noteLC.includes('dimensione vassoio') || 

      noteLC.includes('dim. vassoio')) {

    return '';

  }

  

  return note.toUpperCase();

};



// ✅ AGGIORNATO 26/11/2025: Combina note prodotto + note cottura, filtrate e in MAIUSCOLO

const getNoteCombinateFiltrateHelper = (prodotto) => {

  const note = [];

  

  if (prodotto.note) {

    const noteFiltrate = filtraNote(prodotto.note);

    if (noteFiltrate) {

      note.push(noteFiltrate);

    }

  }

  

  if (prodotto.noteCottura) {

    const noteCoFiltrate = filtraNote(prodotto.noteCottura);

    if (noteCoFiltrate) {

      note.push(noteCoFiltrate);

    }

  }

  

  return note.join(' - ');

};



const formattaQuantita = (quantita, unita, dettagliCalcolo = null) => {

  // ✅ Per vassoi, usa il peso dalla composizione

  if (dettagliCalcolo?.composizione && unita === 'vassoio') {

    const pesoTotale = dettagliCalcolo.composizione.reduce((acc, comp) => {

      if (comp.unita === 'Kg') {

        return acc + comp.quantita;

      } else if (comp.unita === 'Pezzi') {

        // Converti pezzi in kg se possibile

        const pezziPerKg = getPezziPerKg(comp.nome);

        if (pezziPerKg) {

          return acc + Math.round((comp.quantita / pezziPerKg) * 100) / 100; // ✅ FIX precisione

        }

      }

      return acc;

    }, 0);

    

    if (pesoTotale > 0) {

      return `${pesoTotale.toFixed(1)} Kg`;

    }

  }

  

  // Normalizza l'unità

  const unitaNorm = unita?.toLowerCase()?.trim() || 'kg';

  

  if (unitaNorm === 'kg' || unitaNorm === 'kilogrammi') {

    return `${parseFloat(quantita).toFixed(1)} Kg`;

  } else if (unitaNorm === 'pezzi' || unitaNorm === 'pz') {

    return `${Math.round(quantita)} pz`;

  } else if (unitaNorm === '€' || unitaNorm === 'euro') {

    return `€${parseFloat(quantita).toFixed(2)}`;

  } else if (unitaNorm === 'vassoio') {

    return `1 vassoio`;

  }

  

  return `${quantita} ${unita}`;

};



const formattaData = (data) => {

  if (!data) return '';

  const d = new Date(data);

  return d.toLocaleDateString('it-IT', { 

    weekday: 'long', 

    day: '2-digit', 

    month: 'long', 

    year: 'numeric' 

  });

};



// ✅ FIX: Formatta quantità con moltiplicatore corretto per vassoi
const formattaQuantitaConCount = (prodotto, count) => {
  const qta = parseFloat(prodotto.quantita) || 0;
  const unita = prodotto.unita || 'Kg';
  const unitaNorm = unita.toLowerCase();

  // ✅ FIX VASSOI: Mostra moltiplicatore corretto e peso/composizione
  if (unitaNorm === 'vassoio' || unitaNorm.includes('vass')) {
    const quantitaVassoi = qta > 0 ? qta : 1;
    
    // Calcola peso totale dalla composizione
    let pesoTotale = 0;
    let composizioneAbbr = '';
    
    if (prodotto.dettagliCalcolo?.composizione) {
      // Calcola peso (solo items in Kg)
      prodotto.dettagliCalcolo.composizione.forEach(comp => {
        if (comp.unita === 'Kg') {
          pesoTotale += comp.quantita;
        } else if (comp.unita === 'Pezzi') {
          const pezziPerKg = getPezziPerKg(comp.nome);
          if (pezziPerKg && !isSoloPezzo(comp.nome)) {
            pesoTotale += Math.round((comp.quantita / pezziPerKg) * 100) / 100;
          }
        }
      });
      
      // Crea abbreviazione per items in Pezzi (es. "P10 C10")
      const pezziItems = prodotto.dettagliCalcolo.composizione.filter(
        item => (item.unita || '').toLowerCase() === 'pezzi'
      );
      if (pezziItems.length > 0) {
        composizioneAbbr = pezziItems.map(item => {
          const iniziale = item.nome.charAt(0).toUpperCase();
          return `${iniziale}${Math.round(item.quantita)}`;
        }).join(' ');
      }
    }
    
    // Calcola moltiplicatore totale = ordini raggruppati * vassoi per ordine
    const moltiplicatore = count * quantitaVassoi;
    
    // Determina cosa mostrare
    if (pesoTotale > 0) {
      // ✅ FIX: Il peso dalla composizione è GIÀ per singolo vassoio, NON dividere!
      const pesoDisplay = Math.round(pesoTotale * 10) / 10;
      return moltiplicatore > 1 ? `${moltiplicatore} X ${pesoDisplay} KG` : `${pesoDisplay} KG`;
    } else if (composizioneAbbr) {
      // Usa composizione abbreviata per items in pezzi
      return moltiplicatore > 1 ? `${moltiplicatore} X ${composizioneAbbr}` : composizioneAbbr;
    } else {
      // Fallback: mostra prezzo se disponibile
      const prezzoTotale = prodotto.prezzo || 0;
      if (prezzoTotale > 0) {
        return moltiplicatore > 1 ? `${moltiplicatore} X €${Math.round(prezzoTotale)}` : `€${Math.round(prezzoTotale)}`;
      }
      return moltiplicatore > 1 ? `${moltiplicatore} VASSOIO` : `1 VASSOIO`;
    }
  }
  
  // Altri tipi di unità
  if (unitaNorm === 'pezzi' || unitaNorm === 'pz') {
    return count > 1 ? `${count} X ${Math.round(qta)} PZ` : `${Math.round(qta)} PZ`;
  } else if (unita === '€' || unitaNorm === 'euro') {
    return count > 1 ? `${count} X €${qta}` : `€${qta}`;
  } else {
    const unitaMaiusc = unita.toUpperCase();
    return count > 1 ? `${count} X ${qta} ${unitaMaiusc}` : `${qta} ${unitaMaiusc}`;
  }
};



// ========== COMPONENTE PRINCIPALE ==========

export default function RiepilogoStampabile({ ordini, data, onClose }) {

  // ✅ AGGIORNATO: Raggruppa per CLIENTE + PRODOTTO + QUANTITÀ

  const ordiniPerCategoria = useMemo(() => {

    const result = {

      RAVIOLI: [],

      PARDULAS: [],

      DOLCI: [],

      PANADE: [],

      ALTRI: []

    };



    // ✅ FILTRO PER DATA - Mostra solo ordini della data selezionata

    const ordiniFiltrati = ordini.filter(ordine => {

      const dataOrdine = ordine.dataRitiro || ordine.createdAt || '';

      return dataOrdine.startsWith(data);

    });



    console.log(`📋 RiepilogoStampabile: ${ordiniFiltrati.length} ordini per ${data} (su ${ordini.length} totali)`);



    // Mappa per raggruppamento: cliente + prodotto + quantità + unità

    const mappaRaggruppamento = new Map();



    ordiniFiltrati.forEach(ordine => {

      if (!ordine.prodotti || ordine.prodotti.length === 0) return;



      // Determina se l'ordine ha prodotti in categorie diverse

      const categorieOrdine = new Set(

        ordine.prodotti.map(p => getCategoriaProdotto(p.nome))

      );

      const haAltriProdotti = categorieOrdine.size > 1;



      ordine.prodotti.forEach(prodotto => {

        const categoria = getCategoriaProdotto(prodotto.nome);

        const nomeCliente = ordine.nomeCliente || 'N/D';

        const quantita = prodotto.quantita || 0;

        const unita = prodotto.unita || 'Kg';

        

        // ✅ FIX 22/12/2025: Distingui PANADE (grosse) vs PANADINE (piccole)
        // - PANADE (con patate, grosse): NON raggruppare - ogni panada = 1 riga
        // - PANADINE (piccole): RAGGRUPPARE normalmente
        const nomeLower = prodotto.nome.toLowerCase();
        const isPanadaGrossa = categoria === 'PANADE' && 
                               nomeLower.includes('panada') && 
                               !nomeLower.includes('panadine');
        
        if (isPanadaGrossa) {
          const qtaInt = Math.floor(quantita);
          const qtaFrazionale = quantita - qtaInt;
          
          // Crea righe per la quantità intera
          for (let i = 0; i < qtaInt; i++) {
            result.PANADE.push({
              categoria,
              oraRitiro: ordine.oraRitiro || '',
              nomeCliente,
              daViaggio: ordine.daViaggio || false,
              haAltriProdotti,
              prodotto: { ...prodotto, quantita: 1 },
              count: 1
            });
          }
          
          // Se c'è una frazione (es. 2.5 kg), aggiungi riga con frazione
          if (qtaFrazionale > 0) {
            result.PANADE.push({
              categoria,
              oraRitiro: ordine.oraRitiro || '',
              nomeCliente,
              daViaggio: ordine.daViaggio || false,
              haAltriProdotti,
              prodotto: { ...prodotto, quantita: qtaFrazionale },
              count: 1
            });
          }
          return; // Non processare oltre per panade grosse
        }

        // ✅ Chiave: CLIENTE + PRODOTTO + QUANTITÀ + UNITÀ (per tutti gli altri prodotti)

        // Vassoi sono unici per prezzo (non raggruppabili se prezzi diversi)

        let chiave;

        if (prodotto.nome === 'Vassoio Dolci Misti' || unita === 'vassoio') {

          chiave = `${categoria}-${nomeCliente}-${prodotto.nome}-${prodotto.prezzo}`;

        } else {

          chiave = `${categoria}-${nomeCliente}-${prodotto.nome}-${quantita}-${unita}`;

        }



        if (mappaRaggruppamento.has(chiave)) {

          // Aggiungi a gruppo esistente

          const gruppo = mappaRaggruppamento.get(chiave);

          gruppo.count += 1;

          if (ordine.daViaggio) gruppo.daViaggio = true;

          if (haAltriProdotti) gruppo.haAltriProdotti = true;

        } else {

          // Crea nuovo gruppo

          mappaRaggruppamento.set(chiave, {

            categoria,

            oraRitiro: ordine.oraRitiro || '',

            nomeCliente,

            daViaggio: ordine.daViaggio || false,

            haAltriProdotti,

            prodotto,

            count: 1

          });

        }

      });

    });



    // Converti mappa in array per categoria

    mappaRaggruppamento.forEach((gruppo) => {

      result[gruppo.categoria].push(gruppo);

    });



    // Ordina ogni categoria per ora

    Object.keys(result).forEach(cat => {

      result[cat].sort((a, b) => {

        if (!a.oraRitiro) return 1;

        if (!b.oraRitiro) return -1;

        return a.oraRitiro.localeCompare(b.oraRitiro);

      });

    });



    return result;

  }, [ordini, data]);



  // Calcola totali per categoria

  const calcolaTotali = (categoria) => {

    let totaleKg = 0;

    let totalePezziNonConvertibili = 0;

    let totaleEuro = 0;

    const dettagliKg = {};

    const dettagliPezzi = {};



    ordiniPerCategoria[categoria].forEach(item => {

      const prodotto = item.prodotto;

      const unitaNorm = prodotto.unita?.toLowerCase()?.trim() || 'kg';

      // ✅ Moltiplica per count per raggruppamenti

      const moltiplicatore = item.count || 1;
      
      // ✅ NUOVO: Riconosci se è un vassoio/dolci misti da esplodere
      const nomeLC = prodotto.nome?.toLowerCase() || '';
      const isDolciMisti = nomeLC.includes('dolci mix') || nomeLC.includes('dolci misti');
      const isVassioODolciMisti = unitaNorm === 'vassoio' || isDolciMisti || nomeLC.includes('vassoio');

      // ✅ CASO SPECIALE: DOLCI MIX senza composizione dettagliata
      // Usa la composizione standard per esplodere
      if (isDolciMisti && !prodotto.dettagliCalcolo?.composizione) {
        const pesoTotale = prodotto.quantita * moltiplicatore;
        
        // Esplodi usando composizione standard
        for (const [componente, percentuale] of Object.entries(COMPOSIZIONE_DOLCI_MISTI)) {
          const pesoComponente = pesoTotale * percentuale;
          totaleKg += pesoComponente;
          const nomeNorm = normalizzaNomeProdotto(componente);
          dettagliKg[nomeNorm] = (dettagliKg[nomeNorm] || 0) + pesoComponente;
        }
        return; // Non processare ulteriormente
      }

      

      // ✅ Gestione vassoi e DOLCI MIX - esplodi componenti
      if (isVassioODolciMisti && prodotto.dettagliCalcolo?.composizione) {

        prodotto.dettagliCalcolo.composizione.forEach(comp => {

          if (comp.unita === 'Kg') {

            totaleKg += comp.quantita * moltiplicatore;

            const nomeNorm = normalizzaNomeProdotto(comp.nome);

            dettagliKg[nomeNorm] = (dettagliKg[nomeNorm] || 0) + comp.quantita * moltiplicatore;

          } else if (comp.unita === 'Pezzi') {

            const pezziPerKg = getPezziPerKg(comp.nome);

            if (pezziPerKg && !isSoloPezzo(comp.nome)) {

              const kgEquivalenti = Math.round((comp.quantita / pezziPerKg * moltiplicatore) * 100) / 100; // ✅ FIX precisione

              totaleKg += kgEquivalenti;

              const nomeNorm = normalizzaNomeProdotto(comp.nome);

              dettagliKg[nomeNorm] = (dettagliKg[nomeNorm] || 0) + kgEquivalenti;

            } else {

              totalePezziNonConvertibili += comp.quantita * moltiplicatore;

              const nomeNorm = normalizzaNomeProdotto(comp.nome);

              dettagliPezzi[nomeNorm] = (dettagliPezzi[nomeNorm] || 0) + comp.quantita * moltiplicatore;

            }

          }

        });

      } else if (unitaNorm === 'kg' || unitaNorm === 'kilogrammi') {

        totaleKg += prodotto.quantita * moltiplicatore;

        const nomeNorm = normalizzaNomeProdotto(prodotto.nome);

        dettagliKg[nomeNorm] = (dettagliKg[nomeNorm] || 0) + prodotto.quantita * moltiplicatore;

      } else if (unitaNorm === 'pezzi' || unitaNorm === 'pz') {

        const pezziPerKg = getPezziPerKg(prodotto.nome);

        

        if (pezziPerKg && !isSoloPezzo(prodotto.nome)) {

          const kgEquivalenti = Math.round((prodotto.quantita / pezziPerKg * moltiplicatore) * 100) / 100; // ✅ FIX precisione

          totaleKg += kgEquivalenti;

          const nomeNorm = normalizzaNomeProdotto(prodotto.nome);

          dettagliKg[nomeNorm] = (dettagliKg[nomeNorm] || 0) + kgEquivalenti;

        } else {

          totalePezziNonConvertibili += prodotto.quantita * moltiplicatore;

          const nomeNorm = normalizzaNomeProdotto(prodotto.nome);

          dettagliPezzi[nomeNorm] = (dettagliPezzi[nomeNorm] || 0) + prodotto.quantita * moltiplicatore;

        }

      } else if (unitaNorm === '€' || unitaNorm === 'euro') {
        // ✅ € NON è peso! Teniamo traccia ma non aggiungiamo a totaleKg
        totaleEuro += prodotto.quantita * moltiplicatore;

      }

    });



    return { 

      totaleKg, 

      totalePezziNonConvertibili, 

      totaleEuro, 

      dettagliKg, 

      dettagliPezzi

    };

  };



  // ✅ AGGIORNATO 10/12/2025: Mostra SOLO KG (€ NON è peso!)

  const formattaTotaliStringa = (totaleKg, totalePezzi, totaleEuro) => {

    const parti = [];
    
    // ✅ Solo KG - gli € NON sono peso!
    if (totaleKg > 0) parti.push(`${totaleKg.toFixed(1)} KG`);
    
    // ✅ € mostrato separatamente solo se presente
    if (totaleEuro > 0) parti.push(`€${totaleEuro.toFixed(2)} (valore)`);

    return parti.join(' | ') || '0 KG';

  };



  // Stampa

  const handleStampa = () => {

    window.print();

  };



  return (

    <>

      {/* Dialog per preview (non stampato) */}

      <Dialog 

        open={true} 

        onClose={onClose} 

        maxWidth={false}

        fullWidth

        PaperProps={{

          sx: { 

            width: '95vw',

            height: '95vh',

            maxWidth: 'none'

          }

        }}

      >

        <DialogTitle>

          📄 Riepilogo Stampabile - {formattaData(data)}

        </DialogTitle>



        <DialogContent>

          <Box className="print-container">

            {/* ========== FOGLIO 1: RAVIOLI ========== */}

            {ordiniPerCategoria.RAVIOLI.length > 0 && (

              <div className="page ravioli-page">

                <div className="page-header" style={{ background: CATEGORIE.RAVIOLI.colore }}>

                  <h2>RAVIOLI - {formattaData(data)}</h2>

                </div>



                <table className="ordini-table ravioli-table">

                  <thead>

                    <tr>

                      <th style={{ width: '60px' }}>ORA</th>

                      <th style={{ width: '45px' }}>SPIN</th>

                      <th style={{ width: '45px' }}>ZAFF</th>

                      <th style={{ width: '45px' }}>DOLCI</th>

                      <th style={{ width: '45px' }}>CULUR</th>

                      <th style={{ width: '45px' }}>FORM</th>

                      <th style={{ width: '90px' }}>Q.TÀ</th>

                      <th style={{ width: '30px' }}>🧳</th>

                      <th style={{ width: '140px' }}>CLIENTE</th>

                      <th style={{ width: '35px' }}>+</th>

                      <th style={{ width: '120px' }}>NOTE</th>

                    </tr>

                  </thead>

                  <tbody>

                    {ordiniPerCategoria.RAVIOLI.map((item, index) => {

                      // ✅ AGGIORNATO: Usa la nuova funzione che ritorna array

                      const varianti = getVariantiRavioli(item.prodotto.nome);

                      // ✅ AGGIORNATO 20/11/2025: Combina note + noteCottura

                      const noteRavioli = getNoteRavioli(

                        item.prodotto.nome, 

                        item.prodotto.noteCottura || item.prodotto.note

                      );

                      

                      return (

                        <tr key={index} style={item.count > 1 ? { backgroundColor: '#e3f2fd', fontWeight: 'bold' } : {}}>

                          <td className="center">{item.oraRitiro}</td>

                          {/* ✅ AGGIORNATO: Controlla se array include la variante */}

                          <td className="center">{varianti.includes('SPIN') ? '✓' : ''}</td>

                          <td className="center">{varianti.includes('ZAFF') ? '✓' : ''}</td>

                          <td className="center">{varianti.includes('DOLCI') ? '✓' : ''}</td>

                          <td className="center">{varianti.includes('CULUR') ? '✓' : ''}</td>

                          <td className="center">{varianti.includes('FORM') ? '✓' : ''}</td>

                          {/* ✅ AGGIORNATO: Mostra quantità con moltiplicatore */}

                          <td className="right" style={{ color: item.count > 1 ? '#1565c0' : 'inherit' }}>

                            {formattaQuantitaConCount(item.prodotto, item.count)}

                          </td>

                          <td className="center">{item.daViaggio ? '✈️' : ''}</td>

                          <td>{item.nomeCliente.toUpperCase()}</td>

                          <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>

                          <td style={{ fontSize: '12px' }}>{noteRavioli}</td>

                        </tr>

                      );

                    })}

                    
                    {/* ✅ NUOVO 21/11/2025: Righe vuote per completare foglio A4 */}
                    {(() => {
                      const righeAttuali = ordiniPerCategoria.RAVIOLI.length;
                      const righeTarget = 25;
                      const righeVuote = Math.max(0, righeTarget - righeAttuali);
                      
                      return Array.from({ length: righeVuote }, (_, i) => (
                        <tr key={`empty-ravioli-${i}`} style={{ height: '30px', borderBottom: '1px solid #e0e0e0' }}>
                          <td className="center" style={{ color: '#ccc' }}></td>
                          <td className="center"></td>
                          <td className="center"></td>
                          <td className="center"></td>
                          <td className="center"></td>
                          <td></td>
                          <td className="center"></td>
                          <td></td>
                        </tr>
                      ));
                    })()}
                  </tbody>

                </table>



                <div className="totali-riga">

                  {(() => {

                    const { totaleKg, totalePezziNonConvertibili, totaleEuro, dettagliKg } = calcolaTotali('RAVIOLI');

                    return (

                      <span>

                        <strong>TOT: {formattaTotaliStringa(totaleKg, totalePezziNonConvertibili, totaleEuro)}</strong>

                        {Object.entries(dettagliKg).map(([nome, kg]) => (

                          <span key={`kg-${nome}`} style={{ marginLeft: '15px' }}>{nome}: {kg.toFixed(1)} KG</span>

                        ))}

                      </span>

                    );

                  })()}

                </div>

              </div>

            )}



            {/* ========== FOGLIO 2: PARDULAS ========== */}

            {ordiniPerCategoria.PARDULAS.length > 0 && (

              <div className="page">

                <div className="page-header" style={{ background: CATEGORIE.PARDULAS.colore }}>

                  <h2>PARDULAS - {formattaData(data)}</h2>

                </div>



                <table className="ordini-table">

                  <thead>

                    <tr>

                      <th style={{ width: '60px' }}>ORA</th>

                      <th style={{ width: '180px' }}>PRODOTTO</th>

                      <th style={{ width: '90px' }}>Q.TÀ</th>

                      <th style={{ width: '140px' }}>CLIENTE</th>

                      <th style={{ width: '30px' }}>🧳</th>

                      <th style={{ width: '35px' }}>+</th>

                      <th style={{ width: '165px' }}>NOTE</th>

                    </tr>

                  </thead>

                  <tbody>

                    {ordiniPerCategoria.PARDULAS.map((item, index) => {

                      const nomeProdotto = abbreviaProdotto(item.prodotto.nome).toUpperCase();

                      

                      return (

                      <tr key={index} style={item.count > 1 ? { backgroundColor: '#e0f7fa', fontWeight: 'bold' } : {}}>

                        <td className="center">{item.oraRitiro}</td>

                        <td style={{ fontWeight: 'bold' }}>{nomeProdotto}</td>

                        {/* ✅ AGGIORNATO: Mostra quantità con moltiplicatore */}

                        <td className="right" style={{ color: item.count > 1 ? '#00695c' : 'inherit' }}>

                          {formattaQuantitaConCount(item.prodotto, item.count)}

                        </td>

                        <td>{item.nomeCliente.toUpperCase()}</td>

                        <td className="center">{item.daViaggio ? '✈️' : ''}</td>

                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>

                        {/* ✅ AGGIORNATO 20/11/2025: Usa note combinate */}

                        <td style={{ fontSize: '12px' }}>{getNoteCombinateFiltrateHelper(item.prodotto)}</td>

                      </tr>

                      );

                    })}

                    {/* ✅ NUOVO 21/11/2025: Righe vuote per completare foglio A4 */}
                    {(() => {
                      const righeAttuali = ordiniPerCategoria.PARDULAS.length;
                      const righeTarget = 25;
                      const righeVuote = Math.max(0, righeTarget - righeAttuali);
                      
                      return Array.from({ length: righeVuote }, (_, i) => (
                        <tr key={`empty-pardulas-${i}`} style={{ height: '30px', borderBottom: '1px solid #e0e0e0' }}>
                          <td className="center"></td>
                          <td></td>
                          <td className="center"></td>
                          <td></td>
                          <td className="center"></td>
                          <td className="center"></td>
                          <td></td>
                        </tr>
                      ));
                    })()}

                  </tbody>

                </table>



                <div className="totali">

                  {(() => {

                    const { totaleKg, totalePezziNonConvertibili, totaleEuro, dettagliKg } = calcolaTotali('PARDULAS');

                    return (

                      <span>

                        <strong>TOT: {formattaTotaliStringa(totaleKg, totalePezziNonConvertibili, totaleEuro)}</strong>

                        {Object.entries(dettagliKg).map(([nome, kg]) => (

                          <span key={`kg-${nome}`} style={{ marginLeft: '15px' }}>{nome}: {kg.toFixed(1)} KG</span>

                        ))}

                      </span>

                    );

                  })()}

                </div>

              </div>

            )}



            {/* ========== FOGLIO 3: DOLCI ========== */}

            {ordiniPerCategoria.DOLCI.length > 0 && (

              <div className="page">

                <div className="page-header" style={{ background: CATEGORIE.DOLCI.colore }}>

                  <h2>DOLCI - {formattaData(data)}</h2>

                </div>



                <table className="ordini-table">

                  <thead>

                    <tr>

                      <th style={{ width: '60px' }}>ORA</th>

                      <th style={{ width: '240px' }}>PRODOTTO</th>

                      <th style={{ width: '90px' }}>Q.TÀ</th>

                      <th style={{ width: '140px' }}>CLIENTE</th>

                      <th style={{ width: '30px' }}>🧳</th>

                      <th style={{ width: '35px' }}>+</th>

                      <th style={{ width: '155px' }}>NOTE</th>

                    </tr>

                  </thead>

                  <tbody>

                    {ordiniPerCategoria.DOLCI.map((item, index) => {

                      const composizione = getComposizioneProdotto(item.prodotto);

                      let nomeProdotto;

                      

                      // ✅ Per vassoi, mostra composizione se disponibile

                      if (item.prodotto.nome === 'Vassoio Dolci Misti' || item.prodotto.unita === 'vassoio') {

                        if (composizione) {

                          nomeProdotto = composizione;

                        } else {

                          // Fallback: mostra prezzo se composizione non disponibile

                          const prezzo = item.prodotto.prezzo || 0;

                          nomeProdotto = `VASSOIO €${prezzo.toFixed(0)}`;

                        }

                      } else {
                        // ✅ FIX 22/12/2025: Aggiungi variante per sebadas
                        let abbr = abbreviaProdotto(item.prodotto.nome).toUpperCase();
                        
                        if (item.prodotto.variante && (abbr === 'SEBAD' || item.prodotto.nome.toLowerCase().includes('sebadas'))) {
                          const varLower = item.prodotto.variante.toLowerCase();
                          if (varLower.includes('form')) abbr = 'SEBAD FORM';
                          else if (varLower.includes('carne')) abbr = 'SEBAD CARN';
                          else if (varLower.includes('verd')) abbr = 'SEBAD VERD';
                          else abbr = `SEBAD ${item.prodotto.variante.substring(0, 4).toUpperCase()}`;
                        }
                        
                        nomeProdotto = abbr;

                      }

                      

                      return (

                      <tr key={index} style={item.count > 1 ? { backgroundColor: '#fffde7', fontWeight: 'bold' } : {}}>

                        <td className="center">{item.oraRitiro}</td>

                        <td style={{ fontWeight: 'bold' }}>

                          {nomeProdotto}

                        </td>

                        {/* ✅ AGGIORNATO: Mostra quantità con moltiplicatore */}

                        <td className="right" style={{ color: item.count > 1 ? '#f57f17' : 'inherit' }}>

                          {formattaQuantitaConCount(item.prodotto, item.count)}

                        </td>

                        <td>{item.nomeCliente.toUpperCase()}</td>

                        <td className="center">{item.daViaggio ? '✈️' : ''}</td>

                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>

                        {/* ✅ AGGIORNATO 20/11/2025: Usa note combinate */}

                        <td style={{ fontSize: '12px' }}>{getNoteCombinateFiltrateHelper(item.prodotto)}</td>

                      </tr>

                      );

                    })}

                    {/* ✅ NUOVO 21/11/2025: Righe vuote per completare foglio A4 */}
                    {(() => {
                      const righeAttuali = ordiniPerCategoria.DOLCI.length;
                      const righeTarget = 25;
                      const righeVuote = Math.max(0, righeTarget - righeAttuali);
                      
                      return Array.from({ length: righeVuote }, (_, i) => (
                        <tr key={`empty-dolci-${i}`} style={{ height: '30px', borderBottom: '1px solid #e0e0e0' }}>
                          <td className="center"></td>
                          <td></td>
                          <td className="center"></td>
                          <td></td>
                          <td className="center"></td>
                          <td className="center"></td>
                          <td></td>
                        </tr>
                      ));
                    })()}

                  </tbody>

                </table>



                <div className="totali">

                  {(() => {

                    const { totaleKg, totalePezziNonConvertibili, totaleEuro, dettagliKg } = calcolaTotali('DOLCI');

                    return (

                      <span>

                        <strong>TOT: {formattaTotaliStringa(totaleKg, totalePezziNonConvertibili, totaleEuro)}</strong>

                        {Object.entries(dettagliKg).map(([nome, kg]) => (

                          <span key={`kg-${nome}`} style={{ marginLeft: '15px' }}>{nome}: {kg.toFixed(1)} KG</span>

                        ))}

                      </span>

                    );

                  })()}

                </div>

              </div>

            )}





            {/* ========== PAGINA 4: PANADE (NUOVA - ogni panada = 1 riga + numerazione) ========== */}

            {ordiniPerCategoria.PANADE.length > 0 && (

              <div className="page" style={{ pageBreakAfter: 'always' }}>

                <div className="page-header" style={{ backgroundColor: CATEGORIE.PANADE.colore }}>

                  <h2>PASTIFICIO NONNA CLAUDIA</h2>

                  <h3>🥟 PANADE - {formattaData(data)}</h3>

                </div>



                <table className="ordini-table">

                  <thead>

                    <tr>

                      <th style={{ width: '4%' }}>N°</th>

                      <th style={{ width: '8%' }}>ORA</th>

                      <th style={{ width: '32%' }}>PRODOTTO</th>

                      <th style={{ width: '10%' }}>QTÀ</th>

                      <th style={{ width: '25%' }}>CLIENTE</th>

                      <th style={{ width: '7%' }}>VIAGGIO</th>

                      <th style={{ width: '7%' }}>ALTRI</th>

                      <th style={{ width: '7%' }}>NOTE</th>

                    </tr>

                  </thead>

                  <tbody>

                    {ordiniPerCategoria.PANADE.map((item, index) => {

                      const nomeProdotto = abbreviaProdotto(item.prodotto.nome);

                      return (

                      <tr key={`panade-${index}`}>

                        {/* ✅ NUOVO: Numerazione progressiva partendo da 1 */}

                        <td className="center" style={{ fontWeight: 'bold', fontSize: '16px' }}>{index + 1}</td>

                        <td className="center">{item.oraRitiro || '-'}</td>

                        <td>

                          {nomeProdotto}

                        </td>

                        {/* ✅ Quantità sempre 1 KG o frazione per ogni riga (NO raggruppamento) */}

                        <td className="right">{item.prodotto.quantita} KG</td>

                        <td>{item.nomeCliente.toUpperCase()}</td>

                        <td className="center">{item.daViaggio ? '✈️' : ''}</td>

                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>

                        <td style={{ fontSize: '12px' }}>{getNoteCombinateFiltrateHelper(item.prodotto)}</td>

                      </tr>

                      );

                    })}

                    {/* Righe vuote per completare foglio */}
                    {(() => {
                      const righeAttuali = ordiniPerCategoria.PANADE.length;
                      const righeTarget = 25;
                      const righeVuote = Math.max(0, righeTarget - righeAttuali);
                      
                      return Array.from({ length: righeVuote }, (_, i) => (
                        <tr key={`empty-panade-${i}`} style={{ height: '30px', borderBottom: '1px solid #e0e0e0' }}>
                          <td className="center"></td>
                          <td className="center"></td>
                          <td></td>
                          <td className="right"></td>
                          <td></td>
                          <td className="center"></td>
                          <td className="center"></td>
                          <td></td>
                        </tr>
                      ));
                    })()}

                  </tbody>

                </table>



                <div className="totali">

                  {(() => {

                    const { totaleKg, totalePezziNonConvertibili, totaleEuro, dettagliKg } = calcolaTotali('PANADE');

                    return (

                      <>

                        <div className="totale-principale">

                          <strong>TOTALE PANADE:</strong> {formattaTotaliStringa(totaleKg, totalePezziNonConvertibili, totaleEuro)}

                        </div>

                        <div className="dettagli-totali">

                          {Object.entries(dettagliKg).map(([nome, kg]) => (

                            <span key={`kg-${nome}`}>• {nome}: {kg.toFixed(1)} KG</span>

                          ))}

                        </div>

                      </>

                    );

                  })()}

                </div>

              </div>

            )}


            {/* ========== PAGINA 5: ALTRI PRODOTTI (senza più panade) ========== */}

            {ordiniPerCategoria.ALTRI.length > 0 && (

              <div className="page">

                <div className="page-header" style={{ background: CATEGORIE.ALTRI.colore }}>

                  <h2>ALTRI - {formattaData(data)}</h2>

                </div>



                <table className="ordini-table">

                  <thead>

                    <tr>

                      <th style={{ width: '60px' }}>ORA</th>

                      <th style={{ width: '180px' }}>PRODOTTO</th>

                      <th style={{ width: '90px' }}>Q.TÀ</th>

                      <th style={{ width: '140px' }}>CLIENTE</th>

                      <th style={{ width: '30px' }}>🧳</th>

                      <th style={{ width: '35px' }}>+</th>

                      <th style={{ width: '165px' }}>NOTE</th>

                    </tr>

                  </thead>

                  <tbody>

                    {ordiniPerCategoria.ALTRI.map((item, index) => {

                      const nomeProdotto = abbreviaProdotto(item.prodotto.nome).toUpperCase();

                      

                      return (

                      <tr key={index} style={item.count > 1 ? { backgroundColor: '#e8f5e9', fontWeight: 'bold' } : {}}>

                        <td className="center">{item.oraRitiro}</td>

                        <td style={{ fontWeight: 'bold' }}>

                          {nomeProdotto}

                        </td>

                        {/* ✅ AGGIORNATO: Mostra quantità con moltiplicatore */}

                        <td className="right" style={{ color: item.count > 1 ? '#2e7d32' : 'inherit' }}>

                          {formattaQuantitaConCount(item.prodotto, item.count)}

                        </td>

                        <td>{item.nomeCliente.toUpperCase()}</td>

                        <td className="center">{item.daViaggio ? '✈️' : ''}</td>

                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>

                        {/* ✅ AGGIORNATO 20/11/2025: Usa note combinate */}

                        <td style={{ fontSize: '12px' }}>{getNoteCombinateFiltrateHelper(item.prodotto)}</td>

                      </tr>

                      );

                    })}

                    {/* ✅ NUOVO 21/11/2025: Righe vuote per completare foglio A4 */}
                    {(() => {
                      const righeAttuali = ordiniPerCategoria.ALTRI.length;
                      const righeTarget = 25;
                      const righeVuote = Math.max(0, righeTarget - righeAttuali);
                      
                      return Array.from({ length: righeVuote }, (_, i) => (
                        <tr key={`empty-altri-${i}`} style={{ height: '30px', borderBottom: '1px solid #e0e0e0' }}>
                          <td className="center"></td>
                          <td></td>
                          <td className="center"></td>
                          <td></td>
                          <td className="center"></td>
                          <td className="center"></td>
                          <td></td>
                        </tr>
                      ));
                    })()}

                  </tbody>

                </table>



                <div className="totali">

                  {(() => {

                    const { totaleKg, totalePezziNonConvertibili, totaleEuro, dettagliKg } = calcolaTotali('ALTRI');

                    return (

                      <>

                        <div className="totale-principale">

                          <strong>TOTALE ALTRI PRODOTTI:</strong> {formattaTotaliStringa(totaleKg, totalePezziNonConvertibili, totaleEuro)}

                        </div>

                        <div className="dettagli-totali">

                          {Object.entries(dettagliKg).map(([nome, kg]) => (

                            <span key={`kg-${nome}`}>• {nome}: {kg.toFixed(1)} KG</span>

                          ))}

                        </div>

                      </>

                    );

                  })()}

                </div>

              </div>

            )}

          </Box>

        </DialogContent>



        <DialogActions>

          <Button onClick={onClose} startIcon={<CloseIcon />}>

            Chiudi

          </Button>

          <Button 

            variant="contained" 

            onClick={handleStampa} 

            startIcon={<PrintIcon />}

          >

            🖨️ STAMPA

          </Button>

        </DialogActions>

      </Dialog>



      {/* ========== CSS STAMPA ========== */}

      <style jsx global>{`

        /* Stili schermo */

        .print-container {

          padding: 20px;

          background: #f5f5f5;

        }



        .page {

          background: white;

          padding: 30px;

          margin-bottom: 30px;

          box-shadow: 0 2px 8px rgba(0,0,0,0.1);

          border-radius: 8px;

        }



        .page-header {

          text-align: center;

          padding: 12px;

          margin: -30px -30px 15px -30px;

          border-radius: 8px 8px 0 0;

          color: white;

        }



        .page-header h2 {

          margin: 0;

          font-size: 16px;

          font-weight: bold;

        }



        .page-header h3 {

          margin: 5px 0 0 0;

          font-size: 18px;

          font-weight: normal;

        }



        .ordini-table {

          width: 100%;

          border-collapse: collapse;

          margin-top: 20px;

        }



        .ordini-table th {

          background: #2c3e50;

          color: white;

          padding: 12px 8px;

          text-align: center;

          font-size: 14px;

          font-weight: bold;

          border: 1px solid #34495e;

          white-space: nowrap;

        }



        .ordini-table td {

          padding: 10px 8px;

          border: 1px solid #ddd;

          font-size: 15px;

          white-space: nowrap;

        }



        .ordini-table tbody tr:nth-child(even) {

          background: #f9f9f9;

        }



        .ordini-table tbody tr:hover {

          background: #e3f2fd;

        }



        .center {

          text-align: center !important;

        }



        .right {

          text-align: right !important;

          font-weight: bold;

        }



        .totali {

          margin-top: 10px;

          padding: 8px;

          background: #ecf0f1;

          border-radius: 8px;

          border: 2px solid #bdc3c7;

        }



        .totali-riga {

          margin-top: 5px;

          padding: 5px 10px;

          background: #ecf0f1;

          border-radius: 4px;

          border: 1px solid #bdc3c7;

          font-size: 13px;

          color: #2c3e50;

        }



        .totale-principale {

          font-size: 16px;

          font-weight: bold;

          margin-bottom: 8px;

          color: #2c3e50;

        }



        .dettagli-totali {

          display: flex;

          flex-wrap: wrap;

          gap: 10px;

          font-size: 13px;

          color: #34495e;

        }



        /* Stili stampa */

        @media print {

          body * {

            visibility: hidden;

          }



          .print-container,

          .print-container * {

            visibility: visible;

          }



          .print-container {

            position: absolute;

            left: 0;

            top: 0;

            width: 100%;

            background: white;

            padding: 0;

          }



          .page {

            page-break-after: always;

            padding: 15mm;

            margin: 0;

            box-shadow: none;

            border-radius: 0;

          }



          @page {

            size: A4 portrait;

            margin: 10mm;

          }



          .page-header {

            margin: -15mm -15mm 8mm -15mm;

            padding: 6mm;

            border-radius: 0;

          }



          .page-header h2 {

            font-size: 14px;

          }



          .page-header h3 {

            font-size: 14px;

          }



          .ordini-table th {

            font-size: 13px;

            padding: 8px 6px;

          }



          .ordini-table td {

            font-size: 13px;

            padding: 6px 4px;

          }



          .totali {

            margin-top: 8mm;

            page-break-inside: avoid;

          }



          .totale-principale {

            font-size: 14px;

          }



          .dettagli-totali {

            font-size: 12px;

          }

        }

      `}</style>

    </>

  );

}
