"""MediaWiki API tool — fetches raw wikitext for a given Wikipedia page title."""
from __future__ import annotations

import time
from typing import Optional

import requests
from crewai.tools import tool

MEDIAWIKI_API = "https://en.wikipedia.org/w/api.php"
USER_AGENT = "IndiaStats-ConstituencyFlow/1.0 (https://indiastats.in)"
_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})


def fetch_wikitext(title: str, retries: int = 3) -> Optional[str]:
    """
    Fetch raw wikitext for a Wikipedia page title via the MediaWiki API.
    Returns None if the page does not exist or all retries fail.
    """
    params = {
        "action": "query",
        "prop": "revisions",
        "rvprop": "content",
        "rvslots": "main",
        "titles": title,
        "format": "json",
        "formatversion": "2",
        "redirects": 1,  # automatically follow Wikipedia redirects
    }
    for attempt in range(retries):
        try:
            resp = _session.get(MEDIAWIKI_API, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            pages = data.get("query", {}).get("pages", [])
            if not pages:
                return None
            page = pages[0]
            if "missing" in page:
                return None
            return page["revisions"][0]["slots"]["main"]["content"]
        except requests.RequestException as exc:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise RuntimeError(f"Failed to fetch '{title}' after {retries} attempts: {exc}") from exc
    return None


def search_wikipedia_title(query: str) -> Optional[str]:
    """
    Search Wikipedia for the best matching page title for a query string.
    Returns the top result title or None.
    """
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": 1,
        "format": "json",
        "formatversion": "2",
    }
    resp = _session.get(MEDIAWIKI_API, params=params, timeout=15)
    resp.raise_for_status()
    results = resp.json().get("query", {}).get("search", [])
    return results[0]["title"] if results else None


@tool("fetch_wikipedia_wikitext")
def fetch_wikipedia_wikitext(title: str) -> str:
    """
    Fetches the raw wikitext content of a Wikipedia page given its exact title.
    Use this to retrieve a state's constituency list page or a single constituency page.
    Returns the full wikitext string, or an error message if the page is not found.
    """
    wikitext = fetch_wikitext(title)
    if wikitext is None:
        return f"ERROR: Page '{title}' not found on Wikipedia."
    return wikitext


@tool("search_and_fetch_wikipedia")
def search_and_fetch_wikipedia(query: str) -> str:
    """
    Searches Wikipedia for the best matching page for the given query,
    then fetches and returns its raw wikitext.
    Use this when you are unsure of the exact Wikipedia page title.
    """
    title = search_wikipedia_title(query)
    if title is None:
        return f"ERROR: No Wikipedia page found for query '{query}'."
    wikitext = fetch_wikitext(title)
    if wikitext is None:
        return f"ERROR: Found title '{title}' but could not fetch its content."
    return f"TITLE: {title}\n\n{wikitext}"
