import { Composition, registerRoot } from 'remotion'
import { ReelCard } from './ReelCard'

// Sample data for preview - will be replaced with real data in production
const sampleData = {
  assemblyName: 'பொன்னேரி / Ponneri',
  districtName: 'TIRUVALLUR District',
  isReserved: true,
  party1: { name: 'AIADMK', wins: 7, leaderImage: '/images/EPS.webp' },
  party2: { name: 'DMK', wins: 2, leaderImage: '/images/Stalin.png' },
  dmkBlocWins: 4,
  aiadmkBlocWins: 7,
  dmkBlocBreakdown: 'DMK(2), INC(1), CPI(1)',
  aiadmkBlocBreakdown: 'AIADMK(7)',
  topCastes: [
    { name: 'Paraiyar', percentage: 50 },
    { name: 'Mudaliyar', percentage: 15 },
    { name: 'Meenavar', percentage: 12 },
  ],
  totalVoters: '2.7L',
  maleVoters: '1.3L',
  femaleVoters: '1.4L',
  voterGrowth: 5.4,
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ReelCard"
        component={ReelCard}
        durationInFrames={240} // 8 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={sampleData}
        schema={undefined}
      />
    </>
  )
}

registerRoot(RemotionRoot)
