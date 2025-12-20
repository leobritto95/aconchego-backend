import express from 'express';
import {
  getFeedbacks,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getGroupedClasses,
  getStudentGroupedClasses,
  getFeedbacksByClassId,
} from '../controllers/feedback.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', getFeedbacks);
router.get('/classes', getGroupedClasses);
router.get('/student/classes', getStudentGroupedClasses);
router.get('/class/:classId', getFeedbacksByClassId);
router.get('/:id', getFeedbackById);
router.post('/', authenticate, createFeedback);
router.put('/:id', authenticate, updateFeedback);
router.delete('/:id', authenticate, deleteFeedback);

export default router;



