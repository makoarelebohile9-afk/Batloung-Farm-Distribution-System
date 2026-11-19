import AppIcon from './AppIcon.jsx'

export default function PageHeader({ eyebrow, title, description, action, visual, icon, visualLabel }) {
  return (
    <div className={`page-heading ${visual ? `page-heading--${visual}` : 'page-heading--plain'}`}>
      <div className="page-heading-copy">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {visual && (
        <div className="page-heading-art" aria-hidden="true">
          <span className="page-heading-art-caption">{visualLabel}</span>
          <span className="page-heading-art-icon" data-icon={icon ?? visual}><AppIcon name={icon ?? visual} /></span>
        </div>
      )}
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  )
}

