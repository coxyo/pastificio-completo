// components/RiepilogoStampabile.js
// 🖨️ RIEPILOGO GIORNALIERO STAMPABILE - A4 LANDSCAPE
// Fogli separati: Ravioli, Pardulas, Dolci, Altri

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
  'Culurgiones': 'Culurg',
  
  // Pardulas
  'Pardulas': 'P',
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

// Tipi varianti ravioli
const VARIANTI_RAVIOLI = {
  spinaci: ['spinaci', 'spinac'],
  zafferano: ['zafferano', 'zaff'],
  dolci: ['dolci', 'molto dolci', 'poco dolci'],
  culurgiones: ['culurgiones', 'culurgio'],
  piccoli: ['piccoli', 'piccol']  // ✅ AGGIUNTO
};

// ========== FUNZIONI HELPER ==========

const abbreviaProdotto = (nome) => {
  // ✅ NON abbreviare Panade e Panadine
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

const getVarianteRavioli = (nomeProdotto) => {
  const nomeLC = nomeProdotto.toLowerCase();
  
  if (VARIANTI_RAVIOLI.spinaci.some(v => nomeLC.includes(v))) return 'SPIN';
  if (VARIANTI_RAVIOLI.zafferano.some(v => nomeLC.includes(v))) return 'ZAFF';
  if (VARIANTI_RAVIOLI.dolci.some(v => nomeLC.includes(v))) return 'DOLCI';
  if (VARIANTI_RAVIOLI.culurgiones.some(v => nomeLC.includes(v))) return 'CULUR';
  if (VARIANTI_RAVIOLI.piccoli.some(v => nomeLC.includes(v))) return 'PICC';  // ✅ AGGIUNTO
  
  return null;
};

const formattaQuantita = (quantita, unita, dettagliCalcolo = null) => {
  // ✅ Per vassoi, usa il peso dalla composizione
  if (unita === 'vassoio' && dettagliCalcolo?.pesoTotale) {
    return `${dettagliCalcolo.pesoTotale.toFixed(1)} Kg`;
  }
  
  if (unita === 'Kg' || unita === 'g') {
    const kg = unita === 'g' ? quantita / 1000 : quantita;
    return `${kg.toFixed(1)} Kg`;
  }
  
  if (unita === 'Pezzi' || unita === 'Unità') {
    return `${quantita} pz`;
  }
  
  return `${quantita} ${unita}`;
};

const formattaData = (dataString) => {
  const data = new Date(dataString);
  const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  return `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()} ${giorni[data.getDay()]}`;
};

// ========== COMPONENTE PRINCIPALE ==========

export default function RiepilogoStampabile({ ordini, data, onClose }) {
  
  // Raggruppa ordini per categoria
  const ordiniPerCategoria = useMemo(() => {
    const gruppi = {
      RAVIOLI: [],
      PARDULAS: [],
      DOLCI: [],
      ALTRI: []
    };

    // ✅ FILTRA per data selezionata
    const ordiniFiltrati = ordini.filter(ordine => {
      const dataOrdine = (ordine.dataRitiro || '').split('T')[0];
      console.log('🔍 Filtro:', { cliente: ordine.nomeCliente, dataOrdine, dataSelezionata: data, match: dataOrdine === data });
      return dataOrdine === data;
    });

    // Ordina per orario
    const ordiniOrdinati = [...ordiniFiltrati].sort((a, b) => {
      return a.oraRitiro.localeCompare(b.oraRitiro);
    });

    ordiniOrdinati.forEach(ordine => {
      const categorieOrdine = new Set();
      
      ordine.prodotti.forEach(prodotto => {
        const categoria = getCategoriaProdotto(prodotto.nome);
        categorieOrdine.add(categoria);
        
        gruppi[categoria].push({
          ...ordine,
          prodotto: prodotto,
          haAltriProdotti: ordine.prodotti.length > 1
        });
      });
    });

    return gruppi;
  }, [ordini, data]);

  // Calcola totali per categoria
  const calcolaTotali = (categoria) => {
    const ordiniCategoria = ordiniPerCategoria[categoria];
    let totaleKg = 0;
    const dettagli = {};

    ordiniCategoria.forEach(({ prodotto }) => {
      // ✅ Per vassoi, espandi la composizione
      if (prodotto.unita === 'vassoio' && prodotto.dettagliCalcolo?.composizione) {
        // Aggiungi ogni prodotto del vassoio separatamente
        prodotto.dettagliCalcolo.composizione.forEach(item => {
          const nomeAbbrev = abbreviaProdotto(item.nome);
          let kg = 0;
          
          if (item.unita === 'Kg') {
            kg = item.quantita;
          } else if (item.unita === 'g') {
            kg = item.quantita / 1000;
          }
          
          totaleKg += kg;
          
          if (!dettagli[nomeAbbrev]) {
            dettagli[nomeAbbrev] = 0;
          }
          dettagli[nomeAbbrev] += kg;
        });
      } else {
        // Prodotto normale
        const nomeAbbrev = abbreviaProdotto(prodotto.nome);
        let kg = 0;
        
        if (prodotto.unita === 'Kg') {
          kg = prodotto.quantita;
        } else if (prodotto.unita === 'g') {
          kg = prodotto.quantita / 1000;
        }
        
        totaleKg += kg;
        
        if (!dettagli[nomeAbbrev]) {
          dettagli[nomeAbbrev] = 0;
        }
        dettagli[nomeAbbrev] += kg;
      }
    });

    return { totaleKg, dettagli };
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
  <th style={{ width: '40px' }}>PICC</th>
  <th style={{ width: '60px' }}>Q.TÀ</th>
  <th style={{ width: '25px' }}>🧳</th>
  <th style={{ width: '120px' }}>CLIENTE</th>
  <th style={{ width: '30px' }}>+</th>
</tr>
                  </thead>
                  <tbody>
                    {ordiniPerCategoria.RAVIOLI.map((item, index) => {
                      const variante = getVarianteRavioli(item.prodotto.nome);
                      
                      return (
                        <tr key={index}>
                          <td className="center">{item.oraRitiro}</td>
                          <td className="center">{variante === 'SPIN' ? '✓' : ''}</td>
                          <td className="center">{variante === 'ZAFF' ? '✓' : ''}</td>
                          <td className="center">{variante === 'DOLCI' ? '✓' : ''}</td>
                          <td className="center">{variante === 'CULUR' ? '✓' : ''}</td>
                          <td className="center">{variante === 'PICC' ? '✓' : ''}</td>
                          <td className="right">{formattaQuantita(item.prodotto.quantita, item.prodotto.unita, item.prodotto.dettagliCalcolo)}</td>
                          <td className="center">{item.daViaggio ? '✓' : ''}</td>
                          <td>{item.nomeCliente}</td>
                          <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="totali-riga">
                  {(() => {
                    const { totaleKg, dettagli } = calcolaTotali('RAVIOLI');
                    return (
                      <span>
                        <strong>TOT: {totaleKg.toFixed(1)}Kg</strong>
                        {Object.entries(dettagli).map(([nome, kg]) => (
                          <span key={nome} style={{ marginLeft: '15px' }}>{nome}: {kg.toFixed(1)} Kg</span>
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
                      <th style={{ width: '200px' }}>PRODOTTO</th>
                      <th style={{ width: '80px' }}>Q.TÀ</th>
                      <th style={{ width: '150px' }}>CLIENTE</th>
                      <th style={{ width: '40px' }}>🧳</th>
                      <th style={{ width: '40px' }}>+</th>
                      <th style={{ width: '150px' }}>NOTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordiniPerCategoria.PARDULAS.map((item, index) => (
                      <tr key={index}>
                        <td className="center">{item.oraRitiro}</td>
                        <td>
                          {abbreviaProdotto(item.prodotto.nome)}
                          {item.prodotto.dettagliCalcolo?.composizione && (
                            <span style={{ fontSize: '9px', color: '#666', marginLeft: '8px' }}>
                              ({item.prodotto.dettagliCalcolo.composizione.map(comp => 
                                `${abbreviaProdotto(comp.nome)}:${comp.quantita.toFixed(1)}${comp.unita === 'Kg' ? 'kg' : comp.unita === 'Pezzi' ? 'pz' : comp.unita}`
                              ).join(', ')})
                            </span>
                          )}
                        </td>
                        <td className="right">{formattaQuantita(item.prodotto.quantita, item.prodotto.unita, item.prodotto.dettagliCalcolo)}</td>
                        <td>{item.nomeCliente}</td>
                        <td className="center">{item.daViaggio ? '✓' : ''}</td>
                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>
                        <td style={{ fontSize: '10px' }}>{item.prodotto.note || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="totali-riga">
                  {(() => {
                    const { totaleKg, dettagli } = calcolaTotali('PARDULAS');
                    return (
                      <span>
                        <strong>TOT: {totaleKg.toFixed(1)}Kg</strong>
                        {Object.entries(dettagli).map(([nome, kg]) => (
                          <span key={nome} style={{ marginLeft: '15px' }}>{nome}: {kg.toFixed(1)} Kg</span>
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
                      <th style={{ width: '80px' }}>Q.TÀ</th>
                      <th style={{ width: '150px' }}>CLIENTE</th>
                      <th style={{ width: '40px' }}>🧳</th>
                      <th style={{ width: '40px' }}>+</th>
                      <th style={{ width: '150px' }}>NOTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordiniPerCategoria.DOLCI.map((item, index) => (
                      <tr key={index}>
                        <td className="center">{item.oraRitiro}</td>
                        <td>
                          {abbreviaProdotto(item.prodotto.nome)}
                          {item.prodotto.dettagliCalcolo?.composizione && (
                            <span style={{ fontSize: '9px', color: '#666', marginLeft: '8px' }}>
                              ({item.prodotto.dettagliCalcolo.composizione.map(comp => 
                                `${abbreviaProdotto(comp.nome)}:${comp.quantita.toFixed(1)}${comp.unita === 'Kg' ? 'kg' : comp.unita === 'Pezzi' ? 'pz' : comp.unita}`
                              ).join(', ')})
                            </span>
                          )}
                        </td>
                        <td className="right">
                          {formattaQuantita(item.prodotto.quantita, item.prodotto.unita, item.prodotto.dettagliCalcolo)}
                        </td>
                        <td>{item.nomeCliente}</td>
                        <td className="center">{item.daViaggio ? '✓' : ''}</td>
                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>
                        <td style={{ fontSize: '10px' }}>{item.prodotto.note || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="totali-riga">
                  {(() => {
                    const { totaleKg, dettagli } = calcolaTotali('DOLCI');
                    return (
                      <span>
                        <strong>TOT: {totaleKg.toFixed(1)}Kg</strong>
                        {Object.entries(dettagli).map(([nome, kg]) => (
                          <span key={nome} style={{ marginLeft: '15px' }}>{nome}: {kg.toFixed(1)} Kg</span>
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
                      <th style={{ width: '80px' }}>Q.TÀ</th>
                      <th style={{ width: '150px' }}>CLIENTE</th>
                      <th style={{ width: '40px' }}>🧳</th>
                      <th style={{ width: '40px' }}>+</th>
                      <th style={{ width: '200px' }}>NOTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordiniPerCategoria.ALTRI.map((item, index) => (
                      <tr key={index}>
                        <td className="center">{item.oraRitiro}</td>
                        <td>
                          {abbreviaProdotto(item.prodotto.nome)}
                          {item.prodotto.dettagliCalcolo?.composizione && (
                            <span style={{ fontSize: '9px', color: '#666', marginLeft: '8px' }}>
                              ({item.prodotto.dettagliCalcolo.composizione.map(comp => 
                                `${abbreviaProdotto(comp.nome)}:${comp.quantita.toFixed(1)}${comp.unita === 'Kg' ? 'kg' : comp.unita === 'Pezzi' ? 'pz' : comp.unita}`
                              ).join(', ')})
                            </span>
                          )}
                        </td>
                        <td className="right">{formattaQuantita(item.prodotto.quantita, item.prodotto.unita, item.prodotto.dettagliCalcolo)}</td>
                        <td>{item.nomeCliente}</td>
                        <td className="center">{item.daViaggio ? '✓' : ''}</td>
                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>
                        <td style={{ fontSize: '10px' }}>{item.prodotto.note || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="totali">
                  {(() => {
                    const { totaleKg, dettagli } = calcolaTotali('ALTRI');
                    return (
                      <>
                        <div className="totale-principale">
                          <strong>TOTALE ALTRI PRODOTTI:</strong> {totaleKg.toFixed(1)} Kg
                        </div>
                        <div className="dettagli-totali">
                          {Object.entries(dettagli).map(([nome, kg]) => (
                            <span key={nome}>• {nome}: {kg.toFixed(1)} Kg</span>
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
          padding: 20px;
          margin: -30px -30px 20px -30px;
          border-radius: 8px 8px 0 0;
          color: white;
        }

        .page-header h2 {
          margin: 0;
          font-size: 24px;
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
          margin-top: 20px;
          padding: 15px;
          background: #ecf0f1;
          border-radius: 8px;
          border: 2px solid #bdc3c7;
        }

        .totali-riga {
          margin-top: 10px;
          padding: 8px 15px;
          background: #ecf0f1;
          border-radius: 4px;
          border: 1px solid #bdc3c7;
          font-size: 13px;
          color: #2c3e50;
        }

        .totale-principale {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #2c3e50;
        }

        .dettagli-totali {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          font-size: 14px;
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
            size: A4 landscape;
            margin: 10mm;
          }

          .page-header {
            margin: -15mm -15mm 10mm -15mm;
            padding: 10mm;
            border-radius: 0;
          }

          .page-header h2 {
            font-size: 20px;
          }

          .page-header h3 {
            font-size: 14px;
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
            margin-top: 15mm;
            page-break-inside: avoid;
          }

          .totale-principale {
            font-size: 16px;
          }

          .dettagli-totali {
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
}
