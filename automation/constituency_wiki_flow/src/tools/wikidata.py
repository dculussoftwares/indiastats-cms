"""
Wikipedia Category API tool — discovers all assembly constituency page titles for an Indian state.

Uses Wikipedia's `categorymembers` API (Category:Assembly constituencies of {State}) which
provides exact page titles, eliminating all disambiguation page issues.

Public API (unchanged from the Wikidata version):
  STATE_QIDS   — dict[str, str]: state slug → Wikipedia category name
  query_constituencies(category_name) — list of {qid, name, wikipedia_title, ac_number}
"""
from __future__ import annotations

import re
import time

import requests

WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
USER_AGENT = "IndiaStats-ConstituencyFlow/1.0 (https://indiastats.in)"

# State slug → Wikipedia category containing all assembly constituency pages.
# Verify / add entries before querying an unsupported state.
STATE_QIDS: dict[str, str] = {
    "andhra-pradesh": "Assembly constituencies of Andhra Pradesh",
    "arunachal-pradesh": "Assembly constituencies of Arunachal Pradesh",
    "assam": "Assembly constituencies of Assam",
    "bihar": "Assembly constituencies of Bihar",
    "chhattisgarh": "Assembly constituencies of Chhattisgarh",
    "delhi": "Assembly constituencies of Delhi",
    "goa": "Assembly constituencies of Goa",
    "gujarat": "Assembly constituencies of Gujarat",
    "haryana": "Assembly constituencies of Haryana",
    "himachal-pradesh": "Assembly constituencies of Himachal Pradesh",
    "jharkhand": "Assembly constituencies of Jharkhand",
    "karnataka": "Assembly constituencies of Karnataka",
    "kerala": "Assembly constituencies of Kerala",
    "madhya-pradesh": "Assembly constituencies of Madhya Pradesh",
    "maharashtra": "Assembly constituencies of Maharashtra",
    "manipur": "Assembly constituencies of Manipur",
    "meghalaya": "Assembly constituencies of Meghalaya",
    "mizoram": "Assembly constituencies of Mizoram",
    "nagaland": "Assembly constituencies of Nagaland",
    "odisha": "Assembly constituencies of Odisha",
    "punjab": "Assembly constituencies of Punjab, India",
    "rajasthan": "Assembly constituencies of Rajasthan",
    "sikkim": "Assembly constituencies of Sikkim",
    "tamil-nadu": "Assembly constituencies of Tamil Nadu",
    "telangana": "Assembly constituencies of Telangana",
    "tripura": "Assembly constituencies of Tripura",
    "uttar-pradesh": "Assembly constituencies of Uttar Pradesh",
    "uttarakhand": "Assembly constituencies of Uttarakhand",
    "west-bengal": "Assembly constituencies of West Bengal",
}


def query_constituencies(category_name: str, retries: int = 3) -> list[dict[str, str]]:
    """
    Fetch all assembly constituency pages in a Wikipedia category.

    Returns a list of dicts with keys:
      - qid:              empty (not available from category listing)
      - name:             constituency display name (extracted from page title)
      - wikipedia_title:  exact Wikipedia page title (no disambiguation issues)
      - ac_number:        empty (not available from category listing)
    """
    pages: list[dict[str, str]] = []
    params: dict[str, str] = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": f"Category:{category_name}",
        "cmlimit": "500",
        "cmtype": "page",
        "cmprop": "title|ids",
        "format": "json",
    }
    headers = {"User-Agent": USER_AGENT}

    while True:
        for attempt in range(retries):
            try:
                resp = requests.get(
                    WIKIPEDIA_API, params=params, headers=headers, timeout=15
                )
                resp.raise_for_status()
                data = resp.json()
                break
            except Exception as exc:
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    raise RuntimeError(
                        f"Wikipedia category API failed after {retries} attempts: {exc}"
                    ) from exc

        members = data["query"]["categorymembers"]
        for member in members:
            title: str = member["title"]
            # Skip templates, list pages, disambiguation pages, etc.
            if ":" in title or title.lower().startswith("list of"):
                continue
            name = _title_to_name(title)
            if not name:
                continue
            pages.append({
                "qid": "",
                "name": name,
                "wikipedia_title": title,
                "ac_number": "",
            })

        # Paginate if Wikipedia returns a continuation token
        cont = data.get("continue", {})
        if "cmcontinue" in cont:
            params["cmcontinue"] = cont["cmcontinue"]
        else:
            break

    return pages


def _title_to_name(title: str) -> str:
    """
    Extract constituency display name from a Wikipedia page title.

    Examples:
      "Rithala Assembly constituency"             → "Rithala"
      "Deoli, Delhi Assembly constituency"        → "Deoli"
      "Matiala (Vidhan Sabha constituency)"       → "Matiala"
      "Adarsh Nagar, Delhi Assembly constituency" → "Adarsh Nagar"
    """
    # Strip "(Vidhan Sabha constituency)" or "(Assembly constituency)" variants
    name = re.sub(r"\s*\(\s*(?:Vidhan\s+Sabha|Assembly)\s+constituency\s*\)", "", title, flags=re.I)
    # Strip " Assembly constituency" or " Vidhan Sabha constituency" suffix (and anything after)
    name = re.sub(r"\s+(?:Assembly|Vidhan\s+Sabha)\s+constituency\b.*", "", name, flags=re.I)
    # Strip trailing state disambiguation like ", Delhi" or ", West Bengal"
    name = re.sub(r",\s*[\w][\w\s]*$", "", name).strip()
    return name.strip()

