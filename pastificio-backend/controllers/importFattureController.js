// controllers/importFattureController.js
// Controller per l'import delle fatture XML da Danea EasyFatt

import { parseStringPromise } from 'xml2js';
import crypto from 'crypto';
import fs from 'fs';
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
 * Determina categoria automaticamente in base al nome prodotto
 */
const determinaCategoria = (nome) => {
  const nomeUpper = (nome || '').toUpperCase();
  
  // Farine e derivati
  if (nomeUpper.includes('FARINA') || nomeUpper.includes('SEMOLA') || nomeUpper.includes('SEMOLINO')) {
    return 'Farine';
  }
  
  // Lieviti
  if (nomeUpper.includes('LIEVITO') || nomeUpper.includes('LIEVIT')) {
    return 'Lieviti';
  }
  
  // Oli e grassi
  if (nomeUpper.includes('OLIO') || nomeUpper.includes('STRUTTO') || nomeUpper.includes('BURRO') || nomeUpper.includes('MARGARINA')) {
    return 'Oli e Grassi';
  }
  
  // Zuccheri
  if (nomeUpper.includes('ZUCCHERO') || nomeUpper.includes('MIELE') || nomeUpper.includes('GLUCOSIO')) {
    return 'Zuccheri';
  }
  
  // Uova e latticini
  if (nomeUpper.includes('UOVA') || nomeUpper.includes('UOVO') || nomeUpper.includes('LATTE') || nomeUpper.includes('PANNA') || nomeUpper.includes('RICOTTA') || nomeUpper.includes('FORMAGGIO')) {
    return 'Latticini e Uova';
  }
  
  // Frutta secca
  if (nomeUpper.includes('MANDORLE') || nomeUpper.includes('NOCCIOLE') || nomeUpper.includes('NOCI') || nomeUpper.includes('PISTACCHI') || nomeUpper.includes('PINOLI')) {
    return 'Frutta Secca';
  }
  
  // Aromi e spezie
  if (nomeUpper.includes('VANIGLIA') || nomeUpper.includes('CANNELLA') || nomeUpper.includes('ANICE') || nomeUpper.includes('ZAFFERANO') || nomeUpper.includes('AROMA')) {
    return 'Aromi e Spezie';
  }
  
  // Confetture e creme
  if (nomeUpper.includes('MARMELLATA') || nomeUpper.includes('CONFETTURA') || nomeUpper.includes('NUTELLA') || nomeUpper.includes('CREMA') || nomeUpper.includes('CIOCCOLAT')) {
    return 'Creme e Confetture';
  }
  
  // Imballaggi
  if (nomeUpper.includes('VASSOIO') || nomeUpper.includes('BUSTA') || nomeUpper.includes('SACCHETTO') || nomeUpper.includes('SCATOLA') || nomeUpper.includes('CARTA') || nomeUpper.includes('PIROTTINI')) {
    return 'Imballaggi';
  }
  
  // Prodotti surgelati
  if (nomeUpper.includes('SURG') || nomeUpper.includes('CONGELAT')) {
    return 'Surgelati';
  }
  
  // Default
  return 'Altro';
};

/**
 * Normalizza unità di misura
 */
const normalizzaUnitaMisura = (um) => {
  if (!um) return 'pz';
  
  const umUpper = um.toUpperCase().trim();
  
  if (umUpper === 'KG' || umUpper === 'KGM' || umUpper === 'CHILO' || umUpper === 'CHILI') return 'kg';
  if (umUpper === 'G' || umUpper === 'GR' || umUpper === 'GRM' || umUpper === 'GRAMMI') return 'g';
  if (umUpper === 'L' || umUpper === 'LT' || umUpper === 'LTR' || umUpper === 'LITRI' || umUpper === 'LITRO') return 'l';
  if (umUpper === 'ML' || umUpper === 'MLT') return 'ml';
  if (umUpper === 'PZ' || umUpper === 'NR' || umUpper === 'N' || umUpper === 'PEZZI' || umUpper === 'PEZZO' || umUpper === 'UNITA') return 'pz';
  if (umUpper === 'CF' || umUpper === 'CONF' || umUpper === 'CONFEZIONE') return 'cf';
  if (umUpper === 'CT' || umUpper === 'CARTONE' || umUpper === 'CARTONI') return 'ct';
  if (umUpper === 'SC' || umUpper === 'SACCO' || umUpper === 'SACCHI') return 'sc';
  if (umUpper === 'BT' || umUpper === 'BTL' || umUpper === 'BOTTIGLIA' || umUpper === 'BOTTIGLIE') return 'bt';
  if (umUpper === 'FL' || umUpper === 'FLACONE') return 'fl';
  if (umUpper === 'CR' || umUpper === 'CARTONE') return 'cr';
  if (umUpper === 'BR' || umUpper === 'BARATTOLO') return 'br';
  
  return um.toLowerCase();
};

