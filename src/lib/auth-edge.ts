/**
 * Edge-safe auth helpers for middleware (no Prisma, no bcrypt).
 */
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

export type SessionPayload = {
  userId: string;
  role: "user" | "admin";
  phone: string;
  exp: number;
};

export async function verifyTokenEdge(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
