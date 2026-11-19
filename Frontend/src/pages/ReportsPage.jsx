import { useCallback, useState } from 'react'
import { api } from '../api/client.js'
import DataTable from '../components/DataTable.jsx'
import { ErrorState, LoadingState } from '../components/Feedback.jsx'
import AppIcon from '../components/AppIcon.jsx'
import PageHeader from '../components/PageHeader.jsx'
import SectionCard from '../components/SectionCard.jsx'
import useAsyncData from '../hooks/useAsyncData.js'
import { formatMoney } from '../utils/format.js'

const FRUIT_CHART_COLORS = ['#397b50', '#78a667', '#c4a452', '#6a9da0', '#78907a']

function monthStart() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
}

function todayString() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState(monthStart)
  const [toDate, setToDate] = useState(todayString)
  const [appliedRange, setAppliedRange] = useState({ fromDate: monthStart(), toDate: todayString() })
  const [rangeError, setRangeError] = useState('')
  const rangeKey = `${appliedRange.fromDate}|${appliedRange.toDate}`
  const load = useCallback(async () => {
    const [topFruits, revenue, topVendor, districts] = await Promise.all([
      api.reports.topSellingFruits(),
      api.reports.salesRevenue(appliedRange.fromDate, appliedRange.toDate),
      api.reports.topVendor(),
      api.reports.salesByDistrict(),
    ])
    return { topFruits, revenue, topVendor, districts }
  }, [appliedRange])
  const { data, error, loading, refresh } = useAsyncData(load, rangeKey)
  const topFruitMax = Math.max(1, ...(data?.topFruits ?? []).map((fruit) => Number(fruit.boxes_sold) || 0))
  const districtRevenueMax = Math.max(
    1,
    ...(data?.districts ?? []).map((district) => Number(district.sales_revenue) || 0),
  )

  function applyRange(event) {
    event.preventDefault()
    if (fromDate > toDate) {
      setRangeError('The start date must be on or before the end date.')
      return
    }

    setRangeError('')
    if (fromDate === appliedRange.fromDate && toDate === appliedRange.toDate) {
      refresh()
    } else {
      setAppliedRange({ fromDate, toDate })
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Business intelligence"
        title="Distribution reports"
        description="Monitor sales performance and compare vendor activity across Lesotho's ten districts."
        visual="reports"
        icon="reports"
        visualLabel="Market insights"
        action={
          <form className="toolbar report-date-range" onSubmit={applyRange}>
            <label className="sr-only" htmlFor="report-from">From date</label>
            <input id="report-from" className="search-input" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} required />
            <label className="sr-only" htmlFor="report-to">To date</label>
            <input id="report-to" className="search-input" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} required />
            <button className="button button-primary" disabled={loading} type="submit">
              {loading ? 'Running report…' : 'Run report'}
            </button>
          </form>
        }
      />
      {rangeError && <p className="report-range-error" role="alert">{rangeError}</p>}
      {error && <ErrorState error={error} onRetry={refresh} />}
      {loading && data && <p className="report-run-status" role="status">Updating report data…</p>}
      {loading && !data ? <LoadingState label="Preparing reports…" /> : data && (
        <>
          <div className="stat-grid report-stat-grid">
            <StatCard label="Revenue in date range" value={formatMoney(data.revenue?.sales_revenue)} hint={`${appliedRange.fromDate} to ${appliedRange.toDate}`} icon="payments" />
            <StatCard label="Top vendor" value={data.topVendor?.vendor_name ?? 'No sales'} hint={data.topVendor ? `${data.topVendor.boxes_purchased} boxes purchased` : 'Record sales to populate'} icon="vendors" />
            <StatCard label="Top-selling fruit" value={data.topFruits?.[0]?.fruit_name ?? 'No sales'} hint={data.topFruits?.[0] ? `${data.topFruits[0].boxes_sold} boxes sold` : 'Record sales to populate'} icon="fruits" />
            <StatCard label="Districts with vendors" value={data.districts?.filter((district) => Number(district.registered_vendors) > 0).length ?? 0} hint="Of 10 districts in Lesotho" icon="overview" />
          </div>

          <div className="report-card-grid">
            <SectionCard title="Five most frequently sold fruits" subtitle="Ranked by number of boxes">
              <FruitSalesPieChart fruits={data.topFruits ?? []} />
              <DataTable
                rowKey="fruit_id"
                rows={data.topFruits ?? []}
                emptyTitle="No sales data yet"
                emptyDescription="Fruit rankings will appear after the first sale."
                columns={[
                  { key: 'fruit_name', label: 'Fruit', render: (row) => <strong className="table-primary">{row.fruit_name}</strong> },
                  {
                    key: 'boxes_sold',
                    label: 'Boxes sold',
                    render: (row) => {
                      const amount = Number(row.boxes_sold) || 0
                      const width = `${(amount / topFruitMax) * 100}%`
                      return (
                        <div className="report-bar-cell">
                          <span className="report-bar"><span style={{ width }} /></span>
                          <strong className="table-primary">{amount}</strong>
                        </div>
                      )
                    },
                  },
                ]}
              />
            </SectionCard>

            <SectionCard title="Top vendor by boxes" subtitle="All-time quantity purchased">
              {data.topVendor ? (
                <div className="report-feature">
                  <span className="report-feature-mark">#1</span>
                  <div><strong>{data.topVendor.vendor_name}</strong><span>{data.topVendor.boxes_purchased} boxes purchased</span></div>
                </div>
              ) : <p className="report-empty-copy">No vendor sales to report yet.</p>}
            </SectionCard>
          </div>

          <div className="section-spacer" />
          <SectionCard title="Sales activity by Lesotho district" subtitle="Coverage, order volume, boxes, and sales revenue for all ten districts">
            <div className="district-revenue-chart" aria-label="Revenue by district">
              {(data.districts ?? []).map((district) => {
                const revenue = Number(district.sales_revenue) || 0
                const width = `${(revenue / districtRevenueMax) * 100}%`
                return (
                  <div className="district-revenue-row" key={district.district}>
                    <span className="district-revenue-name">{district.district}</span>
                    <span className="district-revenue-track" role="progressbar" aria-label={`${district.district} revenue`} aria-valuemin="0" aria-valuemax={districtRevenueMax} aria-valuenow={revenue}>
                      <span style={{ width }} />
                    </span>
                    <strong>{formatMoney(revenue)}</strong>
                  </div>
                )
              })}
            </div>
            <DataTable
              rowKey="district"
              rows={data.districts ?? []}
              emptyTitle="No district report available"
              emptyDescription="District report data will appear when the API is connected."
              columns={[
                { key: 'district', label: 'District', render: (row) => <span className="district-tag">{row.district}</span> },
                { key: 'registered_vendors', label: 'Vendors', render: (row) => row.registered_vendors },
                { key: 'sales_count', label: 'Sales', render: (row) => row.sales_count },
                { key: 'boxes_sold', label: 'Boxes sold', render: (row) => row.boxes_sold },
                { key: 'sales_revenue', label: 'Revenue', render: (row) => <strong className="table-primary">{formatMoney(row.sales_revenue)}</strong> },
              ]}
            />
          </SectionCard>
        </>
      )}
    </>
  )
}

