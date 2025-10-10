// routes/admin.js - ✅ NUOVO FILE
// Endpoint amministrativi per manutenzione database
import express from 'express';
import Ordine from '../models/Ordine.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * 🔧 ENDPOINT: Correggi tutti gli ordini con prezzi errati
 * GET /api/admin/fix-ordini
 * 
 * COME USARE:
 * 1. Apri browser
 * 2. Vai su: https://pastificio-backend-production.up.railway.app/api/admin/fix-ordini
 * 3. Attendi il risultato (può richiedere 10-30 secondi)
 */
router.get('/fix-ordini', async (req, res) => {
  try {
    logger.info('🔧 INIZIO CORREZIONE MASSIVA ORDINI');
    
    // Trova TUTTI gli ordini
    const ordini = await Ordine.find({});
    logger.info(`📊 Trovati ${ordini.length} ordini totali`);
    
    let corretti = 0;
    let giàCorretti = 0;
    let errori = 0;
    const dettagli = [];
    
    for (const ordine of ordini) {
      try {
        const vecchioTotale = ordine.totale;
        
        // Log prima della correzione
        const logPrima = {
          numeroOrdine: ordine.numeroOrdine || ordine._id.toString(),
          cliente: ordine.nomeCliente,
          vecchioTotale: vecchioTotale.toFixed(2),
          prodotti: ordine.prodotti.map(p => ({
            nome: p.nome,
            quantita: p.quantita,
            unita: p.unita,
            prezzoVecchio: p.prezzo.toFixed(2)
          }))
        };
        
        // 🔥 RICALCOLA usando il metodo del model
        ordine.calcolaTotale();
        
        const differenza = Math.abs(vecchioTotale - ordine.totale);
        
        if (differenza > 0.10) {
          // Salva modifiche
          await ordine.save();
          corretti++;
          
          const dettaglio = {
            ...logPrima,
            nuovoTotale: ordine.totale.toFixed(2),
            differenza: differenza.toFixed(2),
            stato: '✅ CORRETTO',
            prodottiNuovi: ordine.prodotti.map(p => ({
              nome: p.nome,
              quantita: p.quantita,
              unita: p.unita,
              prezzoNuovo: p.prezzo.toFixed(2)
            }))
          };
          
          dettagli.push(dettaglio);
          
          logger.info(`✅ Ordine ${dettaglio.numeroOrdine}: €${vecchioTotale.toFixed(2)} → €${ordine.totale.toFixed(2)}`);
        } else {
          giàCorretti++;
        }
        
      } catch (error) {
        errori++;
        logger.error(`❌ Errore ordine ${ordine.numeroOrdine}:`, error.message);
        
        dettagli.push({
          numeroOrdine: ordine.numeroOrdine || ordine._id.toString(),
          stato: '❌ ERRORE',
          errore: error.message
        });
      }
    }
    
    // Riepilogo
    const riepilogo = {
      totale: ordini.length,
      corretti,
      giàCorretti,
      errori,
      timestamp: new Date().toISOString()
    };
    
    logger.info('📊 RIEPILOGO CORREZIONE:', riepilogo);
    
    // Risposta HTML formattata
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Correzione Ordini - Pastificio Nonna Claudia</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      padding: 20px; 
      background: #f5f5f5;
      max-width: 1200px;
      margin: 0 auto;
    }
    .container { 
      background: white; 
      padding: 30px; 
      border-radius: 10px; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { 
      color: #2c3e50; 
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    .summary { 
      background: #ecf0f1; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 20px 0;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #bdc3c7;
    }
    .summary-item:last-child {
      border-bottom: none;
    }
    .label { 
      font-weight: bold; 
      color: #34495e;
    }
    .value { 
      color: #2c3e50;
      font-size: 18px;
    }
    .success { color: #27ae60; font-weight: bold; }
    .error { color: #e74c3c; font-weight: bold; }
    .info { color: #3498db; font-weight: bold; }
    .details { 
      margin-top: 30px;
    }
    .order-card {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      margin: 10px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 2px solid #3498db;
    }
    .order-number {
      font-weight: bold;
      font-size: 16px;
      color: #2c3e50;
    }
    .order-status {
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
    }
    .status-corrected {
      background: #d4edda;
      color: #155724;
    }
    .products {
      margin-top: 10px;
    }
    .product-item {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 10px;
      padding: 8px;
      background: #f8f9fa;
      margin: 5px 0;
      border-radius: 4px;
    }
    .product-header {
      font-weight: bold;
      background: #e9ecef;
    }
    .price-change {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-top: 10px;
      padding: 10px;
      background: #fff3cd;
      border-radius: 5px;
    }
    .arrow {
      color: #e67e22;
      font-size: 20px;
      font-weight: bold;
    }
    button {
      background: #3498db;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      margin-top: 20px;
    }
    button:hover {
      background: #2980b9;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔧 Correzione Ordini Completata</h1>
    
    <div class="summary">
      <h2>📊 Riepilogo</h2>
      <div class="summary-item">
        <span class="label">📦 Ordini totali analizzati:</span>
        <span class="value">${riepilogo.totale}</span>
      </div>
      <div class="summary-item">
        <span class="label">✅ Ordini corretti:</span>
        <span class="value success">${riepilogo.corretti}</span>
      </div>
      <div class="summary-item">
        <span class="label">ℹ️ Ordini già corretti:</span>
        <span class="value info">${riepilogo.giàCorretti}</span>
      </div>
      <div class="summary-item">
        <span class="label">❌ Errori:</span>
        <span class="value error">${riepilogo.errori}</span>
      </div>
      <div class="summary-item">
        <span class="label">🕐 Timestamp:</span>
        <span class="value">${new Date(riepilogo.timestamp).toLocaleString('it-IT')}</span>
      </div>
    </div>
    
    ${corretti > 0 ? `
    <div class="details">
      <h2>📋 Dettaglio Ordini Corretti (${corretti})</h2>
      ${dettagli.map(d => `
        <div class="order-card">
          <div class="order-header">
            <span class="order-number">📦 ${d.numeroOrdine} - ${d.cliente}</span>
            <span class="order-status status-corrected">${d.stato}</span>
          </div>
          
          <div class="products">
            <div class="product-item product-header">
              <span>Prodotto</span>
              <span>Quantità</span>
              <span>Prezzo Vecchio</span>
              <span>Prezzo Nuovo</span>
            </div>
            ${d.prodotti.map((p, idx) => `
              <div class="product-item">
                <span>${p.nome}</span>
                <span>${p.quantita} ${p.unita}</span>
                <span>€${p.prezzoVecchio}</span>
                <span class="success">€${d.prodottiNuovi[idx].prezzoNuovo}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="price-change">
            <span style="color: #e74c3c;">Vecchio totale: €${d.vecchioTotale}</span>
            <span class="arrow">→</span>
            <span class="success">Nuovo totale: €${d.nuovoTotale}</span>
            <span style="margin-left: auto; color: #e67e22;">(Differenza: €${d.differenza})</span>
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <button onclick="window.location.reload()">🔄 Riesegui Correzione</button>
    <button onclick="window.close()">✅ Chiudi</button>
  </div>
</body>
</html>
    `;
    
    res.send(html);
    
  } catch (error) {
    logger.error('❌ Errore correzione ordini:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial; padding: 40px;">
          <h1 style="color: red;">❌ Errore durante la correzione</h1>
          <p>${error.message}</p>
          <pre>${error.stack}</pre>
        </body>
      </html>
    `);
  }
});

/**
 * 📊 ENDPOINT: Verifica stato ordini (senza modifiche)
 * GET /api/admin/check-ordini
 */
router.get('/check-ordini', async (req, res) => {
  try {
    const ordini = await Ordine.find({}).limit(10).sort('-createdAt');
    
    const analisi = ordini.map(o => ({
      numeroOrdine: o.numeroOrdine || o._id.toString(),
      cliente: o.nomeCliente,
      totale: o.totale.toFixed(2),
      prodotti: o.prodotti.map(p => ({
        nome: p.nome,
        quantita: p.quantita,
        unita: p.unita,
        prezzo: p.prezzo.toFixed(2),
        hasDettagliCalcolo: !!p.dettagliCalcolo
      }))
    }));
    
    res.json({
      success: true,
      totaleOrdini: await Ordine.countDocuments(),
      ultimi10: analisi
    });
  } catch (error) {
    logger.error('Errore check ordini:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;