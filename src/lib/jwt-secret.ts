const raw = process.env.JWT_SECRET?.trim() ?? "";

if (!raw) {
  throw new Error("JWT_SECRET não definido. Configure no .env antes de iniciar.");
}

export const JWT_SECRET = new TextEncoder().encode(raw);
