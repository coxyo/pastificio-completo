// config/templateVassoi.js
// ✅ CONFIGURAZIONE VASSOI PREDEFINITI
// Template vassoi standard per ordini rapidi

/**
 * Template vassoi numerati standard
 */
export const TEMPLATE_VASSOI = {
  'vassoio_nr4_pardulas': {
    id: 'vassoio_nr4_pardulas',
    nome: 'Vassoio Nr 4 - Pardulas',
    descrizione: '4 kg di Pardulas assortite',
    categoria: 'Standard',
    icona: '🎂',
    composizione: [
      {
        nome: 'Pardulas',
        quantita: 4,
        unita: 'Kg',
        note: 'Cottura normale'
      }
    ],
    prezzoStimato: 76.00, // 4 kg × €19/kg
    numeroTagli: 4,
    packaging: 'Vassoio carta alimentare Nr 4'
  },

  'vassoio_nr6_misto': {
    id: 'vassoio_nr6_misto',
    nome: 'Vassoio Nr 6 - Dolci Misti',
    descrizione: '6 kg di dolci assortiti (Pardulas, Ciambelle, Bianchini, Amaretti)',
    categoria: 'Standard',
    icona: '🍰',
    composizione: [
      {
        nome: 'Pardulas',
        quantita: 2,
        unita: 'Kg'
      },
      {
        nome: 'Ciambelle con marmellata',
        quantita: 1.5,
        unita: 'Kg'
      },
      {
        nome: 'Bianchini',
        quantita: 1.5,
        unita: 'Kg'
      },
      {
        nome: 'Amaretti',
        quantita: 1,
        unita: 'Kg'
      }
    ],
    prezzoStimato: 114.00, // Mix calcolato
    numeroTagli: 6,
    packaging: 'Vassoio carta alimentare Nr 6'
  },

  'vassoio_30_ciambelle_miste': {
    id: 'vassoio_30_ciambelle_miste',
    nome: 'Vassoio 30 Ciambelle Miste',
    descrizione: '30 ciambelle assortite (marmellata, nutella, solo base)',
    categoria: 'Standard',
    icona: '🍩',
    composizione: [
      {
        nome: 'Ciambelle con marmellata',
        quantita: 10,
        unita: 'Pezzi',
        note: 'Marmellata albicocca'
      },
      {
        nome: 'Ciambelle con Nutella',
        quantita: 10,
        unita: 'Pezzi'
      },
      {
        nome: 'Ciambelle',
        quantita: 10,
        unita: 'Pezzi',
        note: 'Solo base senza ripieno',
        varianti: ['solo_base']
      }
    ],
    prezzoStimato: 16.00, // 30 pz = 1 kg × €16/kg
    numeroPezzi: 30,
    packaging: 'Vassoio carta alimentare'
  },

  'vassoio_nr5_pardulas_ciambelle': {
    id: 'vassoio_nr5_pardulas_ciambelle',
    nome: 'Vassoio Nr 5 - Pardulas e Ciambelle',
    descrizione: '5 kg mix Pardulas e Ciambelle',
    categoria: 'Standard',
    icona: '🎁',
    composizione: [
      {
        nome: 'Pardulas',
        quantita: 3,
        unita: 'Kg'
      },
      {
        nome: 'Ciambelle con marmellata',
        quantita: 2,
        unita: 'Kg'
      }
    ],
    prezzoStimato: 89.00, // (3 × 19) + (2 × 16)
    numeroTagli: 5,
    packaging: 'Vassoio carta alimentare Nr 5'
  },

  'vassoio_dolci_senza_ciambelle': {
    id: 'vassoio_dolci_senza_ciambelle',
    nome: 'Vassoio Dolci senza Ciambelle',
    descrizione: 'Mix dolci tradizionali escludendo ciambelle',
    categoria: 'Personalizzato',
    icona: '🧁',
    composizione: [
      {
        nome: 'Pardulas',
        quantita: 1.5,
        unita: 'Kg'
      },
      {
        nome: 'Bianchini',
        quantita: 1,
        unita: 'Kg'
      },
      {
        nome: 'Amaretti',
        quantita: 0.8,
        unita: 'Kg'
      },
      {
        nome: 'Gueffus',
        quantita: 0.7,
        unita: 'Kg'
      }
    ],
    prezzoStimato: 74.00,
    numeroTagli: 4,
    packaging: 'Vassoio personalizzato',
    note: 'Esclusione ciambelle come richiesto'
  }
};

/**
 * Categorie vassoi per organizzazione UI
 */
export const CATEGORIE_VASSOI = {
  'Standard': {
    label: 'Vassoi Standard',
    descrizione: 'Composizioni predefinite più richieste',
    icona: '⭐'
  },
  'Personalizzato': {
    label: 'Vassoi Personalizzati',
    descrizione: 'Composizioni su misura per esigenze specifiche',
    icona: '🎨'
  }
};

/**
 * ✅ Ottiene lista vassoi per categoria
 */
export function getVassoiPerCategoria(categoria) {
  return Object.values(TEMPLATE_VASSOI).filter(
    v => v.categoria === categoria
  );
}

/**
 * ✅ Ottiene template vassoio per ID
 */
export function getTemplateVassoio(templateId) {
  return TEMPLATE_VASSOI[templateId] || null;
}

/**
 * ✅ Ottiene tutti i template vassoi
 */
export function getAllTemplateVassoi() {
  return Object.values(TEMPLATE_VASSOI);
}

/**
 * ✅ Calcola prezzo effettivo vassoio in base a composizione
 * (usa calcoliPrezzi.js per calcolo accurato)
 */
export function calcolaPrezzoVassoio(composizione, calcolaPrezzoOrdine) {
  let totale = 0;

  composizione.forEach(item => {
    const risultato = calcolaPrezzoOrdine(
      item.nome,
      item.quantita,
      item.unita
    );
    totale += risultato.prezzoTotale;
  });

  return {
    totale: parseFloat(totale.toFixed(2)),
    dettaglio: composizione
  };
}

/**
 * ✅ Crea ordine da template vassoio
 */
export function creaOrdineDaTemplate(template, noteAggiuntive = '') {
  return {
    nome: template.nome,
    tipo: 'vassoio_predefinito',
    templateId: template.id,
    composizione: template.composizione,
    quantita: 1,
    unita: 'vassoio',
    prezzoStimato: template.prezzoStimato,
    note: noteAggiuntive || template.note || '',
    packaging: template.packaging,
    numeroTagli: template.numeroTagli,
    numeroPezzi: template.numeroPezzi
  };
}

/**
 * ✅ Valida composizione vassoio
 */
export function validaComposizioneVassoio(composizione) {
  const errori = [];

  if (!composizione || composizione.length === 0) {
    errori.push('Il vassoio deve contenere almeno un prodotto');
    return { valido: false, errori };
  }

  composizione.forEach((item, index) => {
    if (!item.nome) {
      errori.push(`Prodotto ${index + 1}: nome mancante`);
    }
    if (!item.quantita || item.quantita <= 0) {
      errori.push(`${item.nome}: quantità non valida`);
    }
    if (!item.unita) {
      errori.push(`${item.nome}: unità di misura mancante`);
    }
  });

  return {
    valido: errori.length === 0,
    errori
  };
}

export default {
  TEMPLATE_VASSOI,
  CATEGORIE_VASSOI,
  getVassoiPerCategoria,
  getTemplateVassoio,
  getAllTemplateVassoi,
  calcolaPrezzoVassoio,
  creaOrdineDaTemplate,
  validaComposizioneVassoio
};