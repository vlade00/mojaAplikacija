import express from 'express';
import { query } from '../db/connection';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Svi frizer endpoints zahtevaju autentifikaciju i STYLIST ulogu
router.use(authenticate);
router.use(requireRole(['STYLIST']));

// GET /api/stylist/me - Vrati profil ulogovanog frizera
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    const result = await query(`
      SELECT 
        u.id as "userId",
        u.name,
        u.email,
        u.phone,
        s.id as "stylistId",
        s.rating,
        s."totalReviews",
        s.bio,
        s."yearsOfExperience",
        s."isActive"
      FROM "User" u
      JOIN "Stylist" s ON u.id = s."userId"
      WHERE u.id = $1 AND u.role = 'STYLIST'
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stylist profile not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching stylist profile:', error);
    res.status(500).json({ error: 'Failed to fetch stylist profile' });
  }
});

// GET /api/stylist/me/appointments - Vrati rezervacije ulogovanog frizera
router.get('/me/appointments', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    // Pronađi stylistId za ulogovanog korisnika
    const stylistResult = await query(
      'SELECT id FROM "Stylist" WHERE "userId" = $1',
      [userId]
    );
    
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stylist profile not found' });
    }
    
    const stylistId = stylistResult.rows[0].id;
    
    // Vrati sve rezervacije gde je on frizer
    const result = await query(`
      SELECT 
        a.id,
        a.date,
        a.time,
        a.status,
        a.price,
        a.notes,
        a."createdAt",
        a."updatedAt",
        json_build_object(
          'id', u_customer.id,
          'name', u_customer.name,
          'email', u_customer.email,
          'phone', u_customer.phone
        ) as customer,
        json_build_object(
          'id', s.id,
          'name', s.name,
          'duration', s.duration,
          'category', s.category
        ) as service
      FROM "Appointment" a
      JOIN "User" u_customer ON a."customerId" = u_customer.id
      JOIN "Service" s ON a."serviceId" = s.id
      WHERE a."stylistId" = $1
      ORDER BY a.date DESC, a.time DESC
    `, [stylistId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stylist appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// PUT /api/stylist/appointments/:id/status - Ažuriraj status rezervacije
router.put('/appointments/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.userId;
    
    // Validacija statusa
    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    // Pronađi stylistId za ulogovanog korisnika
    const stylistResult = await query(
      'SELECT id FROM "Stylist" WHERE "userId" = $1',
      [userId]
    );
    
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stylist profile not found' });
    }
    
    const stylistId = stylistResult.rows[0].id;
    
    // Proveri da li rezervacija postoji i da li je on frizer u toj rezervaciji
    const appointmentResult = await query(
      'SELECT * FROM "Appointment" WHERE id = $1 AND "stylistId" = $2',
      [id, stylistId]
    );
    
    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Appointment not found or you are not the stylist for this appointment' 
      });
    }
    
    // Ažuriraj status
    const result = await query(`
      UPDATE "Appointment" 
      SET status = $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

export default router;

