-- Kreiranje tabela za HairStudio bazu
-- Pokreni ovaj fajl prvo, pre seed-data.sql

-- 1. Kreiraj enume
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'STYLIST', 'ADMIN');
CREATE TYPE "ServiceCategory" AS ENUM ('MENS_HAIRCUT', 'BEARD', 'WOMENS_HAIRCUT', 'COLORING', 'CARE');
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- 2. Kreiraj tabelu User
CREATE TABLE "User" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Kreiraj tabelu Stylist
CREATE TABLE "Stylist" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    rating DECIMAL(3,2) DEFAULT 0.0,
    "totalReviews" INTEGER DEFAULT 0,
    bio TEXT,
    "yearsOfExperience" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Kreiraj tabelu Service
CREATE TABLE "Service" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- u minutima
    price DECIMAL(10,2) NOT NULL,
    category "ServiceCategory" NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. Kreiraj tabelu ServiceStylist (many-to-many veza)
CREATE TABLE "ServiceStylist" (
    id SERIAL PRIMARY KEY,
    "stylistId" INTEGER NOT NULL REFERENCES "Stylist"(id) ON DELETE CASCADE,
    "serviceId" INTEGER NOT NULL REFERENCES "Service"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE("stylistId", "serviceId")
);

-- 6. Kreiraj tabelu Appointment
CREATE TABLE "Appointment" (
    id SERIAL PRIMARY KEY,
    "customerId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "stylistId" INTEGER NOT NULL REFERENCES "Stylist"(id) ON DELETE CASCADE,
    "serviceId" INTEGER NOT NULL REFERENCES "Service"(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 7. Kreiraj tabelu Review
CREATE TABLE "Review" (
    id SERIAL PRIMARY KEY,
    "appointmentId" INTEGER UNIQUE NOT NULL REFERENCES "Appointment"(id) ON DELETE CASCADE,
    "customerId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "stylistId" INTEGER NOT NULL REFERENCES "Stylist"(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 8. Kreiraj indekse za brže pretrage
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_stylist_user_id ON "Stylist"("userId");
CREATE INDEX idx_service_category ON "Service"(category);
CREATE INDEX idx_appointment_date ON "Appointment"(date);
CREATE INDEX idx_appointment_customer ON "Appointment"("customerId");
CREATE INDEX idx_appointment_stylist ON "Appointment"("stylistId");

-- Klijent ne može imati 2 rezervacije u isto vreme (osim ako je prethodna otkazana)
CREATE UNIQUE INDEX uq_appointment_customer_date_time_active
  ON "Appointment" ("customerId", date, time)
  WHERE status != 'CANCELLED';
CREATE INDEX idx_review_stylist ON "Review"("stylistId");

