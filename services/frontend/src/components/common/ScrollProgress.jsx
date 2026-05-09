import { useEffect, useMemo, useState } from 'react'

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  const supportsScroll = useMemo(() => {
    if (typeof window === 'undefined') return false
    return typeof window.addEventListener === 'function'
  }, [])

  useEffect(() => {
    if (!supportsScroll) return

    const update = () => {
      const doc = document.documentElement
      const scrollTop = window.scrollY || doc.scrollTop || 0
      const scrollHeight = doc.scrollHeight || 0
      const clientHeight = doc.clientHeight || 0
      const max = Math.max(1, scrollHeight - clientHeight)
      setProgress(Math.min(100, Math.max(0, (scrollTop / max) * 100)))
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [supportsScroll])

  return (
    <div className='scroll-progress' aria-hidden='true'>
      <div
        className='scroll-progress__bar'
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

