// controllers/listinoController.js
// Genera il listino prezzi PDF leggendo i prodotti dal database
import PDFDocument from 'pdfkit';
import Prodotto from '../models/Prodotto.js';
import logger from '../config/logger.js';

// ── Palette colori (identica al listino manuale) ─────────────────
const VERDE     = '#1A3D0F';
const VERDE_MED = '#2E6B1A';
const ORO       = '#C8A830';
const NERO      = '#111111';
const GRIGIO_SC = '#444444';
const GRIGIO    = '#222222';
const BIANCO    = '#FFFFFF';
const CREMA     = '#F5F0E2';
const CREMA_FTR = '#F7F2E4';

// ── Dati allergeni ───────────────────────────────────────────────
const ALLERG_COLORS = {
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

// A4 verticale in punti (1mm = 2.8346 pt)
const mm = 2.8346;
const PAGE_W = 210 * mm;
const PAGE_H = 297 * mm;
const MARGIN  = 9 * mm;
const ROW_H   = 15 * mm;
const ICON_R  = (5.5 * mm) / 2;
const FOOTER_H = 14 * mm;
const FOOTER_Y = MARGIN + FOOTER_H;

// ── Helper: disegna cerchio allergene ────────────────────────────
function drawIcon(doc, name, cx, cy, r) {
  const col = ALLERG_COLORS[name] || '#888888';
  const sym = ALLERG_SYM[name] || name[0];

  // Cerchio colorato
  doc.save()
    .circle(cx, cy, r)
    .fill(col);

  // Bordo bianco sottile
  doc.circle(cx, cy, r)
    .lineWidth(0.8)
    .stroke(BIANCO);

  // Lettera centrata
  const fs = sym.length === 1 ? r * 1.1 : r * 0.85;
  doc.fontSize(fs)
    .fillColor(BIANCO)
    .font('Helvetica-Bold');

  const tw = doc.widthOfString(sym);
  doc.text(sym, cx - tw / 2, cy - fs * 0.38, { lineBreak: false });
  doc.restore();
}

function drawIconsRow(doc, allergeni, x, cy, r) {
  let cx = x + r;
  for (const name of allergeni) {
    drawIcon(doc, name, cx, cy, r);
    cx += r * 2 + 1.5 * mm;
  }
}

// ── Helper: titolo categoria ─────────────────────────────────────
function drawCatTitle(doc, title, x, y, w) {
  const h = 10 * mm;
  // Sfondo verde
  doc.save()
    .roundedRect(x, y, w, h, 2.5 * mm)
    .fill(VERDE_MED);
  // Striscia ORO sinistra
  doc.roundedRect(x, y, 4.5 * mm, h, 2 * mm)
    .fill(ORO);
  // Testo
  doc.fontSize(12)
    .fillColor(BIANCO)
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), x + 8 * mm, y + 3 * mm, { lineBreak: false });
  doc.restore();
  return y + h + 2 * mm;
}

// ── Helper: riga prodotto ─────────────────────────────────────────
function drawProductRow(doc, prod, x, y, w, alt) {
  const { nome, prezzo, allergeni, ingredienti } = prod;

  // Sfondo alternato
  if (alt) {
    doc.save()
      .rect(x, y, w, ROW_H)
      .fill(CREMA);
    doc.restore();
  }

  // Linea separatrice
  doc.save()
    .moveTo(x + 2 * mm, y + ROW_H)
    .lineTo(x + w - 2 * mm, y + ROW_H)
    .lineWidth(0.3)
    .stroke('#D0C8B0');
  doc.restore();

  // Proporzioni colonne
  const nomeW   = w * 0.47;
  const iconsX  = x + nomeW + 2 * mm;
  const prezzoX = x + w - 2 * mm;

  // Nome
  const maxNome = Math.floor(nomeW / 6.8);
  const nomeT   = nome.length > maxNome ? nome.slice(0, maxNome - 1) + '…' : nome;
  doc.fontSize(12)
    .fillColor(NERO)
    .font('Helvetica-Bold')
    .text(nomeT, x + 2.5 * mm, y + 3.5 * mm, { lineBreak: false });

  // Ingredienti — scuro e leggibile
  const maxIng = Math.floor(nomeW / 5.0);
  const ingT   = ingredienti && ingredienti.length > maxIng
    ? ingredienti.slice(0, maxIng - 1) + '…'
    : (ingredienti || '');
  doc.fontSize(7.5)
    .fillColor(GRIGIO)
    .font('Helvetica-Oblique')
    .text(ingT, x + 2.5 * mm, y + 8.5 * mm, { lineBreak: false });

  // Icone allergeni
  if (allergeni && allergeni.length > 0) {
    drawIconsRow(doc, allergeni, iconsX, y + ROW_H / 2, ICON_R);
  }

  // Prezzo
  doc.fontSize(15)
    .fillColor(VERDE)
    .font('Helvetica-Bold');
  const prezzoStr = formatPrezzo(prod);
  const tw = doc.widthOfString(prezzoStr);
  doc.text(prezzoStr, prezzoX - tw, y + 3.8 * mm, { lineBreak: false });

  return y + ROW_H;
}

