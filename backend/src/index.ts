import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import servicesRouter from './routes/services';
import stylistsRouter from './routes/stylists';
import appointmentsRouter from './routes/appointments';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import stylistRouter from './routes/stylist';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
      stylist: '/api/stylist'
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

