#!/usr/bin/env python3
"""
Generate AI descriptions for all 38 Tamil Nadu districts.

Data sources:
  - PayloadCMS REST API: districts, assemblies (aggregated voters/booths per district)
  - Wikipedia API: district geography, history, demographics, economy
  - AWS Bedrock: Meta Llama 3.1 70B Instruct for generation

Output:
  - data/district-descriptions.json
  - data/district-descriptions.csv

Usage:
  python scripts/generate_district_descriptions.py \
    --aws-key=AKIA... --aws-secret=... --aws-region=us-east-1

  python scripts/generate_district_descriptions.py --dry-run --only=dt1
  python scripts/generate_district_descriptions.py --only=dt1,dt2
  python scripts/generate_district_descriptions.py --force
"""

import argparse
import boto3
import csv
import json
import os
import re
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
OUTPUT_JSON = PROJECT_DIR / "data" / "district-descriptions.json"
OUTPUT_CSV = PROJECT_DIR / "data" / "district-descriptions.csv"

BEDROCK_MODEL_ID = "us.meta.llama3-1-70b-instruct-v1:0"
REQUIRED_AWS_REGION = "us-east-1"

WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/w/api.php"
WIKIPEDIA_HEADERS = {"User-Agent": "IndiaStats-CMS/1.0 (https://indiastats.org)"}

BEDROCK_MAX_RETRIES = 3
BEDROCK_RETRY_DELAYS = [5, 15, 45]

CSV_COLUMNS = [
    "districtId", "slug", "nameEnglish", "nameBilingual", "zoneName",
    "assemblyCount", "totalVoters", "totalBooths",
    "wikipediaTitle", "wikipediaFound", "metaDescription", "description", "generatedAt",
]

# ─── Env loading (reused from assembly script) ───────────────────────────────

def load_env(args) -> dict:
    env = {}
    if ENV_FILE.exists():
        env = dotenv_values(str(ENV_FILE))
    for key in ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "NEXT_PUBLIC_SERVER_URL"]:
        if key in os.environ:
            env[key] = os.environ[key]
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

    region = env.get("AWS_REGION", "")
    if region != REQUIRED_AWS_REGION:
        print(f"ERROR: AWS_REGION must be '{REQUIRED_AWS_REGION}'. Got: '{region}'")
        sys.exit(1)
    if not env.get("AWS_ACCESS_KEY_ID"):
        print("ERROR: AWS_ACCESS_KEY_ID not set. Use --aws-key=...")
        sys.exit(1)
    if not env.get("AWS_SECRET_ACCESS_KEY"):
        print("ERROR: AWS_SECRET_ACCESS_KEY not set. Use --aws-secret=...")
        sys.exit(1)
    return env

# ─── PayloadCMS API ───────────────────────────────────────────────────────────

def fetch_all_districts(base_url: str) -> list[dict]:
    url = f"{base_url}/api/districts"
    params = {"limit": 100, "pagination": "false", "depth": 0}
    print("Fetching all districts...")
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    districts = resp.json().get("docs", [])
    print(f"  Fetched {len(districts)} districts.")
    return districts


def fetch_all_assemblies(base_url: str) -> list[dict]:
    url = f"{base_url}/api/assemblies"
    params = {"limit": 300, "pagination": "false", "depth": 0}
    print("Fetching all assemblies...")
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    assemblies = resp.json().get("docs", [])
    print(f"  Fetched {len(assemblies)} assemblies.")
    return assemblies


def aggregate_district_stats(assemblies: list[dict], district_id: str) -> dict:
    """Aggregate assembly-level stats for a district."""
    district_assemblies = [a for a in assemblies if a.get("districtId") == district_id]
    total_voters = 0
    total_male = 0
    total_female = 0
    total_booths = 0
    assembly_names = []
    for a in district_assemblies:
        voters = a.get("voters") or {}
        total_voters += voters.get("total", 0) or 0
        total_male += voters.get("male", 0) or 0
        total_female += voters.get("female", 0) or 0
        total_booths += a.get("noOfBooths", 0) or 0
        name = extract_english_name(a.get("name", ""))
        assembly_names.append(name)
    return {
        "assemblyCount": len(district_assemblies),
        "totalVoters": total_voters,
        "totalMale": total_male,
        "totalFemale": total_female,
        "totalBooths": total_booths,
        "assemblyNames": assembly_names,
    }

# ─── Wikipedia API ────────────────────────────────────────────────────────────

