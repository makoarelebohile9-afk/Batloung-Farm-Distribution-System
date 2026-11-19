import { useCallback, useState } from 'react'
import { api } from '../api/client.js'
import DataTable from '../components/DataTable.jsx'
import { ErrorState, LoadingState, Notice } from '../components/Feedback.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import RecordDetailsModal from '../components/RecordDetailsModal.jsx'
import SectionCard from '../components/SectionCard.jsx'
import { SOUTH_AFRICAN_PROVINCES } from '../constants.js'
import useAsyncData from '../hooks/useAsyncData.js'

const blankSupplier = {
  businessName: '',
  contactPerson: '',
  phone: '',
  province: SOUTH_AFRICAN_PROVINCES[0],
  address: '',
}

export default function SuppliersPage() {
  const load = useCallback(() => api.suppliers.list(), [])
  const { data = [], error, loading, refresh } = useAsyncData(load)
  const [dialog, setDialog] = useState(null)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [form, setForm] = useState(blankSupplier)
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setForm(blankSupplier)
    setDialog({ mode: 'create' })
  }

  function openEdit(supplier) {
    setForm({
      businessName: supplier.business_name,
      contactPerson: supplier.contact_person,
      phone: supplier.phone,
      province: supplier.province,
      address: supplier.address,
    })
    setDialog({ mode: 'edit', supplier })
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      if (dialog.mode === 'edit') {
        await api.suppliers.update(dialog.supplier.supplier_id, form)
        setNotice({ tone: 'success', message: 'Supplier details updated.' })
      } else {
        await api.suppliers.create(form)
        setNotice({ tone: 'success', message: 'Supplier registered successfully.' })
      }
      setDialog(null)
      refresh()
    } catch (requestError) {
      setNotice({ tone: 'error', message: requestError.message })
    } finally {
      setSaving(false)
    }
  }

  async function remove(supplier) {
    if (!window.confirm(`Delete ${supplier.business_name}? Suppliers with purchase history cannot be deleted.`)) {
      return
    }
    try {
      await api.suppliers.delete(supplier.supplier_id)
      setNotice({ tone: 'success', message: 'Supplier removed.' })
      refresh()
    } catch (requestError) {
      setNotice({ tone: 'error', message: requestError.message })
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Supply network"
        title="Supplier directory"
        description="Keep producer contacts and South African sourcing provinces in one reliable record."
        visual="suppliers"
        icon="suppliers"
        visualLabel="Grower network"
        action={<button className="button button-primary" onClick={openCreate} type="button"><span className="icon-plus">+</span> Add supplier</button>}
      />
      {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}
      {error && <ErrorState error={error} onRetry={refresh} />}
      <SectionCard className="supplier-directory-card" title="Registered suppliers" subtitle={`${data.length} supplier${data.length === 1 ? '' : 's'} in your network`} action={<span className="district-tag">South Africa · 8 provinces</span>}>
        {loading && !data.length ? <LoadingState /> : (
          <DataTable
            rowKey="supplier_id"
            rows={data}
            onRowClick={setSelectedSupplier}
            getRowLabel={(row) => row.business_name}
            emptyTitle="No suppliers registered"
            emptyDescription="Add your first supplier to start tracking purchases."
            columns={[
              { key: 'business_name', label: 'Business', render: (row) => <div className="supplier-identity"><span className="supplier-avatar" aria-hidden="true">{supplierInitials(row.business_name)}</span><span className="supplier-identity-copy"><strong>{row.business_name}</strong><span>{row.address}</span></span></div> },
              { key: 'contact_person', label: 'Primary contact', render: (row) => <span className="supplier-contact"><strong>{row.contact_person}</strong><span>{row.phone}</span></span> },
              { key: 'province', label: 'Sourcing province', render: (row) => <span className="district-tag">{row.province}</span> },
              { key: 'actions', label: 'Actions', render: (row) => <div className="table-actions"><a className="button button-outline button-small" href={supplierMapsUrl(row)} target="_blank" rel="noopener noreferrer">Map</a><button className="button button-outline button-small" onClick={() => openEdit(row)} type="button">Edit</button><button className="button button-danger button-small" onClick={() => remove(row)} type="button">Delete</button></div> },
            ]}
          />
        )}
      </SectionCard>

      {selectedSupplier && (
        <RecordDetailsModal
          title={selectedSupplier.business_name}
          description="Registered supplier details"
          onClose={() => setSelectedSupplier(null)}
          details={[
            { label: 'Contact person', value: selectedSupplier.contact_person },
            { label: 'Phone number', value: selectedSupplier.phone },
            { label: 'Province', value: selectedSupplier.province },
            { label: 'Business address', value: selectedSupplier.address },
          ]}
        />
      )}

      {dialog && (
        <Modal
          title={dialog.mode === 'edit' ? 'Update supplier' : 'Register supplier'}
          description="Use the supplier's registered business and contact details."
          onClose={() => setDialog(null)}
        >
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="Business name">
                <input name="businessName" value={form.businessName} onChange={updateField} required maxLength={150} />
              </Field>
              <Field label="Contact person">
                <input name="contactPerson" value={form.contactPerson} onChange={updateField} required maxLength={120} />
              </Field>
              <Field label="Phone number">
                <input name="phone" value={form.phone} onChange={updateField} required maxLength={32} />
              </Field>
              <Field label="Province">
                <select name="province" value={form.province} onChange={updateField}>
                  {SOUTH_AFRICAN_PROVINCES.map((province) => <option key={province}>{province}</option>)}
                </select>
              </Field>
              <Field label="Business address" wide>
                <input name="address" value={form.address} onChange={updateField} required maxLength={255} />
              </Field>
            </div>
            <div className="form-actions">
              <button className="button button-outline" onClick={() => setDialog(null)} type="button">Cancel</button>
              <button className="button button-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save supplier'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

function Field({ label, wide = false, children }) {
  return <div className={`form-field ${wide ? 'form-wide' : ''}`}><label>{label}</label>{children}</div>
}

function supplierMapsUrl(supplier) {
  const query = encodeURIComponent(`${supplier.address}, ${supplier.province}, South Africa`)
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`
}

function supplierInitials(name) {
  return String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || 'S'
}

