import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/platform-settings";
import { SupportClient } from "./SupportClient";

export default async function SupportPage() {
  const session = await getSession();
  if (!session || session.role !== "user") redirect("/login");
  const settings = await getPlatformSettings();
  return <SupportClient supportLink={settings.supportLink} />;
}
