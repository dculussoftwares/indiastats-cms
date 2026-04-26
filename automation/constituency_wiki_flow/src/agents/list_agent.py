"""Agent responsible for extracting the list of assembly constituency names from a state Wikipedia page."""
from __future__ import annotations

import os

from crewai import Agent, LLM

from src.tools.mediawiki import fetch_wikipedia_wikitext, search_and_fetch_wikipedia
from src.tools.wikitext import parse_constituency_list_table

_llm = LLM(
    model=os.getenv("MODEL", "ollama/gemma4:e4b"),
    base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
    temperature=1.0,
    top_p=0.95,
)


def make_list_agent() -> Agent:
    return Agent(
        role="Wikipedia Assembly List Extractor",
        goal=(
            "Extract the complete and accurate list of all assembly (Vidhan Sabha) constituency names "
            "for an Indian state from its Wikipedia page."
        ),
        backstory=(
            "You are an expert in Indian electoral geography. You can navigate Wikipedia pages, "
            "parse constituency list tables, and return clean, deduplicated constituency names. "
            "You handle disambiguation, variant spellings, and bilingual names correctly."
        ),
        tools=[
            fetch_wikipedia_wikitext,
            search_and_fetch_wikipedia,
            parse_constituency_list_table,
        ],
        llm=_llm,
        verbose=True,
        allow_delegation=False,
    )
