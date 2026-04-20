# Election Prediction Page

This document describes the interactive election prediction page added for Tamil Nadu.

## Route

Current route:

- `/tamil-nadu/election-predictions`

Page file:

- [src/app/(frontend)/[stateSlug]/election-predictions/page.tsx](src/app/(frontend)/[stateSlug]/election-predictions/page.tsx)

## Purpose

This page is meant to feel similar to the existing assembly map, but focused on forecast data instead of historical results.

It is designed to answer three different questions quickly:

1. Who is being forecast to win each seat?
2. Which seats are volatile or too close to call?
3. What kind of language is the predictor using across the map?

## Main UI

Primary client component:

- [src/components/ElectionPredictionMap/index.tsx](src/components/ElectionPredictionMap/index.tsx)

The page currently includes:

- predictor header card
- summary cards
- constituency search
- district filter
- predictor selector
- election year selector
- interactive map
- legend
- seat forecast panel
- prediction type mix panel
- watchlist seats panel

## Visualization Modes

The page currently supports three map modes:

### 1. Winner

Colors seats by `predictedWinningParty`.

Behavior:

- party-colored fills for called seats
- amber fill for seats with no winner call
- darker borders for volatile seats

Use case:

- fastest way to understand the statewide forecast

### 2. Heat

Colors seats by contest intensity.

Behavior:

- stable calls
- close contests
- too close to call

Use case:

- quick scan for danger zones and toss-up seats

### 3. Type

Colors seats by `predictionType`.

Examples:

- `Clear Win`
- `Good Chance`
- `Tough Fight`
- `Izhubari (Dead Heat)`

Use case:

- helps see how aggressive or cautious the predictor is across regions

## Data Flow

Server data utility:

- [src/lib/electionPredictions.ts](src/lib/electionPredictions.ts)

API route:

- [src/app/api/election-predictions/route.ts](src/app/api/election-predictions/route.ts)

The flow is:

1. Read from `predictors`
2. Read from `election-predictions`
3. Filter by:
   - `stateCode`
   - `predictor`
   - `electionYear`
4. Build:
   - map result object by `assemblyId`
   - top party counts
   - prediction type counts
   - watchlist seats
   - summary metrics

## Current Summary Metrics

The page currently calculates:

- total assemblies
- called seats
- too close to call
- close contests
- leading party
- leading party seat count

## Popup Behavior

Clicking a constituency opens a popup with:

- assembly name
- district name
- prediction type
- predicted winning party or close parties
- additional notes
- link to the assembly detail page

## Search and Filter Behavior

### Constituency search

- filters by assembly name
- selecting a result focuses the map and opens the popup

### District filter

- filters by district name
- selecting a district zooms the map to that district

### Predictor selector

- reloads the dataset for the selected predictor

### Year selector

- reloads the dataset for the selected year

## Current Design Direction

The current design is intentionally not a copy of the election results page.

It keeps the familiar map interaction model, but the surrounding UI is meant to feel more editorial:

- strong red accents
- forecast summary first
- uncertainty surfaced clearly
- watchlist seats treated as an editorial shortlist

## Files Involved

- [src/app/(frontend)/[stateSlug]/election-predictions/page.tsx](src/app/(frontend)/[stateSlug]/election-predictions/page.tsx)
- [src/components/ElectionPredictionMap/index.tsx](src/components/ElectionPredictionMap/index.tsx)
- [src/app/api/election-predictions/route.ts](src/app/api/election-predictions/route.ts)
- [src/lib/electionPredictions.ts](src/lib/electionPredictions.ts)

## Current Limitations

- only Tamil Nadu is wired right now
- compare mode between two predictors is not implemented yet
- the page is not yet linked into main site navigation/home cards
- predictor branding is basic and can be made more editorial
- legend and watchlist are version one and can be refined further

## Good Next Steps

Recommended next improvements:

1. Add compare mode between two predictors
2. Add a swing-style mode showing challenger pressure vs incumbent safety
3. Add richer side panels for regional patterns
4. Add navigation entry from dashboard or home page
5. Add SEO/open graph image for prediction page specifically
