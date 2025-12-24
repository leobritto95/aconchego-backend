import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserCounts,
} from '../controllers/users.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/count', authenticate, getUserCounts);
router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUserById);
router.post('/', authenticate, createUser);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);

export default router;



