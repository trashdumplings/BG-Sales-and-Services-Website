import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../stores/AuthProvider'
import { getInventoryAlerts, getMonthlySummary } from '../../../utils/api'
import {
  LuArrowDownRight,
  LuArrowUpRight,
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
  LuCircleAlert,
  LuCircleCheck,
  LuClock3,
  LuDownload,
  LuFileSpreadsheet,
  LuShieldAlert,
  LuTrendingUp,
  LuUsers,
} from 'react-icons/lu'
import DashboardTable from '../../common/DashboardTable/DashboardTable'
import './SystemReports.css'

const HOURS_TARGET = 160
const employeePerformanceColumns = [
  { key: 'employee', label: 'Employee', width: '24%' },
  { key: 'department', label: 'Department', width: '16%' },
  { key: 'utilization', label: 'Utilization', width: '26%' },
  { key: 'hours', label: 'Hours', align: 'right', width: '11%' },
  { key: 'tasks', label: 'Tasks', align: 'right', width: '11%' },
  { key: 'leave', label: 'Leave', align: 'right', width: '12%' },
]

const formatHours = (value) => `${Number(value || 0).toFixed(1)}h`

const formatMonthLabel = (date) =>
  date.toLocaleString('default', { month: 'long', year: 'numeric' })

const getAlertTone = (item) => (item.status === 'out_of_stock' ? 'critical' : 'warning')

