import { redirect } from "next/navigation";

export default function WithdrawHistoryPage() {
  redirect("/history?tab=withdrawals");
}

