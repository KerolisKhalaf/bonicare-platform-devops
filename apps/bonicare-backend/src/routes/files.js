import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { fileUploadValidator } from "../validators/fileValidators.js";
import { validate } from "../middleware/errorHandler.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  uploadMedicalFile,
  getAllFiles,
  getFileByName,
  deleteFile
} from "../controllers/filesController.js";

const router = express.Router();

router.get("/", protect(["patient"]), getAllFiles);
router.post(
  "/upload",
  protect(["patient"]),
  upload.single("file"),
  fileUploadValidator,
  validate,
  uploadMedicalFile
);
router.get("/:filename", protect(["patient"]), getFileByName);
router.delete("/:filename", protect(["patient"]), deleteFile);

export default router;
