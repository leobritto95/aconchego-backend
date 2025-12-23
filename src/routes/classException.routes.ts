import express from 'express';
import {
  createClassException,
  getClassExceptions,
  getAllClassExceptions,
  deleteClassException,
} from '../controllers/classException.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/', authenticate, createClassException);
router.get('/class/:classId', authenticate, getClassExceptions);
router.get('/all', authenticate, getAllClassExceptions);
router.delete('/:id', authenticate, deleteClassException);

export default router;


