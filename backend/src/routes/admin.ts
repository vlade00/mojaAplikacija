import express from 'express';
import bcrypt from 'bcrypt';
import { query, pool } from '../db/connection';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Svi admin endpoints zahtevaju autentifikaciju i ADMIN ulogu
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// GET /api/admin/users - Vrati sve korisnike
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        email,
        phone,
        role,
        "createdAt",
        "updatedAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users - Kreiraj korisnika (klijent; ne vraća JWT — admin ostaje ulogovan)
router.post('/users', async (req: AuthRequest, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Ime je obavezno' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email je obavezan' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Lozinka je obavezna' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Lozinka mora imati najmanje 6 karaktera' });
    }

    const emailTrim = email.trim();
    const nameTrim = name.trim();

    const existingUser = await query('SELECT id FROM "User" WHERE email = $1', [emailTrim]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email već postoji' });
    }

    if (phone && String(phone).trim() !== '') {
      const existingPhone = await query(
        'SELECT id FROM "User" WHERE phone = $1 AND phone IS NOT NULL',
        [String(phone).trim()]
      );
      if (existingPhone.rows.length > 0) {
        return res.status(400).json({ error: 'Broj telefona već postoji' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const phoneVal = phone && String(phone).trim() !== '' ? String(phone).trim() : null;

    const result = await query(
      `
      INSERT INTO "User" (name, email, password, phone, role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'CUSTOMER', NOW(), NOW())
      RETURNING id, name, email, phone, role, "avatarUrl", "createdAt", "updatedAt"
    `,
      [nameTrim, emailTrim, hashedPassword, phoneVal]
    );

    res.status(201).json({
      message: 'Korisnik je kreiran',
      user: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error?.code === '23505') {
      return res.status(400).json({ error: 'Email ili telefon već postoji' });
    }
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      error: 'Greška pri kreiranju korisnika',
      ...(isDev && error?.message ? { details: error.message } : {}),
    });
  }
});

