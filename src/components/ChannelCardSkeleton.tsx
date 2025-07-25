export default function ChannelCardSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className={`animate-pulse ${compact ? 'h-20' : 'h-40'} bg-gray-200 rounded-lg`} />
  )
}