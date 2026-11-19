import { EmptyState } from './Feedback.jsx'

export default function DataTable({
  columns,
  rows = [],
  rowKey,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'New records will appear here.',
  onRowClick,
  getRowLabel,
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row[rowKey] ?? index}
              className={onRowClick ? 'data-table-row-clickable' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              aria-label={onRowClick ? `View details for ${getRowLabel?.(row) ?? row[rowKey]}` : undefined}
              onClick={onRowClick ? (event) => {
                if (!(event.target instanceof Element) || !event.target.closest('button, a, input, select, textarea, [role="button"]')) {
                  onRowClick(row)
                }
              } : undefined}
              onKeyDown={onRowClick ? (event) => {
                if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault()
                  onRowClick(row)
                }
              } : undefined}
            >
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : row[column.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