// GET /api/admin/users/:id - Vrati jednog korisnika
router.get('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        id,
        name,
        email,
        phone,
        role,
        "createdAt",
        "updatedAt"
      FROM "User"
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/admin/users/:id - Ažuriraj korisnika
router.put('/users/:id', async (req: AuthRequest, res) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = parseInt(idParam, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const { name, email, phone, role, password } = req.body;
    
    // Proveri da li korisnik postoji
    const existingUser = await query('SELECT id FROM "User" WHERE id = $1', [userId]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Proveri da li email već postoji (ako se menja)
    if (email) {
      const emailCheck = await query('SELECT id FROM "User" WHERE email = $1 AND id != $2', [email, userId]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    
    // Ažuriraj korisnika
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (name !== undefined && name !== null) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (email !== undefined && email !== null) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone && phone.trim() !== '' ? phone.trim() : null);
    }
    if (role !== undefined && role !== null) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (password !== undefined && password !== null && password !== '') {
      // Hash-uj novu lozinku
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
    }
    
    if (updates.length > 0) {
      updates.push(`"updatedAt" = NOW()`);
      values.push(userId);
      await query(`UPDATE "User" SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
    }

    // Ako je uloga STYLIST, mora postojati red u "Stylist" (inače panel frizera ne radi)
    if (role === 'STYLIST') {
      const stylistRow = await query('SELECT id FROM "Stylist" WHERE "userId" = $1', [userId]);
      if (stylistRow.rows.length === 0) {
        await query(
          `INSERT INTO "Stylist" ("userId", rating, "totalReviews", "isActive", "createdAt", "updatedAt")
           VALUES ($1, 0, 0, true, NOW(), NOW())`,
          [userId]
        );
      }
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/admin/users/:id - Obriši korisnika
router.delete('/users/:id', async (req: AuthRequest, res) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = parseInt(idParam, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Proveri da li korisnik postoji
    const existingUser = await query('SELECT id, role FROM "User" WHERE id = $1', [userId]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Ne dozvoli brisanje admin korisnika
    if (existingUser.rows[0].role === 'ADMIN') {
      return res.status(400).json({ error: 'Cannot delete admin user' });
    }
    
    // Obriši korisnika (CASCADE će obrisati i Stylist profil ako postoji)
    await query('DELETE FROM "User" WHERE id = $1', [userId]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// POST /api/admin/stylists - Kreiraj novog frizera
router.post('/stylists', async (req: AuthRequest, res) => {
  try {
    const { name, email, password, phone, bio, yearsOfExperience } = req.body;
    
    // Validacija
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
    
    // Hash-uj lozinku
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Kreiraj User sa role=STYLIST
    const userResult = await query(`
      INSERT INTO "User" (name, email, password, phone, role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'STYLIST', NOW(), NOW())
      RETURNING id, name, email, phone, role
    `, [name, email, hashedPassword, phone || null]);
    
    const user = userResult.rows[0];
    
    // Kreiraj Stylist profil
    const stylistResult = await query(`
      INSERT INTO "Stylist" 
        ("userId", rating, "totalReviews", bio, "yearsOfExperience", "isActive", "createdAt", "updatedAt")
      VALUES ($1, 0, 0, $2, $3, true, NOW(), NOW())
      RETURNING id, rating, "totalReviews", bio, "yearsOfExperience"
    `, [user.id, bio || null, yearsOfExperience || 0]);
    
    res.status(201).json({
      user,
      stylist: stylistResult.rows[0]
    });
  } catch (error) {
    console.error('Error creating stylist:', error);
    res.status(500).json({ error: 'Failed to create stylist' });
  }
});

// GET /api/admin/stylists - Vrati sve frizere sa detaljima
router.get('/stylists', async (req: AuthRequest, res) => {
  try {
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
        s."isActive",
        u."createdAt"
      FROM "User" u
      JOIN "Stylist" s ON u.id = s."userId"
      WHERE u.role = 'STYLIST'
      ORDER BY u."createdAt" DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stylists:', error);
    res.status(500).json({ error: 'Failed to fetch stylists' });
  }
});

// DELETE /api/admin/stylists/:id — obriši frizera (id = "Stylist".id; CASCADE briše nalog i povezane podatke)
router.delete('/stylists/:id', async (req: AuthRequest, res) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const stylistId = parseInt(idParam, 10);
    if (isNaN(stylistId)) {
      return res.status(400).json({ error: 'Invalid stylist ID' });
    }

    const existingResult = await query(
      `SELECT s.id, s."userId", u.role
       FROM "Stylist" s
       JOIN "User" u ON s."userId" = u.id
       WHERE s.id = $1`,
      [stylistId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stylist not found' });
    }

    const { userId, role } = existingResult.rows[0];
    if (role === 'ADMIN') {
      return res.status(400).json({ error: 'Cannot delete admin user' });
    }
    if (role !== 'STYLIST') {
      return res.status(400).json({ error: 'Not a stylist account' });
    }

    await query('DELETE FROM "User" WHERE id = $1', [userId]);
    res.json({ message: 'Stylist deleted successfully' });
  } catch (error) {
    console.error('Error deleting stylist:', error);
    res.status(500).json({ error: 'Failed to delete stylist' });
  }
});

// PUT /api/admin/stylists/:id - Ažuriraj frizera
router.put('/stylists/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, bio, yearsOfExperience, isActive } = req.body;
    
    // Proveri da li frizer postoji
    const existingResult = await query(`
      SELECT s.id, s."userId"
      FROM "Stylist" s
      JOIN "User" u ON s."userId" = u.id
      WHERE s.id = $1 AND u.role = 'STYLIST'
    `, [id]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stylist not found' });
    }
    
    const userId = existingResult.rows[0].userId;
    
    // Ažuriraj User
    const userUpdates: string[] = [];
    const userValues: any[] = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      userUpdates.push(`name = $${paramIndex++}`);
      userValues.push(name);
    }
    if (email !== undefined) {
      userUpdates.push(`email = $${paramIndex++}`);
      userValues.push(email);
    }
    if (phone !== undefined) {
      userUpdates.push(`phone = $${paramIndex++}`);
      userValues.push(phone);
    }
    
    if (userUpdates.length > 0) {
      userUpdates.push(`"updatedAt" = NOW()`);
      userValues.push(userId);
      await query(`
        UPDATE "User" 
        SET ${userUpdates.join(', ')}
        WHERE id = $${paramIndex}
      `, userValues);
    }
    
    // Ažuriraj Stylist
    const stylistUpdates: string[] = [];
    const stylistValues: any[] = [];
    paramIndex = 1;
    
    if (bio !== undefined) {
      stylistUpdates.push(`bio = $${paramIndex++}`);
      stylistValues.push(bio);
    }
    if (yearsOfExperience !== undefined) {
      stylistUpdates.push(`"yearsOfExperience" = $${paramIndex++}`);
      stylistValues.push(yearsOfExperience);
    }
    if (isActive !== undefined) {
      stylistUpdates.push(`"isActive" = $${paramIndex++}`);
      stylistValues.push(isActive);
    }
    
    if (stylistUpdates.length > 0) {
      stylistUpdates.push(`"updatedAt" = NOW()`);
      stylistValues.push(id);
      await query(`
        UPDATE "Stylist" 
        SET ${stylistUpdates.join(', ')}
        WHERE id = $${paramIndex}
      `, stylistValues);
    }
    
    res.json({ message: 'Stylist updated successfully' });
  } catch (error) {
    console.error('Error updating stylist:', error);
    res.status(500).json({ error: 'Failed to update stylist' });
  }
});

// PUT /api/admin/stylists/:id/services - Dodeli usluge frizeru
router.put('/stylists/:id/services', async (req: AuthRequest, res) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const stylistId = parseInt(idParam, 10);
    if (isNaN(stylistId)) {
      return res.status(400).json({ error: 'Invalid stylist ID' });
    }
    
    const { serviceIds } = req.body;
    
    if (!Array.isArray(serviceIds)) {
      return res.status(400).json({ error: 'serviceIds must be an array' });
    }
    
    // Proveri da li frizer postoji
    const existingResult = await query(`
      SELECT s.id
      FROM "Stylist" s
      JOIN "User" u ON s."userId" = u.id
      WHERE s.id = $1 AND u.role = 'STYLIST'
    `, [stylistId]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stylist not found' });
    }
    
    // Obriši sve postojeće veze
    await query('DELETE FROM "ServiceStylist" WHERE "stylistId" = $1', [stylistId]);
    
    // Kreiraj nove veze ako su poslate usluge
    if (serviceIds.length > 0) {
      // Proveri da li sve usluge postoje
      const placeholders = serviceIds.map((_, i) => `$${i + 1}`).join(', ');
      const servicesCheck = await query(
        `SELECT id FROM "Service" WHERE id IN (${placeholders}) AND "isActive" = true`,
        serviceIds
      );
      
      if (servicesCheck.rows.length !== serviceIds.length) {
        return res.status(400).json({ error: 'One or more services not found or inactive' });
      }
      
      // Kreiraj nove veze
      for (const serviceId of serviceIds) {
        await query(
          'INSERT INTO "ServiceStylist" ("stylistId", "serviceId", "createdAt") VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
          [stylistId, serviceId]
        );
      }
    }
    
    res.json({ message: 'Services assigned successfully' });
  } catch (error) {
    console.error('Error assigning services:', error);
    res.status(500).json({ error: 'Failed to assign services' });
  }
});

// GET /api/admin/appointments - Vrati sve rezervacije
router.get('/appointments', async (req: AuthRequest, res) => {
  try {
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
          'id', st.id,
          'name', u_stylist.name,
          'email', u_stylist.email,
          'rating', st.rating
        ) as stylist,
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

// DELETE /api/admin/appointments/:id - Obriši rezervaciju (samo admin)
router.delete('/appointments/:id', async (req: AuthRequest, res) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const appointmentId = parseInt(idParam, 10);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }
    
    // Proveri da li rezervacija postoji
    const existingResult = await query(
      'SELECT id FROM "Appointment" WHERE id = $1',
      [appointmentId]
    );
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Obriši rezervaciju
    await query('DELETE FROM "Appointment" WHERE id = $1', [appointmentId]);
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// GET /api/admin/stats - Statistike
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    // Ukupan broj korisnika
    const usersCount = await query('SELECT COUNT(*) as count FROM "User"');
    
    // Ukupan broj frizera
    const stylistsCount = await query('SELECT COUNT(*) as count FROM "Stylist" WHERE "isActive" = true');
    
    // Ukupan broj rezervacija
    const appointmentsCount = await query('SELECT COUNT(*) as count FROM "Appointment"');
    
    // Rezervacije po statusu
    const appointmentsByStatus = await query(`
      SELECT status, COUNT(*) as count 
      FROM "Appointment" 
      GROUP BY status
    `);

    // Prihod + top usluge u jednoj RR transakciji (obični redovi, bez json_agg).
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');

    let revenueTotal = 0;
    let completedForRevenueCount = 0;
    let popularServices: Array<{ name: string; category: string; count: number; revenue: number }> = [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const sumRes = await client.query(`
        SELECT
          COALESCE(SUM(price), 0)::numeric AS revenue_total,
          COUNT(*)::int AS completed_count
        FROM "Appointment"
        WHERE status = 'COMPLETED'
      `);
      revenueTotal = parseFloat(String(sumRes.rows[0]?.revenue_total ?? 0));
      completedForRevenueCount = parseInt(String(sumRes.rows[0]?.completed_count ?? 0), 10);

      const popRes = await client.query(`
        SELECT
          s.name,
          s.category,
          COUNT(a.id)::int AS "appointmentCount",
          COALESCE(SUM(a.price), 0)::numeric AS "serviceRevenueSum"
        FROM "Appointment" a
        INNER JOIN "Service" s ON s.id = a."serviceId"
        WHERE a.status = 'COMPLETED'
        GROUP BY s.id, s.name, s.category
        ORDER BY COUNT(a.id) DESC
        LIMIT 5
      `);

      popularServices = popRes.rows.map((row) => ({
        name: String(row.name),
        category: String(row.category),
        count: parseInt(String(row.appointmentCount ?? 0), 10),
        revenue: parseFloat(String(row.serviceRevenueSum ?? 0)),
      }));

      const maxPopularCount = popularServices.reduce((m, s) => Math.max(m, s.count), 0);
      const maxPopularRev = popularServices.reduce((m, s) => Math.max(m, s.revenue), 0);
      if (
        maxPopularCount > completedForRevenueCount ||
        maxPopularRev > revenueTotal + 0.01
      ) {
        console.error('Stats invariant broken (RR row-based)', {
          completedForRevenueCount,
          revenueTotal,
          popularServices,
        });
      }

      await client.query('COMMIT');
    } catch (e) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore */
      }
      throw e;
    } finally {
      client.release();
    }

    res.json({
      users: {
        total: parseInt(usersCount.rows[0].count)
      },
      stylists: {
        active: parseInt(stylistsCount.rows[0].count)
      },
      appointments: {
        total: parseInt(appointmentsCount.rows[0].count),
        byStatus: appointmentsByStatus.rows
      },
      revenue: {
        total: revenueTotal,
        completedAppointmentsForRevenue: completedForRevenueCount,
      },
      popularServices,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;

