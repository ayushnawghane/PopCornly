"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import RoomCode from "@/components/ui/RoomCode";

export default function NewRoomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
      return;
    }

    router.push(`/room/${json.room.slug}`);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center opacity-60">
          <RoomCode code="••••••" size="sm" />
        </div>
        <Link
          href="/"
          className="mb-8 block text-center font-display text-lg font-bold tracking-tight"
        >
          popcornly<span className="text-primary">.</span>
        </Link>

        <div className="rounded-2xl border border-border bg-bg-raised p-8">
          <h1 className="font-display text-xl font-bold">Name your room</h1>
          <p className="mt-1.5 text-sm text-foreground-muted">
            You&apos;ll get an invite link to send your friends right after.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Room name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Friday Movie Night"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={loading} display className="mt-2 w-full py-3">
              {loading ? "Setting up…" : "Create room"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
