import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { sizes, type Customer, type Order } from './domain'

export function matchesSearch(value: string, query: string) {
  const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es-MX')
  return normalize(value).includes(normalize(query.trim()))
}

export function Customers({ customers, orders, add }: {
  customers: Customer[]; orders: Order[]; add: (customer: Omit<Customer, 'id'>) => Customer | undefined
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(customers[0]?.id)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const digits = query.replace(/\D/g, '')
  const phoneSearch = digits && /^[\d\s()-]+$/.test(query)
  const visible = customers.filter((customer) =>
    matchesSearch(customer.name, query) || (phoneSearch && customer.phone.includes(digits)))
  const current = visible.find(({ id }) => id === selected) ?? visible[0]
  const history = current ? orders.filter(({ customerId }) => customerId === current.id) : []

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const inputPhone = String(data.get('phone') ?? '').trim()
    const phone = inputPhone.replace(/\D/g, '')
    const usualSize = String(data.get('size') ?? '')
    if (!name || (inputPhone && (!/^[\d\s()-]+$/.test(inputPhone) || phone.length !== 10))) {
      setError('Escribe un nombre y, si agregas teléfono, usa 10 dígitos.')
      return
    }
    const customer = add({ name, phone, usualSize })
    if (!customer) {
      setError('Ya existe un cliente con ese teléfono.')
      return
    }
    setSelected(customer.id)
    setQuery('')
    setError('')
    setShowForm(false)
  }

  return <>
    <header className="page-heading"><h1 tabIndex={-1}>Clientes del taller</h1><p>Busca un cliente, consulta sus pedidos o configura una prenda.</p></header>
    <div className="detail-grid">
      <section className="card workflow-card" aria-labelledby="client-list">
        <div className="section-heading"><h2 id="client-list">Directorio</h2>
          <button type="button" className="button button-secondary" aria-expanded={showForm} onClick={() => { setShowForm(!showForm); setError('') }}>
            {showForm ? 'Cerrar registro' : 'Nuevo cliente'}
          </button>
        </div>
        {showForm && <form className="workflow-card inset" onSubmit={save}>
          <div className="field"><label htmlFor="new-name">Nombre</label><input id="new-name" name="name" maxLength={100} required /></div>
          <div className="field"><label htmlFor="new-phone">Teléfono (opcional)</label><input id="new-phone" name="phone" type="tel" maxLength={20} /></div>
          <div className="field"><label htmlFor="new-size">Talla habitual (opcional)</label>
            <select id="new-size" name="size"><option value="">Sin talla</option>{sizes.map((size) => <option key={size}>{size}</option>)}</select>
          </div>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button className="button" type="submit">Guardar cliente</button>
        </form>}
        <div className="field"><label htmlFor="customer-search">Buscar por nombre o teléfono</label>
          <input id="customer-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        {visible.length ? <ul className="record-list">
          {visible.map((customer) => <li key={customer.id}>
            <button className="client-choice" type="button" aria-pressed={current?.id === customer.id} onClick={() => setSelected(customer.id)}>
              <strong>{customer.name}</strong>{customer.phone && <span>{customer.phone}</span>}
            </button>
          </li>)}
        </ul> : <p role="status">No se encontraron clientes.</p>}
      </section>
      {current && <section className="card workflow-card" aria-labelledby="client-detail">
        <h2 id="client-detail">{current.name}</h2>
        {current.usualSize && <p>Talla habitual {current.usualSize}</p>}
        <h3>Historial de pedidos</h3>
        {history.length ? <ul className="record-list">
          {history.map((order) => <li key={order.id}><Link className="record-link" to={`/pedidos/${order.id}`}>
            <strong>{order.id}</strong><span>{order.stage}</span>
          </Link></li>)}
        </ul> : <p>Este cliente aún no tiene pedidos.</p>}
        <Link className="button" to={`/pedidos/configurador?cliente=${encodeURIComponent(current.id)}`}>Configurar pedido</Link>
      </section>}
    </div>
  </>
}
