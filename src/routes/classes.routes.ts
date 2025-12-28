import express from 'express';
import {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  registerStudentToClass,
  removeStudentFromClass,
  getAvailableStudents,
} from '../controllers/classes.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', getClasses);
router.get('/:id/available-students', authenticate, getAvailableStudents);
router.get('/:id', getClassById);
router.post('/', authenticate, createClass);
router.put('/:id', authenticate, updateClass);
router.delete('/:id', authenticate, deleteClass);
router.post('/:id/student', authenticate, registerStudentToClass);
router.delete('/:id/student/:studentId', authenticate, removeStudentFromClass);

export default router;

