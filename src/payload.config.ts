import { postgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Authors } from './collections/Authors'
import { Assemblies } from './collections/Assemblies'
import { Districts } from './collections/Districts'
import { Booths } from './collections/Booths'
import { ElectionHistory } from './collections/ElectionHistory'
import { ElectionPredictions } from './collections/ElectionPredictions'
import { Alliances } from './collections/Alliances'
import { CasteCensus } from './collections/CasteCensus'
import { Predictors } from './collections/Predictors'
import { States } from './collections/States'
import { Zones } from './collections/Zones'
import { LiveElectionResults } from './collections/LiveElectionResults'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { SiteSettings } from './globals/SiteSettings'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      max: 2, // PgBouncer handles real pooling; keep app-side pool small
    },
    // `push` (Payload's pushDevSchema) is dev-only tooling — it prompts interactively
    // for ambiguous changes (e.g. a relationship's target collection changing), which
    // CI can't answer, and it silently no-ops in production (NODE_ENV === 'production')
    // regardless of this flag. Schema changes go through migrations instead — see
    // migrationDir below and `pnpm payload migrate` / `pnpm payload migrate:create`.
    push: false,
    migrationDir: './migrations',
  }),
  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    Authors,
    States,
    Zones,
    Predictors,
    Assemblies,
    Districts,
    Booths,
    ElectionHistory,
    ElectionPredictions,
    Alliances,
    CasteCensus,
    LiveElectionResults,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, SiteSettings],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
