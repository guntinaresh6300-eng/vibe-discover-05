import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaybackSource } from "@/lib/playback.functions";

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (id: string) => void;
  cueVideoById: (opts: { videoId: string; startSeconds?: number }) => void;

  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (v: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement | string, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return apiPromise;
}

export function useYouTubePlayer(options: { onEnded: () => void; onUnavailable?: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const endedRef = useRef(options.onEnded);
  endedRef.current = options.onEnded;
  const unavailableRef = useRef(options.onUnavailable);
  unavailableRef.current = options.onUnavailable;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourcesRef = useRef<PlaybackSource[]>([]);
  const sourceIndexRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSource, setActiveSource] = useState<"IFrame" | "Invidious">("IFrame");

  const useSource = useCallback((sourceIndex: number, startSeconds = 0, autoplay = true) => {
    const source = sourcesRef.current[sourceIndex];
    if (!source) {
      unavailableRef.current?.();
      return;
    }
    sourceIndexRef.current = sourceIndex;
    if (source.type === "youtube") {
      audioRef.current?.pause();
      setActiveSource("IFrame");
      if (autoplay) playerRef.current?.loadVideoById(source.videoId);
      else playerRef.current?.cueVideoById({ videoId: source.videoId, startSeconds });
      if (autoplay && startSeconds > 0) playerRef.current?.seekTo(startSeconds, true);
      return;
    }
    playerRef.current?.pauseVideo();
    const audio = audioRef.current;
    if (!audio) return;
    setActiveSource("Invidious");
    audio.src = source.url;
    audio.currentTime = startSeconds;
    if (autoplay) void audio.play().catch(() => useSource(sourceIndex + 1, startSeconds, true));
  }, []);

  const tryNextSource = useCallback(() => {
    const resumeAt = activeSource === "IFrame"
      ? playerRef.current?.getCurrentTime() || 0
      : audioRef.current?.currentTime || 0;
    useSource(sourceIndexRef.current + 1, resumeAt, true);
  }, [activeSource, useSource]);

  useEffect(() => {
    let cancelled = false;
    loadApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "100%",
        width: "100%",
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (event: { data: number }) => {
            const state = window.YT?.PlayerState;
            if (!state) return;
            if (event.data === state.ENDED) {
              setIsPlaying(false);
              endedRef.current();
            } else if (event.data === state.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === state.PAUSED) {
              setIsPlaying(false);
            }
          },
          onError: () => tryNextSource(),
        },
      });
    });
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [tryNextSource]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => endedRef.current();
    const onError = () => tryNextSource();
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, [tryNextSource]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (activeSource === "Invidious" && audioRef.current) {
        setPosition(audioRef.current.currentTime || 0);
        setDuration(audioRef.current.duration || 0);
      } else {
        const player = playerRef.current;
        if (!player?.getDuration) return;
        setPosition(player.getCurrentTime() || 0);
        setDuration(player.getDuration() || 0);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [activeSource]);

  const loadSources = useCallback((sources: PlaybackSource[], startSeconds = 0, autoplay = true) => {
    sourcesRef.current = sources;
    sourceIndexRef.current = 0;
    useSource(0, startSeconds, autoplay);
  }, [useSource]);

  const load = useCallback((id: string) => playerRef.current?.loadVideoById(id), []);
  /** Loads without autoplay — used to resume the last session at its saved position. */
  const cue = useCallback(
    (id: string, startSeconds = 0) =>
      playerRef.current?.cueVideoById({ videoId: id, startSeconds }),
    [],
  );

  const play = useCallback(() => activeSource === "Invidious" ? void audioRef.current?.play() : playerRef.current?.playVideo(), [activeSource]);
  const pause = useCallback(() => activeSource === "Invidious" ? audioRef.current?.pause() : playerRef.current?.pauseVideo(), [activeSource]);
  const seek = useCallback((seconds: number) => {
    if (activeSource === "Invidious" && audioRef.current) audioRef.current.currentTime = seconds;
    else playerRef.current?.seekTo(seconds, true);
  }, [activeSource]);
  const setVolume = useCallback((v: number) => {
    playerRef.current?.setVolume(v);
    if (audioRef.current) audioRef.current.volume = v / 100;
  }, []);

  return {
    containerRef,
    ready,
    isPlaying,
    position,
    duration,
    activeSource,
    loadSources,
    load,
    cue,

    play,
    pause,
    seek,
    setVolume,
  };
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
