import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';

// Proširi Express Request tip da uključi user
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

// Middleware za autentifikaciju - proverava JWT token
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Uzmi token iz header-a (Authorization: Bearer <token>)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Izdvoji token (ukloni "Bearer " prefiks)
    const token = authHeader.substring(7);
    
    // Verifikuj token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      role: string;
    };
    
    // Dodaj user informacije u request (da možeš da ih koristiš u route handler-ima)
    req.user = decoded;
    
    // Nastavi na sledeći middleware/route handler
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Middleware za proveru uloge (npr. samo admin može)
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

