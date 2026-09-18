"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AvatarChip from "@/components/ui/AvatarChip";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center -space-x-2">
          <AvatarChip name="Maya" size="sm" ring />
          <AvatarChip name="Theo" size="sm" ring />
          <AvatarChip name="Priya" size="sm" ring />
        </div>
        <Link
          href="/"
          className="mb-8 block text-center font-display text-lg font-bold tracking-tight"
        >
          popcornly<span className="text-primary">.</span>
        </Link>

        <div className="rounded-2xl border border-border bg-bg-raised p-8">
          <h1 className="font-display text-xl font-bold">Welcome back</h1>
          <p className="mt-1.5 text-sm text-foreground-muted">
            New here?{" "}
            <Link href="/register" className="font-medium text-tertiary hover:underline">
              Create an account
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={loading} display className="mt-2 w-full py-3">
              {loading ? "Logging in…" : "Log in"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
