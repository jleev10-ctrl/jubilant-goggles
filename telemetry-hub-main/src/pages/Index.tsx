import { useRef, useState } from "react";
import { Activity, ChevronRight, Database, Flame, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DriverCard, type DriverData } from "@/components/DriverCard";
import { JoinModal } from "@/components/JoinModal";
import ironmike from "@/assets/ironmike.jpg";
import swoosh from "@/assets/swoosh.jpg";
import sarah from "@/assets/sarah.jpg";
import mlb from "@/assets/mlb.jpg";
import nhl from "@/assets/nhl.jpg";

const drivers: DriverData[] = [
  {
    id: "ironmike",
    name: 'iron "mike" k.',
    league: "NFL",
    tag: "professional · analytic",
    image: ironmike,
    record: "22-8",
    winPct: "73%",
    units: "+18.5u",
    status: "HOT",
    voicePrompt1: "board's loaded. raiders are the play. let's ride.",
    voicePrompt2: "telemetry refreshed. sharp money confirms. green light.",
    games: [
      { matchup: "Raiders @ Chiefs", pick: "RAIDERS +3.5", odds: "-110", confidence: 92 },
      { matchup: "Bills @ Dolphins", pick: "OVER 48.5", odds: "-105", confidence: 78 },
      { matchup: "49ers @ Seahawks", pick: "49ERS -6", odds: "-115", confidence: 71 },
    ],
    gamesV2: [
      { matchup: "Raiders @ Chiefs", pick: "RAIDERS +3", odds: "-108", confidence: 94 },
      { matchup: "Bills @ Dolphins", pick: "OVER 48.5", odds: "-110", confidence: 81 },
      { matchup: "49ers @ Seahawks", pick: "49ERS -6.5", odds: "-110", confidence: 73 },
    ],
  },
  {
    id: "sarah",
    name: '"stats" sarah',
    league: "Quant Desk",
    tag: "exclusive · vip",
    image: sarah,
    record: "25-5",
    winPct: "83%",
    units: "+29.5u",
    status: "LEADER",
    voicePrompt1: "model v4.2 locked in. reds money line is the edge.",
    voicePrompt2: "monte carlo rerun. edge widened. deploy capital.",
    games: [
      { matchup: "Reds @ Cubs", pick: "REDS ML", odds: "+167", confidence: 71 },
      { matchup: "Yankees @ Red Sox", pick: "UNDER 8.5", odds: "-105", confidence: 68 },
      { matchup: "Dodgers @ Padres", pick: "DODGERS -1.5", odds: "+125", confidence: 64 },
    ],
    gamesV2: [
      { matchup: "Reds @ Cubs", pick: "REDS ML", odds: "+158", confidence: 74 },
      { matchup: "Yankees @ Red Sox", pick: "UNDER 8.5", odds: "-110", confidence: 70 },
      { matchup: "Dodgers @ Padres", pick: "DODGERS -1.5", odds: "+118", confidence: 67 },
    ],
  },
  {
    id: "swoosh",
    name: '"swoosh" d. james',
    league: "NBA",
    tag: "high-energy · dynamic",
    image: swoosh,
    record: "15-15",
    winPct: "50%",
    units: "+2.1u",
    status: "COOLDOWN",
    voicePrompt1: "lakers at home off rest. underdog with juice.",
    voicePrompt2: "pace differential confirmed. lakers ML still live.",
    games: [
      { matchup: "Lakers vs Suns", pick: "LAKERS ML", odds: "+135", confidence: 66 },
      { matchup: "Celtics @ Heat", pick: "OVER 218.5", odds: "-110", confidence: 62 },
    ],
    gamesV2: [
      { matchup: "Lakers vs Suns", pick: "LAKERS ML", odds: "+128", confidence: 69 },
      { matchup: "Celtics @ Heat", pick: "OVER 219.5", odds: "-110", confidence: 64 },
    ],
  },
  {
    id: "mlb",
    name: 'rick "the baseburner" b.',
    league: "MLB",
    tag: "league overview · 11 yrs",
    image: mlb,
    record: "24-10",
    winPct: "71%",
    units: "+29.5u",
    status: "VERIFIED",
    voicePrompt1: "starter on full rest. dodgers ML is the call.",
    voicePrompt2: "bullpen scratch confirmed. dodgers edge widened.",
    games: [
      { matchup: "Dodgers @ Giants", pick: "DODGERS ML", odds: "-145", confidence: 76 },
      { matchup: "Astros @ Rangers", pick: "ASTROS -1.5", odds: "+115", confidence: 68 },
    ],
    gamesV2: [
      { matchup: "Dodgers @ Giants", pick: "DODGERS ML", odds: "-138", confidence: 79 },
      { matchup: "Astros @ Rangers", pick: "ASTROS -1.5", odds: "+110", confidence: 71 },
    ],
  },
  {
    id: "nhl",
    name: 'tommy "the mask" c.',
    league: "NHL",
    tag: "league overview · 9 yrs",
    image: nhl,
    record: "21-10",
    winPct: "68%",
    units: "+22.5u",
    status: "VERIFIED",
    voicePrompt1: "rangers goalie hot. money line is gold.",
    voicePrompt2: "line chemistry stacked. rangers ML reaffirmed.",
    games: [
      { matchup: "Rangers @ Bruins", pick: "RANGERS ML", odds: "+115", confidence: 70 },
      { matchup: "Oilers @ Flames", pick: "OVER 6.5", odds: "-110", confidence: 64 },
    ],
    gamesV2: [
      { matchup: "Rangers @ Bruins", pick: "RANGERS ML", odds: "+108", confidence: 73 },
      { matchup: "Oilers @ Flames", pick: "OVER 6.5", odds: "-115", confidence: 66 },
    ],
  },
];

