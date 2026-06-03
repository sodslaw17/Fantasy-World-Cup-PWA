import { createServiceClient } from "@/lib/supabase/service";
import { UserTable } from "@/components/admin/UserTable";
import type { Profile } from "@/lib/db";

export const metadata = { title: "Players — WC26 Admin" };

export default async function UsersPage() {
  const service = createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .select("*")
    .order("created_at");

  const profiles: Profile[] = data ?? [];

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-gold mb-4">Players</h1>
      {error && (
        <p className="text-sm text-accent-red mb-4">{error.message}</p>
      )}
      <UserTable profiles={profiles} />
    </main>
  );
}
