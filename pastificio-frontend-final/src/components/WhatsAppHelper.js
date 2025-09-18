// components/WhatsAppHelper.js - NUOVO COMPONENTE
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Copy, MessageCircle, Clock, CheckCircle } from 'lucide-react';

export default function WhatsAppHelper({ ordini }) {
  const [ordiniOggi, setOrdiniOggi] = useState([]);
  const [messaggiCopiati, setMessaggiCopiati] = useState({});
  
  const numeroWhatsApp = '3898879833';
  
  useEffect(() => {
    // Filtra ordini di oggi da confermare
    const oggi = new Date().toDateString();
    const ordiniDaConfermare = ordini.filter(o => {
      const dataOrdine = new Date(o.dataRitiro).toDateString();
      return dataOrdine === oggi && !o.confermato;
    });
    setOrdiniOggi(ordiniDaConfermare);
  }, [ordini]);

  const generaMessaggio = (ordine, tipo) => {
    const templates = {
      conferma: `🍝 *PASTIFICIO NONNA CLAUDIA*\n\n✅ Ordine Confermato!\n\nGentile ${ordine.nomeCliente},\nconfermiamo il suo ordine per:\n\n📅 ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}\n⏰ Ore ${ordine.oraRitiro}\n\nProdotti:\n${ordine.prodotti.map(p => `• ${p.nome}: ${p.quantita} ${p.unita}`).join('\n')}\n\n💰 Totale: €${ordine.totale}\n\n📍 Via Carmine 20/B, Assemini\n📞 389 887 9833\n\nGrazie!`,
      
      promemoria: `🔔 *PROMEMORIA RITIRO*\n\nCiao ${ordine.nomeCliente}!\n\nTi ricordiamo il ritiro del tuo ordine domani:\n\n📅 ${new Date(ordine.dataRitiro).toLocaleDateString('it-IT')}\n⏰ Ore ${ordine.oraRitiro}\n\nTi aspettiamo!\n\nPastificio Nonna Claudia\n📍 Via Carmine 20/B`,
      
      pronto: `✅ *ORDINE PRONTO!*\n\n${ordine.nomeCliente}, il tuo ordine è pronto per il ritiro!\n\n⏰ Ti aspettiamo entro le ${ordine.oraRitiro}\n\n📍 Via Carmine 20/B, Assemini\n\nA presto!`
    };
    
    return templates[tipo];
  };

  const copiaMessaggio = (ordine, tipo) => {
    const messaggio = generaMessaggio(ordine, tipo);
    navigator.clipboard.writeText(messaggio);
    
    setMessaggiCopiati({
      ...messaggiCopiati,
      [`${ordine._id}-${tipo}`]: true
    });
    
    setTimeout(() => {
      setMessaggiCopiati(prev => ({
        ...prev,
        [`${ordine._id}-${tipo}`]: false
      }));
    }, 2000);
  };

  const apriWhatsApp = (telefono) => {
    const numeroClean = telefono.replace(/\D/g, '');
    const url = `https://web.whatsapp.com/send?phone=39${numeroClean}`;
    window.open(url, '_blank');
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          WhatsApp Helper - Invio Facilitato
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ordiniOggi.length === 0 ? (
          <p className="text-gray-500">Nessun ordine da confermare oggi</p>
        ) : (
          <div className="space-y-4">
            {ordiniOggi.map(ordine => (
              <div key={ordine._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{ordine.nomeCliente}</h4>
                    <p className="text-sm text-gray-600">
                      📞 {ordine.telefono} | ⏰ {ordine.oraRitiro}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => apriWhatsApp(ordine.telefono)}
                    className="ml-2"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Apri WhatsApp
                  </Button>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={messaggiCopiati[`${ordine._id}-conferma`] ? "success" : "default"}
                    onClick={() => copiaMessaggio(ordine, 'conferma')}
                  >
                    {messaggiCopiati[`${ordine._id}-conferma`] ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Copiato!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copia Conferma
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copiaMessaggio(ordine, 'promemoria')}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Copia Promemoria
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copiaMessaggio(ordine, 'pronto')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Copia "Pronto"
                  </Button>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  Prodotti: {ordine.prodotti.map(p => p.nome).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Come funziona:</strong><br/>
            1. Clicca "Copia" sul messaggio desiderato<br/>
            2. Clicca "Apri WhatsApp" per aprire la chat<br/>
            3. Incolla (Ctrl+V) e invia<br/>
            4. Il messaggio è già formattato perfettamente!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
