import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SupportClient } from "./SupportClient";

export default async function SupportPage() {
  const session = await getSession();
  if (!session || session.role !== "user") redirect("/login");
  return <SupportClient supportLink="" />;
}
