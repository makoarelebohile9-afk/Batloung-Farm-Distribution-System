import { useCallback, useState } from 'react'
import { api } from '../api/client.js'
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback.jsx'
import PageHeader from '../components/PageHeader.jsx'
import RecordDetailsModal from '../components/RecordDetailsModal.jsx'
import SectionCard from '../components/SectionCard.jsx'
import { PACKAGING_SIZES } from '../constants.js'
import useAsyncData from '../hooks/useAsyncData.js'
import { titleCase } from '../utils/format.js'

export default function StockPage() {
  const [threshold, setThreshold] = useState('10')
  const [appliedThreshold, setAppliedThreshold] = useState(10)
  const load = useCallback(
    () => Promise.all([api.stock.list(), api.stock.low(appliedThreshold)]),
    [appliedThreshold],
  )
  const { data = [[], []], error, loading, refresh } = useAsyncData(
    load,
    String(appliedThreshold),
  )
  const [stock, lowStock] = data
  const [selectedStock, setSelectedStock] = useState(null)
  const fruitGroups = groupInventory(stock)
  const totalBoxes = stock.reduce((total, row) => total + Number(row.available_quantity), 0)

  function applyThreshold(event) {
    event.preventDefault()
    const parsed = Number(threshold)
    if (Number.isSafeInteger(parsed) && parsed >= 0) {
      setAppliedThreshold(parsed)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Live inventory"
        title="Stock by fruit & box size"
        description="Every balance is tracked separately for small, medium, and large boxes."
        visual="stock"
        icon="stock"
        visualLabel="Ready for dispatch"
        action={<button className="button button-outline" onClick={refresh} type="button">Refresh stock</button>}
      />
      {error && <ErrorState error={error} onRetry={refresh} />}
      <div className="summary-strip">
        <span className="summary-chip">Total boxes available <strong>{totalBoxes.toLocaleString()}</strong></span>
        <span className="summary-chip">Low-stock combinations <strong>{lowStock.length}</strong></span>
        <span className="summary-chip">Warning threshold <strong>{appliedThreshold}</strong> boxes</span>
      </div>

      <div className="list-stack">
        <SectionCard title="Current stock" subtitle="Live inventory grouped by fruit and package size">
          {loading && !stock.length ? <LoadingState /> : (
            fruitGroups.length ? (
              <div className="inventory-fruit-grid">
                {fruitGroups.map((fruit) => {
                  const fruitTotal = PACKAGING_SIZES.reduce(
                    (total, size) => total + (fruit.quantities[size] ?? 0),
                    0,
                  )
                  return (
                    <article className="inventory-fruit-card" key={fruit.fruitId}>
                      <header className="inventory-fruit-header">
                        <div>
                          <h3>{fruit.fruitName}</h3>
                          <span>Available inventory</span>
                        </div>
                        <strong className="inventory-fruit-total">{fruitTotal.toLocaleString()} <span>boxes</span></strong>
                      </header>
                      <div className="inventory-size-grid">
                        {PACKAGING_SIZES.map((size) => {
                          const quantity = fruit.quantities[size] ?? 0
                          const isLow = quantity <= appliedThreshold
                          const percentage = Math.min(100, quantity * 5)
                          return (
                            <button
                              className={`inventory-size-card inventory-size-card-clickable ${isLow ? 'is-low' : ''}`}
                              key={size}
                              type="button"
                              aria-label={`View ${fruit.fruitName} ${titleCase(size)} stock details`}
                              onClick={() => setSelectedStock({
                                fruitName: fruit.fruitName,
                                packagingSize: size,
                                availableQuantity: quantity,
                              })}
                            >
                              <div className="inventory-size-heading">
                                <span>{titleCase(size)}</span>
                                <span className={`inventory-status ${isLow ? 'is-low' : 'is-good'}`}>
                                  {isLow ? 'Reorder soon' : 'In stock'}
                                </span>
                              </div>
                              <strong className="inventory-size-quantity">{quantity.toLocaleString()}</strong>
                              <span className="inventory-size-unit">boxes</span>
                              <span className="inventory-progress" role="progressbar" aria-label={`${fruit.fruitName} ${titleCase(size)} stock`} aria-valuemin="0" aria-valuemax="20" aria-valuenow={Math.min(quantity, 20)}>
                                <span style={{ width: `${percentage}%` }} />
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                title="No stock records"
                description="Available fruits will appear here with all three box sizes."
              />
            )
          )}
        </SectionCard>

        <SectionCard
          title="Low-stock watchlist"
          subtitle="Fruit-size combinations at or below your reorder threshold"
          action={
            <form className="toolbar" onSubmit={applyThreshold}>
              <label className="sr-only" htmlFor="stock-threshold">Low-stock threshold</label>
              <input
                id="stock-threshold"
                aria-label="Low-stock threshold"
                className="search-input"
                type="number"
                min="0"
                step="1"
                value={threshold}
                onChange={(event) => setThreshold(event.target.value)}
              />
              <button className="button button-outline button-small" type="submit">Apply</button>
            </form>
          }
        >
          {loading && !stock.length ? <LoadingState /> : (
            lowStock.length ? (
              <div className="low-stock-list">
                {lowStock.map((row) => (
                  <button
                    className="low-stock-item low-stock-item-clickable"
                    key={`${row.fruit_id}-${row.packaging_size}`}
                    type="button"
                    aria-label={`View ${row.fruit_name} ${titleCase(row.packaging_size)} low stock details`}
                    onClick={() => setSelectedStock({
                      fruitName: row.fruit_name,
                      packagingSize: row.packaging_size,
                      availableQuantity: Number(row.available_quantity),
                    })}
                  >
                    <span className="low-stock-indicator" aria-hidden="true">!</span>
                    <div className="low-stock-copy">
                      <strong>{row.fruit_name}</strong>
                      <span>{titleCase(row.packaging_size)} box · Reorder threshold {appliedThreshold}</span>
                    </div>
                    <div className="low-stock-remaining">
                      <strong>{Number(row.available_quantity).toLocaleString()}</strong>
                      <span>boxes left</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Stock is above the threshold"
                description="No reorder action is needed right now."
              />
            )
          )}
        </SectionCard>
      </div>

      {selectedStock && (
        <RecordDetailsModal
          title={`${selectedStock.fruitName} · ${titleCase(selectedStock.packagingSize)} box`}
          description="Current inventory details"
          onClose={() => setSelectedStock(null)}
          details={[
            { label: 'Fruit', value: selectedStock.fruitName },
            { label: 'Package size', value: titleCase(selectedStock.packagingSize) },
            { label: 'Available quantity', value: `${selectedStock.availableQuantity.toLocaleString()} boxes` },
            { label: 'Reorder threshold', value: `${appliedThreshold} boxes` },
            { label: 'Stock status', value: selectedStock.availableQuantity <= appliedThreshold ? 'Reorder soon' : 'In stock' },
          ]}
        />
      )}
    </>
  )
}

function groupInventory(rows) {
  const groups = new Map()
  for (const row of rows) {
    const fruitId = String(row.fruit_id)
    const fruit = groups.get(fruitId) ?? {
      fruitId,
      fruitName: row.fruit_name,
      quantities: {},
    }
    fruit.quantities[String(row.packaging_size).toUpperCase()] = Number(row.available_quantity)
    groups.set(fruitId, fruit)
  }
  return Array.from(groups.values())
}

