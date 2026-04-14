#!/usr/bin/env python3
"""
Generate AI descriptions for all 234 Tamil Nadu assembly constituencies.

Data sources:
  - PayloadCMS REST API: voters, election history (real data, no hallucination)
  - Wikipedia API: geographic/demographic background text
  - AWS Bedrock: Meta Llama 3.1 70B Instruct for generation

Output:
  - data/assembly-descriptions.json
  - data/assembly-descriptions.csv

Usage:
  # Pass AWS credentials directly (no .env.local needed)
  python scripts/generate_assembly_descriptions.py \
    --aws-key=AKIA... --aws-secret=... --aws-region=us-east-1

  python scripts/generate_assembly_descriptions.py --dry-run --only=ac001
  python scripts/generate_assembly_descriptions.py --only=ac001,ac005
  python scripts/generate_assembly_descriptions.py --force
  python scripts/generate_assembly_descriptions.py --server-url=http://localhost:3000
"""

import argparse
import boto3
import csv
import json
import os
import sys
import time
import threading
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from dotenv import dotenv_values

# ─── Config ───────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
ENV_FILE = PROJECT_DIR / ".env.local"
OUTPUT_JSON = PROJECT_DIR / "data" / "assembly-descriptions.json"
OUTPUT_CSV = PROJECT_DIR / "data" / "assembly-descriptions.csv"

BEDROCK_MODEL_ID = "us.meta.llama3-1-70b-instruct-v1:0"
REQUIRED_AWS_REGION = "us-east-1"

WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/w/api.php"
WIKIPEDIA_HEADERS = {"User-Agent": "IndiaStats-CMS/1.0 (https://indiastats.org)"}

DELAY_BETWEEN_CALLS = 1.5  # seconds between Bedrock calls
BEDROCK_MAX_RETRIES = 3
BEDROCK_RETRY_DELAYS = [5, 15, 45]  # exponential backoff seconds

CSV_COLUMNS = [
    "assemblyId", "slug", "nameEnglish", "nameBilingual", "districtName",
    "zoneName", "totalVoters", "currentMla", "reservationType",
    "wikipediaTitle", "wikipediaFound", "metaDescription", "description", "generatedAt",
]

# ─── Env loading ──────────────────────────────────────────────────────────────

def load_env(args) -> dict:
    """
    Build config from (in order of priority):
      1. CLI args (--aws-key, --aws-secret, --aws-region, --server-url)
      2. Process environment variables
      3. .env.local file (fallback)
    """
    env = {}

    # 3. .env.local as base (lowest priority)
    if ENV_FILE.exists():
        env = dotenv_values(str(ENV_FILE))

    # 2. Process environment variables override file values
    for key in ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "NEXT_PUBLIC_SERVER_URL"]:
        if key in os.environ:
            env[key] = os.environ[key]

    # 1. CLI args override everything
    if args.aws_region:
        env["AWS_REGION"] = args.aws_region
    if args.aws_key:
        env["AWS_ACCESS_KEY_ID"] = args.aws_key
    if args.aws_secret:
        env["AWS_SECRET_ACCESS_KEY"] = args.aws_secret
    if args.aws_session_token:
        env["AWS_SESSION_TOKEN"] = args.aws_session_token
    if args.server_url:
        env["NEXT_PUBLIC_SERVER_URL"] = args.server_url

    env.setdefault("AWS_REGION", REQUIRED_AWS_REGION)
    env.setdefault("NEXT_PUBLIC_SERVER_URL", "http://localhost:3000")

    # Validate
    region = env.get("AWS_REGION", "")
    if region != REQUIRED_AWS_REGION:
        print(f"ERROR: AWS_REGION must be '{REQUIRED_AWS_REGION}' for Llama 3.1 70B.")
        print(f"       Got: '{region}'")
        sys.exit(1)

    if not env.get("AWS_ACCESS_KEY_ID"):
        print("ERROR: AWS_ACCESS_KEY_ID not set.")
        print("       Use --aws-key=AKIA... or set AWS_ACCESS_KEY_ID env var")
        sys.exit(1)

    if not env.get("AWS_SECRET_ACCESS_KEY"):
        print("ERROR: AWS_SECRET_ACCESS_KEY not set.")
        print("       Use --aws-secret=... or set AWS_SECRET_ACCESS_KEY env var")
        sys.exit(1)

    return env

