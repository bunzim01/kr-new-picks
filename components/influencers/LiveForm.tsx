'use client'

// 라이브 방송 성과 입력 — POST /api/influencers/[id]/lives
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-charcoal focus:outline-none focus:border-blush-dark'

export default function LiveForm({ id, consent }: { id: number; consent: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState({
    live_date: '', viewers_peak: '', viewers_avg: '', duration_min: '', sales_jpy: '', orders: '', note: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function set(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`/api/influencers/${id}/lives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '저장 실패')
      setMessage('기록했습니다')
      setForm({ live_date: '', viewers_peak: '', viewers_avg: '', duration_min: '', sales_jpy: '', orders: '', note: '' })
      router.refresh()
    } catch (err) {
      setMessage(`오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    } finally {
      setSaving(false)
    }
  }

  if (!consent) {
    return (
      <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-4">
        리그 참가 동의를 받으면 방송 성과를 기록할 수 있습니다.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <label className="text-xs text-gray-500">방송일
        <input type="date" required value={form.live_date} onChange={e => set('live_date', e.target.value)} className={`${input} mt-1`} />
      </label>
      <label className="text-xs text-gray-500">최고 동시 시청
        <input type="number" min="0" value={form.viewers_peak} onChange={e => set('viewers_peak', e.target.value)} className={`${input} mt-1`} />
      </label>
      <label className="text-xs text-gray-500">평균 동시 시청
        <input type="number" min="0" value={form.viewers_avg} onChange={e => set('viewers_avg', e.target.value)} className={`${input} mt-1`} />
      </label>
      <label className="text-xs text-gray-500">방송 시간(분)
        <input type="number" min="0" value={form.duration_min} onChange={e => set('duration_min', e.target.value)} className={`${input} mt-1`} />
      </label>
      <label className="text-xs text-gray-500">매출(엔)
        <input type="number" min="0" value={form.sales_jpy} onChange={e => set('sales_jpy', e.target.value)} className={`${input} mt-1`} />
      </label>
      <label className="text-xs text-gray-500">주문 수
        <input type="number" min="0" value={form.orders} onChange={e => set('orders', e.target.value)} className={`${input} mt-1`} />
      </label>
      <label className="text-xs text-gray-500 col-span-2 sm:col-span-3">메모
        <input value={form.note} onChange={e => set('note', e.target.value)} placeholder="판매 상품, 특이사항" className={`${input} mt-1`} />
      </label>
      <div className="col-span-2 sm:col-span-3 flex items-center gap-3">
        <button type="submit" disabled={saving} className="text-sm px-4 py-2 rounded-lg bg-charcoal text-white hover:bg-gray-800 disabled:opacity-50 transition-colors">
          {saving ? '저장 중…' : '방송 성과 기록'}
        </button>
        {message && <span className={`text-xs ${message.startsWith('오류') ? 'text-rose-600' : 'text-emerald-700'}`}>{message}</span>}
      </div>
    </form>
  )
}
