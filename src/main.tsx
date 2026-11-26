import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Configurator } from './Configurator'
import { Customers } from './Customers'
import { Dashboard } from './Dashboard'
import { Inventory } from './Inventory'
import { Production } from './Production'
import { SaleDetail, Sales, TechnicalSheet } from './Sales'
import { advanceOrder, createOrder, recordPayment, type Customer, type Draft, type Order } from './domain'
import { Icon, type IconName } from './visuals'
import { loadWorkshop, saveWorkshop, type Workshop } from './workshopStorage'
import './styles.css'

const roles = ['Administración', 'Mostrador', 'Producción'] as const
type Role = (typeof roles)[number]

const sections: { path: string; label: string; shortLabel: string; icon: IconName; roles: readonly Role[] }[] = [
  { path: '/', label: 'Panel principal', shortLabel: 'Inicio', icon: 'home', roles },
  { path: '/pedidos', label: 'Pedidos y ventas', shortLabel: 'Pedidos', icon: 'orders', roles: ['Administración', 'Mostrador'] },
  { path: '/produccion', label: 'Producción', shortLabel: 'Producción', icon: 'board', roles: ['Administración', 'Producción'] },
  { path: '/inventario', label: 'Inventario y catálogos', shortLabel: 'Inventario', icon: 'box', roles: ['Administración', 'Producción'] },
  { path: '/clientes', label: 'Clientes', shortLabel: 'Clientes', icon: 'people', roles: ['Administración', 'Mostrador'] },
]