# ─── PayloadCMS API ───────────────────────────────────────────────────────────

def fetch_all_assemblies(base_url: str) -> list[dict]:
    """Fetch all 234 assemblies from PayloadCMS REST API."""
    url = f"{base_url}/api/assemblies"
    params = {"limit": 300, "pagination": "false", "depth": 0}
    print("Fetching all assemblies from PayloadCMS...")
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    assemblies = data.get("docs", [])
    print(f"  Fetched {len(assemblies)} assemblies.")
    return assemblies


def fetch_election_history(base_url: str, assembly_id: str) -> list[dict]:
    """Fetch election history for an assembly, returning top winner per year."""
    url = f"{base_url}/api/election-history"
    params = {
        "where[assemblyId][equals]": assembly_id,
        "sort": "-electionYear",
        "limit": 50,
        "depth": 0,
        "pagination": "false",
    }
    try:
        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        records = resp.json().get("docs", [])
    except Exception as e:
        print(f"    WARNING: Could not fetch election history for {assembly_id}: {e}")
        return []

    # Group by year, pick the top candidate (highest votes)
    by_year: dict[str, dict] = {}
    for rec in records:
        year = str(rec.get("electionYear", ""))
        if not year:
            continue
        if year not in by_year or rec.get("candidateVotes", 0) > by_year[year].get("candidateVotes", 0):
            by_year[year] = rec

    # Sort by year descending, take last 5
    sorted_years = sorted(by_year.keys(), reverse=True)[:5]
    results = []
    for year in sorted_years:
        rec = by_year[year]
        total_polled = rec.get("votesPolled") or rec.get("totalVoters") or 0
        votes = rec.get("candidateVotes", 0)
        vote_share = round(votes / total_polled * 100, 1) if total_polled > 0 else 0

        # Calculate margin: winner votes - runner up votes
        runner_up_votes = 0
        for r in records:
            if str(r.get("electionYear", "")) == year and r.get("candidateVotes", 0) != votes:
                if r.get("candidateVotes", 0) > runner_up_votes:
                    runner_up_votes = r.get("candidateVotes", 0)
        margin = votes - runner_up_votes

        results.append({
            "year": year,
            "winner": rec.get("candidateName", "Unknown"),
            "party": rec.get("candidateParty", "Unknown"),
            "votes": votes,
            "voteShare": vote_share,
            "margin": margin,
        })
    return results

# ─── Wikipedia API ────────────────────────────────────────────────────────────

def search_wikipedia(english_name: str) -> str | None:
    """Search Wikipedia for the assembly constituency article title."""
    # Try most specific query first
    queries = [
        f"{english_name} assembly constituency Tamil Nadu",
        f"{english_name} constituency Tamil Nadu",
    ]
    for query in queries:
        try:
            params = {
                "action": "query",
                "list": "search",
                "srsearch": query,
                "srlimit": 5,
                "format": "json",
            }
            resp = requests.get(
                WIKIPEDIA_SEARCH_URL, params=params,
                headers=WIKIPEDIA_HEADERS, timeout=10
            )
            resp.raise_for_status()
            results = resp.json().get("query", {}).get("search", [])
            for result in results:
                title = result.get("title", "")
                title_lower = title.lower()
                name_lower = english_name.lower()
                # Accept if title is clearly about this constituency
                if ("constituency" in title_lower or "assembly" in title_lower) and name_lower in title_lower:
                    return title
                # Also accept direct name match with constituency
                if "constituency" in title_lower and any(
                    word in title_lower for word in name_lower.split()[:2] if len(word) > 3
                ):
                    return title
        except Exception as e:
            print(f"    WARNING: Wikipedia search error for '{english_name}': {e}")
    return None


