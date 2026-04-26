from __future__ import annotations

from typing import Dict, List

from pydantic import BaseModel, Field


class WikidataItem(BaseModel):
    """Structured data for one constituency returned from Wikidata SPARQL."""
    qid: str = ""
    name: str = ""
    wikipedia_title: str = ""  # exact English Wikipedia page title
    ac_number: str = ""        # assembly constituency number (e.g. "1", "234")


class ElectionResult(BaseModel):
    year: int
    winner: str = ""
    party: str = ""
    votes: int = 0
    margin: int = 0
    runner_up: str = ""


class ConstituencyRecord(BaseModel):
    name: str
    wikipedia_title: str = ""
    wikipedia_url: str = ""
    district: str = ""
    reserved_status: str = ""  # "General" | "SC" | "ST"
    election_years: List[int] = Field(default_factory=list)
    election_results: List[ElectionResult] = Field(default_factory=list)
    extraction_confidence: float = 0.0
    extraction_notes: str = ""


class WikiFlowState(BaseModel):
    # Input
    state_name: str = ""
    state_slug: str = ""

    # Stage 1 output (Wikidata)
    wikidata_items: List[WikidataItem] = Field(default_factory=list)
    assembly_names: List[str] = Field(default_factory=list)  # derived from wikidata_items

    # Stage 2 output (Wikipedia pages)
    raw_pages: Dict[str, str] = Field(default_factory=dict)  # assembly_name -> wikitext

    # Stage 3 output (parsed data)
    structured_data: Dict[str, ConstituencyRecord] = Field(default_factory=dict)

    # Error tracking
    failed_pages: List[str] = Field(default_factory=list)
    validation_errors: List[str] = Field(default_factory=list)

    # Output
    output_path: str = ""
