import { computeProductYield } from "@/lib/product-yield";

export function parseFloatSafe(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function parseBoolFlag(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return fallback;
}

export function parseCycleDays(v: unknown): number {
  if (typeof v === "number" && Number.isInteger(v) && v > 0) return v;
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

export type ProductWriteFields = {
  name: string;
  price: number | null;
  returnPercent: number | null;
  dailyYield: number | null;
  totalReturn: number | null;
  cycleDays: number;
  isActive: boolean;
  featured: boolean;
  purchaseLocked: boolean;
};

export function parseProductWriteBody(
  b: Record<string, unknown>,
  defaults?: { isActive?: boolean; featured?: boolean; purchaseLocked?: boolean },
): ProductWriteFields {
  const name = typeof b.name === "string" ? b.name.trim() : "";
  return {
    name,
    price: parseFloatSafe(b.price),
    returnPercent: parseFloatSafe(b.returnPercent),
    dailyYield: parseFloatSafe(b.dailyYield),
    totalReturn: parseFloatSafe(b.totalReturn),
    cycleDays: parseCycleDays(b.cycleDays),
    isActive: parseBoolFlag(b.isActive, defaults?.isActive ?? true),
    featured: parseBoolFlag(b.featured, defaults?.featured ?? false),
    purchaseLocked: parseBoolFlag(b.purchaseLocked, defaults?.purchaseLocked ?? false),
  };
}

export function parseProductWriteFormData(
  fd: FormData,
  defaults?: { isActive?: boolean; featured?: boolean; purchaseLocked?: boolean },
): ProductWriteFields {
  const body: Record<string, unknown> = {};
  for (const key of [
    "name",
    "price",
    "returnPercent",
    "dailyYield",
    "totalReturn",
    "cycleDays",
    "isActive",
    "featured",
    "purchaseLocked",
  ]) {
    if (fd.has(key)) body[key] = fd.get(key);
  }
  return parseProductWriteBody(body, defaults);
}

export function resolveProductYield(fields: ProductWriteFields) {
  if (fields.price !== null && fields.returnPercent !== null && fields.cycleDays >= 1) {
    const y = computeProductYield(fields.price, fields.returnPercent, fields.cycleDays);
    return {
      ...fields,
      dailyYield: y.dailyYield,
      totalReturn: y.totalReturn,
      returnPercent: y.returnPercent,
    };
  }
  return fields;
}