def fetch_wikipedia_extract(page_title: str) -> str:
    """
    Fetch full plain-text article content from Wikipedia (not just intro).
    Includes geography, history, demographics, notable people sections.
    """
    try:
        params = {
            "action": "query",
            "prop": "extracts",
            # No exintro=1 — fetch full article for maximum context
            "explaintext": "1",
            "exsectionformat": "plain",  # clean section breaks
            "titles": page_title,
            "format": "json",
        }
        resp = requests.get(
            WIKIPEDIA_SEARCH_URL, params=params,
            headers=WIKIPEDIA_HEADERS, timeout=10
        )
        resp.raise_for_status()
        pages = resp.json().get("query", {}).get("pages", {})
        for page in pages.values():
            extract = page.get("extract", "")
            if not extract:
                return ""
            # Remove excessive whitespace / blank lines from section headers
            lines = [line.strip() for line in extract.splitlines()]
            cleaned = "\n".join(line for line in lines if line)
            # Cap at 4000 chars (2x previous) for richer context
            return cleaned[:4000]
    except Exception as e:
        print(f"    WARNING: Wikipedia extract error for '{page_title}': {e}")
    return ""


def fetch_wikipedia_content(english_name: str) -> tuple[str | None, str, bool]:
    """Return (title, extract, found) for an assembly constituency."""
    title = search_wikipedia(english_name)
    if not title:
        return None, "", False
    extract = fetch_wikipedia_extract(title)
    if not extract:
        return title, "", False
    return title, extract, True

# ─── Name helpers ─────────────────────────────────────────────────────────────

def extract_english_name(bilingual_name: str) -> str:
    """'சென்னை / CHENNAI' → 'Chennai'"""
    if " / " in bilingual_name:
        english = bilingual_name.split(" / ", 1)[1].strip()
    else:
        english = bilingual_name.strip()
    # Title case: "ANNA NAGAR" → "Anna Nagar"
    return english.title()


def get_reservation_type(voters: dict | None) -> str:
    if not voters:
        return "General"
    if voters.get("isReservedAc"):
        return "SC/ST Reserved"
    return "General"


def get_mla_info(elected_mla: dict | list | None) -> str:
    if not elected_mla:
        return "Unknown"
    # May be a list of historical MLAs or a single dict
    if isinstance(elected_mla, list):
        if not elected_mla:
            return "Unknown"
        # Take the most recent (first in list or by year)
        latest = elected_mla[0]
        if isinstance(latest, dict):
            name = latest.get("mlaName") or latest.get("name") or "Unknown"
            party = latest.get("party") or latest.get("mlaParty") or ""
            return f"{name} ({party})" if party else name
    if isinstance(elected_mla, dict):
        name = elected_mla.get("mlaName") or elected_mla.get("name") or "Unknown"
        party = elected_mla.get("party") or elected_mla.get("mlaParty") or ""
        return f"{name} ({party})" if party else name
    return "Unknown"

# ─── Bedrock ──────────────────────────────────────────────────────────────────

