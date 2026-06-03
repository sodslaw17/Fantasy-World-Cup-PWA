"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";

const initialState = { error: undefined as string | undefined, success: false };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await loginAction(formData);
      return { error: result.error, success: result.success ?? false };
    },
    initialState
  );

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
