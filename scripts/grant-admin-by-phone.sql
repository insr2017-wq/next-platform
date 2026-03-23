-- PostgreSQL: grant admin to EXISTING user(s) with this phone (BR with or without DDI).
-- Run in Supabase SQL Editor or psql after selecting the right database.
-- Table name is "User" (Prisma default).

UPDATE "User"
SET role = 'admin', "updatedAt" = NOW()
WHERE phone IN ('89981478520', '5589981478520');

-- Verify:
-- SELECT id, phone, role FROM "User" WHERE phone IN ('89981478520', '5589981478520');
