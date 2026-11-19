import { useCallback, useState } from 'react'
import { api } from '../api/client.js'
import { EmptyState, ErrorState, LoadingState, Notice } from '../components/Feedback.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import RecordDetailsModal from '../components/RecordDetailsModal.jsx'
import SectionCard from '../components/SectionCard.jsx'
import { LESOTHO_DISTRICTS } from '../constants.js'
import useAsyncData from '../hooks/useAsyncData.js'
import { formatDate, formatMoney } from '../utils/format.js'

const blankVendor = {
  vendorName: '',
  phoneNumber: '',
  district: 'Maseru',
  location: '',
  registrationDate: '',
}

export default function VendorsPage() {
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('')
  const searchKey = `${search}|${district}`
  const load = useCallback(
    () => api.vendors.list({ search, district }),
    [search, district],
  )
  const { data = [], error, loading, refresh } = useAsyncData(load, searchKey)
  const [dialog, setDialog] = useState(null)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [form, setForm] = useState(blankVendor)
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setForm(blankVendor)
    setDialog({ mode: 'create' })
  }

  function openEdit(vendor) {
    setForm({
      vendorName: vendor.vendor_name,
      phoneNumber: vendor.phone_number,
      district: vendor.district,
      location: vendor.location,
      registrationDate: vendor.registration_date
        ? String(vendor.registration_date).slice(0, 10)
        : '',
    })
    setDialog({ mode: 'edit', vendor })
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    const payload = { ...form }
    if (!payload.registrationDate) {
      delete payload.registrationDate
    }
    try {
      if (dialog.mode === 'edit') {
        await api.vendors.update(dialog.vendor.vendor_id, payload)
        setNotice({ tone: 'success', message: 'Vendor details updated.' })
      } else {
        await api.vendors.create(payload)
        setNotice({ tone: 'success', message: 'Vendor registered in the district network.' })
      }
      setDialog(null)
      refresh()
    } catch (requestError) {
      setNotice({ tone: 'error', message: requestError.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Lesotho retail network"
        title="Vendor directory"
        description="Find registered street vendors and retailers by name, phone, or any of Lesotho's ten districts."
        visual="vendors"
        icon="vendors"
        visualLabel="Local partners"
        action={<button className="button button-primary" onClick={openCreate} type="button"><span className="icon-plus">+</span> Add vendor</button>}
      />
      {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}
      {error && <ErrorState error={error} onRetry={refresh} />}
      <SectionCard
        title="Registered vendors"
        subtitle={`${data.length} vendor${data.length === 1 ? '' : 's'} · outstanding balances in Maloti`}
        action={
          <div className="toolbar">
            <input
              aria-label="Search vendor name or phone"
              className="search-input"
              placeholder="Search name or phone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              aria-label="Filter by district"
              className="select-control"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
            >
              <option value="">All districts</option>
              {LESOTHO_DISTRICTS.map((name) => <option key={name}>{name}</option>)}
            </select>
          </div>
        }
      >
        {loading && !data.length ? <LoadingState /> : (
          data.length ? (
            <div className="vendor-directory-grid">
              {data.map((vendor) => {
                const hasOutstandingBalance = Number(vendor.outstanding_balance) > 0
                return (
                  <article
                    className="vendor-profile-card vendor-profile-card-clickable"
                    key={vendor.vendor_id}
                    tabIndex={0}
                    aria-label={`View details for ${vendor.vendor_name}`}
                    onClick={() => setSelectedVendor(vendor)}
                    onKeyDown={(event) => {
                      if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault()
                        setSelectedVendor(vendor)
                      }
                    }}
                  >
                    <div className="vendor-profile-header">
                      <span className="vendor-avatar" aria-hidden="true">{vendorInitials(vendor.vendor_name)}</span>
                      <div className="vendor-profile-identity">
                        <h3>{vendor.vendor_name}</h3>
                        <span>Registered vendor partner</span>
                      </div>
                      <a className="button button-outline button-small" href={vendorMapsUrl(vendor)} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>Map</a>
                      <button className="button button-outline button-small" onClick={(event) => {
                        event.stopPropagation()
                        openEdit(vendor)
                      }} type="button">Edit</button>
                    </div>
                    <div className="vendor-profile-contact">
                      <span>PHONE</span>
                      <strong>{vendor.phone_number}</strong>
                    </div>
                    <div className="vendor-profile-details">
                      <div className="vendor-profile-detail">
                        <span>District</span>
                        <strong className="district-tag">{vendor.district}</strong>
                      </div>
                      <div className="vendor-profile-detail">
                        <span>Trading location</span>
                        <strong>{vendor.location}</strong>
                      </div>
                    </div>
                    <div className="vendor-profile-footer">
                      <div className="vendor-profile-balance">
                        <span>Outstanding balance</span>
                        <strong className={hasOutstandingBalance ? 'has-balance' : 'balance-clear'}>
                          {formatMoney(vendor.outstanding_balance)}
                        </strong>
                      </div>
                      <div className="vendor-profile-registration">
                        <span>Registered</span>
                        <strong>{formatDate(vendor.registration_date)}</strong>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="No vendors found"
              description="Try a different search or register a new vendor."
            />
          )
        )}
      </SectionCard>

      {selectedVendor && (
        <RecordDetailsModal
          title={selectedVendor.vendor_name}
          description="Registered vendor account details"
          onClose={() => setSelectedVendor(null)}
          details={[
            { label: 'Phone number', value: selectedVendor.phone_number },
            { label: 'District', value: selectedVendor.district },
            { label: 'Trading location', value: selectedVendor.location },
            { label: 'Registration date', value: formatDate(selectedVendor.registration_date) },
            { label: 'Total sales', value: formatMoney(selectedVendor.total_sales) },
            { label: 'Total paid', value: formatMoney(selectedVendor.total_paid) },
            { label: 'Outstanding balance', value: formatMoney(selectedVendor.outstanding_balance) },
          ]}
        />
      )}

      {dialog && (
        <Modal
          title={dialog.mode === 'edit' ? 'Update vendor' : 'Register a vendor'}
          description="Choose the vendor's Lesotho district and add a local market or street location."
          onClose={() => setDialog(null)}
        >
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="Vendor or business name">
                <input name="vendorName" value={form.vendorName} onChange={updateField} required maxLength={150} />
              </Field>
              <Field label="Phone number">
                <input name="phoneNumber" value={form.phoneNumber} onChange={updateField} required maxLength={32} />
              </Field>
              <Field label="District">
                <select name="district" value={form.district} onChange={updateField} required>
                  {LESOTHO_DISTRICTS.map((name) => <option key={name}>{name}</option>)}
                </select>
              </Field>
              <Field label="Market or street location">
                <input name="location" value={form.location} onChange={updateField} required maxLength={255} />
              </Field>
              <Field label="Registration date (optional)" wide>
                <input name="registrationDate" type="date" value={form.registrationDate} onChange={updateField} />
              </Field>
            </div>
            <div className="form-actions">
              <button className="button button-outline" onClick={() => setDialog(null)} type="button">Cancel</button>
              <button className="button button-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save vendor'}</button>
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

function vendorMapsUrl(vendor) {
  const query = encodeURIComponent(`${vendor.location}, ${vendor.district}, Lesotho`)
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`
}

function vendorInitials(name) {
  return String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || 'V'
}

