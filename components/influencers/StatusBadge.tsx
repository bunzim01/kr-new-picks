import { ContactStatus } from '@/lib/influencer-types'

const STYLES: Record<ContactStatus, string> = {
  미접촉: 'bg-white text-gray-400 border-gray-200',
  접촉: 'bg-blue-50 text-blue-700 border-blue-200',
  응답: 'bg-sky-50 text-sky-700 border-sky-200',
  동의: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  제안: 'bg-violet-50 text-violet-700 border-violet-200',
  계약: 'bg-blush-light text-blush-dark border-blush',
  보류: 'bg-gray-100 text-gray-500 border-gray-200',
  거절: 'bg-rose-50 text-rose-600 border-rose-200',
}

export default function StatusBadge({ status }: { status: ContactStatus }) {
  return (
    <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap ${STYLES[status] ?? STYLES.미접촉}`}>
      {status}
    </span>
  )
}
