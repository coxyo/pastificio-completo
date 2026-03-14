// controllers/listinoController.js
// Genera listino prezzi PDF leggendo dal database
// Usa solo prodotti con includiInListino: true
// Raggruppa varianti dello stesso prodotto base

import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Prodotto from '../models/Prodotto.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── Colori ───────────────────────────────────────────────────────
const VERDE     = '#1A3D0F';
const VERDE_MED = '#2E6B1A';
const ORO       = '#C8A830';
const NERO      = '#111111';
const GRIGIO_SC = '#444444';
const GRIGIO    = '#222222';
const BIANCO    = '#FFFFFF';
const CREMA     = '#F5F0E2';
const CREMA_FTR = '#F7F2E4';

// ── Misure ───────────────────────────────────────────────────────
const mm      = 2.8346;
const PAGE_W  = 210 * mm;
const PAGE_H  = 297 * mm;
const MARGIN  = 9 * mm;
const ROW_H   = 15 * mm;
const ICON_R  = (5.5 * mm) / 2;
const FOOTER_H = 14 * mm;
const FOOTER_Y_TOP = PAGE_H - FOOTER_H - MARGIN;

// ── Allergeni ────────────────────────────────────────────────────
const ALLERG_COL = {
  'Glutine':         '#E07800',
  'Uova':            '#C8A800',
  'Latte':           '#2878C0',
  'Frutta a guscio': '#7A3800',
  'Pesce':           '#0050A0',
  'Sedano':          '#4A8020',
  'Soia':            '#608820',
  'Senape':          '#B09000',
};
const ALLERG_SYM = {
  'Glutine': 'G', 'Uova': 'U', 'Latte': 'L',
  'Frutta a guscio': 'F', 'Pesce': 'P',
  'Sedano': 'Se', 'Soia': 'So', 'Senape': 'Sn',
};
const ALLERG_LEGENDA = ['Glutine','Uova','Latte','Frutta a guscio','Pesce'];

// ── Helpers grafici ───────────────────────────────────────────────
function drawIcon(doc, name, cx, cy, r) {
  const col = ALLERG_COL[name] || '#888888';
  const sym = ALLERG_SYM[name] || name[0];
  doc.save()
    .circle(cx, cy, r).fill(col)
    .circle(cx, cy, r).lineWidth(0.8).stroke(BIANCO);
  const fs = sym.length === 1 ? r * 1.1 : r * 0.85;
  doc.fontSize(fs).fillColor(BIANCO).font('Helvetica-Bold');
  const tw = doc.widthOfString(sym);
  doc.text(sym, cx - tw / 2, cy - fs * 0.38, { lineBreak: false });
  doc.restore();
}

function drawIconsRow(doc, allergeni, x, cy, r) {
  let cx = x + r;
  for (const name of (allergeni || [])) {
    drawIcon(doc, name, cx, cy, r);
    cx += r * 2 + 1.5 * mm;
  }
}

function drawCatTitle(doc, title, x, y, w) {
  const h = 10 * mm;
  doc.save()
    .roundedRect(x, y, w, h, 2.5 * mm).fill(VERDE_MED)
    .roundedRect(x, y, 4.5 * mm, h, 2 * mm).fill(ORO);
  doc.fontSize(12).fillColor(BIANCO).font('Helvetica-Bold')
    .text(title.toUpperCase(), x + 8 * mm, y + 3 * mm, { lineBreak: false });
  doc.restore();
  return y + h + 2 * mm;
}

