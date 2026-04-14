#!/usr/bin/env python3
"""
Extract business/industry data for all 234 Tamil Nadu assembly constituencies.

Data sources:
  - Wikipedia: assembly constituency article + parent district article (economy sections)
  - AWS Bedrock: Llama 3.1 70B to extract structured business data

Output:
  - data/assembly-businesses.json
  - data/assembly-businesses.csv

Usage:
  python scripts/generate_assembly_businesses.py \
    --aws-key=... --aws-secret=... --aws-session-token=... --aws-region=us-east-1
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
OUTPUT_JSON = PROJECT_DIR / "data" / "assembly-businesses.json"
OUTPUT_CSV = PROJECT_DIR / "data" / "assembly-businesses.csv"

BEDROCK_MODEL_ID = "us.meta.llama3-1-70b-instruct-v1:0"
REQUIRED_AWS_REGION = "us-east-1"

WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
WIKIPEDIA_HEADERS = {"User-Agent": "IndiaStats-CMS/1.0 (https://indiastats.org)"}

BEDROCK_MAX_RETRIES = 3
BEDROCK_RETRY_DELAYS = [5, 15, 45]

CSV_COLUMNS = [
    "assemblyId", "slug", "nameEnglish", "districtName",
    "economicMix", "majorIndustries", "topEmployers", "localBusinessTypes",
    "commercialLandmarks", "education", "healthcare", "transport", "landmarks",
    "businessSummary", "wikipediaFound", "districtWikipediaUsed", "generatedAt",
]

# ─── Env loading ──────────────────────────────────────────────────────────────

def load_env(args) -> dict:
    env = {}
    if ENV_FILE.exists():
        env = dotenv_values(str(ENV_FILE))
    for key in ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "NEXT_PUBLIC_SERVER_URL"]:
        if key in os.environ:
            env[key] = os.environ[key]
    if args.aws_region: env["AWS_REGION"] = args.aws_region
    if args.aws_key: env["AWS_ACCESS_KEY_ID"] = args.aws_key
    if args.aws_secret: env["AWS_SECRET_ACCESS_KEY"] = args.aws_secret
    if args.aws_session_token: env["AWS_SESSION_TOKEN"] = args.aws_session_token
    if args.server_url: env["NEXT_PUBLIC_SERVER_URL"] = args.server_url
    env.setdefault("AWS_REGION", REQUIRED_AWS_REGION)
    env.setdefault("NEXT_PUBLIC_SERVER_URL", "http://localhost:3000")
    if env.get("AWS_REGION") != REQUIRED_AWS_REGION:
        print(f"ERROR: AWS_REGION must be '{REQUIRED_AWS_REGION}'"); sys.exit(1)
    if not env.get("AWS_ACCESS_KEY_ID"):
        print("ERROR: AWS_ACCESS_KEY_ID not set"); sys.exit(1)
    if not env.get("AWS_SECRET_ACCESS_KEY"):
        print("ERROR: AWS_SECRET_ACCESS_KEY not set"); sys.exit(1)
    return env

# ─── PayloadCMS ───────────────────────────────────────────────────────────────

def fetch_all_assemblies(base_url: str) -> list[dict]:
    resp = requests.get(f"{base_url}/api/assemblies", params={"limit": 300, "pagination": "false", "depth": 0}, timeout=30)
    resp.raise_for_status()
    docs = resp.json().get("docs", [])
    print(f"Fetched {len(docs)} assemblies.")
    return docs

# ─── Wikipedia ────────────────────────────────────────────────────────────────

def search_wikipedia(query: str, accept_keywords: list[str]) -> str | None:
    """Search Wikipedia and return first matching title."""
    try:
        params = {"action": "query", "list": "search", "srsearch": query, "srlimit": 5, "format": "json"}
        resp = requests.get(WIKIPEDIA_API, params=params, headers=WIKIPEDIA_HEADERS, timeout=10)
        resp.raise_for_status()
        for result in resp.json().get("query", {}).get("search", []):
            title = result.get("title", "")
            title_lower = title.lower()
            if any(kw in title_lower for kw in accept_keywords):
                return title
    except Exception:
        pass
    return None


def fetch_extract(page_title: str, max_chars: int = 5000) -> str:
    """Fetch full plain-text article from Wikipedia."""
    try:
        params = {"action": "query", "prop": "extracts", "explaintext": "1",
                  "exsectionformat": "plain", "titles": page_title, "format": "json"}
        resp = requests.get(WIKIPEDIA_API, params=params, headers=WIKIPEDIA_HEADERS, timeout=10)
        resp.raise_for_status()
        for page in resp.json().get("query", {}).get("pages", {}).values():
            text = page.get("extract", "")
            if text:
                lines = [l.strip() for l in text.splitlines()]
                return "\n".join(l for l in lines if l)[:max_chars]
    except Exception:
        pass
    return ""


# Cache district Wikipedia articles (only 38 districts, fetched once)
_district_wiki_cache: dict[str, tuple[str | None, str, bool]] = {}
_district_cache_lock = threading.Lock()


def get_assembly_wikipedia(english_name: str) -> tuple[str | None, str, bool]:
    """Get Wikipedia article for an assembly constituency."""
    name_lower = english_name.lower()
    title = search_wikipedia(
        f"{english_name} assembly constituency Tamil Nadu",
        accept_keywords=["constituency", "assembly", name_lower]
    )
    if not title:
        return None, "", False
    extract = fetch_extract(title, 4000)
    return (title, extract, True) if extract else (title, "", False)


def get_district_wikipedia(district_english: str) -> tuple[str | None, str, bool]:
    """Get Wikipedia article for a district (cached across threads)."""
    with _district_cache_lock:
        if district_english in _district_wiki_cache:
            return _district_wiki_cache[district_english]

    name_lower = district_english.lower()
    title = search_wikipedia(
        f"{district_english} district Tamil Nadu",
        accept_keywords=["district", name_lower]
    )
    result = (None, "", False)
    if title:
        extract = fetch_extract(title, 5000)
        if extract:
            result = (title, extract, True)

    with _district_cache_lock:
        _district_wiki_cache[district_english] = result
    return result

# ─── Helpers ──────────────────────────────────────────────────────────────────

def extract_english_name(bilingual: str) -> str:
    if " / " in bilingual:
        return bilingual.split(" / ", 1)[1].strip().title()
    return bilingual.strip().title()

# ─── Bedrock ──────────────────────────────────────────────────────────────────

def build_prompt(english_name: str, district_name: str, assembly_wiki: str, district_wiki: str) -> str:
    wiki_section = ""
    if assembly_wiki:
        wiki_section += f"\n=== WIKIPEDIA: {english_name} ASSEMBLY CONSTITUENCY ===\n{assembly_wiki}\n"
    if district_wiki:
        wiki_section += f"\n=== WIKIPEDIA: {district_name} DISTRICT (economy, industry, agriculture sections) ===\n{district_wiki}\n"

    prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are an expert on Tamil Nadu's economy, industries, and business landscape. You have deep knowledge of every district and constituency in Tamil Nadu — their industries, major companies, agriculture, commercial areas, and economic character. Use the Wikipedia articles provided as primary context, but supplement with your own knowledge about the area's businesses and industries. Be specific — name actual companies, industrial estates, and landmarks.
<|eot_id|><|start_header_id|>user<|end_header_id|>
List the known businesses, industries, and economic activities for {english_name} assembly constituency in {district_name} district, Tamil Nadu.
{wiki_section}
Based on the Wikipedia context above AND your knowledge of {english_name} and {district_name} district, provide:

ECONOMIC_MIX:
[Estimate the economic composition of this constituency as percentages that add up to 100%. Categories: Agriculture, Manufacturing, Services/IT, Small Business/Retail, Others. Format each as "Category: XX%". E.g.:
Agriculture: 35%
Manufacturing: 25%
Services/IT: 20%
Small Business/Retail: 15%
Others: 5%]

MAJOR_INDUSTRIES:
[Comma-separated list of 3-8 major industries, industrial estates, manufacturing sectors, IT parks in or near this constituency. For each, add an estimated share of local employment in parentheses. E.g.: "SIPCOT Industrial Park (15%), Automobile manufacturing (12%), Textile mills (10%), IT corridor (8%)"]

TOP_EMPLOYERS:
[Comma-separated list of 3-8 notable companies, factories, institutions that are major employers in or near this constituency. For each, add estimated workforce size or employment share. E.g.: "Hyundai Motor India (~10,000 workers), TCS (~5,000), Ashok Leyland (~3,000)"]

LOCAL_BUSINESS_TYPES:
[Comma-separated list of 3-8 local economic activities — agriculture, small businesses, cottage industries. For each, add estimated percentage of local workforce. E.g.: "Paddy cultivation (20%), Handloom weaving (8%), Fishing (5%), Poultry farming (4%)"]

COMMERCIAL_LANDMARKS:
[Comma-separated list of 2-5 notable markets, commercial areas, shopping districts, industrial zones. E.g.: "T Nagar shopping district, Koyambedu wholesale market, Ambattur Industrial Estate"]

EDUCATION:
[List of 3-6 notable educational institutions in or near this constituency. Format: "Name (Type)". E.g.: "Anna University (Engineering), Loyola College (Arts & Science), IIT Madras (Engineering), Government Higher Secondary School (School)"]

HEALTHCARE:
[List of 2-5 major hospitals and healthcare facilities. Format: "Name (Type)". E.g.: "Apollo Hospital (Multi-specialty), Government General Hospital (Government), MIOT Hospital (Private)"]

TRANSPORT:
[List of 3-6 transport facilities. Format: "Name (Type)". Type can be: Railway, Metro, Bus Terminal, Highway, Airport, Port. E.g.: "Ambattur Railway Station (Railway), Koyambedu Bus Terminal (Bus Terminal), NH-48 (Highway)"]

LANDMARKS:
[List of 3-6 tourist, religious, or historical landmarks. Format: "Name (Type)". Type can be: Temple, Church, Mosque, Historical Site, Park, Beach, Hill Station. E.g.: "Kapaleeshwarar Temple (Temple), Fort St. George (Historical Site), Marina Beach (Beach)"]

BUSINESS_SUMMARY:
[2-3 sentences describing the economic character of {english_name} constituency. Include the dominant economic sector and its approximate share. What is the area primarily known for economically?]
<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""
    return prompt


class TokenExpiredError(Exception):
    pass


def invoke_bedrock(client, prompt: str, dry_run: bool = False) -> str:
    if dry_run:
        return "[DRY RUN]"
    body = json.dumps({"prompt": prompt, "max_gen_len": 1024, "temperature": 0.2, "top_p": 0.9})
    for attempt in range(BEDROCK_MAX_RETRIES + 1):
        try:
            response = client.invoke_model(modelId=BEDROCK_MODEL_ID, body=body,
                                           contentType="application/json", accept="application/json")
            return json.loads(response["body"].read()).get("generation", "").strip()
        except Exception as e:
            code = getattr(e, "response", {}).get("Error", {}).get("Code", "") if hasattr(e, "response") else ""
            if code in ("ExpiredTokenException", "ExpiredToken", "InvalidClientTokenId", "AuthFailure"):
                raise TokenExpiredError(code)
            if "Throttling" in str(type(e).__name__) or code == "ThrottlingException":
                if attempt < BEDROCK_MAX_RETRIES:
                    time.sleep(BEDROCK_RETRY_DELAYS[attempt]); continue
            raise

# ─── Output parsing ───────────────────────────────────────────────────────────

def parse_raw_list(raw: str, marker: str) -> list[str]:
    """Extract comma-separated list after a marker as raw strings."""
    match = re.search(rf'{marker}:\s*\n?(.*?)(?:\n\n|\n[A-Z_]+:|\Z)', raw, re.DOTALL)
    if not match:
        return []
    text = match.group(1).strip()
    if text.upper() == "N/A" or not text:
        return []
    items = [item.strip().strip('"').strip("'") for item in text.split(",")]
    return [i for i in items if i and i.upper() != "N/A"]


def parse_items_with_percentage(raw: str, marker: str) -> list[dict]:
    """Parse items like 'SIPCOT Industrial Park (15%)' into {name, percentage}."""
    raw_items = parse_raw_list(raw, marker)
    results = []
    buffer = ""
    for item in raw_items:
        buffer = f"{buffer}, {item}".strip(", ") if buffer else item
        # Check if buffer has a closing parenthesis (complete item)
        if ")" in buffer or "%" not in buffer:
            m = re.match(r'^(.*?)\s*\((\d+)%\)\s*$', buffer)
            if m:
                results.append({"name": m.group(1).strip(), "percentage": int(m.group(2))})
            else:
                name = re.sub(r'\s*\([^)]*\)\s*$', '', buffer).strip()
                if name:
                    results.append({"name": name})
            buffer = ""
    if buffer:
        name = re.sub(r'\s*\([^)]*\)\s*$', '', buffer).strip()
        if name:
            results.append({"name": name})
    return results


def parse_employers(raw: str) -> list[dict]:
    """Parse items like 'TCS (~5,000)' into {name, workers}."""
    raw_items = parse_raw_list(raw, "TOP_EMPLOYERS")
    results = []
    buffer = ""
    for item in raw_items:
        buffer = f"{buffer}, {item}".strip(", ") if buffer else item
        if ")" in buffer or "~" not in buffer:
            # Try to extract worker count: (~10,000 workers) or (~5,000) or (~5000)
            m = re.match(r'^(.*?)\s*\(~?([\d,]+)\s*(?:workers?)?\)\s*$', buffer)
            if m:
                name = m.group(1).strip()
                workers = int(m.group(2).replace(",", ""))
                results.append({"name": name, "workers": workers})
            else:
                name = re.sub(r'\s*\([^)]*\)\s*$', '', buffer).strip()
                if name:
                    results.append({"name": name})
            buffer = ""
    if buffer:
        name = re.sub(r'\s*\([^)]*\)\s*$', '', buffer).strip()
        if name:
            results.append({"name": name})
    return results


def parse_plain_list(raw: str, marker: str) -> list[str]:
    """Parse simple comma-separated list (no percentages)."""
    raw_items = parse_raw_list(raw, marker)
    return [re.sub(r'\s*\([^)]*\)\s*$', '', i).strip() for i in raw_items if i.strip()]


def parse_named_typed_list(raw: str, marker: str) -> list[dict]:
    """Parse items like 'Anna University (Engineering)' into {name, type}."""
    raw_items = parse_raw_list(raw, marker)
    results = []
    buffer = ""
    for item in raw_items:
        buffer = f"{buffer}, {item}".strip(", ") if buffer else item
        if ")" in buffer:
            m = re.match(r'^(.*?)\s*\(([^)]+)\)\s*$', buffer)
            if m:
                results.append({"name": m.group(1).strip(), "type": m.group(2).strip()})
            else:
                name = buffer.strip()
                if name:
                    results.append({"name": name})
            buffer = ""
        elif "(" not in buffer:
            # No parenthesis at all — just a name
            name = buffer.strip()
            if name:
                results.append({"name": name})
            buffer = ""
    if buffer:
        name = re.sub(r'\s*\([^)]*$', '', buffer).strip()
        if name:
            results.append({"name": name})
    return results


def parse_economic_mix(raw: str) -> list[dict]:
    """Extract economic mix percentages. Returns list of {category, percentage}."""
    match = re.search(r'ECONOMIC_MIX:\s*\n?(.*?)(?:\n\n|\n[A-Z_]+:|\Z)', raw, re.DOTALL)
    if not match:
        return []
    text = match.group(1).strip()
    result = []
    for line in text.splitlines():
        line = line.strip()
        # Match "Category: XX%" pattern
        m = re.match(r'^([^:]+):\s*(\d+)%', line)
        if m:
            result.append({"category": m.group(1).strip(), "percentage": int(m.group(2))})
    return result


def parse_summary(raw: str) -> str:
    match = re.search(r'BUSINESS_SUMMARY:\s*\n?(.*?)(?:\n\n[A-Z]|\Z)', raw, re.DOTALL)
    if not match:
        return ""
    text = match.group(1).strip()
    return "" if text.upper() == "N/A" else text


def parse_bedrock_output(raw: str) -> dict:
    return {
        "economicMix": parse_economic_mix(raw),
        "majorIndustries": parse_items_with_percentage(raw, "MAJOR_INDUSTRIES"),
        "topEmployers": parse_employers(raw),
        "localBusinessTypes": parse_items_with_percentage(raw, "LOCAL_BUSINESS_TYPES"),
        "commercialLandmarks": parse_plain_list(raw, "COMMERCIAL_LANDMARKS"),
        "education": parse_named_typed_list(raw, "EDUCATION"),
        "healthcare": parse_named_typed_list(raw, "HEALTHCARE"),
        "transport": parse_named_typed_list(raw, "TRANSPORT"),
        "landmarks": parse_named_typed_list(raw, "LANDMARKS"),
        "businessSummary": parse_summary(raw),
    }

# ─── Output helpers ───────────────────────────────────────────────────────────

def load_existing() -> tuple[list[dict], set[str]]:
    if OUTPUT_JSON.exists():
        try:
            entries = json.load(open(OUTPUT_JSON, "r", encoding="utf-8"))
            return entries, {e["assemblyId"] for e in entries}
        except Exception:
            pass
    return [], set()


def save_json(entries):
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    json.dump(entries, open(OUTPUT_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=2)


def save_csv(entries):
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        w.writeheader()
        for e in entries:
            row = {**e}
            for k in ["majorIndustries", "localBusinessTypes"]:
                if isinstance(row.get(k), list):
                    row[k] = "; ".join(f"{i.get('name','')} ({i.get('percentage','')}%)" if 'percentage' in i else i.get('name','') for i in row[k])
            if isinstance(row.get("topEmployers"), list):
                row["topEmployers"] = "; ".join(f"{i.get('name','')} (~{i.get('workers','')})" if 'workers' in i else i.get('name','') for i in row["topEmployers"])
            if isinstance(row.get("commercialLandmarks"), list):
                row["commercialLandmarks"] = "; ".join(row["commercialLandmarks"])
            for k in ["education", "healthcare", "transport", "landmarks"]:
                if isinstance(row.get(k), list):
                    row[k] = "; ".join(f"{i.get('name','')} ({i.get('type','')})" if 'type' in i else i.get('name','') for i in row[k])
            if isinstance(row.get("economicMix"), list):
                row["economicMix"] = "; ".join(f"{m['category']}: {m['percentage']}%" for m in row["economicMix"])
            w.writerow(row)

# ─── Main ─────────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description="Extract business data for assemblies")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--only", type=str, help="e.g. ac001,ac005")
    p.add_argument("--force", action="store_true")
    p.add_argument("--workers", type=int, default=5)
    p.add_argument("--aws-region", type=str)
    p.add_argument("--aws-key", type=str)
    p.add_argument("--aws-secret", type=str)
    p.add_argument("--aws-session-token", type=str)
    p.add_argument("--server-url", type=str)
    return p.parse_args()


def process_assembly(assembly, bedrock_client, dry_run, idx, total) -> dict | None:
    aid = assembly.get("assemblyId", "")
    slug = assembly.get("slug", "")
    bilingual = assembly.get("name", "")
    english = extract_english_name(bilingual)
    district_bilingual = assembly.get("districtName", "")
    district_english = extract_english_name(district_bilingual)

    print(f"[{idx}/{total}] {aid} — {english}")

    try:
        # 1. Assembly Wikipedia
        aw_title, aw_text, aw_found = get_assembly_wikipedia(english)

        # 2. District Wikipedia (cached)
        dw_title, dw_text, dw_found = get_district_wikipedia(district_english)

        status = f"ac_wiki={'yes' if aw_found else 'no'} dt_wiki={'yes' if dw_found else 'no'}"

        # 3. Bedrock
        prompt = build_prompt(english, district_english, aw_text, dw_text)
        if dry_run:
            print(f"  [{aid}] DRY RUN ({status})")
            return None

        raw = invoke_bedrock(bedrock_client, prompt)
        biz = parse_bedrock_output(raw)
        total_items = sum(len(biz[k]) for k in ["majorIndustries", "topEmployers", "localBusinessTypes", "commercialLandmarks"])
        print(f"  [{aid}] Done — {total_items} items | {status}")

        return {
            "assemblyId": aid,
            "slug": slug,
            "nameEnglish": english.upper(),
            "districtName": district_english.upper(),
            **biz,
            "wikipediaFound": aw_found,
            "districtWikipediaUsed": dw_found,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        }
    except TokenExpiredError:
        raise
    except Exception as e:
        print(f"  [{aid}] ERROR: {e}")
        return None


def main():
    args = parse_args()
    dry_run = args.dry_run
    force = args.force
    workers = max(1, min(args.workers, 10))
    only_ids = set(args.only.split(",")) if args.only else None

    if dry_run:
        print("=== DRY RUN ===\n")

    env = load_env(args)
    base_url = env["NEXT_PUBLIC_SERVER_URL"].rstrip("/")
    print(f"PayloadCMS: {base_url} | Workers: {workers}")

    bedrock_kwargs = {"region_name": env["AWS_REGION"],
                      "aws_access_key_id": env["AWS_ACCESS_KEY_ID"],
                      "aws_secret_access_key": env["AWS_SECRET_ACCESS_KEY"]}
    if env.get("AWS_SESSION_TOKEN"):
        bedrock_kwargs["aws_session_token"] = env["AWS_SESSION_TOKEN"]
        print("Using temporary STS credentials")
    bedrock_client = boto3.client("bedrock-runtime", **bedrock_kwargs)

    assemblies = fetch_all_assemblies(base_url)
    if only_ids:
        assemblies = [a for a in assemblies if a.get("assemblyId") in only_ids]
        print(f"Filtered to {len(assemblies)}: {only_ids}")
    assemblies.sort(key=lambda a: a.get("assemblyId", ""))

    entries, processed = load_existing()
    if not force:
        todo = [a for a in assemblies if a.get("assemblyId") not in processed]
        skipped = len(assemblies) - len(todo)
        if skipped:
            print(f"Skipping {skipped} already-processed. {len(todo)} remaining.")
    else:
        todo = assemblies; skipped = 0

    total_all = len(assemblies)
    generated = 0; errors = 0
    write_lock = threading.Lock()
    token_expired = threading.Event()

    print(f"\nProcessing {len(todo)} assemblies...\n")

    def run(item):
        idx, asm = item
        if token_expired.is_set(): return None
        return process_assembly(asm, bedrock_client, dry_run, idx, total_all)

    indexed = []
    all_ids = [a.get("assemblyId") for a in assemblies]
    for a in todo:
        indexed.append((all_ids.index(a.get("assemblyId")) + 1, a))

    try:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {executor.submit(run, item): item for item in indexed}
            for future in as_completed(futures):
                if token_expired.is_set(): break
                try:
                    entry = future.result()
                except TokenExpiredError as e:
                    token_expired.set()
                    with write_lock: save_json(entries); save_csv(entries)
                    print(f"\nAWS credentials expired ({e}). Progress saved ({len(processed)} done).")
                    print("Resume: python scripts/generate_assembly_businesses.py --aws-key=... --aws-secret=... --aws-session-token=...")
                    sys.exit(1)
                except Exception:
                    errors += 1; continue

                if entry is None:
                    if not dry_run: errors += 1
                    continue

                with write_lock:
                    aid = entry["assemblyId"]
                    if force and aid in processed:
                        entries[:] = [e for e in entries if e.get("assemblyId") != aid]
                    entries.append(entry)
                    processed.add(aid)
                    generated += 1
                    if not dry_run: save_json(entries); save_csv(entries)
    except KeyboardInterrupt:
        print("\nInterrupted. Progress saved.")
        if not dry_run: save_json(entries); save_csv(entries)

    print(f"\n{'='*50}")
    print(f"Done! Generated: {generated} | Skipped: {skipped} | Errors: {errors} | Total: {total_all}")
    if not dry_run:
        print(f"JSON: {OUTPUT_JSON}")
        print(f"CSV:  {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
