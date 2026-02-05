// controllers/importFattureController.js
// Controller per l'import delle fatture XML da Danea EasyFatt
// VERSIONE 2: Accetta XML come testo JSON (parsing lato frontend)

import { parseStringPromise } from 'xml2js';
import crypto from 'crypto';
import ImportFattura from '../models/ImportFattura.js';
import MappingProdottiFornitore from '../models/MappingProdottiFornitore.js';
import Ingrediente from '../models/Ingrediente.js';
import Movimento from '../models/Movimento.js';
import Fornitore from '../models/Fornitore.js';
import logger from '../config/logger.js';

/**
 * Parsing del file XML fattura elettronica
 */
const parseXMLFattura = async (xmlContent) => {
  try {
    // Parse XML con rimozione namespace
    const result = await parseStringPromise(xmlContent, {
      explicitArray: false,
      ignoreAttrs: false,
      tagNameProcessors: [(name) => name.replace(/^[\w]+:/, '')]  // Rimuovi qualsiasi namespace prefix
    });
    
    // Trova il nodo FatturaElettronica
    let fattura = result.FatturaElettronica || Object.values(result)[0];
    
    if (!fattura) {
      throw new Error('Formato XML non riconosciuto: nodo FatturaElettronica non trovato');
    }
    
    // Estrai header e body
    const header = fattura.FatturaElettronicaHeader;
    const body = fattura.FatturaElettronicaBody;
    
    if (!header || !body) {
      throw new Error('Struttura fattura non valida: mancano Header o Body');
    }
    
    // Dati fornitore (cedente/prestatore)
    const cedente = header.CedentePrestatore;
    const anagraficaCedente = cedente?.DatiAnagrafici;
    const sedeCedente = cedente?.Sede;
    
    const fornitore = {
      partitaIva: anagraficaCedente?.IdFiscaleIVA?.IdCodice || '',
      codiceFiscale: anagraficaCedente?.CodiceFiscale || '',
      ragioneSociale: anagraficaCedente?.Anagrafica?.Denominazione || '',
      nome: anagraficaCedente?.Anagrafica?.Nome || '',
      cognome: anagraficaCedente?.Anagrafica?.Cognome || '',
      indirizzo: {
        via: sedeCedente?.Indirizzo || '',
        cap: sedeCedente?.CAP || '',
        comune: sedeCedente?.Comune || '',
        provincia: sedeCedente?.Provincia || ''
      }
    };
    
    // Dati generali documento
    const datiGenerali = body.DatiGenerali?.DatiGeneraliDocumento;
    const documento = {
      tipoDocumento: datiGenerali?.TipoDocumento || 'TD01',
      numero: datiGenerali?.Numero || '',
      data: datiGenerali?.Data ? new Date(datiGenerali.Data) : new Date(),
      importoTotale: parseFloat(datiGenerali?.ImportoTotaleDocumento || 0)
    };
    
    // DDT collegati
    const datiDDT = body.DatiGenerali?.DatiDDT;
    const ddt = [];
    if (datiDDT) {
      const ddtArray = Array.isArray(datiDDT) ? datiDDT : [datiDDT];
      ddtArray.forEach(d => {
        if (d.NumeroDDT && !ddt.find(x => x.numero === d.NumeroDDT)) {
          ddt.push({
            numero: d.NumeroDDT,
            data: d.DataDDT ? new Date(d.DataDDT) : null
          });
        }
      });
    }
    
    // Righe prodotti
    const datiBeniServizi = body.DatiBeniServizi;
    const dettaglioLinee = datiBeniServizi?.DettaglioLinee;
    const righe = [];
    
    if (dettaglioLinee) {
      const lineeArray = Array.isArray(dettaglioLinee) ? dettaglioLinee : [dettaglioLinee];
      
      lineeArray.forEach(linea => {
        // Gestisci CodiceArticolo (può essere array o oggetto)
        let codiceArticolo = '';
        if (linea.CodiceArticolo) {
          if (Array.isArray(linea.CodiceArticolo)) {
            codiceArticolo = linea.CodiceArticolo[0]?.CodiceValore || '';
          } else {
            codiceArticolo = linea.CodiceArticolo.CodiceValore || '';
          }
        }
        
        righe.push({
          numeroLinea: parseInt(linea.NumeroLinea || 0),
          descrizione: linea.Descrizione || '',
          codiceArticolo,
          quantita: parseFloat(linea.Quantita || 0),
          unitaMisura: (linea.UnitaMisura || 'PZ').toUpperCase(),
          prezzoUnitario: parseFloat(linea.PrezzoUnitario || 0),
          prezzoTotale: parseFloat(linea.PrezzoTotale || 0),
          aliquotaIva: parseFloat(linea.AliquotaIVA || 0)
        });
      });
    }
    
    // Riepilogo IVA
    const datiRiepilogo = datiBeniServizi?.DatiRiepilogo;
    let imponibile = 0;
    let imposta = 0;
    
    if (datiRiepilogo) {
      const riepilogoArray = Array.isArray(datiRiepilogo) ? datiRiepilogo : [datiRiepilogo];
      riepilogoArray.forEach(r => {
        imponibile += parseFloat(r.ImponibileImporto || 0);
        imposta += parseFloat(r.Imposta || 0);
      });
    }
    
    return {
      fornitore,
      documento,
      ddt,
      righe,
      imponibile,
      imposta
    };
    
  } catch (error) {
    logger.error('Errore parsing XML fattura:', error);
    throw new Error(`Errore parsing XML: ${error.message}`);
  }
};

