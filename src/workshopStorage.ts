import { demoCustomers, demoOrders, type Customer, type Order } from './domain'

const workshopKey = 'xokbil-workshop-demo-v1'
export type Workshop = { orders: Order[]; customers: Customer[] }

export function loadWorkshop(): Workshop {
  try {
    const value = sessionStorage.getItem(workshopKey)
    if (value) {
      const state = JSON.parse(value)
      if (Array.isArray(state?.orders) && Array.isArray(state?.customers)) return state
    }
  } catch {
    // The demo can run in memory if browser storage is disabled.
  }
  return { orders: demoOrders, customers: demoCustomers }
}

export function saveWorkshop(state: Workshop) {
  try {
    sessionStorage.setItem(workshopKey, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
