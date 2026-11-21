import { useState, type Dispatch, type SetStateAction } from 'react'
import { advanceOrder, stages, type Order, type Stage } from './domain'
import { Icon } from './visuals'

const time = new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' })
const nextAction: Record<Stage, string> = {
  Pendiente: 'Marcar pendiente',
  'En corte': 'Avanzar a corte',
  'En bordado': 'Avanzar a bordado',
  'En armado': 'Avanzar a armado',
  'Listo para entrega': 'Marcar lista para entrega',
  Entregado: 'Marcar como entregada',
}

export function Production({ orders, setOrders }: { orders: Order[]; setOrders: Dispatch<SetStateAction<Order[]>> }) {
  const [filter, setFilter] = useState<Stage | ''>('')
  const [view, setView] = useState<'list' | 'board'>('list')
  const [notice, setNotice] = useState('')
  const visible = filter ? orders.filter(({ stage }) => stage === filter) : orders

  function move(order: Order) {
    const updated = advanceOrder(order, new Date().toISOString())
    if (updated === order) return
    setOrders((current) => current.map((item) => item.id === order.id && item.stage === order.stage ? updated : item))
    setNotice(`${order.id} cambió a ${updated.stage.toLowerCase()}.`)
    if (filter) document.getElementById('filter-stage')?.focus()
    else requestAnimationFrame(() => document.getElementById(order.id)?.focus())
  }

  function orderCard(order: Order) {
    const next = stages[stages.indexOf(order.stage) + 1]
    const blocked = next === 'Entregado' && order.balance > 0
    return <article key={order.id} className="card order-card" id={order.id} tabIndex={-1} aria-label={`${order.id} · ${order.stage}`}>
      <div className="order-top"><h3>{order.id}</h3><span className="tag">{order.stage}</span></div>
      <strong>{order.garment}</strong>
      <p>{order.specs}</p>
      <details><summary>Detalles de la orden</summary><p>{order.customer}</p><p>{order.updatedAt ? `Último cambio: ${time.format(new Date(order.updatedAt))}` : 'Aún sin cambios en esta sesión.'}</p></details>
      {blocked && <p className="field-error">Liquida el saldo antes de entregar.</p>}
      {next && !blocked && <button className="button button-secondary" type="button" onClick={() => move(order)}
        aria-label={`${order.id}: ${nextAction[next]}`}>{nextAction[next]} <Icon name="arrow" /></button>}
    </article>
  }

  return <>
    <header className="page-heading"><h1 tabIndex={-1}>Órdenes de producción</h1><p>Consulta pedidos de muestra y registra su avance durante esta sesión.</p></header>
    <div className="card board-toolbar">
      <label htmlFor="filter-stage">Filtrar por etapa <select id="filter-stage" value={filter} onChange={(event) => { setFilter(event.target.value as Stage | ''); setNotice('') }}>
        <option value="">Todas las etapas</option>{stages.map((stage) => <option key={stage}>{stage}</option>)}
      </select></label>
      <div className="preview-actions" role="group" aria-label="Vista de producción">
        <button type="button" className="button button-secondary" aria-pressed={view === 'list'} onClick={() => setView('list')}><Icon name="list" /> Lista</button>
        <button type="button" className="button button-secondary" aria-pressed={view === 'board'} onClick={() => setView('board')}><Icon name="board" /> Tablero</button>
      </div>
    </div>
    <p className="sr-only" role="status">{notice || `${visible.length} órdenes visibles.`}</p>
    {view === 'list' ? <section className="order-list" aria-label="Órdenes filtradas">
      <h2 className="sr-only">Órdenes filtradas</h2>
      {visible.length ? visible.map(orderCard) : <p className="card no-orders">No hay órdenes en esta etapa.</p>}
    </section> : <div className="board">
      {(filter ? [filter] : stages).map((stage) => <section key={stage} className="board-column">
        <h2>{stage}</h2>
        {orders.some((order) => order.stage === stage) ? orders.filter((order) => order.stage === stage).map(orderCard) : <p>Sin órdenes.</p>}
      </section>)}
    </div>}
  </>
}
