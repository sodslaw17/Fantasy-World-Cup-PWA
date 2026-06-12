"use client";

import { useActionState, useEffect, useRef } from "react";
import { loginAction } from "@/app/login/actions";

const TIMEZONES = [
  { value: "America/New_York",     label: "Eastern (ET)" },
  { value: "America/Chicago",      label: "Central (CT)" },
  { value: "America/Denver",       label: "Mountain (MT)" },
  { value: "America/Los_Angeles",  label: "Pacific (PT)" },
  { value: "America/Anchorage",    label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu",     label: "Hawaii (HT)" },
  { value: "America/Toronto",      label: "Toronto (ET)" },
  { value: "America/Vancouver",    label: "Vancouver (PT)" },
  { value: "America/Mexico_City",  label: "Mexico City (CT)" },
  { value: "Europe/London",        label: "London (GMT/BST)" },
  { value: "Europe/Paris",         label: "Paris (CET/CEST)" },
  { value: "Asia/Tokyo",           label: "Tokyo (JST)" },
  { value: "Australia/Sydney",     label: "Sydney (AEST/AEDT)" },
];

const DEFAULT_TZ = "America/Chicago";

const initialState = { error: undefined as string | undefined, success: false };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await loginAction(formData);
      return { error: result.error, success: result.success ?? false };
    },
    initialState
  );

  const tzRef = useRef<HTMLSelectElement>(null);

  // Detect browser timezone on mount and set the select value
  useEffect(() => {
    if (!tzRef.current) return;
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONES.some((tz) => tz.value === detected)) {
      tzRef.current.value = detected;
    }
  }, []);

  if (state.success) {
    return (
      <div className="text-center space-y-3">
        <div className="text-4xl">📨</div>
        <h2 className="text-xl font-semibold text-gold">Check your email</h2>
        <p className="text-sm text-paper/70">
          We sent you a magic link. Tap it to sign in — no password needed.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg bg-ink-soft border border-paper/20 px-4 py-3 text-paper placeholder:text-paper/40 focus:outline-none focus:ring-2 focus:ring-gold min-h-tap"
        />
      </div>

      <div>
        <label htmlFor="timezone" className="block text-sm font-medium mb-1.5">
          Your timezone
        </label>
        <select
          ref={tzRef}
          id="timezone"
          name="timezone"
          defaultValue={DEFAULT_TZ}
          className="w-full rounded-lg bg-ink-soft border border-paper/20 px-4 py-3 text-paper focus:outline-none focus:ring-2 focus:ring-gold min-h-tap"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-paper/40">
          Used to show today&apos;s matches in your local time. Auto-detected — change if wrong.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-accent-red">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-gold text-ink font-semibold py-3 min-h-tap disabled:opacity-50 transition-opacity active:scale-95"
      >
        {isPending ? "Sending…" : "Send magic link"}
      </button>
    </form>
  );
}
