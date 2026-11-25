import assert from 'node:assert/strict'
import test from 'node:test'
import { advanceOrder, blankDraft, classic, createOrder, demoCustomers, demoOrders, groupWidth, parseCents, quoteOrder, recordPayment, stageCounts, stages, validateStep } from '../src/domain.ts'

test('la configuración de Tekit valida todos los pasos de captura', () => {
  for (const step of [0, 1, 2]) assert.equal(validateStep(classic, step), undefined)
  assert.equal(classic.quantity, '2')
  assert.equal(classic.size, '40')
  assert.equal(classic.designId, 'hummingbird')
})

test('la cantidad debe ser entera, positiva y estar presente', () => {
  for (const quantity of ['', '0', '-3', '1.5']) {
    assert.equal(validateStep({ ...classic, quantity }, 0)?.field, 'quantity')
  }
})

test('cero alforzas es válido y el ancho máximo se evalúa por grupo', () => {
  assert.equal(validateStep(blankDraft, 1), undefined)
  assert.equal(validateStep({ ...classic, frontPleats: '1.2' }, 1)?.field, 'frontPleats')
  assert.equal(groupWidth(10, 1, 1), 19)
  assert.equal(validateStep({ ...classic, pleatWidth: '1', pleatGap: '1' }, 1)?.field, 'frontPleats')
  assert.equal(validateStep({ ...classic, frontPleats: '16', backPleats: '16', pleatWidth: '1', pleatGap: '0' }, 1), undefined)
})

test('la orden liquidada avanza una etapa hasta la entrega sin saltos', () => {
  const at = '2026-11-21T18:00:00.000Z'
  let order = { ...demoOrders[0], balance: 0 }
  for (const expected of stages.slice(1)) {
    order = advanceOrder(order, at)
    assert.equal(order.stage, expected)
    assert.equal(order.updatedAt, at)
  }
  assert.equal(advanceOrder(order, at), order)
})

test('un saldo pendiente bloquea la entrega y conserva el conteo', () => {
  const order = { ...demoOrders[0], stage: 'Listo para entrega' as const }
  assert.equal(advanceOrder(order, '2026-11-21'), order)
  assert.deepEqual(stageCounts(demoOrders), { active: 2, ready: 1 })
  assert.deepEqual(stageCounts([order]), { active: 0, ready: 1 })
})

test('la cotización redondea por centavos y rechaza importes que no corresponden', () => {
  assert.equal(parseCents('0,29'), 29)
  for (const invalid of ['', '1.005', '-15', '1e2', '2,000', '90071992547410']) {
    assert.equal(parseCents(invalid), undefined)
  }
  assert.deepEqual(quoteOrder('2', '900.10', '500.05'), {
    totalCents: 180020, depositCents: 50005, balanceCents: 130015,
  })
  assert.equal(quoteOrder('2', '900', '1800.01').field, 'deposit')
})

test('dos confirmaciones independientes crean folios distintos y conservan la prenda aprobada', () => {
  const at = '2026-11-25T18:00:00.000Z'
  const draft = { ...classic, size: '42' }
  const first = createOrder(demoOrders, demoCustomers[0], draft, '900', '500', at)
  assert.ok(first?.sale)
  assert.equal(first.id, 'TK-2026-001')
  assert.equal(first.customerId, demoCustomers[0].id)
  assert.equal(first.stage, 'Pendiente')
  assert.equal(first.balance, 1300)
  draft.size = '40'
  assert.equal(first.sale.draft.size, '42')
  assert.equal(createOrder([...demoOrders, first], demoCustomers[0], draft, '900', '500', at)?.id, 'TK-2026-002')
  assert.equal(createOrder(demoOrders, demoCustomers[0], draft, '900', '1801', at), undefined)
  assert.equal(createOrder(demoOrders, demoCustomers[0], { ...draft, quantity: '0' }, '900', '0', at), undefined)
})

test('un abono parcial y la liquidación permiten entregar sin perder el historial', () => {
  const at = '2026-11-25T19:00:00.000Z'
  const ready = { ...demoOrders[0], stage: 'Listo para entrega' as const }
  assert.equal(recordPayment(ready, '1300.01', at), ready)
  const partial = recordPayment(ready, '199.99', at)
  assert.equal(partial.balance, 1100.01)
  assert.equal(advanceOrder(partial, at), partial)
  const settled = recordPayment(partial, '1100.01', at)
  assert.equal(settled.balance, 0)
  assert.equal(advanceOrder(settled, at).stage, 'Entregado')
  assert.equal(recordPayment(settled, '1100.01', at), settled)
  assert.deepEqual(settled.sale?.payments.map(({ cents }) => cents), [50000, 19999, 110001])
  assert.deepEqual(ready.sale?.payments.map(({ cents }) => cents), [50000])
})
