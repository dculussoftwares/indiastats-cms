import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Database, Map, Users, BarChart3, Globe, ShieldCheck } from 'lucide-react'
import { tamilNaduConfig } from '@/config/states'
import { getServerSideURL } from '@/utilities/getURL'

const baseUrl = getServerSideURL()

export const metadata: Metadata = {
  title: 'About Us | IndiaStats.org',
  description: `Learn about IndiaStats.org — an independent platform dedicated to making Indian election data transparent and accessible. Explore ${tamilNaduConfig.assemblyCount} Tamil Nadu assembly constituencies, ${tamilNaduConfig.boothCountLabel} booths, and election history since ${tamilNaduConfig.historyStartYear}.`,
  alternates: {
    canonical: `${baseUrl}/about`,
  },
  openGraph: {
    title: 'About IndiaStats.org — India Election Data Platform',
    description:
      'IndiaStats.org makes Indian electoral data open and accessible. Read about our mission, data sources, and methodology.',
    type: 'website',
    url: `${baseUrl}/about`,
  },
}

async function getStats() {
  const payload = await getPayload({ config })

  const [assembliesCount, districtsCount, boothsCount, assembliesData] = await Promise.all([
    payload.count({ collection: 'assemblies' }),
    payload.count({ collection: 'districts' }),
    payload.count({ collection: 'booths' }),
    payload.find({ collection: 'assemblies', limit: 1000, select: { voters: true } }),
  ])

  let totalVoters = 0
  assembliesData.docs.forEach((a: any) => {
    if (a.voters?.total) totalVoters += Number(a.voters.total)
  })

  return {
    assemblies: assembliesCount.totalDocs,
    districts: districtsCount.totalDocs,
    booths: boothsCount.totalDocs,
    totalVoters,
  }
}

function formatNumber(num: number): string {
  if (num >= 10000000) return (num / 10000000).toFixed(1) + ' Crore'
  if (num >= 100000) return (num / 100000).toFixed(1) + ' Lakh'
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K'
  return num.toLocaleString('en-IN')
}

