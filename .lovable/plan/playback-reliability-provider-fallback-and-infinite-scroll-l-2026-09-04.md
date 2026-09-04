# Playback reliability, provider fallback, and infinite-scroll lists for MelodyMap

## Goal
Explain exactly how MelodyMap plays songs today, then make playback more reliable and the song lists longer without touching the recommendation algorithm.

## Current playback flow (verified)

1. **Source of truth** — The active queue lives in React state on the home route: `queue: Track[]` and `index: number` (`src/routes/index.tsx:142-143`). `current = queue[index]` (`:195`).
2. **Track selection** — Clicking a track in any list calls `startQueue(tracks, startAt)` or `enqueue(tracks)` (`src/routes/index.tsx:270-273`, `:308-315`). Duplicates are filtered before appending.
3. **Audio engine** — `useYouTubePlayer` (`src/lib/use-youtube-player.ts`) injects the YouTube IFrame API, creates a hidden `YT.Player`, and exposes `load`, `cue`, `play`, `pause`, `seek`, `setVolume`, plus polled `position`/`duration`.
4. **Lifecycle** — When `current.id` changes, the route either `cue()`s to a saved resume position or `load()`s + `play()`s the video (`src/routes/index.tsx:237-251`). On `onEnded`, it logs completion, advances the queue, or triggers `extendQueue()` if Continuous Mode is on (`:202-212`, `:319-338`).
5. **Background / lock-screen controls** — `useMediaSession` (`src/lib/use-media-session.ts`) writes metadata, playback state, position state, and action handlers to `navigator.mediaSession`.
6. **Data sources** — Tracks come from scraped YouTube search (`src/lib/music.server.ts:searchYouTube`) or LLM recommendations/mixes (`src/lib/music.functions.ts`). Current caps: search 50, recommendations 30, mixes 20.
7. **Resume** — Every 3s the route saves `{queue, index, position}` and restores it on load (`src/routes/index.tsx:227-260`).
8. **Known gaps** — There is no fallback if a YouTube video is region-blocked or removed; the player just hangs. Lists are single-batch only, so the user cannot load more by scrolling.

## Proposed changes

### 1. Add a provider fallback chain
- Create `src/lib/playback.functions.ts` with a `resolveSources(videoId)` server function.
- It returns an ordered list of playable sources:
  1. YouTube IFrame (default).
  2. Public Invidious/Piped audio stream URLs for the same video ID, fetched via `fetch()` from the server (no Node-only tools).
- Update `useYouTubePlayer` to accept a `sources` array. If the IFrame fires an `onError` event or fails to start within a timeout, automatically try the next source.
- Keep the UI audio-only: sources are consumed by a hidden player, not displayed as video.

### 2. Handle dead/blocked videos gracefully
- Extend `useYouTubePlayer` with an `onError` callback and propagate `YT.PlayerError` codes (e.g., 150/101 unavailable, 100 removed).
- In the route, when a video errors, log a skip, mark the track as failed in a transient `failedIds` set, and auto-advance to the next queued track.
- If all sources fail for the current track, remove it from the queue and show a toast: "This track is unavailable — skipping."

### 3. Infinite scroll / load-more for lists
- Add pagination to `searchTracks` in `src/lib/music.functions.ts`/`src/lib/music.server.ts` using YouTube's continuation token or a page offset parameter.
- Add `loadMore()` helpers in `src/routes/index.tsx` for Search, For You, Mixes, and Languages tabs.
- Render a sentinel element at the bottom of each virtual list; when it enters the viewport, fetch the next batch and append de-duped tracks.
- For AI-generated lists, pass the IDs already loaded so the LLM does not repeat them.

### 4. Improve background playback reliability
- Ensure the hidden IFrame uses `playsinline: 1` and the no-cookie host (`https://www.youtube-nocookie.com`) to reduce mobile browsers pausing background media.
- Keep Media Session handlers in sync even when the browser pauses the IFrame automatically.
- Add a small "audio session" wake lock request behind a user gesture on mobile where supported.

### 5. Keep the recommendation algorithm untouched
- `src/lib/music.functions.ts` prompts, `src/lib/library.ts` behavioral scoring, and the comfort/nostalgia/discovery balance remain exactly as they are.
- Any new code only wraps or consumes these functions; it does not change the prompt logic or weights.

## Out of scope for this plan
- New auth providers or backend schema changes.
- Download/offline caching (requires storage and legal review of YouTube content).
- Podcast ingestion pipeline (UI exists; this plan focuses on playback and lists).

## Acceptance criteria
- A blocked/removed YouTube video no longer hangs; the app skips to the next playable track within ~3 seconds.
- Search, For You, Mixes, and Languages tabs show a "Load more" / infinite-scroll behavior and fetch additional tracks without duplicates.
- The recommendation algorithm still produces the same 40/30/30 comfort/nostalgia/discovery split.
- Media Session/lock-screen controls continue to work on mobile after the changes.
