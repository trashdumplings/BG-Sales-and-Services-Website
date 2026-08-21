import React, { useMemo, useState } from 'react';
import { LuPlus, LuPrinter, LuSave, LuTrash2 } from 'react-icons/lu';
import { useAuth } from '../../../stores/AuthProvider';
import logo from '../../../assets/bg-logo.jpg';
import './DocumentManager.css';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
const companies = {
  BGSS: { name: 'BG Sales & Supplies', tpn: 'BAB02929', gst: 'P10182132', email: 'bgsales@outlook.com', account: '200111497' },
  BGCS: { name: 'BG Consultancy & Services', tpn: 'BAB01323', gst: 'P10182132', email: 'bgconsultancyservice@gmail.com', account: '200154736' },
};
const titles = { bill: 'TAX INVOICE', supply_order: 'SUPPLY ORDER', proforma_invoice: 'PROFORMA INVOICE', purchase_order: 'PURCHASE ORDER' };
const emptyItem = () => ({ description: '', quantity: 1, unit_rate: 0, uom: 'Nos.' });
const initial = () => ({ company: 'BGSS', document_type: 'bill', issue_date: new Date().toISOString().slice(0, 10), party_name: '', party_details: { address: '', order_number: '' }, reference: '', currency: 'BTN', tax_rate: 5, items: [emptyItem()], terms: 'Payment as agreed. Goods and services are subject to the terms and conditions stated above.' });
const money = value => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const InlineInput = ({ className = '', ...props }) => <input className={`paper-input ${className}`} {...props} />;

