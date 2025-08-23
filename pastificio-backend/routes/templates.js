// routes/templates.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getTemplates,
  getTemplate,  // AGGIUNTO - mancava questo import
  createTemplate,
  updateTemplate,
  deleteTemplate,
  testTemplate,
  inviaTemplateACampione
} from '../controllers/templateController.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTemplates)
  .post(authorize('admin'), createTemplate);

router.route('/:id')
  .get(getTemplate)
  .put(authorize('admin'), updateTemplate)
  .delete(authorize('admin'), deleteTemplate);

router.post('/:id/test', testTemplate);
router.post('/:id/invia-campione', authorize('admin'), inviaTemplateACampione);

export default router;