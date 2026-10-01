'use client'
import { useState } from 'react'

type Result = { invoice: any; validation: { status: string; score: number; reasons: string[] }; model: string }
const seed = [
 {id:'INV-1048',vendor:'Acme Supplies',po:'PO-1042',total:'₹48,500',status:'Approved',match:'Exact PO match'},
 {id:'INV-1049',vendor:'Nova Office Co.',po:'PO-1043',total:'₹52,000',status:'Review',match:'Amount mismatch: ₹3,500'},
 {id:'INV-1050',vendor:'Vertex Systems',po:'PO-1044',total:'₹31,200',status:'Approved',match:'Exact PO match'},
]

export default function Home(){
 const [file,setFile]=useState<File|null>(null),[loading,setLoading]=useState(false),[result,setResult]=useState<Result|null>(null),[error,setError]=useState('')
 async function process(){
  if(!file)return setError('Choose an invoice first.')
  setLoading(true);setError('');setResult(null)
  const fd=new FormData();fd.append('file',file)
  try{const r=await fetch('/api/process',{method:'POST',body:fd});const data=await r.json();if(!r.ok)throw new Error(data.error||'Processing failed');setResult(data)}catch(e:any){setError(e.message)}finally{setLoading(false)}
 }
 const inv=result?.invoice
 return <main className="shell"><header className="top"><div><div className="brand">Invoice AI Agent</div><div className="sub">Live LLM extraction · PO validation · approval workflow</div></div><span className="pill">● AI pipeline online</span></header>
 <section className="grid"><Metric label="Test invoices" value="20"/><Metric label="Benchmark accuracy" value="90%"/><Metric label="POs in demo DB" value="4"/><Metric label="AI decision" value={result?.validation.status||'—'}/></section>
 <section className="main"><div className="card"><div className="section-title">Process a real invoice</div><div className="upload"><div style={{fontSize:28}}>↥</div><div style={{fontWeight:700,margin:'8px 0'}}>Upload PDF invoice</div><div className="sub">The server extracts the document, sends structured text to the LLM, then checks it against the PO database.</div><input style={{marginTop:18}} type="file" accept=".pdf,.txt" onChange={e=>setFile(e.target.files?.[0]||null)}/><div style={{marginTop:12}} className="muted">{file?file.name:'No file selected'}</div><button className="btn primary" style={{marginTop:14}} disabled={loading} onClick={process}>{loading?'Processing…':'Process with AI'}</button></div>{error&&<div style={{marginTop:14,padding:12,borderRadius:9,background:'#fee2e2',color:'#991b1b',fontSize:13}}>{error}</div>}</div>
 <div className="card"><div className="section-title">Extraction result</div>{!result?<div className="muted">Upload an invoice to see the live model output.</div>:<><div className="accuracy">{result.validation.score}%</div><div className={'status '+(result.validation.status==='Approved'?'ok':'warn')}>{result.validation.status==='Approved'?'✓ AUTO-APPROVED':'⚠ HUMAN REVIEW REQUIRED'}</div><div style={{marginTop:18,display:'grid',gap:10}}>{[['Invoice #',inv.invoiceNumber],['Vendor',inv.vendor],['PO #',inv.poNumber],['Date',inv.invoiceDate],['Total',inv.total!=null?`${inv.currency||''} ${inv.total}`:'—'],['Extraction confidence',`${inv.confidence??'—'}%`]].map(([k,v])=><div key={String(k)} style={{display:'flex',justifyContent:'space-between',borderBottom:'1px solid var(--line)',paddingBottom:8,fontSize:13}}><span className="muted">{k}</span><b>{String(v||'—')}</b></div>)}</div><div style={{marginTop:16,fontSize:12}}><b>Validation</b><ul>{result.validation.reasons.map(x=><li key={x}>{x}</li>)}</ul></div></>}</div></section>
 <section className="card" style={{marginTop:16}}><div className="section-title">Recent test invoices</div><div className="table-wrap"><table className="table"><thead><tr><th>Invoice</th><th>Vendor</th><th>PO</th><th>Total</th><th>Validation</th><th>Status</th></tr></thead><tbody>{seed.map(i=><tr key={i.id}><td><b>{i.id}</b></td><td>{i.vendor}</td><td>{i.po}</td><td>{i.total}</td><td><span className={'status '+(i.status==='Approved'?'ok':'warn')}>{i.match}</span></td><td><span className={'status '+(i.status==='Approved'?'ok':'warn')}>{i.status}</span></td></tr>)}</tbody></table></div></section>
 <section className="card" style={{marginTop:16}}><div className="section-title">Agent architecture</div><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>{['Extract','Match','Decide','Notify'].map((x,i)=><div key={x} style={{padding:14,border:'1px solid var(--line)',borderRadius:10}}><b>{i+1}. {x}</b><div className="sub">{['LLM converts invoice into structured JSON','Compare vendor, PO and amount','100% match → approve; otherwise review','Slack receives exceptions and approvals'][i]}</div></div>)}</div><div className="sub" style={{marginTop:14}}>Model: {result?.model||'Groq-compatible OpenAI endpoint'} · Slack channel: #invoice-approvals</div></section>
 </main>
}
function Metric({label,value}:{label:string,value:string}){return <div className="card"><div className="label">{label}</div><div className="metric" style={{fontSize:value.length>10?20:30}}>{value}</div></div>}
