import Modal from './Modal.jsx'

export default function RecordDetailsModal({ title, description, details, onClose }) {
  return (
    <Modal title={title} description={description} onClose={onClose}>
      <dl className="record-details-grid">
        {details.map(({ label, value }) => (
          <div className="record-detail-item" key={label}>
            <dt>{label}</dt>
            <dd>{value === '' || value === null || value === undefined ? '—' : value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}
