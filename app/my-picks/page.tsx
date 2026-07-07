import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { DraftPrefsClient } from "@/components/draft/DraftPrefsClient";
import { FIFA_RANKING_ORDER } from "@/lib/fifa-ranking";
import type { WishlistTeam } from "@/components/draft/DraftPrefsScreen";

export const metadata = { title: "My Draft Picks — WC26 Pool" };

export default async function MyPicksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const { data: profile } = await service
    .from("profiles").select("id").eq("auth_id", user.id).maybeSingle();

  const [{ data: teams }, { data: prefs }] = await Promise.all([
    service.from("teams").select("fifa_code, name, group_letter").order("group_letter").order("name"),
    profile
      ? service.from("draft_preferences").select("*").eq("profile_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const teamByCode = Object.fromEntries((teams ?? []).map((t) => [t.fifa_code, t.name]));

  // Order teams by saved wishlist, then FIFA ranking, then alpha
  const savedWishlist: string[] = prefs?.team_wishlist ?? [];
  const fallback = FIFA_RANKING_ORDER.filter((c: string) => teamByCode[c]);
  const orderedCodes = [
    ...savedWishlist.filter((c: string) => teamByCode[c]),
    ...fallback.filter((c: string) => !savedWishlist.includes(c)),
    ...(teams ?? []).map((t) => t.fifa_code).filter((c: string) => !fallback.includes(c) && !savedWishlist.includes(c)),
  ];

  const wishlistTeams: WishlistTeam[] = orderedCodes.map((code) => ({
    code,
    name: teamByCode[code] ?? code,
  }));

  // Convert saved [3,1,7,...] → ["p3","p1","p7",...], filling any gaps with remaining positions
  const N = 10;
  const savedPosNums: number[] = prefs?.position_preferences ?? [];
  const allPos = Array.from({ length: N }, (_, i) => i + 1);
  const savedPositionOrder: string[] = [
    ...savedPosNums.filter((n) => n >= 1 && n <= N).map((n) => `p${n}`),
    ...allPos.filter((n) => !savedPosNums.includes(n)).map((n) => `p${n}`),
  ];

  return <DraftPrefsClient playerCount={N} teams={wishlistTeams} savedPositionOrder={savedPositionOrder} />;
}
