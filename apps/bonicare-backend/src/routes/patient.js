import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/errorHandler.js';
import { patientProfileValidator } from '../validators/patientValidators.js';
import {
	getPatientDashboard,
	getPatientProfile,
	updatePatientProfile,
} from '../controllers/patientController.js';

const router = express.Router();

router.get('/dashboard', protect(['patient']), getPatientDashboard);
router.get('/profile', protect(['patient']), getPatientProfile);
router.put('/profile', protect(['patient']), patientProfileValidator, validate, updatePatientProfile);

export default router;