export default function SystemReports() {
  const { token, user, loading: authLoading } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reportData, setReportData] = useState(null)
  const [alertsData, setAlertsData] = useState([])

  const hasAccess = ['superadmin', 'hr'].includes(user?.role)

  useEffect(() => {
    if (authLoading || !token || !hasAccess) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')

        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1

        const [summary, alerts] = await Promise.all([
          getMonthlySummary(token, year, month),
          getInventoryAlerts(token),
        ])

        setReportData(summary)
        setAlertsData(alerts)
      } catch (requestError) {
        setError(requestError.message || 'Failed to load reports data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [authLoading, currentDate, hasAccess, token])

  const employeeSummary = useMemo(() => reportData?.employee_summary || [], [reportData])
  const popularProducts = reportData?.popular_products || []

  const derived = useMemo(() => {
    const totalEmployees = reportData?.kpis?.total_employees || 0
    const totalHours = reportData?.kpis?.total_hours_logged || 0
    const totalLeaves = reportData?.kpis?.total_leaves_taken || 0
    const avgHours = totalEmployees ? totalHours / totalEmployees : 0
    const alertCount = alertsData.length
    const criticalAlerts = alertsData.filter((item) => item.status === 'out_of_stock').length

    const rankedEmployees = [...employeeSummary].sort((a, b) => {
      if (b.total_hours !== a.total_hours) return b.total_hours - a.total_hours
      if (b.tasks_completed !== a.tasks_completed) return b.tasks_completed - a.tasks_completed
      return a.leaves_taken - b.leaves_taken
    })

    const topPerformer = rankedEmployees[0] || null
    const topUtilization = totalEmployees ? (avgHours / HOURS_TARGET) * 100 : 0

    const departmentsMap = employeeSummary.reduce((accumulator, employee) => {
      const key = employee.department || 'Unassigned'
      if (!accumulator[key]) {
        accumulator[key] = {
          name: key,
          employees: 0,
          hours: 0,
          tasks: 0,
          leaves: 0,
        }
      }

      accumulator[key].employees += 1
      accumulator[key].hours += employee.total_hours || 0
      accumulator[key].tasks += employee.tasks_completed || 0
      accumulator[key].leaves += employee.leaves_taken || 0
      return accumulator
    }, {})

    const departments = Object.values(departmentsMap)
      .map((department) => ({
        ...department,
        avgHours: department.employees ? department.hours / department.employees : 0,
      }))
      .sort((a, b) => b.hours - a.hours)

    const busiestDepartment = departments[0] || null

    const insights = [
      topPerformer
        ? {
            label: 'Top performer',
            value: topPerformer.name,
            detail: `${formatHours(topPerformer.total_hours)} logged and ${topPerformer.tasks_completed} completed tasks`,
            tone: 'positive',
            icon: LuTrendingUp,
          }
        : null,
      busiestDepartment
        ? {
            label: 'Busiest department',
            value: busiestDepartment.name,
            detail: `${formatHours(busiestDepartment.hours)} across ${busiestDepartment.employees} team members`,
            tone: 'neutral',
            icon: LuUsers,
          }
        : null,
      {
        label: 'Monthly capacity',
        value: `${Math.round(topUtilization)}%`,
        detail: `${formatHours(avgHours)} average per active employee vs ${HOURS_TARGET}h target`,
        tone: topUtilization >= 85 ? 'positive' : topUtilization >= 60 ? 'warning' : 'critical',
        icon: LuClock3,
      },
      {
        label: 'Inventory risk',
        value: `${alertCount} alert${alertCount === 1 ? '' : 's'}`,
        detail: criticalAlerts ? `${criticalAlerts} item${criticalAlerts === 1 ? '' : 's'} out of stock` : 'No critical stockouts right now',
        tone: criticalAlerts ? 'critical' : alertCount ? 'warning' : 'positive',
        icon: criticalAlerts ? LuShieldAlert : LuCircleCheck,
      },
    ].filter(Boolean)

    const statusSummary = {
      critical: criticalAlerts,
      warning: alertsData.filter((item) => item.status === 'low_stock').length,
      healthy: Math.max(0, totalEmployees - criticalAlerts),
    }

    return {
      totalEmployees,
      totalHours,
      totalLeaves,
      avgHours,
      alertCount,
      criticalAlerts,
      rankedEmployees,
      departments,
      topPerformer,
      busiestDepartment,
      insights,
      statusSummary,
    }
  }, [alertsData, employeeSummary, reportData])

  const handlePrevMonth = () => {
    setCurrentDate((previous) => {
      const nextDate = new Date(previous)
      nextDate.setMonth(nextDate.getMonth() - 1)
      return nextDate
    })
  }

  const handleNextMonth = () => {
    setCurrentDate((previous) => {
      const nextDate = new Date(previous)
      nextDate.setMonth(nextDate.getMonth() + 1)
      return nextDate
    })
  }

  const handleExportCSV = () => {
    const rows = []
    const period = formatMonthLabel(currentDate)

    rows.push(['BG Sales & Supplies Reports'])
    rows.push([`Period`, period])
    rows.push([])
    rows.push(['KPI', 'Value'])
    rows.push(['Active employees', derived.totalEmployees])
    rows.push(['Total hours logged', derived.totalHours.toFixed(1)])
    rows.push(['Leaves taken', derived.totalLeaves])
    rows.push(['Inventory alerts', derived.alertCount])
    rows.push([])
    rows.push(['Employee scorecard'])
    rows.push(['Employee ID', 'Name', 'Department', 'Position', 'Hours Logged', 'Tasks Completed', 'Leaves Taken'])

    derived.rankedEmployees.forEach((employee) => {
      rows.push([
        employee.employee_code || '-',
        employee.name,
        employee.department || '-',
        employee.position || '-',
        Number(employee.total_hours || 0).toFixed(1),
        employee.tasks_completed || 0,
        employee.leaves_taken || 0,
      ])
    })

    rows.push([])
    rows.push(['Inventory alerts'])
    rows.push(['SKU', 'Item', 'Category', 'Status', 'Current Stock', 'Reorder Level'])

    alertsData.forEach((item) => {
      rows.push([
        item.sku,
        item.name,
        item.category,
        item.status === 'out_of_stock' ? 'Out of stock' : 'Low stock',
        item.quantity,
        item.reorder_level,
      ])
    })

    const escapeCsvCell = (cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`
    const csvContent = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `BGSS_Report_${currentDate.getFullYear()}_${currentDate.getMonth() + 1}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!hasAccess) {
    return (
      <div className="reports-shell">
        <div className="reports-access">
          <LuShieldAlert />
          <h2>Access denied</h2>
          <p>You do not have permission to view the reporting workspace.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="reports-shell">
      <section className="reports-hero">
        <div className="reports-hero__copy">
          <span className="reports-kicker">Operations reporting</span>
          <h1>See how teams, time, and stock moved this month.</h1>
          <p>
            Track workforce activity, surface inventory risk, and export a cleaner operational snapshot
            for management review.
          </p>
        </div>

        <div className="reports-hero__panel">
          <div className="reports-period">
            <button type="button" className="reports-icon-btn" onClick={handlePrevMonth} aria-label="Previous month">
              <LuChevronLeft />
            </button>
            <div>
              <span>Reporting period</span>
              <strong>{formatMonthLabel(currentDate)}</strong>
            </div>
            <button type="button" className="reports-icon-btn" onClick={handleNextMonth} aria-label="Next month">
              <LuChevronRight />
            </button>
          </div>

          <button type="button" className="reports-export-btn" onClick={handleExportCSV} disabled={loading || !!error || !reportData}>
            <LuDownload /> Export report CSV
          </button>
        </div>
      </section>

      {authLoading ? (
        <div className="reports-state">Checking your session...</div>
      ) : loading ? (
        <div className="reports-state">Generating reports...</div>
      ) : error ? (
        <div className="reports-state reports-state--error">{error}</div>
      ) : (
        <>
          <section className="reports-kpis" aria-label="Core KPIs">
            <article className="reports-kpi reports-kpi--hours">
              <div className="reports-kpi__icon"><LuClock3 /></div>
              <span>Total hours logged</span>
              <strong>{formatHours(derived.totalHours)}</strong>
              <small>{formatHours(derived.avgHours)} average per active employee</small>
            </article>

            <article className="reports-kpi reports-kpi--leaves">
              <div className="reports-kpi__icon"><LuCalendarDays /></div>
              <span>Leaves taken</span>
              <strong>{derived.totalLeaves}</strong>
              <small>{derived.totalEmployees || 0} active employees in scope</small>
            </article>

            <article className="reports-kpi reports-kpi--people">
              <div className="reports-kpi__icon"><LuUsers /></div>
              <span>Active employees</span>
              <strong>{derived.totalEmployees}</strong>
              <small>{derived.departments.length} department groups represented</small>
            </article>

            <article className="reports-kpi reports-kpi--alerts">
              <div className="reports-kpi__icon"><LuShieldAlert /></div>
              <span>Inventory alerts</span>
              <strong>{derived.alertCount}</strong>
              <small>{derived.criticalAlerts} critical stockouts need immediate action</small>
            </article>
          </section>

          <section className="reports-insights" aria-label="Operational insights">
            {derived.insights.map((insight) => {
              const Icon = insight.icon
              return (
                <article key={insight.label} className={`reports-insight reports-insight--${insight.tone}`}>
                  <div className="reports-insight__top">
                    <span>{insight.label}</span>
                    <Icon />
                  </div>
                  <strong>{insight.value}</strong>
                  <p>{insight.detail}</p>
                </article>
              )
            })}
          </section>

          <section className="reports-panel reports-popular" aria-label="Popular storefront products">
            <div className="reports-panel__header">
              <div>
                <span>Storefront analytics</span>
                <h2>Products customers are interested in</h2>
              </div>
              <div className="reports-inline-note"><LuTrendingUp /> Based on quote-cart activity</div>
            </div>
            {popularProducts.length ? (
              <div className="reports-popular__list">
                {popularProducts.map((product, index) => (
                  <article key={product.product_id}>
                    <strong>#{index + 1}</strong>
                    <div><b>{product.title}</b><span>{product.category}</span></div>
                    <div><b>{product.quote_adds}</b><span>quote adds</span></div>
                    <div><b>{product.interactions}</b><span>interactions</span></div>
                  </article>
                ))}
              </div>
            ) : <div className="reports-empty-panel">Product interest will appear as customers use the quote cart.</div>}
          </section>

          <section className="reports-grid">
            <article className="reports-panel reports-panel--table">
              <div className="reports-panel__header">
                <div>
                  <span>Employee scorecard</span>
                  <h2>Monthly workforce performance</h2>
                </div>
                <div className="reports-inline-note">
                  <LuFileSpreadsheet />
                  Ranked by hours logged, then completed tasks
                </div>
              </div>

              <DashboardTable
                className="reports-dashboard-table"
                columns={employeePerformanceColumns}
                rows={derived.rankedEmployees}
                rowKey={(employee) => employee.employee_id}
                minWidth={980}
                emptyTitle="No employee activity found for this month"
                emptyDescription="Monthly workforce performance data will appear here once logs are submitted."
                renderCell={(employee, column) => {
                  const employeeIndex = derived.rankedEmployees.findIndex((item) => item.employee_id === employee.employee_id)
                  const utilization = Math.min(100, Math.round(((employee.total_hours || 0) / HOURS_TARGET) * 100))

                  switch (column.key) {
                    case 'employee':
                      return (
                        <div className="reports-employee">
                          <strong>{employee.name}</strong>
                          <span>{employee.position || employee.employee_code || 'No role assigned'}</span>
                        </div>
                      )
                    case 'department':
                      return employee.department || 'Unassigned'
                    case 'utilization':
                      return (
                        <div className="reports-meter">
                          <div className="reports-meter__track">
                            <span style={{ width: `${utilization}%` }} />
                          </div>
                          <small>{utilization}% of target</small>
                        </div>
                      )
                    case 'hours':
                      return (
                        <span className={`reports-badge ${employeeIndex < 3 ? 'is-positive' : ''}`}>
                          {formatHours(employee.total_hours)}
                        </span>
                      )
                    case 'tasks':
                      return employee.tasks_completed
                    case 'leave':
                      return (
                        <span className={`reports-badge ${employee.leaves_taken > 0 ? 'is-warning' : ''}`}>
                          {employee.leaves_taken}d
                        </span>
                      )
                    default:
                      return null
                  }
                }}
              />
            </article>

            <div className="reports-stack">
              <article className="reports-panel">
                <div className="reports-panel__header">
                  <div>
                    <span>Department breakdown</span>
                    <h2>Workload by team</h2>
                  </div>
                </div>

                <div className="reports-departments">
                  {derived.departments.length ? (
                    derived.departments.map((department) => (
                      <div key={department.name} className="reports-department-card">
                        <div className="reports-department-card__top">
                          <strong>{department.name}</strong>
                          <span>{department.employees} people</span>
                        </div>
                        <div className="reports-department-card__stats">
                          <div>
                            <small>Hours</small>
                            <span>{formatHours(department.hours)}</span>
                          </div>
                          <div>
                            <small>Tasks</small>
                            <span>{department.tasks}</span>
                          </div>
                          <div>
                            <small>Leave</small>
                            <span>{department.leaves}d</span>
                          </div>
                        </div>
                        <div className="reports-department-card__footer">
                          <span>Average utilization</span>
                          <strong>{Math.round((department.avgHours / HOURS_TARGET) * 100)}%</strong>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="reports-empty-panel">No department data available for the selected month.</div>
                  )}
                </div>
              </article>

              <article className="reports-panel">
                <div className="reports-panel__header">
                  <div>
                    <span>Inventory attention</span>
                    <h2>Stock risk overview</h2>
                  </div>
                </div>

                <div className="reports-status-row">
                  <div className="reports-status-pill is-critical">
                    <LuCircleAlert />
                    <span>{derived.statusSummary.critical} critical</span>
                  </div>
                  <div className="reports-status-pill is-warning">
                    <LuArrowDownRight />
                    <span>{derived.statusSummary.warning} low stock</span>
                  </div>
                  <div className="reports-status-pill is-positive">
                    <LuArrowUpRight />
                    <span>{Math.max(0, derived.alertCount - derived.statusSummary.critical - derived.statusSummary.warning)} stable</span>
                  </div>
                </div>

                {alertsData.length ? (
                  <div className="reports-alerts">
                    {alertsData.map((item) => (
                      <div key={item.id} className={`reports-alert-card tone-${getAlertTone(item)}`}>
                        <div className="reports-alert-card__head">
                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.category} | {item.sku}</span>
                          </div>
                          <mark>{item.status === 'out_of_stock' ? 'Out of stock' : 'Low stock'}</mark>
                        </div>
                        <div className="reports-alert-card__stats">
                          <div>
                            <small>Current</small>
                            <strong>{item.quantity}</strong>
                          </div>
                          <div>
                            <small>Reorder level</small>
                            <strong>{item.reorder_level}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="reports-empty-panel reports-empty-panel--success">
                    <LuCircleCheck />
                    <span>All inventory items are currently above reorder level.</span>
                  </div>
                )}
              </article>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