def search_wikipedia_district(english_name: str) -> str | None:
    """Search Wikipedia for the district article."""
    queries = [
        f"{english_name} district Tamil Nadu",
        f"{english_name} district India",
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
            resp = requests.get(WIKIPEDIA_SEARCH_URL, params=params, headers=WIKIPEDIA_HEADERS, timeout=10)
            resp.raise_for_status()
            results = resp.json().get("query", {}).get("search", [])
            for result in results:
                title = result.get("title", "")
                title_lower = title.lower()
                name_lower = english_name.lower()
                if "district" in title_lower and name_lower in title_lower:
                    return title
                if name_lower in title_lower and any(word in title_lower for word in ["tamil", "nadu", "district"]):
                    return title
        except Exception as e:
            print(f"    WARNING: Wikipedia search error for '{english_name}': {e}")
    return None


def fetch_wikipedia_extract(page_title: str) -> str:
    """Fetch full plain-text article content from Wikipedia."""
    try:
        params = {
            "action": "query",
            "prop": "extracts",
            "explaintext": "1",
            "exsectionformat": "plain",
            "titles": page_title,
            "format": "json",
        }
        resp = requests.get(WIKIPEDIA_SEARCH_URL, params=params, headers=WIKIPEDIA_HEADERS, timeout=10)
        resp.raise_for_status()
        pages = resp.json().get("query", {}).get("pages", {})
        for page in pages.values():
            extract = page.get("extract", "")
            if not extract:
                return ""
            lines = [line.strip() for line in extract.splitlines()]
            cleaned = "\n".join(line for line in lines if line)
            return cleaned[:5000]  # More chars for districts (richer Wikipedia articles)
    except Exception as e:
        print(f"    WARNING: Wikipedia extract error for '{page_title}': {e}")
    return ""


def fetch_wikipedia_content(english_name: str) -> tuple[str | None, str, bool]:
    title = search_wikipedia_district(english_name)
    if not title:
        return None, "", False
    extract = fetch_wikipedia_extract(title)
    if not extract:
        return title, "", False
    return title, extract, True

# ─── Name helpers ─────────────────────────────────────────────────────────────

def extract_english_name(bilingual_name: str) -> str:
    if " / " in bilingual_name:
        english = bilingual_name.split(" / ", 1)[1].strip()
    else:
        english = bilingual_name.strip()
    return english.title()

# ─── Bedrock ──────────────────────────────────────────────────────────────────

def build_district_prompt(
    district: dict,
    english_name: str,
    stats: dict,
    wiki_extract: str,
    wiki_found: bool,
) -> str:
    zone = district.get("zoneName") or "N/A"
    district_id = district.get("districtId", "")
    assembly_count = stats["assemblyCount"]
    total_voters = stats["totalVoters"]
    total_male = stats["totalMale"]
    total_female = stats["totalFemale"]
    total_booths = stats["totalBooths"]
    assembly_names = ", ".join(stats["assemblyNames"][:10])
    if len(stats["assemblyNames"]) > 10:
        assembly_names += f", and {len(stats['assemblyNames']) - 10} more"

    wiki_section = ""
    if wiki_found and wiki_extract:
        wiki_section = f"\nWikipedia article content:\n{wiki_extract}\n"

    keywords = [
        f"{english_name} district Tamil Nadu",
        f"{english_name} district election results",
        f"{english_name} assembly constituencies",
        f"{english_name} voter data",
        f"{english_name} district MLA",
    ]

    prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are an expert political journalist and SEO content writer specialising in Tamil Nadu elections. You write for IndiaStats.org — a website providing Tamil Nadu district and assembly constituency election data, voter statistics, MLA history, and demographic insights. Your content must be factual, engaging, and optimised for Google search. Use ONLY the verified data provided — never invent statistics.
<|eot_id|><|start_header_id|>user<|end_header_id|>
Generate SEO-optimised content for the {english_name} district page on IndiaStats.org.

=== VERIFIED DISTRICT DATA ===
District ID: {district_id}
Name: {english_name} District, Tamil Nadu
Zone: {zone}
Assembly Constituencies: {assembly_count}
Assembly Names: {assembly_names}
Total Registered Voters (2025): {total_voters:,}
  - Male voters: {total_male:,}
  - Female voters: {total_female:,}
Total Polling Booths: {total_booths:,}
{wiki_section}
=== SEO KEYWORDS TO NATURALLY INCLUDE ===
Primary: {keywords[0]}, {keywords[1]}
Secondary: {keywords[2]}, {keywords[3]}, {keywords[4]}

=== OUTPUT FORMAT (follow exactly) ===
Write two sections separated by the exact markers below:

META_DESCRIPTION:
[A single sentence, 150-160 characters exactly. Must include district name, number of assembly constituencies, and a compelling hook about election data. Target Google searchers looking for "{english_name} district Tamil Nadu". Do not exceed 160 characters.]

DESCRIPTION:
[3-4 paragraphs, 300-400 words total. Writing style: professional, factual, BBC News-style. Structure:
Paragraph 1 — Geographic & demographic overview: location in Tamil Nadu, zone ({zone}), number of assembly constituencies ({assembly_count}), total voters ({total_voters:,}), male/female split, total polling booths ({total_booths:,}). Include geographic details from Wikipedia (area, rivers, climate, neighboring districts).
Paragraph 2 — Political landscape: describe the political dynamics of the district. Mention key assembly constituencies by name. Describe general DMK vs AIADMK trends across the district.
Paragraph 3 — Economy & significance: industries, agriculture, notable landmarks, historical significance from Wikipedia. Why this district matters in Tamil Nadu politics.
Paragraph 4 (optional) — Infrastructure & demographics: population, literacy, urban/rural character from Wikipedia.
Rules: naturally weave in the SEO keywords. No headers. No bullet points. Do not write "According to Wikipedia". Do not invent any statistics not provided above.]
<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""
    return prompt


class TokenExpiredError(Exception):
    pass


def invoke_bedrock(client, prompt: str, dry_run: bool = False) -> str:
    if dry_run:
        return "[DRY RUN — Bedrock not called]"

    body = json.dumps({
        "prompt": prompt,
        "max_gen_len": 1024,
        "temperature": 0.3,
        "top_p": 0.9,
    })

    for attempt in range(BEDROCK_MAX_RETRIES + 1):
        try:
            response = client.invoke_model(
                modelId=BEDROCK_MODEL_ID, body=body,
                contentType="application/json", accept="application/json",
            )
            result = json.loads(response["body"].read())
            return result.get("generation", "").strip()
        except Exception as e:
            error_code = getattr(e, "response", {}).get("Error", {}).get("Code", "") if hasattr(e, "response") else ""
            if error_code in ("ExpiredTokenException", "ExpiredToken", "InvalidClientTokenId", "AuthFailure"):
                raise TokenExpiredError(error_code)
            if "ThrottlingException" in str(type(e).__name__) or error_code == "ThrottlingException":
                if attempt < BEDROCK_MAX_RETRIES:
                    wait = BEDROCK_RETRY_DELAYS[attempt]
                    print(f"    Bedrock throttled. Retrying in {wait}s...")
                    time.sleep(wait)
                    continue
            raise

# ─── Output parsing (reused from assembly script) ────────────────────────────

def parse_bedrock_output(raw: str) -> tuple[str, str]:
    meta = ""
    description = ""
    meta_match = re.search(r'META_DESCRIPTION:\s*\n?', raw)
    desc_match = re.search(r'(?<![A-Z_])DESCRIPTION:\s*\n?', raw)

    if meta_match and desc_match and meta_match.start() < desc_match.start():
        meta = raw[meta_match.end(): desc_match.start()].strip()
        description = raw[desc_match.end():].strip()
    elif meta_match:
        meta = raw[meta_match.end():].strip()
    elif desc_match:
        description = raw[desc_match.end():].strip()
    else:
        description = raw.strip()

    if meta:
        meta = meta.splitlines()[0].strip().strip('"').strip("'")
        if len(meta) > 160:
            meta = meta[:157] + "..."

    if not meta and description:
        first_sentence = description.split(".")[0].strip() + "."
        meta = first_sentence[:160] if len(first_sentence) <= 160 else first_sentence[:157] + "..."

    return meta, description

# ─── Output helpers ───────────────────────────────────────────────────────────

def load_existing_json() -> tuple[list[dict], set[str]]:
    if OUTPUT_JSON.exists():
        try:
            with open(OUTPUT_JSON, "r", encoding="utf-8") as f:
                entries = json.load(f)
            processed = {e["districtId"] for e in entries if "districtId" in e}
            print(f"  Loaded {len(entries)} existing entries (will skip these).")
            return entries, processed
        except Exception:
            pass
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
    parser = argparse.ArgumentParser(description="Generate district descriptions")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--only", type=str, help="e.g. dt1,dt2")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--workers", type=int, default=5)
    parser.add_argument("--aws-region", type=str, default=None)
    parser.add_argument("--aws-key", type=str, default=None)
    parser.add_argument("--aws-secret", type=str, default=None)
    parser.add_argument("--aws-session-token", type=str, default=None)
    parser.add_argument("--server-url", type=str, default=None)
    return parser.parse_args()


