# Plan: CrewAI Wikipedia Constituency Extractor (Gemma 4)

**What**: A CrewAI Flow with Gemma 4 (local Ollama) that takes an Indian state name → scrapes Wikipedia → extracts all assembly constituency names (Task 1) → extracts election years per constituency (Task 2) → outputs one structured JSON per state.

---

## Stack

| Component | Choice |
|---|---|
| Framework | CrewAI Flows (`@start`, `@listen`, `@router`) |
| LLM | `gemma4:e4b` via Ollama (`ollama/gemma4:e4b`) |
| Package Manager | `uv` (replaces pip + venv) |
| Wikipedia | MediaWiki raw wikitext API + `mwparserfromhell` |
| State | Pydantic `BaseModel` typed `Flow[WikiFlowState]` |
| Memory | CrewAI built-in (`self.remember()` / `self.recall()` via LanceDB) |
| Output | Single `output/{state-slug}/result.json` |

---

## Package Manager: uv

```bash
# Setup (one time)
uv init
uv add crewai mwparserfromhell requests pydantic python-dotenv rich

# Run
uv run python -m src.flow --state "tamil-nadu"

# Add a new dep later
uv add wikipedia-api
```

`uv` replaces the existing `.venv` approach in `state_wiki_extractor/`. No `pip install`, no manual `source .venv/bin/activate` — `uv run` handles the virtualenv automatically.

---

## Folder Structure

```
automation/constituency_wiki_flow/
├── .env                    # MODEL=ollama/gemma4:e4b, OLLAMA_BASE_URL=http://localhost:11434
├── pyproject.toml          # uv-managed deps
├── src/
│   ├── state.py            # WikiFlowState (Pydantic), ConstituencyRecord, ElectionYear schemas
│   ├── tools/
│   │   ├── mediawiki.py    # @tool: fetch raw wikitext via MediaWiki API action=query
│   │   └── wikitext.py     # @tool: parse wikitables + {{Infobox}} using mwparserfromhell
│   ├── agents/
│   │   ├── list_agent.py   # Agent: extract all assembly names from state list page
│   │   └── detail_agent.py # Agent: extract election years from constituency page
│   └── flow.py             # Main ConstituencyFlow class
└── output/
    └── {state-slug}/
        └── result.json
```

---

## Pipeline (Flow Stages)

**Stage 1 — Sequential** (one Wikipedia page)
- `@start() fetch_state_page` — MediaWiki API fetches raw wikitext of the state's constituency list page (e.g. *"List of constituencies of Tamil Nadu Legislative Assembly"*)
- `@listen(fetch_state_page) extract_assembly_list` — `mwparserfromhell` parses the wikitable; Gemma 4 cleans/disambiguates → `state.assembly_names: List[str]` (234 for TN)

**Stage 2 — Parallel** (N Wikipedia pages, I/O bound)
- `@listen(extract_assembly_list) fetch_constituency_pages` — fans out parallel `requests` calls to MediaWiki API for each assembly's Wikipedia page → `state.raw_pages: Dict[str, str]`

**Stage 3 — Batched** (LLM extraction, 10 at a time to not overwhelm Ollama)
- `@listen(fetch_constituency_pages) extract_election_years` — for each assembly, Gemma 4 agent uses `mwparserfromhell` to parse the infobox `{{Infobox Indian constituency}}` and extract `election_years: List[int]` → `state.structured_data`

**Stage 4 — Sequential**
- `@router validate_data` → routes to `"complete"` or `"needs_review"` based on completeness threshold
- `@listen("complete") export_json` → writes `output/{state-slug}/result.json`
- `@listen("needs_review") flag_incomplete` → writes `output/{state-slug}/missing.json`

---

## State Schema

`WikiFlowState` fields:

| Field | Type | Set At |
|---|---|---|
| `state_name` | `str` | Input |
| `state_slug` | `str` | Input |
| `assembly_names` | `List[str]` | Stage 1 |
| `raw_pages` | `Dict[str, str]` | Stage 2 |
| `structured_data` | `Dict[str, ConstituencyRecord]` | Stage 3 |
| `failed_pages` | `List[str]` | Stage 2/3 |

`ConstituencyRecord`: `name (str)`, `wikipedia_url (str)`, `election_years (List[int])`, `extraction_confidence (float)`

---

## LLM Config

- Model: `ollama/gemma4:e4b` at `http://localhost:11434`
- `temperature=1.0, top_p=0.95, top_k=64` (Google's recommended Gemma 4 params)
- Thinking mode enabled for Stage 3 (ambiguous infobox parsing)
- Native tool calling used for `@tool` functions

---

## Setup Commands

```bash
# Prerequisites
brew install uv
ollama pull gemma4:e4b

# Project setup
cd automation/constituency_wiki_flow
uv init
uv add "crewai[litellm]" mwparserfromhell requests pydantic python-dotenv rich typer

# Run
uv run python -m src.flow --state "tamil-nadu"

# Single stage test
uv run python -m src.flow --state "goa" --stage 1
```

---

## Verification Steps

1. `ollama pull gemma4:e4b` → confirm model loads at `localhost:11434`
2. Run Stage 1 only for Tamil Nadu → assert 234 assembly names returned
3. Run Stage 2 for 5 sample assemblies → verify raw wikitext non-empty
4. Run full flow for **Goa** (40 assemblies) → fast end-to-end test
5. Validate `output/goa/result.json` structure + spot-check election years against known data

---

## Design Decisions

- **Scope**: Task 1 + Task 2 only for now; additional tasks (voter demographics, MLA info, etc.) added later as new `@listen` stages without breaking existing ones
- **Parallelism**: Stage 2 always parallel (pure I/O); Stage 3 batched in groups of 10 (Ollama single-instance constraint)
- **New folder**: `automation/constituency_wiki_flow/` — independent of the two existing scaffolds (`state_wiki_extractor/`, `assembly_constituency_wikipedia_flow/`)
- **Output**: One `result.json` per state containing all constituencies
- **Package manager**: `uv` — no manual venv activation, lockfile via `uv.lock`, reproducible across machines
