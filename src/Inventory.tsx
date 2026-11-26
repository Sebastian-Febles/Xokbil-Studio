import { useState } from 'react'
import { demoCatalog, matchesSearch } from './domain'
import { Icon, type IconName } from './visuals'

const categories = [
  { key: 'fabrics', label: 'Telas', icon: 'layers' },
  { key: 'threads', label: 'Hilos', icon: 'sew' },
  { key: 'embroideries', label: 'Bordados', icon: 'stitch' },
] as const satisfies ReadonlyArray<{ key: keyof typeof demoCatalog; label: string; icon: IconName }>
type Category = (typeof categories)[number]

const meters = new Intl.NumberFormat('es-MX', { style: 'unit', unit: 'meter', maximumFractionDigits: 2 })

export function Inventory() {
  const [category, setCategory] = useState<Category>(categories[0])
  const [query, setQuery] = useState('')
  const items: readonly { id: string; name: string; meters?: number }[] = demoCatalog[category.key]
  const visible = items.filter(({ name }) => matchesSearch(name, query))

  return <>
    <header className="page-heading"><h1 tabIndex={-1}>Inventario y catálogos</h1><p>Consulta los materiales y diseños de muestra del taller.</p></header>
    <section className="card workflow-card inventory" aria-labelledby="catalog-title">
      <div className="section-heading"><h2 id="catalog-title">Catálogo de materiales y diseños</h2></div>
      <div className="preview-actions" role="group" aria-label="Categoría del catálogo">
        {categories.map((item) => <button key={item.key} type="button" className="button button-secondary"
          aria-pressed={category.key === item.key} onClick={() => { setCategory(item); setQuery('') }}>
          <Icon name={item.icon} />{item.label}
        </button>)}
      </div>
      <div className="field inventory-search"><label htmlFor="catalog-search">Buscar por nombre</label>
        <input id="catalog-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      {visible.length
        ? <ul className="record-list">
          {visible.map((item) => <li key={item.id}><div className="inventory-row">
            <span className="icon-tile"><Icon name={category.icon} /></span><strong>{item.name}</strong>
            {item.meters !== undefined && <span className="tag">{meters.format(item.meters)}</span>}
          </div></li>)}
        </ul>
        : <p className="hint" role="status">No se encontraron resultados.</p>}
    </section>
  </>
}