function drawProductRow(doc, nome, prezzo, allergeni, ingredienti, x, y, w, alt) {
  if (alt) {
    doc.save().rect(x, y, w, ROW_H).fill(CREMA).restore();
  }
  doc.save()
    .moveTo(x + 2 * mm, y + ROW_H)
    .lineTo(x + w - 2 * mm, y + ROW_H)
    .lineWidth(0.3).stroke('#D0C8B0');
  doc.restore();

  const nomeW  = w * 0.47;
  const iconsX = x + nomeW + 2 * mm;

  // Nome
  const maxNome = Math.floor(nomeW / 6.8);
  const nomeT   = nome.length > maxNome ? nome.slice(0, maxNome - 1) + '…' : nome;
  doc.fontSize(12).fillColor(NERO).font('Helvetica-Bold')
    .text(nomeT, x + 2.5 * mm, y + 3.5 * mm, { lineBreak: false });

  // Ingredienti in nero scuro
  const maxIng = Math.floor(nomeW / 5.0);
  const ingT   = ingredienti && ingredienti.length > maxIng
    ? ingredienti.slice(0, maxIng - 1) + '…' : (ingredienti || '');
  doc.fontSize(7.5).fillColor(GRIGIO).font('Helvetica-Oblique')
    .text(ingT, x + 2.5 * mm, y + 8.5 * mm, { lineBreak: false });

  // Icone allergeni
  if (allergeni && allergeni.length > 0) {
    drawIconsRow(doc, allergeni, iconsX, y + ROW_H / 2, ICON_R);
  }

  // Prezzo
  doc.fontSize(15).fillColor(VERDE).font('Helvetica-Bold');
  const tw = doc.widthOfString(prezzo);
  doc.text(prezzo, x + w - 2 * mm - tw, y + 3.8 * mm, { lineBreak: false });

  return y + ROW_H;
}

function formatPrezzo(p) {
  if (p.prezzoKg > 0)    return `€ ${p.prezzoKg.toFixed(2).replace('.', ',')}/Kg`;
  if (p.prezzoPezzo > 0) return `€ ${p.prezzoPezzo.toFixed(2).replace('.', ',')}/pz`;
  return '—';
}

function drawFooter(doc) {
  doc.save()
    .rect(0, PAGE_H - FOOTER_H - MARGIN, PAGE_W, FOOTER_H + MARGIN)
    .fill(CREMA_FTR);
  doc.restore();
  doc.save()
    .moveTo(MARGIN, FOOTER_Y_TOP)
    .lineTo(PAGE_W - MARGIN, FOOTER_Y_TOP)
    .lineWidth(1.5).stroke(ORO);
  doc.restore();

  const lyTop = FOOTER_Y_TOP + 3 * mm;
  const lyBot = PAGE_H - MARGIN - 3 * mm;

  doc.fontSize(8).fillColor(GRIGIO_SC).font('Helvetica-Bold')
    .text('ALLERGENI:', MARGIN, lyTop, { lineBreak: false });

  let lx = MARGIN + 38 * mm;
  for (const name of ALLERG_LEGENDA) {
    const cx = lx + ICON_R;
    drawIcon(doc, name, cx, lyTop + 2.5 * mm, ICON_R);
    doc.fontSize(7).fillColor(GRIGIO_SC).font('Helvetica-Bold');
    const tw = doc.widthOfString(name);
    doc.text(name, cx - tw / 2, lyBot - 2 * mm, { lineBreak: false });
    lx += ICON_R * 2 + 2 * mm + Math.max(tw, 10 * mm) - ICON_R;
  }

  doc.fontSize(7.5).fillColor(GRIGIO_SC).font('Helvetica-Oblique');
  const nota = '★ prodotto congelato  ·  Prezzi IVA inclusa';
  const notaW = doc.widthOfString(nota);
  doc.text(nota, PAGE_W - MARGIN - notaW, lyBot - 2 * mm, { lineBreak: false });
}