def build_prompt(
    assembly: dict,
    english_name: str,
    election_history: list[dict],
    wiki_extract: str,
    wiki_found: bool,
) -> str:
    """
    Build the Llama 3.1 chat-format prompt.
    Generates two outputs for SEO:
      META_DESCRIPTION: 150-160 chars for <meta name="description">
      DESCRIPTION: 300-400 word page content with natural keyword usage
    """
    voters = assembly.get("voters") or {}
    total_voters = voters.get("total", 0)
    male_voters = voters.get("male", 0)
    female_voters = voters.get("female", 0)
    booths = assembly.get("noOfBooths", 0)
    district = extract_english_name(assembly.get("districtName", "Unknown"))
    zone = assembly.get("zoneName") or "N/A"
    reservation = get_reservation_type(voters)
    mla = get_mla_info(assembly.get("electedMla"))
    assembly_id = assembly.get("assemblyId", "")

    # Format election history — most recent first
    if election_history:
        history_lines = []
        for h in election_history:
            line = (
                f"- {h['year']}: {h['winner']} ({h['party']}) — "
                f"{h['votes']:,} votes ({h['voteShare']}%), "
                f"margin: {h['margin']:,}"
            )
            history_lines.append(line)
        history_text = "\n".join(history_lines)
        latest = election_history[0]
        latest_winner = latest["winner"]
        latest_party = latest["party"]
        latest_year = latest["year"]
    else:
        history_text = "- No election history available"
        latest_winner = mla
        latest_party = ""
        latest_year = "2021"

    # Wikipedia section
    wiki_section = ""
    if wiki_found and wiki_extract:
        wiki_section = f"\nWikipedia article content:\n{wiki_extract}\n"

    # SEO target keywords for this page
    keywords = [
        f"{english_name} assembly constituency",
        f"{english_name} constituency Tamil Nadu",
        f"{english_name} MLA",
        f"{english_name} election results",
        f"{district} district assembly",
        f"{english_name} voter data",
    ]
    keywords_str = ", ".join(f'"{k}"' for k in keywords)

    prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are an expert political journalist and SEO content writer specialising in Tamil Nadu elections. You write for IndiaStats.org — a website providing Tamil Nadu assembly constituency election data, voter statistics, MLA history, and demographic insights. Your content must be factual, engaging, and optimised for Google search. Use ONLY the verified data provided — never invent election figures.
<|eot_id|><|start_header_id|>user<|end_header_id|>
Generate SEO-optimised content for the {english_name} assembly constituency page on IndiaStats.org.

=== VERIFIED CONSTITUENCY DATA ===
Assembly ID: {assembly_id}
Name: {english_name} Assembly Constituency
District: {district} District, Tamil Nadu
Zone: {zone}
Total Registered Voters (2025): {total_voters:,}
  - Male voters: {male_voters:,}
  - Female voters: {female_voters:,}
Polling Booths: {booths}
Reservation Status: {reservation}
Current MLA (2021): {mla}

=== VERIFIED ELECTION HISTORY (use exact figures) ===
{history_text}
{wiki_section}
=== SEO KEYWORDS TO NATURALLY INCLUDE ===
Primary: {keywords[0]}, {keywords[1]}
Secondary: {keywords[2]}, {keywords[3]}, {keywords[4]}

=== OUTPUT FORMAT (follow exactly) ===
Write two sections separated by the exact markers below:

META_DESCRIPTION:
[A single sentence, 150-160 characters exactly. Must include constituency name, district, and a compelling hook about election data or political history. Target Google searchers looking for "{english_name} assembly constituency". Do not exceed 160 characters.]

DESCRIPTION:
[3-4 paragraphs, 300-400 words total. Writing style: professional, factual, BBC News-style. Structure:
Paragraph 1 — Geographic & demographic overview: location in {district} district, taluks covered, total voters ({total_voters:,}), male/female voter split, number of booths, SC/ST reservation status if applicable, any notable geographic features from Wikipedia.
Paragraph 2 — Political history: narrate the election results using exact figures from the verified history above. Mention {latest_winner} ({latest_party})'s {latest_year} win. Describe the broader political trend (DMK vs AIADMK dominance, any upsets).
Paragraph 3 — Significance & context: political importance of this constituency, notable facts about the area from Wikipedia (industries, historical sites, demographics). If Wikipedia mentions specific localities, include them.
Paragraph 4 (optional) — Voter demographics & access: voter turnout trends, polling booth count ({booths}), any infrastructure or accessibility notes from Wikipedia.
Rules: naturally weave in the SEO keywords. No headers. No bullet points. Do not write "According to Wikipedia". Do not invent any statistics not provided above.]
<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""
    return prompt


class TokenExpiredError(Exception):
    """Raised when AWS temporary credentials have expired."""
    pass


