export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 overflow-hidden bg-white">
          {/* 이미지 스켈레톤 */}
          <div className="w-full h-48 bg-gray-200 animate-pulse" />

          {/* 내용 스켈레톤 */}
          <div className="p-4">
            {/* 배지 */}
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-2" />

            {/* 제목 */}
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-3" />

            {/* 설명 */}
            <div className="h-3 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse mb-4" />

            {/* 메타데이터 */}
            <div className="flex justify-between mb-3">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* 버튼 */}
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
