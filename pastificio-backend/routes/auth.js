// routes/auth.js (aggiornamento)
import express from 'express';
import { 
  register, 
  login, 
  getMe, 
  changePassword, 
  logout 
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Routes pubbliche
router.post('/login', login);

// Routes protette
router.use(protect);
router.post('/register', register); // Solo admin possono registrare utenti
router.get('/me', getMe);
router.post('/changepassword', changePassword);
router.post('/logout', logout);

export default router;