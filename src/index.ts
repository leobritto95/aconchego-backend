import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import eventsRoutes from './routes/events.routes';
import newsRoutes from './routes/news.routes';
import feedbackRoutes from './routes/feedback.routes';
import filtersRoutes from './routes/filters.routes';
import classesRoutes from './routes/classes.routes';
import usersRoutes from './routes/users.routes';
import attendanceRoutes from './routes/attendance.routes';
import classExceptionRoutes from './routes/classException.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/filters', filtersRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/class-exceptions', classExceptionRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