def invoke_bedrock(client, prompt: str, dry_run: bool = False) -> str:
    """Call AWS Bedrock Llama 3.1 70B with retry logic."""
    if dry_run:
        return "[DRY RUN — Bedrock not called]"

    body = json.dumps({
        "prompt": prompt,
        "max_gen_len": 1024,  # increased for richer 300-400 word output + meta description
        "temperature": 0.3,
        "top_p": 0.9,
    })

    for attempt in range(BEDROCK_MAX_RETRIES + 1):
        try:
            response = client.invoke_model(
                modelId=BEDROCK_MODEL_ID,
                body=body,
                contentType="application/json",
                accept="application/json",
            )
            result = json.loads(response["body"].read())
            text = result.get("generation", "").strip()
            return text
        except Exception as e:
            error_code = getattr(e, "response", {}).get("Error", {}).get("Code", "") if hasattr(e, "response") else ""
            if error_code in ("ExpiredTokenException", "ExpiredToken", "InvalidClientTokenId", "AuthFailure"):
                raise TokenExpiredError(error_code)
            if "ThrottlingException" in str(type(e).__name__) or error_code == "ThrottlingException":
                if attempt < BEDROCK_MAX_RETRIES:
                    wait = BEDROCK_RETRY_DELAYS[attempt]
                    print(f"    Bedrock throttled. Retrying in {wait}s... (attempt {attempt + 1}/{BEDROCK_MAX_RETRIES})")
                    time.sleep(wait)
                    continue
            raise

# ─── Output parsing ───────────────────────────────────────────────────────────

def parse_bedrock_output(raw: str) -> tuple[str, str]:
    """
    Parse structured output into (metaDescription, description).
    Expected format:
      META_DESCRIPTION:
      <single sentence>

      DESCRIPTION:
      <3-4 paragraphs>

    Note: must not split on "META_DESCRIPTION:" when looking for "DESCRIPTION:".
    """
    import re

    meta = ""
    description = ""

    # Find META_DESCRIPTION: and standalone DESCRIPTION: (not preceded by META_)
    meta_match = re.search(r'META_DESCRIPTION:\s*\n?', raw)
    # Standalone DESCRIPTION: = not preceded by META_
    desc_match = re.search(r'(?<![A-Z_])DESCRIPTION:\s*\n?', raw)

    if meta_match and desc_match and meta_match.start() < desc_match.start():
        # Both markers present in correct order
        meta = raw[meta_match.end(): desc_match.start()].strip()
        description = raw[desc_match.end():].strip()
    elif meta_match:
        # Only meta found — extract meta, use rest as description
        meta = raw[meta_match.end():].strip()
        description = ""
    elif desc_match:
        # Only description marker found
        description = raw[desc_match.end():].strip()
    else:
        # No markers — treat full output as description
        description = raw.strip()

    # Clean up meta: first line only, strip quotes, cap at 160 chars
    if meta:
        meta = meta.splitlines()[0].strip().strip('"').strip("'")
        if len(meta) > 160:
            meta = meta[:157] + "..."

    # Fallback meta from first sentence of description
    if not meta and description:
        first_sentence = description.split(".")[0].strip() + "."
        meta = first_sentence[:160] if len(first_sentence) <= 160 else first_sentence[:157] + "..."

    return meta, description


# ─── Output helpers ───────────────────────────────────────────────────────────

def load_existing_json() -> tuple[list[dict], set[str]]:
    """Load existing output JSON. Returns (entries, set of processed assemblyIds)."""
    if OUTPUT_JSON.exists():
        try:
            with open(OUTPUT_JSON, "r", encoding="utf-8") as f:
                entries = json.load(f)
            processed = {e["assemblyId"] for e in entries if "assemblyId" in e}
            print(f"  Loaded {len(entries)} existing entries (will skip these).")
            return entries, processed
        except Exception as e:
            print(f"  WARNING: Could not load existing JSON ({e}). Starting fresh.")
    return [], set()


def save_json(entries: list[dict]) -> None:
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)


