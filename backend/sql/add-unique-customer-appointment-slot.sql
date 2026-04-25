-- Spreči da isti klijent rezerviše 2 termina u isto vreme (bez obzira na frizera)
-- Pokreni jednom na postojećoj bazi.
--
-- Napomena:
-- - Index važi za sve statuse osim CANCELLED, pa otkazani termini mogu ponovo da se rezervišu.
-- - Ako već imaš duplikate u bazi, ovaj index neće moći da se kreira dok ih ne ukloniš.

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_customer_date_time_active
  ON "Appointment" ("customerId", date, time)
  WHERE status != 'CANCELLED';

