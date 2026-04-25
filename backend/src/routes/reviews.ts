// Reviews routes - API endpoint-i za ocenjivanje frizera

import express from 'express';
import { query } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// POST /api/reviews - Kreiraj review (samo ulogovani korisnici, samo za svoje COMPLETED rezervacije)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    const customerId = req.user!.userId;
    
    // Validacija
    if (!appointmentId || !rating) {
      return res.status(400).json({ 
        error: 'Missing required fields: appointmentId, rating' 
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    // Proveri da li rezervacija postoji, da li je COMPLETED i da li pripada korisniku
    const appointmentResult = await query(`
      SELECT a.id, a."customerId", a."stylistId", a.status
      FROM "Appointment" a
      WHERE a.id = $1
    `, [appointmentId]);
    
    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    const appointment = appointmentResult.rows[0];
    
    console.log(`[REVIEW] Appointment found:`, {
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      stylistId: appointment.stylistId,
      status: appointment.status,
      requestedCustomerId: customerId
    });
    
    // Proveri da li rezervacija pripada ulogovanom korisniku
    if (appointment.customerId !== customerId) {
      return res.status(403).json({ error: 'You can only review your own appointments' });
    }
    
    // Proveri da li je rezervacija COMPLETED
    if (appointment.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'You can only review completed appointments' });
    }
    
    // Proveri da li već postoji review za ovu rezervaciju
    const existingReview = await query(
      'SELECT id FROM "Review" WHERE "appointmentId" = $1',
      [appointmentId]
    );
    
    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'Review already exists for this appointment' });
    }
    
    const stylistId = appointment.stylistId;
    
    if (!stylistId) {
      console.error(`[REVIEW] ERROR: stylistId is null for appointment ${appointmentId}`);
      return res.status(500).json({ error: 'Stylist ID not found in appointment' });
    }
    
    console.log(`[REVIEW] Creating review for stylistId: ${stylistId}, rating: ${rating}`);
    
    // Kreiraj review
    const reviewResult = await query(`
      INSERT INTO "Review" ("appointmentId", "customerId", "stylistId", rating, comment, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, rating, comment, "createdAt"
    `, [appointmentId, customerId, stylistId, rating, comment || null]);
    
    // Ažuriraj ocenu frizera
    // Izračunaj novu prosečnu ocenu
    // PostgreSQL vraća kolone sa malim slovima, pa koristimo lowercase nazive
    const reviewsResult = await query(`
      SELECT AVG(rating) as avgrating, COUNT(*) as totalreviews
      FROM "Review"
      WHERE "stylistId" = $1
    `, [stylistId]);
    
    const row = reviewsResult.rows[0];
    const avgRatingRaw = row.avgrating;
    const avgRating = avgRatingRaw ? parseFloat(avgRatingRaw) : 0;
    const totalReviews = parseInt(row.totalreviews || '0');
    
    console.log(`[REVIEW] Raw avgRating from DB:`, avgRatingRaw, `(type: ${typeof avgRatingRaw})`);
    console.log(`[REVIEW] Parsed avgRating:`, avgRating);
    console.log(`[REVIEW] Updating stylist ${stylistId} with rating: ${avgRating.toFixed(2)}, totalReviews: ${totalReviews}`);
    
    // Formatiraj ocenu za DECIMAL(3,2) - maksimalno 9.99
    const ratingValue = Math.min(9.99, Math.max(0, avgRating));
    const ratingString = ratingValue.toFixed(2);
    
    console.log(`[REVIEW] Formatted rating for DB: ${ratingString}`);
    
    // Ažuriraj Stylist tabelu - koristi NUMERIC cast za DECIMAL
    const updateResult = await query(`
      UPDATE "Stylist"
      SET rating = $1::NUMERIC(3,2), "totalReviews" = $2, "updatedAt" = NOW()
      WHERE id = $3
      RETURNING id, rating, "totalReviews"
    `, [ratingString, totalReviews, stylistId]);
    
    const updatedStylist = updateResult.rows[0];
    console.log(`[REVIEW] Updated stylist:`, updatedStylist);
    
    if (updateResult.rows.length === 0) {
      console.error(`[REVIEW] ERROR: Failed to update stylist ${stylistId} - no rows returned`);
    } else {
      // Proveri da li je ocena pravilno ažurirana
      const dbRating = updatedStylist.rating;
      const dbTotalReviews = updatedStylist.totalReviews;
      console.log(`[REVIEW] Verification - Stylist ${stylistId}: rating=${dbRating} (type: ${typeof dbRating}), totalReviews=${dbTotalReviews}`);
      
      if (dbRating === null || dbRating === undefined || parseFloat(dbRating) === 0) {
        console.error(`[REVIEW] ERROR: Rating is still 0/null after update! Expected: ${avgRating.toFixed(2)}`);
      }
    }
    
    res.status(201).json({
      review: reviewResult.rows[0],
      message: 'Review created successfully'
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// GET /api/reviews/stylist/:id - Vrati sve review-e za frizera
router.get('/stylist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stylistId = parseInt(id);
    
    console.log(`[REVIEWS] Fetching reviews for stylistId: ${stylistId}`);
    
    const result = await query(`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r."createdAt",
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as customer,
        json_build_object(
          'id', a.id,
          'date', a.date,
          'service', s.name
        ) as appointment
      FROM "Review" r
      JOIN "User" u ON r."customerId" = u.id
      JOIN "Appointment" a ON r."appointmentId" = a.id
      JOIN "Service" s ON a."serviceId" = s.id
      WHERE r."stylistId" = $1
      ORDER BY r."createdAt" DESC
    `, [stylistId]);
    
    console.log(`[REVIEWS] Found ${result.rows.length} reviews for stylistId ${stylistId}`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/appointment/:id - Proveri da li rezervacija ima review
router.get('/appointment/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    // Proveri da li rezervacija pripada korisniku
    const appointmentResult = await query(
      'SELECT "customerId" FROM "Appointment" WHERE id = $1',
      [id]
    );
    
    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (appointmentResult.rows[0].customerId !== userId) {
      return res.status(403).json({ error: 'You can only view reviews for your own appointments' });
    }
    
    const reviewResult = await query(
      'SELECT id, rating, comment, "createdAt" FROM "Review" WHERE "appointmentId" = $1',
      [id]
    );
    
    if (reviewResult.rows.length === 0) {
      return res.json({ hasReview: false });
    }
    
    res.json({ hasReview: true, review: reviewResult.rows[0] });
  } catch (error) {
    console.error('Error checking review:', error);
    res.status(500).json({ error: 'Failed to check review' });
  }
});

export default router;

