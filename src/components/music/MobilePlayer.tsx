import { ChevronDown, Heart, ListVideo, Pause, Play, SkipBack, SkipForward, ThumbsDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Equalizer, SpinningArt } from "@/components/music/NowPlayingViz";
import { ScrubBar } from "@/components/music/ScrubBar";
import type { Track } from "@/lib/library";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  track?: Track;
  isPlaying: boolean;
  position: number;
  duration: number;
  liked: boolean;
  disliked: boolean;
  canPrev: boolean;
  canNext: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onLike: () => void;
  onDislike: () => void;
  onQueue: () => void;
};

export function MobilePlayer({
  open,
  track,
  isPlaying,
  position,
  duration,
  liked,
  disliked,
  canPrev,
  canNext,
  onClose,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onLike,
  onDislike,
  onQueue,
}: Props) {
  if (!open) return null;

  return (
    <section className="fixed inset-0 z-50 flex min-h-screen flex-col bg-background px-5 pb-[env(safe-area-inset-bottom)] pt-5 md:hidden">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Minimize player">
          <ChevronDown className="h-6 w-6" />
        </Button>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Now playing</p>
        <Button type="button" variant="ghost" size="icon" onClick={onQueue} aria-label="Open up next queue">
          <ListVideo className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <div className="mx-auto w-full max-w-sm">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-surface shadow-player">
            {track ? (
              <img src={track.thumbnail} alt={`${track.title} artwork`} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-primary">
                <SpinningArt playing={false} />
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-5">
              <Equalizer active={isPlaying} className="h-6" />
            </div>
          </div>

          <div className="mt-7 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-bold">{track?.title ?? "Pick a song to start"}</h2>
              <p className="mt-1 truncate text-sm text-muted-foreground">{track?.artist ?? "—"}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onLike} aria-label={liked ? "Remove favourite" : "Add favourite"}>
              <Heart className={cn("h-6 w-6", liked && "fill-accent text-accent")} />
            </Button>
          </div>

          <div className="mt-7">
            <ScrubBar position={position} duration={duration} thumbnail={track?.thumbnail} onSeek={onSeek} />
            <div className="mt-2 flex justify-between text-xs tabular-nums text-muted-foreground">
              <span>{formatPlayerTime(position)}</span>
              <span>{formatPlayerTime(duration)}</span>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <Button type="button" variant="ghost" size="icon" onClick={onDislike} aria-label="Not for me">
              <ThumbsDown className={cn("h-5 w-5", disliked && "fill-destructive text-destructive")} />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onPrev} disabled={!canPrev} aria-label="Previous track">
              <SkipBack className="h-6 w-6" />
            </Button>
            <Button type="button" size="icon" className="h-16 w-16 rounded-full" onClick={onTogglePlay} disabled={!track} aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7" />}
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onNext} disabled={!canNext} aria-label="Next track">
              <SkipForward className="h-6 w-6" />
            </Button>
            <span className="w-9" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}

function formatPlayerTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}