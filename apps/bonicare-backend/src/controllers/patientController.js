import Patient from '../models/patient.js';
import MedicalFile from '../models/medicalFile.js'; 
import AiReport from '../models/AiReport.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

export const getPatientProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('name email phone role createdAt').lean();
  const patient = await Patient.findOne({ user: req.user.id }).lean();

  if (!user || !patient) {
    throw new AppError('Patient profile not found', 404);
  }

  return res.status(200).json({ success: true, data: { user, patient } });
};

export const updatePatientProfile = async (req, res) => {
  const { name, phone, dob, gender, medical_history } = req.body;
  const user = await User.findById(req.user.id);
  const patient = await Patient.findOne({ user: req.user.id });

  if (!user || !patient) {
    throw new AppError('Patient profile not found', 404);
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  await user.save();

  if (dob !== undefined) patient.dob = dob || undefined;
  if (gender !== undefined) patient.gender = gender || undefined;
  if (medical_history !== undefined) patient.medical_history = medical_history || {};
  await patient.save();

  const publicUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };

  return res.status(200).json({
    success: true,
    message: 'Patient profile updated successfully',
    data: {
      user: publicUser,
      patient: patient.toObject(),
    },
  });
};

/**
 * @openapi
 * /patient/dashboard:
 *   get:
 *     tags: [Patients]
 *     summary: Get patient dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient profile not found
 */
export const getPatientDashboard = async (req, res) => {
  // req.user coming from auth middleware (id, role)
  const userId = req.user.id;
  const patient = await Patient.findOne({ user: userId }).lean();
  
  if (!patient) {
    throw new AppError('Patient profile not found', 404);
  }

  // الآن نجلب ملفات المريض، التقارير، المواعيد (نماذج بسيطة)
  const files = await MedicalFile.find({ patient: patient._id }).sort({ uploadedAt: -1 }).lean();
  const ai_reports = await AiReport.find({ patient: patient._id }).sort({ createdAt: -1 }).lean();
  const appointments = await Appointment.find({ patientId: userId })
    .populate('doctorId', 'name email')
    .sort({ scheduledDate: -1 })
    .lean();

  return res.json({
    success: true,
    patient,
    files,
    ai_reports,
    appointments
  });
};
