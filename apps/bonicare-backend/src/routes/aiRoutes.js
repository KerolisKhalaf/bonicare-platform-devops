import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import * as aiController from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/v1/ai/predict
 * @desc Get AI prediction and persist to database linked to patient
 * @access Private
 */
router.post('/predict', protect(['patient']), aiController.getAndSavePrediction);
router.post('/bone-fracture', protect(['patient']), upload.single('file'), aiController.predictBoneFracture);

/**
 * @route GET /api/v1/ai/health
 * @desc Check AI microservice status
 */
router.get('/health', aiController.checkAiStatus);

export default router;
