#!/usr/bin/env python3
"""
Extract business/industry data for all 38 Tamil Nadu districts.
Uses Wikipedia district articles (rich economy sections) + Bedrock Llama 3.1 70B.

Output: data/district-businesses.json + data/district-businesses.csv

Usage:
  python scripts/generate_district_businesses.py \
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

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
ENV_FILE = PROJECT_DIR / ".env.local"
OUTPUT_JSON = PROJECT_DIR / "data" / "district-businesses.json"
OUTPUT_CSV = PROJECT_DIR / "data" / "district-businesses.csv"

BEDROCK_MODEL_ID = "us.meta.llama3-1-70b-instruct-v1:0"
REQUIRED_AWS_REGION = "us-east-1"
WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
WIKIPEDIA_HEADERS = {"User-Agent": "IndiaStats-CMS/1.0 (https://indiastats.org)"}
BEDROCK_MAX_RETRIES = 3
BEDROCK_RETRY_DELAYS = [5, 15, 45]

CSV_COLUMNS = [
    "districtId", "slug", "nameEnglish", "zoneName",
    "economicMix", "majorIndustries", "topEmployers", "localBusinessTypes",
    "commercialLandmarks", "education", "healthcare", "transport", "landmarks",
    "businessSummary", "wikipediaFound", "generatedAt",
]

# ─── Env ──────────────────────────────────────────────────────────────────────

def load_env(args) -> dict:
    env = {}
    if ENV_FILE.exists():
        env = dotenv_values(str(ENV_FILE))
    for key in ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "NEXT_PUBLIC_SERVER_URL"]:
        if key in os.environ: env[key] = os.environ[key]
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

def fetch_all_districts(base_url: str) -> list[dict]:
    resp = requests.get(f"{base_url}/api/districts", params={"limit": 100, "pagination": "false", "depth": 0}, timeout=30)
    resp.raise_for_status()
    docs = resp.json().get("docs", [])
    print(f"Fetched {len(docs)} districts.")
    return docs

def fetch_all_assemblies(base_url: str) -> list[dict]:
    resp = requests.get(f"{base_url}/api/assemblies", params={"limit": 300, "pagination": "false", "depth": 0}, timeout=30)
    resp.raise_for_status()
    return resp.json().get("docs", [])

def get_district_assembly_names(assemblies: list[dict], district_id: str) -> list[str]:
    return [extract_english_name(a.get("name", "")) for a in assemblies if a.get("districtId") == district_id]

# ─── Wikipedia ────────────────────────────────────────────────────────────────

def search_wikipedia(query: str, accept_keywords: list[str]) -> str | None:
    try:
        params = {"action": "query", "list": "search", "srsearch": query, "srlimit": 5, "format": "json"}
        resp = requests.get(WIKIPEDIA_API, params=params, headers=WIKIPEDIA_HEADERS, timeout=10)
        resp.raise_for_status()
        for result in resp.json().get("query", {}).get("search", []):
            title = result.get("title", "")
            if any(kw in title.lower() for kw in accept_keywords):
                return title
    except Exception:
        pass
    return None

def fetch_extract(page_title: str, max_chars: int = 6000) -> str:
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

def get_district_wikipedia(english_name: str) -> tuple[str | None, str, bool]:
    title = search_wikipedia(f"{english_name} district Tamil Nadu", [english_name.lower(), "district"])
    if not title:
        return None, "", False
    extract = fetch_extract(title, 6000)
    return (title, extract, True) if extract else (title, "", False)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def extract_english_name(bilingual: str) -> str:
    if " / " in bilingual:
        return bilingual.split(" / ", 1)[1].strip().title()
    return bilingual.strip().title()

# ─── Bedrock ──────────────────────────────────────────────────────────────────

def build_prompt(english_name: str, zone: str, assembly_names: list[str], wiki_extract: str) -> str:
    assemblies_str = ", ".join(assembly_names[:15])
    wiki_section = f"\n=== WIKIPEDIA: {english_name} DISTRICT ===\n{wiki_extract}\n" if wiki_extract else ""

    return f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are an expert on Tamil Nadu's economy, industries, and business landscape. You have deep knowledge of every district in Tamil Nadu — their industries, major companies, agriculture, commercial areas, and economic character. Use the Wikipedia article as primary context, but supplement with your own knowledge. Be specific — name actual companies, industrial estates, and landmarks.
<|eot_id|><|start_header_id|>user<|end_header_id|>
List the known businesses, industries, and economic activities for {english_name} district in Tamil Nadu.

District zone: {zone}
Assembly constituencies: {assemblies_str}
{wiki_section}
Based on the Wikipedia context above AND your knowledge of {english_name} district, provide:

ECONOMIC_MIX:
[Estimate the economic composition as percentages adding to 100%. Categories: Agriculture, Manufacturing, Services/IT, Small Business/Retail, Others. Format: "Category: XX%"]

MAJOR_INDUSTRIES:
[Comma-separated list of 4-10 major industries, industrial estates, manufacturing sectors, IT parks in this district. For each, add estimated share of local employment. E.g.: "Automobile manufacturing (15%), Textile mills (12%)"]

TOP_EMPLOYERS:
[Comma-separated list of 4-10 notable companies, factories, institutions that are major employers. For each, add estimated workforce. E.g.: "Hyundai Motor India (~10,000 workers), TCS (~5,000)"]

LOCAL_BUSINESS_TYPES:
[Comma-separated list of 4-10 local economic activities. For each, add estimated percentage of local workforce. E.g.: "Paddy cultivation (20%), Handloom weaving (8%)"]

COMMERCIAL_LANDMARKS:
[Comma-separated list of 3-6 notable markets, commercial areas, shopping districts, industrial zones]

EDUCATION:
[List of 4-8 notable educational institutions. Format: "Name (Type)". E.g.: "Anna University (Engineering), IIT Madras (Engineering)"]

HEALTHCARE:
[List of 3-6 major hospitals. Format: "Name (Type)". E.g.: "Apollo Hospital (Multi-specialty)"]

TRANSPORT:
[List of 4-8 transport facilities. Format: "Name (Type)". Type: Railway, Metro, Bus Terminal, Highway, Airport, Port]

LANDMARKS:
[List of 4-8 tourist, religious, or historical landmarks. Format: "Name (Type)". Type: Temple, Church, Mosque, Historical Site, Park, Beach, Hill Station]

BUSINESS_SUMMARY:
[2-3 sentences describing the economic character of {english_name} district. What is the district primarily known for economically?]
<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""

class TokenExpiredError(Exception):
    pass

def invoke_bedrock(client, prompt: str, dry_run: bool = False) -> str:
    if dry_run: return "[DRY RUN]"
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

# ─── Parsers (same as assembly version) ──────────────────────────────────────

def parse_raw_list(raw, marker):
    match = re.search(rf'{marker}:\s*\n?(.*?)(?:\n\n|\n[A-Z_]+:|\Z)', raw, re.DOTALL)
    if not match: return []
    text = match.group(1).strip()
    if text.upper() == "N/A" or not text: return []
    return [i.strip().strip('"').strip("'") for i in text.split(",") if i.strip() and i.strip().upper() != "N/A"]

def parse_items_with_percentage(raw, marker):
    results, buffer = [], ""
    for item in parse_raw_list(raw, marker):
        buffer = f"{buffer}, {item}".strip(", ") if buffer else item
        if ")" in buffer or "%" not in buffer:
            m = re.match(r'^(.*?)\s*\((\d+)%\)\s*$', buffer)
            if m: results.append({"name": m.group(1).strip(), "percentage": int(m.group(2))})
            else:
                name = re.sub(r'\s*\([^)]*\)\s*$', '', buffer).strip()
                if name: results.append({"name": name})
            buffer = ""
    if buffer:
        name = re.sub(r'\s*\([^)]*\)\s*$', '', buffer).strip()
        if name: results.append({"name": name})
    return results

def parse_employers(raw):
    results, buffer = [], ""
    for item in parse_raw_list(raw, "TOP_EMPLOYERS"):
        buffer = f"{buffer}, {item}".strip(", ") if buffer else item
        if ")" in buffer or "~" not in buffer:
            m = re.match(r'^(.*?)\s*\(~?([\d,]+)\s*(?:workers?)?\)\s*$', buffer)
            if m: results.append({"name": m.group(1).strip(), "workers": int(m.group(2).replace(",", ""))})
            else:
                name = re.sub(r'\s*\([^)]*\)\s*$', '', buffer).strip()
                if name: results.append({"name": name})
            buffer = ""
    if buffer:
        name = re.sub(r'\s*\([^)]*\)\s*$', '', buffer).strip()
        if name: results.append({"name": name})
    return results

def parse_plain_list(raw, marker):
    return [re.sub(r'\s*\([^)]*\)\s*$', '', i).strip() for i in parse_raw_list(raw, marker) if i.strip()]

def parse_named_typed_list(raw, marker):
    results, buffer = [], ""
    for item in parse_raw_list(raw, marker):
        buffer = f"{buffer}, {item}".strip(", ") if buffer else item
        if ")" in buffer:
            m = re.match(r'^(.*?)\s*\(([^)]+)\)\s*$', buffer)
            if m: results.append({"name": m.group(1).strip(), "type": m.group(2).strip()})
            else:
                if buffer.strip(): results.append({"name": buffer.strip()})
            buffer = ""
        elif "(" not in buffer:
            if buffer.strip(): results.append({"name": buffer.strip()})
            buffer = ""
    if buffer:
        name = re.sub(r'\s*\([^)]*$', '', buffer).strip()
        if name: results.append({"name": name})
    return results

def parse_economic_mix(raw):
    match = re.search(r'ECONOMIC_MIX:\s*\n?(.*?)(?:\n\n|\n[A-Z_]+:|\Z)', raw, re.DOTALL)
    if not match: return []
    result = []
    for line in match.group(1).strip().splitlines():
        m = re.match(r'^([^:]+):\s*(\d+)%', line.strip())
        if m: result.append({"category": m.group(1).strip(), "percentage": int(m.group(2))})
    return result

def parse_summary(raw):
    match = re.search(r'BUSINESS_SUMMARY:\s*\n?(.*?)(?:\n\n[A-Z]|\Z)', raw, re.DOTALL)
    return match.group(1).strip() if match and match.group(1).strip().upper() != "N/A" else ""

def parse_output(raw):
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

# ─── Output ──────────────────────────────────────────────────────────────────

def load_existing():
    if OUTPUT_JSON.exists():
        try:
            entries = json.load(open(OUTPUT_JSON, "r", encoding="utf-8"))
            return entries, {e["districtId"] for e in entries}
        except Exception: pass
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
    p = argparse.ArgumentParser(description="Extract business data for districts")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--only", type=str, help="e.g. dt1,dt2")
    p.add_argument("--force", action="store_true")
    p.add_argument("--workers", type=int, default=5)
    p.add_argument("--aws-region", type=str)
    p.add_argument("--aws-key", type=str)
    p.add_argument("--aws-secret", type=str)
    p.add_argument("--aws-session-token", type=str)
    p.add_argument("--server-url", type=str)
    return p.parse_args()

def process_district(district, all_assemblies, bedrock_client, dry_run, idx, total):
    did = district.get("districtId", "")
    slug = district.get("slug", "")
    bilingual = district.get("districtName", "")
    english = extract_english_name(bilingual)
    zone = district.get("zoneName") or "N/A"

    print(f"[{idx}/{total}] {did} — {english}")
    try:
        assembly_names = get_district_assembly_names(all_assemblies, did)
        wiki_title, wiki_text, wiki_found = get_district_wikipedia(english)
        status = f"wiki={'yes' if wiki_found else 'no'} acs={len(assembly_names)}"

        prompt = build_prompt(english, zone, assembly_names, wiki_text)
        if dry_run:
            print(f"  [{did}] DRY RUN ({status})"); return None

        raw = invoke_bedrock(bedrock_client, prompt)
        biz = parse_output(raw)
        total_items = sum(len(biz[k]) for k in ["majorIndustries","topEmployers","localBusinessTypes","commercialLandmarks","education","healthcare","transport","landmarks"])
        print(f"  [{did}] Done — {total_items} items | {status}")

        return {
            "districtId": did, "slug": slug,
            "nameEnglish": english.upper(), "zoneName": zone,
            **biz,
            "wikipediaFound": wiki_found,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        }
    except TokenExpiredError: raise
    except Exception as e:
        print(f"  [{did}] ERROR: {e}"); return None

def main():
    args = parse_args()
    dry_run, force = args.dry_run, args.force
    workers = max(1, min(args.workers, 10))
    only_ids = set(args.only.split(",")) if args.only else None

    env = load_env(args)
    base_url = env["NEXT_PUBLIC_SERVER_URL"].rstrip("/")
    print(f"PayloadCMS: {base_url} | Workers: {workers}")

    bedrock_kwargs = {"region_name": env["AWS_REGION"], "aws_access_key_id": env["AWS_ACCESS_KEY_ID"],
                      "aws_secret_access_key": env["AWS_SECRET_ACCESS_KEY"]}
    if env.get("AWS_SESSION_TOKEN"):
        bedrock_kwargs["aws_session_token"] = env["AWS_SESSION_TOKEN"]
        print("Using temporary STS credentials")
    bedrock_client = boto3.client("bedrock-runtime", **bedrock_kwargs)

    districts = fetch_all_districts(base_url)
    all_assemblies = fetch_all_assemblies(base_url)
    if only_ids:
        districts = [d for d in districts if d.get("districtId") in only_ids]
    districts.sort(key=lambda d: d.get("districtId", ""))

    entries, processed = load_existing()
    if not force:
        todo = [d for d in districts if d.get("districtId") not in processed]
        skipped = len(districts) - len(todo)
    else:
        todo, skipped = districts, 0

    total_all = len(districts)
    generated, errors = 0, 0
    write_lock = threading.Lock()
    token_expired = threading.Event()

    print(f"\nProcessing {len(todo)} districts...\n")

    indexed = [(i + 1, d) for i, d in enumerate(todo)]
    try:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {executor.submit(lambda item: process_district(item[1], all_assemblies, bedrock_client, dry_run, item[0], total_all) if not token_expired.is_set() else None, item): item for item in indexed}
            for future in as_completed(futures):
                if token_expired.is_set(): break
                try:
                    entry = future.result()
                except TokenExpiredError as e:
                    token_expired.set()
                    with write_lock: save_json(entries); save_csv(entries)
                    print(f"\nAWS credentials expired. Progress saved."); sys.exit(1)
                except Exception: errors += 1; continue
                if entry is None:
                    if not dry_run: errors += 1
                    continue
                with write_lock:
                    did = entry["districtId"]
                    if force and did in processed:
                        entries[:] = [e for e in entries if e.get("districtId") != did]
                    entries.append(entry); processed.add(did); generated += 1
                    if not dry_run: save_json(entries); save_csv(entries)
    except KeyboardInterrupt:
        print("\nInterrupted. Saving...")
        if not dry_run: save_json(entries); save_csv(entries)

    print(f"\n{'='*50}")
    print(f"Done! Generated: {generated} | Skipped: {skipped} | Errors: {errors} | Total: {total_all}")
    if not dry_run: print(f"JSON: {OUTPUT_JSON}\nCSV:  {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
