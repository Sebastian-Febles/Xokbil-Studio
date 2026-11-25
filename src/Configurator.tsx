import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { blankDraft, collars, demoCatalog, garments, placements, pockets, quoteOrder, sizes, sleeves, templates, validateStep, type Customer, type Draft } from './domain'
import { money } from './Sales'
import { Garment, Icon } from './visuals'

const steps = ['Prenda y tela', 'Piezas y alforzas', 'Bordado', 'Resumen']
const decimal = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 })

export function Configurator({ customers, initialCustomer, onConfirm }: {
  customers: Customer[]
  initialCustomer: string
  onConfirm: (customerId: string, draft: Draft, price: string, deposit: string) => boolean
}) {
  const [draft, setDraft] = useState<Draft>(() => ({
    ...blankDraft, size: customers.find(({ id }) => id === initialCustomer)?.usualSize || blankDraft.size,
  }))
  const [customerId, setCustomerId] = useState(initialCustomer)
  const [price, setPrice] = useState('900')
  const [deposit, setDeposit] = useState('0')
  const [approved, setApproved] = useState(false)
  const [saleIssue, setSaleIssue] = useState<{ field: string; message: string }>()
  const [step, setStep] = useState(0)
  const [issue, setIssue] = useState<ReturnType<typeof validateStep>>()
  const [back, setBack] = useState(false)
  const [notice, setNotice] = useState('')
  const stepTitle = useRef<HTMLHeadingElement>(null)
  const confirmed = useRef(false)

  function selectStep(next: number) {
    setIssue(undefined)
    setSaleIssue(undefined)
    setApproved(false)
    setStep(next)
    requestAnimationFrame(() => stepTitle.current?.focus())
  }

  function update(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
    setIssue(undefined)
    setNotice('')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validateStep(draft, step)
    if (validation) {
      setIssue(validation)
      event.currentTarget.querySelector<HTMLElement>(`#draft-${validation.field}`)?.focus()
      return
    }
    if (step < steps.length - 1) {
      selectStep(step + 1)
      return
    }
    const error = !customerId ? { field: 'customer', message: 'Selecciona el cliente del pedido.' }
      : 'field' in quote ? quote
      : !approved ? { field: 'approval', message: 'Confirma que el cliente revisó la configuración.' } : undefined
    if (error) {
      setSaleIssue(error)
      event.currentTarget.querySelector<HTMLElement>(`#sale-${error.field}`)?.focus()
      return
    }
    if (confirmed.current) return
    confirmed.current = onConfirm(customerId, draft, price, deposit)
    if (!confirmed.current) {
      setSaleIssue({ field: 'confirm', message: 'Revisa el cliente y la configuración antes de confirmar.' })
    }
  }

  function field(label: string, name: keyof Draft, input: ReactNode) {
    return <div className="field"><label htmlFor={`draft-${name}`}>{label}</label>{input}
      {issue?.field === name && <span id={`error-${name}`} className="field-error" role="alert">{issue.message}</span>}
    </div>
  }

  function select(label: string, name: keyof Draft, options: readonly string[] | { id: string; name: string }[]) {
    return field(label, name, <select id={`draft-${name}`} value={draft[name]} onChange={(event) => update(name, event.target.value)}>
      {options.map((item) => typeof item === 'string' ? <option key={item}>{item}</option> : <option key={item.id} value={item.id}>{item.name}</option>)}
    </select>)
  }

  function number(label: string, name: keyof Draft, increment = '1') {
    return field(label, name, <input id={`draft-${name}`} type="number" min={name === 'quantity' ? 1 : 0} step={increment}
      value={draft[name]} aria-invalid={issue?.field === name || undefined}
      aria-describedby={issue?.field === name ? `error-${name}` : undefined}
      onChange={(event) => update(name, event.target.value)} />)
  }

  const fabric = demoCatalog.fabrics.find(({ id }) => id === draft.fabricId)?.name
  const design = demoCatalog.embroideries.find(({ id }) => id === draft.designId)?.name
  const thread = demoCatalog.threads.find(({ id }) => id === draft.threadId)?.name
  const quote = quoteOrder(draft.quantity, price, deposit)
  const embroidery = !design ? undefined : draft.placement === 'Espalda' ? 'back' : draft.placement === 'Pecho derecho' ? 'right' : 'left'

  return <>
    <header className="page-heading"><h1 tabIndex={-1}>Configurador de prenda</h1><p>Captura la prenda y revisa el pedido con el cliente.</p></header>
    <ol className="stepper" aria-label="Pasos de configuración">
      {steps.map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined}>
        <span className="step-number">{index + 1}</span><span>{label}</span>
      </li>)}
    </ol>
    <div className="config-grid">
      <form className="card editor" noValidate onSubmit={submit}>
        <h2 ref={stepTitle} tabIndex={-1}>{steps[step]}</h2>
        {step === 0 && <>
          <div className="templates" aria-label="Plantillas del taller">
            <span>Aplicar plantilla</span>
            {templates.map(([label, data]) => <button className="button button-secondary" type="button" key={label} onClick={() => {
              setDraft({ ...data }); setIssue(undefined); setNotice(`Plantilla ${label} aplicada.`)
            }}>{label}</button>)}
          </div>
          <div className="form-grid">
            {select('Tipo de prenda', 'garment', garments)}
            {select('Talla', 'size', sizes)}
            {number('Cantidad', 'quantity')}
            {select('Tela', 'fabricId', demoCatalog.fabrics.map(({ id, name, meters }) => ({ id, name: `${name} · ${decimal.format(meters)} m` })))}
          </div>
        </>}
        {step === 1 && <>
          <div className="form-grid">
            {select('Cuello', 'collar', collars)}
            {select('Manga', 'sleeve', sleeves)}
            {select('Bolsas', 'pockets', pockets)}
            {number('Alforzas por lado en delantero', 'frontPleats')}
            {number('Alforzas por lado en espalda', 'backPleats')}
            {number('Ancho visible de cada alforza en cm', 'pleatWidth', 'any')}
            {number('Separación entre alforzas en cm', 'pleatGap', 'any')}
          </div>
          <p className="hint">Límite de muestra por grupo: 16 cm. Usa 0 si el lado no lleva alforzas.</p>
        </>}
        {step === 2 && <div className="form-grid">
          {select('Diseño', 'designId', [{ id: '', name: 'Sin bordado' }, ...demoCatalog.embroideries])}
          {draft.designId && <>
            {select('Ubicación', 'placement', placements)}
            {select('Hilo', 'threadId', demoCatalog.threads)}
          </>}
        </div>}
        {step === 3 && <>
          <dl className="specs">
            <dt>Tipo, talla y cantidad</dt><dd>{draft.garment} · Talla {draft.size} · {draft.quantity} pieza(s)</dd>
            <dt>Tela</dt><dd>{fabric}</dd>
            <dt>Cuello, manga y bolsas</dt><dd>{draft.collar} · {draft.sleeve} · {draft.pockets}</dd>
            <dt>Alforzas por lado</dt><dd>Delantero {draft.frontPleats} · Espalda {draft.backPleats}</dd>
            {(Number(draft.frontPleats) > 0 || Number(draft.backPleats) > 0) &&
              <><dt>Medidas de alforza</dt><dd>Ancho {draft.pleatWidth} cm · Separación {draft.pleatGap} cm</dd></>}
            <dt>Bordado</dt><dd>{design ? `${design} · ${draft.placement} · ${thread}` : 'Sin bordado'}</dd>
          </dl>
          <section className="workflow-card inset" aria-labelledby="quote-heading">
            <h3 id="quote-heading">Cuenta del pedido</h3>
            <div className="field"><label htmlFor="sale-customer">Cliente</label>
              <select id="sale-customer" value={customerId} onChange={(event) => { setCustomerId(event.target.value); setApproved(false); setSaleIssue(undefined) }}
                aria-invalid={saleIssue?.field === 'customer' || undefined} aria-describedby={saleIssue?.field === 'customer' ? 'sale-error' : undefined}>
                <option value="">Selecciona un cliente</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>
                  {customer.name}{customer.phone ? ` · ${customer.phone}` : ''}
                </option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="field"><label htmlFor="sale-price">Precio por prenda (MXN)</label>
                <input id="sale-price" inputMode="decimal" value={price} onChange={(event) => { setPrice(event.target.value); setApproved(false); setSaleIssue(undefined) }}
                  aria-invalid={saleIssue?.field === 'price' || undefined} aria-describedby={saleIssue?.field === 'price' ? 'sale-error' : undefined} />
              </div>
              <div className="field"><label htmlFor="sale-deposit">Anticipo (MXN)</label>
                <input id="sale-deposit" inputMode="decimal" value={deposit} onChange={(event) => { setDeposit(event.target.value); setApproved(false); setSaleIssue(undefined) }}
                  aria-invalid={saleIssue?.field === 'deposit' || undefined} aria-describedby={saleIssue?.field === 'deposit' ? 'sale-error' : undefined} />
              </div>
            </div>
            <p className="hint">Precio editable de demostración. El cálculo textil se incorporará al validar el patronaje.</p>
            {'totalCents' in quote && <p className="quote-totals"><strong>Total {money.format(quote.totalCents / 100)}</strong><span>Saldo {money.format(quote.balanceCents / 100)}</span></p>}
            <label className="check-field"><input id="sale-approval" type="checkbox" checked={approved}
              aria-describedby={saleIssue?.field === 'approval' ? 'sale-error' : undefined}
              onChange={(event) => { setApproved(event.target.checked); setSaleIssue(undefined) }} /> El cliente aprobó la configuración y el importe.</label>
            {saleIssue && <p id="sale-error" className="field-error" role="alert">{saleIssue.message}</p>}
          </section>
        </>}
        <div className="form-actions">
          {step > 0 && <button className="button button-secondary" type="button" onClick={() => selectStep(step - 1)}>Volver</button>}
          {step < steps.length - 1
            ? <button className="button" type="submit">Continuar <Icon name="arrow" /></button>
            : <button className="button" type="submit">Confirmar pedido <Icon name="check" /></button>}
        </div>
      </form>
      <aside className="card preview" aria-labelledby="preview-title">
        <h2 id="preview-title">Vista de referencia</h2>
        <div className="preview-actions" role="group" aria-label="Cara de la prenda">
          <button type="button" className="button button-secondary" aria-pressed={!back} onClick={() => setBack(false)}>Frente</button>
          <button type="button" className="button button-secondary" aria-pressed={back} onClick={() => setBack(true)}>Espalda</button>
        </div>
        <Garment back={back} frontPleats={Number(draft.frontPleats) > 0}
          backPleats={Number(draft.backPleats) > 0} embroidery={embroidery ?? false} />
        <p>Guayabera ilustrativa. Las especificaciones exactas aparecen en el resumen.</p>
        <span className="tag">Talla {draft.size}</span>
      </aside>
    </div>
    <p className="sr-only" role="status">{notice}</p>
  </>
}
