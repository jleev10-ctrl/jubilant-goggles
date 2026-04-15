"""
Synthetic Syndicate — VegasInsider Scraper
==========================================
Targets: Consensus Picks + Live Odds (MLB default, switchable)
Output:  JSON → ready to pipe into ElevenLabs voice integration

Usage:
    python syndicate_scraper.py                  # MLB (default)
    python syndicate_scraper.py --sport nhl
    python syndicate_scraper.py --sport nba
    python syndicate_scraper.py --sport nfl

Requirements:
    pip install playwright beautifulsoup4 lxml
    playwright install chromium
"""

import asyncio
import json
import re
import argparse
from datetime import datetime, timezone
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

# ── Sport config ────────────────────────────────────────────────────────────
SPORT_CONFIG = {
    "mlb": {
        "consensus_url": "https://www.vegasinsider.com/mlb/consensus-picks/",
        "odds_url":      "https://www.vegasinsider.com/mlb/odds/las-vegas/",
        "label": "MLB",
    },
    "nhl": {
        "consensus_url": "https://www.vegasinsider.com/nhl/consensus-picks/",
        "odds_url":      "https://www.vegasinsider.com/nhl/odds/las-vegas/",
        "label": "NHL",
    },
    "nba": {
        "consensus_url": "https://www.vegasinsider.com/nba/consensus-picks/",
        "odds_url":      "https://www.vegasinsider.com/nba/odds/las-vegas/",
        "label": "NBA",
    },
    "nfl": {
        "consensus_url": "https://www.vegasinsider.com/nfl/consensus-picks/",
        "odds_url":      "https://www.vegasinsider.com/nfl/odds/las-vegas/",
        "label": "NFL",
    },
}

# ── Playwright helpers ───────────────────────────────────────────────────────
async def fetch_page(browser, url: str) -> str:
    """Load a page with JS rendered, return full HTML."""
    page = await browser.new_page()
    await page.set_extra_http_headers({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    })
    try:
        await page.goto(url, wait_until="networkidle", timeout=30_000)
        # Wait for the main data grid to appear
        await page.wait_for_selector("table, .consensus-table, .odds-table", timeout=15_000)
    except Exception:
        pass  # Grab whatever is loaded
    html = await page.content()
    await page.close()
    return html


# ── Consensus parser ─────────────────────────────────────────────────────────
def parse_consensus(html: str) -> list[dict]:
    """
    Extract matchup consensus % from VegasInsider consensus page.
    Returns list of game dicts.
    """
    soup = BeautifulSoup(html, "lxml")
    games = []

    # VegasInsider renders consensus in <table> rows grouped by matchup
    tables = soup.find_all("table")
    for table in tables:
        rows = table.find_all("tr")
        current_game = None

        for row in rows:
            cells = [td.get_text(strip=True) for td in row.find_all(["td", "th"])]
            if not cells:
                continue

            # Detect matchup row (contains "@", "vs", or standalone "at")
            raw = " ".join(cells)
            if " @ " in raw or " vs " in raw or re.search(r"\bat\b", raw):
                teams = re.split(r'\s+@\s+|\s+vs\.?\s+|\s+at\s+', raw, maxsplit=1)
                if len(teams) == 2:
                    current_game = {
                        "away": teams[0].strip(),
                        "home": teams[1].strip(),
                        "spread_consensus": None,
                        "total_consensus": None,
                        "ml_consensus": None,
                    }
                    games.append(current_game)

            # Detect % values in subsequent rows
            elif current_game:
                pcts = re.findall(r'(\d{1,3})%', raw)
                labels = raw.lower()
                if "spread" in labels and pcts:
                    current_game["spread_consensus"] = {
                        "away_pct": int(pcts[0]),
                        "home_pct": int(pcts[1]) if len(pcts) > 1 else 100 - int(pcts[0]),
                    }
                elif ("total" in labels or "over" in labels or "under" in labels) and pcts:
                    current_game["total_consensus"] = {
                        "over_pct":  int(pcts[0]),
                        "under_pct": int(pcts[1]) if len(pcts) > 1 else 100 - int(pcts[0]),
                    }
                elif "money" in labels and pcts:
                    current_game["ml_consensus"] = {
                        "away_pct": int(pcts[0]),
                        "home_pct": int(pcts[1]) if len(pcts) > 1 else 100 - int(pcts[0]),
                    }

    # Fallback: try div/span structure (newer VI layout)
    if not games:
        games = _parse_consensus_divs(soup)

    return games


