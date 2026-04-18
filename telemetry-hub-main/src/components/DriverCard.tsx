import { useState, useRef, useEffect } from "react";
import { ChevronRight, Lock, Radio, RefreshCw, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface Game {
  matchup: string;
  pick: string;
  odds: string;
  confidence: number;
}

export interface DriverData {
  id: string;
  name: string;
  league: string;
  tag: string;
  image: string;
  record: string;
  winPct: string;
  units: string;
  status: "HOT" | "COOLDOWN" | "LEADER" | "VERIFIED";
  games: Game[];
  gamesV2: Game[];
  voicePrompt1: string;
  voicePrompt2: string;
}

const statusColor: Record<DriverData["status"], string> = {
  HOT: "text-hot border-hot/40 bg-hot/10",
  COOLDOWN: "text-hud border-hud/40 bg-hud/10",
  LEADER: "text-win border-win/40 bg-win/10",
  VERIFIED: "text-win border-win/40 bg-win/10",
};

interface DriverCardProps {
  driver: DriverData;
  onFreeze: () => void;
}

export const DriverCard = ({ driver, onFreeze }: DriverCardProps) => {
  // tap state machine: 0 = idle, 1 = games revealed, 2 = telemetry refreshed, 3 = frozen
  const [tap, setTap] = useState(0);
  const [voicePulse, setVoicePulse] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleTap = () => {
    if (tap === 3) return;
    setVoicePulse(true);
    setTimeout(() => setVoicePulse(false), 1800);

    if (tap === 0) setTap(1);
    else if (tap === 1) setTap(2);
    else if (tap === 2) {
      setTap(3);
      onFreeze();
    }
  };

  useEffect(() => {
    if (tap === 1 && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [tap]);

  const games = tap >= 2 ? driver.gamesV2 : driver.games;
  const currentPrompt = tap === 1 ? driver.voicePrompt1 : tap >= 2 ? driver.voicePrompt2 : "";

  const ctaLabel =
    tap === 0 ? "tap to engage driver" :
    tap === 1 ? "tap to refresh telemetry" :
    tap === 2 ? "tap to lock & enter grand 13" :
    "driver locked · routed";

  const CtaIcon = tap === 0 ? Radio : tap === 1 ? RefreshCw : tap === 2 ? Trophy : Lock;

  return (
    <div
      ref={ref}
      className={cn(
        "hud-panel border overflow-hidden transition-all",
        tap === 3 ? "border-win/60 shadow-[0_0_40px_hsl(var(--win)/0.35)]" : "border-hud/30"
      )}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-hud/20 bg-secondary/40">
        <div className="flex items-center gap-2">
          <span className={cn("pulse-dot inline-block h-2 w-2 rounded-full", tap === 3 ? "bg-win" : "bg-win")} />
          <span className="font-mono text-[10px] tracking-[0.3em] text-hud">
            {tap === 3 ? "DRIVER LOCKED" : "DRIVER ONLINE"}
          </span>
        </div>
        <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-mono border", statusColor[driver.status])}>
          {driver.status}
        </span>
      </div>

      {/* Hero portrait */}
      <div className="relative aspect-[4/5] sm:aspect-[16/10] overflow-hidden">
        <img src={driver.image} alt={driver.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="hud-chip"><Zap className="h-3 w-3" /> {driver.league}</span>
        </div>

        {/* Voice prompt visual */}
        {voicePulse && currentPrompt && (
          <div className="absolute top-3 right-3 animate-fade-in">
            <div className="hud-chip border-win/60 text-win">
              <Radio className="h-3 w-3 animate-pulse" />
              voice prompt
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight">{driver.name}</div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
            {driver.tag}
          </div>

          {voicePulse && currentPrompt && (
            <div className="mt-3 animate-fade-in">
              <div className="flex items-center gap-1 mb-1.5">
                {[...Array(20)].map((_, i) => (
                  <span
                    key={i}
                    className="block w-0.5 bg-win rounded-full animate-pulse"
                    style={{
                      height: `${6 + Math.sin((i + Date.now() / 100) * 0.5) * 8 + Math.random() * 10}px`,
                      animationDelay: `${i * 40}ms`,
                    }}
                  />
                ))}
              </div>
              <p className="font-mono text-[11px] text-win/90 italic">"{currentPrompt}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 divide-x divide-border border-t border-hud/20">
        {[
          { label: "win%", value: driver.winPct },
          { label: "record", value: driver.record },
          { label: "units", value: driver.units },
        ].map((s) => (
          <div key={s.label} className="px-3 py-2.5">
            <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{s.label}</div>
            <div className="mt-0.5 text-lg font-bold text-win font-mono">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Slide-out game list */}
      {tap >= 1 && (
        <div className="border-t border-hud/20 bg-secondary/30 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-2 border-b border-hud/10">
            <span className="font-mono text-[10px] tracking-[0.3em] text-hud">
              {tap >= 2 ? "TELEMETRY · REFRESHED" : "TODAY'S BOARD"}
            </span>
            {tap >= 2 && (
              <span className="flex items-center gap-1 font-mono text-[9px] text-win">
                <RefreshCw className="h-2.5 w-2.5" /> live
              </span>
            )}
          </div>
          <div className="divide-y divide-border/40">
            {games.map((g, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{g.matchup}</div>
                  <div className="font-mono text-[10px] text-win uppercase tracking-wider mt-0.5">
                    {g.pick} · {g.odds}
                  </div>
                </div>
                <div className="ml-3 shrink-0">
                  <div className="text-[9px] font-mono uppercase text-muted-foreground text-right">conf</div>
                  <div className="font-mono text-sm font-bold text-hud">{g.confidence}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="p-3 border-t border-hud/20 bg-gradient-to-b from-transparent to-secondary/60">
        <Button
          onClick={handleTap}
          disabled={tap === 3}
          size="lg"
          className={cn(
            "w-full font-bold tracking-wider uppercase text-sm shadow-[0_0_30px_hsl(var(--win)/0.35)]",
            tap === 3
              ? "bg-win/20 text-win border border-win/40"
              : "bg-gradient-to-r from-win to-accent text-primary-foreground hover:opacity-90"
          )}
        >
          <CtaIcon className={cn("mr-2 h-4 w-4", tap === 1 && voicePulse && "animate-spin")} />
          {ctaLabel}
          {tap < 3 && <ChevronRight className="ml-1 h-4 w-4" />}
        </Button>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={cn(
                "h-1 rounded-full transition-all",
                tap >= n ? "w-6 bg-win" : "w-3 bg-border"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
