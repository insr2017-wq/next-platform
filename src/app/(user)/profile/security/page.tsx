import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SecurityClient } from "./SecurityClient";

export default async function ProfileSecurityPage() {
  const session = await getSession();
  if (!session || session.role !== "user") {
    redirect("/login");
  }

  return <SecurityClient />;
}
