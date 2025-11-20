// components/RiepilogoStampabile.js
// 🖨️ RIEPILOGO GIORNALIERO STAMPABILE - A4 LANDSCAPE
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

// Abbreviazioni prodotti
const ABBREVIAZIONI = {
  'Ravioli ricotta e spinaci': 'R.Spin',
  'Ravioli ricotta e zafferano': 'R.Zaff',
  'Ravioli ricotta dolci': 'R.Dolci',
  'Ravioli ricotta poco dolci': 'R.PocoDolci',
  'Ravioli ricotta molto dolci': 'R.MoltoDolci',
  'Ravioli ricotta piccoli': 'R.Piccoli',
  'Ravioli di formaggio': 'R.Form',
  'Culurgiones': 'Culurg',
  'Pardulas': 'P',
  'Pardulas (base)': 'P',
  'Pardulas con glassa': 'P.Glass',
  'Pardulas con zucchero a velo': 'P.Zucch',
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
  'Sebadas': 'Sebad',
  'Torta di saba': 'T.Saba',
  'Vassoio Dolci Misti': 'Vass.Mix',
  'Dolci misti': 'Dolci Mix',
  'Panada di Agnello': 'Pan.Agn',
  'Panada di Maiale': 'Pan.Maia',
  'Panada di Vitella': 'Pan.Vite',
  'Panada di verdure': 'Pan.Verd',
  'Panadine': 'Pndn',
  'Fregula': 'Freg',
  'Pizzette sfoglia': 'Pizz',
  'Pasta per panada e pizza': 'Pasta',
  'Sfoglia per lasagne': 'Sfog'
};

// Fattori conversione pezzi -> Kg
const PEZZI_PER_KG = {
  'Ravioli ricotta e spinaci': 30,
  'Ravioli ricotta e zafferano': 30,
  'Ravioli ricotta dolci': 30,
  'Ravioli ricotta poco dolci': 30,
  'Ravioli ricotta molto dolci': 30,
  'Ravioli ricotta piccoli': 40,
  'Ravioli di formaggio': 30,
  'Culurgiones': 32,
  'Pardulas': 25,
  'Pardulas (base)': 25,
  'Pardulas con glassa': 25,
  'Pardulas con zucchero a velo': 25,
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
  'Pizzette sfoglia': 30
};

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

// Varianti ravioli
const VARIANTI_RAVIOLI = {
  spinaci: ['spinaci', 'spinac'],
  zafferano: ['zafferano', 'zaff'],
  dolci: ['dolci'],
  culurgiones: ['culurgiones', 'culurgio'],
  formaggio: ['formaggio', 'form']
};

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
  if (nome.toLowerCase().includes('panada') || nome.toLowerCase().includes('panadine')) {
    return nome;
  }
  return ABBREVIAZIONI[nome] || nome;
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

const getVariantiRavioli = (nomeProdotto) => {
  const nomeLC = nomeProdotto.toLowerCase();
  const varianti = [];
  
  if (VARIANTI_RAVIOLI.spinaci.some(v => nomeLC.includes(v))) varianti.push('SPIN');
  if (VARIANTI_RAVIOLI.zafferano.some(v => nomeLC.includes(v))) varianti.push('ZAFF');
  if (VARIANTI_RAVIOLI.formaggio.some(v => nomeLC.includes(v))) varianti.push('FORM');
  if (VARIANTI_RAVIOLI.culurgiones.some(v => nomeLC.includes(v))) varianti.push('CULUR');
  if (nomeLC.includes('dolci')) varianti.push('DOLCI');
  
  return varianti;
};

const getNoteRavioli = (nomeProdotto, noteCottura = '') => {
  const combinato = `${nomeProdotto.toLowerCase()} ${(noteCottura || '').toLowerCase()}`;
  const note = [];
  
  if (VARIANTI_NOTE.piccoli.some(v => combinato.includes(v))) note.push('piccoli');
  if (VARIANTI_NOTE.grandi.some(v => combinato.includes(v))) note.push('grandi');
  if (VARIANTI_NOTE.molto_dolci.some(v => combinato.includes(v))) note.push('molto dolci');
  if (VARIANTI_NOTE.poco_dolci.some(v => combinato.includes(v))) note.push('poco dolci');
  if (VARIANTI_NOTE.piu_spinaci.some(v => combinato.includes(v))) note.push('+ spinaci');
  if (VARIANTI_NOTE.piu_zafferano.some(v => combinato.includes(v))) note.push('+ zafferano');
  if (VARIANTI_NOTE.pasta_grossa.some(v => combinato.includes(v))) note.push('pasta grossa');
  
  if (noteCottura) {
    noteCottura.split(',').map(p => p.trim()).forEach(parte => {
      const parteLC = parte.toLowerCase();
      const giaInclusa = note.some(n => parteLC.includes(n.toLowerCase()));
      if (!giaInclusa && parte.length > 0) note.push(parte);
    });
  }
  
  return note.join(', ');
};

