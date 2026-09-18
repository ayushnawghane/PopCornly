-- M2: rooms, membership, chat, uploads

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null default 'Watch Party',
  owner_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null default 'none' check (source_type in ('none','youtube','vimeo','upload','direct_url')),
  source_url text,
  uploaded_video_id uuid,
  playback_state text not null default 'paused' check (playback_state in ('playing','paused')),
  playback_position_seconds double precision not null default 0,
  playback_rate real not null default 1.0,
  playback_updated_at timestamptz not null default now(),
  host_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'guest' check (role in ('owner','host','guest')),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table public.chat_messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.uploaded_videos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  duration_seconds double precision,
  rights_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.rooms
  add constraint rooms_uploaded_video_fk foreign key (uploaded_video_id) references public.uploaded_videos(id);

create index on public.room_members (user_id);
create index on public.chat_messages (room_id, created_at);
create index on public.uploaded_videos (owner_id);

-- helper: is the current user a member of this room?
create function public.is_room_member(target_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.room_members
    where room_id = target_room_id and user_id = auth.uid()
  );
$$;

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.uploaded_videos enable row level security;

-- rooms: slug is the bearer token; any authenticated user can look up a room by slug.
-- there is no room-listing query in the app, so open SELECT doesn't leak room existence.
create policy "authenticated users can view rooms"
  on public.rooms for select
  to authenticated
  using (true);

create policy "authenticated users can create rooms"
  on public.rooms for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "host or owner can update room"
  on public.rooms for update
  to authenticated
  using (auth.uid() = owner_id or auth.uid() = host_id);

create policy "owner can delete room"
  on public.rooms for delete
  to authenticated
  using (auth.uid() = owner_id);

-- room_members: self-service join only; you can never add someone else.
create policy "members can view their room roster"
  on public.room_members for select
  to authenticated
  using (public.is_room_member(room_id));

create policy "users can add themselves to a room"
  on public.room_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users can remove themselves from a room"
  on public.room_members for delete
  to authenticated
  using (user_id = auth.uid());

create policy "users can update their own membership row"
  on public.room_members for update
  to authenticated
  using (user_id = auth.uid());

-- chat_messages: members only, always as yourself
create policy "members can view chat"
  on public.chat_messages for select
  to authenticated
  using (public.is_room_member(room_id));

create policy "members can send chat"
  on public.chat_messages for insert
  to authenticated
  with check (user_id = auth.uid() and public.is_room_member(room_id));

-- uploaded_videos: owner has full access; other room members can see metadata once attached
create policy "owner has full access to their uploads"
  on public.uploaded_videos for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "room members can view attached upload metadata"
  on public.uploaded_videos for select
  to authenticated
  using (room_id is not null and public.is_room_member(room_id));

-- auto-add the creator as owner/host when a room is created
create function public.handle_new_room()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.room_members (room_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_room_created
  after insert on public.rooms
  for each row execute procedure public.handle_new_room();

-- private storage bucket for uploaded videos
insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do nothing;

create policy "users can upload to their own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can manage their own uploaded files"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);
