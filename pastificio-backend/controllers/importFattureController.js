// controllers/importFattureController.js
// Controller per l'import delle fatture XML da Danea EasyFatt

import { parseStringPromise } from 'xml2js';
import crypto from 'crypto';
import fs from 'fs';
import AdmZip from 'adm-zip';
import Pusher from 'pusher';
import ImportFattura from '../models/ImportFattura.js';
import MappingProdottiFornitore from '../models/MappingProdottiFornitore.js';
import Ingrediente from '../models/Ingrediente.js';
import Movimento from '../models/Movimento.js';
import Fornitore from '../models/Fornitore.js';
import logger from '../config/logger.js';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true
});

// ==========================================
// FUNZIONI HELPER
// ==========================================

/**
 * Determina categoria automaticamente in base al nome prodotto
 * IMPORTANTE: Le categorie devono essere lowercase come da enum nel model Ingrediente
 */
const determinaCategoria = (nome) => {
  const nomeUpper = (nome || '').toUpperCase();
  
  if (nomeUpper.includes('FARINA') || nomeUpper.includes('SEMOLA') || nomeUpper.includes('SEMOLINO')) {
    return 'farine';
  }
  if (nomeUpper.includes('LIEVITO') || nomeUpper.includes('LIEVIT')) {
    return 'lieviti';
  }
  if (nomeUpper.includes('OLIO') || nomeUpper.includes('STRUTTO') || nomeUpper.includes('BURRO') || nomeUpper.includes('MARGARINA')) {
    return 'grassi';
  }
  if (nomeUpper.includes('ZUCCHERO') || nomeUpper.includes('MIELE') || nomeUpper.includes('GLUCOSIO')) {
    return 'zuccheri';
  }
  if (nomeUpper.includes('UOVA') || nomeUpper.includes('UOVO')) {
    return 'uova';
  }
  if (nomeUpper.includes('LATTE') || nomeUpper.includes('PANNA') || nomeUpper.includes('RICOTTA') || nomeUpper.includes('FORMAGGIO')) {
    return 'latticini';
  }
  if (nomeUpper.includes('MANDORLE') || nomeUpper.includes('NOCCIOLE') || nomeUpper.includes('NOCI') || nomeUpper.includes('PISTACCHI') || nomeUpper.includes('PINOLI') || nomeUpper.includes('FRUTTA')) {
    return 'frutta';
  }
  if (nomeUpper.includes('VANIGLIA') || nomeUpper.includes('CANNELLA') || nomeUpper.includes('ANICE') || nomeUpper.includes('ZAFFERANO') || nomeUpper.includes('AROMA') || nomeUpper.includes('SPEZIE')) {
    return 'spezie';
  }
  if (nomeUpper.includes('MARMELLATA') || nomeUpper.includes('CONFETTURA') || nomeUpper.includes('NUTELLA') || nomeUpper.includes('CREMA') || nomeUpper.includes('CIOCCOLAT')) {
    return 'altro';
  }
  if (nomeUpper.includes('VASSOIO') || nomeUpper.includes('BUSTA') || nomeUpper.includes('SACCHETTO') || nomeUpper.includes('SCATOLA') || nomeUpper.includes('CARTA') || nomeUpper.includes('PIROTTINI') || nomeUpper.includes('ROLLS') || nomeUpper.includes('IMBALL')) {
    return 'confezionamento';
  }
  if (nomeUpper.includes('SURG') || nomeUpper.includes('CONGELAT')) {
    return 'altro';
  }
  return 'altro';
};

/**
 * Normalizza unita di misura - DEVE ritornare solo valori accettati dall'enum:
 * ['kg', 'g', 'l', 'ml', 'pz']
 */
const normalizzaUnitaMisura = (um) => {
  if (!um) return 'pz';
  const umUpper = um.toUpperCase().trim();
  if (umUpper === 'KG' || umUpper === 'KGM' || umUpper === 'CHILO' || umUpper === 'CHILI') return 'kg';
  if (umUpper === 'G' || umUpper === 'GR' || umUpper === 'GRM' || umUpper === 'GRAMMI') return 'g';
  if (umUpper === 'L' || umUpper === 'LT' || umUpper === 'LTR' || umUpper === 'LITRI' || umUpper === 'LITRO') return 'l';
  if (umUpper === 'ML' || umUpper === 'MLT') return 'ml';
  return 'pz';
};

/**
 * Parsing del file XML fattura elettronica
 */
