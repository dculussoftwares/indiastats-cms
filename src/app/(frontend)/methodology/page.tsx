import { Metadata } from 'next'
import { ClipboardCheck, Database, RefreshCw, ShieldCheck } from 'lucide-react'
import { tamilNaduConfig } from '@/config/states'
import { getServerSideURL } from '@/utilities/getURL'
import { WebPageJsonLd } from '@/components/seo/JsonLd'

const baseUrl = getServerSideURL()

const description = `How IndiaStats.org sources, verifies, and updates Indian election data — covering Election Commission of India (ECI) sourcing, our update cadence, and data accuracy process.`

export const metadata: Metadata = {
  title: 'Methodology | IndiaStats.org',
  description,
  alternates: {
    canonical: `${baseUrl}/methodology`,
  },
  openGraph: {
    title: 'Methodology — How IndiaStats.org Sources Election Data',
    description,
    type: 'website',
    url: `${baseUrl}/methodology`,
  },
}

export default function MethodologyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <WebPageJsonLd name="Methodology" description={description} url={`${baseUrl}/methodology`} />

      <div className="border-l-4 border-red-600 pl-4 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold">Methodology</h1>
        <p className="text-muted-foreground mt-2">
          How we source, verify, and update the election data on IndiaStats.org.
        </p>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-l-4 border-red-600 pl-3">
            Data Sourcing
          </h2>
          <p>
            Every election result, candidate name, vote count, and voter figure on IndiaStats.org
            originates from official Election Commission of India (ECI) publications — either the{' '}
            <a
              href="https://eci.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:underline"
            >
              eci.gov.in
            </a>{' '}
            results portal or its constituency-wise counting sheets. We do not accept
            crowd-sourced or unofficial figures for election results. Booth-level identifiers and
            constituency boundaries are cross-referenced against Tamil Nadu State Election
            Commission delimitation records. Caste demographic estimates — the one dataset that is
            not an official ECI figure — are sourced from published academic surveys and are
            labelled as estimates everywhere they appear.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-l-4 border-red-600 pl-3">
            Update Cadence
          </h2>
          <p>
            Historical election data (results since {tamilNaduConfig.historyStartYear}) is static
            once verified and published — it only changes if we identify and correct an error. On
            an active counting day, results for all {tamilNaduConfig.assemblyCount} Tamil Nadu
            assembly constituencies are refreshed directly from the ECI results feed at regular
            intervals throughout the count, with each constituency marked &ldquo;counting&rdquo; or
            &ldquo;declared&rdquo; as rounds are finalised.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-l-4 border-red-600 pl-3">
            Accuracy Process
          </h2>
          <p>
            New data is checked against the source ECI document before publishing. Figures that
            cannot be traced to an official record are not published. When a reader reports a
            possible error via{' '}
            <a href="/contact" className="text-red-600 hover:underline">
              our contact page
            </a>
            , we re-verify against the original source and correct confirmed errors, typically
            within 48 hours.
          </p>
          <p className="mt-4">
            Some contextual writing — constituency and district summary paragraphs, and select blog
            articles — is drafted with AI assistance from our own verified structured data, then
            checked against that dataset before publishing. See our{' '}
            <a href="/about" className="text-red-600 hover:underline">
              About page
            </a>{' '}
            for the full editorial and AI content policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 border-l-4 border-red-600 pl-3">
            At a Glance
          </h2>
          <div className="grid md:grid-cols-2 gap-4 not-prose">
            {[
              {
                icon: Database,
                title: 'Primary source: ECI',
                description:
                  'Every result traces back to an official Election Commission of India publication.',
              },
              {
                icon: RefreshCw,
                title: 'Live on counting day',
                description:
                  'Constituency-level results refresh directly from the ECI feed during active counts.',
              },
              {
                icon: ClipboardCheck,
                title: 'Verified before publishing',
                description:
                  'Figures without a traceable official source are not published.',
              },
              {
                icon: ShieldCheck,
                title: 'Corrections within 48 hours',
                description: 'Reported errors are re-checked against the source and fixed promptly.',
              },
            ].map(({ icon: Icon, title, description: itemDescription }) => (
              <div key={title} className="border border-border rounded p-4 flex gap-3">
                <Icon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm">{title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{itemDescription}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-12 border-t border-border pt-8 text-center">
        <p className="text-muted-foreground text-sm">
          Read more about our mission and data sources on the{' '}
          <a href="/about" className="text-red-600 hover:underline">
            About page
          </a>
          , or{' '}
          <a href="/contact" className="text-red-600 hover:underline">
            contact us
          </a>{' '}
          to report an issue.
        </p>
      </div>
    </div>
  )
}
