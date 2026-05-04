import type { CollectionConfig } from 'payload'

/**
 * ElectionResults2026 — one document per assembly constituency.
 *
 * Pre-seeded with 234 TN assemblies from tn-2026-voting-trends.json.
 * During counting, update `currentRound`, `totalRounds`, and `parties[]`.
 * Status is stored explicitly so admin can override if needed.
 */
export const ElectionResults2026: CollectionConfig = {
  slug: 'election-results-2026',
  admin: {
    useAsTitle: 'assemblyName',
    defaultColumns: [
      'assemblyId',
      'assemblyName',
      'districtName',
      'status',
      'currentRound',
      'totalRounds',
    ],
    group: 'Election Data',
    description:
      'Live 2026 TN election counting data — one record per assembly. assemblyId is the unique key (e.g. ac001).',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'stateCode',
      type: 'text',
      required: true,
      index: true,
      defaultValue: 'TN',
      admin: { description: 'State code (e.g. TN)' },
    },
    {
      name: 'assemblyId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Stable public ID — e.g. ac001' },
    },
    {
      name: 'assemblyName',
      type: 'text',
      required: true,
      admin: { description: 'English name of the constituency' },
    },
    {
      name: 'districtName',
      type: 'text',
      admin: { description: 'District the assembly belongs to' },
    },
    // ── Elector / turnout data from ECI (seeded from voting-trends JSON) ──
    {
      name: 'electors',
      type: 'number',
      admin: { description: 'Total registered electors (2026 roll)' },
    },
    {
      name: 'votes',
      type: 'number',
      admin: { description: 'Total votes polled' },
    },
    {
      name: 'turnoutPercent',
      type: 'number',
      admin: { description: 'Voter turnout % (e.g. 85.15)' },
    },
    // ── Live counting fields ──────────────────────────────────────────────
    {
      name: 'totalRounds',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Total counting rounds for this constituency' },
    },
    {
      name: 'currentRound',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Rounds completed so far (0 = not started)' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending (not started)', value: 'pending' },
        { label: 'Counting (in progress)', value: 'counting' },
        { label: 'Leading (rounds done, leading candidate clear)', value: 'leading' },
        { label: 'Declared (final result)', value: 'declared' },
      ],
      admin: {
        description: 'Current result status. Can also be derived from round data.',
      },
    },
    {
      name: 'parties',
      type: 'array',
      defaultValue: [],
      admin: {
        description: 'Party-wise vote tally from counting rounds so far',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: { description: 'Party abbreviation — e.g. DMK, ADMK' },
        },
        {
          name: 'candidateName',
          type: 'text',
          admin: { description: 'Candidate name (optional)' },
        },
        {
          name: 'votes',
          type: 'number',
          required: true,
          defaultValue: 0,
        },
      ],
    },
  ],
}
