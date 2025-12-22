import { redirect } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Simple redirect to Tamil Nadu dashboard as default landing page
export default function Home() {
  redirect('/tamil-nadu/dashboard')
}