interface Sportsbook {
  name: string;
  slug: string;
  url: string;
  color: string;
}

const sportsbooks: Sportsbook[] = [
  { name: "DraftKings", slug: "draftkings", url: "https://sportsbook.draftkings.com/", color: "from-[hsl(142_76%_45%)] to-[hsl(142_76%_35%)]" },
  { name: "FanDuel", slug: "fanduel", url: "https://sportsbook.fanduel.com/", color: "from-[hsl(220_90%_55%)] to-[hsl(220_90%_40%)]" },
  { name: "BetMGM", slug: "betmgm", url: "https://sports.betmgm.com/", color: "from-[hsl(40_90%_55%)] to-[hsl(30_90%_45%)]" },
  { name: "Caesars", slug: "caesars", url: "https://www.caesars.com/sportsbook-and-casino", color: "from-[hsl(0_75%_50%)] to-[hsl(0_75%_38%)]" },
  { name: "ESPN BET", slug: "espnbet", url: "https://espnbet.com/", color: "from-[hsl(15_90%_55%)] to-[hsl(0_85%_45%)]" },
];

const withUtm = (url: string, book: string, placement: string) => {
  const u = new URL(url);
  u.searchParams.set("utm_source", "synthetic_syndicate");
  u.searchParams.set("utm_medium", "affiliate");
  u.searchParams.set("utm_campaign", "telemetry_funnel");
  u.searchParams.set("utm_content", placement);
  u.searchParams.set("utm_term", book);
  return u.toString();
};

const grand13 = [
  { rank: 1, name: '"stats" sarah', league: "MLB", record: "25-5", winPct: "83%", units: "+29.5u", trend: "↑" },
  { rank: 2, name: 'rick "baseburner"', league: "MLB", record: "24-10", winPct: "71%", units: "+29.5u", trend: "↑" },
  { rank: 3, name: 'iron "mike" k.', league: "NFL", record: "22-8", winPct: "73%", units: "+18.5u", trend: "↑" },
  { rank: 4, name: 'tommy "mask"', league: "NHL", record: "21-10", winPct: "68%", units: "+22.5u", trend: "→" },
  { rank: 5, name: '"swoosh" james', league: "NBA", record: "15-15", winPct: "50%", units: "+2.1u", trend: "↓" },
  { rank: 6, name: '"the oracle"', league: "NFL", record: "19-11", winPct: "63%", units: "+14.2u", trend: "→" },
  { rank: 7, name: '"parlay pete"', league: "NBA", record: "18-12", winPct: "60%", units: "+12.8u", trend: "↑" },
  { rank: 8, name: '"ace" martinez', league: "MLB", record: "17-13", winPct: "57%", units: "+9.4u", trend: "↓" },
  { rank: 9, name: '"iceman" j.', league: "NHL", record: "16-12", winPct: "57%", units: "+8.1u", trend: "→" },
  { rank: 10, name: '"professor" d.', league: "NFL", record: "20-14", winPct: "59%", units: "+7.5u", trend: "↓" },
  { rank: 11, name: '"money" mike r.', league: "NBA", record: "14-14", winPct: "50%", units: "+3.2u", trend: "↑" },
  { rank: 12, name: '"diamond" dave', league: "MLB", record: "13-15", winPct: "46%", units: "-1.2u", trend: "↓" },
  { rank: 13, name: '"the rook" n.', league: "NHL", record: "11-14", winPct: "44%", units: "-3.8u", trend: "↓" },
];

