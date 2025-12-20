import express from 'express';
import {
  getAttendances,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', getAttendances);
router.get('/:id', getAttendanceById);
router.post('/', authenticate, createAttendance);
router.put('/:id', authenticate, updateAttendance);
router.delete('/:id', authenticate, deleteAttendance);

export default router;

