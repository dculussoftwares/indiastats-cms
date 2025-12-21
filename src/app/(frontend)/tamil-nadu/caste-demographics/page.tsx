import { CasteDemographicsClient } from './CasteDemographicsClient'

export const metadata = {
  title: 'Caste Demographics - Tamil Nadu Assembly Constituencies | IndiaStats',
  description:
    'Explore caste composition data across all 234 assembly constituencies in Tamil Nadu. Search, filter, and analyze demographic patterns.',
}

export default function CasteDemographicsPage() {
  return <CasteDemographicsClient />
}
