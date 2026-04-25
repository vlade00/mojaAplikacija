import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import servicesRouter from './routes/services';
import stylistsRouter from './routes/stylists';
import appointmentsRouter from './routes/appointments';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import stylistRouter from './routes/stylist';
import reviewsRouter from './routes/reviews';

dotenv.config();

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('JWT_SECRET mora biti postavljen u .env za production.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: u produkciji postavi CORS_ORIGINS (zarezom odvojeni URL-ovi fronta), npr.
// CORS_ORIGINS=https://tvoj-front.netlify.app,http://localhost:3001
const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
const corsOptions =
  corsOrigins && corsOrigins.length > 0
    ? { origin: corsOrigins, credentials: true }
    : { origin: true as const };

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files (avatars)
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to HairStudio API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      services: '/api/services',
      stylists: '/api/stylists',
      appointments: '/api/appointments',
      admin: '/api/admin',
      stylist: '/api/stylist',
      reviews: '/api/reviews'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HairStudio API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/services', servicesRouter);
app.use('/api/stylists', stylistsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/stylist', stylistRouter);
app.use('/api/reviews', reviewsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

