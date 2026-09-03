import { brazilTodayYmd } from "@/lib/datetime-br";
import { roundMoney } from "@/lib/cashback";

type DailyProfitTx = {
  userDailyProfit: {
    upsert: (args: {
      where: { userId_date: { userId: string; date: string } };
      create: { userId: string; date: string; amount: number };
      update: { amount: { increment: number } };
    }) => Promise<unknown>;
  };
};

export async function incrementUserDailyProfit(
  tx: DailyProfitTx,
  userId: string,
  amount: number,
  at: Date = new Date(),
): Promise<void> {
  const value = roundMoney(amount);
  if (!(value > 0)) return;
  const date = brazilTodayYmd(at);
  await tx.userDailyProfit.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, amount: value },
    update: { amount: { increment: value } },
  });
}
