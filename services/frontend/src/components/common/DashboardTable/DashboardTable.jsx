import './DashboardTable.css'

export default function DashboardTable({
  columns,
  rows,
  rowKey,
  renderCell,
  emptyTitle = 'No records found',
  emptyDescription = 'Records will appear here once data is available.',
  minWidth = 880,
  className = '',
}) {
  const wrapperClassName = ['dashboard-table', className].filter(Boolean).join(' ')

  return (
    <div className={wrapperClassName}>
      <div className="dashboard-table__frame">
        <div className="dashboard-table__glow dashboard-table__glow--left" />
        <div className="dashboard-table__glow dashboard-table__glow--right" />

        <div className="dashboard-table__scroll">
          <table style={{ minWidth }}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={column.align === 'right' ? 'text-right' : undefined}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey]}>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={column.align === 'right' ? 'text-right' : undefined}
                      >
                        {renderCell(row, column)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="dashboard-table__empty-cell" colSpan={columns.length}>
                    <div className="dashboard-table__empty">
                      <h3>{emptyTitle}</h3>
                      <p>{emptyDescription}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
