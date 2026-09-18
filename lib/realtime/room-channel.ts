import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Entry {
  channel: RealtimeChannel;
  refCount: number;
  subscribeScheduled: boolean;
}

const channels = new Map<string, Entry>();

/**
 * Returns the single shared RealtimeChannel for a room, used for playback
 * sync, chat's postgres_changes subscription, and WebRTC signaling alike.
 * Multiple hooks call this for the same room and get the same refcounted
 * instance rather than each opening its own channel subscription.
 *
 * `.subscribe()` is deferred to a microtask so every consumer mounting in
 * the same render pass gets to register its `.on(...)` bindings first.
 */
export function getOrCreateChannel(roomId: string, presenceKey?: string): RealtimeChannel {
  let entry = channels.get(roomId);
  if (!entry) {
    const supabase = createClient();
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: false, ack: false },
        presence: presenceKey ? { key: presenceKey } : undefined,
      },
    });
    entry = { channel, refCount: 0, subscribeScheduled: false };
    channels.set(roomId, entry);
  }

  entry.refCount += 1;

  if (!entry.subscribeScheduled) {
    entry.subscribeScheduled = true;
    queueMicrotask(() => {
      if (channels.get(roomId) === entry) {
        entry!.channel.subscribe();
      }
    });
  }

  return entry.channel;
}

export function releaseChannel(roomId: string) {
  const entry = channels.get(roomId);
  if (!entry) return;

  entry.refCount -= 1;
  if (entry.refCount <= 0) {
    entry.channel.unsubscribe();
    channels.delete(roomId);
  }
}
