import type { Metadata, Viewport } from "next";
import { hanken, saira, sairaCondensed } from "./fonts";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { NavWrapper } from "@/components/nav/NavWrapper";
import { ThemeManager } from "@/components/ui/ThemeManager";
import { BrandProvider, type DraftPickInfo, type BrandPhase } from "./brand-provider";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentPhase } from "@/lib/phase";
import type { Settings } from "@/lib/db";
import { TEAM_COLORS, DEFAULT_PRIMARY, DEFAULT_SECONDARY } from "@/lib/team-colors";
import { isAdmin } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "WC26 Pool",
  description: "Fantasy World Cup 2026 prediction pool",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WC26 Pool",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A3D91",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let brandPhase: BrandPhase = "group";
  let profileId: string | null = null;
  let picks: DraftPickInfo[] = [];
  let adminUser = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const service = createServiceClient();

      const [{ data: settings }, { data: profile }, { data: drafts }] =
        await Promise.all([
          service.from("settings").select("*").single(),
          service
            .from("profiles")
            .select("id")
            .eq("auth_id", user.id)
            .maybeSingle(),
          // fifa_code drives color lookup (TEAM_COLORS static map).
          // custom_icon_url is the uploaded team crest used as the light-mode logo backdrop.
          service
            .from("drafts")
            .select("profile_id, pick_number, teams(fifa_code, custom_icon_url)")
            .order("pick_number"),
        ]);

      profileId = profile?.id ?? null;
      adminUser = isAdmin(user.email ?? "");

      const appPhase = settings
        ? getCurrentPhase(settings as Settings)
        : "groups";
      brandPhase =
        appPhase === "knockout"
          ? "knockout"
          : appPhase === "draft_standby"
          ? "predraft"
          : "group";

      picks = (drafts ?? []).map((d: Record<string, unknown>) => {
        const t = Array.isArray(d.teams) ? d.teams[0] : d.teams;
        const row = t as { fifa_code?: string; custom_icon_url?: string | null } | null;
        const code = row?.fifa_code ?? "";
        const logoUrl = row?.custom_icon_url ?? null;
        const [primaryHex, secondaryHex] = TEAM_COLORS[code] ?? [DEFAULT_PRIMARY, DEFAULT_SECONDARY];
        return {
          profileId: d.profile_id as string,
          pickNumber: d.pick_number as number,
          primaryHex,
          secondaryHex,
          code,
          logoUrl,
        };
      });
    }
  } catch {
    // Unauthenticated routes (login, auth callback) fall through with default brand.
  }

  return (
    <html
      lang="en"
      data-base="light"
      className={`h-full ${hanken.variable} ${saira.variable} ${sairaCondensed.variable}`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <ServiceWorkerRegistrar />
        <ThemeManager />
        <BrandProvider phase={brandPhase} profileId={profileId} picks={picks} isAdmin={adminUser}>
          {children}
          <NavWrapper />
        </BrandProvider>
      </body>
    </html>
  );
}
