import express from 'express';
import {
  createClassException,
  getClassExceptions,
  deleteClassException,
} from '../controllers/classException.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/', authenticate, createClassException);
router.get('/class/:classId', authenticate, getClassExceptions);
router.delete('/:id', authenticate, deleteClassException);

export default router;

