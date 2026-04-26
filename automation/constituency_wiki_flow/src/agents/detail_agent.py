"""Agent responsible for extracting detailed data (election years, results) from a single constituency Wikipedia page."""
from __future__ import annotations

import os

from crewai import Agent, LLM

from src.tools.mediawiki import fetch_wikipedia_wikitext, search_and_fetch_wikipedia
from src.tools.wikitext import (
    extract_election_years_from_text,
    parse_constituency_infobox,
)

_llm = LLM(
    model=os.getenv("MODEL", "ollama/gemma4:e4b"),
    base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
    temperature=1.0,
    top_p=0.95,
)


def make_detail_agent() -> Agent:
    return Agent(
        role="Wikipedia Constituency Detail Extractor",
        goal=(
            "For a given Indian assembly constituency, extract its election years "
            "and key metadata (district, reserved status) from its Wikipedia page."
        ),
        backstory=(
            "You are an expert in Indian state legislative assembly elections. "
            "You can read Wikipedia infoboxes, parse election result tables, "
            "and extract structured data including election years, winning candidates, "
            "parties, vote counts, and margins. You are precise and never hallucinate data."
        ),
        tools=[
            fetch_wikipedia_wikitext,
            search_and_fetch_wikipedia,
            parse_constituency_infobox,
            extract_election_years_from_text,
        ],
        llm=_llm,
        verbose=True,
        allow_delegation=False,
    )