def process_district(
    district: dict,
    all_assemblies: list[dict],
    bedrock_client,
    dry_run: bool,
    idx: int,
    total: int,
) -> dict | None:
    district_id = district.get("districtId", "")
    slug = district.get("slug", "")
    bilingual_name = district.get("districtName", "")
    english_name = extract_english_name(bilingual_name)

    print(f"[{idx}/{total}] {district_id} — {english_name}")

    try:
        stats = aggregate_district_stats(all_assemblies, district_id)
        wiki_title, wiki_extract, wiki_found = fetch_wikipedia_content(english_name)
        status = f"wiki={'yes' if wiki_found else 'no'} acs={stats['assemblyCount']}"

        prompt = build_district_prompt(district, english_name, stats, wiki_extract, wiki_found)

        if dry_run:
            print(f"  [{district_id}] DRY RUN — prompt built ({status})")
            return None

        raw_output = invoke_bedrock(bedrock_client, prompt, dry_run=False)
        meta_description, description = parse_bedrock_output(raw_output)
        word_count = len(description.split())
        print(f"  [{district_id}] Done — {word_count}w | meta {len(meta_description)}c | {status}")

        return {
            "districtId": district_id,
            "slug": slug,
            "nameEnglish": english_name.upper(),
            "nameBilingual": bilingual_name,
            "zoneName": district.get("zoneName") or "",
            "assemblyCount": stats["assemblyCount"],
            "totalVoters": stats["totalVoters"],
            "totalBooths": stats["totalBooths"],
            "wikipediaTitle": wiki_title or "",
            "wikipediaFound": wiki_found,
            "metaDescription": meta_description,
            "description": description,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        }

    except TokenExpiredError:
        raise
    except Exception as e:
        print(f"  [{district_id}] ERROR: {e}")
        return None


