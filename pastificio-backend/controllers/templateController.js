// controllers/templateController.js
import TemplateMessaggio from '../models/templateMessaggio.js';
import whatsappService from '../services/whatsappService.js';
import logger from '../config/logger.js';

export const getTemplates = async (req, res) => {
  try {
    const { categoria, attivo } = req.query;
    const filtro = {};
    
    if (categoria) filtro.categoria = categoria;
    if (attivo !== undefined) filtro.attivo = attivo === 'true';
    
    const templates = await TemplateMessaggio.find(filtro)
      .sort('-utilizzi -createdAt');
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Errore recupero templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getTemplate = async (req, res) => {
  try {
    const template = await TemplateMessaggio.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template non trovato'
      });
    }
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Errore recupero template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const template = new TemplateMessaggio(req.body);
    await template.save();
    
    logger.info(`Nuovo template creato: ${template.nome}`);
    
    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Errore creazione template:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const template = await TemplateMessaggio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template non trovato'
      });
    }
    
    logger.info(`Template aggiornato: ${template.nome}`);
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Errore aggiornamento template:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const template = await TemplateMessaggio.findByIdAndDelete(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template non trovato'
      });
    }
    
    logger.info(`Template eliminato: ${template.nome}`);
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Errore eliminazione template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const testTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { variabili } = req.body;
    
    const template = await TemplateMessaggio.findById(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template non trovato'
      });
    }
    
    const testoProcessato = template.processa(variabili || {});
    
    res.json({
      success: true,
      data: {
        originale: template.testo,
        processato: testoProcessato,
        variabiliUsate: variabili
      }
    });
  } catch (error) {
    logger.error('Errore test template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const inviaTemplateACampione = async (req, res) => {
  try {
    const { id } = req.params;
    const { telefono, variabili } = req.body;
    
    if (!telefono) {
      return res.status(400).json({
        success: false,
        error: 'Numero di telefono richiesto'
      });
    }
    
    const template = await TemplateMessaggio.findById(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template non trovato'
      });
    }
    
    const testoProcessato = template.processa(variabili || {});
    
    await whatsappService.inviaMessaggio(telefono, testoProcessato);
    
    logger.info(`Template di test inviato a ${telefono}`);
    
    res.json({
      success: true,
      data: {
        messaggio: 'Template inviato con successo',
        telefono,
        template: template.nome
      }
    });
  } catch (error) {
    logger.error('Errore invio template campione:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Esporta tutte le funzioni
export default {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  testTemplate,
  inviaTemplateACampione
};