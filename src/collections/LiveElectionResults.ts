import type { CollectionConfig } from 'payload'

/**
 * LiveElectionResults — one document per assembly constituency per election year.
 *
 * Unique key: (assemblyId, year, stateCode)
 *
 * Seeded before counting day with constituency metadata + electors.
 * During counting, `eci-push.mts` updates `currentRound`, `totalRounds`,
 * `status`, and `parties[]` via direct SQL.
 *
 * To add a new election:
 *   1. Run the seed script with the new year:  pnpm exec tsx scripts/seed-live-election-results.mts --year=2031
 *   2. On counting day run:  pnpm eci:push --year=2031
 */
export const LiveElectionResults: CollectionConfig = {
  slug: 'live-election-results',
  admin: {
    useAsTitle: 'assemblyName',
    defaultColumns: [
      'year',
      'assemblyId',
      'assemblyName',
      'districtName',
      'status',
      'currentRound',
      'totalRounds',
    ],
    group: 'Election Data',
    description:
      'Live election counting data — one record per assembly per year. Unique key: (assemblyId + year + stateCode).',
  },
  access: {
    read: () => true,
    update: ({ req }) => {
      if (req.user) return true
      const auth = req.headers.get('authorization') ?? ''
      const token = auth.replace(/^Bearer\s+/i, '').trim()
      return !!token && token === process.env.CRON_SECRET
    },
  },
  fields: [
    // ── Identity ──────────────────────────────────────────────────────────
    {
      name: 'year',
      type: 'number',
      required: true,
      index: true,
      admin: { description: 'Election year — e.g. 2026, 2031' },
    },
    {
      name: 'stateCode',
      type: 'text',
      required: true,
      index: true,
      defaultValue: 'TN',
      admin: { description: 'State code — e.g. TN, MH, UP' },
    },
    {
      name: 'assemblyId',
      type: 'text',
      required: true,
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
    // ── Elector / turnout ─────────────────────────────────────────────────
    {
      name: 'electors',
      type: 'number',
      admin: { description: 'Total registered electors' },
    },
    {
      name: 'votes',
      type: 'number',
      admin: { description: 'Total votes polled' },
    },
    {
      name: 'turnoutPercent',
      type: 'number',
      admin: { description: 'Voter turnout % — e.g. 85.15' },
    },
    // ── Live counting ─────────────────────────────────────────────────────
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
    },
    {
      name: 'parties',
      type: 'array',
      defaultValue: [],
      admin: { description: 'Party-wise vote tally (sorted by votes desc)' },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: { description: 'Party abbreviation — e.g. TVK, DMK, AIADMK' },
        },
        {
          name: 'candidateName',
          type: 'text',
          admin: { description: 'Candidate name' },
        },
        {
          name: 'votes',
          type: 'number',
          required: true,
          defaultValue: 0,
        },
      ],
    },
    // ── Scraper fields ────────────────────────────────────────────────────
    {
      name: 'margin',
      type: 'number',
      admin: { description: 'Vote gap between #1 and #2 candidate' },
    },
    {
      name: 'notaVotes',
      type: 'number',
      admin: { description: 'NOTA votes' },
    },
    {
      name: 'eciLastUpdatedAt',
      type: 'text',
      admin: { description: 'Last updated timestamp from ECI page' },
    },
    {
      name: 'lastScrapedAt',
      type: 'date',
      admin: { description: 'When the scraper last successfully updated this record' },
    },
  ],
}
