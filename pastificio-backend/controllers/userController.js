// controllers/userController.js
import User from '../models/User.js';
import Role from '../models/role.js';
import logger from '../config/logger.js';

// Ottieni tutti gli utenti
export const getUsers = async (req, res) => {
  try {
    // Opzioni di filtro e paginazione
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Costruisci query base
    let query = User.find().populate({
      path: 'ruolo',
      select: 'nome permessi isAdmin'
    });
    
    // Filtra per query di ricerca
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = query.or([
        { username: searchRegex },
        { nome: searchRegex },
        { cognome: searchRegex },
        { email: searchRegex }
      ]);
    }
    
    // Filtra per stato attivo
    if (req.query.attivo) {
      query = query.where('attivo').equals(req.query.attivo === 'true');
    }
    
    // Filtra per ruolo
    if (req.query.ruolo) {
      query = query.where('ruolo').equals(req.query.ruolo);
    }
    
    // Conta totale documenti per paginazione
    const total = await User.countDocuments(query);
    
    // Esegui query con paginazione e ordinamento
    const users = await query
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Risultato paginazione
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    };
    
    res.status(200).json({
      success: true,
      count: users.length,
      pagination,
      data: users
    });
  } catch (error) {
    logger.error(`Errore nel recupero utenti: ${error.message}`, {
      service: 'userController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero degli utenti'
    });
  }
};

// Ottieni singolo utente
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: 'ruolo',
      select: 'nome permessi isAdmin'
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Errore nel recupero utente: ${error.message}`, {
      service: 'userController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dell\'utente'
    });
  }
};

// Crea nuovo utente
export const createUser = async (req, res) => {
  try {
    // Verifica che l'utente corrente abbia i permessi
    if (!req.user.ruolo.permessi.utenti.crea && !req.user.ruolo.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato a creare utenti'
      });
    }
    
    const { username, password, nome, cognome, email, ruoloId } = req.body;
    
    // Verifica campi obbligatori
    if (!username || !password || !nome || !cognome || !email || !ruoloId) {
      return res.status(400).json({
        success: false,
        error: 'Fornisci tutti i campi obbligatori'
      });
    }
    
    // Verifica esistenza ruolo
    const ruolo = await Role.findById(ruoloId);
    if (!ruolo) {
      return res.status(400).json({
        success: false,
        error: 'Ruolo non valido'
      });
    }
    
    // Verifica che l'utente corrente non stia creando un admin se non è admin
    if (ruolo.isAdmin && !req.user.ruolo.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato a creare utenti admin'
      });
    }
    
    // Crea utente
    const user = await User.create({
      username,
      password,
      nome,
      cognome,
      email,
      ruolo: ruoloId
    });
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Errore nella creazione utente: ${error.message}`, {
      service: 'userController',
      error: error.stack
    });
    
    // Gestione errori duplicati
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        error: `${field === 'username' ? 'Nome utente' : 'Email'} già in uso`
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione dell\'utente'
    });
  }
};

// Aggiorna utente
export const updateUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    // Verifica che l'utente corrente abbia i permessi
    const isOwnAccount = req.user.id === req.params.id;
    const canModifyUsers = req.user.ruolo.permessi.utenti.modifica;
    const isAdmin = req.user.ruolo.isAdmin;
    
    if (!isOwnAccount && !canModifyUsers && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato a modificare questo utente'
      });
    }
    
    // Gli utenti non-admin non possono modificare gli account admin
    const targetUserIsAdmin = (await Role.findById(user.ruolo)).isAdmin;
    if (targetUserIsAdmin && !isAdmin && !isOwnAccount) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato a modificare gli account admin'
      });
    }
    
    // Prepara dati aggiornamento
    const updateData = {};
    
    // Campi che l'utente può modificare del proprio account
    if (isOwnAccount) {
      // L'utente può modificare solo certi campi del proprio account
      if (req.body.nome) updateData.nome = req.body.nome;
      if (req.body.cognome) updateData.cognome = req.body.cognome;
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.password) updateData.password = req.body.password;
    } else {
      // Admin o utenti con permessi possono modificare più campi
      if (req.body.nome) updateData.nome = req.body.nome;
      if (req.body.cognome) updateData.cognome = req.body.cognome;
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.password) updateData.password = req.body.password;
      if (req.body.attivo !== undefined) updateData.attivo = req.body.attivo;
      
      // Solo admin possono cambiare ruolo
      if (req.body.ruoloId && isAdmin) {
        const nuovoRuolo = await Role.findById(req.body.ruoloId);
        if (!nuovoRuolo) {
          return res.status(400).json({
            success: false,
            error: 'Ruolo non valido'
          });
        }
        updateData.ruolo = req.body.ruoloId;
      }
    }
    
    // Aggiorna utente
    user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    
    // Se è stata cambiata la password, incrementa versione token
    if (req.body.password) {
      await user.incrementTokenVersion();
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Errore nell'aggiornamento utente: ${error.message}`, {
      service: 'userController',
      error: error.stack
    });
    
    // Gestione errori duplicati
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        error: `${field === 'username' ? 'Nome utente' : 'Email'} già in uso`
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento dell\'utente'
    });
  }
};

