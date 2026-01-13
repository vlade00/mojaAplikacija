import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import servicesRouter from './routes/services';
import stylistsRouter from './routes/stylists';

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
      services: '/api/services',
      stylists: '/api/stylists'
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
app.use('/api/services', servicesRouter);
app.use('/api/stylists', stylistsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

