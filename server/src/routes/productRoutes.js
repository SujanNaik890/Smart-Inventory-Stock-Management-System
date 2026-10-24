import express from 'express';
import crypto from 'node:crypto';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imageExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../client/public/uploads/'),
    filename: (req, file, callback) => {
      callback(null, `${crypto.randomUUID()}${imageExtensions[file.mimetype]}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!imageExtensions[file.mimetype]) {
      const error = new Error('Only JPEG, PNG, and WebP images are allowed.');
      error.statusCode = 400;
      return callback(error);
    }
    callback(null, true);
  }
});
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAllProducts);
router.post('/', upload.single('image'), createProduct);
router.get('/:id', getProductById);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