function drawHeaderPag1(doc) {
  const HDR_H = 38 * mm;

  // Sfondo bianco header
  doc.save().rect(0, 0, PAGE_W, HDR_H).fill(BIANCO).restore();

  // Linee decorative in fondo all'header
  doc.save().moveTo(0, HDR_H).lineTo(PAGE_W, HDR_H).lineWidth(3).stroke(ORO).restore();
  doc.save().moveTo(0, HDR_H + 1.5 * mm).lineTo(PAGE_W, HDR_H + 1.5 * mm).lineWidth(1.2).stroke(VERDE).restore();

  // ── ZONA SINISTRA: logo ──────────────────────────────────────────
  const logoH = HDR_H - 6 * mm;
  const logoW = logoH * (2402 / 1622);
  try {
    const logoPath = path.join(__dirname, '../assets/logo.png');
    doc.image(logoPath, MARGIN, 3 * mm, { width: logoW, height: logoH });
  } catch { /* logo non trovato */ }

  // ── ZONA DESTRA: contatti ────────────────────────────────────────
  const contatti = [
    'Via Carmine 20/B · Assemini (CA)',
    'Tel. 389 887 9833',
    'info@pastificiodc.it',
  ];
  doc.fontSize(8).fillColor(GRIGIO_SC).font('Helvetica');
  contatti.forEach((line, i) => {
    const tw = doc.widthOfString(line);
    doc.text(line, PAGE_W - MARGIN - tw, 6 * mm + i * 7 * mm, { lineBreak: false });
  });

  // ── ZONA CENTRO: titoli ──────────────────────────────────────────
  // La zona centro è tra la fine del logo e l'inizio dei contatti
  const contattoMaxW = 52 * mm; // larghezza stimata colonna destra
  const centroX  = MARGIN + logoW + 3 * mm;
  const centroW  = PAGE_W - centroX - contattoMaxW - MARGIN;

  // Nome pastificio centrato nella zona centro
  doc.fontSize(20).fillColor(VERDE).font('Times-BoldItalic')
    .text('Pastificio Nonna Claudia', centroX, 7 * mm, {
      width: centroW, align: 'center', lineBreak: false
    });

  // LISTINO PREZZI
  doc.fontSize(13).fillColor(ORO).font('Helvetica-Bold')
    .text('LISTINO PREZZI', centroX, 19 * mm, {
      width: centroW, align: 'center', lineBreak: false
    });

  // Data aggiornamento
  const oggi = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.fontSize(7.5).fillColor(GRIGIO_SC).font('Helvetica-Oblique')
    .text(`aggiornato al ${oggi}`, centroX, 27 * mm, {
      width: centroW, align: 'center', lineBreak: false
    });

  return HDR_H + 5 * mm;
}

function drawHeaderSimple(doc) {
  const HDR_H = 18 * mm;
  doc.save().rect(0, 0, PAGE_W, HDR_H).fill(BIANCO).restore();
  doc.save().moveTo(0, HDR_H).lineTo(PAGE_W, HDR_H).lineWidth(2.5).stroke(ORO).restore();
  doc.save().moveTo(0, HDR_H + 1 * mm).lineTo(PAGE_W, HDR_H + 1 * mm).lineWidth(0.8).stroke(VERDE).restore();

  const logoH = HDR_H - 3 * mm;
  const logoW = logoH * (2402 / 1622);

  try {
    const logoPath = path.join(__dirname, '../assets/logo.png');
    doc.image(logoPath, MARGIN, 1.5 * mm, { width: logoW, height: logoH });
  } catch { /* logo non trovato */ }

  // Nome centrato nella zona a destra del logo
  const testoX = MARGIN + logoW + 3 * mm;
  const testoW = PAGE_W - testoX - MARGIN;
  doc.fontSize(11).fillColor(VERDE).font('Times-BoldItalic')
    .text('Pastificio Nonna Claudia', testoX, (HDR_H - 11 * 0.352) / 2 - 0.5 * mm, {
      width: testoW, align: 'center', lineBreak: false
    });

  return HDR_H + 3 * mm;
}

