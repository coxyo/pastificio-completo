'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { LoggingService } from '../services/loggingService';

const SistemaStampe = ({ ordini }) => {
  const [templates, setTemplates] = useState([]);
  const [templateSelezionato, setTemplateSelezionato] = useState(null);
  const [nuovoTemplate, setNuovoTemplate] = useState({
    nome: '',
    tipo: 'ordine',
    formato: 'A4',
    orientamento: 'verticale',
    contenuto: '',
    attivo: true
  });
  const [anteprimaHtml, setAnteprimaHtml] = useState('');
  const [modalitaModifica, setModalitaModifica] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifica, setNotifica] = useState(null);
  
  const tipiDocumento = ['ordine', 'riepilogo_giornaliero', 'etichetta', 'fattura'];
  const formatiCarta = ['A4', 'A5', 'Etichetta'];
  const orientamenti = ['verticale', 'orizzontale'];
  
  useEffect(() => {
    const caricaTemplates = () => {
      try {
        setLoading(true);
        
        // Carica templates dal localStorage
        const templatesStorati = localStorage.getItem('templates_stampa');
        let templatesData = [];
        
        if (templatesStorati) {
          templatesData = JSON.parse(templatesStorati);
        } else {
          // Se non ci sono templates, crea quelli di default
          templatesData = creaTemplatesDefault();
          localStorage.setItem('templates_stampa', JSON.stringify(templatesData));
        }
        
        setTemplates(templatesData);
        
        // Se c'è almeno un template, seleziona il primo
        if (templatesData.length > 0) {
          setTemplateSelezionato(templatesData[0]);
          setNuovoTemplate({...templatesData[0]});
          generaAnteprima(templatesData[0]);
        }
        
        LoggingService.info('Templates di stampa caricati', { count: templatesData.length });
      } catch (error) {
        console.error('Errore caricamento templates', error);
        LoggingService.error('Errore caricamento templates di stampa', error);
        mostraNotifica('Errore durante il caricamento dei templates', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    caricaTemplates();
  }, []);
  
  const creaTemplatesDefault = () => {
    return [
      {
        id: 'ordine-default',
        nome: 'Template Ordine Standard',
        tipo: 'ordine',
        formato: 'A4',
        orientamento: 'verticale',
        contenuto: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="margin: 0;">{{pastificio.nome}}</h1>
              <p>{{pastificio.indirizzo}} - Tel: {{pastificio.telefono}}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h2>Dettagli Ordine</h2>
              <p><strong>Cliente:</strong> {{ordine.nomeCliente}}</p>
              <p><strong>Telefono:</strong> {{ordine.telefono}}</p>
              <p><strong>Data Ritiro:</strong> {{ordine.dataRitiro}}</p>
              <p><strong>Ora Ritiro:</strong> {{ordine.oraRitiro}}</p>
              <p><strong>Da Viaggio:</strong> {{ordine.daViaggio ? 'Sì' : 'No'}}</p>
              {{#if ordine.note}}
              <p><strong>Note:</strong> {{ordine.note}}</p>
              {{/if}}
            </div>
            
            <div>
              <h2>Prodotti</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Prodotto</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Quantità</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Prezzo</th>
                  </tr>
                </thead>
                <tbody>
                  {{#each ordine.prodotti}}
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">
                      {{this.prodotto}}
                      {{#if this.note}}
                      <br><small><em>{{this.note}}</em></small>
                      {{/if}}
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
                      {{this.quantita}} {{this.unita}}
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
                      €{{this.prezzo.toFixed(2)}}
                    </td>
                  </tr>
                  {{/each}}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="border: 1px solid #ddd; padding: 8px; text-align: right;">
                      <strong>Totale</strong>
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
                      <strong>€{{calcolaTotale ordine.prodotti}}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
              <p>Grazie per aver scelto {{pastificio.nome}}!</p>
            </div>
          </div>
        `,
        attivo: true
      },
      {
        id: 'riepilogo-giornaliero-default',
        nome: 'Riepilogo Giornaliero Standard',
        tipo: 'riepilogo_giornaliero',
        formato: 'A4',
        orientamento: 'verticale',
        contenuto: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="margin: 0;">{{pastificio.nome}}</h1>
              <p>{{pastificio.indirizzo}} - Tel: {{pastificio.telefono}}</p>
              <h2>Riepilogo Ordini del {{dataSelezionata}}</h2>
            </div>
            
            <div>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Ora</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Cliente</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Telefono</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Prodotti</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Totale</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Viaggio</th>
                  </tr>
                </thead>
                <tbody>
                  {{#each ordini}}
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">{{this.oraRitiro}}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">{{this.nomeCliente}}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">{{this.telefono}}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">
                      <ul style="margin: 0; padding-left: 20px;">
                        {{#each this.prodotti}}
                        <li>
                          {{this.prodotto}}: {{this.quantita}} {{this.unita}}
                          {{#if this.note}} - <em>{{this.note}}</em>{{/if}}
                        </li>
                        {{/each}}
                      </ul>
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
                      €{{calcolaTotale this.prodotti}}
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                      {{this.daViaggio ? 'Sì' : 'No'}}
                    </td>
                  </tr>
                  {{#if this.note}}
                  <tr>
                    <td colspan="6" style="border: 1px solid #ddd; padding: 8px; background-color: #f9f9f9;">
                      <strong>Note:</strong> {{this.note}}
                    </td>
                  </tr>
                  {{/if}}
                  {{/each}}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: right;">
                      <strong>Totale Giornaliero</strong>
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
                      <strong>€{{calcolaTotaleGiornaliero ordini}}</strong>
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px;"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        `,
        attivo: true
      }
    ];
  };
  
  // Genera anteprima HTML sostituendo i placeholder con dati di esempio
  const generaAnteprima = (template) => {
    try {
      if (!template) return;
      
      // Crea dati di esempio in base al tipo di template
      const datiEsempio = creaDatiEsempio(template.tipo);
      
      // Sostituisci le variabili nel template con i dati di esempio
      let html = template.contenuto;
      
      // Sostituzione delle variabili semplici
      html = html.replace(/{{pastificio\.nome}}/g, datiEsempio.pastificio.nome);
      html = html.replace(/{{pastificio\.indirizzo}}/g, datiEsempio.pastificio.indirizzo);
      html = html.replace(/{{pastificio\.telefono}}/g, datiEsempio.pastificio.telefono);
      
      if (template.tipo === 'ordine') {
        html = html.replace(/{{ordine\.nomeCliente}}/g, datiEsempio.ordine.nomeCliente);
        html = html.replace(/{{ordine\.telefono}}/g, datiEsempio.ordine.telefono);
        html = html.replace(/{{ordine\.dataRitiro}}/g, datiEsempio.ordine.dataRitiro);
        html = html.replace(/{{ordine\.oraRitiro}}/g, datiEsempio.ordine.oraRitiro);
        html = html.replace(/{{ordine\.daViaggio \? 'Sì' : 'No'}}/g, datiEsempio.ordine.daViaggio ? 'Sì' : 'No');
        
        // Sostituzione delle condizioni #if
        html = html.replace(/{{#if ordine\.note}}([\s\S]*?){{\/if}}/g, 
          datiEsempio.ordine.note ? `<p><strong>Note:</strong> ${datiEsempio.ordine.note}</p>` : '');
        
        // Sostituzione del each per i prodotti
        let prodottiHtml = '';
        datiEsempio.ordine.prodotti.forEach(prodotto => {
          let riga = `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">
                ${prodotto.prodotto}
                ${prodotto.note ? `<br><small><em>${prodotto.note}</em></small>` : ''}
              </td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
                ${prodotto.quantita} ${prodotto.unita}
              </td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
                €${prodotto.prezzo.toFixed(2)}
              </td>
            </tr>
          `;
          prodottiHtml += riga;
        });
        
        html = html.replace(/{{#each ordine\.prodotti}}[\s\S]*?{{\/each}}/g, prodottiHtml);
        
        // Calcola totale
        const totale = datiEsempio.ordine.prodotti.reduce((sum, p) => sum + p.prezzo, 0).toFixed(2);
        html = html.replace(/{{calcolaTotale ordine\.prodotti}}/g, totale);
      } else if (template.tipo === 'riepilogo_giornaliero') {
        html = html.replace(/{{dataSelezionata}}/g, datiEsempio.dataSelezionata);
        
        // Sostituzione del each per gli ordini
        let ordiniHtml = '';
        datiEsempio.ordini.forEach(ordine => {
          let prodottiLista = '';
          ordine.prodotti.forEach(prodotto => {
            prodottiLista += `
              <li>
                ${prodotto.prodotto}: ${prodotto.quantita} ${prodotto.unita}
                ${prodotto.note ? ` - <em>${prodotto.note}</em>` : ''}
              </li>
            `;
          });
          
          const totaleOrdine = ordine.prodotti.reduce((sum, p) => sum + p.prezzo, 0).toFixed(2);
          
          let rigaOrdine = `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${ordine.oraRitiro}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${ordine.nomeCliente}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${ordine.telefono}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">
                <ul style="margin: 0; padding-left: 20px;">
                  ${prodottiLista}
                </ul>
              </td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
                €${totaleOrdine}
              </td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                ${ordine.daViaggio ? 'Sì' : 'No'}
              </td>
            </tr>
          `;
          
          if (ordine.note) {
            rigaOrdine += `
              <tr>
                <td colspan="6" style="border: 1px solid #ddd; padding: 8px; background-color: #f9f9f9;">
                  <strong>Note:</strong> ${ordine.note}
                </td>
              </tr>
            `;
          }
          
          ordiniHtml += rigaOrdine;
        });
        
        html = html.replace(/{{#each ordini}}[\s\S]*?{{\/each}}/g, ordiniHtml);
        
        // Calcola totale giornaliero
        const totaleGiornaliero = datiEsempio.ordini
          .flatMap(o => o.prodotti)
          .reduce((sum, p) => sum + p.prezzo, 0)
          .toFixed(2);
          
        html = html.replace(/{{calcolaTotaleGiornaliero ordini}}/g, totaleGiornaliero);
      }
      
      setAnteprimaHtml(html);
    } catch (error) {
      console.error('Errore generazione anteprima', error);
      LoggingService.error('Errore generazione anteprima template', error);
      mostraNotifica('Errore nella generazione dell\'anteprima', 'error');
    }
  };
  
  // Crea dati di esempio per l'anteprima
  const creaDatiEsempio = (tipo) => {
    const pastificio = {
      nome: 'Pastificio Nonna Claudia',
      indirizzo: 'Via Roma 123, Cagliari',
      telefono: '070 123456'
    };
    
    const prodottiEsempio = [
      { prodotto: 'Pardulas', quantita: 1, prezzo: 18, unita: 'Kg' },
      { prodotto: 'Culurgiones', quantita: 1.5, prezzo: 21, unita: 'Kg', note: 'Con ripieno tradizionale' },
      { prodotto: 'Panadine', quantita: 8, prezzo: 6.40, unita: 'unità' }
    ];
    
    if (tipo === 'ordine') {
      return {
        pastificio,
        ordine: {
          nomeCliente: 'Mario Rossi',
          telefono: '333 1234567',
          dataRitiro: '30/11/2024',
          oraRitiro: '15:30',
          daViaggio: true,
          note: 'Consegna al piano terra',
          prodotti: prodottiEsempio
        }
      };
    } else if (tipo === 'riepilogo_giornaliero') {
      return {
        pastificio,
        dataSelezionata: '30/11/2024',
        ordini: [
          {
            nomeCliente: 'Mario Rossi',
            telefono: '333 1234567',
            dataRitiro: '30/11/2024',
            oraRitiro: '15:30',
            daViaggio: true,
            note: 'Consegna al piano terra',
            prodotti: prodottiEsempio
          },
          {
            nomeCliente: 'Giovanna Bianchi',
            telefono: '333 7654321',
            dataRitiro: '30/11/2024',
            oraRitiro: '16:45',
            daViaggio: false,
            prodotti: [
              { prodotto: 'Ravioli ricotta e spinaci', quantita: 2, prezzo: 20, unita: 'Kg' },
              { prodotto: 'Panada di agnello', quantita: 1, prezzo: 30, unita: 'Kg' }
            ]
          },
          {
            nomeCliente: 'Luca Verdi',
            telefono: '333 9876543',
            dataRitiro: '30/11/2024',
            oraRitiro: '18:00',
            daViaggio: true,
            note: 'Chiamare 10 minuti prima',
            prodotti: [
              { prodotto: 'Dolci misti', quantita: 1.5, prezzo: 27, unita: 'Kg' },
              { prodotto: 'Amaretti', quantita: 0.5, prezzo: 10, unita: 'Kg' }
            ]
          }
        ]
      };
    } else if (tipo === 'etichetta') {
      return {
        pastificio,
        etichetta: {
          prodotto: 'Culurgiones',
          lotto: 'L123456',
          dataConfezionamento: '30/11/2024',
          scadenza: '03/12/2024',
          ingredienti: 'Farina, patate, formaggio, cipolla, menta, sale'
        }
      };
    } else {
      return {
        pastificio
      };
    }
  };
  
  // Salva un template
  const salvaTemplate = () => {
    try {
      if (!nuovoTemplate.nome) {
        mostraNotifica('Il nome del template è obbligatorio', 'warning');
        return;
      }
      
      if (!nuovoTemplate.contenuto) {
        mostraNotifica('Il contenuto del template è obbligatorio', 'warning');
        return;
      }
      
      let nuoviTemplates = [...templates];
      
      if (modalitaModifica && templateSelezionato) {
        // Aggiornamento di un template esistente
        nuoviTemplates = nuoviTemplates.map(t => 
          t.id === templateSelezionato.id ? { ...nuovoTemplate, id: templateSelezionato.id } : t
        );
      } else {
        // Creazione di un nuovo template
        const nuovoId = `template-${Date.now()}`;
        nuoviTemplates.push({ ...nuovoTemplate, id: nuovoId });
      }
      
      setTemplates(nuoviTemplates);
      localStorage.setItem('templates_stampa', JSON.stringify(nuoviTemplates));
      
      // Reset modalità e mostro notifica
      setModalitaModifica(false);
      setTemplateSelezionato(nuovoTemplate);
      LoggingService.info('Template di stampa salvato', { nome: nuovoTemplate.nome });
      mostraNotifica('Template salvato con successo', 'success');
      
      // Aggiorna anteprima
      generaAnteprima(nuovoTemplate);
    } catch (error) {
      console.error('Errore salvataggio template', error);
      LoggingService.error('Errore salvataggio template di stampa', error);
      mostraNotifica('Errore durante il salvataggio del template', 'error');
    }
  };
  
  // Elimina un template
  const eliminaTemplate = (id) => {
    try {
      if (!id) return;
      
      // Controlla che non sia l'ultimo template
      if (templates.length <= 1) {
        mostraNotifica('Non puoi eliminare l\'ultimo template', 'warning');
        return;
      }
      
      const nuoviTemplates = templates.filter(t => t.id !== id);
      setTemplates(nuoviTemplates);
      localStorage.setItem('templates_stampa', JSON.stringify(nuoviTemplates));
      
      // Se è stato eliminato il template selezionato, seleziona il primo disponibile
      if (templateSelezionato && templateSelezionato.id === id) {
        setTemplateSelezionato(nuoviTemplates[0]);
        setNuovoTemplate({...nuoviTemplates[0]});
        generaAnteprima(nuoviTemplates[0]);
      }
      
      LoggingService.info('Template di stampa eliminato', { id });
      mostraNotifica('Template eliminato con successo', 'success');
    } catch (error) {
      console.error('Errore eliminazione template', error);
      LoggingService.error('Errore eliminazione template di stampa', error);
      mostraNotifica('Errore durante l\'eliminazione del template', 'error');
    }
  };
  
  // Crea un nuovo template
  const creaNuovoTemplate = () => {
    setNuovoTemplate({
      nome: '',
      tipo: 'ordine',
      formato: 'A4',
      orientamento: 'verticale',
      contenuto: '',
      attivo: true
    });
    setModalitaModifica(false);
    setTemplateSelezionato(null);
    setAnteprimaHtml('');
  };
  
  // Seleziona un template esistente
  const selezionaTemplate = (template) => {
    setTemplateSelezionato(template);
    setNuovoTemplate({...template});
    setModalitaModifica(true);
    generaAnteprima(template);
  };
  
  // Stampa il template corrente
  const stampa = () => {
    try {
      // Crea una nuova finestra per la stampa
      const finestraStampa = window.open('', '_blank');
      finestraStampa.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Stampa</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            @media print {
              body {
                width: 100%;
                margin: 0;
                padding: 0;
              }
              @page {
                size: ${templateSelezionato.formato} ${templateSelezionato.orientamento};
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          ${anteprimaHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
        </html>
      `);
      finestraStampa.document.close();
      
      LoggingService.info('Stampa avviata', { 
        template: templateSelezionato.nome,
        formato: templateSelezionato.formato,
        orientamento: templateSelezionato.orientamento
      });
    } catch (error) {
      console.error('Errore stampa', error);
      LoggingService.error('Errore durante la stampa', error);
      mostraNotifica('Errore durante la stampa', 'error');
    }
  };
  
  // Mostra notifica
  const mostraNotifica = (messaggio, tipo = 'info') => {
    setNotifica({ messaggio, tipo });
    
    // Auto-chiusura dopo 5 secondi
    setTimeout(() => {
      setNotifica(null);
    }, 5000);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sistema di Stampe</h1>
      
      {/* Notifica */}
      {notifica && (
        <div className={`mb-4 p-4 rounded ${
          notifica.tipo === 'success' ? 'bg-green-100 text-green-800' :
          notifica.tipo === 'error' ? 'bg-red-100 text-red-800' :
          notifica.tipo === 'warning' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {notifica.messaggio}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Elenco templates */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Template Disponibili</h2>
                <button 
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  onClick={creaNuovoTemplate}
                >
                  Nuovo Template
                </button>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nessun template disponibile
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map(template => (
                    <div 
                      key={template.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                        templateSelezionato && templateSelezionato.id === template.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => selezionaTemplate(template)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{template.nome}</p>
                          <p className="text-sm text-gray-500 capitalize">
                            {template.tipo.replace('_', ' ')} - {template.formato} - {template.orientamento}
                          </p>
                        </div>
                        <button 
                          className="text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminaTemplate(template.id);
                          }}
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Editor e anteprima */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-6">
            {/* Editor */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  {modalitaModifica ? 'Modifica Template' : 'Nuovo Template'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Template</label>
<input 
                      type="text" 
                      className="block w-full p-2 border border-gray-300 rounded-md"
                      value={nuovoTemplate.nome}
                      onChange={(e) => setNuovoTemplate({...nuovoTemplate, nome: e.target.value})}
                      placeholder="Nome del template"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
                    <select 
                      className="block w-full p-2 border border-gray-300 rounded-md"
                      value={nuovoTemplate.tipo}
                      onChange={(e) => {
                        const nuovoTipo = e.target.value;
                        setNuovoTemplate({...nuovoTemplate, tipo: nuovoTipo});
                        setTimeout(() => generaAnteprima({...nuovoTemplate, tipo: nuovoTipo}), 0);
                      }}
                    >
                      {tipiDocumento.map(tipo => (
                        <option key={tipo} value={tipo} className="capitalize">
                          {tipo.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
                    <select 
                      className="block w-full p-2 border border-gray-300 rounded-md"
                      value={nuovoTemplate.formato}
                      onChange={(e) => setNuovoTemplate({...nuovoTemplate, formato: e.target.value})}
                    >
                      {formatiCarta.map(formato => (
                        <option key={formato} value={formato}>
                          {formato}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orientamento</label>
                    <select 
                      className="block w-full p-2 border border-gray-300 rounded-md"
                      value={nuovoTemplate.orientamento}
                      onChange={(e) => setNuovoTemplate({...nuovoTemplate, orientamento: e.target.value})}
                    >
                      {orientamenti.map(orientamento => (
                        <option key={orientamento} value={orientamento} className="capitalize">
                          {orientamento}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Contenuto HTML</label>
                    <div className="text-xs text-gray-500">
                      Usa {'{{variabile}}'} per inserire i dati dinamici
                    </div>
                  </div>
                  <textarea 
                    className="block w-full p-2 border border-gray-300 rounded-md font-mono text-sm h-60"
                    value={nuovoTemplate.contenuto}
                    onChange={(e) => setNuovoTemplate({...nuovoTemplate, contenuto: e.target.value})}
                    placeholder="Inserisci il contenuto HTML del template"
                  />
                </div>
                
                <div className="flex items-center mb-4">
                  <input 
                    type="checkbox" 
                    className="mr-2 h-4 w-4"
                    checked={nuovoTemplate.attivo}
                    onChange={(e) => setNuovoTemplate({...nuovoTemplate, attivo: e.target.checked})}
                    id="attivo"
                  />
                  <label htmlFor="attivo" className="text-sm font-medium text-gray-700">Template attivo</label>
                </div>
                
                <div className="flex space-x-3">
                  <button 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={salvaTemplate}
                  >
                    {modalitaModifica ? 'Aggiorna Template' : 'Salva Template'}
                  </button>
                  
                  <button 
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    onClick={() => generaAnteprima(nuovoTemplate)}
                  >
                    Aggiorna Anteprima
                  </button>
                </div>
              </div>
            </Card>
            
            {/* Anteprima */}
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Anteprima</h2>
                  
                  {templateSelezionato && (
                    <button 
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      onClick={stampa}
                    >
                      Stampa
                    </button>
                  )}
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : !anteprimaHtml ? (
                  <div className="bg-gray-50 border rounded-md p-8 text-center text-gray-500">
                    {templateSelezionato 
                      ? 'Clicca su "Aggiorna Anteprima" per visualizzare il template' 
                      : 'Seleziona o crea un template per visualizzare l\'anteprima'}
                  </div>
                ) : (
                  <div className="border rounded-md overflow-auto max-h-[600px]">
                    <div 
                      className="p-4"
                      dangerouslySetInnerHTML={{__html: anteprimaHtml}}
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Guida variabili */}
      <Card className="mt-6">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Guida Variabili Template</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Informazioni Pastificio</h3>
              <ul className="space-y-1 text-sm">
                <li><code className="bg-gray-100 px-1">{'{{pastificio.nome}}'}</code> - Nome pastificio</li>
                <li><code className="bg-gray-100 px-1">{'{{pastificio.indirizzo}}'}</code> - Indirizzo</li>
                <li><code className="bg-gray-100 px-1">{'{{pastificio.telefono}}'}</code> - Telefono</li>
                <li><code className="bg-gray-100 px-1">{'{{pastificio.email}}'}</code> - Email</li>
                <li><code className="bg-gray-100 px-1">{'{{pastificio.partitaIva}}'}</code> - Partita IVA</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Ordine</h3>
              <ul className="space-y-1 text-sm">
                <li><code className="bg-gray-100 px-1">{'{{ordine.nomeCliente}}'}</code> - Nome cliente</li>
                <li><code className="bg-gray-100 px-1">{'{{ordine.telefono}}'}</code> - Telefono</li>
                <li><code className="bg-gray-100 px-1">{'{{ordine.dataRitiro}}'}</code> - Data ritiro</li>
                <li><code className="bg-gray-100 px-1">{'{{ordine.oraRitiro}}'}</code> - Ora ritiro</li>
                <li><code className="bg-gray-100 px-1">{'{{ordine.daViaggio ? "Sì" : "No"}}'}</code> - Da viaggio</li>
                <li><code className="bg-gray-100 px-1">{'{{#if ordine.note}}...{{/if}}'}</code> - Condizionale per note</li>
                <li><code className="bg-gray-100 px-1">{'{{ordine.note}}'}</code> - Note ordine</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Iterazione e Funzioni</h3>
              <ul className="space-y-1 text-sm">
                <li><code className="bg-gray-100 px-1">{'{{#each ordine.prodotti}}...{{/each}}'}</code> - Iterazione prodotti</li>
                <li><code className="bg-gray-100 px-1">{'{{this.prodotto}}'}</code> - Nome prodotto (dentro each)</li>
                <li><code className="bg-gray-100 px-1">{'{{this.quantita}}'}</code> - Quantità (dentro each)</li>
                <li><code className="bg-gray-100 px-1">{'{{this.unita}}'}</code> - Unità di misura (dentro each)</li>
                <li><code className="bg-gray-100 px-1">{'{{this.prezzo.toFixed(2)}}'}</code> - Prezzo formattato (dentro each)</li>
                <li><code className="bg-gray-100 px-1">{'{{calcolaTotale ordine.prodotti}}'}</code> - Calcola totale</li>
                <li><code className="bg-gray-100 px-1">{'{{calcolaTotaleGiornaliero ordini}}'}</code> - Totale giornaliero</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SistemaStampe;