def save_csv(entries: list[dict]) -> None:
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        for entry in entries:
            writer.writerow(entry)

# ─── Main ─────────────────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser(description="Generate assembly constituency descriptions")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts without calling Bedrock")
    parser.add_argument("--only", type=str, help="Comma-separated assembly IDs, e.g. ac001,ac005")
    parser.add_argument("--force", action="store_true", help="Overwrite existing descriptions")
    parser.add_argument("--workers", type=int, default=5, help="Number of parallel workers (default: 5)")
    parser.add_argument("--aws-region", type=str, default=None, help="AWS region (default: us-east-1)")
    parser.add_argument("--aws-key", type=str, default=None, help="AWS_ACCESS_KEY_ID")
    parser.add_argument("--aws-secret", type=str, default=None, help="AWS_SECRET_ACCESS_KEY")
    parser.add_argument("--aws-session-token", type=str, default=None, help="AWS_SESSION_TOKEN (for temporary STS credentials)")
    parser.add_argument("--server-url", type=str, default=None, help="PayloadCMS server URL (default: http://localhost:3000)")
    return parser.parse_args()


def process_assembly(
    assembly: dict,
    base_url: str,
    bedrock_client,
    dry_run: bool,
    idx: int,
    total: int,
) -> dict | None:
    """Process a single assembly — runs in a thread worker."""
    assembly_id = assembly.get("assemblyId", "")
    slug = assembly.get("slug", "")
    bilingual_name = assembly.get("name", "")
    english_name = extract_english_name(bilingual_name)

    print(f"[{idx}/{total}] {assembly_id} — {english_name}")

    try:
        # 1. Election history
        history = fetch_election_history(base_url, assembly_id)

        # 2. Wikipedia (full article)
        wiki_title, wiki_extract, wiki_found = fetch_wikipedia_content(english_name)
        status = f"wiki={'yes' if wiki_found else 'no'} hist={len(history)}yr"

        # 3. Build prompt
        prompt = build_prompt(assembly, english_name, history, wiki_extract, wiki_found)

        if dry_run:
            print(f"  [{assembly_id}] DRY RUN — prompt built ({status})")
            return None

        # 4. Bedrock call
        raw_output = invoke_bedrock(bedrock_client, prompt, dry_run=False)
        meta_description, description = parse_bedrock_output(raw_output)
        word_count = len(description.split())
        print(f"  [{assembly_id}] Done — {word_count}w | meta {len(meta_description)}c | {status}")

        # 5. Build entry
        voters = assembly.get("voters") or {}
        return {
            "assemblyId": assembly_id,
            "slug": slug,
            "nameEnglish": english_name.upper(),
            "nameBilingual": bilingual_name,
            "districtName": extract_english_name(assembly.get("districtName", "")).upper(),
            "zoneName": assembly.get("zoneName") or "",
            "totalVoters": voters.get("total", 0),
            "currentMla": get_mla_info(assembly.get("electedMla")),
            "reservationType": get_reservation_type(voters),
            "wikipediaTitle": wiki_title or "",
            "wikipediaFound": wiki_found,
            "metaDescription": meta_description,
            "description": description,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        }

    except TokenExpiredError:
        raise  # bubble up to main — stops all workers
    except Exception as e:
        print(f"  [{assembly_id}] ERROR: {e}")
        return None


