import assert from 'node:assert/strict'
import test from 'node:test'
import { advanceOrder, blankDraft, classic, demoOrders, groupWidth, stageCounts, stages, validateStep } from '../src/domain.ts'

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
