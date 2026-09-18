"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinRoomButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/rooms/${slug}/join`, { method: "POST" });
    const json = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Could not join room");
      return;
    }

    router.push(`/room/${slug}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleJoin}
        disabled={loading}
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {loading ? "Joining…" : "Join room"}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