function Module({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
  return <>
    <section className="card empty" aria-labelledby="empty-title">
      <span className="icon-tile"><Icon name="info" /></span>
      <h1 id="empty-title" tabIndex={-1}>{title}</h1>
      <p>{detail}</p>
      {children}
    </section>
  </>
}

function OrderPage({ orders, pay, sheet, canSell }: {
  orders: Order[]; pay: (id: string, amount: string) => boolean; sheet?: boolean; canSell: boolean
}) {
  const { id } = useParams()
  const order = orders.find((item) => item.id === id)
  if (!order || (sheet && !order.sale)) {
    return <Module title={sheet ? 'Ficha no disponible' : 'Pedido no disponible'} detail="Revisa el folio y vuelve a la lista.">
      <Link className="button" to={canSell ? '/pedidos' : '/produccion'}>Volver a la lista</Link>
    </Module>
  }
  if (sheet) {
    return <TechnicalSheet order={order} backTo={canSell ? `/pedidos/${order.id}` : '/produccion'} />
  }
  return <SaleDetail key={order.id} order={order} pay={(amount) => pay(order.id, amount)} />
}

function App() {
  const [role, setRole] = useState<Role>('Administración')
  const [workshop, setWorkshop] = useState(loadWorkshop)
  const current = useRef(workshop)
  const [storageUnavailable, setStorageUnavailable] = useState(false)
  const { orders, customers } = workshop
  const location = useLocation()
  const navigate = useNavigate()
  const previousLocation = useRef({ pathname: location.pathname, hash: '' })
  const main = useRef<HTMLElement>(null)

  function save(state: Workshop) {
    current.current = state
    setWorkshop(state)
    setStorageUnavailable(!saveWorkshop(state))
  }

  function addCustomer(data: Omit<Customer, 'id'>) {
    const state = current.current
    if (data.phone && state.customers.some((customer) => customer.phone === data.phone)) return undefined
    const customer = { ...data, id: `cliente-${state.customers.length + 1}` }
    save({ ...state, customers: [...state.customers, customer] })
    return customer
  }

  function confirm(customerId: string, draft: Draft, price: string, deposit: string) {
    const state = current.current
    const customer = state.customers.find(({ id }) => id === customerId)
    if (!customer) return false
    const order = createOrder(state.orders, customer, draft, price, deposit, new Date().toISOString())
    if (!order) return false
    save({ ...state, orders: [order, ...state.orders] })
    navigate(`/pedidos/${order.id}`, { replace: true })
    return true
  }

  function changeOrder(id: string, update: (order: Order) => Order) {
    const state = current.current
    const order = state.orders.find((item) => item.id === id)
    if (!order) return false
    const updated = update(order)
    if (updated === order) return false
    save({ ...state, orders: state.orders.map((item) => item.id === id ? updated : item) })
    return true
  }

  function pay(id: string, amount: string) {
    return changeOrder(id, (order) => recordPayment(order, amount, new Date().toISOString()))
  }

  useEffect(() => {
    const heading = main.current?.querySelector('h1')
    document.title = heading ? `${heading.textContent} | Xokbil Studio` : 'Xokbil Studio'
    const pathChanged = previousLocation.current.pathname !== location.pathname
    const hashChanged = previousLocation.current.hash !== location.hash
    previousLocation.current = { pathname: location.pathname, hash: location.hash }
    if (location.hash && (pathChanged || hashChanged)) {
      const target = document.getElementById(location.hash.slice(1))
      if (target && main.current?.contains(target)) {
        target.focus({ preventScroll: true })
        target.scrollIntoView({ block: 'nearest' })
        return
      }
    }
    if (pathChanged) {
      heading?.focus({ preventScroll: true })
      window.scrollTo(0, 0)
    }
  }, [location.pathname, location.hash, role])

  const selected = sections.filter((section) => section.roles.includes(role))
  const allowed = (path: string) => selected.some((section) => section.path === path)
  const canSell = allowed('/pedidos')
  const customerParam = new URLSearchParams(location.search).get('cliente')
  const initialCustomer = customers.find(({ id }) => id === customerParam)?.id ?? ''
  const blocked = <Module title="Sección de otro rol" detail="Cambia el rol de demostración o vuelve al panel."><Link className="button" to="/">Volver al panel</Link></Module>

  return <div className="shell">
    <a className="skip-link" href="#contenido" onClick={(event) => { event.preventDefault(); main.current?.focus() }}>Saltar al contenido</a>
    <header className="app-header">
      <Link to="/" className="brand"><span className="brand-mark"><Icon name="sew" /></span>
        <span className="brand-name">Xokbil Studio<span className="brand-status">Demo local</span></span>
      </Link>
      <div className="topbar">
        <span className="workshop-location"><Icon name="pin" /> Tekit, Yucatán</span>
        <div className="session-controls">
          <span className="demo-status"><span className="status-dot" />Demo local</span>
          <label className="role-control"><span className="sr-only">Rol de demostración</span>
            <Icon name="people" />
            <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
              {roles.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>
    </header>
    <nav className="sidebar" aria-label="Navegación principal">
      {selected.map(({ path, label, shortLabel, icon }) => <NavLink end={path === '/'} key={path} to={path}>
        <Icon name={icon} /><span className="nav-label">{label}</span><span className="nav-label-short">{shortLabel}</span>
      </NavLink>)}
    </nav>
    <div className="workspace">
      <main id="contenido" tabIndex={-1} ref={main}>
        {storageUnavailable && <p role="status" className="field-error no-print">El navegador no permite guardar la sesión. Conserva esta pestaña abierta sin recargar.</p>}
        <Routes>
          <Route path="/" element={<Dashboard orders={orders} canSell={canSell} canProduce={allowed('/produccion')} />} />
          <Route path="/pedidos" element={canSell ? <Sales orders={orders} /> : blocked} />
          <Route path="/pedidos/configurador" element={canSell ? <Configurator key={initialCustomer} customers={customers} initialCustomer={initialCustomer} onConfirm={confirm} /> : blocked} />
          <Route path="/pedidos/:id" element={canSell ? <OrderPage orders={orders} pay={pay} canSell /> : blocked} />
          <Route path="/fichas/:id" element={<OrderPage orders={orders} pay={pay} canSell={canSell} sheet />} />
          <Route path="/produccion" element={allowed('/produccion') ? <Production orders={orders} advance={(original) =>
            changeOrder(original.id, (order) => order.stage === original.stage ? advanceOrder(order, new Date().toISOString()) : order)
          } canSell={canSell} /> : blocked} />
          <Route path="/inventario" element={allowed('/inventario') ? <Inventory /> : blocked} />
          <Route path="/clientes" element={allowed('/clientes') ? <Customers customers={customers} orders={orders} add={addCustomer} /> : blocked} />
          <Route path="*" element={<Module title="Página fuera del taller" detail="La dirección solicitada no corresponde a una sección disponible."><Link className="button" to="/">Volver al panel</Link></Module>} />
        </Routes>
      </main>
    </div>
  </div>
}

createRoot(document.getElementById('root')!).render(<StrictMode><HashRouter><App /></HashRouter></StrictMode>)
