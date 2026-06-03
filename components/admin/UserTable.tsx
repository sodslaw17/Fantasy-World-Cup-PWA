"use client";

import { useActionState, useState } from "react";
import { addUser, updateDisplayName, deleteUser } from "@/app/admin/users/actions";
import type { Profile } from "@/lib/db";

const initialAddState = { error: undefined as string | undefined, success: false };

export function UserTable({ profiles }: { profiles: Profile[] }) {
  const [addState, addAction, addPending] = useActionState(
    async (_prev: typeof initialAddState, formData: FormData) => {
      const result = await addUser(formData);
      return { error: result.error, success: result.success ?? false };
    },
    initialAddState
  );

  return (
    <div className="space-y-6">
      {/* Add user form */}
      <div className="rounded-xl bg-ink-soft border border-paper/10 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gold">Add player</h2>
        <form action={addAction} className="flex flex-col gap-2 sm:flex-row">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="flex-1 rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm text-paper placeholder:text-paper/40 focus:outline-none focus:ring-1 focus:ring-gold min-h-tap"
          />
          <input
            name="display_name"
            type="text"
            required
            placeholder="Display name"
            className="flex-1 rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm text-paper placeholder:text-paper/40 focus:outline-none focus:ring-1 focus:ring-gold min-h-tap"
          />
          <button
            type="submit"
            disabled={addPending}
            className="rounded-lg bg-gold text-ink text-sm font-semibold px-4 py-2.5 min-h-tap disabled:opacity-50 whitespace-nowrap"
          >
            {addPending ? "Adding…" : "Add player"}
          </button>
        </form>
        {addState.error && (
          <p className="text-xs text-accent-red">{addState.error}</p>
        )}
        {addState.success && (
          <p className="text-xs text-accent-green">Player added.</p>
        )}
      </div>

      {/* Players list */}
      <div className="rounded-xl bg-ink-soft border border-paper/10 overflow-hidden">
        {profiles.length === 0 ? (
          <p className="p-4 text-sm text-paper/50">No players yet.</p>
        ) : (
          <ul className="divide-y divide-paper/10">
            {profiles.map((p) => (
              <PlayerRow key={p.id} profile={p} />
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-paper/30">
        {profiles.length} / 10 players
      </p>
    </div>
  );
}

function PlayerRow({ profile }: { profile: Profile }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile.display_name);
  const [editError, setEditError] = useState<string>();
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  async function handleSave() {
    const result = await updateDisplayName(profile.id, editName);
    if (result.error) {
      setEditError(result.error);
    } else {
      setEditing(false);
      setEditError(undefined);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    await deleteUser(profile.id);
  }

  return (
    <li className="p-4 flex items-start gap-3">
      {/* Status dot */}
      <span
        className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
          profile.auth_id ? "bg-accent-green" : "bg-paper/20"
        }`}
        title={profile.auth_id ? "Logged in at least once" : "Never logged in"}
      />

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex gap-2">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 rounded bg-ink border border-paper/20 px-2 py-1 text-sm text-paper focus:outline-none focus:ring-1 focus:ring-gold"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="text-xs text-gold font-medium px-2 py-1 rounded hover:bg-gold/10"
            >
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setEditName(profile.display_name); setEditError(undefined); }}
              className="text-xs text-paper/50 px-2 py-1 rounded hover:bg-paper/5"
            >
              Cancel
            </button>
          </div>
        ) : (
          <p className="text-sm font-medium">{profile.display_name}</p>
        )}
        {editError && <p className="text-xs text-accent-red mt-1">{editError}</p>}
        <p className="text-xs text-paper/50 mt-0.5 truncate">{profile.email}</p>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-paper/50 hover:text-paper px-2 py-1 rounded hover:bg-paper/5"
          >
            Edit
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`text-xs px-2 py-1 rounded ${
            deleteConfirm
              ? "text-accent-red font-semibold hover:bg-accent-red/10"
              : "text-paper/50 hover:text-paper hover:bg-paper/5"
          }`}
        >
          {deleting ? "…" : deleteConfirm ? "Confirm?" : "Remove"}
        </button>
      </div>
    </li>
  );
}
