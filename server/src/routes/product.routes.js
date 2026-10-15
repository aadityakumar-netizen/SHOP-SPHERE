import express from 'express';
import {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public catalogue routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Admin-protected routes (requires authenticated user with admin role)
router.post('/', requireAuth, requireAdmin, createProduct);
router.patch('/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

export default router;
