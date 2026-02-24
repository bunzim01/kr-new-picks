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

        {/* 로컬 수집 안내 */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8">
          <p className="text-sm text-blue-900 font-medium mb-3">📍 로컬에서 수집하기</p>
          <p className="text-xs text-blue-800 mb-4 leading-relaxed">
            Vercel 서버에서는 크롤링이 불가능합니다.<br />
            <strong>로컬 컴퓨터에서 다음 명령어를 실행하세요:</strong>
          </p>
          <code className="block bg-white text-charcoal text-xs p-3 rounded border border-blue-100 font-mono mb-4">
            npm run collect
          </code>
          <p className="text-xs text-blue-800">
            ✅ 4개 사이트에서 상품 수집<br />
            ✅ TOP 100 선정<br />
            ✅ 자동으로 DB에 저장 (이 사이트에 반영됨)
          </p>
        </div>

        {/* 현황 정보 */}
        <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
          <h3 className="font-medium text-charcoal mb-6 text-sm">현재 데이터 상태</h3>

          {status && (
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-xs text-gray-500">마지막 수집</span>
                <span className="text-sm text-charcoal font-medium">{formatKoreanDate(status.lastDate)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-xs text-gray-500">현재 저장된 상품</span>
                <span className="text-sm text-charcoal font-medium">{status.lastCount}개</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-gray-500">보관 중인 날짜</span>
                <span className="text-sm text-charcoal font-medium">{status.totalDates}일</span>
              </div>
            </div>
          )}

          {/* 결과 메시지 */}
          {result && (
            <div className="p-4 bg-emerald-50 text-emerald-700 text-xs rounded-lg">
              {result}
            </div>
          )}
          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 text-xs rounded-lg">
              {error}
            </div>
          )}
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
