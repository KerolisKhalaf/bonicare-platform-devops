import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ensure uploads dir exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    const unique = Date.now();
    cb(null, `${basename}_${unique}${ext}`);
  }
});

// allowed mimetypes (add as needed)
const ALLOWED = [
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
  'application/dicom', // note: many DICOMs have different mime; handle by extension too
  'application/pdf'
];

function fileFilter(req, file, cb) {
  // Accept if mimetype allowed OR extension is .dcm
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED.includes(file.mimetype) || ext === '.dcm') return cb(null, true);
  return cb(new Error('Invalid file type'), false);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB limit
});

export default upload;