const getNoteCombinate = (prodotto) => {
  const note = prodotto.note || '';
  const noteCottura = prodotto.noteCottura || '';
  
  if (note === noteCottura) return note;
  if (!note) return noteCottura;
  if (!noteCottura) return note;
  
  const partiNote = note.split(',').map(p => p.trim().toLowerCase());
  const risultato = [note];
  
  noteCottura.split(',').map(p => p.trim()).forEach(parte => {
    if (!partiNote.includes(parte.toLowerCase())) risultato.push(parte);
  });
  
  return risultato.join(', ');
};

const getPezziPerKg = (nomeProdotto) => {
  if (PEZZI_PER_KG[nomeProdotto]) return PEZZI_PER_KG[nomeProdotto];
  
  for (const [nome, pezziKg] of Object.entries(PEZZI_PER_KG)) {
    if (nomeProdotto.toLowerCase().includes(nome.toLowerCase())) return pezziKg;
  }
  
  return null;
};

const isSoloPezzo = (nomeProdotto) => {
  return SOLO_PEZZO.some(p => nomeProdotto.toLowerCase().includes(p.toLowerCase()));
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

// ========== COMPONENTE PRINCIPALE ==========
export default function RiepilogoStampabile({ ordini, data, onClose }) {
  // ✅ Raggruppa per CLIENTE + PRODOTTO + QUANTITÀ
  const ordiniPerCategoria = useMemo(() => {
    const result = {
      RAVIOLI: [],
      PARDULAS: [],
      DOLCI: [],
      ALTRI: []
    };

    const ordiniFiltrati = ordini.filter(ordine => {
      const dataOrdine = ordine.dataRitiro || ordine.createdAt || '';
      return dataOrdine.startsWith(data);
    });

    // Mappa per raggruppamento
    const mappaRaggruppamento = new Map();

    ordiniFiltrati.forEach(ordine => {
      if (!ordine.prodotti || ordine.prodotti.length === 0) return;

      const categorieOrdine = new Set(
        ordine.prodotti.map(p => getCategoriaProdotto(p.nome))
      );
      const haAltriProdotti = categorieOrdine.size > 1;

      ordine.prodotti.forEach(prodotto => {
        const categoria = getCategoriaProdotto(prodotto.nome);
        const nomeCliente = ordine.nomeCliente || 'N/D';
        const quantita = prodotto.quantita || 0;
        const unita = prodotto.unita || 'Kg';
        
        // ✅ Chiave: CLIENTE + PRODOTTO + QUANTITÀ
        let chiave;
        if (prodotto.nome === 'Vassoio Dolci Misti' || unita === 'vassoio') {
          chiave = `${categoria}-${nomeCliente}-${prodotto.nome}-${prodotto.prezzo}`;
        } else {
          chiave = `${categoria}-${nomeCliente}-${prodotto.nome}-${quantita}-${unita}`;
        }

        if (mappaRaggruppamento.has(chiave)) {
          const gruppo = mappaRaggruppamento.get(chiave);
          gruppo.count += 1;
          if (ordine.daViaggio) gruppo.daViaggio = true;
          if (haAltriProdotti) gruppo.haAltriProdotti = true;
        } else {
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

    // Converti in array
    mappaRaggruppamento.forEach((gruppo) => {
      result[gruppo.categoria].push(gruppo);
    });

    // Ordina per ora
    Object.keys(result).forEach(cat => {
      result[cat].sort((a, b) => (a.oraRitiro || '').localeCompare(b.oraRitiro || ''));
    });

    return result;
  }, [ordini, data]);

  // Calcola totali
  const calcolaTotali = (categoria) => {
    let totaleKg = 0;
    let totalePezziNonConvertibili = 0;
    let totaleEuro = 0;
    const dettagliKg = {};
    const dettagliPezzi = {};

    ordiniPerCategoria[categoria].forEach(item => {
      const prodotto = item.prodotto;
      const unitaNorm = prodotto.unita?.toLowerCase()?.trim() || 'kg';
      const moltiplicatore = item.count || 1;
      
      if (unitaNorm === 'vassoio' && prodotto.dettagliCalcolo?.composizione) {
        prodotto.dettagliCalcolo.composizione.forEach(comp => {
          if (comp.unita === 'Kg') {
            totaleKg += comp.quantita * moltiplicatore;
            dettagliKg[comp.nome] = (dettagliKg[comp.nome] || 0) + comp.quantita * moltiplicatore;
          } else if (comp.unita === 'Pezzi') {
            const pezziPerKg = getPezziPerKg(comp.nome);
            if (pezziPerKg && !isSoloPezzo(comp.nome)) {
              const kgEquivalenti = comp.quantita / pezziPerKg * moltiplicatore;
              totaleKg += kgEquivalenti;
              dettagliKg[comp.nome] = (dettagliKg[comp.nome] || 0) + kgEquivalenti;
            } else {
              totalePezziNonConvertibili += comp.quantita * moltiplicatore;
              dettagliPezzi[comp.nome] = (dettagliPezzi[comp.nome] || 0) + comp.quantita * moltiplicatore;
            }
          }
        });
      } else if (unitaNorm === 'kg' || unitaNorm === 'kilogrammi') {
        totaleKg += prodotto.quantita * moltiplicatore;
        dettagliKg[prodotto.nome] = (dettagliKg[prodotto.nome] || 0) + prodotto.quantita * moltiplicatore;
      } else if (unitaNorm === 'pezzi' || unitaNorm === 'pz') {
        const pezziPerKg = getPezziPerKg(prodotto.nome);
        if (pezziPerKg && !isSoloPezzo(prodotto.nome)) {
          const kgEquivalenti = prodotto.quantita / pezziPerKg * moltiplicatore;
          totaleKg += kgEquivalenti;
          dettagliKg[prodotto.nome] = (dettagliKg[prodotto.nome] || 0) + kgEquivalenti;
        } else {
          totalePezziNonConvertibili += prodotto.quantita * moltiplicatore;
          dettagliPezzi[prodotto.nome] = (dettagliPezzi[prodotto.nome] || 0) + prodotto.quantita * moltiplicatore;
        }
      } else if (unitaNorm === '€' || unitaNorm === 'euro') {
        totaleEuro += prodotto.quantita * moltiplicatore;
      }
    });

    return { totaleKg, totalePezziNonConvertibili, totaleEuro, dettagliKg, dettagliPezzi };
  };

  const formattaTotaliStringa = (totaleKg, totalePezzi, totaleEuro) => {
    const parti = [];
    if (totaleKg > 0) parti.push(`${totaleKg.toFixed(1)} Kg`);
    if (totalePezzi > 0) parti.push(`${totalePezzi} pz`);
    if (totaleEuro > 0) parti.push(`€${totaleEuro.toFixed(2)}`);
    return parti.join(' | ') || '0 Kg';
  };

  // ✅ Formatta quantità con moltiplicatore
  const formattaQuantitaConCount = (prodotto, count) => {
    const qta = prodotto.quantita || 0;
    const unita = prodotto.unita || 'Kg';
    const unitaNorm = unita.toLowerCase();
    
    if (unita === 'vassoio') {
      return count > 1 ? `${count} x 1 vass` : '1 vass';
    } else if (unitaNorm === 'pezzi' || unitaNorm === 'pz') {
      return count > 1 ? `${count} x ${Math.round(qta)} pz` : `${Math.round(qta)} pz`;
    } else if (unita === '€' || unitaNorm === 'euro') {
      return count > 1 ? `${count} x €${qta}` : `€${qta}`;
    } else {
      return count > 1 ? `${count} x ${qta} ${unita}` : `${qta} ${unita}`;
    }
  };

  const handleStampa = () => {
    window.print();
  };

  return (
    <>
      <Dialog 
        open={true} 
        onClose={onClose} 
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: { width: '95vw', height: '95vh', maxWidth: 'none' }
        }}
      >
        <DialogTitle>📄 Riepilogo Stampabile - {formattaData(data)}</DialogTitle>

        <DialogContent>
          <Box className="print-container">
            {/* ========== FOGLIO 1: RAVIOLI ========== */}
            {ordiniPerCategoria.RAVIOLI.length > 0 && (
              <div className="page">
                <div className="page-header" style={{ background: CATEGORIE.RAVIOLI.colore }}>
                  <h2>RAVIOLI - {formattaData(data)}</h2>
                </div>

                <table className="ordini-table">
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
                      const varianti = getVariantiRavioli(item.prodotto.nome);
                      const noteRavioli = getNoteRavioli(
                        item.prodotto.nome, 
                        item.prodotto.noteCottura || item.prodotto.note
                      );
                      
                      return (
                        <tr key={index} style={item.count > 1 ? { backgroundColor: '#e3f2fd', fontWeight: 'bold' } : {}}>
                          <td className="center">{item.oraRitiro}</td>
                          <td className="center">{varianti.includes('SPIN') ? '✓' : ''}</td>
                          <td className="center">{varianti.includes('ZAFF') ? '✓' : ''}</td>
                          <td className="center">{varianti.includes('DOLCI') ? '✓' : ''}</td>
                          <td className="center">{varianti.includes('CULUR') ? '✓' : ''}</td>
                          <td className="center">{varianti.includes('FORM') ? '✓' : ''}</td>
                          <td className="right" style={{ color: item.count > 1 ? '#1565c0' : 'inherit' }}>
                            {formattaQuantitaConCount(item.prodotto, item.count)}
                          </td>
                          <td className="center">{item.daViaggio ? '✓' : ''}</td>
                          <td>{item.nomeCliente}</td>
                          <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>
                          <td style={{ fontSize: '10px' }}>{noteRavioli}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="totali-riga">
                  {(() => {
                    const { totaleKg, totalePezziNonConvertibili, totaleEuro, dettagliKg, dettagliPezzi } = calcolaTotali('RAVIOLI');
                    return (
                      <span>
                        <strong>TOT: {formattaTotaliStringa(totaleKg, totalePezziNonConvertibili, totaleEuro)}</strong>
                        {Object.entries(dettagliKg).map(([nome, kg]) => (
                          <span key={`kg-${nome}`} style={{ marginLeft: '15px' }}>{nome}: {kg.toFixed(1)} Kg</span>
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
                    {ordiniPerCategoria.PARDULAS.map((item, index) => (
                      <tr key={index} style={item.count > 1 ? { backgroundColor: '#e0f7fa', fontWeight: 'bold' } : {}}>
                        <td className="center">{item.oraRitiro}</td>
                        <td>{abbreviaProdotto(item.prodotto.nome)}</td>
                        <td className="right" style={{ color: item.count > 1 ? '#00695c' : 'inherit' }}>
                          {formattaQuantitaConCount(item.prodotto, item.count)}
                        </td>
                        <td>{item.nomeCliente}</td>
                        <td className="center">{item.daViaggio ? '✓' : ''}</td>
                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>
                        <td style={{ fontSize: '10px' }}>{getNoteCombinate(item.prodotto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="totali">
                  {(() => {
                    const { totaleKg, totalePezziNonConvertibili, totaleEuro, dettagliKg, dettagliPezzi } = calcolaTotali('PARDULAS');
                    return (
                      <span>
                        <strong>TOT: {formattaTotaliStringa(totaleKg, totalePezziNonConvertibili, totaleEuro)}</strong>
                        {Object.entries(dettagliKg).map(([nome, kg]) => (
                          <span key={`kg-${nome}`} style={{ marginLeft: '15px' }}>{nome}: {kg.toFixed(1)} Kg</span>
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
                    {ordiniPerCategoria.DOLCI.map((item, index) => (
                      <tr key={index} style={item.count > 1 ? { backgroundColor: '#fffde7', fontWeight: 'bold' } : {}}>
                        <td className="center">{item.oraRitiro}</td>
                        <td>
                          {/* ✅ Per vassoi mostra prezzo, per altri prodotti nome */}
                          {item.prodotto.nome === 'Vassoio Dolci Misti' 
                            ? `🎂 Vassoio €${(item.prodotto.prezzo || 0).toFixed(0)}`
                            : abbreviaProdotto(item.prodotto.nome)
                          }
                          {item.prodotto.dettagliCalcolo?.composizione && (
                            <span style={{ fontSize: '9px', color: '#666', marginLeft: '8px' }}>
                              ({item.prodotto.dettagliCalcolo.composizione.map(comp => 
                                `${abbreviaProdotto(comp.nome).charAt(0)}:${comp.quantita.toFixed(1)}${comp.unita === 'Kg' ? 'kg' : 'pz'}`
                              ).join(', ')})
                            </span>
                          )}
                        </td>
                        <td className="right" style={{ color: item.count > 1 ? '#f57f17' : 'inherit' }}>
                          {formattaQuantitaConCount(item.prodotto, item.count)}
                        </td>
                        <td>{item.nomeCliente}</td>
                        <td className="center">{item.daViaggio ? '✓' : ''}</td>
                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>
                        <td style={{ fontSize: '10px' }}>{getNoteCombinate(item.prodotto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="totali">
                  {(() => {
                    const { totaleKg, totalePezziNonConvertibili, totaleEuro, dettagliKg, dettagliPezzi } = calcolaTotali('DOLCI');
                    return (
                      <span>
                        <strong>TOT: {formattaTotaliStringa(totaleKg, totalePezziNonConvertibili, totaleEuro)}</strong>
                        {Object.entries(dettagliKg).map(([nome, kg]) => (
                          <span key={`kg-${nome}`} style={{ marginLeft: '15px' }}>{nome}: {kg.toFixed(1)} Kg</span>
                        ))}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ========== FOGLIO 4: ALTRI ========== */}
            {ordiniPerCategoria.ALTRI.length > 0 && (
              <div className="page">
                <div className="page-header" style={{ background: CATEGORIE.ALTRI.colore }}>
                  <h2>ALTRI - {formattaData(data)}</h2>
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
                      <th style={{ width: '200px' }}>NOTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordiniPerCategoria.ALTRI.map((item, index) => (
                      <tr key={index} style={item.count > 1 ? { backgroundColor: '#e8f5e9', fontWeight: 'bold' } : {}}>
                        <td className="center">{item.oraRitiro}</td>
                        <td>{abbreviaProdotto(item.prodotto.nome)}</td>
                        <td className="right" style={{ color: item.count > 1 ? '#2e7d32' : 'inherit' }}>
                          {formattaQuantitaConCount(item.prodotto, item.count)}
                        </td>
                        <td>{item.nomeCliente}</td>
                        <td className="center">{item.daViaggio ? '✓' : ''}</td>
                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>
                        <td style={{ fontSize: '10px' }}>{getNoteCombinate(item.prodotto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="totali">
                  {(() => {
                    const { totaleKg, totalePezziNonConvertibili, totaleEuro, dettagliKg, dettagliPezzi } = calcolaTotali('ALTRI');
                    return (
                      <span>
                        <strong>TOT: {formattaTotaliStringa(totaleKg, totalePezziNonConvertibili, totaleEuro)}</strong>
                        {Object.entries(dettagliKg).map(([nome, kg]) => (
                          <span key={`kg-${nome}`} style={{ marginLeft: '15px' }}>{nome}: {kg.toFixed(1)} Kg</span>
                        ))}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} startIcon={<CloseIcon />}>Chiudi</Button>
          <Button variant="contained" onClick={handleStampa} startIcon={<PrintIcon />}>
            🖨️ STAMPA
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSS */}
      <style jsx global>{`
        .print-container { padding: 20px; background: #f5f5f5; }
        .page { background: white; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px; }
        .page-header { text-align: center; padding: 20px; margin: -30px -30px 20px -30px; border-radius: 8px 8px 0 0; color: white; }
        .page-header h2 { margin: 0; font-size: 24px; font-weight: bold; }
        .ordini-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .ordini-table th { background: #2c3e50; color: white; padding: 12px 8px; text-align: center; font-size: 12px; font-weight: bold; border: 1px solid #34495e; }
        .ordini-table td { padding: 10px 8px; border: 1px solid #ddd; font-size: 13px; }
        .ordini-table tbody tr:nth-child(even) { background: #f9f9f9; }
        .ordini-table tbody tr:hover { background: #e3f2fd; }
        .center { text-align: center !important; }
        .right { text-align: right !important; font-weight: bold; }
        .totali { margin-top: 20px; padding: 15px; background: #ecf0f1; border-radius: 8px; border: 2px solid #bdc3c7; }
        .totali-riga { margin-top: 10px; padding: 8px 15px; background: #ecf0f1; border-radius: 4px; border: 1px solid #bdc3c7; font-size: 13px; }

        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; background: white; padding: 0; }
          .page { page-break-after: always; padding: 15mm; margin: 0; box-shadow: none; border-radius: 0; }
          @page { size: A4 landscape; margin: 10mm; }
          .page-header { margin: -15mm -15mm 10mm -15mm; padding: 10mm; border-radius: 0; }
          .page-header h2 { font-size: 20px; }
          .ordini-table th { font-size: 11px; padding: 8px 6px; }
          .ordini-table td { font-size: 11px; padding: 6px 4px; }
        }
      `}</style>
    </>
  );
}
