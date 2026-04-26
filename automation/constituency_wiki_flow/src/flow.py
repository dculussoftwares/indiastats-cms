"""
Main CrewAI Flow: ConstituencyWikiFlow

Stages:
  1. fetch_from_wikidata      — @start: SPARQL query → constituency names + exact Wikipedia titles
  2. fetch_constituency_pages — @listen: parallel Wikipedia page fetch using exact Wikidata titles
  3. extract_election_years   — @listen: deterministic mwparserfromhell extraction per page
  4. validate_data            — @router: route to "complete" or "needs_review"
  5. export_json              — @listen("complete"): write result.json
  6. flag_incomplete          — @listen("needs_review"): write missing.json
"""
from __future__ import annotations

import concurrent.futures
import json
import os
import re
from pathlib import Path

import mwparserfromhell
import typer
from crewai.flow.flow import Flow, listen, router, start
from dotenv import load_dotenv
from rich.console import Console
from rich.progress import track

from src.state import ConstituencyRecord, WikidataItem, WikiFlowState
from src.tools.mediawiki import fetch_wikitext, search_wikipedia_title
from src.tools.wikidata import query_constituencies, STATE_QIDS

load_dotenv()
console = Console()

# ── Deterministic parsers (no LLM) ───────────────────────────────────────────


def _parse_constituency_data(name: str, wikitext: str) -> "ConstituencyRecord":
    """
    Parse a constituency Wikipedia page deterministically:
    1. Infobox fields for district and reserved status
    2. {{Election box begin}} templates + ===YEAR=== section headers for election years
    Confidence: 1.0 if years found via election boxes, 0.7 via section headers, 0.2 if none.
    """
    wikicode = mwparserfromhell.parse(wikitext)

    # ── District + reserved_status from infobox ──────────────────────────────
    district = ""
    reserved_status = "General"

    for tmpl in wikicode.filter_templates():
        tname = str(tmpl.name).strip().lower()
        if "infobox" in tname and "constituency" in tname:
            for param in tmpl.params:
                key = str(param.name).strip().lower()
                val = mwparserfromhell.parse(str(param.value)).strip_code().strip()
                if not val:
                    continue
                if key in ("district", "districts"):
                    district = val
                elif key in ("reserved", "reservation", "category"):
                    vl = val.lower()
                    if "sc" in vl:
                        reserved_status = "SC"
                    elif "st" in vl:
                        reserved_status = "ST"
            break

    # Fallback: detect SC/ST from coloured table cells in wikitext
    if reserved_status == "General":
        if re.search(r"background\s*[=:]\s*#fef06d", wikitext, re.IGNORECASE):
            reserved_status = "SC"
        elif re.search(r"background\s*[=:]\s*#[a-f0-9]{6}", wikitext, re.IGNORECASE):
            # ST cells use a different colour — check common patterns
            pass

    # ── Election years from {{Election box begin}} title field ────────────────
    election_years: set[int] = set()

    for tmpl in wikicode.filter_templates():
        tname = str(tmpl.name).strip().lower()
        if "election box begin" in tname or "election box" == tname:
            if tmpl.has("title"):
                title_val = str(tmpl.get("title").value)
                for y in re.findall(r"\b(19[5-9]\d|20[0-2]\d)\b", title_val):
                    election_years.add(int(y))

    confidence = 1.0 if election_years else 0.0

    # ── Fallback: section headers ===YEAR=== ─────────────────────────────────
    if not election_years:
        for y in re.findall(r"===\s*(19[5-9]\d|20[0-2]\d)\s*===", wikitext):
            election_years.add(int(y))
        if election_years:
            confidence = 0.7

    # ── Fallback: any year mentioned in election context ─────────────────────
    if not election_years:
        for y in re.findall(r"\b(19[5-9]\d|20[0-2]\d)\b", wikitext):
            election_years.add(int(y))
        if election_years:
            confidence = 0.2

    return ConstituencyRecord(
        name=name,
        district=district,
        reserved_status=reserved_status,
        election_years=sorted(election_years),
        extraction_confidence=confidence,
    )



