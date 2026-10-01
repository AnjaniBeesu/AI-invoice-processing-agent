export type PO = { poNumber: string; vendor: string; currency: string; total: number; items: { description: string; quantity: number; unitPrice: number }[] }

export const purchaseOrders: PO[] = [
  { poNumber: 'PO-1042', vendor: 'Acme Supplies', currency: 'INR', total: 48500, items: [{ description: 'Office chairs', quantity: 10, unitPrice: 3500 }, { description: 'Desk lamps', quantity: 10, unitPrice: 1350 }] },
  { poNumber: 'PO-1043', vendor: 'Nova Office Co.', currency: 'INR', total: 48500, items: [{ description: 'Monitors', quantity: 5, unitPrice: 9700 }] },
  { poNumber: 'PO-1044', vendor: 'Vertex Systems', currency: 'INR', total: 31200, items: [{ description: 'Network switches', quantity: 4, unitPrice: 7800 }] },
  { poNumber: 'PO-1045', vendor: 'CloudNine Ltd.', currency: 'INR', total: 18750, items: [{ description: 'Cloud services', quantity: 1, unitPrice: 18750 }] },
]

export function validateInvoice(invoice: any) {
  const po = purchaseOrders.find(p => p.poNumber.toLowerCase() === String(invoice.poNumber || '').toLowerCase())
  if (!po) return { status: 'Review', score: 35, reasons: ['Purchase order not found'] }
  const reasons: string[] = []
  const vendorMatch = String(invoice.vendor || '').trim().toLowerCase() === po.vendor.toLowerCase()
  const amount = Number(invoice.total || 0)
  const amountMatch = Math.abs(amount - po.total) < 0.01
  if (!vendorMatch) reasons.push(`Vendor mismatch: invoice says ${invoice.vendor}, PO says ${po.vendor}`)
  if (!amountMatch) reasons.push(`Amount mismatch: invoice ${amount.toLocaleString('en-IN')} vs PO ${po.total.toLocaleString('en-IN')}`)
  const score = Math.round((vendorMatch ? 50 : 0) + (amountMatch ? 50 : 0))
  return { status: score === 100 ? 'Approved' : 'Review', score, reasons: reasons.length ? reasons : ['Vendor and total match the purchase order'] }
}
