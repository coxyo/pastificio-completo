// routes/cx3.js - MODIFICA ENDPOINT /api/cx3/incoming

const processedCalls = new Map(); // Cache chiamate processate

router.post('/incoming', async (req, res) => {
  try {
    const { callId, numero, cliente, timestamp } = req.body;
    
    console.log('📞 Chiamata in arrivo da CX3:', { callId, numero });
    
    // ✅ DEDUPLICAZIONE SERVER-SIDE
    if (processedCalls.has(numero)) {
      const lastProcessed = processedCalls.get(numero);
      const timeDiff = Date.now() - lastProcessed;
      
      // Se ultima chiamata < 3 minuti fa, SKIP
      if (timeDiff < 180000) {
        console.log('⏭️ Chiamata duplicata, skip:', numero, `(${Math.round(timeDiff/1000)}s fa)`);
        return res.json({ 
          success: true, 
          message: 'Chiamata già processata',
          skipped: true
        });
      }
    }
    
    // Aggiungi a processate
    processedCalls.set(numero, Date.now());
    
    // Pulizia automatica dopo 5 minuti
    setTimeout(() => {
      processedCalls.delete(numero);
      console.log('🗑️ Rimossa chiamata da cache:', numero);
    }, 300000);
    
    // ✅ Cerca cliente in database
    const clienteTrovato = await Cliente.findOne({ 
      $or: [
        { telefono: numero },
        { cellulare: numero }
      ]
    });
    
    // Prepara dati evento
    const eventoChiamata = {
      callId,
      numero,
      timestamp: timestamp || new Date(),
      cliente: clienteTrovato || cliente,
      tipo: 'inbound',
      stato: 'ringing'
    };
    
    // ✅ Invia evento Pusher UNA SOLA VOLTA
    await pusher.trigger('chiamate', 'nuova-chiamata', eventoChiamata);
    
    console.log('✅ Chiamata propagata via Pusher:', callId);
    
    res.json({ 
      success: true, 
      message: 'Chiamata ricevuta e propagata',
      callId,
      clienteTrovato: !!clienteTrovato
    });
    
  } catch (error) {
    console.error('❌ Errore gestione chiamata:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Pulizia cache ogni 10 minuti
setInterval(() => {
  const now = Date.now();
  for (const [numero, timestamp] of processedCalls.entries()) {
    if (now - timestamp > 600000) { // 10 minuti
      processedCalls.delete(numero);
      console.log('🧹 Pulizia cache chiamata:', numero);
    }
  }
}, 600000);

module.exports = router;