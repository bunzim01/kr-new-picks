'use client'

import { useState } from 'react'

export default function CollectButton() {
  const [collecting, setCollecting] = useState(false)
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

  // 수집만 실행 (삭제 없이)
  async function handleCollect() {
    setCollecting(true)
    setStatus('')
    setError('')

    try {
      setStatus('수집 중... (2~5분 소요)')
      const res = await fetch('/api/cron/collect', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        setStatus(`완료 — ${data.totalCrawled}개 수집 · ${data.saved}개 저장`)
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setError(data.error ?? '수집 실패')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setCollecting(false)
    }
  }

  const busy = collecting || deleting

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {/* 전체 삭제 버튼 */}
        <button
          onClick={handleDelete}
          disabled={busy}
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

        {/* 수집 버튼 */}
        <button
          onClick={handleCollect}
          disabled={busy}
          className="flex items-center gap-1.5 text-xs px-4 py-1.5
                     border border-gray-200 rounded-full text-gray-500
                     hover:border-charcoal hover:text-charcoal
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 bg-white"
        >
          {collecting ? (
            <>
              <span className="animate-spin inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full" />
              수집 중...
            </>
          ) : (
            <>
              <span>↻</span>
              수집하기
            </>
          )}
        </button>
      </div>

      {(collecting || deleting) && status && (
        <p className="text-[11px] text-gray-400">{status}</p>
      )}
      {!collecting && !deleting && status && (
        <p className="text-[11px] text-emerald-600">{status}</p>
      )}
      {error && (
        <p className="text-[11px] text-rose-500">{error}</p>
      )}
    </div>
  )
}
