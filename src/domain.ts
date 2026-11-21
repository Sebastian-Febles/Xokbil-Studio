export const garments = ['Guayabera tradicional', 'Guayamisa', 'Filipina'] as const
export const sizes = ['36', '38', '40', '42', '44', '46', '48'] as const
export const collars = ['Camisero', 'Mao', 'Francés'] as const
export const sleeves = ['Larga', 'Corta', 'Tres cuartos'] as const
export const pockets = ['Sin bolsas', 'Dos bolsas', 'Cuatro bolsas'] as const
export const placements = ['Pecho izquierdo', 'Pecho derecho', 'Espalda'] as const

export const demoCatalog = {
  fabrics: [
    { id: 'linen-flame', name: 'Lino flamé', meters: 12 },
    { id: 'cotton', name: 'Algodón blanco', meters: 9.5 },
    { id: 'linen-natural', name: 'Lino natural', meters: 3 },
  ],
  embroideries: [
    { id: 'hummingbird', name: 'Colibrí' },
    { id: 'geometric', name: 'Greca geométrica' },
  ],
  threads: [
    { id: 'blue', name: 'Azul' },
    { id: 'ivory', name: 'Marfil' },
    { id: 'green', name: 'Verde' },
  ],
}

export type Draft = {
  garment: string
  size: string
  quantity: string
  fabricId: string
  collar: string
  sleeve: string
  pockets: string
  frontPleats: string
  backPleats: string
  pleatWidth: string
  pleatGap: string
  designId: string
  placement: string
  threadId: string
}

export const classic: Draft = {
  garment: 'Guayabera tradicional', size: '40', quantity: '2', fabricId: 'linen-flame',
  collar: 'Camisero', sleeve: 'Larga', pockets: 'Cuatro bolsas', frontPleats: '10',
  backPleats: '10', pleatWidth: '0.3', pleatGap: '0.3', designId: 'hummingbird',
  placement: 'Pecho izquierdo', threadId: 'blue',
}

export const templates: [string, Draft][] = [
  ['Clásica Tekit', classic],
  ['Presidencial', { ...classic, quantity: '1', collar: 'Francés', pockets: 'Dos bolsas',
    frontPleats: '8', backPleats: '8', designId: '', threadId: 'ivory' }],
]

export const blankDraft: Draft = {
  ...classic, quantity: '1', frontPleats: '0', backPleats: '0', designId: '',
}

export const demoWidthLimit = 16

export function groupWidth(count: number, width: number, gap: number) {
  return count * width + Math.max(0, count - 1) * gap
}

type Issue = { field: keyof Draft; message: string }

export function validateStep(draft: Draft, step: number): Issue | undefined {
  if (step === 0) {
    if (!draft.quantity.trim() || !Number.isInteger(Number(draft.quantity)) || Number(draft.quantity) < 1) {
      return { field: 'quantity', message: 'Ingresa una cantidad entera mayor que cero.' }
    }
    if (!demoCatalog.fabrics.some((fabric) => fabric.id === draft.fabricId)) {
      return { field: 'fabricId', message: 'Selecciona una tela disponible.' }
    }
  }
  if (step === 1) {
    const counts = ['frontPleats', 'backPleats'] as const
    for (const field of counts) {
      if (!draft[field].trim() || !Number.isInteger(Number(draft[field])) || Number(draft[field]) < 0) {
        return { field, message: 'Ingresa un número entero de alforzas igual o mayor que cero.' }
      }
    }
    if (counts.some((field) => Number(draft[field]) > 0)) {
      const width = Number(draft.pleatWidth)
      const gap = Number(draft.pleatGap)
      if (!draft.pleatWidth.trim() || !Number.isFinite(width) || width <= 0) {
        return { field: 'pleatWidth', message: 'Ingresa un ancho mayor que cero.' }
      }
      if (!draft.pleatGap.trim() || !Number.isFinite(gap) || gap < 0) {
        return { field: 'pleatGap', message: 'Ingresa una separación igual o mayor que cero.' }
      }
      for (const field of counts) {
        if (groupWidth(Number(draft[field]), width, gap) > demoWidthLimit + 1e-9) {
          return { field, message: 'El grupo supera los 16 cm de la demostración. Reduce cantidad, ancho o separación.' }
        }
      }
    }
  }
}

export const stages = ['Pendiente', 'En corte', 'En bordado', 'En armado', 'Listo para entrega', 'Entregado'] as const
export type Stage = (typeof stages)[number]

export type Order = {
  id: string
  customer: string
  garment: string
  specs: string
  stage: Stage
  balance: number
  updatedAt?: string
}

export const demoOrders: Order[] = [
  { id: 'DEMO-001', customer: 'Cliente de muestra', garment: '2 guayaberas tradicionales',
    specs: 'Talla 40 · Lino flamé · Colibrí azul', stage: 'Pendiente', balance: 1300 },
  { id: 'DEMO-002', customer: 'Cliente de muestra', garment: '1 guayamisa',
    specs: 'Talla 42 · Algodón blanco', stage: 'En bordado', balance: 0 },
  { id: 'DEMO-003', customer: 'Cliente de muestra', garment: '1 filipina',
    specs: 'Talla 38 · Lino natural', stage: 'Listo para entrega', balance: 0 },
]

export function advanceOrder(order: Order, at: string): Order {
  const next = stages[stages.indexOf(order.stage) + 1]
  if (!next || (next === 'Entregado' && order.balance !== 0)) return order
  return { ...order, stage: next, updatedAt: at }
}

export function stageCounts(orders: Order[]) {
  return {
    active: orders.filter(({ stage }) => stage !== 'Entregado' && stage !== 'Listo para entrega').length,
    ready: orders.filter(({ stage }) => stage === 'Listo para entrega').length,
  }
}
