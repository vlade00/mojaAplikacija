import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';

// POST /api/auth/register - Registracija novog korisnika
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    // Validacija - proveri da li su svi potrebni podaci poslati
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, password' 
      });
    }
    
    // Proveri da li email već postoji
    const existingUser = await query(
      'SELECT id FROM "User" WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash-uj lozinku (bcrypt - sigurno čuvanje lozinki)
    // 10 = broj "rounds" (koliko puta se hash-uje - veći broj = sigurniji, ali sporiji)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Kreiraj korisnika
    const result = await query(`
      INSERT INTO "User" (name, email, password, phone, role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, name, email, phone, role, "createdAt"
    `, [
      name,
      email,
      hashedPassword, // Čuvamo hash-ovanu lozinku, ne originalnu!
      phone || null,
      role || 'CUSTOMER' // Ako nije poslato, default je CUSTOMER
    ]);
    
    const user = result.rows[0];
    
    // Ako je korisnik frizer (STYLIST), kreiraj i Stylist profil
    if (role === 'STYLIST') {
      await query(`
        INSERT INTO "Stylist" ("userId", rating, "totalReviews", "isActive", "createdAt", "updatedAt")
        VALUES ($1, 0, 0, true, NOW(), NOW())
      `, [user.id]);
    }
    
    // Generiši JWT token (korisnik je automatski ulogovan nakon registracije)
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Token važi 7 dana
    );
    
    // Vrati korisnika i token (bez lozinke!)
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/auth/login - Prijava korisnika
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validacija
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, password' 
      });
    }
    
    // Pronađi korisnika po email-u
    const result = await query(
      'SELECT id, name, email, password, phone, role FROM "User" WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // Proveri lozinku (poredi hash-ovanu lozinku iz baze sa unetom lozinkom)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generiši JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Vrati korisnika i token (bez lozinke!)
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// GET /api/auth/users - Vidi sve korisnike (za testiranje)
router.get('/users', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        email,
        phone,
        role,
        "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;

