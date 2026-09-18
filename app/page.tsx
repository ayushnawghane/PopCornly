import Link from "next/link";
import { Play, MessageCircle, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import Button from "@/components/ui/Button";
import AvatarChip from "@/components/ui/AvatarChip";
import RoomCode from "@/components/ui/RoomCode";

const DEMO_FRIENDS = ["Maya", "Theo", "Priya", "Sam"];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    displayName = profile?.display_name ?? null;
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="font-display text-lg font-bold tracking-tight">
          popcornly<span className="text-primary">.</span>
        </span>
        {user ? (
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-foreground-muted sm:inline">
              {displayName ?? user.email}
            </span>
            <SignOutButton />
          </div>
        ) : (
          <Link href="/login" className="text-sm font-medium text-foreground-muted hover:text-foreground">
            Log in
          </Link>
        )}
      </header>

      <main className="flex flex-1 flex-col">
        {/* hero: the room-code + lobby motif is the first thing anyone sees */}
        <section className="flex flex-col items-center gap-10 px-6 pb-20 pt-10 text-center sm:pt-16">
          <div className="relative flex flex-col items-center gap-6">
            <div className="flex -space-x-3">
              {DEMO_FRIENDS.map((name, i) => (
                <AvatarChip
                  key={name}
                  name={name}
                  size="lg"
                  ring
                  pattern
                  className="animate-chip-in shadow-lg"
                  style={{ animationDelay: `${i * 120}ms` } as React.CSSProperties}
                />
              ))}
            </div>
            <RoomCode code="MOVIE" size="lg" className="animate-chip-in" style={{ animationDelay: "480ms" } as React.CSSProperties} />
          </div>

          <div className="flex max-w-2xl flex-col items-center gap-4">
            <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Same movie.
              <br />
              Every couch.
            </h1>
            <p className="max-w-md text-balance text-base text-foreground-muted sm:text-lg">
              Start a room, drop the link in your group chat, and watch together from
              wherever you are. Playback stays synced. Chat and video calls are already in the room.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button href={user ? "/room/new" : "/register"} display size="md" className="px-7 py-3.5 text-base">
              Start a party
            </Button>
            {!user && (
              <Link
                href="/login"
                className="rounded-xl border border-border-strong px-7 py-3.5 text-base font-semibold text-foreground-muted transition-colors hover:border-secondary hover:text-secondary"
              >
                I already have an account
              </Link>
            )}
          </div>
        </section>

        {/* prove the mechanism: one room, all three pieces at once */}
        <section className="border-t border-border px-6 py-16 sm:py-24">
          <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-center">
            <div className="flex flex-col gap-4 lg:w-2/5">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                It&apos;s one room, not three tabs.
              </h2>
              <p className="text-foreground-muted">
                The player, the chat, and the call all live in the same place. Whoever&apos;s
                hosting drives playback — everyone else just watches, no buffering out of sync.
              </p>
              <ul className="mt-2 flex flex-col gap-3 text-sm">
                <li className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Play className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                  </span>
                  YouTube, Vimeo, direct links, or your own upload
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  Chat that sticks around after the credits roll
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-tertiary/15 text-tertiary">
                    <Video className="h-4 w-4" />
                  </span>
                  Camera on if you want it — peer-to-peer, on by choice
                </li>
              </ul>
            </div>

            <div
              aria-label="Illustration of a Popcornly room in progress"
              className="flex flex-1 flex-col gap-3 rounded-2xl border border-border-strong bg-bg-raised p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-tertiary">
                  <span className="h-1.5 w-1.5 animate-live-pulse rounded-full bg-tertiary" />
                  LIVE
                </div>
                <div className="flex -space-x-2">
                  {DEMO_FRIENDS.slice(0, 3).map((name) => (
                    <AvatarChip key={name} name={name} size="sm" ring />
                  ))}
                </div>
              </div>
              <div className="flex aspect-video items-center justify-center rounded-xl bg-bg">
                <Play className="h-10 w-10 text-foreground-muted/40" fill="currentColor" strokeWidth={0} />
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                <p>
                  <span className="font-semibold text-secondary">Theo</span>{" "}
                  <span className="text-foreground-muted">wait pause it i need a snack</span>
                </p>
                <p>
                  <span className="font-semibold text-tertiary">Priya</span>{" "}
                  <span className="text-foreground-muted">lol get the good popcorn</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* honest close: what this is, plainly */}
        <section className="border-t border-border px-6 py-16 text-center sm:py-20">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Free to use. Built for casual movie nights.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-foreground-muted">
            No account limits on how many rooms you start. Video calls are peer-to-peer, so they
            work best in small groups — occasionally a strict network gets in the way.
          </p>
          <div className="mt-8">
            <Button href={user ? "/room/new" : "/register"} display size="md" className="px-7 py-3.5 text-base">
              Start a party
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-foreground-muted">
        popcornly — watch together, from wherever you are.
      </footer>
    </div>
  );
}