def main():
    args = parse_args()
    dry_run = args.dry_run
    force = args.force
    workers = max(1, min(args.workers, 10))  # clamp 1–10
    only_ids = set(args.only.split(",")) if args.only else None

    if dry_run:
        print("=== DRY RUN MODE — Bedrock will NOT be called ===\n")

    # Load env
    env = load_env(args)
    base_url = env["NEXT_PUBLIC_SERVER_URL"].rstrip("/")
    print(f"Using PayloadCMS at: {base_url}")
    print(f"AWS Region: {env['AWS_REGION']} | Workers: {workers}")

    # Init Bedrock client — shared across threads (boto3 clients are thread-safe)
    bedrock_kwargs = {
        "region_name": env["AWS_REGION"],
        "aws_access_key_id": env["AWS_ACCESS_KEY_ID"],
        "aws_secret_access_key": env["AWS_SECRET_ACCESS_KEY"],
    }
    if env.get("AWS_SESSION_TOKEN"):
        bedrock_kwargs["aws_session_token"] = env["AWS_SESSION_TOKEN"]
        print("Using temporary STS credentials (session token present)")
    bedrock_client = boto3.client("bedrock-runtime", **bedrock_kwargs)

    # Fetch all assemblies
    assemblies = fetch_all_assemblies(base_url)
    if only_ids:
        assemblies = [a for a in assemblies if a.get("assemblyId") in only_ids]
        print(f"  Filtered to {len(assemblies)} assemblies: {only_ids}")

    assemblies.sort(key=lambda a: a.get("assemblyId", ""))

    # Load existing output
    entries, processed_ids = load_existing_json()

    # Filter out already-processed (unless --force)
    if not force:
        todo = [a for a in assemblies if a.get("assemblyId") not in processed_ids]
        skipped = len(assemblies) - len(todo)
        if skipped:
            print(f"  Skipping {skipped} already-processed assemblies. {len(todo)} remaining.")
    else:
        todo = assemblies
        skipped = 0

    total_all = len(assemblies)
    total_todo = len(todo)
    generated = 0
    errors = 0

    # Thread-safe lock for writing shared state
    write_lock = threading.Lock()
    token_expired = threading.Event()

    print(f"\nProcessing {total_todo} assemblies with {workers} parallel workers...\n")

    def run_with_index(item):
        idx_in_all, assembly = item
        if token_expired.is_set():
            return None
        return process_assembly(
            assembly, base_url, bedrock_client, dry_run,
            idx_in_all, total_all,
        )

    # Build indexed list for progress display (position in full list)
    indexed = []
    all_ids = [a.get("assemblyId") for a in assemblies]
    for assembly in todo:
        idx = all_ids.index(assembly.get("assemblyId")) + 1
        indexed.append((idx, assembly))

    try:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {executor.submit(run_with_index, item): item for item in indexed}

            for future in as_completed(futures):
                if token_expired.is_set():
                    break
                try:
                    entry = future.result()
                except TokenExpiredError as e:
                    token_expired.set()
                    with write_lock:
                        save_json(entries)
                        save_csv(entries)
                    print(f"\n{'=' * 50}")
                    print(f"AWS credentials expired ({e}).")
                    print(f"Progress saved: {generated} assemblies written to {OUTPUT_JSON}")
                    print(f"\nTo resume with fresh credentials:")
                    print(f"  python scripts/generate_assembly_descriptions.py \\")
                    print(f"    --aws-key=... --aws-secret=... --aws-session-token=...")
                    print(f"\nThe script will automatically skip the {len(processed_ids)} already-processed assemblies.")
                    sys.exit(1)
                except Exception as e:
                    print(f"  Unexpected error: {e}")
                    errors += 1
                    continue

                if entry is None:
                    if not dry_run:
                        errors += 1
                    continue

                # Thread-safe write
                with write_lock:
                    assembly_id = entry["assemblyId"]
                    if force and assembly_id in processed_ids:
                        entries[:] = [e for e in entries if e.get("assemblyId") != assembly_id]
                    entries.append(entry)
                    processed_ids.add(assembly_id)
                    generated += 1
                    if not dry_run:
                        save_json(entries)
                        save_csv(entries)

    except KeyboardInterrupt:
        print("\n\nInterrupted by user. Progress saved.")
        with write_lock:
            if not dry_run:
                save_json(entries)
                save_csv(entries)

    print(f"\n{'=' * 50}")
    print(f"Done! Generated: {generated} | Skipped: {skipped} | Errors: {errors} | Total: {total_all}")
    if not dry_run:
        print(f"Output JSON: {OUTPUT_JSON}")
        print(f"Output CSV:  {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
