export type Order = {
  id: string;
  code: string;
  price: number;
  daily: number;
  total: number;
  validade: string;
  image: "n004" | "n005";
};

export type Account = {
  balance: number;
  profit: number;
  invested: number;
  orders: Order[];
  lastCheckin: string | null;
};

const key = (phone: string) => `3rdcap_account_${phone}`;

const initial: Account = {
  balance: 144.35,
  profit: 122,
  invested: 600,
  lastCheckin: null,
  orders: [
    { id: "1", code: "N004", price: 100, daily: 10, total: 300, validade: "08/08/2026 15:07", image: "n004" },
    { id: "2", code: "N005", price: 300, daily: 36, total: 1080, validade: "09/08/2026 12:46", image: "n005" },
  ],
};

export function loadAccount(phone: string): Account {
  try {
    const raw = localStorage.getItem(key(phone));
    if (raw) return { ...initial, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return initial;
}

export function saveAccount(phone: string, acc: Account) {
  localStorage.setItem(key(phone), JSON.stringify(acc));
}

export const brl = (v: number) =>
  `R$${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
