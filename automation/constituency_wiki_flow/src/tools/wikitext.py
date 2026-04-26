"""Wikitext parsing tool — extracts structured data from raw MediaWiki markup."""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

import mwparserfromhell
from crewai.tools import tool


def parse_wikitable_rows(wikitext: str) -> List[Dict[str, str]]:
    """
    Parse the first wikitable in a wikitext string into a list of row dicts.
    Column headers become dict keys; cell values are cleaned plain text.
    """
    wikicode = mwparserfromhell.parse(wikitext)
    tables = wikicode.filter_tags(matches=lambda n: n.tag == "table")
    if not tables:
        return []

    rows: List[Dict[str, str]] = []
    headers: List[str] = []

    for tag in tables[0].contents.filter_tags(matches=lambda n: n.tag in ("tr",)):
        cells = tag.contents.filter_tags(matches=lambda n: n.tag in ("th", "td"))
        if not cells:
            continue
        values = [_clean(str(c.contents)) for c in cells]
        if all(c.tag == "th" for c in cells):
            headers = values
        elif headers:
            row = dict(zip(headers, values))
            rows.append(row)
        else:
            # No headers yet — treat as header row
            headers = values

    return rows


def parse_infobox(wikitext: str, template_name: str = "") -> Dict[str, str]:
    """
    Extract key-value pairs from a wikitext infobox template.
    If template_name is empty, returns the first template found.
    """
    wikicode = mwparserfromhell.parse(wikitext)
    templates = wikicode.filter_templates()
    if not templates:
        return {}

    target = None
    if template_name:
        for t in templates:
            if template_name.lower() in t.name.strip().lower():
                target = t
                break
    else:
        target = templates[0]

    if target is None:
        return {}

    result: Dict[str, str] = {}
    for param in target.params:
        key = str(param.name).strip()
        val = _clean(str(param.value))
        if val:
            result[key] = val
    return result


def extract_plain_text(wikitext: str, max_chars: int = 5000) -> str:
    """Strip all wikimarkup and return plain text (truncated to max_chars)."""
    wikicode = mwparserfromhell.parse(wikitext)
    text = wikicode.strip_code()
    return text[:max_chars].strip()


def extract_links(wikitext: str, namespace_filter: str = "") -> List[str]:
    """
    Extract all internal wiki link targets from wikitext.
    Optionally filter by namespace prefix (e.g. "Category", "File").
    """
    wikicode = mwparserfromhell.parse(wikitext)
    links = []
    for link in wikicode.filter_wikilinks():
        target = str(link.title).strip()
        if namespace_filter:
            if target.startswith(namespace_filter + ":"):
                links.append(target)
        else:
            if ":" not in target:  # exclude special namespaces
                links.append(target)
    return links


def _clean(text: str) -> str:
    """Strip wikimarkup, HTML tags, refs, and excess whitespace from a string."""
    try:
        parsed = mwparserfromhell.parse(text)
        text = parsed.strip_code()
    except Exception:
        pass
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\{\{[^}]+\}\}", "", text)
    text = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]*)\]\]", r"\1", text)
    return text.strip()


# ── CrewAI tools ──────────────────────────────────────────────────────────────

@tool("parse_constituency_list_table")
def parse_constituency_list_table(wikitext: str) -> str:
    """
    Parse a Wikipedia constituency list page wikitext and extract constituency names.
    Returns a newline-separated list of constituency names found in the first wikitable.
    """
    rows = parse_wikitable_rows(wikitext)
    if not rows:
        # Fallback: extract all internal wiki links (likely constituency page links)
        links = extract_links(wikitext)
        if links:
            return "\n".join(links)
        return "ERROR: No table or links found in wikitext."

    # Try common column name patterns for constituency name
    name_keys = ["Constituency", "Name", "Assembly constituency", "Segment", "AC Name"]
    names = []
    for row in rows:
        for key in name_keys:
            # case-insensitive key match
            match = next((v for k, v in row.items() if key.lower() in k.lower()), None)
            if match:
                names.append(match)
                break

    if not names:
        # Return all values from first column as fallback
        first_key = next(iter(rows[0]), None)
        if first_key:
            names = [r.get(first_key, "") for r in rows]

    return "\n".join(n for n in names if n)


@tool("parse_constituency_infobox")
def parse_constituency_infobox(wikitext: str) -> str:
    """
    Parse a Wikipedia constituency page wikitext and extract election years and key fields
    from the {{Infobox Indian constituency}} template.
    Returns a JSON-like string of extracted key-value pairs.
    """
    infobox = parse_infobox(wikitext, template_name="Infobox Indian constituency")
    if not infobox:
        infobox = parse_infobox(wikitext)  # fallback to first template

    if not infobox:
        return "ERROR: No infobox template found in wikitext."

    import json
    return json.dumps(infobox, ensure_ascii=False, indent=2)


@tool("extract_election_years_from_text")
def extract_election_years_from_text(text: str) -> str:
    """
    Scan plain text or wikitext for election year patterns relevant to Indian state elections.
    Returns a comma-separated list of years found (e.g. "1977, 1980, 1984, ...").
    """
    # Indian state elections range from 1952 to present
    years = sorted(set(
        int(y) for y in re.findall(r"\b(19[5-9]\d|20[0-2]\d)\b", text)
        if 1952 <= int(y) <= 2030
    ))
    if not years:
        return "No election years found."
    return ", ".join(str(y) for y in years)
