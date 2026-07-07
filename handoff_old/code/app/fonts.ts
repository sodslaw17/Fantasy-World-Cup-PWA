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

// ── app/layout.tsx ──────────────────────────────────────────
// import { hanken, saira, sairaCondensed } from "./fonts";
//
// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html
//       lang="en"
//       data-base="light"
//       className={`${hanken.variable} ${saira.variable} ${sairaCondensed.variable}`}
//     >
//       <body>{children}</body>
//     </html>
//   );
// }
//
// Then in globals.css point the family tokens at the next/font vars:
//   :root {
//     --font-body:    var(--font-hanken), system-ui, sans-serif;
//     --font-display: var(--font-saira-condensed), var(--font-hanken), sans-serif;
//     --font-num:     var(--font-saira), var(--font-hanken), sans-serif;
//   }
// ────────────────────────────────────────────────────────────
