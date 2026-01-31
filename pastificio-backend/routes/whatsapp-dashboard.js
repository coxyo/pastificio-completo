// routes/whatsapp-dashboard.js
// ✅ DASHBOARD per invio rapido promemoria
import express from 'express';
import Ordine from '../models/Ordine.js';
import * as whatsappService from '../services/whatsappService.js';
import logger from '../config/logger.js';
import { startOfDay, addDays } from 'date-fns';

const router = express.Router();

// GET /api/whatsapp-dashboard - Dashboard HTML
router.get('/', async (req, res) => {
  try {
    // Trova ordini per domani senza promemoria inviato
    const domani = startOfDay(addDays(new Date(), 1));
    const dopodomani = addDays(domani, 1);

    const ordini = await Ordine.find({
      dataRitiro: {
        $gte: domani,
        $lt: dopodomani
      },
      $or: [
        { promemoria_inviato: { $ne: true } },
        { promemoria_inviato: { $exists: false } }
      ],
      telefono: { $exists: true, $ne: '' }
    }).sort({ oraRitiro: 1 });

    logger.info(`📋 Dashboard: trovati ${ordini.length} ordini per domani`);

    // Genera HTML
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dashboard Promemoria WhatsApp</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
          }
          .header {
            background: white;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            margin-bottom: 30px;
            text-align: center;
          }
          h1 {
            color: #25D366;
            font-size: 32px;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #666;
            font-size: 18px;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            text-align: center;
          }
          .stat-number {
            font-size: 48px;
            font-weight: bold;
            color: #25D366;
            margin-bottom: 10px;
          }
          .stat-label {
            color: #666;
            font-size: 16px;
          }
          .orders {
            background: white;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }
          .order-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 15px;
            border-left: 5px solid #25D366;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .order-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          }
          .order-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          .order-customer {
            font-size: 20px;
            font-weight: bold;
            color: #333;
          }
          .order-time {
            font-size: 16px;
            color: #666;
            background: white;
            padding: 8px 15px;
            border-radius: 20px;
          }
          .order-details {
            color: #666;
            margin-bottom: 15px;
            line-height: 1.6;
          }
          .order-products {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 14px;
          }
          .btn-send {
            background: #25D366;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            transition: background 0.3s, transform 0.1s;
          }
          .btn-send:hover {
            background: #128C7E;
            transform: scale(1.02);
          }
          .btn-send:active {
            transform: scale(0.98);
          }
          .btn-send-all {
            background: #667eea;
            color: white;
            border: none;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            margin-bottom: 30px;
            transition: background 0.3s;
          }
          .btn-send-all:hover {
            background: #5568d3;
          }
          .no-orders {
            text-align: center;
            padding: 60px;
            color: #666;
            font-size: 18px;
          }
          .phone {
            color: #25D366;
            font-weight: bold;
          }
          .sent {
            opacity: 0.6;
            pointer-events: none;
          }
          .sent .btn-send {
            background: #ccc;
          }
          .counter {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #25D366;
            color: white;
            padding: 20px 30px;
            border-radius: 50%;
            font-size: 24px;
            font-weight: bold;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📱 Dashboard Promemoria WhatsApp</h1>
            <p class="subtitle">Ordini per domani - Click per inviare</p>
          </div>

          <div class="stats">
            <div class="stat-card">
              <div class="stat-number">${ordini.length}</div>
              <div class="stat-label">Ordini da Notificare</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="sent-count">0</div>
              <div class="stat-label">Promemoria Inviati</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="remaining-count">${ordini.length}</div>
              <div class="stat-label">Rimanenti</div>
            </div>
          </div>

          ${ordini.length > 0 ? `
            <button class="btn-send-all" onclick="inviatutti()">
              🚀 INVIA TUTTI (${ordini.length} messaggi)
            </button>
          ` : ''}

          <div class="orders">
            ${ordini.length === 0 ? `
              <div class="no-orders">
                ✅ Nessun promemoria da inviare!<br>
                Tutti i clienti sono stati notificati.
              </div>
            ` : ordini.map((ordine, index) => {
              const prodottiBreve = ordine.prodotti
                .slice(0, 3)
                .map(p => `• ${p.nome}`)
                .join('\\n');

              const messaggio = `🔔 *PROMEMORIA RITIRO*

Ciao ${ordine.nomeCliente}!

Ti ricordiamo che domani:

📅 ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}
⏰ ${ordine.oraRitiro || '10:00'}

Hai il ritiro del tuo ordine:

${prodottiBreve}

Ti aspettiamo! 😊
📍 Via Carmine 20/B, Assemini`;

              const numeroClean = ordine.telefono.replace(/\\D/g, '');
              const whatsappUrl = `https://wa.me/39${numeroClean}?text=${encodeURIComponent(messaggio)}`;

              return `
                <div class="order-card" id="order-${index}">
                  <div class="order-header">
                    <div class="order-customer">
                      ${ordine.nomeCliente} ${ordine.cognomeCliente || ''}
                    </div>
                    <div class="order-time">
                      ⏰ ${ordine.oraRitiro || '10:00'}
                    </div>
                  </div>
                  <div class="order-details">
                    <strong>📞 Telefono:</strong> <span class="phone">${ordine.telefono}</span><br>
                    <strong>📦 Ordine:</strong> #${ordine.numeroOrdine || ordine._id.toString().slice(-6)}
                  </div>
                  <div class="order-products">
                    <strong>Prodotti:</strong><br>
                    ${ordine.prodotti.map(p => `• ${p.nome} (${p.quantita} ${p.unita || 'pz'})`).join('<br>')}
                  </div>
                  <button class="btn-send" onclick="invia('${whatsappUrl}', ${index}, '${ordine._id}')">
                    📤 Invia Promemoria WhatsApp
                  </button>
                </div>
              `;
            }).join('')}
          </div>

          <div class="counter" id="counter" style="display: none;">
            <span id="counter-text">0</span>
          </div>
        </div>

        <script>
          let sentCount = 0;
          const totalCount = ${ordini.length};

          function invia(url, index, ordineId) {
            // Apri WhatsApp Web in nuova finestra
            window.open(url, '_blank');
            
            // Marca come inviato visivamente
            const card = document.getElementById('order-' + index);
            card.classList.add('sent');
            
            // Aggiorna contatori
            sentCount++;
            document.getElementById('sent-count').textContent = sentCount;
            document.getElementById('remaining-count').textContent = totalCount - sentCount;
            
            // Mostra counter
            const counter = document.getElementById('counter');
            counter.style.display = 'block';
            document.getElementById('counter-text').textContent = sentCount;
            
            // Marca nel database (chiamata asincrona)
            fetch(\`/api/ordini/\${ordineId}\`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                promemoria_inviato: true,
                promemoria_inviato_at: new Date().toISOString()
              })
            }).catch(err => console.log('Errore aggiornamento DB:', err));
          }

          function inviatutti() {
            if (!confirm('Aprire ${ordini.length} finestre WhatsApp?\\n\\nClick OK, poi clicca "Invia" in ogni finestra.')) {
              return;
            }

            ${ordini.map((ordine, index) => {
              const prodottiBreve = ordine.prodotti
                .slice(0, 3)
                .map(p => `• ${p.nome}`)
                .join('\\n');

              const messaggio = `🔔 *PROMEMORIA RITIRO*

Ciao ${ordine.nomeCliente}!

Ti ricordiamo che domani:

📅 ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}
⏰ ${ordine.oraRitiro || '10:00'}

Hai il ritiro del tuo ordine:

${prodottiBreve}

Ti aspettiamo! 😊
📍 Via Carmine 20/B, Assemini`;

              const numeroClean = ordine.telefono.replace(/\D/g, '');
              const whatsappUrl = `https://web.whatsapp.com/send?phone=39${numeroClean}&text=${encodeURIComponent(messaggio)}`;

              return `
                setTimeout(() => {
                  invia('${whatsappUrl}', ${index}, '${ordine._id}');
                }, ${index * 1000}); // 1 secondo tra una finestra e l'altra
              `;
            }).join('')}
          }
        </script>
      </body>
      </html>
    `);

  } catch (error) {
    logger.error('❌ Errore dashboard:', error);
    res.status(500).send(`<h1>Errore: ${error.message}</h1>`);
  }
});

export default router;