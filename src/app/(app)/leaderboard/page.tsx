export default function LeaderboardPage() {
  return (
    <div className="px-4 pt-6 pb-8 mx-auto max-w-md">
      <h1 className="text-xl font-semibold tracking-tight">Leaderboard</h1>
      <p className="mt-2 text-sm text-muted">
        Placeholder for your cohort ranking and weekly challenges.
      </p>

      <div className="mt-4 rounded-3xl border border-border bg-card p-6 space-y-3">
        {[
          { name: "Ankit", xp: 1280, rank: 1 },
          { name: "Sana", xp: 1180, rank: 2 },
          { name: "You", xp: 1120, rank: 3 },
          { name: "Karan", xp: 980, rank: 4 },
        ].map((u) => (
          <div
            key={u.rank}
            className="flex items-center justify-between rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center text-sm font-semibold text-warning">
                {u.rank}
              </div>
              <div>
                <div className="text-sm font-semibold">{u.name}</div>
                <div className="text-[11px] text-muted">{u.xp} XP</div>
              </div>
            </div>
            <div className="h-2 w-20 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-[#4f46e5]"
                style={{ width: `${Math.min(100, (u.xp / 1300) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

