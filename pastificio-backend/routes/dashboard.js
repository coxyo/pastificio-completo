import express from 'express';
import dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// Temporaneamente senza autenticazione per test
// router.use(protect);

router.get('/stats', dashboardController.getStatisticheGenerali);
router.get('/kpi', dashboardController.getKPI);

export default router;