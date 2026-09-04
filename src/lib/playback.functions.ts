import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PlaybackSource =
  | { type: "youtube"; videoId: string }
  | { type: "audio"; url: string };

const ResolveInput = z.object({ videoId: z.string().min(1) });

/**
 * Public Invidious instances used as audio-only fallbacks.
 * These are community instances and change over time; we try several so one
 * slow/down instance doesn't break playback.
 */
const INVIDIOUS_INSTANCES = [
  "iv.datura.network",
  "iv.nboej.de",
  "yt.artemislena.eu",
  "iv.drgns.space",
  "iv.melmac.space",
];

/** Audio itags to try, in quality order. 140 = m4a, 251/250/249 = opus/webm. */
const AUDIO_ITAGS = [140, 251, 250, 249];

/**
 * Resolves an ordered list of playable sources for a YouTube video ID.
 * The first source is always the YouTube IFrame player. Subsequent sources are
 * direct audio streams from Invidious instances, which the client can fall
 * back to if the YouTube embed is region-blocked or removed.
 */
export const resolveSources = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ResolveInput.parse(input))
  .handler(async ({ data }) => {
    const sources: PlaybackSource[] = [{ type: "youtube", videoId: data.videoId }];

    for (const host of INVIDIOUS_INSTANCES) {
      for (const itag of AUDIO_ITAGS) {
        const url = `https://${host}/latest_version?id=${data.videoId}&itag=${itag}&local=true`;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(url, {
            method: "HEAD",
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          clearTimeout(timeout);
          if (res.ok || res.status === 302 || res.status === 200) {
            sources.push({ type: "audio", url });
            break; // one working stream per instance is enough
          }
        } catch {
          // try next itag/instance
        }
      }
    }

    return { sources };
  });
