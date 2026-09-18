-- enable postgres_changes (used for live room-source updates and chat)
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.chat_messages;
