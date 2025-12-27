import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | IndiaStats.org',
  description:
    'Privacy Policy for IndiaStats.org - Electoral data and political statistics platform for India',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">Last updated: December 27, 2024</p>

      <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to IndiaStats.org ("we," "our," or "us"). IndiaStats.org is a platform dedicated
            to providing comprehensive electoral statistics, assembly constituency data, election
            history, and demographic information for India. We are committed to protecting your
            privacy and ensuring the security of any information you may provide while using our
            services.
          </p>
          <p className="mt-4">
            This Privacy Policy explains how we collect, use, and protect information when you visit
            indiastats.org and interact with our electoral data platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. About Our Platform</h2>
          <p>IndiaStats.org is a public information platform that provides:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Assembly constituency information across Indian states</li>
            <li>Historical election results and winning party data</li>
            <li>Demographic statistics including caste census data (estimates)</li>
            <li>Voter statistics (total voters, male/female breakdown)</li>
            <li>District and booth-level electoral data</li>
            <li>Political party alliance information</li>
          </ul>
          <p className="mt-4">
            All electoral and demographic data displayed on our platform is derived from publicly
            available government sources and election commission records.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Information We Collect</h2>

          <h3 className="text-xl font-medium mb-2">
            3.1 Information Stored Locally (Browser Storage)
          </h3>
          <p>We use your browser's local storage to enhance your experience:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              <strong>Theme Preference:</strong> Your chosen display mode (light/dark/system) is
              stored locally in your browser to remember your preference across visits.
            </li>
            <li>
              <strong>Recent Searches:</strong> District and assembly search history is stored
              locally in your browser to provide quick access to recently viewed constituencies.
            </li>
          </ul>
          <p className="mt-2 text-sm text-muted-foreground">
            Note: This data is stored only on your device and is never transmitted to our servers.
          </p>

          <h3 className="text-xl font-medium mb-2 mt-6">3.2 Automatically Collected Information</h3>
          <p>When you visit our website, our hosting provider may automatically collect:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>IP address (for security and server logs)</li>
            <li>Browser type and version</li>
            <li>Device type (desktop/mobile)</li>
            <li>Pages visited and time spent</li>
            <li>Referring website URL</li>
          </ul>

          <h3 className="text-xl font-medium mb-2 mt-6">3.3 Information We Do NOT Collect</h3>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              Personal identification information (name, email, phone) - unless you voluntarily
              contact us
            </li>
            <li>Location data beyond what's derived from IP address</li>
            <li>Financial or payment information</li>
            <li>Social media account details</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. How We Use Information</h2>
          <p>The limited information we collect is used to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Provide and maintain the electoral data platform</li>
            <li>Remember your theme preferences for a better user experience</li>
            <li>Enable quick access to recently searched constituencies</li>
            <li>Monitor and improve website performance and security</li>
            <li>Respond to inquiries if you contact us</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Social Media Sharing</h2>
          <p>
            Our platform includes features to share electoral data on social media platforms
            including:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              <strong>X (Twitter):</strong> Quick View cards can be shared on X with pre-formatted
              electoral information
            </li>
            <li>
              <strong>Instagram:</strong> Reel-style content featuring assembly statistics may be
              posted to our official Instagram account
            </li>
          </ul>
          <p className="mt-4">
            When you use share features, you may be redirected to third-party platforms governed by
            their own privacy policies. We recommend reviewing the privacy policies of X
            (twitter.com) and Instagram (instagram.com) for their data practices.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking Technologies</h2>
          <p>IndiaStats.org uses minimal cookies and tracking:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              <strong>Essential Cookies:</strong> Required for basic website functionality
            </li>
            <li>
              <strong>Local Storage:</strong> Used for theme preferences and search history (as
              described above)
            </li>
          </ul>
          <p className="mt-4">
            We do not currently use third-party analytics services or advertising trackers. If this
            changes in the future, we will update this policy accordingly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Data Storage and Security</h2>
          <p>
            Our platform is powered by PayloadCMS with data stored on secure cloud infrastructure.
            Electoral data is primarily stored for public display purposes and does not include
            personal user information.
          </p>
          <p className="mt-4">We implement appropriate security measures including:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>HTTPS encryption for all data transmission</li>
            <li>Secure hosting infrastructure</li>
            <li>Regular security updates and maintenance</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
          <p>Our platform may use the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              <strong>Vercel:</strong> Website hosting and deployment
            </li>
            <li>
              <strong>Azure Blob Storage:</strong> Media and image storage
            </li>
            <li>
              <strong>X (Twitter) API:</strong> For automated posting of electoral statistics
            </li>
            <li>
              <strong>Instagram Graph API:</strong> For Reel content distribution
            </li>
          </ul>
          <p className="mt-4">
            Each of these services has their own privacy policies that govern their data practices.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Your Rights and Choices</h2>
          <p>You have control over your data:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              <strong>Clear Local Storage:</strong> You can clear your browser's local storage at
              any time to remove theme preferences and search history
            </li>
            <li>
              <strong>Browser Settings:</strong> Manage cookies through your browser's privacy
              settings
            </li>
            <li>
              <strong>Opt-out:</strong> You can choose not to use share features to avoid
              interaction with third-party platforms
            </li>
          </ul>
          <p className="mt-4">
            Since we do not collect personal identification information, there is typically no
            personal data to access, correct, or delete. If you have specific concerns, please
            contact us.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Data Source Disclaimer</h2>
          <p>
            The electoral and demographic data presented on IndiaStats.org is compiled from publicly
            available sources including:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Election Commission of India</li>
            <li>State Election Commissions</li>
            <li>Census data and official government publications</li>
            <li>Published research and academic sources</li>
          </ul>
          <p className="mt-4">
            Demographic data (such as caste census figures) are estimates based on available data
            and may not reflect current populations. This data is provided for informational
            purposes only.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
          <p>
            Our platform provides educational electoral information suitable for all ages. We do not
            knowingly collect personal information from children under 13. The electoral data
            displayed is public information and does not require user registration.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy as our platform evolves. Changes will be posted on
            this page with an updated "Last updated" date. We encourage you to review this policy
            periodically.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, our data practices, or the electoral
            information displayed on our platform, please contact us:
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p>
              <strong>IndiaStats.org</strong>
            </p>
            <p className="mt-2">
              Website:{' '}
              <a href="https://indiastats.org" className="text-primary hover:underline">
                indiastats.org
              </a>
            </p>
            <p>
              Email:{' '}
              <a href="mailto:contact@indiastats.org" className="text-primary hover:underline">
                contact@indiastats.org
              </a>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Follow us on X (Twitter):{' '}
              <a href="https://x.com/indiastats_org" className="text-primary hover:underline">
                @indiastats_org
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
