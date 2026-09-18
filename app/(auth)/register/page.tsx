"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AvatarChip from "@/components/ui/AvatarChip";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setConfirmationSent(true);
  }

  if (confirmationSent) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-bg-raised p-8 text-center">
          <h1 className="font-display text-xl font-bold">Check your email</h1>
          <p className="mt-3 text-sm text-foreground-muted">
            We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
            Click it to finish setting up your account.
          </p>
        </div>
      </main>
    );
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
          <h1 className="font-display text-xl font-bold">Start a party</h1>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Already have one?{" "}
            <Link href="/login" className="font-medium text-tertiary hover:underline">
              Log in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="displayName" className="text-sm font-medium">
                What should we call you?
              </label>
              <Input
                id="displayName"
                type="text"
                required
                minLength={1}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Maya"
              />
            </div>

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={loading} display className="mt-2 w-full py-3">
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
