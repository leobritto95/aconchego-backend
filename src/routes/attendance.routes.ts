import express from 'express';
import {
  getAttendances,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  createBulkAttendance,
} from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', getAttendances);
router.get('/:id', getAttendanceById);
router.post('/', authenticate, createAttendance);
router.post('/bulk', authenticate, createBulkAttendance);
router.put('/:id', authenticate, updateAttendance);
router.delete('/:id', authenticate, deleteAttendance);

export default router;

