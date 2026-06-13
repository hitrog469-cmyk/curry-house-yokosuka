import { Clock } from 'lucide-react'
import { ORDERING_DISABLED_MESSAGE } from '@/lib/site-config'

export default function OrderingDisabledBanner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
        <Clock className="w-5 h-5 text-emerald-700" />
      </div>
      <div>
        <p className="font-bold text-emerald-900">Online ordering launching soon</p>
        <p className="text-sm text-emerald-800 mt-0.5">{ORDERING_DISABLED_MESSAGE}</p>
      </div>
    </div>
  )
}
