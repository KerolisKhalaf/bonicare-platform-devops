import AiReport from '../models/AiReport.js';
import Patient from '../models/patient.js';
import MedicalFile from '../models/medicalFile.js';
import aiClient from '../services/aiClient.js';
import { safeUnlink } from '../utils/fileUtils.js';

/**
 * Controller for handling AI Prediction and Persistence
 */
/**
 * @openapi
 * /ai/predict:
 *   post:
 *     tags: [AI]
 *     summary: Get AI prediction and save report
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - features
 *             properties:
 *               patientId:
 *                 type: string
 *                 example: "686a1b2c3d4e5f6789012345"
 *               fileId:
 *                 type: string
 *                 nullable: true
 *                 example: "686a1b2c3d4e5f6789012346"
 *               doctorId:
 *                 type: string
 *                 nullable: true
 *                 example: "686a1b2c3d4e5f6789012347"
 *               features:
 *                 type: array
 *                 minItems: 12
 *                 maxItems: 12
 *                 items:
 *                   type: number
 *                 example:
 *                   [63, 22, 39, 40, 98, 12, 35, 44, 28, 15, 55, 19]
 *     responses:
 *       201:
 *         description: Prediction generated and report saved
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Patient not found
 *       503:
 *         description: AI service unavailable
 *       500:
 *         description: Internal server error
 */
export const getAndSavePrediction = async (req, res) => {
    try {
        const { fileId, features } = req.body;

        // Validate features only
        if (!features || !Array.isArray(features) || features.length !== 12) {
            return res.status(400).json({
                status: 'error',
                message: 'Exactly 12 medical features are required.'
            });
        }

        // Get prediction from AI
        let prediction;

        try {
            prediction = await aiClient.predictLowerBack(features);
        } catch (aiError) {
            return res.status(503).json({
                status: 'error',
                message: aiError.message
            });
        }

        // Check patient existence
        const patient = await Patient.findOne({ user: req.user.id });

        if (!patient) {
            return res.status(404).json({
                status: 'error',
                message: 'Patient profile not found'
            });
        }

        // Save report
        const formattedData = aiClient.formatForReport(prediction);

        const newReport = new AiReport({
            ...formattedData,
            patient: patient._id,
            file: fileId || null
        });

        const savedReport = await newReport.save();

        // Optional linking
        try {

            if (fileId) {
                await MedicalFile.findByIdAndUpdate(
                    fileId,
                    {
                        $push: {
                            aiReports: savedReport._id
                        }
                    }
                );
            }

            await Patient.findByIdAndUpdate(
                patient._id,
                {
                    $set: {
                        'medical_history.last_ai_report': savedReport._id
                    }
                }
            );

        } catch (linkError) {
            console.error(
                'Failed to link AI report:',
                linkError.message
            );
        }

        return res.status(201).json({
            status: 'success',
            source: 'saved',
            data: savedReport,
            prediction
        });

    } catch (error) {

        console.error(
            'Prediction Controller Error:',
            error.message
        );

        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

/**
 * @openapi
 * /ai/bone-fracture:
 *   post:
 *     tags: [AI]
 *     summary: Detect bone fracture from image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Prediction result
 */
export const predictBoneFracture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'Image file is required'
            });
        }

        const result = await aiClient.predictBoneFracture(req.file);
        const patient = await Patient.findOne({ user: req.user.id });

        if (!patient) {
            return res.status(404).json({
                status: 'error',
                message: 'Patient profile not found'
            });
        }

        const confidence = typeof result.confidence === 'string'
            ? Number.parseFloat(result.confidence) / 100
            : Number(result.confidence ?? 0);
        const savedReport = await new AiReport({
            patient: patient._id,
            model_name: 'bone-fracture-v1',
            output_json: {
                label: result.label,
                prediction: result.prediction_score,
                confidence: result.confidence,
            },
            confidence: Number.isFinite(confidence) ? confidence : 0,
        }).save();

        return res.status(200).json({
            status: 'success',
            data: savedReport,
            result
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    } finally {
        if (req.file && req.file.path) {
            await safeUnlink(req.file.path);
        }
    }
};


/**
 * Health check for AI Service
 */
/**
 * @openapi
 * /ai/health:
 *   get:
 *     tags: [AI]
 *     summary: Check AI service health
 *     responses:
 *       200:
 *         description: AI service is running
 */
export const checkAiStatus = async (req, res) => {
    try {
        const health = await aiClient.checkHealth();
        return res.status(200).json({
            status: 'success',
            aiStatus: health
        });
    } catch (error) {
        return res.status(503).json({
            status: 'error',
            message: 'AI Service Unavailable'
        });
    }
};