// ── Raggruppa varianti ────────────────────────────────────────────
// Se più prodotti hanno lo stesso "nome base" (es. "Ciambelle"), li unisce
// mostrando una sola riga con prezzo del prodotto principale
function raggruppaVarianti(prodotti) {
  const gruppi = new Map();

  for (const p of prodotti) {
    // Trova nome base: rimuovi suffissi tipo "con marmellata", "con nutella", "solo base", "al mirto"
    // Logica semplice: se il nome contiene un separatore come "c.", "con", "al", "solo" → prende la parola prima
    const parole = p.nome.split(/\s+/);
    let nomeBase = p.nome;

    // Pattern varianti comuni
    const variantiKeywords = ['con', 'c.', 'solo', 'al', 'alla', 'e', 'misti'];
    const primaParolaVariante = parole.findIndex(w => variantiKeywords.includes(w.toLowerCase()));
    if (primaParolaVariante > 0) {
      nomeBase = parole.slice(0, primaParolaVariante).join(' ');
    }

    if (!gruppi.has(nomeBase)) {
      gruppi.set(nomeBase, {
        prodottoBase: p,        // primo prodotto = quello principale
        varianti:    [],
        nomeBase,
      });
    } else {
      gruppi.get(nomeBase).varianti.push(p);
    }
  }

  return [...gruppi.values()];
}

