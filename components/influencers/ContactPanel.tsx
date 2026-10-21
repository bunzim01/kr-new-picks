'use client'

// 접촉 관리 — 상태·채널·메모·동의를 바꾸면 PATCH /api/influencers/[id] 로 저장
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContactStatus, CONTACT_STATUSES } from '@/lib/influencer-types'

interface ContactPanelProps {
  id: number
  status: ContactStatus
  channel: string
  note: string
  consent: boolean
  consentDate: string
}

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-charcoal focus:outline-none focus:border-blush-dark'

export default function ContactPanel(props: ContactPanelProps) {
  const router = useRouter()
  const [status, setStatus] = useState<ContactStatus>(props.status)
  const [channel, setChannel] = useState(props.channel)
  const [note, setNote] = useState(props.note)
  const [consent, setConsent] = useState(props.consent)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function save() {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`/api/influencers/${props.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_status: status, contact_channel: channel, contact_note: note, consent }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '저장 실패')
      setMessage('저장했습니다')
      router.refresh()
    } catch (err) {
      setMessage(`오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h3 className="font-medium text-charcoal text-sm mb-4">접촉 관리</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <label className="text-xs text-gray-500">
          접촉 상태
          <select value={status} onChange={e => setStatus(e.target.value as ContactStatus)} className={`${input} mt-1`}>
            {CONTACT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-500">
          접촉 채널
          <input value={channel} onChange={e => setChannel(e.target.value)} placeholder="DM / 메일 / 사무소 / 소개" className={`${input} mt-1`} />
        </label>
      </div>
      <label className="text-xs text-gray-500 block mb-3">
        메모 (제안 조건, 응답 내용, 다음 할 일)
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} className={`${input} mt-1`} />
      </label>
      <label className="flex items-center gap-2 text-xs text-gray-600 mb-4">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
        데이터 활용·리그 참가 동의 받음
        {props.consentDate && <span className="text-gray-400">({props.consentDate})</span>}
      </label>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="text-sm px-4 py-2 rounded-lg bg-charcoal text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중…' : '저장'}
        </button>
        {message && <span className={`text-xs ${message.startsWith('오류') ? 'text-rose-600' : 'text-emerald-700'}`}>{message}</span>}
      </div>
      <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
        방송 성과(매출·시청자)는 동의를 받은 뒤에만 기록할 수 있습니다. 본인이 삭제를 요청하면 관리자에게 알려 주세요.
      </p>
    </div>
  )
}
