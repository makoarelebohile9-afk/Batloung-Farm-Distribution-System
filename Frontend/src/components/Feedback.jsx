export function LoadingState({ label = 'Loading data…' }) {
  return (
    <div className="feedback loading-state" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="feedback error-state" role="alert">
      <div>
        <strong>Could not load this section</strong>
        <p>{error?.message ?? 'Please try again.'}</p>
      </div>
      {onRetry && (
        <button className="button button-outline" onClick={onRetry} type="button">
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <span className="empty-state-mark" aria-hidden="true">+</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

export function Notice({ children, tone = 'success' }) {
  return <div className={`notice notice-${tone}`} role="status">{children}</div>
}

