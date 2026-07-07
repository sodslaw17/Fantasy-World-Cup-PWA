import { createServiceClient } from "@/lib/supabase/service";
import { UserTable } from "@/components/admin/UserTable";
import { AdminPageHeader } from "../_components/AdminShell";
import type { Profile } from "@/lib/db";

export const metadata = { title: "Users — WC26 Admin" };

export default async function UsersPage() {
  const service = createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .select("*")
    .order("created_at");

  const profiles: Profile[] = data ?? [];

  return (
    <div className="max-w-3xl mx-auto">
      <AdminPageHeader
        title="Players"
        sub={`${profiles.length} / 10 players in the pool`}
      />
      <div className="px-4 pb-8">
        {error && (
          <p className="text-sm text-accent-red mb-4">{error.message}</p>
        )}
        <UserTable profiles={profiles} />
      </div>
    </div>
  );
}
