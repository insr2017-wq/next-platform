import { redirect } from "next/navigation";

export default function DepositHistoryPage() {
  redirect("/history?tab=deposits");
}

