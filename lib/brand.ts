import { computeBrand, GROUP_ACCENTS, type Base, type BrandVars } from "@/lib/theme";

export type BrandPhase = "group" | "predraft" | "knockout";

export interface DraftPickInfo {
  profileId: string;
  pickNumber: number;
  primaryHex: string;
  secondaryHex: string;
  code?: string;            // FIFA team code, present when populated from TEAM_COLORS lookup
  logoUrl?: string | null;  // custom_icon_url from teams table (for light-mode logo backdrop)
}

export function resolveBrandVars({
  phase,
  profileId,
  picks,
  base,
  groupAccent = "blue",
}: {
  phase: BrandPhase;
  profileId: string | null;
  picks: DraftPickInfo[];
  base: Base;
  groupAccent?: keyof typeof GROUP_ACCENTS;
}): BrandVars {
  const firstPick =
    phase === "knockout" && profileId
      ? picks
          .filter((p) => p.profileId === profileId)
          .sort((a, b) => a.pickNumber - b.pickNumber)[0]
      : undefined;

  return firstPick
    ? computeBrand(firstPick.primaryHex, firstPick.secondaryHex, base)
    : computeBrand(...GROUP_ACCENTS[groupAccent], base);
}
