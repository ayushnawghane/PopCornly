"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
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
    <div className="flex h-80 flex-col rounded-2xl border border-border bg-bg-raised">
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && <p className="text-xs text-foreground-muted">No messages yet — say hi!</p>}
        {messages.map((m) => {
          const isMe = m.user_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-1.5 text-sm ${
                  isMe ? "bg-primary text-primary-foreground" : "bg-bg-raised-2 text-foreground"
                }`}
              >
                {!isMe && <p className="text-xs font-semibold text-secondary">{nameFor(m.user_id)}</p>}
                <p className="wrap-break-word">{m.body}</p>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message the room…"
          maxLength={2000}
          className="flex-1 rounded-xl border border-border bg-bg px-3 py-1.5 text-sm text-foreground outline-none focus:border-tertiary"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send message"
          className="flex items-center justify-center rounded-xl bg-primary px-3 text-primary-foreground transition-colors hover:bg-[#ff7f4f] disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
