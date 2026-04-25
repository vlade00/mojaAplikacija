import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploadAvatar, getAvatarUrl } from '../middleware/upload';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';

// POST /api/auth/register - Registracija novog korisnika
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Validacija - proveri da li su svi potrebni podaci poslati
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, password' 
      });
    }
    
    // Proveri da li email već postoji
    const existingUserByEmail = await query(
      'SELECT id FROM "User" WHERE email = $1',
      [email]
    );
    
    if (existingUserByEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Proveri da li telefon već postoji (ako je poslat i nije prazan)
    if (phone && phone.trim() !== '') {
      const existingUserByPhone = await query(
        'SELECT id FROM "User" WHERE phone = $1 AND phone IS NOT NULL',
        [phone.trim()]
      );
      
      if (existingUserByPhone.rows.length > 0) {
        return res.status(400).json({ error: 'Phone number already exists' });
      }
    }
    
    // Hash-uj lozinku (bcrypt - sigurno čuvanje lozinki)
    // 10 = broj "rounds" (koliko puta se hash-uje - veći broj = sigurniji, ali sporiji)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Kreiraj korisnika
    // Javna registracija: uvek CUSTOMER (ne veruj role iz body — sprečava self-signup ADMIN/STYLIST)
    const result = await query(`
      INSERT INTO "User" (name, email, password, phone, role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'CUSTOMER', NOW(), NOW())
      RETURNING id, name, email, phone, role, "avatarUrl", "createdAt"
    `, [name, email, hashedPassword, phone || null]);
    
    const user = result.rows[0];
    
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
        role: user.role,
        avatarUrl: user.avatarUrl
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
      'SELECT id, name, email, password, phone, role, "avatarUrl" FROM "User" WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // Debug: proveri šta se vraća iz baze
    console.log('[Login] User from DB:', {
      id: user.id,
      email: user.email,
      hasAvatarUrl: !!user.avatarUrl,
      avatarUrlType: typeof user.avatarUrl,
      avatarUrl: user.avatarUrl ? (user.avatarUrl.length > 50 ? user.avatarUrl.substring(0, 50) + '...' : user.avatarUrl) : 'null'
    });
    
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
    // Osiguraj da se avatarUrl pravilno vraća - koristi user.avatarUrl direktno iz baze
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl || null // Koristi avatarUrl direktno iz baze
    };
    
    console.log('[Login] User response being sent:', { 
      id: userResponse.id, 
      email: userResponse.email,
      hasAvatarUrl: !!userResponse.avatarUrl,
      avatarUrl: userResponse.avatarUrl ? (userResponse.avatarUrl.length > 50 ? userResponse.avatarUrl.substring(0, 50) + '...' : userResponse.avatarUrl) : 'null'
    });
    
    res.json({
      user: userResponse,
      token
    });
  } catch (error: any) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// PUT /api/auth/profile - Ažuriraj profil ulogovanog korisnika
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { name, email, phone, avatarUrl } = req.body;
    
    // Proveri da li email već postoji (ako se menja) - samo ako je email eksplicitno poslat
    if (email !== undefined && email !== null && email.trim() !== '') {
      const emailCheck = await query('SELECT id FROM "User" WHERE email = $1 AND id != $2', [email.trim(), userId]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email već postoji' });
      }
    }
    
    // Proveri da li telefon već postoji (ako se menja) - samo ako je phone eksplicitno poslat
    if (phone !== undefined && phone !== null && phone.trim() !== '') {
      const phoneCheck = await query('SELECT id FROM "User" WHERE phone = $1 AND id != $2 AND phone IS NOT NULL', [phone.trim(), userId]);
      if (phoneCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Broj telefona već postoji' });
      }
    }
    
    // Ažuriraj korisnika
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (name !== undefined && name !== null && name.trim() !== '') {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    if (email !== undefined && email !== null && email.trim() !== '') {
      updates.push(`email = $${paramIndex++}`);
      values.push(email.trim());
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone && phone.trim() !== '' ? phone.trim() : null);
    }
    if (avatarUrl !== undefined) {
      // Dozvoli i prazan string (za brisanje avatara) i validan URL
      updates.push(`"avatarUrl" = $${paramIndex++}`);
      // Ako je string, trim-uj ga, ako je null/undefined, postavi na null
      const trimmedUrl = typeof avatarUrl === 'string' ? avatarUrl.trim() : (avatarUrl || null);
      values.push(trimmedUrl);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nema podataka za ažuriranje' });
    }
    
    updates.push(`"updatedAt" = NOW()`);
    values.push(userId);
    
    console.log('[Update Profile] SQL Update:', {
      updates: updates.join(', '),
      valuesCount: values.length,
      userId: userId,
      hasAvatarUrl: avatarUrl !== undefined
    });
    
    const result = await query(`
      UPDATE "User" 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, email, phone, role, "avatarUrl", "createdAt"::text, "updatedAt"::text
    `, values);
    
    console.log('[Update Profile] Result from DB:', {
      id: result.rows[0]?.id,
      email: result.rows[0]?.email,
      hasAvatarUrl: !!result.rows[0]?.avatarUrl,
      avatarUrl: result.rows[0]?.avatarUrl ? (result.rows[0].avatarUrl.length > 50 ? result.rows[0].avatarUrl.substring(0, 50) + '...' : result.rows[0].avatarUrl) : 'null'
    });
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Greška pri ažuriranju profila' });
  }
});

// PUT /api/auth/change-password - Promeni lozinku ulogovanog korisnika
router.put('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;
    
    console.log('[Change Password] User ID:', userId);
    console.log('[Change Password] Request body:', { currentPassword: currentPassword ? '***' : undefined, newPassword: newPassword ? '***' : undefined });
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Trenutna i nova lozinka su obavezne' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova lozinka mora imati najmanje 6 karaktera' });
    }
    
    // Proveri trenutnu lozinku
    const userResult = await query('SELECT password FROM "User" WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      console.error('[Change Password] User not found:', userId);
      return res.status(404).json({ error: 'Korisnik nije pronađen' });
    }
    
    console.log('[Change Password] Checking current password...');
    const isPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!isPasswordValid) {
      console.error('[Change Password] Invalid current password for user:', userId);
      return res.status(400).json({ error: 'Trenutna lozinka nije tačna' });
    }
    
    console.log('[Change Password] Current password is valid, hashing new password...');
    // Hash-uj novu lozinku
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Ažuriraj lozinku
    await query(`
      UPDATE "User" 
      SET password = $1, "updatedAt" = NOW()
      WHERE id = $2
    `, [hashedPassword, userId]);
    
    console.log('[Change Password] Password updated successfully for user:', userId);
    res.json({ message: 'Lozinka je uspešno promenjena' });
  } catch (error: any) {
    console.error('[Change Password] Error:', error);
    console.error('[Change Password] Error details:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Greška pri promeni lozinke: ' + (error.message || 'Nepoznata greška') });
  }
});

// POST /api/auth/upload-avatar - Upload avatar slike
router.post('/upload-avatar', authenticate, uploadAvatar.single('avatar'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nijedna slika nije uploadovana' });
    }
    
    const avatarUrl = getAvatarUrl(req.file.filename);
    
    // Ažuriraj avatarUrl u bazi
    await query(`
      UPDATE "User" 
      SET "avatarUrl" = $1, "updatedAt" = NOW()
      WHERE id = $2
    `, [avatarUrl, userId]);
    
    res.json({ 
      message: 'Avatar je uspešno uploadovan',
      avatarUrl: avatarUrl
    });
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Greška pri upload-u avatara: ' + (error.message || 'Nepoznata greška') });
  }
});

export default router;

