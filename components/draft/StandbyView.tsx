import Link from "next/link";

interface DraftedTeam {
  teamName: string;
  fifaCode: string;
}

export function StandbyView({
  text,
  myTeams,
  draftLocked,
  isAdmin,
}: {
  text: string;
  myTeams: DraftedTeam[];
  draftLocked: boolean;
  isAdmin?: boolean;
}) {
  return (
    <div className="min-h-screen pb-24 flex flex-col">
      <header className="px-4 pt-5 pb-3 flex items-start justify-between">
        <div>
          <p className="text-xs text-paper/50 uppercase tracking-widest">WC26 Pool</p>
          <h1 className="text-lg font-bold text-gold mt-1">Draft Standby</h1>
        </div>
        {isAdmin && (
          <Link
            href="/admin"
            className="text-xs text-paper/40 hover:text-paper border border-paper/20 rounded-lg px-3 py-1.5"
          >
            Admin
          </Link>
        )}
      </header>

      {/* Organiser message */}
      <div className="mx-4 rounded-xl bg-ink-soft border border-paper/10 p-5 space-y-3">
        <div className="flex items-center gap-2 text-gold">
          <span className="text-2xl">📋</span>
          <span className="text-sm font-semibold uppercase tracking-wide">
            Message from the organiser
          </span>
        </div>
        <p className="text-sm text-paper/80 leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>

      {/* Draft result (once locked) */}
      {draftLocked && myTeams.length > 0 && (
        <div className="mx-4 mt-4 rounded-xl bg-gold/10 border border-gold/30 p-4 space-y-3">
          <p className="text-xs text-gold/70 uppercase tracking-wide font-medium">
            Your drafted teams
          </p>
          <div className="space-y-2">
            {myTeams.map((t) => (
              <div
                key={t.fifaCode}
                className="flex items-center gap-3 rounded-lg bg-ink px-3 py-2"
              >
                <span className="text-xs font-mono text-paper/40 w-8">{t.fifaCode}</span>
                <span className="text-sm font-semibold">{t.teamName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {draftLocked && myTeams.length === 0 && (
        <div className="mx-4 mt-4 rounded-xl bg-ink-soft border border-paper/10 p-4">
          <p className="text-sm text-paper/50 text-center">
            No teams assigned to you yet.
          </p>
        </div>
      )}

      {!draftLocked && (
        <p className="text-xs text-paper/30 text-center mt-6 px-8">
          Draft picks will appear here once the organiser locks them in.
        </p>
      )}
    </div>
  );
}
