import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Configurator } from './Configurator'
import { Production } from './Production'
import { demoOrders, stageCounts, type Order } from './domain'
import { Icon, Garment, type IconName } from './visuals'
import './styles.css'

const roles = ['Administración', 'Mostrador', 'Producción'] as const
type Role = (typeof roles)[number]

const sections: { path: string; label: string; icon: IconName; roles: readonly Role[] }[] = [
  { path: '/', label: 'Panel principal', icon: 'home', roles },
  { path: '/pedidos', label: 'Pedidos y ventas', icon: 'orders', roles: ['Administración', 'Mostrador'] },
  { path: '/produccion', label: 'Órdenes de producción', icon: 'board', roles: ['Administración', 'Producción'] },
  { path: '/inventario', label: 'Inventario y catálogos', icon: 'box', roles: ['Administración', 'Producción'] },
  { path: '/clientes', label: 'Clientes', icon: 'people', roles: ['Administración', 'Mostrador'] },
]

const today = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

function Dashboard({ orders, role }: { orders: Order[]; role: Role }) {
  const totals = stageCounts(orders)
  return (
    <>
      <header className="page-heading">
        <h1 tabIndex={-1}>Panel principal</h1>
        <p>Consulta las órdenes y continúa el trabajo del taller.</p>
      </header>
      <section className="hero" aria-labelledby="hero-title">
        <div>
          <p className="eyebrow">Taller de confección · Tekit</p>
          <h2 id="hero-title">Del pedido a la producción</h2>
          <p>Configura prendas y sigue el avance desde corte hasta entrega.</p>
          {role !== 'Producción'
            ? <Link className="button button-light" to="/pedidos/configurador">Configurar prenda <Icon name="arrow" /></Link>
            : <Link className="button button-light" to="/produccion">Abrir producción <Icon name="arrow" /></Link>}
        </div>
        <div className="hero-art"><Garment /></div>
      </section>
      <div className="metric-grid">
        <article className="card metric"><Icon name="board" /><h2>Órdenes activas</h2><strong>{totals.active}</strong></article>
        <article className="card metric"><Icon name="check" /><h2>Listas para entrega</h2><strong>{totals.ready}</strong></article>
        {role !== 'Producción' &&
          <article className="card metric"><Icon name="orders" /><h2>Saldo de DEMO-001</h2><strong>{money.format(demoOrders[0].balance)}</strong></article>}
      </div>
      {role !== 'Mostrador' && <section className="card recent">
        <div className="section-heading"><h2>Producción del taller</h2><Link to="/produccion">Ver órdenes <Icon name="arrow" /></Link></div>
        <ul className="recent-list">
          {orders.slice(0, 3).map((order) => <li key={order.id}>
            <div><strong>{order.id}</strong><span>{order.garment}</span></div><span className="tag">{order.stage}</span>
          </li>)}
        </ul>
      </section>}
    </>
  )
}

function Module({ title, detail, children }: { title: string; detail: string; children?: React.ReactNode }) {
  return <>
    <header className="page-heading"><h1 tabIndex={-1}>{title}</h1><p>{detail}</p></header>
    <section className="card empty"><Icon name="box" /><h2>Integración pendiente</h2>{children}</section>
  </>
}

function App() {
  const [role, setRole] = useState<Role>('Administración')
  const [orders, setOrders] = useState(demoOrders)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const previousPath = useRef(location.pathname)
  const menuButton = useRef<HTMLButtonElement>(null)
  const main = useRef<HTMLElement>(null)

  useEffect(() => {
    const heading = main.current?.querySelector('h1')
    document.title = heading ? `${heading.textContent} | Xokbil Studio` : 'Xokbil Studio'
    if (previousPath.current !== location.pathname) {
      previousPath.current = location.pathname
      heading?.focus({ preventScroll: true })
      window.scrollTo(0, 0)
    }
  }, [location.pathname])

  const selected = sections.filter((section) => section.roles.includes(role))
  const allowed = (path: string) => selected.some((section) => section.path === path)
  const blocked = <Module title="Sección de otro rol" detail="Cambia el rol de demostración o vuelve al panel."><Link className="button" to="/">Volver al panel</Link></Module>

  return <div className="shell">
    <a className="skip-link" href="#contenido" onClick={(event) => { event.preventDefault(); main.current?.focus() }}>Saltar al contenido</a>
    <aside className="sidebar" data-open={menuOpen} onKeyDown={(event) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus() }
    }}>
      <div className="brand-line">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}><span className="brand-mark"><Icon name="sew" /></span>Xokbil Studio</Link>
        <button ref={menuButton} className="menu-trigger" type="button" aria-expanded={menuOpen} aria-controls="navigation" onClick={() => setMenuOpen(!menuOpen)}><Icon name="menu" /> Menú</button>
      </div>
      <nav id="navigation" aria-label="Navegación principal">
        {selected.map(({ path, label, icon }) => <NavLink end={path === '/'} key={path} to={path} onClick={() => setMenuOpen(false)}>
          <Icon name={icon} />{label}
        </NavLink>)}
      </nav>
      <div className="sidebar-foot"><span className="status-dot" />Demostración local</div>
    </aside>
    <div className="workspace">
      <div className="topbar">
        <span>{today.format(new Date())}</span>
        <label>Rol de demostración <select value={role} onChange={(event) => setRole(event.target.value as Role)}>{roles.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <main id="contenido" tabIndex={-1} ref={main}>
        <Routes>
          <Route path="/" element={<Dashboard orders={orders} role={role} />} />
          <Route path="/pedidos" element={allowed('/pedidos') ? <Module title="Pedidos y ventas" detail="La captura de pedidos y los anticipos se integrarán en esta sección."><Link className="button" to="/pedidos/configurador">Configurar prenda <Icon name="arrow" /></Link></Module> : blocked} />
          <Route path="/pedidos/configurador" element={allowed('/pedidos') ? <Configurator /> : blocked} />
          <Route path="/produccion" element={allowed('/produccion') ? <Production orders={orders} setOrders={setOrders} /> : blocked} />
          <Route path="/inventario" element={allowed('/inventario') ? <Module title="Inventario y catálogos" detail="Aquí se integrarán las telas, los hilos y el catálogo de bordados del taller." /> : blocked} />
          <Route path="/clientes" element={allowed('/clientes') ? <Module title="Clientes" detail="Aquí se integrarán el directorio y el historial de pedidos." /> : blocked} />
          <Route path="*" element={<Module title="Página fuera del taller" detail="La dirección solicitada no corresponde a una sección disponible."><Link className="button" to="/">Volver al panel</Link></Module>} />
        </Routes>
      </main>
    </div>
  </div>
}

createRoot(document.getElementById('root')!).render(<StrictMode><HashRouter><App /></HashRouter></StrictMode>)
