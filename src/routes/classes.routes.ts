import express from 'express';
import {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  registerStudentToClass,
} from '../controllers/classes.controller';
import { registerAttendanceForClass } from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', getClasses);
router.get('/:id', getClassById);
router.post('/', authenticate, createClass);
router.put('/:id', authenticate, updateClass);
router.delete('/:id', authenticate, deleteClass);
router.post('/:id/student', authenticate, registerStudentToClass);
router.post('/:id/attendance', authenticate, registerAttendanceForClass);

export default router;

