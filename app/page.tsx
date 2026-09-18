import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

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
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <main className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Popcornly</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Watch videos together, in sync, with friends — chat and video call
          built in.
        </p>

        {user ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-zinc-500">
              Signed in as{" "}
              <span className="font-medium text-foreground">
                {displayName ?? user.email}
              </span>
            </p>
            <Link
              href="/room/new"
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Create a room
            </Link>
            <SignOutButton />
          </div>
        ) : (
          <div className="flex gap-4">
            <Link
              href="/register"
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-zinc-700 dark:hover:bg-white/[.06]"
            >
              Log in
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
