-- Dodaj kolonu avatarUrl u User tabelu
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "avatarUrl" VARCHAR(500);

