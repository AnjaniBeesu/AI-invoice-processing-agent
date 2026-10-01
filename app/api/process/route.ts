import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { validateInvoice } from '../../../lib/invoice'

export const runtime = 'nodejs'

const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID || 'C0C64MN2JPK'
const schema = `Return ONLY valid JSON with this shape: {"invoiceNumber":string|null,"vendor":string|null,"invoiceDate":string|null,"poNumber":string|null,"currency":string|null,"subtotal":number|null,"tax":number|null,"total":number|null,"lineItems":[{"description":string,"quantity":number,"unitPrice":number}],"confidence":number}. confidence must be 0-100.`

async function extractPdfText(bytes: Buffer) {
  const errors: string[] = []

  // pdfjs-dist is the primary parser because it handles a wider range of
  // real-world PDFs than the older pdf-parse wrapper.
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const document = await pdfjs.getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: true,
      isEvalSupported: false,
    }).promise

    const pages: string[] = []
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber)
      const content = await page.getTextContent()
      pages.push(content.items.map((item: any) => ('str' in item ? item.str : '')).join(' '))
      page.cleanup()
    }

    const text = pages.join('\n').replace(/\s+/g, ' ').trim()
    if (text) return { text, parser: 'pdfjs-dist' }
    errors.push('PDF contains no extractable text (it may be scanned/image-only).')
  } catch (error: any) {
    errors.push(`pdfjs-dist: ${error?.message || 'PDF parsing failed'}`)
  }

  // Keep pdf-parse as a compatibility fallback for PDFs it can recover.
  try {
    const pdfParse = (await import('pdf-parse')).default
    const parsed = await pdfParse(bytes)
    const text = String(parsed.text || '').replace(/\s+/g, ' ').trim()
    if (text) return { text, parser: 'pdf-parse' }
    errors.push('pdf-parse returned no extractable text.')
  } catch (error: any) {
    errors.push(`pdf-parse: ${error?.message || 'PDF parsing failed'}`)
  }

  throw new Error(`Could not extract text from this PDF. It may be corrupted, password-protected, or scanned/image-only. Try exporting the invoice as a standard PDF. Details: ${errors.join(' | ')}`)
}

async function notifySlack(invoice: any, validation: any) {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) return { sent: false, configured: false, reason: 'SLACK_BOT_TOKEN is missing. Add it in Vercel Environment Variables.' }

  const statusEmoji = validation.status === 'Approved' ? 'white_check_mark' : 'warning'
  const message = [
    `:${statusEmoji}: *Invoice ${invoice.invoiceNumber || 'Unknown'} — ${validation.status}*`,
    `• Vendor: ${invoice.vendor || 'Unknown'}`,
    `• PO: ${invoice.poNumber || 'Not found'}`,
    `• Total: ${invoice.currency || ''} ${Number(invoice.total || 0).toLocaleString('en-IN')}`,
    `• Validation score: ${validation.score}%`,
    `• AI confidence: ${Number(invoice.confidence || 0)}%`,
    validation.reasons?.length ? `• ${validation.reasons.join('\n• ')}` : '',
  ].filter(Boolean).join('\n')

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ channel: SLACK_CHANNEL_ID, text: message }),
  })

  const result = await response.json()
  if (!response.ok || !result.ok) return { sent: false, configured: true, reason: result.error || `Slack returned HTTP ${response.status}` }
  return { sent: true, configured: true, ts: result.ts }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'No invoice file supplied' }, { status: 400 })
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'File must be under 8MB' }, { status: 400 })
    if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: 'GROQ_API_KEY is missing. Add it in Vercel Environment Variables.' }, { status: 500 })

    const bytes = Buffer.from(await file.arrayBuffer())
    let text = ''
    let parser = 'text'
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const extracted = await extractPdfText(bytes)
      text = extracted.text
      parser = extracted.parser
    } else if (file.type.startsWith('text/')) {
      text = bytes.toString('utf8')
    } else {
      return NextResponse.json({ error: 'Please upload a PDF invoice. Image/OCR support is not enabled yet.' }, { status: 400 })
    }

    if (text.length < 20) {
      return NextResponse.json({ error: 'The PDF did not contain enough readable text to extract an invoice. If this is a scanned invoice, OCR support is needed.' }, { status: 422 })
    }

    const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: `You are an invoice extraction engine. Extract only facts present in the invoice. ${schema}` },
        { role: 'user', content: `Invoice filename: ${file.name}\n\nInvoice text:\n${text.slice(0, 30000)}` }
      ],
      response_format: { type: 'json_object' }
    })
    const raw = completion.choices[0]?.message?.content || '{}'
    const invoice = JSON.parse(raw)
    const validation = validateInvoice(invoice)
    const slack = await notifySlack(invoice, validation)

    return NextResponse.json({ invoice, validation, slack, model, parser, extractedCharacters: text.length })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Invoice processing failed' }, { status: 500 })
  }
}
