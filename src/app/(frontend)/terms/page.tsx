import { Metadata } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

const baseUrl = getServerSideURL()

export const metadata: Metadata = {
  title: 'Terms of Service | IndiaStats.org',
  description:
    'Terms of Service for IndiaStats.org — conditions governing your use of the Indian election data platform.',
  alternates: {
    canonical: `${baseUrl}/terms`,
  },
  openGraph: {
    title: 'Terms of Service | IndiaStats.org',
    description: 'Read the terms and conditions governing use of IndiaStats.org.',
    type: 'website',
    url: `${baseUrl}/terms`,
  },
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="border-l-4 border-red-600 pl-4 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
        <p className="text-muted-foreground mt-2">Last updated: April 24, 2026</p>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using IndiaStats.org ("the Platform," "we," "our," or "us"), you agree
            to be bound by these Terms of Service. If you do not agree to these terms, please do not
            use the Platform. These terms apply to all visitors, users, and others who access or use
            IndiaStats.org.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p>
            IndiaStats.org is a free, publicly accessible platform that aggregates and presents
            Indian election data, including assembly constituency information, historical election
            results, voter statistics, demographic estimates, and political alliance data. The
            Platform currently covers Tamil Nadu and aims to expand to other Indian states over
            time.
          </p>
          <p className="mt-4">
            The Platform is provided for informational and research purposes only. It is not
            affiliated with any political party, candidate, government body, or the Election
            Commission of India.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Permitted Use</h2>
          <p>You may use IndiaStats.org for:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Personal research and civic education</li>
            <li>Journalism and news reporting, with proper attribution to IndiaStats.org</li>
            <li>Academic research and non-commercial analysis</li>
            <li>Non-commercial civic technology projects</li>
          </ul>
          <p className="mt-4">
            You must not use the Platform for any purpose that is unlawful, harmful, or violates
            these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Prohibited Use</h2>
          <p>You must not:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              Use the Platform to spread misinformation, fabricate election results, or manipulate
              public opinion with misleading data presentations
            </li>
            <li>
              Systematically scrape, crawl, or download large portions of the database for
              commercial resale without prior written permission
            </li>
            <li>
              Attempt to gain unauthorised access to any part of the Platform, its servers, or
              associated databases
            </li>
            <li>
              Use automated tools to overload, disrupt, or degrade the performance of the Platform
            </li>
            <li>
              Reproduce, redistribute, or republish election data from this Platform while removing
              attribution to original official sources (Election Commission of India)
            </li>
            <li>
              Use data from this Platform in any way that violates Indian electoral laws or the
              Representation of the People Act, 1951
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Data Accuracy &amp; Disclaimer</h2>
          <p>
            We strive to present accurate, up-to-date election data sourced from official records
            published by the Election Commission of India and state election commissions. However:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>
              <strong>No warranty of accuracy:</strong> The data is provided "as is." We make no
              warranty, express or implied, that the information is complete, accurate, or current
              at any given time.
            </li>
            <li>
              <strong>Caste demographic estimates:</strong> Caste composition data displayed on the
              Platform is derived from academic surveys and research publications. These are
              indicative estimates and are not official government figures.
            </li>
            <li>
              <strong>Election predictions:</strong> Any election predictions or forecasts on the
              Platform are speculative in nature and must not be relied upon for any legal,
              financial, or political decision-making purpose.
            </li>
            <li>
              <strong>No liability for errors:</strong> IndiaStats.org is not liable for any loss or
              damage arising from reliance on data displayed on the Platform. Always verify critical
              information against official government sources.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
          <p>
            The underlying election and voter data on this Platform is derived from official
            government sources and is therefore in the public domain. However, the following
            elements are the intellectual property of IndiaStats.org:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>The design, layout, and visual presentation of the Platform</li>
            <li>Original written content including analysis, descriptions, and editorial text</li>
            <li>The IndiaStats.org name, logo, and branding</li>
            <li>Software code and database schema powering the Platform</li>
          </ul>
          <p className="mt-4">
            You may not reproduce or distribute our original content without prior written
            permission.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Third-Party Links</h2>
          <p>
            The Platform may contain links to external websites, including official government
            portals such as the Election Commission of India. These links are provided for
            convenience only. IndiaStats.org has no control over the content of those sites and
            accepts no responsibility for them or for any loss or damage that may arise from your
            use of them.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Advertising</h2>
          <p>
            IndiaStats.org may display advertisements served by third-party networks including
            Google AdSense. These advertisers may use cookies to serve ads based on your prior
            visits to this and other websites. You can opt out of personalised advertising by
            visiting{' '}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:underline"
            >
              Google Ad Settings
            </a>
            . Advertisements do not represent endorsement of any product, service, or political
            position by IndiaStats.org.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, IndiaStats.org and its operators
            shall not be liable for any indirect, incidental, special, consequential, or punitive
            damages, or any loss of profits or revenues, whether incurred directly or indirectly, or
            any loss of data, use, goodwill, or other intangible losses, resulting from:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Your access to or use of (or inability to access or use) the Platform</li>
            <li>Any conduct or content of any third party on the Platform</li>
            <li>Any content obtained from the Platform</li>
            <li>Unauthorised access, use, or alteration of your transmissions or content</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. Any
            disputes arising out of or related to these Terms or the Platform shall be subject to
            the exclusive jurisdiction of the courts of Tamil Nadu, India.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Changes to These Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will indicate the date of the
            most recent update at the top of this page. Your continued use of the Platform after any
            changes constitutes your acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:contact@indiastats.org" className="text-red-600 hover:underline">
              contact@indiastats.org
            </a>{' '}
            or visit our{' '}
            <a href="/contact" className="text-red-600 hover:underline">
              Contact page
            </a>
            .
          </p>
        </section>
      </div>

      {/* Bottom links */}
      <div className="mt-12 border-t border-border pt-8 text-center">
        <p className="text-muted-foreground text-sm">
          <a href="/privacy-policy" className="text-red-600 hover:underline">
            Privacy Policy
          </a>
          {' · '}
          <a href="/about" className="text-red-600 hover:underline">
            About Us
          </a>
          {' · '}
          <a href="/contact" className="text-red-600 hover:underline">
            Contact
          </a>
        </p>
      </div>
    </div>
  )
}