const Index = () => {
  const [joinOpen, setJoinOpen] = useState(false);
  const grand13Ref = useRef<HTMLDivElement>(null);

  const [primary, ...etcDrivers] = drivers;

  const scrollToGrand13 = () => {
    grand13Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen w-full">
      {/* Sticky Header */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl">
        <div className="border-b border-border/60 bg-background/85">
          <div className="container flex h-12 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 grid place-items-center rounded-md hud-panel">
                <span className="font-mono text-xs font-bold text-hud tracking-tighter">SS</span>
              </div>
            </div>
            <div className="leading-tight text-center">
              <div className="font-mono text-sm font-bold tracking-[0.35em] text-hud">GRAND 13</div>
              <div className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground">the sports syndicate</div>
            </div>
            <Button
              onClick={() => setJoinOpen(true)}
              size="sm"
              className="h-8 px-3 font-bold uppercase tracking-widest text-[11px] bg-gradient-to-r from-win to-accent text-primary-foreground shadow-[0_0_18px_hsl(var(--win)/0.4)]"
            >
              join
            </Button>
          </div>
        </div>

        {/* Affiliates sub-header */}
        <div className="border-b border-border/60 bg-secondary/70">
          <div className="container flex items-center gap-1.5 overflow-x-auto py-1.5 px-4 no-scrollbar">
            <span className="shrink-0 font-mono text-[9px] tracking-[0.3em] text-muted-foreground uppercase pr-1">
              affiliates
            </span>
            {sportsbooks.map((b) => (
              <a
                key={b.name}
                href={withUtm(b.url, b.slug, "header_strip")}
                target="_blank"
                rel="sponsored noopener noreferrer"
                data-book={b.slug}
                className={cn(
                  "shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground",
                  "bg-gradient-to-b shadow-md shadow-black/40",
                  b.color
                )}
              >
                {b.name}
              </a>
            ))}
          </div>
        </div>
      </header>

      <div className="h-[88px]" />

      <main className="container max-w-2xl px-4 pb-24 space-y-6">
        {/* Consensus ticker */}
        <section className="hud-panel border border-hud/30 overflow-hidden">
          <div className="flex items-center">
            <div className="px-3 py-1.5 border-r border-hud/30 bg-secondary/60 shrink-0">
              <span className="font-mono text-[9px] tracking-[0.3em] text-hud">FEED</span>
            </div>
            <div className="relative flex-1 overflow-hidden py-1.5">
              <div className="ticker flex gap-8 whitespace-nowrap font-mono text-[11px] text-foreground/80 pl-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-8">
                    <span>4/5 PREDICT <span className="text-win">RAIDERS +3.5</span></span>
                    <span>NBA: <span className="text-hud">LAKERS ML</span></span>
                    <span>MLB SYNDICATE: <span className="text-win">REDS +167</span></span>
                    <span>NHL EDGE: <span className="text-hud">RANGERS ML</span></span>
                    <span>SHARP $: <span className="text-hot">78% RAIDERS</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PRIMARY DRIVER */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[10px] tracking-[0.3em] text-hud">★ FEATURED DRIVER</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              tap sequence active
            </span>
          </div>
          <DriverCard driver={primary} onFreeze={scrollToGrand13} />
        </section>

        {/* GRAND 13 LEADERBOARD */}
        <section ref={grand13Ref} className="hud-panel border border-hud/30 overflow-hidden scroll-mt-24">
          <div className="flex items-center justify-between px-4 py-3 border-b border-hud/20 bg-secondary/40">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-hud" />
              <span className="font-mono text-xs tracking-[0.3em] text-hud">GRAND 13</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">season 4.2 · live</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-border/50 text-[9px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2.5 text-left w-10">#</th>
                  <th className="px-3 py-2.5 text-left">driver</th>
                  <th className="px-3 py-2.5 text-center">win%</th>
                  <th className="px-3 py-2.5 text-center">units</th>
                  <th className="px-3 py-2.5 text-center w-10">trend</th>
                </tr>
              </thead>
              <tbody>
                {grand13.map((row) => (
                  <tr
                    key={row.rank}
                    className={cn(
                      "border-b border-border/30 transition-colors hover:bg-secondary/50",
                      row.rank <= 3 && "bg-secondary/30"
                    )}
                  >
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {row.rank <= 3 ? (
                        <span className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          row.rank === 1 && "bg-[hsl(45_100%_50%/0.2)] text-[hsl(45_100%_60%)]",
                          row.rank === 2 && "bg-[hsl(0_0%_75%/0.15)] text-[hsl(0_0%_75%)]",
                          row.rank === 3 && "bg-[hsl(30_70%_45%/0.15)] text-[hsl(30_70%_55%)]",
                        )}>
                          {row.rank}
                        </span>
                      ) : row.rank}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-foreground text-xs leading-tight">{row.name}</div>
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{row.league} · {row.record}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-win font-bold text-xs">{row.winPct}</td>
                    <td className={cn("px-3 py-2.5 text-center font-bold text-xs", row.units.startsWith("+") ? "text-win" : "text-hot")}>
                      {row.units}
                    </td>
                    <td className={cn(
                      "px-3 py-2.5 text-center text-base",
                      row.trend === "↑" && "text-win",
                      row.trend === "↓" && "text-hot",
                      row.trend === "→" && "text-muted-foreground",
                    )}>
                      {row.trend}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ETC drivers */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[10px] tracking-[0.3em] text-hud">ETC · MORE DRIVERS</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              {etcDrivers.length} active
            </span>
          </div>
          <div className="space-y-5">
            {etcDrivers.map((d) => (
              <DriverCard key={d.id} driver={d} onFreeze={scrollToGrand13} />
            ))}
          </div>
        </section>

        {/* SYNDICATE EDGE */}
        <section className="hud-panel border border-hud/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-hud" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-hud">SYNDICATE EDGE</span>
          </div>
          <h3 className="text-lg font-bold mb-1">proprietary insights · toto historical</h3>
          <p className="text-xs text-muted-foreground mb-4 font-mono">
            cross-league correlation index · 12-season backtest
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "edge index", value: "+14.2%", sub: "vs market" },
              { label: "toto ROI", value: "+22.8%", sub: "12-season" },
              { label: "win rate", value: "67.4%", sub: "L1000" },
            ].map((s) => (
              <div key={s.label} className="rounded-md border border-hud/20 bg-secondary/40 p-2.5">
                <div className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground">{s.label}</div>
                <div className="mt-0.5 text-base font-bold text-win font-mono">{s.value}</div>
                <div className="text-[8px] font-mono text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* AFFILIATES PARLAY · final CTA */}
        <section className="hud-panel border border-primary/40 p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-hot" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-hot">AFFILIATES PARLAY</span>
          </div>
          <h3 className="text-xl font-bold mb-1">deploy the syndicate edge</h3>
          <p className="text-xs text-muted-foreground mb-4 font-mono">one tap · routes to your book</p>
          <div className="grid grid-cols-2 gap-2">
            {sportsbooks.map((b) => (
              <a
                key={b.name}
                href={withUtm(b.url, b.slug, "footer_parlay")}
                target="_blank"
                rel="sponsored noopener noreferrer"
                data-book={b.slug}
                className={cn(
                  "rounded-md px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground",
                  "bg-gradient-to-b shadow-lg shadow-black/40 hover:scale-[1.02] transition-transform",
                  "flex items-center justify-center gap-1",
                  b.color
                )}
              >
                {b.name} <ChevronRight className="h-3 w-3" />
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="h-3 w-3 text-hud" />
          <span>the sports syndicate · telemetry v4.2</span>
        </div>
        <div>21+ · play responsibly · 1-800-gambler</div>
      </footer>

      <JoinModal open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
};

export default Index;
