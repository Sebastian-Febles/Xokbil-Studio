import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { matchesSearch } from './Customers'
import { demoCatalog, type Order } from './domain'

export const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const date = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

export function Sales({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState('')
  const visible = orders.filter((order) => matchesSearch(`${order.id} ${order.customer}`, query))
  return <>
    <header className="page-heading"><h1 tabIndex={-1}>Pedidos y ventas</h1><p>Consulta anticipos, saldos y el estado de cada pedido.</p></header>
    <section className="card workflow-card" aria-labelledby="sales-title">
      <div className="section-heading"><h2 id="sales-title">Pedidos registrados</h2><Link className="button" to="/clientes">Nuevo pedido</Link></div>
      <div className="field"><label htmlFor="sale-search">Buscar por folio o cliente</label>
        <input id="sale-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      {visible.length ? <ul className="record-list">{visible.map((order) => <li key={order.id}>
        <Link className="record-link" to={`/pedidos/${order.id}`}>
          <span><strong>{order.id}</strong> · {order.customer}</span>
          <span className="tag">{order.balance ? `Saldo ${money.format(order.balance)}` : 'Pagado'}</span>
        </Link>
      </li>)}</ul> : <p role="status">No se encontraron pedidos.</p>}
    </section>
  </>
}

export function SaleDetail({ order, pay }: { order: Order; pay: (amount: string) => boolean }) {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState<{ error: boolean; text: string }>()
  const submitted = useRef(false)
  const { sale } = order
  const canPay = Boolean(sale && order.balance > 0 && order.stage !== 'Entregado')
  const paid = sale?.payments.reduce((total, payment) => total + payment.cents, 0)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitted.current) return
    if (pay(amount)) {
      submitted.current = true
      setAmount('')
      setMessage({ error: false, text: 'Pago registrado.' })
    } else {
      setMessage({ error: true, text: 'Ingresa un abono mayor que cero y que no supere el saldo. Usa hasta dos decimales.' })
      event.currentTarget.querySelector('input')?.focus()
    }
  }

  return <>
    <header className="page-heading"><h1 tabIndex={-1}>Pedido {order.id}</h1><p>{order.customer} · {order.stage}</p></header>
    <div className="detail-grid">
      <section className="card workflow-card" aria-labelledby="account-title">
        <h2 id="account-title">Cuenta del pedido</h2>
        <dl className="specs">
          {sale && <><dt>Total aprobado</dt><dd>{money.format(sale.totalCents / 100)}</dd><dt>Pagado</dt><dd>{money.format((paid ?? 0) / 100)}</dd></>}
          <dt>Saldo pendiente</dt><dd>{money.format(order.balance)}</dd>
        </dl>
        {canPay && <form className="workflow-card inset" noValidate onSubmit={submit}>
          <div className="field"><label htmlFor="payment-amount">Importe del abono en MXN</label><input id="payment-amount" inputMode="decimal" value={amount}
            aria-invalid={message?.error || undefined} aria-describedby={message?.error ? 'payment-error' : undefined}
            onChange={(event) => { submitted.current = false; setAmount(event.target.value); setMessage(undefined) }} /></div>
          {message?.error && <p id="payment-error" className="field-error" role="alert">{message.text}</p>}
          <div className="preview-actions">
            <button className="button button-secondary" type="button" onClick={() => { submitted.current = false; setAmount(order.balance.toFixed(2)); setMessage(undefined) }}>Usar saldo completo</button>
            <button className="button" type="submit">Registrar abono</button>
          </div>
        </form>}
        <p role="status">{message && !message.error ? message.text : ''}</p>
        {sale && <><h3>Historial de pagos</h3>
          {sale.payments.length ? <ul className="record-list">{sale.payments.map((payment, index) =>
            <li className="payment-entry" key={index}><span>{payment.kind} · {date.format(new Date(payment.at))}</span><strong>{money.format(payment.cents / 100)}</strong></li>
          )}</ul> : <p>Aún no hay pagos registrados.</p>}
        </>}
      </section>
      <section className="card workflow-card" aria-labelledby="sale-config">
        <h2 id="sale-config">Prenda aprobada</h2><strong>{order.garment}</strong><p>{order.specs}</p>
        {sale && <Link className="button" to={`/fichas/${order.id}`}>Abrir ficha técnica</Link>}
        <Link className="button button-secondary" to="/pedidos">Volver a pedidos</Link>
      </section>
    </div>
  </>
}

export function TechnicalSheet({ order, backTo }: { order: Order; backTo: string }) {
  const sale = order.sale
  if (!sale) return null
  const { draft } = sale
  const fabric = demoCatalog.fabrics.find(({ id }) => id === draft.fabricId)?.name
  const design = demoCatalog.embroideries.find(({ id }) => id === draft.designId)?.name
  const thread = demoCatalog.threads.find(({ id }) => id === draft.threadId)?.name
  return <article className="technical-sheet">
    <header className="page-heading"><h1 tabIndex={-1}>Ficha técnica de producción</h1><p>Especificación aprobada para corte y bordado.</p></header>
    <div className="sheet-banner"><div><strong>{order.id} · {order.garment}</strong><p>{order.customer} · {date.format(new Date(sale.approvedAt))}</p></div><span className="tag">Aprobada · v1</span></div>
    <div className="detail-grid">
      <section className="card workflow-card" aria-labelledby="cut-sheet"><h2 id="cut-sheet">Orden de corte</h2>
        <dl className="specs">
          <dt>Tela</dt><dd>{fabric}</dd>
          <dt>Talla y cantidad</dt><dd>{draft.size} · {draft.quantity} pieza(s)</dd>
          <dt>Piezas</dt><dd>{draft.collar} · Manga {draft.sleeve.toLowerCase()} · {draft.pockets}</dd>
          <dt>Alforzas por lado</dt><dd>Delantero {draft.frontPleats} · Espalda {draft.backPleats}</dd>
          {(Number(draft.frontPleats) > 0 || Number(draft.backPleats) > 0) &&
            <><dt>Ancho y separación</dt><dd>{draft.pleatWidth} cm · {draft.pleatGap} cm</dd></>}
        </dl>
        <p className="hint">Metraje pendiente de validar con patronaje.</p>
      </section>
      <section className="card workflow-card" aria-labelledby="embroidery-sheet"><h2 id="embroidery-sheet">Orden de bordado</h2>
        {design ? <><dl className="specs">
          <dt>Diseño</dt><dd>{design}</dd>
          <dt>Ubicación</dt><dd>{draft.placement}</dd>
          <dt>Hilo</dt><dd>{thread}</dd>
        </dl><p className="hint">Archivo DST y código de hilo pendientes de incorporar.</p></> : <p>Prenda sin bordado.</p>}
      </section>
    </div>
    <div className="form-actions no-print">
      <Link className="button button-secondary" to={backTo}>Volver al pedido o tablero</Link>
      <button className="button" type="button" onClick={() => window.print()}>Imprimir o guardar PDF</button>
    </div>
  </article>
}
