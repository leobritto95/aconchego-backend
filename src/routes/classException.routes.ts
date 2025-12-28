import express from 'express';
import {
  createClassException,
  getClassExceptions,
  deleteClassException,
} from '../controllers/classException.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticate, getClassExceptions);
router.post('/', authenticate, createClassException);
router.delete('/:id', authenticate, deleteClassException);

export default router;