/**
 * Calcola hash del contenuto XML per evitare reimport
 */
const calcolaHash = (content) => {
  return crypto.createHash('md5').update(content).digest('hex');
};

/**
 * Upload e parsing fatture XML
 * Accetta sia file multipart che XML come testo JSON
 */
export const uploadFatture = async (req, res) => {
  try {
    let fileDaProcessare = [];
    
    // METODO 1: File XML come testo nel body JSON
    if (req.body && req.body.files && Array.isArray(req.body.files)) {
      fileDaProcessare = req.body.files.map(f => ({
        name: f.name,
        content: f.content,
        size: f.content ? f.content.length : 0
      }));
    }
    // METODO 2: express-fileupload (fallback)
    else if (req.files && req.files.fatture) {
      const files = Array.isArray(req.files.fatture) 
        ? req.files.fatture 
        : [req.files.fatture];
      fileDaProcessare = files.map(f => ({
        name: f.name,
        content: f.data.toString('utf8'),
        size: f.size
      }));
    }
    
    if (fileDaProcessare.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nessun file caricato'
      });
    }
    
    const risultati = [];
    
    for (const file of fileDaProcessare) {
      try {
        const xmlContent = file.content;
        const hash = calcolaHash(xmlContent);
        
        // Verifica se già processato (per hash)
        const esistente = await ImportFattura.findOne({ 
          'fileOriginale.hashMD5': hash,
          stato: { $ne: 'annullato' }
        });
        
        if (esistente) {
          risultati.push({
            file: file.name,
            stato: 'duplicato',
            messaggio: `Fattura già importata il ${new Date(esistente.createdAt).toLocaleDateString('it-IT')}`,
            fattura: {
              numero: esistente.numero,
              data: esistente.data,
              fornitore: esistente.fornitore?.ragioneSociale || 
                `${esistente.fornitore?.nome || ''} ${esistente.fornitore?.cognome || ''}`.trim()
            }
          });
          continue;
        }
        
        // Parse XML
        const dati = await parseXMLFattura(xmlContent);
        
        // Verifica se fattura già importata (per numero/anno/fornitore)
        const anno = dati.documento.data.getFullYear();
        const identificativo = `${dati.fornitore.partitaIva}_${dati.documento.numero}_${anno}`;
        
        const esistentePerNumero = await ImportFattura.findOne({ 
          identificativo,
          stato: { $ne: 'annullato' }
        });
        
        if (esistentePerNumero) {
          risultati.push({
            file: file.name,
            stato: 'duplicato',
            messaggio: `Fattura ${dati.documento.numero}/${anno} già importata`,
            fattura: {
              numero: esistentePerNumero.numero,
              data: esistentePerNumero.data,
              fornitore: esistentePerNumero.fornitore?.ragioneSociale
            }
          });
          continue;
        }
        
        // Carica ingredienti per matching
        const ingredienti = await Ingrediente.find({ attivo: true }).lean();
        
        // Cerca mapping esistenti e suggerisci per ogni riga
        const righeConMapping = await Promise.all(dati.righe.map(async (riga) => {
          // Cerca mapping esistente per questo fornitore + descrizione
          const mappingEsistente = await MappingProdottiFornitore.findOne({
            'fornitore.partitaIva': dati.fornitore.partitaIva,
            descrizioneFornitore: riga.descrizione,
            attivo: true
          });
          
          if (mappingEsistente && mappingEsistente.prodottoMagazzino?.ingredienteId) {
            return {
              ...riga,
              mapping: {
                trovato: true,
                ingredienteId: mappingEsistente.prodottoMagazzino.ingredienteId,
                ingredienteNome: mappingEsistente.prodottoMagazzino.nome,
                categoria: mappingEsistente.prodottoMagazzino.categoria,
                confermato: mappingEsistente.confermatoManualmente,
                score: 100
              }
            };
          }
          
          // Cerca suggerimento fuzzy tra ingredienti
          const suggerimento = trovaMigliorMatch(riga.descrizione, ingredienti);
          
          if (suggerimento && suggerimento.score >= 40) {
            return {
              ...riga,
              mapping: {
                trovato: false,
                suggerito: true,
                ingredienteId: suggerimento.ingrediente._id,
                ingredienteNome: suggerimento.ingrediente.nome,
                categoria: suggerimento.ingrediente.categoria,
                score: suggerimento.score
              }
            };
          }
          
          // Nessun mapping trovato
          return {
            ...riga,
            mapping: {
              trovato: false,
              suggerito: false
            }
          };
        }));
        
        // Cerca fornitore nel database
        let fornitoreDb = null;
        if (dati.fornitore.partitaIva) {
          fornitoreDb = await Fornitore.findOne({
            partitaIVA: dati.fornitore.partitaIva
          });
        }
        
        risultati.push({
          file: file.name,
          stato: 'analizzato',
          fattura: {
            numero: dati.documento.numero,
            data: dati.documento.data,
            tipoDocumento: dati.documento.tipoDocumento,
            importoTotale: dati.documento.importoTotale,
            imponibile: dati.imponibile,
            imposta: dati.imposta
          },
          fornitore: {
            ...dati.fornitore,
            esisteNelDb: !!fornitoreDb,
            fornitoreDbId: fornitoreDb?._id
          },
          ddt: dati.ddt,
          righe: righeConMapping,
          fileInfo: {
            nome: file.name,
            dimensione: file.size,
            hash: hash
          }
        });
        
      } catch (fileError) {
        risultati.push({
          file: file.name,
          stato: 'errore',
          messaggio: fileError.message
        });
      }
    }
    
    // Carica lista ingredienti per dropdown frontend
    const ingredienti = await Ingrediente.find({ attivo: true })
      .select('_id nome categoria unitaMisura')
      .sort('nome')
      .lean();
    
    res.json({
      success: true,
      data: {
        risultati,
        ingredienti
      }
    });
    
  } catch (error) {
    logger.error('Errore upload fatture:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Fuzzy matching semplice tra descrizione fattura e ingredienti
 */
function trovaMigliorMatch(descrizione, ingredienti) {
  if (!descrizione || !ingredienti.length) return null;
  
  const descNorm = normalizzaTesto(descrizione);
  let miglior = null;
  let migliorScore = 0;
  
  for (const ing of ingredienti) {
    const nomeNorm = normalizzaTesto(ing.nome);
    const score = calcolaScore(descNorm, nomeNorm);
    
    if (score > migliorScore) {
      migliorScore = score;
      miglior = ing;
    }
  }
  
  return miglior ? { ingrediente: miglior, score: migliorScore } : null;
}

function normalizzaTesto(testo) {
  return testo
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // Rimuovi accenti
    .replace(/[^a-z0-9\s]/g, ' ')  // Solo alfanumerici
    .replace(/\s+/g, ' ')
    .trim();
}

function calcolaScore(desc, nome) {
  const paroleDesc = desc.split(' ').filter(p => p.length > 2);
  const paroleNome = nome.split(' ').filter(p => p.length > 2);
  
  if (!paroleNome.length) return 0;
  
  let match = 0;
  for (const parola of paroleNome) {
    if (paroleDesc.some(p => p.includes(parola) || parola.includes(p))) {
      match++;
    }
  }
  
  return Math.round((match / paroleNome.length) * 100);
}

/**
 * Conferma import fattura con mapping
 */
export const confermaImport = async (req, res) => {
  try {
    const { fattura, righe, fileInfo } = req.body;
    
    if (!fattura || !righe || !righe.length) {
      return res.status(400).json({
        success: false,
        error: 'Dati fattura incompleti'
      });
    }
    
    // Genera identificativo
    const anno = new Date(fattura.data).getFullYear();
    const identificativo = `${fattura.fornitore.partitaIva}_${fattura.numero}_${anno}`;
    
    // Verifica di nuovo che non esista
    const esistente = await ImportFattura.findOne({ 
      identificativo,
      stato: { $ne: 'annullato' }
    });
    
    if (esistente) {
      return res.status(400).json({
        success: false,
        error: 'Fattura già importata'
      });
    }
    
    // Crea record ImportFattura
    const importFattura = new ImportFattura({
      identificativo,
      tipoDocumento: fattura.tipoDocumento,
      numero: fattura.numero,
      data: new Date(fattura.data),
      anno,
      fornitore: fattura.fornitore,
      importoTotale: fattura.importoTotale,
      imponibile: fattura.imponibile,
      imposta: fattura.imposta,
      ddt: fattura.ddt || [],
      fileOriginale: {
        nome: fileInfo?.nome,
        dimensione: fileInfo?.dimensione,
        hashMD5: fileInfo?.hash
      },
      createdBy: req.user?.id
    });
    
    // Processa ogni riga
    const righeProcessate = [];
    const movimentiCreati = [];
    
    for (const riga of righe) {
      const rigaProcessata = {
        numeroLinea: riga.numeroLinea,
        descrizione: riga.descrizione,
        codiceArticolo: riga.codiceArticolo,
        quantita: riga.quantita,
        unitaMisura: riga.unitaMisura,
        prezzoUnitario: riga.prezzoUnitario,
        prezzoTotale: riga.prezzoTotale,
        aliquotaIva: riga.aliquotaIva,
        importato: false
      };
      
      // Se ha un ingrediente selezionato, crea movimento
      const ingredienteId = riga.ingredienteId || riga.mapping?.ingredienteId;
      
      if (ingredienteId) {
        try {
          const ingrediente = await Ingrediente.findById(ingredienteId);
          
          if (ingrediente) {
            // Crea movimento di carico
            const nomeFornitore = fattura.fornitore.ragioneSociale || 
              `${fattura.fornitore.nome || ''} ${fattura.fornitore.cognome || ''}`.trim() ||
              fattura.fornitore.partitaIva;
            
            const movimento = new Movimento({
              tipo: 'carico',
              prodotto: {
                nome: ingrediente.nome,
                categoria: ingrediente.categoria
              },
              ingredienteId: ingrediente._id,
              quantita: riga.quantita,
              unita: riga.unitaMisura.toLowerCase(),
              prezzoUnitario: riga.prezzoUnitario,
              fornitore: { nome: nomeFornitore },
              documentoRiferimento: {
                tipo: 'fattura',
                numero: fattura.numero,
                data: new Date(fattura.data)
              },
              note: `Import automatico da fattura ${fattura.numero}`,
              createdBy: req.user?.id
            });
            
            await movimento.save();
            movimentiCreati.push(movimento);
            
            rigaProcessata.importato = true;
            rigaProcessata.ingredienteId = ingrediente._id;
            rigaProcessata.ingredienteNome = ingrediente.nome;
            rigaProcessata.movimentoId = movimento._id;
            
            // Salva/aggiorna mapping
            await MappingProdottiFornitore.findOneAndUpdate(
              {
                'fornitore.partitaIva': fattura.fornitore.partitaIva,
                descrizioneFornitore: riga.descrizione
              },
              {
                $set: {
                  fornitore: {
                    partitaIva: fattura.fornitore.partitaIva,
                    ragioneSociale: nomeFornitore
                  },
                  codiceArticoloFornitore: riga.codiceArticolo,
                  prodottoMagazzino: {
                    tipo: 'ingrediente',
                    ingredienteId: ingrediente._id,
                    nome: ingrediente.nome,
                    categoria: ingrediente.categoria
                  },
                  conversione: {
                    unitaFornitore: riga.unitaMisura,
                    unitaMagazzino: ingrediente.unitaMisura,
                    fattore: 1
                  },
                  confermatoManualmente: true,
                  ultimoUtilizzo: new Date(),
                  attivo: true
                },
                $inc: { utilizzi: 1 }
              },
              { upsert: true, new: true }
            );
          }
        } catch (movError) {
          rigaProcessata.errore = movError.message;
          logger.error('Errore creazione movimento:', movError);
        }
      }
      
      righeProcessate.push(rigaProcessata);
    }
    
    // Salva righe e aggiorna statistiche
    importFattura.righe = righeProcessate;
    
    // Calcola statistiche
    const totaleRighe = righeProcessate.length;
    const righeImportate = righeProcessate.filter(r => r.importato).length;
    const righeIgnorate = righeProcessate.filter(r => !r.importato && !r.errore).length;
    const righeErrore = righeProcessate.filter(r => r.errore).length;
    
    importFattura.statistiche = { totaleRighe, righeImportate, righeIgnorate, righeErrore };
    
    // Determina stato
    if (righeImportate === totaleRighe) {
      importFattura.stato = 'completato';
    } else if (righeImportate > 0) {
      importFattura.stato = 'parziale';
    } else if (righeErrore > 0) {
      importFattura.stato = 'errore';
    } else {
      importFattura.stato = 'pendente';
    }
    
    await importFattura.save();
    
    // Notifica via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('fattura:importata', {
        fattura: importFattura,
        movimentiCreati: movimentiCreati.length
      });
    }
    
    res.json({
      success: true,
      data: {
        fattura: importFattura,
        statistiche: importFattura.statistiche,
        movimentiCreati: movimentiCreati.length
      }
    });
    
  } catch (error) {
    logger.error('Errore conferma import:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lista fatture importate
 */
export const listaImportazioni = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      stato,
      fornitore,
      dataInizio,
      dataFine 
    } = req.query;
    
    const query = {};
    
    if (stato) query.stato = stato;
    if (fornitore) query['fornitore.partitaIva'] = fornitore;
    
    if (dataInizio || dataFine) {
      query.data = {};
      if (dataInizio) query.data.$gte = new Date(dataInizio);
      if (dataFine) query.data.$lte = new Date(dataFine);
    }
    
    const total = await ImportFattura.countDocuments(query);
    
    const importazioni = await ImportFattura.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    
    // Aggiungi nome fornitore
    importazioni.forEach(imp => {
      imp.nomeFornitore = imp.fornitore?.ragioneSociale || 
        `${imp.fornitore?.nome || ''} ${imp.fornitore?.cognome || ''}`.trim() ||
        imp.fornitore?.partitaIva || 'Sconosciuto';
    });
    
    res.json({
      success: true,
      data: {
        importazioni,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Errore lista importazioni:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Dettaglio singola importazione
 */
export const dettaglioImportazione = async (req, res) => {
  try {
    const importazione = await ImportFattura.findById(req.params.id).lean();
    
    if (!importazione) {
      return res.status(404).json({ success: false, error: 'Importazione non trovata' });
    }
    
    res.json({ success: true, data: importazione });
  } catch (error) {
    logger.error('Errore dettaglio importazione:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Annulla importazione
 */
export const annullaImportazione = async (req, res) => {
  try {
    const { motivo } = req.body;
    const importazione = await ImportFattura.findById(req.params.id);
    
    if (!importazione) {
      return res.status(404).json({ success: false, error: 'Importazione non trovata' });
    }
    
    if (importazione.stato === 'annullato') {
      return res.status(400).json({ success: false, error: 'Già annullata' });
    }
    
    // Elimina movimenti collegati
    let movimentiEliminati = 0;
    for (const riga of importazione.righe) {
      if (riga.movimentoId) {
        await Movimento.findByIdAndDelete(riga.movimentoId);
        movimentiEliminati++;
      }
    }
    
    // Aggiorna stato
    importazione.stato = 'annullato';
    importazione.annullamento = {
      annullato: true,
      dataAnnullamento: new Date(),
      motivoAnnullamento: motivo || '',
      annullatoDa: req.user?.id
    };
    
    await importazione.save();
    
    // Notifica via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('fattura:annullata', { fatturaId: importazione._id, movimentiEliminati });
    }
    
    res.json({
      success: true,
      data: { importazione, movimentiEliminati }
    });
    
  } catch (error) {
    logger.error('Errore annullamento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Lista mapping prodotti fornitore
 */
export const listaMapping = async (req, res) => {
  try {
    const { fornitore, page = 1, limit = 50 } = req.query;
    
    const query = { attivo: true };
    if (fornitore) query['fornitore.partitaIva'] = fornitore;
    
    const total = await MappingProdottiFornitore.countDocuments(query);
    
    const mapping = await MappingProdottiFornitore.find(query)
      .sort({ utilizzi: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      data: {
        mapping,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    logger.error('Errore lista mapping:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Modifica mapping
 */
export const modificaMapping = async (req, res) => {
  try {
    const mapping = await MappingProdottiFornitore.findById(req.params.id);
    if (!mapping) return res.status(404).json({ success: false, error: 'Mapping non trovato' });
    
    const ingrediente = await Ingrediente.findById(req.body.ingredienteId);
    if (!ingrediente) return res.status(400).json({ success: false, error: 'Ingrediente non valido' });
    
    mapping.prodottoMagazzino = {
      tipo: 'ingrediente',
      ingredienteId: ingrediente._id,
      nome: ingrediente.nome,
      categoria: ingrediente.categoria
    };
    mapping.confermatoManualmente = true;
    await mapping.save();
    
    res.json({ success: true, data: mapping });
  } catch (error) {
    logger.error('Errore modifica mapping:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Elimina mapping
 */
export const eliminaMapping = async (req, res) => {
  try {
    await MappingProdottiFornitore.findByIdAndUpdate(req.params.id, { attivo: false });
    res.json({ success: true, message: 'Mapping disattivato' });
  } catch (error) {
    logger.error('Errore eliminazione mapping:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Statistiche importazioni
 */
export const statisticheImportazioni = async (req, res) => {
  try {
    const stats = await ImportFattura.aggregate([
      { $group: { _id: '$stato', count: { $sum: 1 }, totaleImporto: { $sum: '$importoTotale' } } }
    ]);
    
    const perFornitore = await ImportFattura.aggregate([
      {
        $group: {
          _id: '$fornitore.partitaIva',
          ragioneSociale: { $first: '$fornitore.ragioneSociale' },
          count: { $sum: 1 },
          totaleImporto: { $sum: '$importoTotale' },
          ultimaImportazione: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const totaleMovimenti = await Movimento.countDocuments({
      'documentoRiferimento.tipo': 'fattura'
    });
    
    res.json({
      success: true,
      data: { perStato: stats, perFornitore, totaleMovimentiDaFatture: totaleMovimenti }
    });
  } catch (error) {
    logger.error('Errore statistiche:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  uploadFatture,
  confermaImport,
  listaImportazioni,
  dettaglioImportazione,
  annullaImportazione,
  listaMapping,
  modificaMapping,
  eliminaMapping,
  statisticheImportazioni
};