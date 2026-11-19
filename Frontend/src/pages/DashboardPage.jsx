import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import farmMark from '../assets/batloung-farm-mark.svg'
import { api } from '../api/client.js'
import AppIcon from '../components/AppIcon.jsx'
import DataTable from '../components/DataTable.jsx'
import PageHeader from '../components/PageHeader.jsx'
import RecordDetailsModal from '../components/RecordDetailsModal.jsx'
import SectionCard from '../components/SectionCard.jsx'
import { PACKAGING_SIZES } from '../constants.js'
import { ErrorState, LoadingState } from '../components/Feedback.jsx'
import useAsyncData from '../hooks/useAsyncData.js'
import { formatDate, formatMoney, titleCase } from '../utils/format.js'

function StatCard({ label, value, hint, icon }) {
  return (
    <article className="stat-card">
      <div>
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        <span className="stat-hint">{hint}</span>
      </div>
      <span className="stat-mark" data-icon={icon}><AppIcon name={icon} /></span>
    </article>
  )
}

export default function DashboardPage() {
  const [selectedSale, setSelectedSale] = useState(null)
  const [selectedFruit, setSelectedFruit] = useState(null)
  const load = useCallback(async () => {
    const [suppliers, fruits, vendors, stock, sales] = await Promise.all([
      api.suppliers.list(),
      api.fruits.list(),
      api.vendors.list(),
      api.stock.list(),
      api.sales.list(),
    ])
    return { suppliers, fruits, vendors, stock, sales }
  }, [])
  const { data, error, loading, refresh } = useAsyncData(load)

  const totalBoxes = data?.stock?.reduce(
    (total, item) => total + Number(item.available_quantity),
    0,
  ) ?? 0
  const lowStockCount = data?.stock?.filter(
    (item) => Number(item.available_quantity) <= 10,
  ).length ?? 0
  const revenue = data?.sales?.reduce(
    (total, sale) => total + Number(sale.total_amount),
    0,
  ) ?? 0
  const recentSales = data?.sales?.slice(0, 5) ?? []
  const availableFruits = data?.fruits?.filter((fruit) => fruit.status === 'ACTIVE') ?? []

  return (
    <>
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Daily operations · Lesotho</p>
          <h1>Good day, Batloung Farm.</h1>
          <p>
            Your produce, people, and stock movement together in one clear view.
            Track deliveries from South African suppliers to vendors across Lesotho.
          </p>
        </div>
        <div className="dashboard-hero-mark" aria-hidden="true"><img src={farmMark} alt="" /></div>
      </section>

      <PageHeader
        eyebrow="Operations overview"
        title="Your distribution at a glance"
        description="A live snapshot of suppliers, vendors, packaged stock, and sales."
        action={<button className="button button-outline" onClick={refresh} type="button">Refresh data</button>}
      />

      {error && <ErrorState error={error} onRetry={refresh} />}
      {loading && !data ? (
        <LoadingState label="Loading your farm overview…" />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Registered suppliers" value={data?.suppliers?.length ?? '—'} hint="Across South African provinces" icon="suppliers" />
            <StatCard label="Available fruit types" value={data?.fruits?.filter((fruit) => fruit.status === 'ACTIVE').length ?? '—'} hint="Across three package sizes" icon="fruits" />
            <StatCard label="Vendor partners" value={data?.vendors?.length ?? '—'} hint="Across Lesotho districts" icon="vendors" />
            <StatCard label="Boxes in stock" value={totalBoxes.toLocaleString()} hint={`${lowStockCount} fruit-size combinations at low stock`} icon="stock" />
          </div>

          <div className="summary-strip">
            <span className="summary-chip">Recorded sales <strong>{data?.sales?.length ?? 0}</strong></span>
            <span className="summary-chip">Sales value <strong>{formatMoney(revenue)}</strong></span>
            <Link className="summary-chip" to="/reports">Open performance reports <strong>→</strong></Link>
          </div>

          <SectionCard title="Maseru delivery map" subtitle="Vendor coverage around Maseru, Lesotho">
            <iframe
              title="Maseru city map"
              src="https://maps.google.com/maps?q=Shoprite%20Maseru&t=&z=15&ie=UTF8&iwloc=&output=embed"
              style={{ width: "100%", height: "420px", border: 0, borderRadius: "14px" }}
              loading="lazy"
            />
          </SectionCard>

          <div className="dashboard-grid">
            <SectionCard title="Recent sales" subtitle="Latest vendor orders recorded in the system" action={<Link className="button button-outline button-small" to="/sales">View sales</Link>}>
              {loading ? <LoadingState /> : (
                <DataTable
                  rowKey="sale_id"
                  emptyTitle="No sales recorded"
                  emptyDescription="Your completed vendor sales will appear here."
                  rows={recentSales}
                  onRowClick={setSelectedSale}
                  getRowLabel={(row) => `sale #${row.sale_id}`}
                  columns={[
                    { key: 'sale_id', label: 'Sale', render: (row) => <strong className="table-primary">#{row.sale_id}</strong> },
                    { key: 'vendor_name', label: 'Vendor', render: (row) => <span className="table-primary">{row.vendor_name}</span> },
                    { key: 'sale_date', label: 'Date', render: (row) => formatDate(row.sale_date) },
                    { key: 'payment_status', label: 'Payment', render: (row) => <span className={`badge badge-${row.payment_status === 'PAID' ? 'paid' : row.payment_status === 'UNPAID' ? 'unpaid' : 'partial'}`}>{titleCase(row.payment_status)}</span> },
                    { key: 'total_amount', label: 'Total', render: (row) => <strong className="table-primary">{formatMoney(row.total_amount)}</strong> },
                  ]}
                />
              )}
            </SectionCard>

            <SectionCard title="Quick actions" subtitle="Common tasks for your team">
              <div className="quick-list">
                <QuickLink to="/purchases" icon="purchases" title="Record a purchase" description="Add supplier delivery and update stock" />
                <QuickLink to="/sales" icon="sales" title="Record a sale" description="Fulfil a vendor order with live stock" />
                <QuickLink to="/vendors" icon="vendors" title="Register a vendor" description="Grow your Lesotho district network" />
                <QuickLink to="/stock" icon="stock" title="Review stock levels" description="Find low stock by fruit and package" />
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Fruit prices"
            subtitle="Current selling prices for available fruit types"
            action={<Link className="button button-outline button-small" to="/fruits">View fruit catalogue</Link>}
          >
            {availableFruits.length ? (
              <div className="overview-fruit-price-list">
                {availableFruits.map((fruit) => (
                  <article
                    className="overview-fruit-price-row overview-fruit-price-row-clickable"
                    key={fruit.fruitId}
                    tabIndex={0}
                    aria-label={`View ${fruit.fruitName} price details`}
                    onClick={() => setSelectedFruit(fruit)}
                    onKeyDown={(event) => {
                      if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault()
                        setSelectedFruit(fruit)
                      }
                    }}
                  >
                    <div className="overview-fruit-name">
                      <strong>{fruit.fruitName}</strong>
                      <span>{fruit.description || 'Fresh farm produce'}</span>
                    </div>
                    <div className="overview-fruit-size-prices">
                      {PACKAGING_SIZES.map((size) => (
                        <div className="overview-fruit-size-price" key={size}>
                          <span>{titleCase(size)} box</span>
                          <strong>{formatMoney(fruit.sellingPrices?.[size])}</strong>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="overview-fruit-empty">No available fruit prices. Add or activate fruits in the catalogue.</p>
            )}
          </SectionCard>
        </>
      )}

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
      {selectedFruit && (
        <RecordDetailsModal
          title={selectedFruit.fruitName}
          description={selectedFruit.description || 'Current fruit catalogue details'}
          onClose={() => setSelectedFruit(null)}
          details={[
            { label: 'Availability', value: 'Available' },
            ...PACKAGING_SIZES.map((size) => ({
              label: `${titleCase(size)} box price`,
              value: formatMoney(selectedFruit.sellingPrices?.[size]),
            })),
          ]}
        />
      )}
    </>
  )
}

function QuickLink({ to, icon, title, description }) {
  return (
    <Link className="quick-link" to={to}>
      <span className="quick-link-mark" data-icon={icon}><AppIcon name={icon} /></span>
      <span className="quick-link-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <span className="quick-arrow">›</span>
    </Link>
  )
}




