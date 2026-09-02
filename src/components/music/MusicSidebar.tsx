import {
  Disc3,
  Heart,
  History,
  Layers,
  ListMusic,
  Mic2,
  Search,
  Sparkles,
  UserRound,
  Globe2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BrowseTab =
  | "foryou"
  | "mixes"
  | "podcasts"
  | "languages"
  | "search"
  | "likes"
  | "playlists"
  | "history";

type Props = {
  tab: BrowseTab;
  onTabChange: (tab: BrowseTab) => void;
  onLanguageSelect: (language: string) => void;
  artists: string[];
  userId?: string | null;
};

const discoverItems: Array<{ id: BrowseTab; label: string; icon: typeof Sparkles }> = [
  { id: "foryou", label: "For you", icon: Sparkles },
  { id: "mixes", label: "Mixes", icon: Layers },
  { id: "podcasts", label: "Podcasts", icon: Mic2 },
  { id: "languages", label: "Languages", icon: Globe2 },
  { id: "search", label: "Search", icon: Search },
];

const libraryItems: Array<{ id: BrowseTab; label: string; icon: typeof Heart }> = [
  { id: "likes", label: "Favourites", icon: Heart },
  { id: "playlists", label: "Playlists", icon: ListMusic },
  { id: "history", label: "Recent", icon: History },
];

function NavItem({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Sparkles;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative h-12 w-full justify-start gap-4 rounded-xl px-4 text-left text-base font-semibold",
        active
          ? "bg-surface text-foreground shadow-lift before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-primary"
          : "text-muted-foreground hover:bg-surface/70 hover:text-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
      <span className="truncate">{label}</span>
    </Button>
  );
}

export function MusicSidebar({ tab, onTabChange, onLanguageSelect, artists, userId }: Props) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border/70 bg-background/95 px-4 py-6 backdrop-blur md:flex md:flex-col">
      <div className="flex items-center gap-3 px-2">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-vinyl shadow-player">
          <Disc3 className="h-6 w-6 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-2xl font-bold tracking-normal">
            Melody<span className="text-primary">Map</span>
          </p>
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Your music. Your mood.
          </p>
        </div>
      </div>

      <div className="my-7 h-px bg-border/70" />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-3 px-4 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Discover
        </p>
        <nav className="space-y-1" aria-label="Discover">
          {discoverItems.map(({ id, label, icon }) => (
            <NavItem key={id} active={tab === id} icon={icon} label={label} onClick={() => onTabChange(id)} />
          ))}
        </nav>

        <p className="mb-3 mt-8 px-4 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Your library
        </p>
        <nav className="space-y-1" aria-label="Your library">
          {libraryItems.map(({ id, label, icon }) => (
            <NavItem key={id} active={tab === id} icon={icon} label={label} onClick={() => onTabChange(id)} />
          ))}
        </nav>

        <div className="mt-8 border-t border-border/70 pt-6">
          <p className="mb-3 px-4 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Languages
          </p>
          <div className="space-y-1">
            {["Hindi", "Telugu", "Tamil", "Malayalam", "Kannada", "Punjabi", "English"].map(
              (language) => (
                <Button
                  key={language}
                  type="button"
                  variant="ghost"
                  onClick={() => onLanguageSelect(language)}
                  className="h-9 w-full justify-start rounded-lg px-4 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
                >
                  {language}
                </Button>
              ),
            )}
          </div>
        </div>

        {artists.length > 0 && (
          <div className="mt-8 border-t border-border/70 pt-6">
            <p className="mb-3 px-4 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Your artists
            </p>
            <div className="space-y-1">
              {artists.slice(0, 6).map((artist) => (
                <Button
                  key={artist}
                  type="button"
                  variant="ghost"
                  onClick={() => onLanguageSelect(artist)}
                  className="h-9 w-full justify-start gap-2 rounded-lg px-4 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
                >
                  <UserRound className="h-4 w-4 shrink-0" />
                  <span className="truncate">{artist}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-border/70 px-3 pt-5 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-primary" />
        <span className="truncate">{userId ? "Synced listener" : "Listening locally"}</span>
      </div>
    </aside>
  );
}