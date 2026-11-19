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
import { formatDate, formatMoney, titleCase } from '../utils/format.js'

const blankLine = () => ({ fruitId: '', packagingSize: 'SMALL', quantity: '1' })

export default function SalesPage() {
  const load = useCallback(async () => {
    const [sales, vendors, fruits, stock] = await Promise.all([
      api.sales.list(),
      api.vendors.list(),
      api.fruits.list(),
      api.stock.list(),
    ])
    return { sales, vendors, fruits, stock }
  }, [])
  const { data, error, loading, refresh } = useAsyncData(load)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [vendorId, setVendorId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [paidAmount, setPaidAmount] = useState('')
  const [items, setItems] = useState([blankLine()])
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const vendors = data?.vendors ?? []
  const fruits = data?.fruits?.filter((fruit) => fruit.status === 'ACTIVE') ?? []
  const stock = data?.stock ?? []
  const sales = data?.sales ?? []

  function openForm() {
    setVendorId(String(vendors[0]?.vendor_id ?? ''))
    setPaymentMethod('CASH')
    setPaidAmount('')
    setItems([blankLine()])
    setDialogOpen(true)
  }

  function updateLine(index, field, value) {
    setItems((current) => current.map((item, lineIndex) =>
      lineIndex === index ? { ...item, [field]: value } : item,
    ))
  }

  function available(fruitId, size) {
    const item = stock.find(
      (row) => Number(row.fruit_id) === Number(fruitId) && row.packaging_size === size,
    )
    return Number(item?.available_quantity ?? 0)
  }

  function calculatedTotal() {
    return items.reduce((total, item) => {
      const fruit = fruits.find((entry) => Number(entry.fruitId) === Number(item.fruitId))
      const price = Number(fruit?.sellingPrices?.[item.packagingSize] ?? 0)
      return total + price * Number(item.quantity || 0)
    }, 0)
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    const payload = {
      vendorId: Number(vendorId),
      paymentMethod,
      items: items.map((item) => ({
        fruitId: Number(item.fruitId),
        packagingSize: item.packagingSize,
        quantity: Number(item.quantity),
      })),
    }
    if (paidAmount !== '' && paymentMethod !== 'CREDIT') {
      payload.paidAmount = Number(paidAmount)
    }
    try {
      const result = await api.sales.create(payload)
      setNotice({
        tone: 'success',
        message: `Sale #${result.saleId} recorded · ${formatMoney(result.totalAmount)} total · ${formatMoney(result.outstandingBalance)} outstanding.`,
      })
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
        eyebrow="Outbound orders"
        title="Sales register"
        description="Build multi-item vendor orders. Prices are automatic, stock is checked before saving, and every sale is atomic."
        visual="sales"
        icon="sales"
        visualLabel="Produce in motion"
        action={<button className="button button-primary" disabled={!vendors.length || !fruits.length} onClick={openForm} type="button"><span className="icon-plus">+</span> Record sale</button>}
      />
      {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}
      {error && <ErrorState error={error} onRetry={refresh} />}
      <SectionCard title="Sales history" subtitle={`${sales.length} recorded sale${sales.length === 1 ? '' : 's'}`}>
        {loading && !sales.length ? <LoadingState /> : (
          <DataTable
            rowKey="sale_id"
            rows={sales}
            onRowClick={setSelectedSale}
            getRowLabel={(row) => `sale #${row.sale_id}`}
            emptyTitle="No sales recorded"
            emptyDescription="A completed vendor order will appear here."
            columns={[
              { key: 'sale_id', label: 'Sale', render: (row) => <strong className="table-primary">#{row.sale_id}</strong> },
              { key: 'vendor_name', label: 'Vendor', render: (row) => <><strong className="table-primary">{row.vendor_name}</strong><span className="table-secondary">Vendor #{row.vendor_id}</span></> },
              { key: 'sale_date', label: 'Date', render: (row) => formatDate(row.sale_date) },
              { key: 'payment_status', label: 'Payment status', render: (row) => <span className={`badge ${row.payment_status === 'PAID' ? 'badge-paid' : row.payment_status === 'UNPAID' ? 'badge-unpaid' : 'badge-partial'}`}>{titleCase(row.payment_status)}</span> },
              { key: 'total_amount', label: 'Sale total', render: (row) => <strong className="table-primary">{formatMoney(row.total_amount)}</strong> },
            ]}
          />
        )}
      </SectionCard>

      {selectedSale && (
        <RecordDetailsModal
          title={`Sale #${selectedSale.sale_id}`}
          description="Vendor order details"
          onClose={() => setSelectedSale(null)}
          details={[
            { label: 'Vendor', value: selectedSale.vendor_name },
            { label: 'Vendor account', value: `#${selectedSale.vendor_id}` },
            { label: 'Sale date', value: formatDate(selectedSale.sale_date) },
            { label: 'Payment status', value: titleCase(selectedSale.payment_status) },
            { label: 'Sale total', value: formatMoney(selectedSale.total_amount) },
          ]}
        />
      )}

      {dialogOpen && (
        <Modal
          title="Create a vendor sale"
          description="The system uses current prices and locks every required stock balance before completing the order."
          onClose={() => setDialogOpen(false)}
        >
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="Vendor" wide>
                <select value={vendorId} onChange={(event) => setVendorId(event.target.value)} required>
                  {vendors.map((vendor) => <option key={vendor.vendor_id} value={vendor.vendor_id}>{vendor.vendor_name} · {vendor.district}</option>)}
                </select>
              </Field>
              <Field label="Payment method">
                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile money</option>
                  <option value="CREDIT">Outstanding (credit)</option>
                </select>
              </Field>
              {paymentMethod !== 'CREDIT' && (
                <Field label="Paid now (M)" hint="Leave blank to pay the full amount">
                  <input type="number" min="0.01" step="0.01" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} placeholder={calculatedTotal().toFixed(2)} />
                </Field>
              )}
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
                  <span className="field-hint">Available: {available(item.fruitId, item.packagingSize)}</span>
                </Field>
                <Field label="Unit price">
                  <span className="form-field input-like">{formatMoney(fruits.find((fruit) => Number(fruit.fruitId) === Number(item.fruitId))?.sellingPrices?.[item.packagingSize])}</span>
                </Field>
                {items.length > 1 && <button className="button button-danger button-small" onClick={() => setItems((current) => current.filter((_, lineIndex) => lineIndex !== index))} type="button" aria-label="Remove item">×</button>}
              </div>
            ))}
            <div className="form-actions">
              <button className="button button-outline" onClick={() => setItems((current) => [...current, blankLine()])} type="button">+ Add another item</button>
            </div>
            <div className="transaction-total"><span>Calculated sale total</span><strong>{formatMoney(calculatedTotal())}</strong></div>
            <div className="form-actions">
              <button className="button button-outline" onClick={() => setDialogOpen(false)} type="button">Cancel</button>
              <button className="button button-primary" disabled={saving} type="submit">{saving ? 'Checking stock…' : 'Complete sale'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

function Field({ label, wide = false, hint, children }) {
  return <div className={`form-field ${wide ? 'form-wide' : ''}`}><label>{label}</label>{children}{hint && <span className="field-hint">{hint}</span>}</div>
}

