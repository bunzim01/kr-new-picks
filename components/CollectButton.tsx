'use client'

import { useState } from 'react'

export default function CollectButton() {
  const [deleting, setDeleting] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string>('')

  // 전체 삭제
  async function handleDelete() {
    if (!confirm('DB의 모든 데이터를 삭제할까요?')) return

    setDeleting(true)
    setStatus('')
    setError('')

    try {
      const res = await fetch('/api/products/today', { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setStatus('삭제 완료 — 페이지를 새로고침합니다')
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setError(data.error ?? '삭제 실패')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {/* 전체 삭제 버튼 */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 text-xs px-4 py-1.5
                     border border-rose-200 rounded-full text-rose-400
                     hover:border-rose-400 hover:text-rose-600
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 bg-white"
        >
          {deleting ? (
            <>
              <span className="animate-spin inline-block w-3 h-3 border-2 border-rose-300 border-t-transparent rounded-full" />
              삭제 중...
            </>
          ) : (
            <>
              <span>✕</span>
              전체삭제
            </>
          )}
        </button>

        {/* 수집 버튼 — 비활성화 + 로컬 안내 */}
        <button
          disabled={true}
          title="로컬에서만 수집 가능: npm run collect"
          className="flex items-center gap-1.5 text-xs px-4 py-1.5
                     border border-gray-200 rounded-full text-gray-400
                     cursor-not-allowed opacity-50
                     transition-all duration-200 bg-white"
        >
          <span>↻</span>
          수집하기
        </button>
      </div>

      {deleting && status && (
        <p className="text-[11px] text-gray-400">{status}</p>
      )}
      {!deleting && status && (
        <p className="text-[11px] text-emerald-600">{status}</p>
      )}
      {error && (
        <p className="text-[11px] text-rose-500">{error}</p>
      )}

      {/* 로컬 수집 안내 */}
      <p className="text-[10px] text-gray-400 text-right">
        💡 로컬에서 <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">npm run collect</code> 실행
      </p>
    </div>
  )
}
