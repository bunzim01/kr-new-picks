export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-50">
      {/* 이미지 스켈레톤 */}
      <div className="aspect-[3/4] skeleton" />

      {/* 텍스트 스켈레톤 */}
      <div className="p-4 flex flex-col gap-2">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-4 w-16 rounded mt-1" />
        <div className="flex gap-2 mt-2">
          <div className="skeleton h-8 flex-1 rounded-lg" />
          <div className="skeleton h-8 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 20 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