export default async function AboutPage() {
  const stats = await getStats()

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Page header */}
      <div className="border-l-4 border-red-600 pl-4 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold">About IndiaStats.org</h1>
        <p className="text-muted-foreground mt-2">
          Making Indian election data transparent, accessible, and understandable for every citizen.
        </p>
      </div>

      {/* Live stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          {
            label: 'Assembly Constituencies',
            value: stats.assemblies.toLocaleString('en-IN'),
            icon: Map,
          },
          { label: 'Districts', value: stats.districts.toLocaleString('en-IN'), icon: Globe },
          { label: 'Polling Booths', value: formatNumber(stats.booths), icon: BarChart3 },
          { label: 'Registered Voters', value: formatNumber(stats.totalVoters), icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-border rounded p-4 text-center">
            <Icon className="h-5 w-5 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
        {/* Mission */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-l-4 border-red-600 pl-3">
            Our Mission
          </h2>
          <p>
            IndiaStats.org was built on a simple belief:{' '}
            <strong>election data belongs to the people</strong>. In India's vibrant democracy,
            voters, journalists, researchers, and political analysts need reliable, machine-readable
            electoral information — yet that data has historically been scattered across PDFs,
            scanned documents, and official portals that are difficult to navigate.
          </p>
          <p className="mt-4">
            We set out to change that. IndiaStats.org aggregates, cleans, and presents official
            election data in a fast, modern interface so that anyone with a smartphone can explore
            the complete political history of their constituency in seconds — not hours.
          </p>
        </section>

        {/* What we cover */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-l-4 border-red-600 pl-3">
            What We Cover
          </h2>
          <p>
            We currently cover <strong>Tamil Nadu</strong> in depth — the southern Indian state with{' '}
            {stats.assemblies} assembly constituencies across {stats.districts} districts and
            roughly {formatNumber(stats.totalVoters)} registered voters. Our database includes:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>
              <strong>Complete election history since {tamilNaduConfig.historyStartYear}</strong> — every candidate, their party,
              votes received, and winning margin for each assembly election cycle.
            </li>
            <li>
              <strong>Booth-level data</strong> — over {formatNumber(stats.booths)} individual
              polling booths mapped to their parent assembly constituency, with booth numbers and
              geographic identifiers.
            </li>
            <li>
              <strong>Voter demographics</strong> — male, female, and third-gender voter counts for
              each constituency, along with SC/ST reservation status.
            </li>
            <li>
              <strong>Caste demographic estimates</strong> — indicative caste composition data
              sourced from academic surveys and census research to help contextualise electoral
              outcomes.
            </li>
            <li>
              <strong>Political alliance data</strong> — party bloc compositions (e.g., DMK
              alliance, AIADMK alliance) for each election year, with colour-coded visual summaries.
            </li>
            <li>
              <strong>Interactive constituency map</strong> — a GeoJSON-based map of all{' '}
              {tamilNaduConfig.assemblyCount} Tamil Nadu assembly segments, filterable by district
              and party performance.
            </li>
          </ul>
          <p className="mt-4">
            We plan to expand coverage to other Indian states in future updates — starting with
            Andhra Pradesh and Kerala.
          </p>
        </section>

        {/* Data sources */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-l-4 border-red-600 pl-3">
            Data Sources &amp; Methodology
          </h2>
          <p>
            All election results displayed on IndiaStats.org are sourced from official government
            records:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>
              <strong>Election Commission of India (ECI)</strong> — the primary source for all
              election results, candidate data, and voter turnout figures (
              <a
                href="https://eci.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:underline"
              >
                eci.gov.in
              </a>
              ).
            </li>
            <li>
              <strong>Tamil Nadu State Election Commission</strong> — used to cross-reference
              constituency boundaries, booth lists, and delimitation orders.
            </li>
            <li>
              <strong>Census of India</strong> — population and demographic figures from the
              Registrar General of India.
            </li>
            <li>
              <strong>Academic research &amp; surveys</strong> — caste composition estimates are
              derived from published academic studies and survey organisations. These are clearly
              labelled as estimates and are not official government figures.
            </li>
          </ul>
          <p className="mt-4">
            Our data team cross-validates records against multiple sources before publishing. Where
            discrepancies exist, we default to the most recent official ECI publication. If you spot
            an error, please{' '}
            <a href="/contact" className="text-red-600 hover:underline">
              contact us
            </a>{' '}
            — we take data accuracy seriously and aim to correct verified errors within 48 hours.
          </p>
        </section>

        {/* Who we are */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-l-4 border-red-600 pl-3">Who We Are</h2>
          <p>
            IndiaStats.org is an independent project built and maintained by a small team based in
            Tamil Nadu, India. We are not affiliated with any political party, government body, or
            election commission. Our work is entirely non-partisan — we present data as it is,
            without commentary or editorial bias.
          </p>
          <p className="mt-4">
            The platform is built using modern open-source technologies including Next.js,
            PayloadCMS, and PostgreSQL. The codebase prioritises performance, accessibility, and
            transparency.
          </p>
          <p className="mt-4">
            We believe civic data infrastructure is a public good. If you are a researcher,
            journalist, or civic technologist who would like to collaborate or access bulk data, we
            would love to hear from you at{' '}
            <a href="mailto:contact@indiastats.org" className="text-red-600 hover:underline">
              contact@indiastats.org
            </a>
            .
          </p>
        </section>

        {/* Principles */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-l-4 border-red-600 pl-3">
            Our Principles
          </h2>
          <div className="grid md:grid-cols-2 gap-4 not-prose">
            {[
              {
                icon: ShieldCheck,
                title: 'Non-partisan',
                description:
                  'We present official data without editorial spin. No political affiliation, no bias.',
              },
              {
                icon: Database,
                title: 'Source-cited',
                description:
                  'Every dataset is traceable to an official government source or a clearly labelled estimate.',
              },
              {
                icon: Globe,
                title: 'Openly accessible',
                description:
                  'No paywalls, no login required. Election data should be free for all citizens.',
              },
              {
                icon: BarChart3,
                title: 'Accuracy first',
                description:
                  'We correct errors promptly when reported. Data quality is our top priority.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="border border-border rounded p-4 flex gap-3">
                <Icon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm">{title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 border-t border-border pt-8 text-center space-y-2">
        <p className="text-muted-foreground text-sm">
          Questions?{' '}
          <a href="/contact" className="text-red-600 hover:underline">
            Contact us
          </a>{' '}
          or explore{' '}
          <a href="/tamil-nadu/dashboard" className="text-red-600 hover:underline">
            Tamil Nadu election data
          </a>
          .
        </p>
        <p className="text-muted-foreground text-sm">
          <a href="/privacy-policy" className="text-red-600 hover:underline">
            Privacy Policy
          </a>
          {' · '}
          <a href="/terms" className="text-red-600 hover:underline">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  )
}
