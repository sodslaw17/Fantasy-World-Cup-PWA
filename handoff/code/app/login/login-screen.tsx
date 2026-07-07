"use client";
// ============================================================
// app/login/login-screen.tsx — WC2026 magic-link login
// ------------------------------------------------------------
// This is the screen Claude Code previously built "a little off."
// The drift, and the fix, are called out inline as // FIX: notes.
// Wire <form onSubmit> / the resend button to your EXISTING
// Supabase signInWithOtp call — only the markup/styling here is
// canonical. Do NOT add fields that aren't in this file.
// ============================================================
import * as React from "react";
import { Btn } from "@/components/wc-ui";
import { Field, Input } from "@/components/wc-form";

/* Concentric rounded-rect "racetrack" stripes radiating from (cx,cy).
   Original shapes only — no FIFA/TRIONDA artwork. */
const KEYART = ["#E4002B","#7C3AED","#A3E635","#FF7A00","#1D4ED8","#14B8A6","#FFC400","#00A859","#EC4899","#22D3EE","#6D28D9","#F97316"];

function KeyArt({ cx = 195, cy = 150, width = 390, height = 560 }) {
  const rings: { s: number; color: string }[] = [];
  let idx = 0;
  for (let s = 560; s >= 0; s -= 30, idx++) rings.push({ s, color: KEYART[idx % KEYART.length] });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full block">
      <rect width={width} height={height} fill={KEYART[0]} />
      {rings.map((r, i) => (
        <rect key={i} x={cx - r.s} y={cy - r.s} width={r.s * 2} height={r.s * 2} rx={r.s * 0.46} ry={r.s * 0.46} fill={r.color} />
      ))}
      <rect x="0" y={cy - 1} width={width} height="2" fill="rgba(255,255,255,.22)" />
    </svg>
  );
}

/* White trophy silhouette holding BOTH title lines in the bowl.
   FIX: the title MUST be font-display (Saira Condensed) UPPERCASE in
   black — the prior build rendered it in the default body bold sans. */
function Trophy() {
  return (
    <div className="relative w-[182px] [filter:drop-shadow(0_20px_42px_rgba(0,0,0,.38))]">
      <svg width={182} height={274} viewBox="0 0 200 300" className="block" aria-hidden="true">
        <path d="M14 56 C14 28 48 16 100 16 C152 16 186 28 186 56 C186 110 154 156 100 156 C46 156 14 110 14 56 Z" fill="#fff" />
        <path d="M82 150 C80 182 74 206 66 224 L134 224 C126 206 120 182 118 150 Z" fill="#fff" />
        <path d="M58 218 H142 C150 218 156 224 156 232 L156 240 C156 248 150 254 142 254 H58 C50 254 44 248 44 240 L44 232 C44 224 50 218 58 218 Z" fill="#fff" />
        <path d="M40 250 H160 C166 250 170 254 170 262 L170 272 C170 280 164 286 156 286 H44 C36 286 30 280 30 272 L30 262 C30 254 34 250 40 250 Z" fill="#fff" />
      </svg>
      <div className="absolute inset-x-0 top-[4%] h-[48%] flex flex-col items-center justify-center gap-[3px] font-display font-bold uppercase text-black leading-[1.02]">
        <span className="text-2xl whitespace-nowrap">World Cup</span>
        <span className="text-2xl whitespace-nowrap">2026</span>
        <span className="text-[19px] whitespace-nowrap mt-1 text-[#1a1a1a]">Fantasy League</span>
      </div>
    </div>
  );
}

/* SpectrumBar — six DISCRETE color pills, gap-[5px].
   FIX: the prior build collapsed this into one gradient bar. */
function SpectrumBar() {
  const cols = ["#E4002B", "#FF7A00", "#FFC400", "#00A859", "#1D4ED8", "#7C3AED"];
  return (
    <div className="flex justify-center gap-[5px] mb-4">
      {cols.map((c, i) => <span key={i} className="w-[26px] h-1.5 rounded-pill" style={{ background: c }} />)}
    </div>
  );
}

export function LoginScreen({ sent = false }: { sent?: boolean }) {
  const [email, setEmail] = React.useState(sent ? "alex@wc26pool.com" : "");
  return (
    <div className="flex-1 relative overflow-hidden bg-[#0B0C0F]">
      <KeyArt cx={195} cy={150} />

      {/* trophy centered on the color bullseye */}
      <div className="absolute top-[70px] inset-x-0 flex justify-center z-[2]">
        <Trophy />
      </div>

      {/* white form sheet — keeps copy on white for WCAG AA */}
      <div className="absolute inset-x-0 bottom-0 z-[3] bg-surface rounded-t-[30px] px-6 pt-[22px] [box-shadow:0_-18px_50px_rgba(0,0,0,.22)] pb-[calc(env(safe-area-inset-bottom)+22px)]">
        <SpectrumBar />

        {sent ? (
          <SentState email={email} />
        ) : (
          // FIX: this is a magic-link form. ONE email field — no timezone
          // select, no extra inputs. Heading is CENTERED + has a subtitle.
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              /* call your existing supabase.auth.signInWithOtp({ email }) here */
            }}
          >
            <div className="text-center">
              <div className="font-display font-bold uppercase text-[30px] text-ink leading-none tracking-[.01em]">
                Kick off
              </div>
              <div className="mt-[7px] text-[13.5px] font-medium text-ink-2">
                Sign in to your World Cup pool — no password.
              </div>
            </div>

            <Field label="Email address" hint="Use the address your pool organizer added." htmlFor="email">
              <Input
                id="email"
                big
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                leftIcon={
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="4" width="16" height="12" rx="2.5" /><path d="M3 6l7 5 7-5" strokeLinecap="round" /></svg>
                }
              />
            </Field>

            {/* FIX: pill button, brand fill, WITH the arrow icon, ≥54px */}
            <Btn type="submit" kind="primary" full className="min-h-[54px] text-[17px]">
              Send magic link
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h11M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Btn>

            {/* FIX: footer is UPPERCASE, letter-spaced, weight 700, with a lock icon */}
            <div className="flex items-center justify-center gap-[7px]">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-ink-3"><rect x="4" y="9" width="12" height="8" rx="2" /><path d="M7 9V6.5a3 3 0 016 0V9" /></svg>
              <span className="text-[11.5px] font-bold tracking-[.04em] uppercase text-ink-3">
                Private pool · invite only
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* Sent state — swap the form for a confirmation. Keep your await logic. */
function SentState({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-4 text-center">
      <div className="grid place-items-center w-[60px] h-[60px] rounded-pill mx-auto bg-green-soft text-green-ink">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" /><rect x="3" y="5" width="18" height="14" rx="2.5" /></svg>
      </div>
      <div>
        <div className="font-display font-bold uppercase text-[25px] text-ink leading-none">Check your email</div>
        <div className="mt-[9px] text-sm font-medium text-ink-2 leading-[1.45]">
          We sent a sign-in link to
          <br />
          <span className="text-ink font-bold">{email}</span>
        </div>
      </div>
      <Btn kind="ghost" full className="min-h-[50px]">Open mail app</Btn>
      <button type="button" className="bg-transparent border-0 cursor-pointer text-[13.5px] font-bold text-brand-ink">
        Didn&apos;t get it? Resend link
      </button>
    </div>
  );
}
