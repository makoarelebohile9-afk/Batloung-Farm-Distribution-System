import { useCallback, useState } from 'react'
import { api } from '../api/client.js'
import DataTable from '../components/DataTable.jsx'
import { ErrorState, LoadingState, Notice } from '../components/Feedback.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import RecordDetailsModal from '../components/RecordDetailsModal.jsx'
import SectionCard from '../components/SectionCard.jsx'
import { PACKAGING_SIZES } from '../constants.js'
import useAsyncData from '../hooks/useAsyncData.js'
import { formatDate, formatMoney } from '../utils/format.js'

const blankLine = () => ({
  fruitId: '',
  packagingSize: 'SMALL',
  quantity: '1',
  unitCost: '',
})

export default function PurchasesPage() {
  const load = useCallback(async () => {
    const [purchases, suppliers, fruits] = await Promise.all([
      api.purchases.list(),
      api.suppliers.list(),
      api.fruits.list(),
    ])
    return { purchases, suppliers, fruits }
  }, [])
  const { data, error, loading, refresh } = useAsyncData(load)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState([blankLine()])
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const suppliers = data?.suppliers ?? []
  const fruits = data?.fruits?.filter((fruit) => fruit.status === 'ACTIVE') ?? []
  const purchases = data?.purchases ?? []

  function openForm() {
    setSupplierId(String(suppliers[0]?.supplier_id ?? ''))
    setItems([blankLine()])
    setDialogOpen(true)
  }

  function updateLine(index, field, value) {
    setItems((current) => current.map((item, lineIndex) =>
      lineIndex === index ? { ...item, [field]: value } : item,
    ))
  }

  function totalCents() {
    return items.reduce((total, item) => {
      return total + Math.round(Number(item.unitCost || 0) * 100) * Number(item.quantity || 0)
    }, 0)
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      const result = await api.purchases.create({
        supplierId: Number(supplierId),
        items: items.map((item) => ({
          fruitId: Number(item.fruitId),
          packagingSize: item.packagingSize,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      })
      setNotice({ tone: 'success', message: `Purchase #${result.purchaseId} recorded. Stock and total were updated.` })
      setDialogOpen(false)
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
        eyebrow="Inbound produce"
        title="Purchase register"
        description="Record deliveries from South African suppliers. Successful purchases increase stock for each box size."
        visual="purchases"
        icon="purchases"
        visualLabel="Inbound harvest"
        action={<button className="button button-primary" disabled={!suppliers.length || !fruits.length} onClick={openForm} type="button"><span className="icon-plus">+</span> Record purchase</button>}
      />
      {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}
      {error && <ErrorState error={error} onRetry={refresh} />}
      <SectionCard title="Purchase history" subtitle={`${purchases.length} recorded purchase${purchases.length === 1 ? '' : 's'}`}>
        {loading && !purchases.length ? <LoadingState /> : (
          <DataTable
            rowKey="purchase_id"
            rows={purchases}
            onRowClick={setSelectedPurchase}
            getRowLabel={(row) => `purchase #${row.purchase_id}`}
            emptyTitle="No purchases recorded"
            emptyDescription="Record an incoming supplier delivery to increase stock."
            columns={[
              { key: 'purchase_id', label: 'Purchase', render: (row) => <strong className="table-primary">#{row.purchase_id}</strong> },
              { key: 'business_name', label: 'Supplier', render: (row) => <span className="table-primary">{row.business_name}</span> },
              { key: 'purchase_date', label: 'Date', render: (row) => formatDate(row.purchase_date) },
              { key: 'total_amount', label: 'Total purchase cost', render: (row) => <strong className="table-primary">{formatMoney(row.total_amount)}</strong> },
            ]}
          />
        )}
      </SectionCard>

      {selectedPurchase && (
        <RecordDetailsModal
          title={`Purchase #${selectedPurchase.purchase_id}`}
          description="Supplier delivery details"
          onClose={() => setSelectedPurchase(null)}
          details={[
            { label: 'Supplier', value: selectedPurchase.business_name },
            { label: 'Purchase date', value: formatDate(selectedPurchase.purchase_date) },
            { label: 'Total purchase cost', value: formatMoney(selectedPurchase.total_amount) },
          ]}
        />
      )}

      {dialogOpen && (
        <Modal
          title="Record a supplier purchase"
          description="Add every delivered fruit and package size. The system calculates the total and updates stock as one transaction."
          onClose={() => setDialogOpen(false)}
        >
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="Supplier" wide>
                <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} required>
                  {suppliers.map((supplier) => <option key={supplier.supplier_id} value={supplier.supplier_id}>{supplier.business_name} · {supplier.province}</option>)}
                </select>
              </Field>
            </div>
            {items.map((item, index) => (
              <div className="line-item" key={index}>
                <Field label="Fruit">
                  <select value={item.fruitId} onChange={(event) => updateLine(index, 'fruitId', event.target.value)} required>
                    <option value="">Select fruit</option>
                    {fruits.map((fruit) => <option value={fruit.fruitId} key={fruit.fruitId}>{fruit.fruitName}</option>)}
                  </select>
                </Field>
                <Field label="Package">
                  <select value={item.packagingSize} onChange={(event) => updateLine(index, 'packagingSize', event.target.value)}>
                    {PACKAGING_SIZES.map((size) => <option key={size}>{size}</option>)}
                  </select>
                </Field>
                <Field label="Boxes">
                  <input type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} required />
                </Field>
                <Field label="Cost per box (M)">
                  <input type="number" min="0.01" step="0.01" value={item.unitCost} onChange={(event) => updateLine(index, 'unitCost', event.target.value)} required />
                </Field>
                {items.length > 1 && <button className="button button-danger button-small" onClick={() => setItems((current) => current.filter((_, lineIndex) => lineIndex !== index))} type="button" aria-label="Remove item">×</button>}
              </div>
            ))}
            <div className="form-actions">
              <button className="button button-outline" onClick={() => setItems((current) => [...current, blankLine()])} type="button">+ Add another item</button>
            </div>
            <div className="transaction-total"><span>Calculated purchase total</span><strong>{formatMoney(totalCents() / 100)}</strong></div>
            <div className="form-actions">
              <button className="button button-outline" onClick={() => setDialogOpen(false)} type="button">Cancel</button>
              <button className="button button-primary" disabled={saving} type="submit">{saving ? 'Recording…' : 'Save purchase'}</button>
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

