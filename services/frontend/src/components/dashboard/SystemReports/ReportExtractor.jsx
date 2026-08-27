import React, { useEffect, useMemo, useState } from 'react'
import { LuCalendarDays, LuClipboardList, LuDownload, LuFileText, LuPackage, LuSearch } from 'react-icons/lu'
import { useAuth } from '../../../stores/AuthProvider'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const definitions = {
  work_logs: { label: 'Work Logs', description: 'Employee activity, hours, task progress, and approval status.', icon: LuClipboardList, columns: [['date', 'Date'], ['employee', 'Employee'], ['task', 'Task'], ['hours', 'Hours'], ['task_status', 'Task Status'], ['approval_status', 'Approval Status']] },
  leave: { label: 'Leave', description: 'Employee leave periods, duration, type, status, and reason.', icon: LuCalendarDays, columns: [['employee', 'Employee'], ['leave_type', 'Leave Type'], ['start_date', 'From'], ['end_date', 'To'], ['days', 'Days'], ['status', 'Status'], ['reason', 'Reason']] },
  products: { label: 'Products', description: 'Product catalogue, pricing, available stock, and publication state.', icon: LuPackage, columns: [['sku', 'SKU'], ['product', 'Product'], ['brand', 'Brand'], ['category', 'Category'], ['price', 'Price (Nu.)'], ['stock', 'Stock'], ['published', 'Published']] },
  documents: { label: 'Documents', description: 'Bills, orders, and proforma invoices with financial totals.', icon: LuFileText, columns: [['number', 'Document No.'], ['date', 'Date'], ['company', 'Company'], ['type', 'Document Type'], ['party', 'Customer / Supplier'], ['currency', 'Currency'], ['subtotal', 'Subtotal'], ['tax', 'Tax'], ['total', 'Grand Total'], ['status', 'Status']] },
}
const categories = Object.entries(definitions).map(([id, value]) => ({ id, ...value }))
const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`
const titleCase = value => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase())
const dateValue = value => { if (!value) return '—'; const [year, month, day] = String(value).slice(0, 10).split('-'); return day && month && year ? `${day}/${month}/${year}` : value }
const numberValue = value => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatValue = (category, key, value) => {
  if (['date', 'start_date', 'end_date'].includes(key)) return dateValue(value)
  if (['subtotal', 'tax', 'total', 'price'].includes(key)) return numberValue(value)
  if (key === 'hours') return `${Number(value || 0).toFixed(1)} h`
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (['type', 'status', 'task_status', 'approval_status', 'leave_type'].includes(key)) return titleCase(value)
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

export default function ReportExtractor() {
  const { token } = useAuth()
  const [category, setCategory] = useState('work_logs')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const definition = definitions[category]
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(''); const params = new URLSearchParams(); if (start) params.set('start_date', `${start}T00:00:00`); if (end) params.set('end_date', `${end}T23:59:59`); fetch(`${API}/api/reports/extract/${category}?${params}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.detail || 'Could not load report'); setRows(data.rows || []) }).catch(reason => { if (reason.name !== 'AbortError') setError(reason.message) }).finally(() => setLoading(false)); return () => controller.abort() }, [category, end, start, token])
  const visible = useMemo(() => { const term = query.trim().toLowerCase(); return term ? rows.filter(row => Object.values(row).some(value => String(value ?? '').toLowerCase().includes(term))) : rows }, [query, rows])
  const summary = useMemo(() => {
    if (category === 'work_logs') return [{ label: 'Entries', value: visible.length }, { label: 'Total hours', value: `${visible.reduce((sum, row) => sum + Number(row.hours || 0), 0).toFixed(1)} h` }, { label: 'Approved', value: visible.filter(row => row.approval_status === 'approved').length }]
    if (category === 'leave') return [{ label: 'Requests', value: visible.length }, { label: 'Leave days', value: visible.reduce((sum, row) => sum + Number(row.days || 0), 0) }, { label: 'Approved', value: visible.filter(row => row.status === 'approved').length }]
    if (category === 'products') return [{ label: 'Products', value: visible.length }, { label: 'Units in stock', value: visible.reduce((sum, row) => sum + Number(row.stock || 0), 0).toLocaleString('en-IN') }, { label: 'Published', value: visible.filter(row => row.published).length }]
    return [{ label: 'Documents', value: visible.length }, { label: 'Total value', value: numberValue(visible.reduce((sum, row) => sum + Number(row.total || 0), 0)) }, { label: 'Tax value', value: numberValue(visible.reduce((sum, row) => sum + Number(row.tax || 0), 0)) }]
  }, [category, visible])
  const period = start || end ? `${start ? dateValue(start) : 'Beginning'} to ${end ? dateValue(end) : 'Today'}` : 'All available records'
  const download = () => {
    if (!visible.length) return
    const report = [
      ['BG Sales & Supplies'], [`${definition.label} Report`], ['Reporting period', period], ['Generated', new Date().toLocaleString('en-GB')], ['Records', visible.length], [],
      ['Summary'], ...summary.map(item => [item.label, item.value]), [],
      definition.columns.map(([, heading]) => heading),
      ...visible.map(row => definition.columns.map(([key]) => formatValue(category, key, row[key]))),
    ]
    const csv = `\uFEFF${report.map(line => line.map(csvCell).join(',')).join('\r\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `BG_${definition.label.replaceAll(' ', '_')}_Report_${start || 'all'}_${end || 'all'}.csv`; anchor.click(); URL.revokeObjectURL(url)
  }
  return <section className="extractor">
    <div className="extractor-head"><div><span className="reports-kicker">Individual extracts</span><h2>{definition.label} report</h2><p>{definition.description}</p></div><button type="button" onClick={download} disabled={!visible.length}><LuDownload /> Download formatted CSV</button></div>
    <nav className="extractor-tabs" aria-label="Report categories">{categories.map(item => <button type="button" key={item.id} className={category === item.id ? 'active' : ''} onClick={() => { setCategory(item.id); setQuery('') }}><item.icon /> <span>{item.label}</span></button>)}</nav>
    <div className="extractor-filters"><label>From<input type="date" value={start} max={end || undefined} onChange={event => setStart(event.target.value)} /></label><label>To<input type="date" value={end} min={start || undefined} onChange={event => setEnd(event.target.value)} /></label><label className="extractor-search"><LuSearch /><input aria-label="Search extracted rows" placeholder={`Search ${definition.label.toLowerCase()}`} value={query} onChange={event => setQuery(event.target.value)} /></label><strong>{period}</strong></div>
    <div className="extractor-summary">{summary.map(item => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong></article>)}</div>
    <div className="extractor-table-wrap">{loading ? <p className="extractor-state">Loading report…</p> : error ? <p className="extractor-state error">{error}</p> : visible.length ? <table className="extractor-table"><caption>{definition.label} — {visible.length} record{visible.length === 1 ? '' : 's'}</caption><thead><tr>{definition.columns.map(([key, heading]) => <th key={key} scope="col">{heading}</th>)}</tr></thead><tbody>{visible.map((row, index) => <tr key={index}>{definition.columns.map(([key]) => <td key={key} className={`column-${key}`}>{['status', 'task_status', 'approval_status', 'published'].includes(key) ? <span className={`extractor-badge tone-${String(row[key]).toLowerCase()}`}>{formatValue(category, key, row[key])}</span> : formatValue(category, key, row[key])}</td>)}</tr>)}</tbody></table> : <p className="extractor-state">No matching records for this period.</p>}</div>
  </section>
}