// ── Helper: formatta prezzo dal prodotto DB ───────────────────────
function formatPrezzo(prod) {
  if (prod.prezzoKg > 0)     return `€ ${prod.prezzoKg.toFixed(2).replace('.', ',')}/Kg`;
  if (prod.prezzoPezzo > 0)  return `€ ${prod.prezzoPezzo.toFixed(2).replace('.', ',')}/pz`;
  return '—';
}

// ── Helper: estrai allergeni dal prodotto ─────────────────────────
function getAllergeni(prod) {
  // Il campo allergeni nel DB è un array di stringhe
  if (Array.isArray(prod.allergeni) && prod.allergeni.length > 0) {
    return prod.allergeni;
  }
  // Fallback: ricava dagli ingredienti testuali del prodotto
  return [];
}

// ── Helper: ingredienti stringa dal prodotto ──────────────────────
function getIngredienti(prod) {
  if (Array.isArray(prod.ingredienti) && prod.ingredienti.length > 0) {
    return prod.ingredienti.join(', ');
  }
  // Fallback: prova dalla ricetta
  if (Array.isArray(prod.ricetta) && prod.ricetta.length > 0) {
    return prod.ricetta.map(v => v.ingredienteNome).join(', ');
  }
  return prod.descrizione || '';
}

// ── Helper: footer con legenda allergeni ─────────────────────────
function drawFooter(doc) {
  // Sfondo crema
  doc.save()
    .rect(0, PAGE_H - FOOTER_H - MARGIN, PAGE_W, FOOTER_H + MARGIN)
    .fill(CREMA_FTR);
  doc.restore();

  // Linea ORO sopra footer
  doc.save()
    .moveTo(MARGIN, PAGE_H - FOOTER_H - MARGIN)
    .lineTo(PAGE_W - MARGIN, PAGE_H - FOOTER_H - MARGIN)
    .lineWidth(1.5)
    .stroke(ORO);
  doc.restore();

  const lyTop = PAGE_H - MARGIN - FOOTER_H + 3 * mm;
  const lyBot = PAGE_H - MARGIN - 3 * mm;

  // Label
  doc.fontSize(8).fillColor(GRIGIO_SC).font('Helvetica-Bold')
    .text('ALLERGENI:', MARGIN, lyTop, { lineBreak: false });

  let lx = MARGIN + 38 * mm;
  const iconRLeg = ICON_R;

  for (const name of ALLERG_LEGENDA) {
    const cx = lx + iconRLeg;
    drawIcon(doc, name, cx, lyTop + 2.5 * mm, iconRLeg);

    doc.fontSize(7).fillColor(GRIGIO_SC).font('Helvetica-Bold');
    const tw = doc.widthOfString(name);
    doc.text(name, cx - tw / 2, lyBot - 2 * mm, { lineBreak: false });

    lx += iconRLeg * 2 + 2 * mm + Math.max(tw, 10 * mm) - iconRLeg;
  }

  // Nota destra
  doc.fontSize(7.5).fillColor(GRIGIO_SC).font('Helvetica-Oblique');
  const nota = '★ prodotto congelato  ·  Prezzi IVA inclusa';
  const notaW = doc.widthOfString(nota);
  doc.text(nota, PAGE_W - MARGIN - notaW, lyBot - 2 * mm, { lineBreak: false });
}

