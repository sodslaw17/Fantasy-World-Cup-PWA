"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/admin/settings/actions";
import type { Settings } from "@/lib/db";

const initial = { error: undefined as string | undefined, success: false };

const PHASE_OPTIONS = [
  { value: "",               label: "Auto-detect from timestamps" },
  { value: "predictions",    label: "Predictions (buy-in phase)" },
  { value: "groups",         label: "Group matches" },
  { value: "draft_standby",  label: "Draft standby" },
  { value: "knockout",       label: "Knockout" },
];

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => {
      const result = await saveSettings(formData);
      return { error: result.error, success: result.success ?? false };
    },
    initial
  );

  return (
    <form action={action} className="space-y-5">
      <Field
        label="Prediction deadline"
        name="prediction_deadline_utc"
        defaultValue={settings.prediction_deadline_utc}
        hint="Magic-link lock — server enforces this"
      />
      <Field
        label="Group stage end"
        name="group_end_utc"
        defaultValue={settings.group_end_utc ?? ""}
        hint="When to switch from Groups → Draft standby"
      />
      <Field
        label="Knockout start"
        name="knockout_start_utc"
        defaultValue={settings.knockout_start_utc ?? ""}
        hint="When to switch from Draft standby → Knockout"
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Phase override</label>
        <select
          name="current_phase_override"
          defaultValue={settings.current_phase_override ?? ""}
          className="w-full rounded-lg bg-paper-2 border border-line-2 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand min-h-tap"
        >
          {PHASE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-ink-3">
          Force a specific phase regardless of timestamps.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Draft standby message</label>
        <textarea
          name="draft_standby_text"
          defaultValue={settings.draft_standby_text}
          rows={4}
          className="w-full rounded-lg bg-paper-2 border border-line-2 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand resize-y"
        />
        <p className="text-xs text-ink-3">
          Shown to users on the home screen during the draft standby phase.
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-accent-red">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-accent-green">✓ Settings saved.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gold text-ink font-semibold py-3 min-h-tap disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      <input
        name={name}
        type="text"
        defaultValue={defaultValue}
        placeholder="2026-06-11T19:00:00Z"
        className="w-full rounded-lg bg-paper-2 border border-line-2 px-3 py-2.5 text-sm text-ink placeholder:text-ink-3 font-mono focus:outline-none focus:ring-1 focus:ring-brand min-h-tap"
      />
      {hint && <p className="text-xs text-ink-3">{hint}</p>}
    </div>
  );
}
