-- DB-level zaštita: zabrani preklapanje termina
-- Pokreni jednom na postojećoj bazi (na portu 5434).

CREATE OR REPLACE FUNCTION prevent_appointment_overlaps()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_duration int;
  new_start time;
  new_end time;
BEGIN
  -- Ako je otkazano, ne blokiramo ništa
  IF NEW.status = 'CANCELLED' THEN
    RETURN NEW;
  END IF;

  SELECT duration INTO new_duration
  FROM "Service"
  WHERE id = NEW."serviceId";

  IF new_duration IS NULL OR new_duration <= 0 THEN
    RAISE EXCEPTION 'INVALID_DURATION';
  END IF;

  new_start := NEW.time;
  new_end := NEW.time + (new_duration * INTERVAL '1 minute');

  -- 1) Klijent: najviše jedna aktivna rezervacija po danu (bilo koji frizer / bilo koje vreme)
  IF EXISTS (
    SELECT 1
    FROM "Appointment" a
    WHERE a.id <> COALESCE(NEW.id, -1)
      AND a."customerId" = NEW."customerId"
      AND a.date = NEW.date
      AND a.status <> 'CANCELLED'
  ) THEN
    RAISE EXCEPTION 'CUSTOMER_DAILY_LIMIT';
  END IF;

  -- 2) (Opcionalno ali korisno) Frizer ne sme imati preklapanje u istom danu
  IF EXISTS (
    SELECT 1
    FROM "Appointment" a
    JOIN "Service" s ON s.id = a."serviceId"
    WHERE a.id <> COALESCE(NEW.id, -1)
      AND a."stylistId" = NEW."stylistId"
      AND a.date = NEW.date
      AND a.status <> 'CANCELLED'
      AND a.time < new_end
      AND (a.time + (s.duration * INTERVAL '1 minute')) > new_start
  ) THEN
    RAISE EXCEPTION 'STYLIST_OVERLAP';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_appointment_overlaps ON "Appointment";
CREATE TRIGGER trg_prevent_appointment_overlaps
BEFORE INSERT OR UPDATE OF date, time, "serviceId", "customerId", "stylistId", status
ON "Appointment"
FOR EACH ROW
EXECUTE FUNCTION prevent_appointment_overlaps();