def _parse_consensus_divs(soup: BeautifulSoup) -> list[dict]:
    """Fallback parser for div-based layouts."""
    games = []
    matchup_blocks = soup.find_all(
        attrs={"class": re.compile(r"matchup|game-row|consensus-row", re.I)}
    )
    for block in matchup_blocks:
        text = block.get_text(" ", strip=True)
        teams = re.split(r'\s+@\s+|\s+vs\.?\s+', text, maxsplit=1)
        pcts = re.findall(r'(\d{1,3})%', text)
        if len(teams) == 2:
            game = {
                "away": teams[0].strip(),
                "home": re.sub(r'\d.*', '', teams[1]).strip(),
                "spread_consensus": {"away_pct": int(pcts[0]), "home_pct": int(pcts[1])} if len(pcts) >= 2 else None,
                "total_consensus":  {"over_pct":  int(pcts[2]), "under_pct": int(pcts[3])} if len(pcts) >= 4 else None,
                "ml_consensus": None,
            }
            games.append(game)
    return games


# ── Odds / line movement parser ──────────────────────────────────────────────
def parse_odds(html: str) -> list[dict]:
    """
    Extract opening line, current line, and movement from odds page.
    Returns list of game dicts with line movement data.
    """
    soup = BeautifulSoup(html, "lxml")
    games = []

    tables = soup.find_all("table")
    for table in tables:
        rows = table.find_all("tr")
        current_game = None

        for row in rows:
            cells = [td.get_text(strip=True) for td in row.find_all(["td", "th"])]
            raw = " ".join(cells)

            if " @ " in raw or re.search(r'\b(at)\b', raw):
                teams = re.split(r'\s+@\s+|\s+at\s+', raw, maxsplit=1)
                if len(teams) == 2:
                    current_game = {
                        "away": teams[0].strip(),
                        "home": re.sub(r'\s+\d.*', '', teams[1]).strip(),
                        "spread": {"open": None, "current": None, "movement": None},
                        "total": {"open": None, "current": None, "movement": None},
                        "moneyline": {"away_open": None, "away_current": None,
                                      "home_open": None, "home_current": None},
                    }
                    games.append(current_game)

            elif current_game:
                # Extract spread numbers e.g. "-1.5", "+3"
                spreads = re.findall(r'[+-]?\d+\.?\d*', raw)
                if spreads and "open" in raw.lower():
                    current_game["spread"]["open"] = spreads[0]
                elif spreads and len(spreads) >= 1 and current_game["spread"]["open"]:
                    current_game["spread"]["current"] = spreads[0]
                    _calc_movement(current_game["spread"])

                # Extract totals e.g. "O/U 8.5"
                totals = re.findall(r'(?:o/?u\s*)?(\d{1,3}\.?\d?)', raw, re.I)
                if "total" in raw.lower() and totals:
                    if not current_game["total"]["open"]:
                        current_game["total"]["open"] = totals[0]
                    else:
                        current_game["total"]["current"] = totals[0]
                        _calc_movement(current_game["total"])

    # Fallback
    if not games:
        games = _parse_odds_divs(soup)

    return games


def _calc_movement(line: dict):
    """Tag line as 'up', 'down', or 'flat' vs open."""
    try:
        o = float(line["open"])
        c = float(line["current"])
        if c > o:
            line["movement"] = "up"
        elif c < o:
            line["movement"] = "down"
        else:
            line["movement"] = "flat"
    except (TypeError, ValueError):
        line["movement"] = "unknown"


def _parse_odds_divs(soup: BeautifulSoup) -> list[dict]:
    """Fallback div parser for odds."""
    games = []
    blocks = soup.find_all(attrs={"class": re.compile(r"game|matchup|odds-row", re.I)})
    for block in blocks:
        text = block.get_text(" ", strip=True)
        teams = re.split(r'\s+@\s+|\s+vs\.?\s+', text, maxsplit=1)
        nums = re.findall(r'[+-]?\d+\.?\d*', text)
        if len(teams) == 2 and nums:
            games.append({
                "away": teams[0].strip(),
                "home": re.sub(r'\d.*', '', teams[1]).strip(),
                "spread": {"open": nums[0] if nums else None,
                           "current": nums[1] if len(nums) > 1 else None,
                           "movement": None},
                "total": {"open": nums[2] if len(nums) > 2 else None,
                          "current": nums[3] if len(nums) > 3 else None,
                          "movement": None},
                "moneyline": {},
            })
    return games