/**
 * Parsing del file XML fattura elettronica
 */
const parseXMLFattura = async (xmlContent) => {
  try {
    // Debug: log primi caratteri del contenuto
    logger.info(`XML ricevuto: lunghezza=${xmlContent?.length || 0}, primi 100 char: ${xmlContent?.substring(0, 100)}`);
    
    if (!xmlContent || xmlContent.length === 0) {
      throw new Error('Contenuto XML vuoto');
    }
    
    // Rimuovi BOM e caratteri problematici all'inizio
    let cleanXml = xmlContent.replace(/^\uFEFF/, ''); // Remove UTF-8 BOM
    
    // Cerca <?xml o il primo < nel contenuto
    const xmlDeclIndex = cleanXml.indexOf('<?xml');
    const firstTagIndex = cleanXml.indexOf('<');
    
    if (xmlDeclIndex > 0) {
      cleanXml = cleanXml.substring(xmlDeclIndex);
    } else if (firstTagIndex > 0) {
      cleanXml = cleanXml.substring(firstTagIndex);
    }
    
    // Verifica che il contenuto sia valido
    const trimmed = cleanXml.trim();
    if (!trimmed.startsWith('<?xml') && !trimmed.startsWith('<')) {
      logger.error(`XML non valido - primi 200 char dopo pulizia: ${trimmed.substring(0, 200)}`);
      throw new Error('Contenuto XML non valido');
    }
    
    // Parse XML
    const result = await parseStringPromise(cleanXml, {
      explicitArray: false,
      ignoreAttrs: false,
      tagNameProcessors: [(name) => name.replace(/^(ns\d+|p|a):/, '')] // Rimuovi namespace comuni
    });
    
    if (!result) {
      throw new Error('Parsing XML fallito - risultato nullo');
    }
    
    // Trova il nodo FatturaElettronica (può avere namespace diversi)
    let fattura = result.FatturaElettronica || 
                  result['ns3:FatturaElettronica'] || 
                  result['ns2:FatturaElettronica'] ||
                  result['p:FatturaElettronica'] ||
                  result['a:FatturaElettronica'];
    
    // Fallback: cerca la prima chiave che contiene "FatturaElettronica"
    if (!fattura) {
      const fatturaKey = Object.keys(result).find(k => k.includes('FatturaElettronica'));
      if (fatturaKey) {
        fattura = result[fatturaKey];
      }
    }
    
    // Ultimo fallback: prendi il primo valore
    if (!fattura) {
      fattura = Object.values(result)[0];
    }
    
    if (!fattura) {
      throw new Error('Formato XML non riconosciuto - nodo FatturaElettronica non trovato');
    }
    
    // Estrai header e body
    const header = fattura.FatturaElettronicaHeader;
    const body = fattura.FatturaElettronicaBody;
    
    if (!header || !body) {
      throw new Error(`Struttura fattura non valida - Header: ${!!header}, Body: ${!!body}`);
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
    logger.error('Errore parsing XML fattura:', {
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
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
        // Debug: info sul file ricevuto
        logger.info(`File ricevuto: nome=${file.name}, size=${file.size}, mimetype=${file.mimetype}, tempFilePath=${file.tempFilePath || 'N/A'}`);
        
        // Leggi contenuto XML - supporta sia tempFiles che buffer
        let xmlContent = '';
        
        if (file.tempFilePath) {
          // express-fileupload con useTempFiles: true
          xmlContent = fs.readFileSync(file.tempFilePath, 'utf8');
          logger.info(`Letto da tempFile: ${file.tempFilePath}`);
        } else if (file.data) {
          // express-fileupload con useTempFiles: false (buffer)
          xmlContent = file.data.toString('utf8');
          logger.info(`Letto da buffer data`);
        }
        
        logger.info(`Contenuto file ${file.name}: lunghezza=${xmlContent.length}`);
        
        if (!xmlContent || xmlContent.length === 0) {
          risultati.push({
            file: file.name,
            stato: 'errore',
            messaggio: 'File vuoto o non leggibile'
          });
          continue;
        }
        
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
    
    logger.info(`Ingredienti trovati per dropdown: ${ingredienti.length}`);
    
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
      fattura.documento?.numero || fattura.numero,
      new Date(fattura.documento?.data || fattura.data).getFullYear()
    );
    
    // Calcola hash dal contenuto (se non fornito)
    const hashFile = fileInfo?.hash || crypto.createHash('md5').update(identificativo + Date.now()).digest('hex');
    
    // Verifica di nuovo che non esista
    const esistente = await ImportFattura.findOne({ identificativo });
    if (esistente) {
      return res.status(400).json({
        success: false,
        error: 'Fattura già importata'
      });
    }
    
    // Costruisci indirizzo come stringa
    const indirizzoFornitore = fattura.fornitore.indirizzo;
    let indirizzoStr = '';
    if (typeof indirizzoFornitore === 'object') {
      indirizzoStr = [
        indirizzoFornitore.via,
        indirizzoFornitore.cap,
        indirizzoFornitore.comune,
        indirizzoFornitore.provincia
      ].filter(Boolean).join(', ');
    } else {
      indirizzoStr = indirizzoFornitore || '';
    }
    
    // Costruisci ragione sociale
    const ragioneSociale = fattura.fornitore.ragioneSociale || 
      `${fattura.fornitore.nome || ''} ${fattura.fornitore.cognome || ''}`.trim() ||
      fattura.fornitore.partitaIva;
    
    // Crea record ImportFattura con struttura corretta
    const importFattura = new ImportFattura({
      identificativo,
      hashFile,
      nomeFile: fileInfo?.nome || fileInfo?.name || `fattura_${identificativo}.xml`,
      dimensioneFile: fileInfo?.size || 0,
      fornitore: {
        partitaIva: fattura.fornitore.partitaIva,
        codiceFiscale: fattura.fornitore.codiceFiscale || '',
        ragioneSociale: ragioneSociale,
        indirizzo: indirizzoStr,
        cap: typeof indirizzoFornitore === 'object' ? indirizzoFornitore.cap : '',
        comune: typeof indirizzoFornitore === 'object' ? indirizzoFornitore.comune : '',
        provincia: typeof indirizzoFornitore === 'object' ? indirizzoFornitore.provincia : ''
      },
      fattura: {
        tipo: fattura.tipoDocumento || 'FatturaPA',
        numero: fattura.documento?.numero || fattura.numero,
        data: new Date(fattura.documento?.data || fattura.data),
        divisa: 'EUR'
      },
      totali: {
        imponibile: fattura.imponibile || 0,
        iva: fattura.imposta || 0,
        totaleDocumento: fattura.importoTotale || 0
      },
      ddt: fattura.ddt || [],
      stato: 'analizzato',
      createdBy: req.user?.id,
      importatoDa: req.user?.id
    });
    
    // Processa ogni riga
    const righeProcessate = [];
    const movimentiCreati = [];
    const ingredientiCreati = [];
    
    // Costruisci nome fornitore per i movimenti
    const nomeFornitore = fattura.fornitore.ragioneSociale || 
      `${fattura.fornitore.nome || ''} ${fattura.fornitore.cognome || ''}`.trim() ||
      fattura.fornitore.partitaIva;
    
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
      
      // Salta righe con quantità 0 o descrizioni generiche (es. "Spese di Incasso", "Ordine Cl.")
      const descrizioneUpper = (riga.descrizione || '').toUpperCase();
      const isRigaDaSaltare = 
        !riga.quantita || 
        riga.quantita === 0 ||
        riga.prezzoUnitario === 0 ||
        descrizioneUpper.includes('SPESE') ||
        descrizioneUpper.includes('INCASSO') ||
        descrizioneUpper.includes('ORDINE CL') ||
        descrizioneUpper.includes('COMMISSION') ||
        descrizioneUpper.includes('TRASPORTO') ||
        descrizioneUpper.includes('IMBALLO') ||
        descrizioneUpper.startsWith('VS.') ||
        descrizioneUpper.startsWith('NS.');
      
      if (isRigaDaSaltare) {
        rigaProcessata.stato = 'ignorato';
        rigaProcessata.note = 'Riga non importabile (spese/commissioni o quantità zero)';
        righeProcessate.push(rigaProcessata);
        continue;
      }
      
      try {
        // OPZIONE C: Crea automaticamente l'ingrediente se non esiste
        let ingrediente;
        
        // Prima cerca per nome esatto (case-insensitive)
        ingrediente = await Ingrediente.findOne({
          nome: { $regex: new RegExp(`^${riga.descrizione.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        
        // Se non esiste, crealo
        if (!ingrediente) {
          // Determina categoria automaticamente in base al nome
          const categoria = determinaCategoria(riga.descrizione);
          
          // Normalizza unità di misura
          const unitaMisura = normalizzaUnitaMisura(riga.unitaMisura);
          
          ingrediente = new Ingrediente({
            nome: riga.descrizione.trim(),
            categoria: categoria,
            unitaMisura: unitaMisura,
            giacenzaAttuale: 0,
            giacenzaMinima: 0,
            prezzoMedioAcquisto: riga.prezzoUnitario || 0,
            attivo: true,
            fornitoriAbituali: [{
              fornitore: null, // Lo aggiorneremo se abbiamo l'ID fornitore
              ragioneSociale: nomeFornitore,
              codiceArticolo: riga.codiceArticolo,
              prezzoUltimo: riga.prezzoUnitario
            }]
          });
          
          await ingrediente.save();
          ingredientiCreati.push(ingrediente);
          logger.info(`Ingrediente creato automaticamente: ${ingrediente.nome} (${categoria})`);
        }
        
        // Crea movimento di carico
        const movimento = new Movimento({
          tipo: 'carico',
          prodotto: {
            nome: ingrediente.nome,
            categoria: ingrediente.categoria
          },
          ingredienteId: ingrediente._id,
          quantita: riga.quantita,
          unita: normalizzaUnitaMisura(riga.unitaMisura),
          prezzoUnitario: riga.prezzoUnitario,
          fornitore: {
            nome: nomeFornitore
          },
          documentoRiferimento: {
            tipo: 'fattura',
            numero: fattura.documento?.numero || fattura.numero,
            data: new Date(fattura.documento?.data || fattura.data)
          },
          note: `Import automatico da fattura ${fattura.documento?.numero || fattura.numero}`,
          createdBy: req.user?.id
        });
        
        await movimento.save();
        movimentiCreati.push(movimento);
        
        // Aggiorna giacenza ingrediente
        ingrediente.giacenzaAttuale = (ingrediente.giacenzaAttuale || 0) + riga.quantita;
        ingrediente.prezzoMedioAcquisto = riga.prezzoUnitario; // Aggiorna prezzo
        await ingrediente.save();
        
        rigaProcessata.importato = true;
        rigaProcessata.ingredienteId = ingrediente._id;
        rigaProcessata.ingredienteNome = ingrediente.nome;
        rigaProcessata.movimentoId = movimento._id;
        rigaProcessata.stato = 'importato';
        
        // Salva mapping per riconoscimento futuro
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
              confermatoManualmente: false,
              ultimoUtilizzo: new Date()
            },
            $inc: { utilizzi: 1 }
          },
          { upsert: true, new: true }
        );
        
      } catch (movError) {
        rigaProcessata.errore = movError.message;
        rigaProcessata.stato = 'errore';
        logger.error('Errore creazione movimento/ingrediente:', movError);
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
        movimentiCreati: movimentiCreati.length,
        ingredientiCreati: ingredientiCreati.length
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
      .populate('righe.ingredienteAbbinato.ingredienteId', 'nome categoria')
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