import { Crown } from "lucide-react";
import AvatarChip from "@/components/ui/AvatarChip";
import type { RoomMember } from "@/lib/types";

export default function RoomMemberList({ members }: { members: RoomMember[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-bg-raised p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        {members.length} {members.length === 1 ? "person" : "people"} in the room
      </h2>
      <ul className="flex flex-col gap-2.5">
        {members.map((member) => (
          <li key={member.user_id} className="flex items-center gap-2.5 text-sm">
            <AvatarChip name={member.profiles?.display_name ?? "Unknown"} seed={member.user_id} size="sm" />
            <span className="truncate">{member.profiles?.display_name ?? "Unknown"}</span>
            {member.role !== "guest" && (
              <span className="ml-auto flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                <Crown className="h-2.5 w-2.5" />
                {member.role}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
