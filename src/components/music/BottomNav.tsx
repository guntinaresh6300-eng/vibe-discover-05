import { Home, Library, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BrowseTab } from "@/components/music/MusicSidebar";

type Props = {
  tab: BrowseTab;
  onTabChange: (tab: BrowseTab) => void;
};

const items: Array<{ id: BrowseTab; label: string; icon: typeof Home }> = [
  { id: "foryou", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "likes", label: "Library", icon: Library },
];

export function BottomNav({ tab, onTabChange }: Props) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
        {items.map(({ id, label, icon: Icon }) => {
          const active = id === "foryou" ? tab === "foryou" : id === "likes" ? ["likes", "playlists", "history"].includes(tab) : tab === id;
          return (
            <Button
              key={id}
              type="button"
              variant="ghost"
              onClick={() => onTabChange(id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "h-14 flex-col gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "fill-primary/15")} />
              {label}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}