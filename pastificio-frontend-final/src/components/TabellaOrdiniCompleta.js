// src/components/TabellaOrdiniCompleta.js - ✅ FIX VISUALIZZAZIONE PREZZI
import React from 'react';
import { Edit, Trash2, Eye, Share2, Package } from 'lucide-react';

const TabellaOrdiniCompleta = ({ ordini, onModifica, onElimina, onDettagli, onCondividi }) => {
  
  // Verifica se ordine ha multipli prodotti
  const haMultipliProdotti = (ordine) => {
    return ordine.prodotti && ordine.prodotti.length > 1;
  };
  
  // Verifica se ordine ha prodotti da viaggio
  const haProdottiDaViaggio = (ordine) => {
    return ordine.prodotti && ordine.prodotti.some(p => p.daViaggio);
  };
  
  // ✅ FIX: Calcola il totale CORRETTO dell'ordine
  const calcolaTotaleOrdine = (ordine) => {
    if (!ordine.prodotti || ordine.prodotti.length === 0) {
      return ordine.totale || 0;
    }
    
    // Somma i prezzi TOTALI di ogni prodotto (non unitari!)
    const totaleCalcolato = ordine.prodotti.reduce((sum, prodotto) => {
      // Il prezzo già salvato è il TOTALE del prodotto
      return sum + (prodotto.prezzo || 0);
    }, 0);
    
    // Se c'è discrepanza significativa (>€1), usa il totale calcolato
    const differenza = Math.abs(totaleCalcolato - (ordine.totale || 0));
    
    if (differenza > 1) {
      console.warn(
        `⚠️ Discrepanza ordine ${ordine._id}:`,
        `DB: €${ordine.totale?.toFixed(2)}, Calcolato: €${totaleCalcolato.toFixed(2)}`
      );
    }
    
    // Usa sempre il totale calcolato dalla somma dei prodotti
    return totaleCalcolato;
  };
  
  // ✅ FIX: Formatta i dettagli prodotto correttamente
  const formattaDettagliProdotto = (prodotto) => {
    // Se esiste dettagliCalcolo, usa quello (più preciso)
    if (prodotto.dettagliCalcolo && prodotto.dettagliCalcolo.dettagli) {
      return prodotto.dettagliCalcolo.dettagli;
    }
    
    // Altrimenti costruisci manualmente
    const quantita = prodotto.quantita || 0;
    const unita = prodotto.unita || prodotto.unitaMisura || 'Kg';
    
    return `${quantita} ${unita}`;
  };
  
  // Badge stato ordine
  const getBadgeStato = (stato) => {
    const stati = {
      nuovo: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Nuovo' },
      'in-preparazione': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Prep.' },
      pronto: { bg: 'bg-green-100', text: 'text-green-800', label: 'Pronto' },
      completato: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Consegnato' },
      annullato: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annullato' },
    };
    
    const { bg, text, label } = stati[stato] || stati.nuovo;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };
  
  // Formatta data e ora
  const formattaDataOra = (ordine) => {
    const data = new Date(ordine.dataRitiro).toLocaleDateString('it-IT');
    const ora = ordine.oraRitiro || '--:--';
    return `${data} ${ora}`;
  };
  
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Ora</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Cliente</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Prodotti</th>
            <th className="px-4 py-3 text-center text-sm font-semibold">
              <div className="flex items-center justify-center gap-1">
                <Package className="w-4 h-4" />
                MULTI
              </div>
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold">
              <div className="flex items-center justify-center gap-1">
                🎒
                VIAGGIO
              </div>
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold">Prezzo</th>
            <th className="px-4 py-3 text-center text-sm font-semibold">Stato</th>
            <th className="px-4 py-3 text-center text-sm font-semibold">Note</th>
            <th className="px-4 py-3 text-center text-sm font-semibold">Azioni</th>
          </tr>
        </thead>
        
        <tbody className="divide-y">
          {ordini.length === 0 ? (
            <tr>
              <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nessun ordine presente</p>
              </td>
            </tr>
          ) : (
            ordini.map((ordine) => {
              // ✅ Calcola il totale CORRETTO per questo ordine
              const totaleCorretto = calcolaTotaleOrdine(ordine);
              
              return (
                <tr key={ordine._id || ordine.id} className="hover:bg-gray-50 transition-colors">
                  {/* Ora */}
                  <td className="px-4 py-3 text-sm">
                    {formattaDataOra(ordine)}
                  </td>
                  
                  {/* Cliente */}
                  <td className="px-4 py-3">
                    <div className="font-medium">{ordine.nomeCliente}</div>
                    {ordine.telefono && (
                      <div className="text-xs text-gray-500">
                        📞 {ordine.telefono}
                      </div>
                    )}
                  </td>
                  
                  {/* Prodotti - ✅ FIX: Mostra dettagli corretti */}
                  <td className="px-4 py-3 text-sm">
                    {ordine.prodotti && ordine.prodotti.length > 0 ? (
                      <div>
                        {ordine.prodotti.slice(0, 2).map((p, idx) => {
                          const dettagli = formattaDettagliProdotto(p);
                          const prezzoProdotto = p.prezzo || 0;
                          
                          return (
                            <div key={idx} className="text-xs mb-1">
                              • {p.nome || p.nomeProdotto} 
                              <span className="text-gray-600"> ({dettagli})</span>
                              <span className="text-green-600 font-semibold ml-2">
                                €{prezzoProdotto.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                        {ordine.prodotti.length > 2 && (
                          <div className="text-xs text-gray-500 italic">
                            +{ordine.prodotti.length - 2} altri...
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  
                  {/* ✅ COLONNA MULTI */}
                  <td className="px-4 py-3 text-center">
                    {haMultipliProdotti(ordine) ? (
                      <span className="text-2xl" title="Ordine con multipli prodotti">
                        ⬇️
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  
                  {/* ✅ COLONNA VIAGGIO */}
                  <td className="px-4 py-3 text-center">
                    {haProdottiDaViaggio(ordine) ? (
                      <span className="text-2xl" title="Contiene prodotti da viaggio">
                        ✅
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  
                  {/* Prezzo - ✅ FIX: Usa il totale CORRETTO */}
                  <td className="px-4 py-3 text-center">
                    <div className="font-semibold text-lg text-green-600">
                      €{totaleCorretto.toFixed(2)}
                    </div>
                    {/* ⚠️ Debug: mostra se c'è discrepanza */}
                    {Math.abs(totaleCorretto - (ordine.totale || 0)) > 1 && (
                      <div className="text-xs text-red-500" title={`DB: €${ordine.totale?.toFixed(2)}`}>
                        ⚠️ Ricalcolato
                      </div>
                    )}
                  </td>
                  
                  {/* Stato */}
                  <td className="px-4 py-3 text-center">
                    {getBadgeStato(ordine.stato)}
                  </td>
                  
                  {/* Note */}
                  <td className="px-4 py-3 text-center text-sm">
                    {ordine.note ? (
                      <span title={ordine.note}>
                        📝
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  
                  {/* Azioni */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onDettagli(ordine)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="Visualizza dettagli"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => onModifica(ordine)}
                        className="p-1.5 text-yellow-500 hover:bg-yellow-50 rounded transition-colors"
                        title="Modifica ordine"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => onCondividi(ordine)}
                        className="p-1.5 text-green-500 hover:bg-green-50 rounded transition-colors"
                        title="Condividi su WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => onElimina(ordine)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Elimina ordine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TabellaOrdiniCompleta;