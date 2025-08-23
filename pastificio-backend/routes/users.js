// routes/users.js
import express from 'express';
import { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser,
  getRoles,
  createRole,
  updateRole,
  deleteRole
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';

const router = express.Router();

// Proteggi tutte le routes
router.use(protect);

// Routes utenti
router.get('/', checkPermission('utenti', 'visualizza'), getUsers);
router.get('/:id', checkPermission('utenti', 'visualizza'), getUser);
router.post('/', checkPermission('utenti', 'crea'), createUser);
router.put('/:id', updateUser); // Gestisce anche self-update
router.delete('/:id', checkPermission('utenti', 'elimina'), deleteUser);

// Routes ruoli
router.get('/role/all', checkPermission('utenti', 'visualizza'), getRoles);
router.post('/role', checkPermission('utenti', 'crea'), createRole);
router.put('/role/:id', checkPermission('utenti', 'modifica'), updateRole);
router.delete('/role/:id', checkPermission('utenti', 'elimina'), deleteRole);

export default router;