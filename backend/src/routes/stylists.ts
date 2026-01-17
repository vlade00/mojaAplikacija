import express from 'express';
import { query } from '../db/connection';

const router = express.Router();

// GET /api/stylists - Vrati sve frizere
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        s.id as stylist_id,
        s.rating,
        s."totalReviews",
        s.bio,
        s."yearsOfExperience",
        s."isActive"
      FROM "User" u
      JOIN "Stylist" s ON u.id = s."userId"
      WHERE u.role = 'STYLIST' AND s."isActive" = true
      ORDER BY s.rating DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stylists:', error);
    res.status(500).json({ error: 'Failed to fetch stylists' });
  }
});

// GET /api/stylists/:id - Vrati jednog frizera
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        s.id as stylist_id,
        s.rating,
        s."totalReviews",
        s.bio,
        s."yearsOfExperience"
      FROM "User" u
      JOIN "Stylist" s ON u.id = s."userId"
      WHERE s.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stylist not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching stylist:', error);
    res.status(500).json({ error: 'Failed to fetch stylist' });
  }
});

// GET /api/stylists/:id/services - Vrati usluge koje radi frizer
// id može biti User.id ili Stylist.id - proveravamo oba
router.get('/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.duration,
        s.price,
        s.category
      FROM "Stylist" st
      JOIN "ServiceStylist" ss ON st.id = ss."stylistId"
      JOIN "Service" s ON ss."serviceId" = s.id
      WHERE (st.id = $1 OR st."userId" = $1) AND s."isActive" = true
      ORDER BY s.category, s.name
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stylist services:', error);
    res.status(500).json({ error: 'Failed to fetch stylist services' });
  }
});

export default router;




