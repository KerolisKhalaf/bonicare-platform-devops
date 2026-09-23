// src/controllers/filesController.js
import fs from "node:fs";
import path from "node:path";
import AppError from "../utils/AppError.js";
import MedicalFile from "../models/medicalFile.js";
import Patient from "../models/patient.js";

// folder where uploads are saved
const uploadDir = path.join(process.cwd(), "uploads");

/**
 * @openapi
 * /files:
 *   post:
 *     tags: [Files]
 *     summary: Upload a medical file
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *   get:
 *     tags: [Files]
 *     summary: Get all uploaded files
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
export const uploadMedicalFile = async (req, res) => {
  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }

  const patient = await Patient.findOne({ user: req.user.id });
  if (!patient) {
    throw new AppError("Patient profile not found", 404);
  }

  const medicalFile = await MedicalFile.create({
    patient: patient._id,
    uploader: req.user.id,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
    modality: req.body.modality || "Unknown",
    part: req.body.part || "Unknown",
  });

  return res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    data: {
      id: medicalFile._id,
      originalname: medicalFile.originalName,
      filename: medicalFile.filename,
      path: medicalFile.path,
      size: medicalFile.size,
      mimetype: medicalFile.mimeType,
      modality: medicalFile.modality,
      part: medicalFile.part,
    },
  });
};

// Get all uploaded files for the current patient
export const getAllFiles = async (req, res) => {
  const patient = await Patient.findOne({ user: req.user.id });
  if (!patient) {
    throw new AppError("Patient profile not found", 404);
  }

  const files = await MedicalFile.find({ patient: patient._id }).sort({ uploadedAt: -1 }).lean();

  return res.status(200).json({ success: true, data: files });
};

/**
 * @openapi
 * /files/{filename}:
 *   get:
 *     tags: [Files]
 *     summary: Get a file by name
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File content
 *   delete:
 *     tags: [Files]
 *     summary: Delete a file by name
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted successfully
 */
export const getFileByName = async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    throw new AppError("File not found", 404);
  }

  return res.sendFile(filePath);
};

// Delete a file by filename
export const deleteFile = async (req, res) => {
  const { filename } = req.params;
  const patient = await Patient.findOne({ user: req.user.id });
  if (!patient) {
    throw new AppError("Patient profile not found", 404);
  }

  const medicalFile = await MedicalFile.findOne({ filename, patient: patient._id });
  if (!medicalFile) {
    throw new AppError("File not found", 404);
  }

  const filePath = path.join(uploadDir, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await MedicalFile.deleteOne({ _id: medicalFile._id });
  return res.status(200).json({ success: true, message: "File deleted successfully" });
};
