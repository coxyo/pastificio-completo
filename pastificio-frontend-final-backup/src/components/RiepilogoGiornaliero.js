// components/RiepilogoGiornaliero.js
import React, { useMemo } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Package, Euro, Users, Clock, TrendingUp, 
  ShoppingCart, Cookie, ChefHat, Coffee, FileText,
  Download, Printer
} from 'lucide-react';
import { Button } from './ui/button';

const RiepilogoGiornaliero = ({ ordini = [], data }) => {
  
  // Funzione per convertire unità in kg
  const convertiInKg = (quantita, unita, nomeProdotto) => {
    // Se l'unità è già kg, ritorna la quantità
    if (unita === 'kg') return quantita;
    
    // Se l'unità è €, non convertire
    if (unita === '€') return 0;
    
    // Conversioni specifiche per prodotti in pezzi
    if (unita === 'pezzi') {
      const conversioni = {
        'Seadas': 0.15,        // 150g per seada
        'Sebadas': 0.15,       // 150g per sebada
        'Pardulas': 0.04,      // 40g per pardula (25 pardulas = 1kg)
        'Formaggelle': 0.08,   // 80g per formaggella
        'Panadas': 0.2,        // 200g per panada
        'Culurgiones': 0.001,  // 1g per culurgione (se venduti singoli)
        'Ravioli': 0.001       // 1g per raviolo (se venduti singoli)
      };
      
      // Cerca corrispondenza nel nome del prodotto
      for (const [prodotto, peso] of Object.entries(conversioni)) {
        if (nomeProdotto?.toLowerCase().includes(prodotto.toLowerCase())) {
          return quantita * peso;
        }
      }
      
      // Default per pezzi non specificati
      return quantita * 0.1; // 100g di default
    }
    
    return 0;
  };
  
  // Calcola statistiche
  const stats = useMemo(() => {
    if (!ordini || ordini.length === 0) {
      return {
        totaleOrdini: 0,
        totaleIncasso: 0,
        numeroClienti: 0,
        prodottiVenduti: {},
        prodottiInKg: {},
        orariPiuRichiesti: {},
        categorieTotali: {}
      };
    }

    const prodottiVenduti = {};
    const prodottiInKg = {};
    const orariPiuRichiesti = {};
    const clientiUnici = new Set();
    const categorieTotali = {
      pasta: 0,
      dolci: 0,
      pane: 0,
      altro: 0
    };

    let totaleIncasso = 0;

    ordini.forEach(ordine => {
      // Conta clienti unici
      if (ordine.nomeCliente) {
        clientiUnici.add(ordine.nomeCliente);
      }

      // Conta orari
      if (ordine.oraRitiro) {
        const ora = ordine.oraRitiro.split(':')[0] + ':00';
        orariPiuRichiesti[ora] = (orariPiuRichiesti[ora] || 0) + 1;
      }

      // Analizza prodotti
      ordine.prodotti?.forEach(prodotto => {
        const nomePulito = prodotto.nome?.replace(/\s*\(\d+.*?\)\s*$/, '').trim();
        const unita = prodotto.unita || prodotto.unitaMisura || 'kg';
        const quantita = prodotto.quantita || 0;
        const prezzo = prodotto.prezzo || 0;
        
        // Conta prodotti venduti
        if (!prodottiVenduti[nomePulito]) {
          prodottiVenduti[nomePulito] = {
            quantita: 0,
            unita: unita,
            incasso: 0
          };
        }
        prodottiVenduti[nomePulito].quantita += quantita;
        prodottiVenduti[nomePulito].incasso += (quantita * prezzo);
        
        // Converti in kg per il totale
        const quantitaInKg = convertiInKg(quantita, unita, nomePulito);
        prodottiInKg[nomePulito] = (prodottiInKg[nomePulito] || 0) + quantitaInKg;
        
        // Categorizza
        const categoria = getCategoria(nomePulito);
        if (unita === '€') {
          categorieTotali[categoria] += quantita; // Per € usa direttamente il valore
        } else {
          categorieTotali[categoria] += quantitaInKg;
        }
      });

      // Calcola totale incasso
      totaleIncasso += ordine.totale || 0;
    });

    return {
      totaleOrdini: ordini.length,
      totaleIncasso,
      numeroClienti: clientiUnici.size,
      prodottiVenduti,
      prodottiInKg,
      orariPiuRichiesti,
      categorieTotali
    };
  }, [ordini]);

  // Funzione per determinare la categoria
  const getCategoria = (nomeProdotto) => {
    const nome = nomeProdotto?.toLowerCase() || '';
    
    if (nome.includes('malloreddus') || nome.includes('culurgiones') || 
        nome.includes('ravioli') || nome.includes('gnocch') || 
        nome.includes('fregola') || nome.includes('tagliatelle') ||
        nome.includes('lasagne') || nome.includes('cannelloni')) {
      return 'pasta';
    }
    
    if (nome.includes('seadas') || nome.includes('sebadas') || 
        nome.includes('pardulas') || nome.includes('papassin') || 
        nome.includes('amaretti') || nome.includes('bianchini') ||
        nome.includes('gueffus') || nome.includes('candelaus') ||
        nome.includes('pabassinas') || nome.includes('dolci') ||
        nome.includes('ciambelle')) {
      return 'dolci';
    }
    
    if (nome.includes('pane') || nome.includes('carasau') || 
        nome.includes('civraxiu') || nome.includes('coccoi') ||
        nome.includes('pistoccu') || nome.includes('moddizzosu')) {
      return 'pane';
    }
    
    return 'altro';
  };

  // Funzione per esportare
  const esportaRiepilogo = () => {
    const content = `RIEPILOGO GIORNALIERO - ${new Date(data).toLocaleDateString('it-IT')}
    
STATISTICHE GENERALI
- Totale Ordini: ${stats.totaleOrdini}
- Totale Incasso: €${stats.totaleIncasso.toFixed(2)}
- Numero Clienti: ${stats.numeroClienti}
- Media per Ordine: €${stats.totaleOrdini > 0 ? (stats.totaleIncasso / stats.totaleOrdini).toFixed(2) : '0.00'}

PRODOTTI VENDUTI
${Object.entries(stats.prodottiVenduti)
  .map(([nome, data]) => `- ${nome}: ${data.quantita} ${data.unita} (€${data.incasso.toFixed(2)})`)
  .join('\n')}

TOTALI PER CATEGORIA (in kg equivalenti)
- Pasta: ${stats.categorieTotali.pasta.toFixed(2)} kg
- Dolci: ${stats.categorieTotali.dolci.toFixed(2)} kg
- Pane: ${stats.categorieTotali.pane.toFixed(2)} kg
- Altro: ${stats.categorieTotali.altro.toFixed(2)} kg

ORARI PIÙ RICHIESTI
${Object.entries(stats.orariPiuRichiesti)
  .sort((a, b) => b[1] - a[1])
  .map(([ora, count]) => `- ${ora}: ${count} ordini`)
  .join('\n')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riepilogo_${data}.txt`;
    a.click();
  };

  if (!ordini || ordini.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Nessun ordine per questa data</p>
        <p className="text-gray-500 text-sm mt-2">
          {new Date(data).toLocaleDateString('it-IT', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con azioni */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          Riepilogo del {new Date(data).toLocaleDateString('it-IT')}
        </h2>
        <div className="flex gap-2">
          <Button onClick={esportaRiepilogo} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Esporta
          </Button>
          <Button onClick={() => window.print()} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Stampa
          </Button>
        </div>
      </div>

      {/* Cards statistiche principali */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Ordini Totali</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totaleOrdini}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Incasso Totale</p>
              <p className="text-2xl font-bold text-green-900">€{stats.totaleIncasso.toFixed(2)}</p>
            </div>
            <Euro className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Clienti</p>
              <p className="text-2xl font-bold text-purple-900">{stats.numeroClienti}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Media/Ordine</p>
              <p className="text-2xl font-bold text-orange-900">
                €{stats.totaleOrdini > 0 ? (stats.totaleIncasso / stats.totaleOrdini).toFixed(2) : '0.00'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Prodotti più venduti */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Prodotti Venduti
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">Prodotto</th>
                <th className="px-4 py-2 text-center text-sm font-medium">Quantità</th>
                <th className="px-4 py-2 text-center text-sm font-medium">Unità</th>
                <th className="px-4 py-2 text-center text-sm font-medium">Kg Equiv.</th>
                <th className="px-4 py-2 text-right text-sm font-medium">Incasso</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(stats.prodottiVenduti)
                .sort((a, b) => b[1].incasso - a[1].incasso)
                .map(([nome, data]) => (
                  <tr key={nome} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium">{nome}</td>
                    <td className="px-4 py-2 text-center text-sm">{data.quantita}</td>
                    <td className="px-4 py-2 text-center text-sm">{data.unita}</td>
                    <td className="px-4 py-2 text-center text-sm">
                      {stats.prodottiInKg[nome]?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold text-green-600">
                      €{data.incasso.toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <td className="px-4 py-3 font-semibold">Totali</td>
                <td colSpan="3" className="px-4 py-3 text-center font-semibold">
                  {Object.values(stats.prodottiInKg).reduce((sum, kg) => sum + kg, 0).toFixed(2)} kg totali
                </td>
                <td className="px-4 py-3 text-right font-bold text-green-600">
                  €{stats.totaleIncasso.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Categorie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Totali per categoria */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Produzione per Categoria (kg)
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.categorieTotali)
              .filter(([_, kg]) => kg > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([categoria, kg]) => {
                const percentuale = Object.values(stats.categorieTotali).reduce((sum, v) => sum + v, 0) > 0
                  ? (kg / Object.values(stats.categorieTotali).reduce((sum, v) => sum + v, 0) * 100).toFixed(1)
                  : 0;
                
                const icons = {
                  pasta: '🍝',
                  dolci: '🍰',
                  pane: '🍞',
                  altro: '📦'
                };
                
                return (
                  <div key={categoria} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{icons[categoria]}</span>
                      <span className="font-medium capitalize">{categoria}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentuale}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-20 text-right">
                        {kg.toFixed(2)} kg
                      </span>
                      <Badge variant="secondary">{percentuale}%</Badge>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Orari più richiesti */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Orari di Ritiro
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.orariPiuRichiesti)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([ora, count]) => (
                <div key={ora} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <span className="font-medium">{ora}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ 
                          width: `${(count / Math.max(...Object.values(stats.orariPiuRichiesti))) * 100}%` 
                        }}
                      />
                    </div>
                    <Badge>{count} {count === 1 ? 'ordine' : 'ordini'}</Badge>
                  </div>
                </div>
              ))}
            {Object.keys(stats.orariPiuRichiesti).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                Nessun orario specificato
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Lista ordini dettagliata */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Dettaglio Ordini ({ordini.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Ora</th>
                <th className="px-3 py-2 text-left">Cliente</th>
                <th className="px-3 py-2 text-left">Prodotti</th>
                <th className="px-3 py-2 text-right">Totale</th>
                <th className="px-3 py-2 text-center">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ordini
                .sort((a, b) => (a.oraRitiro || '').localeCompare(b.oraRitiro || ''))
                .map((ordine) => (
                  <tr key={ordine._id || ordine.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{ordine.oraRitiro || '-'}</td>
                    <td className="px-3 py-2 font-medium">{ordine.nomeCliente}</td>
                    <td className="px-3 py-2">
                      <div className="max-w-md">
                        {ordine.prodotti?.map(p => {
                          const nomePulito = p.nome?.replace(/\s*\(\d+.*?\)\s*$/, '').trim();
                          const unita = p.unita || p.unitaMisura || 'kg';
                          return `${nomePulito} (${p.quantita} ${unita})`;
                        }).join(', ')}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      €{ordine.totale?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={ordine.stato === 'completato' ? 'success' : 'default'}>
                        {ordine.stato || 'nuovo'}
                      </Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Note di conversione */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <Coffee className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Note sulle conversioni:</p>
            <ul className="space-y-1 ml-4">
              <li>• 1 Seada/Sebada = 150g</li>
              <li>• 1 Pardula = 40g (25 pardulas = 1kg)</li>
              <li>• 1 Formaggella = 80g</li>
              <li>• 1 Panada = 200g</li>
              <li>• Prodotti venduti a € non vengono convertiti in kg</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RiepilogoGiornaliero;
