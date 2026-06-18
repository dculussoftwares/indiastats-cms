import { Metadata } from 'next'
import { Mail, MapPin, Clock, Database, AlertCircle, FileQuestion } from 'lucide-react'
import { getServerSideURL } from '@/utilities/getURL'

const baseUrl = getServerSideURL()

export const metadata: Metadata = {
  title: 'Contact Us | IndiaStats.org',
  description:
    'Get in touch with the IndiaStats.org team. Report data errors, request features, or ask about Tamil Nadu election data, assembly constituencies, and voter statistics.',
  alternates: {
    canonical: `${baseUrl}/contact`,
  },
  openGraph: {
    title: 'Contact Us | IndiaStats.org',
    description:
      'Reach the IndiaStats.org team for data corrections, feedback, or general enquiries about Indian election statistics.',
    type: 'website',
    url: `${baseUrl}/contact`,
  },
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Page header — BBC style */}
      <div className="border-l-4 border-red-600 pl-4 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold">Contact Us</h1>
        <p className="text-muted-foreground mt-2">
          Have a question, spotted an error, or want to collaborate? We would love to hear from you.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Left column — contact details */}
        <div className="space-y-8">
          {/* Email */}
          <div className="border border-border rounded p-5">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-bold">Email</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-2">
              For all enquiries, data corrections, and feedback, write to us at:
            </p>
            <a
              href="mailto:contact@indiastats.org"
              className="text-red-600 font-medium hover:underline break-all"
            >
              contact@indiastats.org
            </a>
            <p className="text-xs text-muted-foreground mt-3">
              We aim to respond within 2 business days.
            </p>
          </div>

          {/* Location */}
          <div className="border border-border rounded p-5">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-bold">Location</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              IndiaStats.org is an independent digital platform based in{' '}
              <strong>Tamil Nadu, India</strong>. We are a small team passionate about making
              election data accessible to every citizen.
            </p>
          </div>

          {/* Hours */}
          <div className="border border-border rounded p-5">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-bold">Response Hours</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              Monday – Friday, 9 AM – 6 PM IST. We check messages on weekends too, but responses may
              be slower.
            </p>
          </div>
        </div>

        {/* Right column — reason topics */}
        <div className="space-y-5">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3">How Can We Help?</h2>

          <div className="border border-border rounded p-5 space-y-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Report a Data Error</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Found an incorrect election result, wrong voter count, or mismatched MLA record?
                  Email us with the assembly name, the incorrect value, and the correct source so we
                  can update it promptly.
                </p>
              </div>
            </div>

            <hr className="border-border" />

            <div className="flex gap-3">
              <Database className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Data Access & API Enquiries</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Interested in bulk data for research, journalism, or a civic tech project? Get in
                  touch and tell us about your use case — we are open to partnerships with
                  researchers, academics, and non-profits.
                </p>
              </div>
            </div>

            <hr className="border-border" />

            <div className="flex gap-3">
              <FileQuestion className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">General Questions & Feedback</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Have a suggestion to improve the platform, want a new feature, or simply curious
                  about how the data is collected? We welcome all feedback — it helps us build a
                  better product for everyone.
                </p>
              </div>
            </div>
          </div>

          {/* Data sources note */}
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Note on data sources:</strong> All election results on IndiaStats.org are
              sourced from the Election Commission of India (ECI) and official state election
              commission records. Demographic data (caste estimates) is derived from census surveys
              and academic research — it is indicative and not an official government figure.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 border-t border-border pt-8 text-center">
        <p className="text-muted-foreground text-sm">
          You can also explore our{' '}
          <a href="/privacy-policy" className="text-red-600 hover:underline">
            Privacy Policy
          </a>{' '}
          or head back to{' '}
          <a href="/tamil-nadu/dashboard" className="text-red-600 hover:underline">
            Tamil Nadu election data
          </a>
          .
        </p>
      </div>
    </div>
  )
}
