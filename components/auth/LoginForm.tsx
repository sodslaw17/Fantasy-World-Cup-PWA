"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { loginAction } from "@/app/login/actions";
import { Btn } from "@/components/wc-ui";
import { Field, Input } from "@/components/wc-form";

const initialState = { error: undefined as string | undefined, success: false };

function SpectrumBar() {
  const cols = ["#E4002B", "#FF7A00", "#FFC400", "#00A859", "#1D4ED8", "#7C3AED"];
  return (
    <div className="flex justify-center gap-[5px] mb-4">
      {cols.map((c, i) => (
        <span key={i} className="w-[26px] h-1.5 rounded-pill" style={{ background: c }} />
      ))}
    </div>
  );
}

function SentState({ email, onResend }: { email: string; onResend: () => void }) {
  return (
    <div className="flex flex-col gap-4 text-center">
      <div className="grid place-items-center w-[60px] h-[60px] rounded-pill mx-auto bg-green-soft text-green-ink">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
        </svg>
      </div>
      <div>
        <div className="font-display font-bold uppercase text-[25px] text-ink leading-none">
          Check your email
        </div>
        <div className="mt-[9px] text-sm font-medium text-ink-2 leading-[1.45]">
          We sent a sign-in link to
          <br />
          <span className="text-ink font-bold">{email}</span>
        </div>
      </div>
      <Btn kind="ghost" full className="min-h-[50px]">Open mail app</Btn>
      <button
        type="button"
        onClick={onResend}
        className="bg-transparent border-0 cursor-pointer text-[13.5px] font-bold text-brand-ink"
      >
        Didn&apos;t get it? Resend link
      </button>
    </div>
  );
}

export function LoginForm() {
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [state, formAction, isPending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const emailVal = formData.get("email");
      if (typeof emailVal === "string") setSubmittedEmail(emailVal.trim().toLowerCase());
      const result = await loginAction(formData);
      return { error: result.error, success: result.success ?? false };
    },
    initialState
  );

  const tzRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!tzRef.current) return;
    tzRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  }, []);

  if (state.success) {
    return (
      <div className="px-6 pb-8 pt-2">
        <SpectrumBar />
        <SentState
          email={submittedEmail}
          onResend={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+22px)] pt-2">
      <SpectrumBar />

      <form action={formAction} className="flex flex-col gap-4">
        {/* hidden timezone — preserved for first-login redirect */}
        <input ref={tzRef} type="hidden" name="timezone" />

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
            name="email"
            big
            type="email"
            autoComplete="email"
            required
            placeholder="you@email.com"
            leftIcon={
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="2" y="4" width="16" height="12" rx="2.5" />
                <path d="M3 6l7 5 7-5" strokeLinecap="round" />
              </svg>
            }
          />
        </Field>

        {state.error && (
          <p role="alert" className="text-sm font-semibold text-red-ink -mt-1">
            {state.error}
          </p>
        )}

        <Btn type="submit" kind="primary" full disabled={isPending} className="min-h-[54px] text-[17px]">
          {isPending ? "Sending…" : "Send magic link"}
          {!isPending && (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 10h11M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </Btn>

        <div className="flex items-center justify-center gap-[7px]">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-ink-3">
            <rect x="4" y="9" width="12" height="8" rx="2" />
            <path d="M7 9V6.5a3 3 0 016 0V9" />
          </svg>
          <span className="text-[11.5px] font-bold tracking-[.04em] uppercase text-ink-3">
            Private pool · invite only
          </span>
        </div>
      </form>
    </div>
  );
}
