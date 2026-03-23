const BR_TIME_ZONE = "America/Sao_Paulo";

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDateBr(value: Date | string | number): string {
  return toDate(value).toLocaleDateString("pt-BR", {
    timeZone: BR_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTimeBr(value: Date | string | number): string {
  return toDate(value).toLocaleString("pt-BR", {
    timeZone: BR_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

