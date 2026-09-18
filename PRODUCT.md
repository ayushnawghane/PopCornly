# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Casual friend groups hanging out remotely — the core scenario is "let's watch something together tonight" even though everyone's in a different place. Low-stakes, social, spontaneous rather than scheduled/formal.

## Product Purpose

Popcornly lets a group of friends watch video together in sync from wherever they are, with text chat and peer-to-peer video calling built in, so a remote hangout feels like sitting on the same couch. Success is a friend group starting a room and actually spending the evening in it — synced playback that doesn't drift, chat and calls that make it feel like everyone's together, not just watching the same link in parallel.

## Positioning

Free, account-based watch parties with real persistence (rooms, chat history) built on Supabase — not a disposable link-and-forget tool. Video calling is peer-to-peer (no paid relay infra), which keeps it free to run but is an honest constraint, not a hidden one.

## Operating Context

- A host creates a room, picks a source (YouTube, Vimeo, a direct video link, or an uploaded file), and shares an invite link.
- Friends open the link, join, and land in a synced player with chat and optional video call tiles alongside it.
- The host drives playback (play/pause/seek); everyone else's player follows and self-corrects.
- Sessions are casual and spontaneous — people join mid-video, drop in and out, chat alongside the video, only sometimes turn on their camera.

## Capabilities and Constraints

- Auth: email/password via Supabase Auth (Google login not yet built).
- Video sources: YouTube, Vimeo, direct video URLs, and user uploads (Supabase Storage, with a rights-confirmation checkbox at upload).
- Sync: host-driven playback broadcast over Supabase Realtime, with drift correction on followers.
- Chat: persisted, room-scoped.
- Video calling: peer-to-peer WebRTC mesh, STUN only, no TURN/SFU — calls can fail to connect on strict corporate/school networks or symmetric NAT. This is a known, current limitation, not hidden from users.
- Rooms are invite-link-based (a high-entropy slug is the access token); there's no public room directory.
- No mobile app — responsive web only.

## Brand Commitments

Name is fixed: **Popcornly**. No logo, tagline, or color palette has been chosen yet — full creative freedom on visual identity, typography, and palette.

## Evidence on Hand

Pre-launch. No real users, testimonials, screenshots, or usage data exist yet. Design and copy must not fabricate user counts, testimonials, or "real" demo content — use honest empty/first-run states instead.

## Product Principles

1. Sync fidelity over feature breadth — a laggy or drifting player breaks the entire premise; correctness here matters more than adding sources or features.
2. Host clarity, follower simplicity — the person driving playback needs visible control; everyone else should feel like effortless passengers, not need to understand the sync mechanism.
3. Honest about its own limits — no TURN server, no mobile app, no Google login yet; the product should surface these constraints plainly rather than pretend they don't exist.
4. Casual over corporate — this is a hangout tool for friends, not a productivity or enterprise product; tone and pacing should stay light or at least not become boring, but should not undermine the trust needed to hand over a camera/mic.
