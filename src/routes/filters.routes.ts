import express from 'express';
import { getStyles, getClasses, getYears } from '../controllers/filters.controller';

const router = express.Router();

router.get('/styles', getStyles);
router.get('/classes', getClasses);
router.get('/years', getYears);

export default router;



