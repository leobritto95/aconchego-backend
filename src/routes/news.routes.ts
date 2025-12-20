import express from 'express';
import {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  searchNews,
  getLatestNews,
} from '../controllers/news.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', getNews);
router.get('/search', searchNews);
router.get('/latest', getLatestNews);
router.get('/:id', getNewsById);
router.post('/', authenticate, createNews);
router.put('/:id', authenticate, updateNews);
router.delete('/:id', authenticate, deleteNews);

export default router;