const parseXMLFattura = async (xmlContent) => {
  try {
    logger.info(`XML ricevuto: lunghezza=${xmlContent?.length || 0}, primi 100 char: ${xmlContent?.substring(0, 100)}`);
    
    if (!xmlContent || xmlContent.length === 0) {
      throw new Error('Contenuto XML vuoto');
    }
    
    let cleanXml = xmlContent.replace(/^\uFEFF/, '');
    
    const xmlDeclIndex = cleanXml.indexOf('<?xml');
    const firstTagIndex = cleanXml.indexOf('<');
    
    if (xmlDeclIndex > 0) {
      cleanXml = cleanXml.substring(xmlDeclIndex);
    } else if (firstTagIndex > 0) {
      cleanXml = cleanXml.substring(firstTagIndex);
    }
    
    const trimmed = cleanXml.trim();
    if (!trimmed.startsWith('<?xml') && !trimmed.startsWith('<')) {
      logger.error(`XML non valido - primi 200 char dopo pulizia: ${trimmed.substring(0, 200)}`);
      throw new Error('Contenuto XML non valido');
    }
    
    const result = await parseStringPromise(cleanXml, {
      explicitArray: false,
      ignoreAttrs: false,
      tagNameProcessors: [(name) => name.replace(/^(ns\d+|p|a):/, '')]
    });
    
    if (!result) {
      throw new Error('Parsing XML fallito - risultato nullo');
    }
    
    let fattura = result.FatturaElettronica || 
                  result['ns3:FatturaElettronica'] || 
                  result['ns2:FatturaElettronica'] ||
                  result['p:FatturaElettronica'] ||
                  result['a:FatturaElettronica'];
    
    if (!fattura) {
      const fatturaKey = Object.keys(result).find(k => k.includes('FatturaElettronica'));
      if (fatturaKey) {
        fattura = result[fatturaKey];
      }
    }
    
    if (!fattura) {
      fattura = Object.values(result)[0];
    }
    
    if (!fattura) {
      throw new Error('Formato XML non riconosciuto - nodo FatturaElettronica non trovato');
    }
    
    const header = fattura.FatturaElettronicaHeader;
    const body = fattura.FatturaElettronicaBody;
    
    if (!header || !body) {
      throw new Error(`Struttura fattura non valida - Header: ${!!header}, Body: ${!!body}`);
    }
    
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
    
    const datiGenerali = body.DatiGenerali?.DatiGeneraliDocumento;
    const documento = {
      tipoDocumento: datiGenerali?.TipoDocumento || 'TD24',
      numero: datiGenerali?.Numero || '',
      data: datiGenerali?.Data ? new Date(datiGenerali.Data) : new Date(),
      importoTotale: parseFloat(datiGenerali?.ImportoTotaleDocumento || 0)
    };
    
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
    
    const datiBeniServizi = body.DatiBeniServizi;
    const dettaglioLinee = datiBeniServizi?.DettaglioLinee;
    const righe = [];
    
    if (dettaglioLinee) {
      const lineeArray = Array.isArray(dettaglioLinee) ? dettaglioLinee : [dettaglioLinee];
      
      lineeArray.forEach(linea => {
        let lottoFornitore = '';
        let dataScadenza = null;
        
        const altriDati = linea.AltriDatiGestionali;
        if (altriDati) {
          const altriDatiArray = Array.isArray(altriDati) ? altriDati : [altriDati];
          
          for (const dato of altriDatiArray) {
            const tipoDato = (dato.TipoDato || '').toUpperCase();
            const riferimentoTesto = dato.RiferimentoTesto || '';
            const riferimentoData = dato.RiferimentoData || '';
            
            if (tipoDato.includes('LOTTO') || tipoDato.includes('LOT') || tipoDato === 'BATCH') {
              lottoFornitore = riferimentoTesto || lottoFornitore;
            }
            
            if (tipoDato.includes('SCAD') || tipoDato.includes('EXPIRY') || tipoDato === 'SCADENZA') {
              if (riferimentoData) {
                dataScadenza = new Date(riferimentoData);
              } else if (riferimentoTesto) {
                const parsed = new Date(riferimentoTesto);
                if (!isNaN(parsed.getTime())) {
                  dataScadenza = parsed;
                }
              }
            }
          }
        }
        
        if (!lottoFornitore) {
          const desc = linea.Descrizione || '';
          const lottoMatch = desc.match(/(?:LOTTO|LOT|L\.|BATCH)[:\s]*([A-Z0-9\-]+)/i);
          if (lottoMatch) {
            lottoFornitore = lottoMatch[1];
          }
        }
        
        if (!lottoFornitore) {
          const dataFatt = documento.data || new Date();
          const anno = dataFatt.getFullYear();
          const mese = String(dataFatt.getMonth() + 1).padStart(2, '0');
          const giorno = String(dataFatt.getDate()).padStart(2, '0');
          const dataStr = `${anno}${mese}${giorno}`;
          
          const nomeFornitoreClean = (fornitore.ragioneSociale || fornitore.nome || 'XXX')
            .replace(/[^A-Za-z]/g, '')
            .substring(0, 3)
            .toUpperCase() || 'XXX';
          
          const numRiga = String(linea.NumeroLinea || righe.length + 1).padStart(2, '0');
          lottoFornitore = `${dataStr}-${nomeFornitoreClean}${numRiga}`;
        }
        
        if (!dataScadenza) {
          const desc = linea.Descrizione || '';
          const scadMatch = desc.match(/(?:SCAD|EXP)[.:\s]*(\d{2}[\/-]\d{2,4}|\d{4}[\/-]\d{2})/i);
          if (scadMatch) {
            const parsed = new Date(scadMatch[1].replace(/\//g, '-'));
            if (!isNaN(parsed.getTime())) {
              dataScadenza = parsed;
            }
          }
        }
        
        righe.push({
          numeroLinea: parseInt(linea.NumeroLinea || 0),
          descrizione: linea.Descrizione || '',
          codiceArticolo: linea.CodiceArticolo?.CodiceValore || '',
          quantita: parseFloat(linea.Quantita || 0),
          unitaMisura: (linea.UnitaMisura || 'PZ').toUpperCase(),
          prezzoUnitario: parseFloat(linea.PrezzoUnitario || 0),
          prezzoTotale: parseFloat(linea.PrezzoTotale || 0),
          aliquotaIva: parseFloat(linea.AliquotaIVA || 0),
          lottoFornitore: lottoFornitore,
          dataScadenza: dataScadenza
        });
      });
    }
    
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
    
    return { fornitore, documento, ddt, righe, imponibile, imposta };
    
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
// HELPER INTERNO - logica righe condivisa
// ==========================================

const isRigaDaSaltare = (descrizione, quantita, prezzoUnitario) => {
  const d = (descrizione || '').toUpperCase();
  return (
    !quantita ||
    quantita === 0 ||
    prezzoUnitario === 0 ||
    d.includes('SPESE DI') ||
    d.includes('SPESE INCASSO') ||
    d.includes('ORDINE CL.') ||
    d.includes('ORDINE CL NUM') ||
    d.includes('COMMISSION') ||
    d.includes('COSTO TRASPORTO') ||
    d.includes('SPESE TRASPORTO') ||
    d.startsWith('VS.') ||
    d.startsWith('NS.') ||
    d.startsWith('***') ||
    d.includes('RIGA AUSILIARIA') ||
    d.includes('INFORMAZIONI TECNICHE')
  );
};

// ==========================================
// CONTROLLER ENDPOINTS
// ==========================================

/**
 * Upload e parsing fatture XML (supporta anche file ZIP)
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
    
    const processaXML = async (xmlContent, nomeFile) => {
      logger.info(`Contenuto file ${nomeFile}: lunghezza=${xmlContent.length}`);
      
      if (!xmlContent || xmlContent.length === 0) {
        return { file: nomeFile, stato: 'errore', messaggio: 'File vuoto o non leggibile' };
      }
      
      const hash = calcolaHash(xmlContent);
      
      const esistente = await ImportFattura.fileGiaProcessato(hash);
      if (esistente) {
        return {
          file: nomeFile,
          stato: 'duplicato',
          messaggio: `Fattura gia' importata il ${esistente.createdAt?.toLocaleDateString('it-IT') || 'data sconosciuta'}`,
          importazioneEsistente: esistente._id
        };
      }
      
      const datiParsed = await parseXMLFattura(xmlContent);
      
      return {
        file: nomeFile,
        stato: 'analizzato',
        fattura: {
          numero: datiParsed.documento?.numero || '',
          data: datiParsed.documento?.data || new Date(),
          tipoDocumento: datiParsed.documento?.tipoDocumento || 'TD24',
          importoTotale: datiParsed.documento?.importoTotale || 0
        },
        fornitore: datiParsed.fornitore,
        ddt: datiParsed.ddt || [],
        righe: datiParsed.righe || [],
        totali: {
          imponibile: datiParsed.imponibile || 0,
          iva: datiParsed.imposta || 0,
          totale: (datiParsed.imponibile || 0) + (datiParsed.imposta || 0)
        },
        fileInfo: { nome: nomeFile, hash: hash }
      };
    };
    
    for (const file of files) {
      try {
        logger.info(`File ricevuto: nome=${file.name}, size=${file.size}, mimetype=${file.mimetype}`);
        
        const isZip = file.name.toLowerCase().endsWith('.zip');
        
        if (isZip) {
          logger.info(`ZIP: ${file.name}`);
          
          let zipBuffer;
          if (file.tempFilePath) {
            zipBuffer = fs.readFileSync(file.tempFilePath);
          } else if (file.data) {
            zipBuffer = file.data;
          }
          
          const zip = new AdmZip(zipBuffer);
          const zipEntries = zip.getEntries();
          const xmlEntries = zipEntries.filter(entry => 
            !entry.isDirectory && entry.entryName.toLowerCase().endsWith('.xml')
          );
          
          logger.info(`Trovati ${xmlEntries.length} file XML nel ZIP ${file.name}`);
          
          for (const entry of xmlEntries) {
            try {
              const xmlContent = entry.getData().toString('utf8');
              const nomeFileEntry = entry.entryName.split('/').pop();
              const risultato = await processaXML(xmlContent, nomeFileEntry);
              risultati.push(risultato);
            } catch (entryError) {
              logger.error(`Errore parsing ${entry.entryName} da ZIP:`, entryError);
              risultati.push({
                file: entry.entryName,
                stato: 'errore',
                messaggio: `Errore parsing: ${entryError.message}`
              });
            }
          }
          
          if (xmlEntries.length === 0) {
            risultati.push({ file: file.name, stato: 'errore', messaggio: 'Nessun file XML trovato nel ZIP' });
          }
          
        } else {
          let xmlContent = '';
          if (file.tempFilePath) {
            xmlContent = fs.readFileSync(file.tempFilePath, 'utf8');
            logger.info(`Letto da tempFile: ${file.tempFilePath}`);
          } else if (file.data) {
            xmlContent = file.data.toString('utf8');
            logger.info('Letto da buffer data');
          }
          
          const risultato = await processaXML(xmlContent, file.name);
          risultati.push(risultato);
        }
        
      } catch (fileError) {
        logger.error(`Errore elaborazione file ${file.name}:`, fileError);
        risultati.push({
          file: file.name,
          stato: 'errore',
          messaggio: `Errore: ${fileError.message}`
        });
      }
    }
    
    const stats = {
      totale: risultati.length,
      analizzati: risultati.filter(r => r.stato === 'analizzato').length,
      duplicati: risultati.filter(r => r.stato === 'duplicato').length,
      errori: risultati.filter(r => r.stato === 'errore').length
    };
    
    logger.info(`Upload completato: ${stats.analizzati} analizzati, ${stats.duplicati} duplicati, ${stats.errori} errori`);
    
    const ingredienti = await Ingrediente.find({ attivo: true }).select('nome categoria unitaMisura giacenza');
    
    res.json({
      success: true,
      data: { risultati, ingredienti, statistiche: stats }
    });
    
  } catch (error) {
    logger.error('Errore upload fatture:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Conferma import fattura con mapping (flusso manuale da frontend)
 */
export const confermaImport = async (req, res) => {
  try {
    const { fattura, righe, fileInfo } = req.body;
    
    if (!fattura || !righe || !righe.length) {
      return res.status(400).json({ success: false, error: 'Dati fattura incompleti' });
    }
    
    const fornitore = fattura.fornitore || {};
    const partitaIva = fornitore.partitaIva || fornitore.idFiscale || 'SCONOSCIUTO';
    const ragioneSocialeInput = fornitore.ragioneSociale || 
      `${fornitore.nome || ''} ${fornitore.cognome || ''}`.trim() ||
      partitaIva;
    
    const identificativo = ImportFattura.generaIdentificativo(
      partitaIva,
      fattura.documento?.numero || fattura.numero,
      new Date(fattura.documento?.data || fattura.data).getFullYear()
    );
    
    const hashFile = fileInfo?.hash || crypto.createHash('md5').update(identificativo + Date.now()).digest('hex');
    
    const esistente = await ImportFattura.findOne({ identificativo });
    if (esistente) {
      return res.status(400).json({ success: false, error: 'Fattura gia importata' });
    }
    
    const indirizzoFornitore = fornitore.indirizzo || {};
    let indirizzoStr = '';
    if (typeof indirizzoFornitore === 'object') {
      indirizzoStr = [indirizzoFornitore.via, indirizzoFornitore.cap, indirizzoFornitore.comune, indirizzoFornitore.provincia].filter(Boolean).join(', ');
    } else {
      indirizzoStr = indirizzoFornitore || '';
    }
    
    const ragioneSociale = ragioneSocialeInput;
    
    const importFattura = new ImportFattura({
      identificativo,
      hashFile,
      nomeFile: fileInfo?.nome || fileInfo?.name || `fattura_${identificativo}.xml`,
      dimensioneFile: fileInfo?.size || 0,
      fornitore: {
        partitaIva,
        codiceFiscale: fornitore.codiceFiscale || '',
        ragioneSociale,
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
    
    const righeProcessate = [];
    const movimentiCreati = [];
    const ingredientiCreati = [];
    const nomeFornitore = ragioneSociale;
    
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
      
      if (isRigaDaSaltare(riga.descrizione, riga.quantita, riga.prezzoUnitario)) {
        rigaProcessata.stato = 'ignorato';
        rigaProcessata.note = 'Riga non importabile (spese/commissioni o quantita zero)';
        righeProcessate.push(rigaProcessata);
        continue;
      }
      
      try {
        let ingrediente = await Ingrediente.findOne({
          nome: { $regex: new RegExp(`^${riga.descrizione.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        
        const categoria = determinaCategoria(riga.descrizione);
        const unitaMisura = normalizzaUnitaMisura(riga.unitaMisura);
        const numeroFattura = fattura.documento?.numero || fattura.numero;
        const dataFattura = new Date(fattura.documento?.data || fattura.data);
        const lottoFornitore = riga.lottoFornitore || riga.lotto || '';
        let dataScadenza = null;
        if (riga.dataScadenza) dataScadenza = new Date(riga.dataScadenza);
        
        if (!ingrediente) {
          ingrediente = new Ingrediente({
            nome: riga.descrizione.trim(),
            categoria,
            unitaMisura,
            giacenzaAttuale: riga.quantita,
            giacenzaMinima: 0,
            prezzoMedioAcquisto: riga.prezzoUnitario || 0,
            ultimoPrezzoAcquisto: riga.prezzoUnitario || 0,
            attivo: true,
            lotti: [{
              codiceLotto: lottoFornitore,
              dataArrivo: dataFattura,
              dataScadenza,
              quantitaIniziale: riga.quantita,
              quantitaAttuale: riga.quantita,
              unitaMisura,
              prezzoUnitario: riga.prezzoUnitario || 0,
              fornitore: { ragioneSociale: nomeFornitore, partitaIVA: partitaIva },
              documentoOrigine: { tipo: 'fattura', numero: numeroFattura, data: dataFattura, importazioneId: importFattura._id },
              lottoFornitore: { codice: lottoFornitore },
              stato: 'disponibile',
              utilizzi: []
            }],
            fornitoriAbituali: [{
              fornitore: null,
              ragioneSociale: nomeFornitore,
              codiceArticolo: riga.codiceArticolo,
              prezzoUltimo: riga.prezzoUnitario
            }],
            storicoPrezzi: [{
              data: dataFattura,
              prezzo: riga.prezzoUnitario || 0,
              fornitore: nomeFornitore,
              quantita: riga.quantita
            }]
          });
          await ingrediente.save();
          ingredientiCreati.push(ingrediente);
          logger.info(`Ingrediente creato: ${ingrediente.nome} | Lotto: ${lottoFornitore || 'N/D'} | Fornitore: ${nomeFornitore}`);
        } else {
          const nuovoLotto = {
            codiceLotto: lottoFornitore,
            dataArrivo: dataFattura,
            dataScadenza,
            quantitaIniziale: riga.quantita,
            quantitaAttuale: riga.quantita,
            unitaMisura,
            prezzoUnitario: riga.prezzoUnitario || 0,
            fornitore: { ragioneSociale: nomeFornitore, partitaIVA: partitaIva },
            documentoOrigine: { tipo: 'fattura', numero: numeroFattura, data: dataFattura, importazioneId: importFattura._id },
            lottoFornitore: { codice: lottoFornitore },
            stato: 'disponibile',
            utilizzi: []
          };
          await Ingrediente.findByIdAndUpdate(ingrediente._id, {
            $push: {
              lotti: nuovoLotto,
              storicoPrezzi: { data: dataFattura, prezzo: riga.prezzoUnitario || 0, fornitore: nomeFornitore, quantita: riga.quantita }
            },
            $inc: { giacenzaAttuale: riga.quantita },
            $set: { ultimoPrezzoAcquisto: riga.prezzoUnitario || 0 }
          });
          logger.info(`Lotto aggiunto a ${ingrediente.nome}: ${lottoFornitore || 'N/D'} | Fornitore: ${nomeFornitore}`);
        }
        
        const movimento = new Movimento({
          tipo: 'carico',
          prodotto: { nome: ingrediente.nome, categoria: ingrediente.categoria },
          ingredienteId: ingrediente._id,
          quantita: riga.quantita,
          unita: unitaMisura,
          prezzoUnitario: riga.prezzoUnitario,
          valoreMovimento: (riga.prezzoUnitario || 0) * riga.quantita,
          fornitore: { nome: nomeFornitore, partitaIva },
          lotto: lottoFornitore || null,
          dataScadenza,
          documentoRiferimento: { tipo: 'fattura', numero: numeroFattura, data: dataFattura },
          note: `Import automatico da fattura ${numeroFattura}${lottoFornitore ? ' - Lotto: ' + lottoFornitore : ''}`,
          dataMovimento: dataFattura,
          createdBy: req.user?.id
        });
        await movimento.save();
        movimentiCreati.push(movimento);
        
        rigaProcessata.importato = true;
        rigaProcessata.ingredienteId = ingrediente._id;
        rigaProcessata.ingredienteNome = ingrediente.nome;
        rigaProcessata.movimentoId = movimento._id;
        rigaProcessata.stato = 'importato';
        
        await MappingProdottiFornitore.findOneAndUpdate(
          { 'fornitore.partitaIva': partitaIva, descrizioneFornitore: riga.descrizione },
          {
            $set: {
              fornitore: { partitaIva, ragioneSociale: nomeFornitore },
              codiceArticoloFornitore: riga.codiceArticolo,
              prodottoMagazzino: { tipo: 'ingrediente', ingredienteId: ingrediente._id, nome: ingrediente.nome, categoria: ingrediente.categoria },
              conversione: { unitaFornitore: riga.unitaMisura, unitaMagazzino: ingrediente.unitaMisura, fattore: 1 },
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
    
    importFattura.righe = righeProcessate;
    importFattura.aggiornaStatistiche();
    await importFattura.save();
    
    const io = req.app.get('io');
    if (io) {
      io.emit('fattura:importata', { fattura: importFattura, movimentiCreati: movimentiCreati.length });
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
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Import automatico fattura (chiamato dal watcher locale sul PC)
 * Importa tutto cio che riesce, notifica via Pusher + WhatsApp per i non riconosciuti.
 */
export const autoImport = async (req, res) => {
  try {
    const { fattura, righe, fileInfo, sorgente } = req.body;

    if (!fattura || !righe || !righe.length) {
      return res.status(400).json({ success: false, error: 'Dati fattura incompleti' });
    }

    logger.info(`[AUTO-IMPORT] Avvio da sorgente: ${sorgente || 'watcher'}`);

    const fornitore = fattura.fornitore || {};
    const partitaIva = fornitore.partitaIva || fornitore.idFiscale || 'SCONOSCIUTO';
    const ragioneSocialeInput = fornitore.ragioneSociale ||
      `${fornitore.nome || ''} ${fornitore.cognome || ''}`.trim() ||
      partitaIva;

    const identificativo = ImportFattura.generaIdentificativo(
      partitaIva,
      fattura.documento?.numero || fattura.numero,
      new Date(fattura.documento?.data || fattura.data).getFullYear()
    );

    const hashFile = fileInfo?.hash ||
      crypto.createHash('md5').update(identificativo + Date.now()).digest('hex');

    const esistente = await ImportFattura.findOne({ identificativo });
    if (esistente) {
      logger.info(`[AUTO-IMPORT] Fattura gia importata: ${identificativo}`);
      return res.json({
        success: true,
        data: { messaggio: 'Fattura gia importata in precedenza', duplicato: true }
      });
    }

    const indirizzoFornitore = fornitore.indirizzo || {};
    let indirizzoStr = '';
    if (typeof indirizzoFornitore === 'object') {
      indirizzoStr = [indirizzoFornitore.via, indirizzoFornitore.cap, indirizzoFornitore.comune, indirizzoFornitore.provincia].filter(Boolean).join(', ');
    } else {
      indirizzoStr = indirizzoFornitore || '';
    }

    const ragioneSociale = ragioneSocialeInput;
    const nomeFornitore = ragioneSociale;

    const importFattura = new ImportFattura({
      identificativo,
      hashFile,
      nomeFile: fileInfo?.nome || fileInfo?.name || `fattura_${identificativo}.xml`,
      dimensioneFile: fileInfo?.size || 0,
      fornitore: {
        partitaIva,
        codiceFiscale: fornitore.codiceFiscale || '',
        ragioneSociale,
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

    const righeProcessate = [];
    const movimentiCreati = [];
    const ingredientiCreati = [];

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

      if (isRigaDaSaltare(riga.descrizione, riga.quantita, riga.prezzoUnitario)) {
        rigaProcessata.stato = 'ignorato';
        rigaProcessata.note = 'Riga non importabile (spese/commissioni o quantita zero)';
        righeProcessate.push(rigaProcessata);
        continue;
      }

      try {
        let ingrediente = await Ingrediente.findOne({
          nome: { $regex: new RegExp(`^${riga.descrizione.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });

        const categoria = determinaCategoria(riga.descrizione);
        const unitaMisura = normalizzaUnitaMisura(riga.unitaMisura);
        const numeroFattura = fattura.documento?.numero || fattura.numero;
        const dataFattura = new Date(fattura.documento?.data || fattura.data);
        const lottoFornitore = riga.lottoFornitore || riga.lotto || '';
        let dataScadenza = null;
        if (riga.dataScadenza) dataScadenza = new Date(riga.dataScadenza);

        if (!ingrediente) {
          ingrediente = new Ingrediente({
            nome: riga.descrizione.trim(),
            categoria,
            unitaMisura,
            giacenzaAttuale: riga.quantita,
            giacenzaMinima: 0,
            prezzoMedioAcquisto: riga.prezzoUnitario || 0,
            ultimoPrezzoAcquisto: riga.prezzoUnitario || 0,
            attivo: true,
            lotti: [{
              codiceLotto: lottoFornitore,
              dataArrivo: dataFattura,
              dataScadenza,
              quantitaIniziale: riga.quantita,
              quantitaAttuale: riga.quantita,
              unitaMisura,
              prezzoUnitario: riga.prezzoUnitario || 0,
              fornitore: { ragioneSociale: nomeFornitore, partitaIVA: partitaIva },
              documentoOrigine: { tipo: 'fattura', numero: numeroFattura, data: dataFattura, importazioneId: importFattura._id },
              lottoFornitore: { codice: lottoFornitore },
              stato: 'disponibile',
              utilizzi: []
            }],
            fornitoriAbituali: [{
              fornitore: null,
              ragioneSociale: nomeFornitore,
              codiceArticolo: riga.codiceArticolo,
              prezzoUltimo: riga.prezzoUnitario
            }],
            storicoPrezzi: [{
              data: dataFattura,
              prezzo: riga.prezzoUnitario || 0,
              fornitore: nomeFornitore,
              quantita: riga.quantita
            }]
          });
          await ingrediente.save();
          ingredientiCreati.push(ingrediente);
          logger.info(`[AUTO-IMPORT] Ingrediente creato: ${ingrediente.nome}`);
        } else {
          const nuovoLotto = {
            codiceLotto: lottoFornitore,
            dataArrivo: dataFattura,
            dataScadenza,
            quantitaIniziale: riga.quantita,
            quantitaAttuale: riga.quantita,
            unitaMisura,
            prezzoUnitario: riga.prezzoUnitario || 0,
            fornitore: { ragioneSociale: nomeFornitore, partitaIVA: partitaIva },
            documentoOrigine: { tipo: 'fattura', numero: numeroFattura, data: dataFattura, importazioneId: importFattura._id },
            lottoFornitore: { codice: lottoFornitore },
            stato: 'disponibile',
            utilizzi: []
          };
          await Ingrediente.findByIdAndUpdate(ingrediente._id, {
            $push: {
              lotti: nuovoLotto,
              storicoPrezzi: { data: dataFattura, prezzo: riga.prezzoUnitario || 0, fornitore: nomeFornitore, quantita: riga.quantita }
            },
            $inc: { giacenzaAttuale: riga.quantita },
            $set: { ultimoPrezzoAcquisto: riga.prezzoUnitario || 0 }
          });
          logger.info(`[AUTO-IMPORT] Lotto aggiunto a: ${ingrediente.nome}`);
        }

        const movimento = new Movimento({
          tipo: 'carico',
          prodotto: { nome: ingrediente.nome, categoria: ingrediente.categoria },
          ingredienteId: ingrediente._id,
          quantita: riga.quantita,
          unita: unitaMisura,
          prezzoUnitario: riga.prezzoUnitario,
          valoreMovimento: (riga.prezzoUnitario || 0) * riga.quantita,
          fornitore: { nome: nomeFornitore, partitaIva },
          lotto: lottoFornitore || null,
          dataScadenza,
          documentoRiferimento: { tipo: 'fattura', numero: numeroFattura, data: dataFattura },
          note: `Import automatico (watcher) da fattura ${numeroFattura}${lottoFornitore ? ' - Lotto: ' + lottoFornitore : ''}`,
          dataMovimento: dataFattura,
          createdBy: req.user?.id
        });
        await movimento.save();
        movimentiCreati.push(movimento);

        await MappingProdottiFornitore.findOneAndUpdate(
          { 'fornitore.partitaIva': partitaIva, descrizioneFornitore: riga.descrizione },
          {
            $set: {
              fornitore: { partitaIva, ragioneSociale: nomeFornitore },
              codiceArticoloFornitore: riga.codiceArticolo,
              prodottoMagazzino: { tipo: 'ingrediente', ingredienteId: ingrediente._id, nome: ingrediente.nome, categoria: ingrediente.categoria },
              conversione: { unitaFornitore: riga.unitaMisura, unitaMagazzino: ingrediente.unitaMisura, fattore: 1 },
              confermatoManualmente: false,
              ultimoUtilizzo: new Date()
            },
            $inc: { utilizzi: 1 }
          },
          { upsert: true, new: true }
        );

        rigaProcessata.importato = true;
        rigaProcessata.ingredienteId = ingrediente._id;
        rigaProcessata.ingredienteNome = ingrediente.nome;
        rigaProcessata.movimentoId = movimento._id;
        rigaProcessata.stato = 'importato';

      } catch (movError) {
        rigaProcessata.errore = movError.message;
        rigaProcessata.stato = 'errore';
        logger.error(`[AUTO-IMPORT] Errore riga ${riga.descrizione}:`, movError);
      }

      righeProcessate.push(rigaProcessata);
    }

    importFattura.righe = righeProcessate;
    importFattura.aggiornaStatistiche();
    await importFattura.save();

    const statsFinali = importFattura.statistiche || {};
    const righeNonRicList = righeProcessate
      .filter(r => r.stato === 'errore')
      .map(r => r.descrizione)
      .filter(Boolean);

    logger.info(`[AUTO-IMPORT] Completato: ${nomeFornitore} | Importate: ${movimentiCreati.length} | Non riconosciute: ${righeNonRicList.length}`);

    // Notifica Pusher
    pusher.trigger('pastificio', 'fattura-importata', {
      tipo: 'auto_import',
      fornitore: nomeFornitore,
      numeroFattura: fattura.documento?.numero || fattura.numero,
      dataFattura: fattura.documento?.data || fattura.data,
      righeImportate: movimentiCreati.length,
      ingredientiCreati: ingredientiCreati.length,
      righeNonRiconosciute: righeNonRicList,
      haProblemi: righeNonRicList.length > 0,
      importazioneId: importFattura._id,
      timestamp: new Date().toISOString()
    }).then(() => {
      logger.info('[AUTO-IMPORT] Pusher notificato');
    }).catch(err => {
      logger.error('[AUTO-IMPORT] Errore Pusher:', err.message);
    });

    // Notifica WhatsApp
    try {
      const whatsapp = await import('../services/whatsappService.js');
      const numero = process.env.WHATSAPP_NOTIF_NUMBER || '3898879833';

      let testo = 'FATTURA IMPORTATA AUTOMATICAMENTE\n\n';
      testo += `Fornitore: ${nomeFornitore}\n`;
      testo += `Fattura: ${fattura.documento?.numero || fattura.numero}\n`;
      testo += `Data: ${new Date(fattura.documento?.data || fattura.data).toLocaleDateString('it-IT')}\n`;
      testo += `Prodotti caricati: ${movimentiCreati.length}\n`;
      testo += `Nuovi ingredienti: ${ingredientiCreati.length}\n`;

      if (righeNonRicList.length > 0) {
        testo += `\nATTENZIONE - ${righeNonRicList.length} righe con errore:\n`;
        righeNonRicList.slice(0, 5).forEach(d => { testo += `- ${d}\n`; });
        if (righeNonRicList.length > 5) testo += `... e altri ${righeNonRicList.length - 5}\n`;
        testo += '\nControlla Import Fatture nel gestionale.';
      } else {
        testo += '\nTutto importato correttamente!';
      }

      await whatsapp.default.inviaMessaggio(numero, testo);
    } catch (waErr) {
      logger.error('[AUTO-IMPORT] Errore WhatsApp:', waErr.message);
    }

    res.json({
      success: true,
      data: {
        fattura: importFattura,
        statistiche: statsFinali,
        movimentiCreati: movimentiCreati.length,
        ingredientiCreati: ingredientiCreati.length,
        righeNonRiconosciute: righeNonRicList
      }
    });

  } catch (error) {
    logger.error('[AUTO-IMPORT] Errore generale:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Riceve notifica di errore dal watcher locale
 */
export const notificaErroreWatcher = async (req, res) => {
  try {
    const { nomeFile, errore } = req.body;
    logger.error(`[WATCHER-ERRORE] File: ${nomeFile} | Errore: ${errore}`);

    pusher.trigger('pastificio', 'fattura-errore', {
      tipo: 'errore_import',
      nomeFile,
      errore,
      timestamp: new Date().toISOString()
    }).then(() => {}).catch(err => {
      logger.error('[WATCHER-ERRORE] Pusher:', err.message);
    });

    try {
      const whatsapp = await import('../services/whatsappService.js');
      const numero = process.env.WHATSAPP_NOTIF_NUMBER || '3898879833';
      const testo = `ERRORE import fattura automatico!\n\nFile: ${nomeFile}\nErrore: ${errore}\n\nVerifica nel gestionale.`;
      await whatsapp.default.inviaMessaggio(numero, testo);
    } catch (waErr) {
      logger.error('[WATCHER-ERRORE] WhatsApp:', waErr.message);
    }

    res.json({ success: true });

  } catch (error) {
    logger.error('[WATCHER-ERRORE] Errore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Ignora fattura (segna come processata senza importare ingredienti)
 */
export const ignoraFattura = async (req, res) => {
  try {
    const { fattura, fornitore, fileInfo, motivo } = req.body;
    
    if (!fattura) {
      return res.status(400).json({ success: false, error: 'Dati fattura mancanti' });
    }
    
    const partitaIva = fornitore?.partitaIva || fornitore?.idFiscale || 'SCONOSCIUTO';
    const numeroFattura = fattura.numero;
    const annoFattura = new Date(fattura.data).getFullYear();
    
    const identificativo = ImportFattura.generaIdentificativo(partitaIva, numeroFattura, annoFattura);
    
    const esistente = await ImportFattura.findOne({ identificativo });
    if (esistente) {
      return res.status(400).json({ success: false, error: 'Fattura gia processata' });
    }
    
    const hashFile = fileInfo?.hash || crypto.createHash('md5').update(identificativo + Date.now()).digest('hex');
    
    const importFattura = new ImportFattura({
      identificativo,
      hashFile,
      nomeFile: fileInfo?.nome || `fattura_${numeroFattura}.xml`,
      statoProcessamento: 'completato',
      stato: 'ignorato',
      dataImportazione: new Date(),
      fornitore: {
        partitaIva,
        ragioneSociale: fornitore?.ragioneSociale || partitaIva,
        indirizzo: ''
      },
      fattura: {
        numero: numeroFattura,
        data: new Date(fattura.data),
        tipoDocumento: fattura.tipoDocumento || 'TD01'
      },
      totali: {
        imponibile: fattura.imponibile || 0,
        imposta: fattura.imposta || 0,
        totaleDocumento: fattura.importoTotale || 0
      },
      righe: [],
      statistiche: { totaleRighe: 0, righeImportate: 0, righeIgnorate: 0, righeErrore: 0 },
      note: motivo || 'Fattura ignorata manualmente'
    });
    
    await importFattura.save();
    logger.info(`Fattura ignorata: ${numeroFattura} di ${fornitore?.ragioneSociale}`);
    
    res.json({
      success: true,
      data: { importazione: importFattura, messaggio: 'Fattura segnata come ignorata' }
    });
    
  } catch (error) {
    logger.error('Errore ignora fattura:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Lista fatture importate
 */
export const listaImportazioni = async (req, res) => {
  try {
    const { page = 1, limit = 20, stato, fornitore, dataInizio, dataFine } = req.query;
    
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
      .sort({ dataImportazione: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'username')
      .lean();
    
    importazioni.forEach(imp => {
      imp.nomeFornitore = imp.fornitore.ragioneSociale || 
        `${imp.fornitore.nome || ''} ${imp.fornitore.cognome || ''}`.trim() ||
        imp.fornitore.partitaIva;
    });
    
    res.json({
      success: true,
      data: {
        importazioni,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
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
    const importazione = await ImportFattura.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('righe.ingredienteAbbinato.ingredienteId', 'nome categoria')
      .populate('righe.movimentoId', 'quantita data');
    
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
 * Annulla importazione (elimina movimenti collegati)
 */
export const annullaImportazione = async (req, res) => {
  try {
    const { motivo } = req.body;
    
    const importazione = await ImportFattura.findById(req.params.id);
    if (!importazione) {
      return res.status(404).json({ success: false, error: 'Importazione non trovata' });
    }
    
    if (importazione.annullamento?.annullato) {
      return res.status(400).json({ success: false, error: 'Importazione gia annullata' });
    }
    
    const movimentiEliminati = await importazione.annulla(req.user?.id, motivo);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('fattura:annullata', { fatturaId: importazione._id, movimentiEliminati });
    }
    
    res.json({
      success: true,
      data: { messaggio: `Importazione annullata. ${movimentiEliminati} movimenti eliminati.`, movimentiEliminati }
    });
    
  } catch (error) {
    logger.error('Errore annullamento importazione:', error);
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
    const mappings = await MappingProdottiFornitore.find(query)
      .sort({ utilizzi: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      data: {
        mappings,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
      }
    });
    
  } catch (error) {
    logger.error('Errore lista mapping:', error);
    res.status(500).json({ success: false, error: error.message });
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
      return res.status(404).json({ success: false, error: 'Mapping non trovato' });
    }
    
    const ingrediente = await Ingrediente.findById(ingredienteId);
    if (!ingrediente) {
      return res.status(404).json({ success: false, error: 'Ingrediente non trovato' });
    }
    
    mapping.prodottoMagazzino = {
      tipo: 'ingrediente',
      ingredienteId: ingrediente._id,
      nome: ingrediente.nome,
      categoria: ingrediente.categoria
    };
    mapping.confermatoManualmente = true;
    mapping.updatedBy = req.user?.id;
    await mapping.save();
    
    res.json({ success: true, data: mapping });
    
  } catch (error) {
    logger.error('Errore modifica mapping:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Elimina mapping prodotto
 */
export const eliminaMapping = async (req, res) => {
  try {
    const mapping = await MappingProdottiFornitore.findById(req.params.id);
    if (!mapping) {
      return res.status(404).json({ success: false, error: 'Mapping non trovato' });
    }
    
    mapping.attivo = false;
    mapping.updatedBy = req.user?.id;
    await mapping.save();
    
    res.json({ success: true, data: { messaggio: 'Mapping disattivato' } });
    
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
          ultimaImportazione: { $max: '$dataImportazione' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const totaleMovimenti = await Movimento.countDocuments({ 'documentoRiferimento.tipo': 'fattura' });
    
    res.json({
      success: true,
      data: { perStato: stats, perFornitore, totaleMovimentiDaFatture: totaleMovimenti }
    });
    
  } catch (error) {
    logger.error('Errore statistiche importazioni:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  uploadFatture,
  confermaImport,
  autoImport,
  notificaErroreWatcher,
  ignoraFattura,
  listaImportazioni,
  dettaglioImportazione,
  annullaImportazione,
  listaMapping,
  modificaMapping,
  eliminaMapping,
  statisticheImportazioni
};