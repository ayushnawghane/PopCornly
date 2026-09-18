"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default function InviteLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/room/${slug}/join`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button onClick={handleCopy} variant="secondary" size="sm" className="shrink-0 whitespace-nowrap">
      {copied ? <Check className="h-3.5 w-3.5 text-tertiary" /> : <Link2 className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{copied ? "Copied!" : "Invite friends"}</span>
      <span className="sm:hidden">{copied ? "Copied!" : "Invite"}</span>
    </Button>
  );
}
