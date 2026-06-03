import { createServiceClient } from "@/lib/supabase/service";
import { SettingsForm } from "@/components/admin/SettingsForm";
import type { Settings } from "@/lib/db";

export const metadata = { title: "Settings — WC26 Admin" };

export default async function SettingsPage() {
  const service = createServiceClient();
  const { data: settings } = await service.from("settings").select("*").single();

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="text-lg font-bold text-gold mb-1">Settings</h1>
      <p className="text-sm text-paper/50 mb-5">
        All timestamps must be in UTC (e.g.{" "}
        <code className="text-paper/70">2026-06-11T19:00:00Z</code>).
      </p>
      <SettingsForm settings={settings as Settings} />
    </main>
  );
}