// ── Helper: header pagina 1 (logo + nome + listino prezzi) ───────
function drawHeaderPag1(doc) {
  const HDR_H = 32 * mm;

  // Sfondo bianco (già bianco, ma esplicitiamo)
  doc.save().rect(0, 0, PAGE_W, HDR_H).fill(BIANCO).restore();

  // Linea ORO in fondo header
  doc.save()
    .moveTo(0, HDR_H).lineTo(PAGE_W, HDR_H)
    .lineWidth(3).stroke(ORO);
  doc.restore();

  // Linea VERDE sotto l'oro
  doc.save()
    .moveTo(0, HDR_H + 1.5 * mm).lineTo(PAGE_W, HDR_H + 1.5 * mm)
    .lineWidth(1.2).stroke(VERDE);
  doc.restore();

  // Logo (se disponibile come file)
  try {
    const logoPath = new URL('../assets/logo.png', import.meta.url).pathname;
    const logoH = HDR_H - 5 * mm;
    const logoW = logoH * (2402 / 1622);
    doc.image(logoPath, MARGIN, 2.5 * mm, { width: logoW, height: logoH });
  } catch {
    // Logo non disponibile, ignora
  }

  // "Pastificio Nonna Claudia"
  doc.fontSize(22).fillColor(VERDE).font('Times-BoldItalic')
    .text('Pastificio Nonna Claudia', 0, 9 * mm, { align: 'center', lineBreak: false });

  // "LISTINO PREZZI"
  doc.fontSize(14).fillColor(ORO).font('Helvetica-Bold')
    .text('LISTINO PREZZI', 0, 20 * mm, { align: 'center', lineBreak: false });

  // Contatti destra
  doc.fontSize(8).fillColor(GRIGIO_SC).font('Helvetica');
  const contatti = [
    'Via Carmine 20/B · Assemini (CA)',
    'Tel. 389 887 9833',
    'info@pastificiodc.it',
  ];
  contatti.forEach((line, i) => {
    const tw = doc.widthOfString(line);
    doc.text(line, PAGE_W - MARGIN - tw, 8 * mm + i * 7 * mm, { lineBreak: false });
  });

  return HDR_H + 4.5 * mm;
}

// ── Helper: header pagine 2/3 (solo logo centrato) ───────────────
function drawHeaderSimple(doc) {
  const HDR_H = 16 * mm;

  doc.save().rect(0, 0, PAGE_W, HDR_H).fill(BIANCO).restore();

  doc.save()
    .moveTo(0, HDR_H).lineTo(PAGE_W, HDR_H)
    .lineWidth(2.5).stroke(ORO);
  doc.restore();

  doc.save()
    .moveTo(0, HDR_H + 1 * mm).lineTo(PAGE_W, HDR_H + 1 * mm)
    .lineWidth(0.8).stroke(VERDE);
  doc.restore();

  try {
    const logoPath = new URL('../assets/logo.png', import.meta.url).pathname;
    const logoH = HDR_H - 3 * mm;
    const logoW = logoH * (2402 / 1622);
    doc.image(logoPath, (PAGE_W - logoW) / 2, 1.5 * mm, { width: logoW, height: logoH });
  } catch {
    // Logo non disponibile
  }

  return HDR_H + 2 * mm;
}

