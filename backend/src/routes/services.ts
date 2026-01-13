import express from 'express';
import { query } from '../db/connection';

const router = express.Router();

// GET /api/services - Vrati sve usluge
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, description, duration, price, category, "isActive" FROM "Service" WHERE "isActive" = true ORDER BY category, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// GET /api/services/:id - Vrati jednu uslugu
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM "Service" WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// GET /api/services/category/:category - Vrati usluge po kategoriji
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const result = await query(
      'SELECT * FROM "Service" WHERE category = $1 AND "isActive" = true ORDER BY name',
      [category]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

export default router;