class ConstituencyWikiFlow(Flow[WikiFlowState]):

    # ── Stage 1: query Wikidata for all constituencies ────────────────────────

    @start()
    def fetch_from_wikidata(self) -> None:
        console.rule(f"[bold red]Stage 1 — Querying Wikidata for {self.state.state_name}")

        state_qid = STATE_QIDS.get(self.state.state_slug)
        if not state_qid:
            raise ValueError(
                f"No Wikipedia category configured for '{self.state.state_slug}'. "
                f"Add it to STATE_QIDS in src/tools/wikidata.py."
            )

        console.print(f"[dim]Wikipedia category:[/dim] Category:{state_qid}")
        items = query_constituencies(state_qid)

        if not items:
            raise ValueError(
                f"Wikidata returned 0 constituencies for {self.state.state_name} (QID: {state_qid}). "
                f"Check the QID or try a different approach."
            )

        self.state.wikidata_items = [WikidataItem(**item) for item in items]
        self.state.assembly_names = [item["name"] for item in items]

        with_wp = sum(1 for item in items if item["wikipedia_title"])
        console.print(
            f"[green]Found {len(items)} constituencies[/green] | "
            f"{with_wp} have exact Wikipedia titles from Wikidata"
        )

    # ── Stage 2: parallel fetch of constituency Wikipedia pages ──────────────

    @listen(fetch_from_wikidata)
    def fetch_constituency_pages(self) -> None:
        console.rule(f"[bold red]Stage 2 — Fetching {len(self.state.assembly_names)} constituency pages")

        # Build name → exact Wikipedia title from Wikidata
        wp_title_map = {
            item.name: item.wikipedia_title
            for item in self.state.wikidata_items
        }

        def fetch_one(name: str) -> tuple[str, str | None]:
            # 1. Use exact Wikidata-provided Wikipedia title (most accurate)
            title = wp_title_map.get(name, "")
            if title:
                wikitext = fetch_wikitext(title)
                if wikitext:
                    return name, wikitext
            # 2. Fallback: standard disambiguation pattern
            title = f"{name} (Vidhan Sabha constituency)"
            wikitext = fetch_wikitext(title)
            if wikitext is None:
                # 3. Last resort: Wikipedia search
                found = search_wikipedia_title(f"{name} assembly constituency {self.state.state_name}")
                if found:
                    wikitext = fetch_wikitext(found)
            return name, wikitext

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = {executor.submit(fetch_one, name): name for name in self.state.assembly_names}
            for future in track(
                concurrent.futures.as_completed(futures),
                total=len(futures),
                description="Fetching pages...",
            ):
                try:
                    name, wikitext = future.result()
                    if wikitext:
                        self.state.raw_pages[name] = wikitext
                    else:
                        self.state.failed_pages.append(name)
                        console.print(f"[yellow]Warning:[/yellow] Could not fetch page for '{name}'")
                except Exception as exc:
                    orig_name = futures[future]
                    self.state.failed_pages.append(orig_name)
                    console.print(f"[red]Error fetching '{orig_name}': {exc}")

        console.print(
            f"[green]Fetched {len(self.state.raw_pages)} pages, "
            f"[yellow]{len(self.state.failed_pages)} failed"
        )

    # ── Stage 4: deterministic extraction of election years ─────────────────

    @listen(fetch_constituency_pages)
    def extract_election_years(self) -> None:
        console.rule("[bold red]Stage 4 — Extracting election years per constituency (deterministic)")

        # Build name → Wikidata info for enriching records
        wikidata_lookup = {item.name: item for item in self.state.wikidata_items}

        names = list(self.state.raw_pages.keys())
        for idx, name in enumerate(names):
            wikitext = self.state.raw_pages[name]
            result = _parse_constituency_data(name, wikitext)

            # Enrich with Wikidata fields where available
            wd = wikidata_lookup.get(name)
            if wd:
                result.wikipedia_title = wd.wikipedia_title
                if wd.ac_number:
                    result.extraction_notes = f"AC#{wd.ac_number}"

            self.state.structured_data[name] = result
            confidence = f"{result.extraction_confidence:.0%}"
            years_str = str(result.election_years) if result.election_years else "none found"
            console.print(f"  [{idx + 1}/{len(names)}] {name} — years: {years_str} [{confidence}]")

        console.print(f"[green]Extracted data for {len(self.state.structured_data)} constituencies")

    # ── Stage 5: validate and route ───────────────────────────────────────────

    @router(extract_election_years)
    def validate_data(self) -> str:
        total = len(self.state.assembly_names)
        extracted = len(self.state.structured_data)
        low_confidence = sum(
            1 for r in self.state.structured_data.values() if r.extraction_confidence < 0.5
        )

        if extracted == 0:
            self.state.validation_errors.append("No structured data extracted at all.")
            return "needs_review"

        coverage = extracted / max(total, 1)
        console.print(f"  Coverage: {coverage:.1%} | Low confidence: {low_confidence}")

        if coverage < 0.5 or low_confidence > extracted * 0.5:
            self.state.validation_errors.append(
                f"Low coverage ({coverage:.1%}) or too many low-confidence records ({low_confidence})."
            )
            return "needs_review"

        return "complete"

    # ── Stage 6a: export full result ──────────────────────────────────────────

    @listen("complete")
    def export_json(self) -> None:
        console.rule("[bold green]Stage 6 — Exporting result.json")
        self._write_output("result.json", self._build_output())
        console.print(f"[bold green]Done! Output: {self.state.output_path}")

    # ── Stage 6b: flag incomplete ─────────────────────────────────────────────

    @listen("needs_review")
    def flag_incomplete(self) -> None:
        console.rule("[bold yellow]Stage 6 — Writing missing.json (needs review)")
        output = self._build_output()
        output["validation_errors"] = self.state.validation_errors
        self._write_output("missing.json", output)
        console.print(f"[bold yellow]Needs review. Output: {self.state.output_path}")

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _build_output(self) -> dict:
        return {
            "state_name": self.state.state_name,
            "state_slug": self.state.state_slug,
            "total_constituencies": len(self.state.assembly_names),
            "extracted_count": len(self.state.structured_data),
            "failed_pages": self.state.failed_pages,
            "constituencies": {
                name: record.model_dump()
                for name, record in self.state.structured_data.items()
            },
        }

    def _write_output(self, filename: str, data: dict) -> None:
        out_dir = Path("output") / self.state.state_slug
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / filename
        out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        self.state.output_path = str(out_path)


# ── CLI entry point ───────────────────────────────────────────────────────────

app = typer.Typer()


@app.command()
def main(
    state: str = typer.Option(..., "--state", "-s", help="State slug, e.g. 'tamil-nadu'"),
    state_name: str = typer.Option("", "--name", "-n", help="Human-readable state name (auto-inferred if omitted)"),
) -> None:
    """Run the constituency Wikipedia extraction flow for a given Indian state."""
    if not state_name:
        state_name = state.replace("-", " ").title()

    console.print(f"[bold]Starting ConstituencyWikiFlow for:[/bold] {state_name}")

    flow = ConstituencyWikiFlow()
    flow.state.state_name = state_name
    flow.state.state_slug = state
    flow.kickoff()


if __name__ == "__main__":
    app()
