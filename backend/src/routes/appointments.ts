import express from 'express';
import { query } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/appointments - Vrati sve rezervacije
router.get('/', async (req, res) => {
  try {
    // JOIN-ujemo tabele da dobijemo sve informacije
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
        -- Informacije o klijentu
        json_build_object(
          'id', u_customer.id,
          'name', u_customer.name,
          'email', u_customer.email,
          'phone', u_customer.phone
        ) as customer,
        -- Informacije o frizeru
        json_build_object(
          'id', st.id,
          'name', u_stylist.name,
          'email', u_stylist.email,
          'rating', st.rating
        ) as stylist,
        -- Informacije o usluzi
        json_build_object(
          'id', s.id,
          'name', s.name,
          'duration', s.duration,
          'category', s.category
        ) as service
      FROM "Appointment" a
      JOIN "User" u_customer ON a."customerId" = u_customer.id
      JOIN "Stylist" st ON a."stylistId" = st.id
      JOIN "User" u_stylist ON st."userId" = u_stylist.id
      JOIN "Service" s ON a."serviceId" = s.id
      ORDER BY a.date DESC, a.time DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/appointments/:id - Vrati jednu rezervaciju
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
        -- Informacije o klijentu
        json_build_object(
          'id', u_customer.id,
          'name', u_customer.name,
          'email', u_customer.email,
          'phone', u_customer.phone
        ) as customer,
        -- Informacije o frizeru
        json_build_object(
          'id', st.id,
          'name', u_stylist.name,
          'email', u_stylist.email,
          'rating', st.rating
        ) as stylist,
        -- Informacije o usluzi
        json_build_object(
          'id', s.id,
          'name', s.name,
          'duration', s.duration,
          'category', s.category
        ) as service
      FROM "Appointment" a
      JOIN "User" u_customer ON a."customerId" = u_customer.id
      JOIN "Stylist" st ON a."stylistId" = st.id
      JOIN "User" u_stylist ON st."userId" = u_stylist.id
      JOIN "Service" s ON a."serviceId" = s.id
      WHERE a.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// POST /api/appointments - Kreiraj novu rezervaciju (samo ulogovani korisnici)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { stylistId, serviceId, date, time, notes } = req.body;
    
    // Koristi ID ulogovanog korisnika kao customerId
    const customerId = req.user!.userId;
    
    // Validacija - proveri da li su svi potrebni podaci poslati
    if (!stylistId || !serviceId || !date || !time) {
      return res.status(400).json({ 
        error: 'Missing required fields: stylistId, serviceId, date, time' 
      });
    }
    
    // Proveri da li usluga postoji i uzmi cenu
    const serviceResult = await query(
      'SELECT price FROM "Service" WHERE id = $1 AND "isActive" = true',
      [serviceId]
    );
    
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found or inactive' });
    }
    
    const price = serviceResult.rows[0].price;
    
    // Proveri da li frizer postoji i da li je aktivan
    const stylistResult = await query(
      'SELECT id FROM "Stylist" WHERE id = $1 AND "isActive" = true',
      [stylistId]
    );
    
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stylist not found or inactive' });
    }
    
    // Kreiraj rezervaciju (customerId je već proveren kroz authenticate middleware)
    const result = await query(`
      INSERT INTO "Appointment" 
        ("customerId", "stylistId", "serviceId", date, time, status, price, notes, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7, NOW(), NOW())
      RETURNING *
    `, [customerId, stylistId, serviceId, date, time, price, notes || null]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// PUT /api/appointments/:id - Ažuriraj rezervaciju (samo ulogovani korisnici)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { date, time, status, notes } = req.body;
    
    // Proveri da li rezervacija postoji
    const existingResult = await query(
      'SELECT * FROM "Appointment" WHERE id = $1',
      [id]
    );
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Ažuriraj samo polja koja su poslata
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (date !== undefined) {
      updates.push(`date = $${paramIndex++}`);
      values.push(date);
    }
    if (time !== undefined) {
      updates.push(`time = $${paramIndex++}`);
      values.push(time);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Dodaj updatedAt
    updates.push(`"updatedAt" = NOW()`);
    values.push(id);
    
    const result = await query(`
      UPDATE "Appointment" 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// DELETE /api/appointments/:id - Obriši rezervaciju (samo ulogovani korisnici)
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Proveri da li rezervacija postoji i da li pripada ulogovanom korisniku
    const existingResult = await query(
      'SELECT * FROM "Appointment" WHERE id = $1 AND "customerId" = $2',
      [id, req.user!.userId]
    );
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found or you do not have permission to delete it' });
    }
    
    // Obriši rezervaciju
    await query('DELETE FROM "Appointment" WHERE id = $1', [id]);
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

export default router;