// Elimina utente
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    // Verifica che l'utente corrente abbia i permessi
    if (!req.user.ruolo.permessi.utenti.elimina && !req.user.ruolo.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato a eliminare utenti'
      });
    }
    
    // Gli utenti non-admin non possono eliminare gli account admin
    const targetUserIsAdmin = (await Role.findById(user.ruolo)).isAdmin;
    if (targetUserIsAdmin && !req.user.ruolo.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato a eliminare gli account admin'
      });
    }
    
    // Gli utenti non possono eliminare il proprio account
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        error: 'Non puoi eliminare il tuo account'
      });
    }
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Errore nell'eliminazione utente: ${error.message}`, {
      service: 'userController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione dell\'utente'
    });
  }
};

// Ottieni tutti i ruoli
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    
    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    logger.error(`Errore nel recupero ruoli: ${error.message}`, {
      service: 'userController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei ruoli'
    });
  }
};

// Crea nuovo ruolo
export const createRole = async (req, res) => {
  try {
    // Solo admin possono creare ruoli
    if (!req.user.ruolo.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato a creare ruoli'
      });
    }
    
    const { nome, descrizione, permessi, isAdmin } = req.body;
    
    // Verifica campi obbligatori
    if (!nome) {
      return res.status(400).json({
        success: false,
        error: 'Fornisci il nome del ruolo'
      });
    }
    
    // Crea ruolo
    const role = await Role.create({
      nome,
      descrizione,
      permessi,
      isAdmin: isAdmin || false
    });
    
    res.status(201).json({
      success: true,
      data: role
    });
  } catch (error) {
    logger.error(`Errore nella creazione ruolo: ${error.message}`, {
      service: 'userController',
      error: error.stack
    });
    
    // Gestione errori duplicati
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Un ruolo con questo nome esiste già'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione del ruolo'
    });
  }
};

// Aggiorna ruolo
export const updateRole = async (req, res) => {
  try {
    // Solo admin possono modificare ruoli
    if (!req.user.ruolo.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato a modificare ruoli'
      });
    }
    
    const { nome, descrizione, permessi, isAdmin } = req.body;
    let role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Ruolo non trovato'
      });
    }
    
    // Aggiorna ruolo
    role = await Role.findByIdAndUpdate(
      req.params.id,
      { nome, descrizione, permessi, isAdmin },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    logger.error(`Errore nell'aggiornamento ruolo: ${error.message}`, {
      service: 'userController',
      error: error.stack
    });
    
    // Gestione errori duplicati
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Un ruolo con questo nome esiste già'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento del ruolo'
    });
  }
};

// Elimina ruolo
export const deleteRole = async (req, res) => {
  try {
    // Solo admin possono eliminare ruoli
    if (!req.user.ruolo.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato a eliminare ruoli'
      });
    }
    
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Ruolo non trovato'
      });
    }
    
    // Verifica se ci sono utenti con questo ruolo
    const usersWithRole = await User.countDocuments({ ruolo: req.params.id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        error: `Impossibile eliminare: ci sono ${usersWithRole} utenti con questo ruolo`
      });
    }
    
    await role.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Errore nell'eliminazione ruolo: ${error.message}`, {
      service: 'userController',
      error: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione del ruolo'
    });
  }
};