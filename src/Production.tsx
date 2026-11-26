import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { isActiveOrder, stages, type Order, type Stage } from './domain'
import { Icon, StageTag } from './visuals'

const time = new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' })
const nextAction: Record<Stage, string> = {
  Pendiente: 'Marcar pendiente',
  'En corte': 'Avanzar a corte',
  'En bordado': 'Avanzar a bordado',
  'En armado': 'Avanzar a armado',
  'Listo para entrega': 'Marcar lista para entrega',
  Entregado: 'Marcar como entregada',
}

export function Production({ orders, advance, canSell }: { orders: Order[]; advance: (order: Order) => boolean; canSell: boolean }) {
  const [params, setParams] = useSearchParams()
  const { hash } = useLocation()
  const [view, setView] = useState<'list' | 'board'>('list')
  const [notice, setNotice] = useState('')
  const requestedStage = params.get('etapa')
  const filter = requestedStage === 'activas' ? requestedStage : stages.find((stage) => stage === requestedStage) ?? ''
  const visible = filter === 'activas' ? orders.filter(isActiveOrder) : filter ? orders.filter(({ stage }) => stage === filter) : orders
  const visibleStages = filter === 'activas' ? stages.slice(0, -2) : filter ? [filter] : stages

  function move(order: Order) {
    const next = stages[stages.indexOf(order.stage) + 1]
    if (!next || !advance(order)) return
    setNotice(`${order.id} cambió a ${next.toLowerCase()}.`)
    if (filter) document.getElementById('filter-stage')?.focus()
    else requestAnimationFrame(() => document.getElementById(order.id)?.focus())
  }

  function orderCard(order: Order) {
    const next = stages[stages.indexOf(order.stage) + 1]
    const blocked = next === 'Entregado' && order.balance > 0
    return <article key={order.id} className="card order-card" id={order.id} tabIndex={-1} aria-label={`${order.id} · ${order.stage}`}
      data-selected={hash === `#${order.id}` || undefined}>
      <div className="order-top"><h3>{order.id}</h3><StageTag stage={order.stage} /></div>
      <strong>{order.garment}</strong>
      <p>{order.specs}</p>
      <details><summary>Detalles de la orden</summary><p>{order.customer}</p><p>{order.updatedAt ? `Último cambio: ${time.format(new Date(order.updatedAt))}` : 'Sin fecha de cambio registrada.'}</p></details>
      {order.sale && <Link className="text-link" to={`/fichas/${order.id}`} aria-label={`${order.id}: Abrir ficha técnica`}>Abrir ficha técnica</Link>}
      {blocked && <p className="field-error">Liquida el saldo antes de entregar.</p>}
      {blocked && canSell && order.sale && <Link className="text-link" to={`/pedidos/${order.id}`}>Consultar cuenta del pedido</Link>}
      {next && !blocked && <button className="button button-secondary" type="button" onClick={() => move(order)}
        aria-label={`${order.id}: ${nextAction[next]}`}>{nextAction[next]} <Icon name="arrow" /></button>}
    </article>
  }

  return <>
    <header className="page-heading"><h1 tabIndex={-1}>Órdenes de producción</h1><p>Consulta los pedidos aprobados y registra su avance.</p></header>
    <div className="card board-toolbar">
      <label htmlFor="filter-stage">Filtrar por etapa <select id="filter-stage" value={filter} onChange={(event) => {
        setParams(event.target.value ? { etapa: event.target.value } : {})
        setNotice('')
      }}>
        <option value="">Todas las etapas</option><option value="activas">Órdenes activas</option>
        {stages.map((stage) => <option key={stage}>{stage}</option>)}
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
      {visibleStages.map((stage) => <section key={stage} className="board-column">
        <h2>{stage}</h2>
        {visible.some((order) => order.stage === stage) ? visible.filter((order) => order.stage === stage).map(orderCard) : <p>Sin órdenes.</p>}
      </section>)}
    </div>}
  </>
}