# ── Merge consensus + odds ────────────────────────────────────────────────────
def merge_games(consensus: list[dict], odds: list[dict]) -> list[dict]:
    """Join consensus and odds dicts by fuzzy team name match."""
    merged = []
    used_odds = set()

    for c_game in consensus:
        best_match = None
        best_score = 0

        for i, o_game in enumerate(odds):
            if i in used_odds:
                continue
            # Simple token overlap scoring
            c_tokens = set((c_game["away"] + " " + c_game["home"]).lower().split())
            o_tokens = set((o_game["away"] + " " + o_game["home"]).lower().split())
            score = len(c_tokens & o_tokens)
            if score > best_score:
                best_score = score
                best_match = (i, o_game)

        if best_match and best_score >= 1:
            idx, o_game = best_match
            used_odds.add(idx)
            merged.append({**c_game, **o_game,
                           "away": c_game["away"], "home": c_game["home"],
                           "spread_consensus": c_game.get("spread_consensus"),
                           "total_consensus":  c_game.get("total_consensus"),
                           "ml_consensus":     c_game.get("ml_consensus"),
                           "spread": o_game.get("spread"),
                           "total":  o_game.get("total"),
                           "moneyline": o_game.get("moneyline")})
        else:
            merged.append(c_game)

    # Append unmatched odds games
    for i, o_game in enumerate(odds):
        if i not in used_odds:
            merged.append(o_game)

    return merged


# ── Voice script builder ──────────────────────────────────────────────────────
def build_voice_script(game: dict, sport: str) -> str:
    """
    Generate the ElevenLabs-ready narration string.
    Example: "The public is heavy on the Dodgers at 75%, but the line just
              moved toward the Padres. Watch for sharp money."
    """
    away = game.get("away", "Away team")
    home = game.get("home", "Home team")
    parts = [f"{sport} matchup: {away} at {home}."]

    sc = game.get("spread_consensus")
    if sc:
        leader = away if sc["away_pct"] > sc["home_pct"] else home
        pct = max(sc["away_pct"], sc["home_pct"])
        parts.append(f"The public is {pct}% on {leader} against the spread.")

    tc = game.get("total_consensus")
    if tc:
        side = "the over" if tc["over_pct"] > tc["under_pct"] else "the under"
        pct = max(tc["over_pct"], tc["under_pct"])
        parts.append(f"{pct}% of bettors like {side}.")

    spread = game.get("spread", {})
    if spread and spread.get("movement") and spread["movement"] != "flat":
        direction = "toward" if spread["movement"] == "down" else "away from"
        fav = away  # simplification; refine with actual favourite detection
        parts.append(
            f"But the spread has moved {direction} {fav} "
            f"from {spread.get('open','?')} to {spread.get('current','?')}. "
            f"Watch for sharp money on the other side."
        )

    return " ".join(parts)


# ── Main ─────────────────────────────────────────────────────────────────────
async def run(sport: str = "mlb"):
    cfg = SPORT_CONFIG[sport]
    print(f"\n[Syndicate Scraper] Fetching {cfg['label']} data…\n")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)

        print(f"  → Consensus: {cfg['consensus_url']}")
        consensus_html = await fetch_page(browser, cfg["consensus_url"])

        print(f"  → Odds:      {cfg['odds_url']}")
        odds_html = await fetch_page(browser, cfg["odds_url"])

        await browser.close()

    consensus_games = parse_consensus(consensus_html)
    odds_games      = parse_odds(odds_html)
    games           = merge_games(consensus_games, odds_games)

    # Attach voice scripts
    for g in games:
        g["voice_script"]  = build_voice_script(g, cfg["label"])
        g["sport"]         = sport.upper()
        g["scraped_at"]    = datetime.now(timezone.utc).isoformat()

    output = {
        "sport":      cfg["label"],
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "game_count": len(games),
        "games":      games,
    }

    # Print + save
    pretty = json.dumps(output, indent=2)
    print(pretty)

    fname = f"syndicate_{sport}_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
    with open(fname, "w") as f:
        f.write(pretty)
    print(f"\n[Syndicate Scraper] Saved → {fname}")
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Synthetic Syndicate VegasInsider Scraper")
    parser.add_argument("--sport", choices=["mlb","nhl","nba","nfl"], default="mlb")
    args = parser.parse_args()
    asyncio.run(run(args.sport))
