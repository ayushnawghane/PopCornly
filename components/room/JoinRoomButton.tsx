"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

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
      <Button onClick={handleJoin} disabled={loading} display className="w-full py-3">
        {loading ? "Joining…" : "Join the party"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
