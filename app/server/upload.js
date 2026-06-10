import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const MAX_BYTES = (parseInt(process.env.MAX_UPLOAD_MB || '10', 10)) * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    const safe = ext.replace(/[^.a-z0-9]/g, '') || '.jpg';
    cb(null, `${crypto.randomUUID()}${safe}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!/^image\/(jpe?g|png|webp)$/i.test(file.mimetype)) {
    return cb(new Error('Only JPG, PNG or WEBP images are accepted'));
  }
  cb(null, true);
};

export const uploadSingle = multer({ storage, limits: { fileSize: MAX_BYTES }, fileFilter }).single('image');
export const uploadMany = multer({ storage, limits: { fileSize: MAX_BYTES, files: parseInt(process.env.MAX_BATCH_SIZE || '300', 10) }, fileFilter }).array('images');

export { UPLOAD_DIR };