// ── CONTROLLER PRINCIPALE ────────────────────────────────────────
export const generaListinoPDF = async (req, res) => {
  try {
    // Carica tutti i prodotti attivi e disponibili dal DB
    const prodottiDB = await Prodotto.find({ attivo: true })
      .sort({ categoria: 1, ordinamento: 1, nome: 1 })
      .lean();

    // Raggruppa per categoria
    const grouped = {};
    for (const p of prodottiDB) {
      const cat = p.categoria || 'Altro';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    }

    // Ordine categorie
    const ORDINE_CAT = ['Dolci', 'Panadas', 'Ravioli', 'Pasta', 'Pardulas', 'Altro'];

    // Normalizza i prodotti per il rendering
    const normalizza = (p) => ({
      nome:        p.nome,
      prezzo:      formatPrezzo(p),
      prezzoKg:    p.prezzoKg,
      prezzoPezzo: p.prezzoPezzo,
      allergeni:   getAllergeni(p),
      ingredienti: getIngredienti(p),
    });

    // Costruisci pagine
    // Pagina 1: Dolci
    // Pagina 2: Panadas
    // Pagina 3: Ravioli + Pasta (+ altre categorie se presenti)
    const pagine = [];

    // Dolci
    const dolci = (grouped['Dolci'] || []).map(normalizza);
    if (dolci.length > 0) pagine.push({ tipo: 'pag1', sezioni: [{ titolo: 'Dolci Tradizionali e Specialità', prodotti: dolci }] });

    // Panadas
    const panadas = (grouped['Panadas'] || []).map(normalizza);
    if (panadas.length > 0) pagine.push({ tipo: 'pag2', sezioni: [{ titolo: "Sa Panada — La Tradizione di Assemini", prodotti: panadas, sottotitolo: "Pasta lavorata a mano · Cotta al forno · Con patate o piselli" }] });

    // Ravioli + Pasta
    const ravioli = (grouped['Ravioli'] || []).map(normalizza);
    const pasta   = (grouped['Pasta'] || []).map(normalizza);
    const sezioniP3 = [];
    if (ravioli.length > 0) sezioniP3.push({ titolo: 'Ravioli & Culurgiones', prodotti: ravioli });
    if (pasta.length > 0)   sezioniP3.push({ titolo: 'Pasta Fresca', prodotti: pasta });
    if (sezioniP3.length > 0) pagine.push({ tipo: 'pag3', sezioni: sezioniP3 });

    // Altre categorie eventuali
    for (const cat of Object.keys(grouped)) {
      if (!['Dolci','Panadas','Ravioli','Pasta'].includes(cat)) {
        const prods = grouped[cat].map(normalizza);
        if (prods.length > 0) pagine.push({ tipo: 'pag3', sezioni: [{ titolo: cat, prodotti: prods }] });
      }
    }

    // ── Crea PDF ──────────────────────────────────────────────────
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: { Title: 'Listino Prezzi – Pastificio Nonna Claudia' }
    });

    // Stream alla risposta HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="listino-prezzi-${new Date().toISOString().split('T')[0]}.pdf"`);
    doc.pipe(res);

    const AREA_TOP    = PAGE_H - FOOTER_H - MARGIN;  // limite inferiore area contenuto
    const CONTENT_BOTTOM = PAGE_H - FOOTER_H - MARGIN;

    let primiaPagina = true;

    for (const pagina of pagine) {
      if (!primiaPagina) doc.addPage();
      primiaPagina = false;

      // Header
      let y = pagina.tipo === 'pag1' ? drawHeaderPag1(doc) : drawHeaderSimple(doc);

      // Footer (disegnato subito così è "sotto" il contenuto)
      drawFooter(doc);

      // Sezioni
      for (const sezione of pagina.sezioni) {
        y = drawCatTitle(doc, sezione.titolo, MARGIN, y, PAGE_W - 2 * MARGIN);

        if (sezione.sottotitolo) {
          doc.fontSize(8.5).fillColor(GRIGIO_SC).font('Helvetica-BoldOblique')
            .text(sezione.sottotitolo, MARGIN, y, { align: 'center', lineBreak: false, width: PAGE_W - 2 * MARGIN });
          y += 5 * mm;
        }

        sezione.prodotti.forEach((prod, i) => {
          if (y + ROW_H > CONTENT_BOTTOM) return; // overflow protezione
          y = drawProductRow(doc, prod, MARGIN, y, PAGE_W - 2 * MARGIN, i % 2 === 1);
        });

        y += 4 * mm; // spazio tra sezioni
      }
    }

    doc.end();
    logger.info('Listino PDF generato con successo');

  } catch (error) {
    logger.error('Errore generazione listino PDF:', error);
    res.status(500).json({ success: false, message: 'Errore generazione listino', error: error.message });
  }
};