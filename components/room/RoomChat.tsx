"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateChannel, releaseChannel } from "@/lib/realtime/room-channel";
import type { ChatMessage, RoomMember } from "@/lib/types";

export default function RoomChat({
  roomId,
  currentUserId,
  members,
}: {
  roomId: string;
  currentUserId: string;
  members: RoomMember[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const nameFor = (userId: string) =>
    userId === currentUserId
      ? "You"
      : (members.find((m) => m.user_id === userId)?.profiles?.display_name ?? "Someone");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (!cancelled && data) setMessages(data as ChatMessage[]);
      });

    const channel = getOrCreateChannel(roomId, currentUserId);
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
      (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      },
    );

    return () => {
      cancelled = true;
      releaseChannel(roomId);
    };
  }, [roomId, currentUserId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;

    setSending(true);
    setInput("");

    const supabase = createClient();
    const { error } = await supabase
      .from("chat_messages")
      .insert({ room_id: roomId, user_id: currentUserId, body });

    setSending(false);
    if (error) setInput(body); // restore on failure so the user doesn't lose their message
  }

  return (
    <div className="flex h-80 flex-col rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && <p className="text-xs text-zinc-500">No messages yet — say hi!</p>}
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium">{nameFor(m.user_id)}</span>
            <span className="ml-2 text-zinc-700 dark:text-zinc-300">{m.body}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-zinc-200 p-2 dark:border-zinc-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message the room…"
          maxLength={2000}
          className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          Send
        </button>
      </form>
    </div>
  );
}
