import { Link } from 'react-router-dom'
import { stageCounts, type Order } from './domain'
import { money } from './Sales'
import { Icon, StageTag, type IconName } from './visuals'

const date = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })

function Metric({ icon, label, value, to }: { icon: IconName; label: string; value: string | number; to?: string }) {
  const content = <>
    <span className="icon-tile"><Icon name={icon} /></span>
    <div className="metric-value"><h2>{label}</h2><strong>{value}</strong></div>
    {to && <Icon name="chevron" />}
  </>
  return to
    ? <Link className="card metric" to={to}>{content}</Link>
    : <article className="card metric">{content}</article>
}

export function Dashboard({ orders, canSell, canProduce }: {
  orders: Order[]; canSell: boolean; canProduce: boolean
}) {
  const totals = stageCounts(orders)
  const recent = (canProduce ? orders : orders.filter(({ sale }) => sale)).slice()
    .sort((first, second) => {
      const firstDate = first.updatedAt ?? first.sale?.approvedAt ?? ''
      const secondDate = second.updatedAt ?? second.sale?.approvedAt ?? ''
      return secondDate.localeCompare(firstDate)
    })
    .slice(0, 4)
  const recentPath = canProduce ? '/produccion' : '/pedidos'

  return <>
    <header className="page-heading dashboard-heading">
      <div><h1 tabIndex={-1}>Panel principal</h1><p>Consulta los pedidos y el avance de tu taller.</p></div>
      <span className="dashboard-date"><Icon name="calendar" />{date.format(new Date())}</span>
    </header>
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-photo" aria-hidden="true" />
      <div className="hero-content">
        <h2 id="hero-title">Del pedido a<br className="hero-break" /> la entrega</h2>
        <p>{canSell ? 'Configura prendas, registra pagos y revisa el estado de cada pedido.' : 'Revisa las órdenes y actualiza su avance desde el corte hasta la entrega.'}</p>
        {canSell
          ? <Link className="button button-light" to="/clientes"><Icon name="plus" />Nuevo pedido</Link>
          : <Link className="button button-light" to="/produccion"><Icon name="board" />Abrir producción</Link>}
      </div>
    </section>
    <div className="metric-grid" aria-label="Resumen del taller">
      <Metric icon="board" label="Órdenes activas" value={totals.active} to={canProduce ? '/produccion?etapa=activas' : undefined} />
      <Metric icon="check" label="Listas para entrega" value={totals.ready} to={canProduce ? '/produccion?etapa=Listo+para+entrega' : undefined} />
      {canSell && <Metric icon="wallet" label="Saldo por cobrar"
        value={money.format(orders.reduce((sum, order) => sum + Math.round(order.balance * 100), 0) / 100)} to="/pedidos" />}
    </div>
    <section className="card recent" aria-labelledby="recent-title">
      <div className="section-heading">
        <h2 id="recent-title">{canProduce ? 'Producción del taller' : 'Pedidos recientes'}</h2>
        <Link className="button button-secondary" to={recentPath}>{canProduce ? 'Ver órdenes' : 'Ver pedidos'}</Link>
      </div>
      {recent.length
        ? <ul className="recent-list">
          {recent.map((order) => <li key={order.id}>
            <Link className="recent-row" to={canProduce ? `/produccion#${order.id}` : `/pedidos/${order.id}`}>
              <span className="icon-tile"><Icon name="orders" /></span>
              <span className="recent-identity"><strong>{order.id}</strong><span>{order.garment}</span></span>
              <StageTag stage={order.stage} />
              <Icon name="chevron" />
            </Link>
          </li>)}
        </ul>
        : <p className="hint">Aún no hay pedidos que mostrar.</p>}
    </section>
  </>
}
