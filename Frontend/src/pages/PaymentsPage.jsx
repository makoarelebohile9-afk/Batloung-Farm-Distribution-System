import { useCallback, useState } from 'react'
import { api } from '../api/client.js'
import DataTable from '../components/DataTable.jsx'
import { ErrorState, LoadingState, Notice } from '../components/Feedback.jsx'
import PageHeader from '../components/PageHeader.jsx'
import RecordDetailsModal from '../components/RecordDetailsModal.jsx'
import SectionCard from '../components/SectionCard.jsx'
import useAsyncData from '../hooks/useAsyncData.js'
import { formatDate, formatMoney, titleCase } from '../utils/format.js'

export default function PaymentsPage() {
  const loadDirectory = useCallback(async () => {
    const [vendors, sales] = await Promise.all([api.vendors.list(), api.sales.list()])
    return { vendors, sales }
  }, [])
  const {
    data: directory,
    error: directoryError,
    loading: directoryLoading,
    refresh: refreshDirectory,
  } = useAsyncData(loadDirectory)

  const vendors = directory?.vendors ?? []
  const sales = directory?.sales ?? []
  const [vendorId, setVendorId] = useState('')
  const selectedVendorId = vendorId || String(vendors[0]?.vendor_id ?? '')
  const loadPayments = useCallback(
    () => selectedVendorId ? api.payments.list(selectedVendorId) : Promise.resolve([]),
    [selectedVendorId],
  )
  const {
    data: payments = [],
    error: paymentError,
    loading: paymentLoading,
    refresh: refreshPayments,
  } = useAsyncData(loadPayments, selectedVendorId)

  const [saleId, setSaleId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [notice, setNotice] = useState(null)
  const vendorSales = sales.filter(
    (sale) => String(sale.vendor_id) === selectedVendorId && sale.payment_status !== 'PAID',
  )
  const activeSale = vendorSales.find((sale) => String(sale.sale_id) === saleId)
    ?? vendorSales[0]
  const selectedVendor = vendors.find((vendor) => String(vendor.vendor_id) === selectedVendorId)

  async function submit(event) {
    event.preventDefault()
    if (!activeSale) {
      setNotice({ tone: 'error', message: 'Select a sale with an outstanding balance.' })
      return
    }
    setSaving(true)
    setNotice(null)
    try {
      const result = await api.payments.create({
        saleId: Number(activeSale.sale_id),
        paymentMethod,
        amount: Number(amount),
      })
      setNotice({
        tone: 'success',
        message: `Payment recorded. Remaining balance: ${formatMoney(result.outstandingBalance)}.`,
      })
      setAmount('')
      setSaleId('')
      refreshPayments()
      refreshDirectory()
    } catch (requestError) {
      setNotice({ tone: 'error', message: requestError.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Vendor accounts"
        title="Payments & outstanding balances"
        description="Record cash or mobile-money payments and keep every vendor's credit position current."
        visual="payments"
        icon="payments"
        visualLabel="Clear accounts"
      />
      {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}
      {directoryError && <ErrorState error={directoryError} onRetry={refreshDirectory} />}
      {paymentError && <ErrorState error={paymentError} onRetry={refreshPayments} />}

      <div className="report-card-grid">
        <SectionCard className="vendor-account-card" title="Vendor account" subtitle="Select a district vendor to view open sales">
          <div className="vendor-account-overview">
            <Field label="Vendor">
              <select value={selectedVendorId} onChange={(event) => {
                setVendorId(event.target.value)
                setSaleId('')
              }}>
                {vendors.map((vendor) => <option value={vendor.vendor_id} key={vendor.vendor_id}>{vendor.vendor_name} · {vendor.district}</option>)}
              </select>
            </Field>
            <div className="vendor-account-balance">
              <span className="vendor-account-balance-label">Outstanding balance</span>
              <strong>{formatMoney(selectedVendor?.outstanding_balance)}</strong>
              <span className="vendor-account-balance-note">Current account · Maloti (M)</span>
            </div>
          </div>
          {selectedVendor && (
            <div className="vendor-account-metrics">
              <div className="vendor-account-metric">
                <span>Total sales</span>
                <strong>{formatMoney(selectedVendor.total_sales)}</strong>
              </div>
              <div className="vendor-account-metric">
                <span>Total paid</span>
                <strong>{formatMoney(selectedVendor.total_paid)}</strong>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Record a payment" subtitle="Payments cannot exceed the remaining sale balance">
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="Sale">
                <select
                  value={activeSale?.sale_id ?? ''}
                  onChange={(event) => setSaleId(event.target.value)}
                  required
                >
                  {vendorSales.map((sale) => <option value={sale.sale_id} key={sale.sale_id}>Sale #{sale.sale_id} · {formatMoney(sale.total_amount)} · {titleCase(sale.payment_status)}</option>)}
                </select>
                {!vendorSales.length && <span className="field-hint">This vendor has no outstanding sales.</span>}
              </Field>
              <Field label="Payment method">
                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile money</option>
                </select>
              </Field>
              <Field label="Amount received (M)" wide>
                <input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
              </Field>
            </div>
            <div className="form-actions">
              <button className="button button-primary" disabled={saving || directoryLoading || !vendorSales.length} type="submit">{saving ? 'Recording…' : 'Record payment'}</button>
            </div>
          </form>
        </SectionCard>
      </div>

      <div className="section-spacer" />
      <SectionCard title="Payment history" subtitle="Recorded payments for the selected vendor">
        {paymentLoading ? <LoadingState /> : (
          <DataTable
            rowKey="payment_id"
            rows={payments}
            onRowClick={setSelectedPayment}
            getRowLabel={(row) => `payment #${row.payment_id}`}
            emptyTitle="No payments found"
            emptyDescription="Payments against vendor sales will appear here."
            columns={[
              { key: 'payment_id', label: 'Payment', render: (row) => <strong className="table-primary">#{row.payment_id}</strong> },
              { key: 'sale_id', label: 'Sale', render: (row) => `#${row.sale_id}` },
              { key: 'payment_method', label: 'Method', render: (row) => <span className="district-tag">{titleCase(row.payment_method)}</span> },
              { key: 'amount', label: 'Amount received', render: (row) => <strong className="table-primary">{formatMoney(row.amount)}</strong> },
              { key: 'paid_at', label: 'Recorded', render: (row) => formatDate(row.paid_at) },
            ]}
          />
        )}
      </SectionCard>

      {selectedPayment && (() => {
        const relatedSale = sales.find((sale) => Number(sale.sale_id) === Number(selectedPayment.sale_id))
        return (
          <RecordDetailsModal
            title={`Payment #${selectedPayment.payment_id}`}
            description="Vendor payment details"
            onClose={() => setSelectedPayment(null)}
            details={[
              { label: 'Sale', value: `#${selectedPayment.sale_id}` },
              { label: 'Vendor', value: relatedSale?.vendor_name ?? selectedVendor?.vendor_name },
              { label: 'Payment method', value: titleCase(selectedPayment.payment_method) },
              { label: 'Amount received', value: formatMoney(selectedPayment.amount) },
              { label: 'Payment date', value: formatDate(selectedPayment.paid_at) },
              ...(relatedSale ? [
                { label: 'Sale total', value: formatMoney(relatedSale.total_amount) },
                { label: 'Sale payment status', value: titleCase(relatedSale.payment_status) },
              ] : []),
            ]}
          />
        )
      })()}
    </>
  )
}

function Field({ label, children }) {
  return <div className="form-field"><label>{label}</label>{children}</div>
}

