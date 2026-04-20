# Election Predictions Implementation

This document summarizes the election prediction data model and import flow added to this project.

## Overview

Prediction data is stored in two Payload collections:

- `predictors`
- `election-predictions`

This keeps predictor profile data separate from per-assembly prediction rows.

## Files Added

- [src/collections/Predictors.ts](src/collections/Predictors.ts)
- [src/collections/ElectionPredictions.ts](src/collections/ElectionPredictions.ts)
- [scripts/import-election-predictions.mts](scripts/import-election-predictions.mts)

Collections are registered in:

- [src/payload.config.ts](src/payload.config.ts)

Payload types are regenerated in:

- [src/payload-types.ts](src/payload-types.ts)

## Collection Design

### `predictors`

Used for reusable predictor metadata.

Fields:

- `name`
- `imagePath`
- `bio`
- `isActive`

Notes:

- `name` is unique.
- `imagePath` should be a public path such as `/images/JVC.png`.

### `election-predictions`

Used for one predictor's prediction for one assembly in one election year.

Fields:

- `stateCode`
- `electionYear`
- `predictor`
- `assemblyDoc`
- `assemblyId`
- `predictedWinningParty`
- `predictionType`
- `isCloseContest`
- `closeParties`
- `additionalNotes`
- `predictionKey`

Notes:

- `assemblyDoc` is the relationship to the `assemblies` collection.
- `assemblyId` is the stable public assembly key such as `ac001`.
- `predictionKey` is unique and is built as:
  `predictorId:assemblyId:electionYear`
- This makes imports idempotent for the same predictor and election year.

## Validation Rules

Implemented in [src/collections/ElectionPredictions.ts](src/collections/ElectionPredictions.ts).

Rules:

- If `predictedWinningParty` is `null`, `closeParties` must contain at least one party.
- Empty party strings in `closeParties` are removed before validation.
- Blank `predictedWinningParty` values are normalized to `null`.

## Import Script

Importer:

- [scripts/import-election-predictions.mts](scripts/import-election-predictions.mts)

The script currently contains a hard-coded `importSpec`:

- `electionYear: 2026`
- `stateCode: TN`
- `filePath: prediction2/final.json`
- predictor name: `JVC Sreeram (Bulls Eye)`

It does the following:

1. Creates or updates the predictor record.
2. Loads the prediction JSON file.
3. Matches each row using `assembly_id` against the existing `assemblies` collection.
4. Validates the null winner / close parties rule.
5. Creates or updates `election-predictions` rows using `predictionKey`.

## Commands

Generate Payload types:

```bash
pnpm payload generate:types
```

Push schema to DB:

```bash
DOTENV_CONFIG_PATH=.env.local node -r dotenv/config --import tsx/esm scripts/push-db-schema.ts
```

Import predictions:

```bash
DOTENV_CONFIG_PATH=.env.local node -r dotenv/config --import tsx/esm scripts/import-election-predictions.mts
```

## Current Imported Dataset

Current import:

- predictor: `JVC Sreeram (Bulls Eye)`
- year: `2026`
- file: [prediction2/final.json](prediction2/final.json)
- imported rows: `234`

Image path note:

- input provided: `/public/images/JVC.png`
- stored in DB as: `/images/JVC.png`

This normalization is intentional because files inside `public/` are served from the root path in Next.js.

## Future Imports

To import another predictor using the same script:

1. Update `importSpec` in [scripts/import-election-predictions.mts](scripts/import-election-predictions.mts).
2. Set the correct:
   - predictor name
   - bio
   - image path
   - election year
   - prediction file path
3. Run the schema push only if the schema changed.
4. Run the importer.

## Important Implementation Notes

- Prediction rows do not store `assemblyName`; assembly metadata should come from the linked `assemblies` document.
- Matching is based on `assembly_id` from the JSON file.
- If an assembly is missing in the DB, the import fails instead of partially importing inconsistent data.
- Re-running the same import updates the existing rows instead of creating duplicates.
