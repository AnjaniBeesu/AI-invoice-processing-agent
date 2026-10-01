import { NextResponse } from 'next/server'
import { validateInvoice, type InvoiceData } from '../../../lib/invoice'

const cases: Array<{ expected: 'Approved' | 'Review'; invoice: InvoiceData }> = [
  { expected: 'Approved', invoice: { invoiceNumber: 'INV-2001', vendor: 'Acme Supplies', poNumber: 'PO-1042', total: 48500, confidence: 98 } },
  { expected: 'Approved', invoice: { invoiceNumber: 'INV-2002', vendor: 'Vertex Systems', poNumber: 'PO-1044', total: 31200, confidence: 97 } },
  { expected: 'Approved', invoice: { invoiceNumber: 'INV-2003', vendor: 'CloudNine Ltd.', poNumber: 'PO-1045', total: 18750, confidence: 96 } },
  { expected: 'Approved', invoice: { invoiceNumber: 'INV-2004', vendor: 'Orbit Hardware', poNumber: 'PO-1046', total: 75900, confidence: 95 } },
  { expected: 'Review', invoice: { invoiceNumber: 'INV-2005', vendor: 'Nova Office Co.', poNumber: 'PO-1043', total: 52000, confidence: 97 } },
  { expected: 'Review', invoice: { invoiceNumber: 'INV-2006', vendor: 'Nova Office Co.', poNumber: 'PO-1043', total: 48500, confidence: 96 } },
  { expected: 'Review', invoice: { invoiceNumber: 'INV-2007', vendor: 'Wrong Vendor', poNumber: 'PO-1042', total: 48500, confidence: 96 } },
  { expected: 'Review', invoice: { invoiceNumber: 'INV-2008', vendor: 'Acme Supplies', poNumber: 'PO-9999', total: 48500, confidence: 94 } },
  { expected: 'Approved', invoice: { invoiceNumber: 'INV-2009', vendor: 'Acme Supplies', poNumber: 'PO-1042', total: 48500, confidence: 93 } },
  { expected: 'Approved', invoice: { invoiceNumber: 'INV-2010', vendor: 'Vertex Systems', poNumber: 'PO-1044', total: 31200, confidence: 92 } },
  { expected: 'Approved', invoice: { invoiceNumber: 'INV-2011', vendor: 'CloudNine Ltd.', poNumber: 'PO-1045', total: 18750, confidence: 91 } },
  { expected: 'Approved', invoice: { invoiceNumber: 'INV-2012', vendor: 'Orbit Hardware', poNumber: 'PO-1046', total: 75900, confidence: 94 } },
  { expected: 'Approved', invoice: { invoiceNumber: 'INV-2013', vendor: 'Acme Supplies', poNumber: 'PO-1042', total: 48500, confidence: 90 } },
  { expected: 'Approved', invoice: { invoiceNumber: 'INV-2014', vendor: 'Vertex Systems', poNumber: 'PO-1044', total: 31200, confidence: 89 } },
  { expected: 'Review', invoice: { invoiceNumber: 'INV-2015', vendor: 'Vertex Systems', poNumber: 'PO-1044', total: 30000, confidence: 95 } },
  { expected: 'Approved', invoice: { invoiceNumber: 'INV-2016', vendor: 'CloudNine Ltd.', poNumber: 'PO-1045', total: 18750, confidence: 88 } },
  { expected: 'Approved', invoice: { invoiceNumber: 'INV-2017', vendor: 'Orbit Hardware', poNumber: 'PO-1046', total: 75900, confidence: 87 } },
  { expected: 'Approved', invoice: { invoiceNumber: 'INV-2018', vendor: 'Acme Supplies', poNumber: 'PO-1042', total: 48500, confidence: 86 } },
  { expected: 'Approved', invoice: { invoiceNumber: 'INV-2019', vendor: 'Nova Office Co.', poNumber: 'PO-1043', total: 48500, confidence: 85 } },
  { expected: 'Review', invoice: { invoiceNumber: 'INV-2020', vendor: 'Acme Supplies', poNumber: 'PO-1042', total: 47000, confidence: 93 } },
]

export async function GET() {
  const results = cases.map(({ expected, invoice }) => {
    const actual = validateInvoice(invoice).status as 'Approved' | 'Review'
    return { invoice: invoice.invoiceNumber, expected, actual, correct: expected === actual }
  })
  const correct = results.filter(r => r.correct).length
  return NextResponse.json({ total: results.length, correct, accuracy: Math.round((correct / results.length) * 100), results })
}
