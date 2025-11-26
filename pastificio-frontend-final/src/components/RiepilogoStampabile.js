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

  'Papassinas': 'Papas',

  'Gueffus': 'G',

  'Pabassine': 'Pab',

  'Ciambelle': 'C',

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

  'Gueffus': 65,

  'Ciambelle': 30,

  'Ciambelle con marmellata di albicocca': 30,

  'Ciambelle con marmellata di ciliegia': 30,

  'Ciambelle con nutella': 30,

  'Ciambelle con zucchero a velo': 30,

  'Ciambelle semplici': 30,

  

  // Pasta

  'Pizzette sfoglia': 30

};



// ✅ Prodotti venduti SOLO a pezzo (non convertibili in Kg)

const SOLO_PEZZO = ['Sebadas', 'Panadine'];



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

    prodotti: ['Amaretti', 'Bianchini', 'Papassinas', 'Gueffus', 'Ciambelle', 

               'Sebadas', 'Torta di saba', 'Vassoio', 'Dolci misti', 'Pabassine'],

    colore: '#FFE66D'

  },

  ALTRI: {

    nome: 'ALTRI PRODOTTI',

    prodotti: ['Panada', 'Panadine', 'Fregula', 'Pizzette', 'Pasta', 'Sfoglia'],

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

  return ABBREVIAZIONI[nome] || nome;

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
  if (nomeLC.includes('ciambelle')) {
    return 'Ciambelle';
  }
  
  // Pardulas - tutte le varianti diventano "Pardulas"
  if (nomeLC.includes('pardulas')) {
    return 'Pardulas';
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

  

  return null;

};



// ✅ Verifica se prodotto è solo pezzo

const isSoloPezzo = (nomeProdotto) => {

  return SOLO_PEZZO.some(p => nomeProdotto.toLowerCase().includes(p.toLowerCase()));

};



// ✅ AGGIORNATO 26/11/2025: Estrae composizione prodotto abbreviata (es: "C 0,5 A 0,3 B 0,1")

const getComposizioneProdotto = (prodotto) => {

  if (!prodotto.dettagliCalcolo || !prodotto.dettagliCalcolo.dettagli) {

    return '';

  }

  

  const dettagli = prodotto.dettagliCalcolo.dettagli;

  

  // Se è una stringa tipo "0,3A 0,3P 0,3B" o "PA", puliscila e formattala

  if (typeof dettagli === 'string') {

    // Converti "0.3A 0.3P" in "A 0,3 P 0,3"

    return dettagli

      .replace(/(\d+\.?\d*)\s*([A-Z])/gi, '$2 $1')

      .replace(/\./g, ',')

      .toUpperCase()

      .trim();

  }

  

  // Parsing dalla composizione array

  if (prodotto.dettagliCalcolo.composizione && Array.isArray(prodotto.dettagliCalcolo.composizione)) {

    return prodotto.dettagliCalcolo.composizione

      .map(item => {

        const abbr = abbreviaProdotto(item.nome);

        const qta = item.quantita.toString().replace('.', ',');

        return `${abbr} ${qta}`;

      })

      .join(' ')

      .toUpperCase();

  }

  

  return '';

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

          return acc + (comp.quantita / pezziPerKg);

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



// ✅ AGGIORNATO 26/11/2025: Formatta quantità con moltiplicatore in MAIUSCOLO

const formattaQuantitaConCount = (prodotto, count) => {

  const qta = prodotto.quantita || 0;

  const unita = prodotto.unita || 'Kg';

  const unitaNorm = unita.toLowerCase();

  

  // ✅ Per vassoi, calcola peso totale dalla composizione

  if (unita === 'vassoio' && prodotto.dettagliCalcolo?.composizione) {

    let pesoTotale = 0;

    let prezzoTotale = prodotto.prezzo || 0;

    

    prodotto.dettagliCalcolo.composizione.forEach(comp => {

      if (comp.unita === 'Kg') {

        pesoTotale += comp.quantita;

      } else if (comp.unita === 'Pezzi') {

        const pezziPerKg = getPezziPerKg(comp.nome);

        if (pezziPerKg && !isSoloPezzo(comp.nome)) {

          pesoTotale += comp.quantita / pezziPerKg;

        }

      }

    });

    

    // Mostra peso se > 0, altrimenti prezzo

    if (pesoTotale > 0) {

      return count > 1 ? `${count} X ${pesoTotale.toFixed(1)} KG` : `${pesoTotale.toFixed(1)} KG`;

    } else if (prezzoTotale > 0) {

      return count > 1 ? `${count} X €${prezzoTotale.toFixed(0)}` : `€${prezzoTotale.toFixed(0)}`;

    }

    

    return count > 1 ? `${count} X 1 VASS` : '1 VASS';

  } else if (unitaNorm === 'pezzi' || unitaNorm === 'pz') {

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

        

        // ✅ Chiave: CLIENTE + PRODOTTO + QUANTITÀ + UNITÀ

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

      

      // ✅ Gestione vassoi

      if (unitaNorm === 'vassoio' && prodotto.dettagliCalcolo?.composizione) {

        prodotto.dettagliCalcolo.composizione.forEach(comp => {

          if (comp.unita === 'Kg') {

            totaleKg += comp.quantita * moltiplicatore;

            const nomeNorm = normalizzaNomeProdotto(comp.nome);

            dettagliKg[nomeNorm] = (dettagliKg[nomeNorm] || 0) + comp.quantita * moltiplicatore;

          } else if (comp.unita === 'Pezzi') {

            const pezziPerKg = getPezziPerKg(comp.nome);

            if (pezziPerKg && !isSoloPezzo(comp.nome)) {

              const kgEquivalenti = comp.quantita / pezziPerKg * moltiplicatore;

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

          const kgEquivalenti = prodotto.quantita / pezziPerKg * moltiplicatore;

          totaleKg += kgEquivalenti;

          const nomeNorm = normalizzaNomeProdotto(prodotto.nome);

          dettagliKg[nomeNorm] = (dettagliKg[nomeNorm] || 0) + kgEquivalenti;

        } else {

          totalePezziNonConvertibili += prodotto.quantita * moltiplicatore;

          const nomeNorm = normalizzaNomeProdotto(prodotto.nome);

          dettagliPezzi[nomeNorm] = (dettagliPezzi[nomeNorm] || 0) + prodotto.quantita * moltiplicatore;

        }

      } else if (unitaNorm === '€' || unitaNorm === 'euro') {

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



  // ✅ AGGIORNATO 26/11/2025: Helper per formattare la stringa totali in MAIUSCOLO

  const formattaTotaliStringa = (totaleKg, totalePezzi, totaleEuro) => {

    const parti = [];

    if (totaleKg > 0) parti.push(`${totaleKg.toFixed(1)} KG`);

    if (totalePezzi > 0) parti.push(`${totalePezzi} PZ`);

    if (totaleEuro > 0) parti.push(`€${totaleEuro.toFixed(2)}`);

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

                      <th style={{ width: '50px' }}>ORA</th>

                      <th style={{ width: '35px' }}>SPIN</th>

                      <th style={{ width: '35px' }}>ZAFF</th>

                      <th style={{ width: '40px' }}>DOLCI</th>

                      <th style={{ width: '40px' }}>CULUR</th>

                      <th style={{ width: '40px' }}>FORM</th>

                      <th style={{ width: '80px' }}>Q.TÀ</th>

                      <th style={{ width: '25px' }}>🧳</th>

                      <th style={{ width: '100px' }}>CLIENTE</th>

                      <th style={{ width: '30px' }}>+</th>

                      <th style={{ width: '100px' }}>NOTE</th>

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

                          <td className="center">{item.daViaggio ? '✓' : ''}</td>

                          <td>{item.nomeCliente.toUpperCase()}</td>

                          <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>

                          <td style={{ fontSize: '10px' }}>{noteRavioli}</td>

                        </tr>

                      );

                    })}

                    
                    {/* ✅ NUOVO 21/11/2025: Righe vuote per completare foglio A4 */}
                    {(() => {
                      const righeAttuali = ordiniPerCategoria.RAVIOLI.length;
                      const righeTarget = 30;
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

                    const { totaleKg, totalePezziNonConvertibili, totaleEuro, dettagliKg, dettagliPezzi } = calcolaTotali('RAVIOLI');

                    return (

                      <span>

                        <strong>TOT: {formattaTotaliStringa(totaleKg, totalePezziNonConvertibili, totaleEuro)}</strong>

                        {Object.entries(dettagliKg).map(([nome, kg]) => (

                          <span key={`kg-${nome}`} style={{ marginLeft: '15px' }}>{nome}: {kg.toFixed(1)} KG</span>

                        ))}

                        {Object.entries(dettagliPezzi).map(([nome, pz]) => (

                          <span key={`pz-${nome}`} style={{ marginLeft: '15px' }}>{nome}: {pz} PZ</span>

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

                      <th style={{ width: '150px' }}>PRODOTTO</th>

                      <th style={{ width: '100px' }}>Q.TÀ</th>

                      <th style={{ width: '150px' }}>CLIENTE</th>

                      <th style={{ width: '40px' }}>🧳</th>

                      <th style={{ width: '40px' }}>+</th>

                      <th style={{ width: '150px' }}>NOTE</th>

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

                        <td className="center">{item.daViaggio ? '✓' : ''}</td>

                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>

                        {/* ✅ AGGIORNATO 20/11/2025: Usa note combinate */}

                        <td style={{ fontSize: '10px' }}>{getNoteCombinateFiltrateHelper(item.prodotto)}</td>

                      </tr>

                      );

                    })}

                    {/* ✅ NUOVO 21/11/2025: Righe vuote per completare foglio A4 */}
                    {(() => {
                      const righeAttuali = ordiniPerCategoria.PARDULAS.length;
                      const righeTarget = 30;
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

                    const { totaleKg, totalePezziNonConvertibili, totaleEuro, dettagliKg, dettagliPezzi } = calcolaTotali('PARDULAS');

                    return (

                      <span>

                        <strong>TOT: {formattaTotaliStringa(totaleKg, totalePezziNonConvertibili, totaleEuro)}</strong>

                        {Object.entries(dettagliKg).map(([nome, kg]) => (

                          <span key={`kg-${nome}`} style={{ marginLeft: '15px' }}>{nome}: {kg.toFixed(1)} KG</span>

                        ))}

                        {Object.entries(dettagliPezzi).map(([nome, pz]) => (

                          <span key={`pz-${nome}`} style={{ marginLeft: '15px' }}>{nome}: {pz} PZ</span>

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

                      <th style={{ width: '200px' }}>PRODOTTO</th>

                      <th style={{ width: '100px' }}>Q.TÀ</th>

                      <th style={{ width: '150px' }}>CLIENTE</th>

                      <th style={{ width: '40px' }}>🧳</th>

                      <th style={{ width: '40px' }}>+</th>

                      <th style={{ width: '200px' }}>NOTE</th>

                    </tr>

                  </thead>

                  <tbody>

                    {ordiniPerCategoria.DOLCI.map((item, index) => {

                      const composizione = getComposizioneProdotto(item.prodotto);

                      let nomeProdotto;

                      

                      // ✅ Per vassoi, mostra SOLO la composizione abbreviata (es: "C 0,5 A 0,3 G 0,1 B 0,1")

                      if (item.prodotto.nome === 'Vassoio Dolci Misti' || item.prodotto.unita === 'vassoio') {

                        nomeProdotto = composizione || 'VASSOIO';

                      } else {

                        nomeProdotto = abbreviaProdotto(item.prodotto.nome).toUpperCase();

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

                        <td className="center">{item.daViaggio ? '✓' : ''}</td>

                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>

                        {/* ✅ AGGIORNATO 20/11/2025: Usa note combinate */}

                        <td style={{ fontSize: '10px' }}>{getNoteCombinateFiltrateHelper(item.prodotto)}</td>

                      </tr>

                      );

                    })}

                    {/* ✅ NUOVO 21/11/2025: Righe vuote per completare foglio A4 */}
                    {(() => {
                      const righeAttuali = ordiniPerCategoria.DOLCI.length;
                      const righeTarget = 30;
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

                    const { totaleKg, totalePezziNonConvertibili, totaleEuro, dettagliKg, dettagliPezzi } = calcolaTotali('DOLCI');

                    return (

                      <span>

                        <strong>TOT: {formattaTotaliStringa(totaleKg, totalePezziNonConvertibili, totaleEuro)}</strong>

                        {Object.entries(dettagliKg).map(([nome, kg]) => (

                          <span key={`kg-${nome}`} style={{ marginLeft: '15px' }}>{nome}: {kg.toFixed(1)} KG</span>

                        ))}

                        {Object.entries(dettagliPezzi).map(([nome, pz]) => (

                          <span key={`pz-${nome}`} style={{ marginLeft: '15px' }}>{nome}: {pz} PZ</span>

                        ))}

                      </span>

                    );

                  })()}

                </div>

              </div>

            )}



            {/* ========== FOGLIO 4: ALTRI PRODOTTI ========== */}

            {ordiniPerCategoria.ALTRI.length > 0 && (

              <div className="page">

                <div className="page-header" style={{ background: CATEGORIE.ALTRI.colore }}>

                  <h2>ALTRI - {formattaData(data)}</h2>

                </div>



                <table className="ordini-table">

                  <thead>

                    <tr>

                      <th style={{ width: '60px' }}>ORA</th>

                      <th style={{ width: '200px' }}>PRODOTTO</th>

                      <th style={{ width: '100px' }}>Q.TÀ</th>

                      <th style={{ width: '150px' }}>CLIENTE</th>

                      <th style={{ width: '40px' }}>🧳</th>

                      <th style={{ width: '40px' }}>+</th>

                      <th style={{ width: '200px' }}>NOTE</th>

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

                        <td className="center">{item.daViaggio ? '✓' : ''}</td>

                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>

                        {/* ✅ AGGIORNATO 20/11/2025: Usa note combinate */}

                        <td style={{ fontSize: '10px' }}>{getNoteCombinateFiltrateHelper(item.prodotto)}</td>

                      </tr>

                      );

                    })}

                    {/* ✅ NUOVO 21/11/2025: Righe vuote per completare foglio A4 */}
                    {(() => {
                      const righeAttuali = ordiniPerCategoria.ALTRI.length;
                      const righeTarget = 30;
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

                    const { totaleKg, totalePezziNonConvertibili, totaleEuro, dettagliKg, dettagliPezzi } = calcolaTotali('ALTRI');

                    return (

                      <>

                        <div className="totale-principale">

                          <strong>TOTALE ALTRI PRODOTTI:</strong> {formattaTotaliStringa(totaleKg, totalePezziNonConvertibili, totaleEuro)}

                        </div>

                        <div className="dettagli-totali">

                          {Object.entries(dettagliKg).map(([nome, kg]) => (

                            <span key={`kg-${nome}`}>• {nome}: {kg.toFixed(1)} KG</span>

                          ))}

                          {Object.entries(dettagliPezzi).map(([nome, pz]) => (

                            <span key={`pz-${nome}`}>• {nome}: {pz} PZ</span>

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

          font-size: 18px;

          font-weight: bold;

        }



        .page-header h3 {

          margin: 5px 0 0 0;

          font-size: 16px;

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

          font-size: 12px;

          font-weight: bold;

          border: 1px solid #34495e;

        }



        .ordini-table td {

          padding: 10px 8px;

          border: 1px solid #ddd;

          font-size: 13px;

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

          font-size: 11px;

          color: #2c3e50;

        }



        .totale-principale {

          font-size: 14px;

          font-weight: bold;

          margin-bottom: 8px;

          color: #2c3e50;

        }



        .dettagli-totali {

          display: flex;

          flex-wrap: wrap;

          gap: 10px;

          font-size: 11px;

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

            font-size: 16px;

          }



          .page-header h3 {

            font-size: 12px;

          }



          .ordini-table th {

            font-size: 11px;

            padding: 8px 6px;

          }



          .ordini-table td {

            font-size: 11px;

            padding: 6px 4px;

          }



          .totali {

            margin-top: 8mm;

            page-break-inside: avoid;

          }



          .totale-principale {

            font-size: 12px;

          }



          .dettagli-totali {

            font-size: 10px;

          }

        }

      `}</style>

    </>

  );

}