def main():
    args = parse_args()
    dry_run = args.dry_run
    force = args.force
    workers = max(1, min(args.workers, 10))
    only_ids = set(args.only.split(",")) if args.only else None

    if dry_run:
        print("=== DRY RUN MODE ===\n")

    env = load_env(args)
    base_url = env["NEXT_PUBLIC_SERVER_URL"].rstrip("/")
    print(f"Using PayloadCMS at: {base_url}")
    print(f"AWS Region: {env['AWS_REGION']} | Workers: {workers}")

    bedrock_kwargs = {
        "region_name": env["AWS_REGION"],
        "aws_access_key_id": env["AWS_ACCESS_KEY_ID"],
        "aws_secret_access_key": env["AWS_SECRET_ACCESS_KEY"],
    }
    if env.get("AWS_SESSION_TOKEN"):
        bedrock_kwargs["aws_session_token"] = env["AWS_SESSION_TOKEN"]
        print("Using temporary STS credentials")
    bedrock_client = boto3.client("bedrock-runtime", **bedrock_kwargs)

    districts = fetch_all_districts(base_url)
    all_assemblies = fetch_all_assemblies(base_url)

    if only_ids:
        districts = [d for d in districts if d.get("districtId") in only_ids]
        print(f"  Filtered to {len(districts)} districts: {only_ids}")

    districts.sort(key=lambda d: d.get("districtId", ""))

    entries, processed_ids = load_existing_json()

    if not force:
        todo = [d for d in districts if d.get("districtId") not in processed_ids]
        skipped = len(districts) - len(todo)
        if skipped:
            print(f"  Skipping {skipped} already-processed. {len(todo)} remaining.")
    else:
        todo = districts
        skipped = 0

    total_all = len(districts)
    generated = 0
    errors = 0
    write_lock = threading.Lock()
    token_expired = threading.Event()

    print(f"\nProcessing {len(todo)} districts with {workers} parallel workers...\n")

    def run_with_index(item):
        idx, district = item
        if token_expired.is_set():
            return None
        return process_district(district, all_assemblies, bedrock_client, dry_run, idx, total_all)

    indexed = []
    all_ids = [d.get("districtId") for d in districts]
    for district in todo:
        idx = all_ids.index(district.get("districtId")) + 1
        indexed.append((idx, district))

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
                    print(f"\nAWS credentials expired ({e}). Progress saved.")
                    print(f"Resume: python scripts/generate_district_descriptions.py --aws-key=... --aws-secret=... --aws-session-token=...")
                    sys.exit(1)
                except Exception as e:
                    errors += 1
                    continue

                if entry is None:
                    if not dry_run:
                        errors += 1
                    continue

                with write_lock:
                    did = entry["districtId"]
                    if force and did in processed_ids:
                        entries[:] = [e for e in entries if e.get("districtId") != did]
                    entries.append(entry)
                    processed_ids.add(did)
                    generated += 1
                    if not dry_run:
                        save_json(entries)
                        save_csv(entries)

    except KeyboardInterrupt:
        print("\n\nInterrupted. Progress saved.")
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