// ── CONTROLLER ───────────────────────────────────────────────────
export const generaListinoPDF = async (req, res) => {
  try {
    // Legge solo prodotti attivi con includiInListino: true
    const tuttiProdotti = await Prodotto.find({
      attivo: true,
      includiInListino: true,
    })
      .sort({ ordinamento: 1, nome: 1 })
      .lean();

    if (tuttiProdotti.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nessun prodotto da includere nel listino. Abilita "Includi nel listino" nella scheda prodotto.'
      });
    }

    // Raggruppa per categoria
    const dolci   = tuttiProdotti.filter(p => p.categoria === 'Dolci');
    const panadas  = tuttiProdotti.filter(p => p.categoria === 'Panadas');
    const ravioli  = tuttiProdotti.filter(p => p.categoria === 'Ravioli');
    const pasta    = tuttiProdotti.filter(p => p.categoria === 'Pasta');
    const pardulas = tuttiProdotti.filter(p => p.categoria === 'Pardulas');
    const altro    = tuttiProdotti.filter(p => !['Dolci','Panadas','Ravioli','Pasta','Pardulas'].includes(p.categoria));

    // Raggruppa varianti per Dolci (ciambelle vari gusti, ecc.)
    const dolciGruppi  = raggruppaVarianti(dolci);
    const panadasGruppi = raggruppaVarianti(panadas);

    // ── Crea PDF ─────────────────────────────────────────────────
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: 'Listino Prezzi – Pastificio Nonna Claudia' } });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="listino-prezzi-${new Date().toISOString().split('T')[0]}.pdf"`);
    doc.pipe(res);

    const CONTENT_BOTTOM = FOOTER_Y_TOP - 2 * mm;

    // ── PAG 1: DOLCI ─────────────────────────────────────────────
    let y = drawHeaderPag1(doc);
    drawFooter(doc);

    const allDolci = [...dolciGruppi];
    // Aggiungi Pardulas ai dolci se ci sono
    if (pardulas.length > 0) {
      allDolci.push(...raggruppaVarianti(pardulas));
    }

    if (allDolci.length > 0) {
      y = drawCatTitle(doc, 'Dolci Tradizionali e Specialità', MARGIN, y, PAGE_W - 2 * MARGIN);
      let rowIdx = 0;
      for (const gruppo of allDolci) {
        if (y + ROW_H > CONTENT_BOTTOM) break;
        const p = gruppo.prodottoBase;
        const nomeDisplay = gruppo.varianti.length > 0
          ? `${gruppo.nomeBase} (vari gusti)`
          : p.nome;
        y = drawProductRow(
          doc,
          nomeDisplay,
          formatPrezzo(p),
          p.allergeni || [],
          p.ingredientiListino || '',
          MARGIN, y, PAGE_W - 2 * MARGIN,
          rowIdx % 2 === 1
        );
        rowIdx++;
      }
    }

    // ── PAG 2: SA PANADA ─────────────────────────────────────────
    if (panadasGruppi.length > 0) {
      doc.addPage();
      y = drawHeaderSimple(doc);
      drawFooter(doc);

      y = drawCatTitle(doc, 'Sa Panada — La Tradizione di Assemini', MARGIN, y, PAGE_W - 2 * MARGIN);

      // Sottotitolo
      doc.fontSize(8.5).fillColor(GRIGIO_SC).font('Helvetica-BoldOblique')
        .text('Pasta lavorata a mano · Cotta al forno · Con patate o piselli', MARGIN, y, {
          align: 'center', lineBreak: false, width: PAGE_W - 2 * MARGIN
        });
      y += 5 * mm;

      let rowIdx = 0;
      for (const gruppo of panadasGruppi) {
        if (y + ROW_H > CONTENT_BOTTOM) break;
        const p = gruppo.prodottoBase;
        y = drawProductRow(
          doc, p.nome, formatPrezzo(p),
          p.allergeni || [], p.ingredientiListino || '',
          MARGIN, y, PAGE_W - 2 * MARGIN, rowIdx % 2 === 1
        );
        rowIdx++;
      }
    }

    // ── PAG 3: PASTA FRESCA ──────────────────────────────────────
    const pastaEravioli = [...raggruppaVarianti(ravioli), ...raggruppaVarianti(pasta)];
    if (pastaEravioli.length > 0 || altro.length > 0) {
      doc.addPage();
      y = drawHeaderSimple(doc);
      drawFooter(doc);

      if (ravioli.length > 0) {
        y = drawCatTitle(doc, 'Ravioli & Culurgiones', MARGIN, y, PAGE_W - 2 * MARGIN);
        let rowIdx = 0;
        for (const gruppo of raggruppaVarianti(ravioli)) {
          if (y + ROW_H > CONTENT_BOTTOM) break;
          const p = gruppo.prodottoBase;
          const nomeDisplay = gruppo.varianti.length > 0 ? `${gruppo.nomeBase} (vari varianti)` : p.nome;
          y = drawProductRow(doc, nomeDisplay, formatPrezzo(p), p.allergeni || [], p.ingredientiListino || '',
            MARGIN, y, PAGE_W - 2 * MARGIN, rowIdx % 2 === 1);
          rowIdx++;
        }
        y += 4 * mm;
      }

      if (pasta.length > 0) {
        y = drawCatTitle(doc, 'Pasta Fresca', MARGIN, y, PAGE_W - 2 * MARGIN);
        let rowIdx = 0;
        for (const gruppo of raggruppaVarianti(pasta)) {
          if (y + ROW_H > CONTENT_BOTTOM) break;
          const p = gruppo.prodottoBase;
          y = drawProductRow(doc, p.nome, formatPrezzo(p), p.allergeni || [], p.ingredientiListino || '',
            MARGIN, y, PAGE_W - 2 * MARGIN, rowIdx % 2 === 1);
          rowIdx++;
        }
      }

      // Altre categorie eventuali
      if (altro.length > 0) {
        y += 4 * mm;
        y = drawCatTitle(doc, 'Altro', MARGIN, y, PAGE_W - 2 * MARGIN);
        let rowIdx = 0;
        for (const p of altro) {
          if (y + ROW_H > CONTENT_BOTTOM) break;
          y = drawProductRow(doc, p.nome, formatPrezzo(p), p.allergeni || [], p.ingredientiListino || '',
            MARGIN, y, PAGE_W - 2 * MARGIN, rowIdx % 2 === 1);
          rowIdx++;
        }
      }
    }

    doc.end();
    logger.info(`Listino PDF generato: ${tuttiProdotti.length} prodotti`);

  } catch (error) {
    logger.error('Errore generazione listino PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Errore generazione listino', error: error.message });
    }
  }
};