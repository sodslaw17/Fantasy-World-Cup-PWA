"use client";

import { useActionState, useState } from "react";
import { addUser, updateDisplayName, updateAvatar, deleteUser } from "@/app/admin/users/actions";
import { ImageUpload } from "@/components/ui/ImageUpload";
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
      <div className="rounded-xl bg-paper-2 border border-line p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gold-ink">Add player</h2>
        <form action={addAction} className="flex flex-col gap-2 sm:flex-row">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="flex-1 rounded-lg bg-paper-2 border border-line-2 px-3 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand min-h-tap"
          />
          <input
            name="display_name"
            type="text"
            required
            placeholder="Display name"
            className="flex-1 rounded-lg bg-paper-2 border border-line-2 px-3 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand min-h-tap"
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
      <div className="rounded-xl bg-paper-2 border border-line overflow-hidden">
        {profiles.length === 0 ? (
          <p className="p-4 text-sm text-ink-2">No players yet.</p>
        ) : (
          <ul className="divide-y divide-paper/10">
            {profiles.map((p) => (
              <PlayerRow key={p.id} profile={p} />
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-ink-3">
        {profiles.length} / 10 players
      </p>
    </div>
  );
}

function PlayerRow({ profile }: { profile: Profile }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile.display_name);
  const [editError, setEditError] = useState<string>();
  const [avatarMsg, setAvatarMsg] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  async function handleSaveName() {
    const result = await updateDisplayName(profile.id, editName);
    if (result.error) {
      setEditError(result.error);
    } else {
      setEditing(false);
      setEditError(undefined);
    }
  }

  async function handleAvatarComplete(url: string | null) {
    const result = await updateAvatar(profile.id, url ?? "");
    if (result.error) setAvatarMsg(result.error);
    else setAvatarMsg("Saved");
    setTimeout(() => setAvatarMsg(""), 3000);
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
      {/* Avatar upload */}
      <div className="shrink-0">
        <ImageUpload
          bucket="avatars"
          storagePath={profile.id}
          currentUrl={profile.avatar_url}
          shape="circle"
          size="md"
          onComplete={handleAvatarComplete}
        />
        {avatarMsg && (
          <p className={`text-xs mt-1 text-center ${avatarMsg === "Saved" ? "text-accent-green" : "text-accent-red"}`}>
            {avatarMsg === "Saved" ? "✓" : avatarMsg}
          </p>
        )}
      </div>

      {/* Status dot */}
      <span
        className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
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
              className="flex-1 rounded bg-paper-2 border border-line-2 px-2 py-1 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand"
              autoFocus
            />
            <button
              onClick={handleSaveName}
              className="text-xs text-gold-ink font-medium px-2 py-1 rounded hover:bg-gold-soft"
            >
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setEditName(profile.display_name); setEditError(undefined); }}
              className="text-xs text-ink-2 px-2 py-1 rounded hover:bg-paper/5"
            >
              Cancel
            </button>
          </div>
        ) : (
          <p className="text-sm font-medium">{profile.display_name}</p>
        )}
        {editError && <p className="text-xs text-accent-red mt-1">{editError}</p>}
        <p className="text-xs text-ink-2 mt-0.5 truncate">{profile.email}</p>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-ink-2 hover:text-ink px-2 py-1 rounded hover:bg-paper/5"
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
              : "text-ink-2 hover:text-ink hover:bg-paper/5"
          }`}
        >
          {deleting ? "…" : deleteConfirm ? "Confirm?" : "Remove"}
        </button>
      </div>
    </li>
  );
}
