import express from 'express';
import { query } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

const WORK_START_HOUR = 8;  // 08:00
const WORK_END_HOUR = 16;   // 16:00 (kraj radnog vremena, poslednji slot 15:30)

function timeToMinutes(time: string): number | null {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function normalizeTimeString(time: string): string {
  // DB ponekad vraća TIME kao "09:00:00" — za UI poruke hoćemo "09:00"
  const parts = time.split(':');
  if (parts.length < 2) return time;
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

/** Sve što pg driver obično popuni — trigger poruke često stoje u `detail`, ne u `message`. */
function pgErrorFingerprint(err: any): string {
  return [
    err?.message,
    err?.detail,
    err?.hint,
    err?.where,
    err?.internal,
    err?.routine,
    err?.schema,
    err?.table,
    err?.constraint,
    err?.code,
  ]
    .filter((x) => x !== undefined && x !== null && String(x).length > 0)
    .map((x) => String(x))
    .join(' | ');
}

const CUSTOMER_DAILY_BOOKING_MSG =
  'Već ste rezervisali termin danas. Možete imati samo jednu rezervaciju po danu.';

// GET /api/appointments - Rezervacije (ADMIN: sve; CUSTOMER/STYLIST: samo svoje kao klijent)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const role = req.user!.role;
    const userId = req.user!.userId;

    const customerFilter =
      role === 'ADMIN'
        ? ''
        : 'WHERE a."customerId" = $1';
    const params = role === 'ADMIN' ? [] : [userId];

    // JOIN-ujemo tabele da dobijemo sve informacije
    const result = await query(
      `
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
          'rating', COALESCE(st.rating::text, '0'),
          'totalReviews', COALESCE(st."totalReviews", 0)
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
      ${customerFilter}
      ORDER BY a.date DESC, a.time DESC
    `,
      params
    );
    
    // Debug: proveri ocene frizera
    result.rows.forEach((row: any) => {
      if (row.stylist) {
        const ratingValue = row.stylist.rating;
        const ratingType = typeof ratingValue;
        console.log(`[APPOINTMENTS] Stylist ${row.stylist.name}: rating=${ratingValue} (type: ${ratingType}), totalReviews=${row.stylist.totalReviews}`);
        
        // Proveri da li je ocena pravilno parsirana
        if (ratingValue === null || ratingValue === undefined || ratingValue === '0' || ratingValue === 0) {
          console.warn(`[APPOINTMENTS] WARNING: Rating is 0/null for ${row.stylist.name} - checking database...`);
        }
      }
    });
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/appointments/available/:stylistId - Vrati dostupna vremena za frizera na određeni datum
// MORAJU BITI PRE /:id rute da ne bi bila pogrešno usmerena!
router.get('/available/:stylistId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { stylistId } = req.params;
    const { date } = req.query;
    
    console.log(`[AVAILABLE TIMES] Request: stylistId=${stylistId}, date=${date}`);
    
    if (!date || typeof date !== 'string') {
      console.error('[AVAILABLE TIMES] Missing or invalid date parameter');
      return res.status(400).json({ error: 'Date parameter is required' });
    }
    
    if (!stylistId || isNaN(Number(stylistId))) {
      console.error('[AVAILABLE TIMES] Invalid stylistId:', stylistId);
      return res.status(400).json({ error: 'Invalid stylistId parameter' });
    }
    
    // Proveri da li je datum radni dan
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log(`[AVAILABLE TIMES] Weekend date selected: ${date}, dayOfWeek=${dayOfWeek}`);
      return res.status(400).json({ error: 'Date must be a weekday (Monday-Friday)' });
    }
    
    // Uzmi sve rezervacije za tog frizera na taj datum (koje nisu otkazane)
    const appointmentsResult = await query(`
      SELECT a.time, s.duration
      FROM "Appointment" a
      JOIN "Service" s ON a."serviceId" = s.id
      WHERE a."stylistId" = $1 
        AND a.date = $2 
        AND a.status != 'CANCELLED'
      ORDER BY a.time
    `, [stylistId, date]);
    
    // Generiši sva vremena od 08:00 do 16:00 (svakih 30 minuta)
    const allTimeSlots: string[] = [];
    for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour++) {
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    // Izračunaj zauzeta vremena
    const bookedTimes = new Set<string>();
    
    for (const appointment of appointmentsResult.rows) {
      const [appHours, appMinutes] = appointment.time.split(':').map(Number);
      const appointmentStart = appHours * 60 + appMinutes;
      const appointmentDuration = parseInt(appointment.duration);
      const appointmentEnd = appointmentStart + appointmentDuration;
      
      // Dodaj sva vremena koja su zauzeta (po 30 minuta)
      for (let minutes = appointmentStart; minutes < appointmentEnd; minutes += 30) {
        const slotHour = Math.floor(minutes / 60);
        const slotMin = minutes % 60;
        const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMin.toString().padStart(2, '0')}`;
        bookedTimes.add(slotTime);
      }
    }
    
    // Vrati dostupna vremena
    const now = new Date();
    const isToday = isSameLocalDay(now, selectedDate);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Ako je izabran današnji dan, ukloni slotove koji su već prošli
    const availableTimes = allTimeSlots.filter((t) => {
      if (bookedTimes.has(t)) return false;
      if (!isToday) return true;
      const tMinutes = timeToMinutes(t);
      return tMinutes !== null && tMinutes > nowMinutes;
    });
    
    console.log(`[AVAILABLE TIMES] Success: ${availableTimes.length} available, ${bookedTimes.size} booked`);
    res.json({ availableTimes, bookedTimes: Array.from(bookedTimes) });
  } catch (error: any) {
    console.error('[AVAILABLE TIMES] Error fetching available times:', error);
    console.error('[AVAILABLE TIMES] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch available times',
      details: error.message 
    });
  }
});

// GET /api/appointments/:id - Vrati jednu rezervaciju (samo ulogovan; klijent, frizer tog termina ili admin)
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const result = await query(
      `
      SELECT 
        a.id,
        a.date,
        a.time,
        a.status,
        a.price,
        a.notes,
        a."createdAt",
        a."updatedAt",
        a."customerId" AS auth_cust_id,
        st."userId" AS auth_stylist_user_id,
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
          'rating', COALESCE(st.rating::text, '0'),
          'totalReviews', COALESCE(st."totalReviews", 0)
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
      WHERE a.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const row: Record<string, unknown> = { ...result.rows[0] };
    const custId = Number(row.auth_cust_id);
    const stylistUserId = Number(row.auth_stylist_user_id);

    const allowed =
      role === 'ADMIN' ||
      custId === userId ||
      stylistUserId === userId;

    if (!allowed) {
      return res.status(403).json({ error: 'Nemate pristup ovoj rezervaciji' });
    }

    delete row.auth_cust_id;
    delete row.auth_stylist_user_id;
    res.json(row);
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
    
    // Validacija: Proveri da li je datum radni dan (ponedeljak-petak)
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0 = nedelja, 1 = ponedeljak, ..., 6 = subota
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ 
        error: 'Rezervacije su moguće samo radnim danima (ponedeljak-petak)' 
      });
    }
    
    // Validacija: Proveri da li je vreme između 08:00 i 16:00
    const timeMinutes = timeToMinutes(time);
    if (timeMinutes === null) {
      return res.status(400).json({ error: 'Invalid time format' });
    }
    const [hours, minutes] = time.split(':').map(Number);
    if (hours < WORK_START_HOUR || hours >= WORK_END_HOUR) {
      return res.status(400).json({ 
        error: 'Rezervacije su moguće samo od 08:00 do 16:00' 
      });
    }

    // Validacija: Ne dozvoli rezervacije u prošlosti (uključujući današnje vreme koje je prošlo)
    const now = new Date();
    const isToday = isSameLocalDay(now, selectedDate);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (selectedDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      return res.status(400).json({ error: 'Ne možete rezervisati termin u prošlosti' });
    }
    if (isToday && timeMinutes <= nowMinutes) {
      return res.status(400).json({ error: 'Ne možete rezervisati termin u prošlosti' });
    }
    
    // Proveri da li usluga postoji i uzmi cenu i trajanje
    const serviceResult = await query(
      'SELECT price, duration FROM "Service" WHERE id = $1 AND "isActive" = true',
      [serviceId]
    );
    
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found or inactive' });
    }
    
    const price = serviceResult.rows[0].price;
    const duration = serviceResult.rows[0].duration; // u minutima

    const durationMinutes = Number(duration);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return res.status(400).json({ error: 'Invalid service duration' });
    }

    // Jedna aktivna rezervacija po klijentu po danu (bilo koji frizer / bilo koje vreme)
    const sameDayBooking = await query(
      `
        SELECT id
        FROM "Appointment"
        WHERE "customerId" = $1
          AND date = $2
          AND status != 'CANCELLED'
        LIMIT 1
      `,
      [customerId, date]
    );
    if (sameDayBooking.rows.length > 0) {
      return res.status(400).json({
        error: CUSTOMER_DAILY_BOOKING_MSG,
      });
    }
    
    // Proveri da li frizer postoji i da li je aktivan
    const stylistResult = await query(
      'SELECT id FROM "Stylist" WHERE id = $1 AND "isActive" = true',
      [stylistId]
    );
    
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stylist not found or inactive' });
    }

    // (Napomena) Specijalna provera za isti start termin više nije potrebna,
    // jer overlap provera iznad pokriva i taj slučaj.
    
    // Proveri da li je termin zauzet za tog frizera
    // Proveravamo da li postoji rezervacija koja se preklapa sa novim terminom
    // Preklapanje se dešava ako nova rezervacija počinje pre nego što se završi postojeća ili obrnuto
    const existingAppointment = await query(`
      SELECT id, date, time, status, 
        (SELECT duration FROM "Service" WHERE id = a."serviceId") as duration
      FROM "Appointment" a
      WHERE a."stylistId" = $1 
        AND a.date = $2 
        AND a.status != 'CANCELLED'
    `, [stylistId, date]);
    
    // Proveri preklapanje sa svakom postojećom rezervacijom
    for (const existing of existingAppointment.rows) {
      const [existingHours, existingMinutes] = existing.time.split(':').map(Number);
      const existingStart = existingHours * 60 + existingMinutes;
      const existingDuration = parseInt(existing.duration);
      const existingEnd = existingStart + existingDuration;
      
      const newStart = hours * 60 + minutes;
      const newEnd = newStart + duration;
      
      // Preklapanje: nova rezervacija počinje pre završetka postojeće I završava se posle početka postojeće
      if ((newStart < existingEnd && newEnd > existingStart)) {
        return res.status(400).json({ 
          error: `Termin je već zauzet. Frizer ima rezervaciju od ${normalizeTimeString(existing.time)} do ${minutesToTime(existingEnd)}` 
        });
      }
    }

    // Validacija: usluga mora da se završi najkasnije do 16:00
    const newStart = hours * 60 + minutes;
    const newEnd = newStart + durationMinutes;
    if (newEnd > WORK_END_HOUR * 60) {
      return res.status(400).json({
        error: 'Usluga se ne može završiti u okviru radnog vremena (08:00–16:00)',
      });
    }
    
    // Kreiraj rezervaciju (customerId je već proveren kroz authenticate middleware)
    const result = await query(`
      INSERT INTO "Appointment" 
        ("customerId", "stylistId", "serviceId", date, time, status, price, notes, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7, NOW(), NOW())
      RETURNING *
    `, [customerId, stylistId, serviceId, date, time, price, notes || null]);
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    const fp = pgErrorFingerprint(error);
    console.error('Error creating appointment:', {
      message: error?.message,
      code: error?.code,
      constraint: error?.constraint,
      detail: error?.detail,
      where: error?.where,
      fingerprint: fp,
    });

    // Trigger / DB poruke (traži u celom fingerprint-u)
    if (fp.includes('CUSTOMER_DAILY_LIMIT') || fp.includes('CUSTOMER_OVERLAP')) {
      return res.status(400).json({ error: CUSTOMER_DAILY_BOOKING_MSG });
    }
    if (fp.includes('STYLIST_OVERLAP')) {
      return res.status(400).json({
        error: 'Termin je već zauzet. Izaberite drugo vreme.',
      });
    }

    if (error.code === 'P0001') {
      return res.status(400).json({
        error: 'Nije moguće kreirati rezervaciju. Izaberite drugo vreme.',
      });
    }
    // Ako je greška zbog unique constraint (ako postoji), vrati prilagođenu poruku
    if (error.code === '23505') {
      // Ako je u pitanju naš unique index za klijenta (customerId+date+time), vrati jasnu poruku
      // (u nekim slučajevima pg ne popuni `constraint`, pa proveravamo i tekst greške)
      const isCustomerSlotConflict =
        error.constraint === 'uq_appointment_customer_date_time_active' ||
        fp.includes('uq_appointment_customer_date_time_active') ||
        fp.includes('Key ("customerId", date, time)');

      if (isCustomerSlotConflict) {
        return res.status(400).json({
          error: CUSTOMER_DAILY_BOOKING_MSG,
        });
      }
      return res.status(400).json({ error: 'Termin je već zauzet' });
    }
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// PUT /api/appointments/:id - Ažuriraj rezervaciju (samo ulogovani korisnici)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { date, time, status, notes } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    
    // Proveri da li rezervacija postoji
    const existingResult = await query(
      'SELECT * FROM "Appointment" WHERE id = $1',
      [id]
    );
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    const appointment = existingResult.rows[0];
    
    // Ako korisnik nije ADMIN, proveri da li je vlasnik rezervacije (customer)
    // Korisnik može da otkaže samo svoje rezervacije (status = CANCELLED)
    if (userRole !== 'ADMIN') {
      if (appointment.customerId !== userId) {
        return res.status(403).json({ 
          error: 'Možete otkazati samo svoje rezervacije' 
        });
      }
      
      // Klijenti mogu da promene samo status na CANCELLED, ne mogu da menjaju datum/vreme
      if (status && status !== 'CANCELLED') {
        return res.status(403).json({ 
          error: 'Možete otkazati rezervaciju, ali ne možete promeniti status na drugi' 
        });
      }
      
      // Klijenti ne mogu da menjaju datum i vreme
      if (date !== undefined || time !== undefined) {
        return res.status(403).json({ 
          error: 'Ne možete menjati datum i vreme rezervacije. Otkažite i napravite novu.' 
        });
      }
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

