// components/RiepilogoStampabile.js
// 🖨️ RIEPILOGO GIORNALIERO STAMPABILE - A4 LANDSCAPE
// Layout compatto con header una riga e totali in basso

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box
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
    nome: 'ALTRI',
    prodotti: ['Panada', 'Panadine', 'Fregula', 'Pizzette', 'Pasta', 'Sfoglia'],
    colore: '#95E1D3'
  }
};

// Tipi varianti ravioli
const VARIANTI_RAVIOLI = {
  spinaci: ['spinaci', 'spinac'],
  zafferano: ['zafferano', 'zaff'],
  dolci: ['dolci', 'molto dolci', 'poco dolci'],
  culurgiones: ['culurgiones', 'culurgio']
};

// ========== FUNZIONI HELPER ==========

const abbreviaProdotto = (nome) => {
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
  
  return null;
};

const formattaQuantita = (quantita, unita, dettagliCalcolo = null) => {
  if (unita === 'vassoio' && dettagliCalcolo?.pesoTotale) {
    return `${dettagliCalcolo.pesoTotale.toFixed(1)} Kg`;
  }
  
  if (unita === 'Kg' || unita === 'kg' || unita === 'g') {
    const kg = unita === 'g' ? quantita / 1000 : quantita;
    return `${kg.toFixed(1)} Kg`;
  }
  
  if (unita === 'Pezzi' || unita === 'pezzi' || unita === 'pz' || unita === 'Unità') {
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

    // Filtra per data selezionata
    const ordiniFiltrati = ordini.filter(ordine => {
      const dataOrdine = (ordine.dataRitiro || '').split('T')[0];
      return dataOrdine === data;
    });

    // Ordina per orario
    const ordiniOrdinati = [...ordiniFiltrati].sort((a, b) => {
      return (a.oraRitiro || '').localeCompare(b.oraRitiro || '');
    });

    ordiniOrdinati.forEach(ordine => {
      ordine.prodotti.forEach(prodotto => {
        const categoria = getCategoriaProdotto(prodotto.nome);
        
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
      if (prodotto.unita === 'vassoio' && prodotto.dettagliCalcolo?.composizione) {
        prodotto.dettagliCalcolo.composizione.forEach(item => {
          const nomeAbbrev = abbreviaProdotto(item.nome);
          let kg = 0;
          
          if (item.unita === 'Kg' || item.unita === 'kg') {
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
        const nomeAbbrev = abbreviaProdotto(prodotto.nome);
        let kg = 0;
        
        if (prodotto.unita === 'Kg' || prodotto.unita === 'kg') {
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
              <div className="page">
                <div className="page-header-compact" style={{ background: CATEGORIE.RAVIOLI.colore }}>
                  <span className="header-title">RAVIOLI</span>
                  <span className="header-date">{formattaData(data)}</span>
                </div>

                <table className="ordini-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>ORA</th>
                      <th style={{ width: '40px' }}>SPIN</th>
                      <th style={{ width: '40px' }}>ZAFF</th>
                      <th style={{ width: '50px' }}>DOLCI</th>
                      <th style={{ width: '50px' }}>CULUR</th>
                      <th style={{ width: '70px' }}>Q.TÀ</th>
                      <th style={{ width: '30px' }}>🧳</th>
                      <th style={{ width: '130px' }}>CLIENTE</th>
                      <th style={{ width: '40px' }}>+</th>
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
                          <td className="right">{formattaQuantita(item.prodotto.quantita, item.prodotto.unita, item.prodotto.dettagliCalcolo)}</td>
                          <td className="center">{item.daViaggio ? '✓' : ''}</td>
                          <td>{item.nomeCliente}</td>
                          <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="totali-compact">
                  {(() => {
                    const { totaleKg, dettagli } = calcolaTotali('RAVIOLI');
                    return (
                      <>
                        <strong>TOT: {totaleKg.toFixed(1)}Kg</strong>
                        <span className="dettagli-inline">
                          {Object.entries(dettagli).map(([nome, kg]) => 
                            `${nome}:${kg.toFixed(1)}`
                          ).join(' • ')}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ========== FOGLIO 2: PARDULAS ========== */}
            {ordiniPerCategoria.PARDULAS.length > 0 && (
              <div className="page">
                <div className="page-header-compact" style={{ background: CATEGORIE.PARDULAS.colore }}>
                  <span className="header-title">PARDULAS</span>
                  <span className="header-date">{formattaData(data)}</span>
                </div>

                <table className="ordini-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>ORA</th>
                      <th style={{ width: '150px' }}>PRODOTTO</th>
                      <th style={{ width: '80px' }}>Q.TÀ</th>
                      <th style={{ width: '30px' }}>🧳</th>
                      <th style={{ width: '150px' }}>CLIENTE</th>
                      <th style={{ width: '40px' }}>+</th>
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
                                `${abbreviaProdotto(comp.nome)}:${comp.quantita.toFixed(1)}${comp.unita === 'Kg' || comp.unita === 'kg' ? 'kg' : comp.unita === 'Pezzi' || comp.unita === 'pz' ? 'pz' : comp.unita}`
                              ).join(', ')})
                            </span>
                          )}
                        </td>
                        <td className="right">{formattaQuantita(item.prodotto.quantita, item.prodotto.unita, item.prodotto.dettagliCalcolo)}</td>
                        <td className="center">{item.daViaggio ? '✓' : ''}</td>
                        <td>{item.nomeCliente}</td>
                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="totali-compact">
                  {(() => {
                    const { totaleKg, dettagli } = calcolaTotali('PARDULAS');
                    return (
                      <>
                        <strong>TOT: {totaleKg.toFixed(1)}Kg</strong>
                        <span className="dettagli-inline">
                          {Object.entries(dettagli).map(([nome, kg]) => 
                            `${nome}:${kg.toFixed(1)}`
                          ).join(' • ')}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ========== FOGLIO 3: DOLCI ========== */}
            {ordiniPerCategoria.DOLCI.length > 0 && (
              <div className="page">
                <div className="page-header-compact" style={{ background: CATEGORIE.DOLCI.colore }}>
                  <span className="header-title">DOLCI</span>
                  <span className="header-date">{formattaData(data)}</span>
                </div>

                <table className="ordini-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>ORA</th>
                      <th style={{ width: '200px' }}>PRODOTTO</th>
                      <th style={{ width: '80px' }}>Q.TÀ</th>
                      <th style={{ width: '30px' }}>🧳</th>
                      <th style={{ width: '150px' }}>CLIENTE</th>
                      <th style={{ width: '40px' }}>+</th>
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
                                `${abbreviaProdotto(comp.nome)}:${comp.quantita.toFixed(1)}${comp.unita === 'Kg' || comp.unita === 'kg' ? 'kg' : comp.unita === 'Pezzi' || comp.unita === 'pz' ? 'pz' : comp.unita}`
                              ).join(', ')})
                            </span>
                          )}
                        </td>
                        <td className="right">{formattaQuantita(item.prodotto.quantita, item.prodotto.unita, item.prodotto.dettagliCalcolo)}</td>
                        <td className="center">{item.daViaggio ? '✓' : ''}</td>
                        <td>{item.nomeCliente}</td>
                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="totali-compact">
                  {(() => {
                    const { totaleKg, dettagli } = calcolaTotali('DOLCI');
                    return (
                      <>
                        <strong>TOT: {totaleKg.toFixed(1)}Kg</strong>
                        <span className="dettagli-inline">
                          {Object.entries(dettagli).map(([nome, kg]) => 
                            `${nome}:${kg.toFixed(1)}`
                          ).join(' • ')}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ========== FOGLIO 4: ALTRI ========== */}
            {ordiniPerCategoria.ALTRI.length > 0 && (
              <div className="page">
                <div className="page-header-compact" style={{ background: CATEGORIE.ALTRI.colore }}>
                  <span className="header-title">ALTRI</span>
                  <span className="header-date">{formattaData(data)}</span>
                </div>

                <table className="ordini-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>ORA</th>
                      <th style={{ width: '200px' }}>PRODOTTO</th>
                      <th style={{ width: '80px' }}>Q.TÀ</th>
                      <th style={{ width: '30px' }}>🧳</th>
                      <th style={{ width: '150px' }}>CLIENTE</th>
                      <th style={{ width: '40px' }}>+</th>
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
                                `${abbreviaProdotto(comp.nome)}:${comp.quantita.toFixed(1)}${comp.unita === 'Kg' || comp.unita === 'kg' ? 'kg' : comp.unita === 'Pezzi' || comp.unita === 'pz' ? 'pz' : comp.unita}`
                              ).join(', ')})
                            </span>
                          )}
                        </td>
                        <td className="right">{formattaQuantita(item.prodotto.quantita, item.prodotto.unita, item.prodotto.dettagliCalcolo)}</td>
                        <td className="center">{item.daViaggio ? '✓' : ''}</td>
                        <td>{item.nomeCliente}</td>
                        <td className="center">{item.haAltriProdotti ? '✓' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="totali-compact">
                  {(() => {
                    const { totaleKg, dettagli } = calcolaTotali('ALTRI');
                    return (
                      <>
                        <strong>TOT: {totaleKg.toFixed(1)}Kg</strong>
                        <span className="dettagli-inline">
                          {Object.entries(dettagli).map(([nome, kg]) => 
                            `${nome}:${kg.toFixed(1)}`
                          ).join(' • ')}
                        </span>
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

      {/* ========== CSS ========== */}
      <style jsx global>{`
        .print-container {
          padding: 20px;
          background: #f5f5f5;
        }

        .page {
          background: white;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-radius: 8px;
        }

        .page-header-compact {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 15px;
          margin: -20px -20px 15px -20px;
          color: white;
          font-weight: bold;
        }

        .header-title {
          font-size: 16px;
          font-weight: bold;
        }

        .header-date {
          font-size: 11px;
        }

        .ordini-table {
          width: 100%;
          border-collapse: collapse;
        }

        .ordini-table th {
          background: #2c3e50;
          color: white;
          padding: 8px 6px;
          text-align: center;
          font-size: 11px;
          font-weight: bold;
          border: 1px solid #34495e;
        }

        .ordini-table td {
          padding: 6px 4px;
          border: 1px solid #ddd;
          font-size: 11px;
        }

        .ordini-table tbody tr:nth-child(even) {
          background: #f9f9f9;
        }

        .center {
          text-align: center !important;
        }

        .right {
          text-align: right !important;
          font-weight: bold;
        }

        .totali-compact {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 8px 12px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-top: 10px;
          font-size: 11px;
        }

        .dettagli-inline {
          font-size: 10px;
          color: #666;
        }

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
            padding: 10mm;
            margin: 0;
            box-shadow: none;
          }

          @page {
            size: A4 landscape;
            margin: 5mm;
          }

          .page-header-compact {
            margin: -10mm -10mm 8mm -10mm;
            padding: 4mm 8mm;
          }

          .header-title {
            font-size: 14px;
          }

          .header-date {
            font-size: 10px;
          }

          .ordini-table th {
            font-size: 9px;
            padding: 4px 3px;
          }

          .ordini-table td {
            font-size: 9px;
            padding: 3px 2px;
          }

          .totali-compact {
            margin-top: 8mm;
            font-size: 9px;
          }

          .dettagli-inline {
            font-size: 8px;
          }
        }
      `}</style>
    </>
  );
}
