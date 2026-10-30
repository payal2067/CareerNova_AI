import multer from "multer";
import path from "path";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".doc"]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const mime = file.mimetype;

  if (ALLOWED_EXTENSIONS.has(ext) && ALLOWED_MIME_TYPES.has(mime)) {
    cb(null, true);
  } else {
    const error = new Error("Invalid file type: Only PDF and DOCX files are allowed");
    error.statusCode = 400;
    cb(error, false);
  }
};

export const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1,
  },
  fileFilter,
});

export default uploadResume;

