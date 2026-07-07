// ============================================================
// app/fonts.ts — next/font setup (self-hosted, zero layout shift)
// Apply the variables on <html> in app/layout.tsx, then the CSS
// var fallbacks in globals.css resolve to these families.
// ============================================================
import { Hanken_Grotesk, Saira, Saira_Condensed } from "next/font/google";

export const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});

export const saira = Saira({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-saira",
  display: "swap",
});

export const sairaCondensed = Saira_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-saira-condensed",
  display: "swap",
});
