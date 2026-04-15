"""
Synthetic Syndicate — Voice Bridge
===================================
Feeds syndicate_scraper.py JSON output directly to ElevenLabs TTS.
Run after the scraper, or chain them together.

Usage:
    python voice_bridge.py --file syndicate_mlb_20250409_1430.json
    python voice_bridge.py --sport mlb   # scrape + speak in one command

Requirements:
    pip install requests
    EL_API_KEY and EL_VOICE_ID set below (or via env vars)
"""

import os
import json
import argparse
import asyncio
import requests
from pathlib import Path

# ── Config (override with env vars for production) ───────────────────────────
EL_API_KEY   = os.getenv("EL_API_KEY",  "YOUR_ELEVENLABS_API_KEY")
EL_VOICE_ID  = os.getenv("EL_VOICE_ID", "YOUR_VOICE_ID")
EL_MODEL     = "eleven_turbo_v2_5"   # fastest; swap to eleven_multilingual_v2 for quality
EL_STABILITY = 0.50
EL_SIMILARITY= 0.75
EL_ENDPOINT  = f"https://api.elevenlabs.io/v1/text-to-speech/{EL_VOICE_ID}"


def speak(text: str, output_path: str = "output.mp3") -> bool:
    """
    Send text to ElevenLabs, save MP3, return True on success.
    Plug this function into voice.html's fetch() call for the browser version.
    """
    headers = {
        "xi-api-key":   EL_API_KEY,
        "Content-Type": "application/json",
        "Accept":       "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": EL_MODEL,
        "voice_settings": {
            "stability":        EL_STABILITY,
            "similarity_boost": EL_SIMILARITY,
        },
    }

    res = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{EL_VOICE_ID}",
        headers=headers,
        json=payload,
        timeout=30,
    )

    if res.status_code == 200:
        with open(output_path, "wb") as f:
            f.write(res.content)
        print(f"  ✓ Saved → {output_path}")
        return True
    else:
        print(f"  ✗ ElevenLabs error {res.status_code}: {res.text[:200]}")
        return False


def build_full_broadcast(data: dict) -> str:
    """
    Stitch all game voice scripts into one broadcast-style intro.
    Designed to mirror what the Syndicate modal plays per expert card.
    """
    sport  = data.get("sport", "Sports")
    games  = data.get("games", [])
    date   = data.get("scraped_at", "")[:10]

    lines = [
        f"Synthetic Syndicate live feed. {sport} telemetry for {date}.",
        f"{len(games)} games on the board tonight.",
    ]

    for g in games:
        script = g.get("voice_script")
        if script:
            lines.append(script)

    lines.append("That's your Syndicate feed. Stay sharp.")
    return " ".join(lines)


def run_from_file(filepath: str):
    """Load a scraper JSON file and speak each game."""
    with open(filepath) as f:
        data = json.load(f)

    games = data.get("games", [])
    if not games:
        print("No games found in JSON.")
        return

    print(f"\n[Voice Bridge] {len(games)} games loaded from {filepath}\n")

    # Option A: one MP3 per game
    for i, game in enumerate(games):
        text  = game.get("voice_script", "")
        away  = game.get("away", "away")
        home  = game.get("home", "home")
        fname = f"game_{i+1}_{away.replace(' ','_')}_at_{home.replace(' ','_')}.mp3"
        print(f"  Speaking: {away} @ {home}")
        speak(text, fname)

    # Option B: full broadcast in one file
    broadcast = build_full_broadcast(data)
    print("\n[Voice Bridge] Generating full broadcast MP3…")
    speak(broadcast, "syndicate_broadcast.mp3")


def run_scrape_and_speak(sport: str):
    """Chain scraper → voice bridge in one call."""
    from syndicate_scraper import run as scrape
    data = asyncio.run(scrape(sport))
    broadcast = build_full_broadcast(data)
    print("\n[Voice Bridge] Sending broadcast to ElevenLabs…")
    speak(broadcast, f"syndicate_broadcast_{sport}.mp3")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Syndicate Voice Bridge")
    parser.add_argument("--file",  help="Path to scraper JSON output")
    parser.add_argument("--sport", choices=["mlb","nhl","nba","nfl"],
                        help="Scrape + speak in one command")
    args = parser.parse_args()

    if args.file:
        run_from_file(args.file)
    elif args.sport:
        run_scrape_and_speak(args.sport)
    else:
        print("Provide --file <path.json> or --sport <mlb|nhl|nba|nfl>")