function FruitSalesPieChart({ fruits }) {
  const sales = fruits
    .map((fruit, index) => ({
      ...fruit,
      boxesSold: Number(fruit.boxes_sold) || 0,
      color: FRUIT_CHART_COLORS[index % FRUIT_CHART_COLORS.length],
    }))
    .filter((fruit) => fruit.boxesSold > 0)
  const total = sales.reduce((sum, fruit) => sum + fruit.boxesSold, 0)

  if (!total) return null

  let endAngle = 0
  const segments = sales.map((fruit) => {
    const startAngle = endAngle
    endAngle += (fruit.boxesSold / total) * 360
    return `${fruit.color} ${startAngle}deg ${endAngle}deg`
  })

  return (
    <div className="report-fruit-visualization">
      <div
        className="report-fruit-pie"
        role="img"
        aria-label={`Pie chart of ${total} boxes sold across the top fruits`}
        style={{ background: `conic-gradient(from -90deg, ${segments.join(', ')})` }}
      />
      <div className="report-fruit-legend">
        <div className="report-fruit-legend-heading">
          <span>Top-five sales mix</span>
          <strong>{total.toLocaleString()} boxes</strong>
        </div>
        <ul>
          {sales.map((fruit) => (
            <li key={fruit.fruit_id}>
              <span className="report-fruit-swatch" style={{ backgroundColor: fruit.color }} />
              <span className="report-fruit-name">{fruit.fruit_name}</span>
              <strong>{fruit.boxesSold} · {Math.round((fruit.boxesSold / total) * 100)}%</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StatCard({ label, value, hint, icon }) {
  return (
    <article className="stat-card">
      <div><span className="stat-label">{label}</span><strong className="stat-value stat-value-report">{value}</strong><span className="stat-hint">{hint}</span></div>
      <span className="stat-mark" data-icon={icon}><AppIcon name={icon} /></span>
    </article>
  )
}