export default function DocumentManager() {
  const { token } = useAuth();
  const [form, setForm] = useState(initial);
  const [number, setNumber] = useState('DRAFT');
  const [message, setMessage] = useState('');
  const company = companies[form.company];
  const subtotal = useMemo(() => form.items.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(row.unit_rate || 0), 0), [form.items]);
  const tax = subtotal * Number(form.tax_rate || 0) / 100;
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const setParty = (key, value) => setForm(current => ({ ...current, party_details: { ...current.party_details, [key]: value } }));
  const setItem = (index, key, value) => setForm(current => ({ ...current, items: current.items.map((row, i) => i === index ? { ...row, [key]: value } : row) }));
  async function save(event) { event.preventDefault(); setMessage('Saving…'); const response = await fetch(`${API}/api/documents`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) }); const data = await response.json().catch(() => ({})); if (!response.ok) return setMessage(data.detail || 'Could not save document'); setNumber(data.document_number); setMessage(`Saved as ${data.document_number}`); }

  return <div className="documents">
    <header className="documents-heading"><div><p>Commercial records</p><h1>Type directly into the document</h1><span>Select the company and format, then complete the highlighted fields below.</span></div></header>
    <div className="document-toolbar">
      <label><span>Company</span><select value={form.company} onChange={e => set('company', e.target.value)}><option value="BGSS">BG Sales & Supplies</option><option value="BGCS">BG Consultancy & Services</option></select></label>
      <label><span>Document</span><select value={form.document_type} onChange={e => set('document_type', e.target.value)}><option value="bill">Bill / Tax Invoice</option><option value="supply_order">Supply Order</option><option value="proforma_invoice">Proforma Invoice</option><option value="purchase_order">Purchase Order</option></select></label>
      <button type="button" className="toolbar-button secondary" onClick={() => window.print()}><LuPrinter /> Print / PDF</button>
    </div>
    <form onSubmit={save} className="template-editor">
      <section className={`paper paper--${form.company.toLowerCase()}`} aria-label="Editable document template">
        <div className="edit-hint">Blue fields are editable and will print as normal text.</div>
        <div className="paper-topline"><strong>{titles[form.document_type]}</strong><span>TPN No. {company.tpn}<br />GST No. {company.gst}</span></div>
        <div className="paper-brand"><img src={logo} alt="" /><div><h2>{company.name}</h2><p>Opp. to DGM Office, MoEA Complex<br />Dondrup Lam, Hongkong Market, Thimphu · Bhutan<br />Contact: +975-2-337912 | +975-77208946 / 17141025<br />Email: {company.email}</p><strong>BoB Account No. {company.account}</strong></div></div>
        <div className="paper-meta"><strong>{number}</strong><label>Date <InlineInput type="date" value={form.issue_date} onChange={e => set('issue_date', e.target.value)} /></label></div>
        <div className="party-box"><div><b>To</b><InlineInput required aria-label="Customer or supplier name" placeholder="Type customer / supplier name" value={form.party_name} onChange={e => set('party_name', e.target.value)} /><textarea className="paper-input" aria-label="Address" placeholder="Type address" value={form.party_details.address} onChange={e => setParty('address', e.target.value)} /></div><div><b>S/O or P/O No.</b><InlineInput aria-label="Order number" placeholder="Type order number" value={form.party_details.order_number} onChange={e => setParty('order_number', e.target.value)} /><b>Reference</b><InlineInput aria-label="Reference" placeholder="Type reference" value={form.reference} onChange={e => set('reference', e.target.value)} /></div></div>
        <table className="paper-table"><thead><tr><th>Sl.<br />No.</th><th>Item Description</th><th>Qty.</th><th>UOM</th><th>Unit Rate</th><th>Amount</th><th className="edit-action"></th></tr></thead><tbody>{form.items.map((row, index) => <tr key={index}><td>{index + 1}</td><td><textarea required className="paper-input table-input" aria-label={`Item ${index + 1} description`} placeholder="Type item description" value={row.description} onChange={e => setItem(index, 'description', e.target.value)} /></td><td><InlineInput type="number" min="0.01" step="any" aria-label={`Item ${index + 1} quantity`} value={row.quantity} onChange={e => setItem(index, 'quantity', e.target.value)} /></td><td><InlineInput aria-label={`Item ${index + 1} unit`} value={row.uom} onChange={e => setItem(index, 'uom', e.target.value)} /></td><td><InlineInput type="number" min="0" step="any" aria-label={`Item ${index + 1} rate`} value={row.unit_rate} onChange={e => setItem(index, 'unit_rate', e.target.value)} /></td><td>{money(Number(row.quantity) * Number(row.unit_rate))}</td><td className="edit-action"><button type="button" aria-label={`Remove item ${index + 1}`} disabled={form.items.length === 1} onClick={() => set('items', form.items.filter((_, i) => i !== index))}><LuTrash2 /></button></td></tr>)}</tbody><tfoot><tr className="add-row"><td colSpan="7"><button type="button" onClick={() => set('items', [...form.items, emptyItem()])}><LuPlus /> Add another item</button></td></tr><tr><th colSpan="4"></th><th>TOTAL</th><td>{money(subtotal)}</td><td className="edit-action"></td></tr><tr><th colSpan="4"></th><th>GST <InlineInput className="tax-input" type="number" min="0" value={form.tax_rate} onChange={e => set('tax_rate', e.target.value)} />%</th><td>{money(tax)}</td><td className="edit-action"></td></tr><tr className="grand-total"><th colSpan="3">GRAND TOTAL</th><th><select className="paper-input" value={form.currency} onChange={e => set('currency', e.target.value)}><option>BTN</option><option>INR</option><option>USD</option></select></th><td colSpan="2">{money(subtotal + tax)}</td><td className="edit-action"></td></tr></tfoot></table>
        <div className="amount-words"><b>Amount:</b> {form.currency} {money(subtotal + tax)} only</div>
        <div className="paper-terms"><b>Terms &amp; Conditions</b><textarea className="paper-input" aria-label="Terms and conditions" value={form.terms} onChange={e => set('terms', e.target.value)} /></div>
        <footer className="paper-footer"><span>E&amp;O Accepted</span><div><p>For {company.name}</p><strong>Authorized Signatory</strong></div></footer>
      </section>
      <div className="template-actions"><span role="status">{message}</span><button className="toolbar-button" type="submit"><LuSave /> Save document</button></div>
    </form>
  </div>;
}
