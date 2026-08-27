import './StatusBadge.css'

const DEFAULT_TONE_MAP = {
  draft: 'neutral',
  submitted: 'info',
  approved: 'success',
  rejected: 'danger',
  pending: 'warning',
}

export default function StatusBadge({ status, tone, toneMap = DEFAULT_TONE_MAP, label }) {
  const resolvedTone = tone || toneMap[status] || 'neutral'

  return (
    <span className={`status-badge status-badge--${resolvedTone}`}>
      {label || status}
    </span>
  )
}
