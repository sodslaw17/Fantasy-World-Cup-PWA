import { createServiceClient } from "@/lib/supabase/service";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { DemoDataControls } from "@/components/admin/DemoDataControls";
import { AdminPageHeader } from "../_components/AdminShell";
import { SectionCard } from "../_components/ListPatterns";
import type { Settings } from "@/lib/db";

export const metadata = { title: "Settings — WC26 Admin" };

export default async function SettingsPage() {
  const service = createServiceClient();
  const { data: settings } = await service.from("settings").select("*").single();

  return (
    <div className="max-w-2xl mx-auto">
      <AdminPageHeader
        title="Settings"
        sub="Phase timestamps, standby message, and demo data"
      />
      <div className="px-4 pb-8 space-y-8">
        {/* Phase / timing settings */}
        <SectionCard className="p-5">
          <p className="text-sm text-admin-muted mb-5">
            All timestamps must be in UTC (e.g.{" "}
            <code className="text-admin-ink bg-admin-soft px-1 rounded">
              2026-06-11T19:00:00Z
            </code>
            ).
          </p>
          <SettingsForm settings={settings as Settings} />
        </SectionCard>

        {/* Demo data */}
        <SectionCard className="p-5">
          <h2 className="text-base font-semibold text-admin-ink mb-1">Demo data</h2>
          <p className="text-sm text-admin-muted mb-4">
            Populate the app with 10 fake users and fully-seeded data so you can
            preview every phase before inviting real players.
          </p>
          <DemoDataControls />
        </SectionCard>
      </div>
    </div>
  );
}
