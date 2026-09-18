import type { RoomMember } from "@/lib/types";

export default function RoomMemberList({ members }: { members: RoomMember[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-zinc-500">
        {members.length} {members.length === 1 ? "person" : "people"} here
      </h2>
      <ul className="flex flex-col gap-1.5">
        {members.map((member) => (
          <li key={member.user_id} className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{member.profiles?.display_name ?? "Unknown"}</span>
            {member.role !== "guest" && (
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {member.role}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
