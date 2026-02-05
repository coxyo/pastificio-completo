// controllers/importFattureController.js
// Controller per l'import delle fatture XML da Danea EasyFatt

import { parseStringPromise } from 'xml2js';
import crypto from 'crypto';
import ImportFattura from '../models/ImportFattura.js';
import MappingProdottiFornitore from '../models/MappingProdottiFornitore.js';
import Ingrediente from '../models/Ingrediente.js';
import Movimento from '../models/Movimento.js';
import Fornitore from '../models/Fornitore.js';
import logger from '../config/logger.js';

// ==========================================
// FUNZIONI HELPER
// ==========================================

/**
 * Parsing del file XML fattura elettronica
 */
const parseXMLFattura = async (xmlContent) => {
  try {
    // Parse XML
    const result = await parseStringPromise(xmlContent, {
      explicitArray: false,
      ignoreAttrs: false,
      tagNameProcessors: [(name) => name.replace(/^ns\d+:/, '')] // Rimuovi namespace
    });
    
    // Trova il nodo FatturaElettronica (può avere namespace)
    let fattura = result.FatturaElettronica || 
                  result['ns3:FatturaElettronica'] || 
                  result['p:FatturaElettronica'] ||
                  Object.values(result)[0];
    
    if (!fattura) {
      throw new Error('Formato XML non riconosciuto');
    }
    
    // Estrai header e body
    const header = fattura.FatturaElettronicaHeader;
    const body = fattura.FatturaElettronicaBody;
    
    if (!header || !body) {
      throw new Error('Struttura fattura non valida');
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
      tipoDocumento: datiGenerali?.TipoDocumento || 'TD24',
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
        righe.push({
          numeroLinea: parseInt(linea.NumeroLinea || 0),
          descrizione: linea.Descrizione || '',
          codiceArticolo: linea.CodiceArticolo?.CodiceValore || '',
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

// ==========================================
// CONTROLLER ENDPOINTS
// ==========================================

/**
 * Upload e parsing fatture XML
 */
export const uploadFatture = async (req, res) => {
  try {
    if (!req.files || !req.files.fatture) {
      return res.status(400).json({
        success: false,
        error: 'Nessun file caricato'
      });
    }
    
    const files = Array.isArray(req.files.fatture) 
      ? req.files.fatture 
      : [req.files.fatture];
    
    const risultati = [];
    
    for (const file of files) {
      try {
        // Leggi contenuto XML
        const xmlContent = file.data.toString('utf8');
        const hash = calcolaHash(xmlContent);
        
        // Verifica se già processato
        const esistente = await ImportFattura.fileGiaProcessato(hash);
        if (esistente) {
          risultati.push({
            file: file.name,
            stato: 'duplicato',
            messaggio: `Fattura già importata il ${esistente.dataImportazione.toLocaleDateString('it-IT')}`,
            fattura: {
              numero: esistente.numero,
              data: esistente.data,
              fornitore: esistente.nomeFornitore
            }
          });
          continue;
        }
        
        // Parse XML
        const dati = await parseXMLFattura(xmlContent);
        
        // Verifica se fattura già importata (per numero/anno)
        const esistentePerNumero = await ImportFattura.esisteGia(
          dati.fornitore.partitaIva,
          dati.documento.numero,
          dati.documento.data.getFullYear()
        );
        
        if (esistentePerNumero) {
          risultati.push({
            file: file.name,
            stato: 'duplicato',
            messaggio: `Fattura ${dati.documento.numero}/${dati.documento.data.getFullYear()} già importata`,
            fattura: {
              numero: esistentePerNumero.numero,
              data: esistentePerNumero.data,
              fornitore: esistentePerNumero.nomeFornitore
            }
          });
          continue;
        }
        
        // Carica ingredienti per matching
        const ingredienti = await Ingrediente.find({ attivo: true }).lean();
        
        // Cerca mapping esistenti e suggerisci per ogni riga
        const righeConMapping = await Promise.all(dati.righe.map(async (riga) => {
          // Cerca mapping esistente
          const { mapping, nuovo } = await MappingProdottiFornitore.trovaOCrea(
            dati.fornitore,
            riga.descrizione,
            riga.codiceArticolo
          );
          
          if (mapping) {
            // Mapping esistente trovato
            return {
              ...riga,
              mapping: {
                trovato: true,
                ingredienteId: mapping.prodottoMagazzino.ingredienteId,
                ingredienteNome: mapping.prodottoMagazzino.nome,
                categoria: mapping.prodottoMagazzino.categoria,
                confermato: mapping.confermatoManualmente,
                score: 100
              }
            };
          }
          
          // Cerca suggerimento automatico
          const suggerimento = await MappingProdottiFornitore.suggerisciProdotto(
            riga.descrizione,
            ingredienti
          );
          
          if (suggerimento) {
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
          
          // Cerca mapping simili di altri prodotti dello stesso fornitore
          const simili = await MappingProdottiFornitore.cercaSimilari(
            dati.fornitore.partitaIva,
            riga.descrizione
          );
          
          return {
            ...riga,
            mapping: {
              trovato: false,
              suggerito: false,
              simili: simili.slice(0, 3).map(s => ({
                descrizione: s.mapping.descrizioneFornitore,
                ingredienteNome: s.mapping.prodottoMagazzino.nome,
                score: s.score
              }))
            }
          };
        }));
        
        // Cerca fornitore nel database
        let fornitoreDb = null;
        if (dati.fornitore.partitaIva) {
          fornitoreDb = await Fornitore.findOne({ 
            partitaIva: dati.fornitore.partitaIva 
          });
        }
        
        risultati.push({
          file: file.name,
          stato: 'analizzato',
          fattura: {
            tipoDocumento: dati.documento.tipoDocumento,
            numero: dati.documento.numero,
            data: dati.documento.data,
            importoTotale: dati.documento.importoTotale,
            imponibile: dati.imponibile,
            imposta: dati.imposta
          },
          fornitore: {
            ...dati.fornitore,
            esisteInDb: !!fornitoreDb,
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
    const identificativo = ImportFattura.generaIdentificativo(
      fattura.fornitore.partitaIva,
      fattura.numero,
      new Date(fattura.data).getFullYear()
    );
    
    // Verifica di nuovo che non esista
    const esistente = await ImportFattura.findOne({ identificativo });
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
      anno: new Date(fattura.data).getFullYear(),
      fornitore: fattura.fornitore,
      importoTotale: fattura.importoTotale,
      imponibile: fattura.imponibile,
      imposta: fattura.imposta,
      ddt: fattura.ddt || [],
      fileOriginale: fileInfo,
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
      if (riga.ingredienteId) {
        try {
          // Trova ingrediente
          const ingrediente = await Ingrediente.findById(riga.ingredienteId);
          
          if (ingrediente) {
            // Crea movimento di carico
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
              fornitore: {
                nome: fattura.fornitore.ragioneSociale || 
                      `${fattura.fornitore.nome} ${fattura.fornitore.cognome}`.trim() ||
                      fattura.fornitore.partitaIva
              },
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
                    ragioneSociale: fattura.fornitore.ragioneSociale || 
                      `${fattura.fornitore.nome} ${fattura.fornitore.cognome}`.trim()
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
                  ultimoUtilizzo: new Date()
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
    importFattura.aggiornaStatistiche();
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
    
    if (stato) {
      query.stato = stato;
    }
    
    if (fornitore) {
      query['fornitore.partitaIva'] = fornitore;
    }
    
    if (dataInizio || dataFine) {
      query.data = {};
      if (dataInizio) query.data.$gte = new Date(dataInizio);
      if (dataFine) query.data.$lte = new Date(dataFine);
    }
    
    const total = await ImportFattura.countDocuments(query);
    
    const importazioni = await ImportFattura.find(query)
      .sort({ dataImportazione: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'username')
      .lean();
    
    // Aggiungi nome fornitore virtuale
    importazioni.forEach(imp => {
      imp.nomeFornitore = imp.fornitore.ragioneSociale || 
        `${imp.fornitore.nome || ''} ${imp.fornitore.cognome || ''}`.trim() ||
        imp.fornitore.partitaIva;
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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Dettaglio singola importazione
 */
export const dettaglioImportazione = async (req, res) => {
  try {
    const importazione = await ImportFattura.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('righe.ingredienteId', 'nome categoria')
      .populate('righe.movimentoId', 'quantita data');
    
    if (!importazione) {
      return res.status(404).json({
        success: false,
        error: 'Importazione non trovata'
      });
    }
    
    res.json({
      success: true,
      data: importazione
    });
    
  } catch (error) {
    logger.error('Errore dettaglio importazione:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Annulla importazione (elimina movimenti collegati)
 */
export const annullaImportazione = async (req, res) => {
  try {
    const { motivo } = req.body;
    
    const importazione = await ImportFattura.findById(req.params.id);
    
    if (!importazione) {
      return res.status(404).json({
        success: false,
        error: 'Importazione non trovata'
      });
    }
    
    if (importazione.annullamento?.annullato) {
      return res.status(400).json({
        success: false,
        error: 'Importazione già annullata'
      });
    }
    
    const movimentiEliminati = await importazione.annulla(req.user?.id, motivo);
    
    // Notifica via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('fattura:annullata', {
        fatturaId: importazione._id,
        movimentiEliminati
      });
    }
    
    res.json({
      success: true,
      data: {
        messaggio: `Importazione annullata. ${movimentiEliminati} movimenti eliminati.`,
        movimentiEliminati
      }
    });
    
  } catch (error) {
    logger.error('Errore annullamento importazione:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lista mapping prodotti fornitore
 */
export const listaMapping = async (req, res) => {
  try {
    const { fornitore, page = 1, limit = 50 } = req.query;
    
    const query = { attivo: true };
    if (fornitore) {
      query['fornitore.partitaIva'] = fornitore;
    }
    
    const total = await MappingProdottiFornitore.countDocuments(query);
    
    const mappings = await MappingProdottiFornitore.find(query)
      .sort({ utilizzi: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      data: {
        mappings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Errore lista mapping:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Modifica mapping prodotto
 */
export const modificaMapping = async (req, res) => {
  try {
    const { ingredienteId } = req.body;
    
    const mapping = await MappingProdottiFornitore.findById(req.params.id);
    
    if (!mapping) {
      return res.status(404).json({
        success: false,
        error: 'Mapping non trovato'
      });
    }
    
    // Trova ingrediente
    const ingrediente = await Ingrediente.findById(ingredienteId);
    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        error: 'Ingrediente non trovato'
      });
    }
    
    // Aggiorna mapping
    mapping.prodottoMagazzino = {
      tipo: 'ingrediente',
      ingredienteId: ingrediente._id,
      nome: ingrediente.nome,
      categoria: ingrediente.categoria
    };
    mapping.confermatoManualmente = true;
    mapping.updatedBy = req.user?.id;
    
    await mapping.save();
    
    res.json({
      success: true,
      data: mapping
    });
    
  } catch (error) {
    logger.error('Errore modifica mapping:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Elimina mapping prodotto
 */
export const eliminaMapping = async (req, res) => {
  try {
    const mapping = await MappingProdottiFornitore.findById(req.params.id);
    
    if (!mapping) {
      return res.status(404).json({
        success: false,
        error: 'Mapping non trovato'
      });
    }
    
    mapping.attivo = false;
    mapping.updatedBy = req.user?.id;
    await mapping.save();
    
    res.json({
      success: true,
      data: { messaggio: 'Mapping disattivato' }
    });
    
  } catch (error) {
    logger.error('Errore eliminazione mapping:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Statistiche importazioni
 */
export const statisticheImportazioni = async (req, res) => {
  try {
    const stats = await ImportFattura.aggregate([
      {
        $group: {
          _id: '$stato',
          count: { $sum: 1 },
          totaleImporto: { $sum: '$importoTotale' }
        }
      }
    ]);
    
    const perFornitore = await ImportFattura.aggregate([
      {
        $group: {
          _id: '$fornitore.partitaIva',
          ragioneSociale: { $first: '$fornitore.ragioneSociale' },
          count: { $sum: 1 },
          totaleImporto: { $sum: '$importoTotale' },
          ultimaImportazione: { $max: '$dataImportazione' }
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
      data: {
        perStato: stats,
        perFornitore,
        totaleMovimentiDaFatture: totaleMovimenti
      }
    });
    
  } catch (error) {
    logger.error('Errore statistiche importazioni:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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