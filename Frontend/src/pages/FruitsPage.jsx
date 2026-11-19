import { useCallback, useState } from 'react'
import { api } from '../api/client.js'
import applePhoto from '../assets/photos/fruit-catalogue/apple.jpg'
import bananaPhoto from '../assets/photos/fruit-catalogue/banana.jpg'
import grapePhoto from '../assets/photos/fruit-catalogue/grape.jpg'
import mangoPhoto from '../assets/photos/fruit-catalogue/mango.jpg'
import orangePhoto from '../assets/photos/fruit-catalogue/orange.jpg'
import DataTable from '../components/DataTable.jsx'
import { ErrorState, LoadingState, Notice } from '../components/Feedback.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import RecordDetailsModal from '../components/RecordDetailsModal.jsx'
import SectionCard from '../components/SectionCard.jsx'
import { PACKAGING_SIZES } from '../constants.js'
import useAsyncData from '../hooks/useAsyncData.js'
import { formatMoney, titleCase } from '../utils/format.js'

const blankFruit = {
  fruitName: '',
  description: '',
  status: 'ACTIVE',
  sellingPrices: { SMALL: '', MEDIUM: '', LARGE: '' },
}

const fruitPhotos = {
  apple: applePhoto,
  banana: bananaPhoto,
  grape: grapePhoto,
  mango: mangoPhoto,
  orange: orangePhoto,
}

export default function FruitsPage() {
  const load = useCallback(() => api.fruits.list(), [])
  const { data = [], error, loading, refresh } = useAsyncData(load)
  const [dialog, setDialog] = useState(null)
  const [selectedFruit, setSelectedFruit] = useState(null)
  const [form, setForm] = useState(blankFruit)
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setForm(blankFruit)
    setDialog({ mode: 'create' })
  }

  function openEdit(fruit) {
    setForm({
      fruitName: fruit.fruitName,
      description: fruit.description ?? '',
      status: fruit.status,
      sellingPrices: Object.fromEntries(PACKAGING_SIZES.map((size) => [
        size,
        fruit.sellingPrices?.[size] ?? '',
      ])),
    })
    setDialog({ mode: 'edit', fruit })
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updatePrice(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      sellingPrices: { ...current.sellingPrices, [name]: value },
    }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    const payload = {
      ...form,
      sellingPrices: Object.fromEntries(
        PACKAGING_SIZES.map((size) => [size, Number(form.sellingPrices[size])]),
      ),
    }
    try {
      if (dialog.mode === 'edit') {
        await api.fruits.update(dialog.fruit.fruitId, payload)
        setNotice({ tone: 'success', message: 'Fruit and package prices updated.' })
      } else {
        await api.fruits.create(payload)
        setNotice({ tone: 'success', message: 'Fruit type registered with three package prices.' })
      }
      setDialog(null)
      refresh()
    } catch (requestError) {
      setNotice({ tone: 'error', message: requestError.message })
    } finally {
      setSaving(false)
    }
  }

  async function remove(fruit) {
    if (!window.confirm(`Delete ${fruit.fruitName}? Fruits with purchase or sales history cannot be deleted.`)) {
      return
    }
    try {
      await api.fruits.delete(fruit.fruitId)
      setNotice({ tone: 'success', message: 'Fruit type removed.' })
      refresh()
    } catch (requestError) {
      setNotice({ tone: 'error', message: requestError.message })
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Produce catalogue"
        title="Fruit types & prices"
        description="Manage the produce you distribute and set a distinct selling price for every box size."
        visual="fruits"
        icon="fruits"
        visualLabel="Fresh produce"
        action={<button className="button button-primary" onClick={openCreate} type="button"><span className="icon-plus">+</span> Add fruit</button>}
      />
      {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}
      {error && <ErrorState error={error} onRetry={refresh} />}
      <SectionCard title="Fruit catalogue" subtitle="Small, medium, and large prices are saved with every fruit type">
        {loading && !data.length ? <LoadingState /> : (
          <DataTable
            rowKey="fruitId"
            rows={data}
            onRowClick={setSelectedFruit}
            getRowLabel={(row) => row.fruitName}
            emptyTitle="No fruit types configured"
            emptyDescription="Add apples, bananas, oranges, mangoes, or grapes to get started."
            columns={[
              { key: 'fruitName', label: 'Fruit', render: (row) => <div className="fruit-identity"><img className="fruit-photo-thumb" src={fruitPhotos[fruitPhotoKey(row.fruitName)] ?? applePhoto} alt="" /><span className="fruit-identity-copy"><strong>{row.fruitName}</strong><span>{row.description || 'No description'}</span></span></div> },
              { key: 'sellingPrices', label: 'Selling price by box', render: (row) => <div className="fruit-price-grid">{PACKAGING_SIZES.map((size) => <div className="fruit-price-card" key={size}><span className="fruit-price-size">{titleCase(size)} box</span><strong className="fruit-price-amount">{formatMoney(row.sellingPrices?.[size])}</strong></div>)}</div> },
              { key: 'status', label: 'Status', render: (row) => <span className={`badge ${row.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>{row.status === 'ACTIVE' ? 'Available' : 'Unavailable'}</span> },
              { key: 'actions', label: 'Actions', render: (row) => <div className="table-actions"><button className="button button-outline button-small" onClick={() => openEdit(row)} type="button">Edit</button><button className="button button-danger button-small" onClick={() => remove(row)} type="button">Delete</button></div> },
            ]}
          />
        )}
      </SectionCard>

      {selectedFruit && (
        <RecordDetailsModal
          title={selectedFruit.fruitName}
          description={selectedFruit.description || 'Fruit catalogue details'}
          onClose={() => setSelectedFruit(null)}
          details={[
            { label: 'Availability', value: selectedFruit.status === 'ACTIVE' ? 'Available' : 'Unavailable' },
            ...PACKAGING_SIZES.map((size) => ({
              label: `${titleCase(size)} box price`,
              value: formatMoney(selectedFruit.sellingPrices?.[size]),
            })),
          ]}
        />
      )}

      {dialog && (
        <Modal
          title={dialog.mode === 'edit' ? 'Update fruit type' : 'Add a fruit type'}
          description="Each packaging size needs its own positive selling price."
          onClose={() => setDialog(null)}
        >
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="Fruit name">
                <input name="fruitName" value={form.fruitName} onChange={updateField} required maxLength={100} />
              </Field>
              <Field label="Status">
                <select name="status" value={form.status} onChange={updateField}>
                  <option value="ACTIVE">Available</option>
                  <option value="INACTIVE">Unavailable</option>
                </select>
              </Field>
              <Field label="Description" wide>
                <textarea name="description" value={form.description} onChange={updateField} maxLength={500} />
              </Field>
              <p className="form-section-title">Selling price by box size · Maloti (M)</p>
              {PACKAGING_SIZES.map((size) => (
                <Field label={`${titleCase(size)} box`} key={size}>
                  <input name={size} type="number" min="0.01" step="0.01" value={form.sellingPrices[size]} onChange={updatePrice} required />
                </Field>
              ))}
            </div>
            <div className="form-actions">
              <button className="button button-outline" onClick={() => setDialog(null)} type="button">Cancel</button>
              <button className="button button-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save fruit'}</button>
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

function fruitPhotoKey(name) {
  const normalizedName = String(name ?? '').trim().toLowerCase()
  return Object.keys(fruitPhotos).find((fruit) => normalizedName.includes(fruit))
}

