'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'

interface StatusData {
  lastDate: string | null
  totalDates: number
  lastCount: number
}

function formatKoreanDate(dateStr: string | null): string {
  if (!dateStr) return '없음'
  const [year, month, day] = dateStr.split('-')
  return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`
}

export default function AdminPage() {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [collecting, setCollecting] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')

  async function fetchStatus() {
    const res = await fetch('/api/admin/status')
    const data = await res.json()
    setStatus(data)
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  async function handleCollect() {
    setCollecting(true)
    setResult('')
    setError('')

    try {
      const res = await fetch('/api/cron/collect', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        setResult(
          `✅ 수집 완료 — ${data.date} | ` +
          `크롤링 ${data.totalCrawled}개 → 저장 ${data.saved}개`
        )
        await fetchStatus() // 상태 갱신
      } else {
        setError(`❌ 수집 실패: ${data.error}`)
      }
    } catch (err) {
      setError(`❌ 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    } finally {
      setCollecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h2 className="font-serif text-2xl text-charcoal mb-1">관리자</h2>
          <p className="text-sm text-gray-400">데이터 수집을 수동으로 실행합니다</p>
        </div>

        {/* 현황 카드 */}
        {status && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            <StatCard
              label="마지막 수집"
              value={formatKoreanDate(status.lastDate)}
            />
            <StatCard
              label="수집된 상품"
              value={`${status.lastCount}개`}
            />
            <StatCard
              label="보관 날짜 수"
              value={`${status.totalDates}일`}
            />
          </div>
        )}

        {/* 수집 버튼 */}
        <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            전 세계 9개 쇼핑몰에서 상품을 수집합니다.<br />
            완료까지 2~5분 정도 소요될 수 있습니다.
          </p>

          <button
            onClick={handleCollect}
            disabled={collecting}
            className="w-full py-4 bg-charcoal text-white font-medium rounded-xl
                       hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 text-sm"
          >
            {collecting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                수집 중...
              </span>
            ) : (
              '지금 수집하기'
            )}
          </button>

          {/* 결과 메시지 */}
          {result && (
            <div className="mt-4 p-4 bg-emerald-50 text-emerald-700 text-sm rounded-lg">
              {result}
            </div>
          )}
          {error && (
            <div className="mt-4 p-4 bg-rose-50 text-rose-600 text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* 자동 수집 안내 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-400 leading-relaxed">
          <strong className="text-gray-500">자동 수집 스케줄</strong><br />
          매일 오전 9시 (KST) 자동으로 수집됩니다.<br />
          수집된 데이터는 30일 후 자동 삭제됩니다.
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="font-semibold text-charcoal text-sm">{value}</p>
    </div>
  )
}
