import express from 'express';
import { login, logout, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/validate', authenticate, getCurrentUser);

export default router;



