import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import api from '../../services/api';

export default function ReportIssue() {
  const [form, setForm] = useState({ title: '', description: '', category_id: '', department_id: '' });
  const [files, setFiles] = useState([]);
  const [cats, setCats] = useState([]);
  const [depts, setDepts] = useState([]);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/reports/categories').then(r => {
      console.log('Categories fetched:', r.data);
      setCats(r.data);
    });
    api.get('/reports/departments').then(r => {
      console.log('Departments fetched:', r.data);
      setDepts(r.data);
    });
  }, []);

  const go = async e => {
    e.preventDefault(); setErr(''); setOk('');

    // Trim and validate inputs
    const trimmedForm = {
      title: (form.title || '').trim(),
      description: (form.description || '').trim(),
      category_id: form.category_id,
      department_id: form.department_id,
    };

    console.log('=== REPORT SUBMISSION DEBUG ===');
    console.log('Form state before trimming:', form);
    console.log('Form state after trimming:', trimmedForm);
    console.log('Category ID valid?', Number.isInteger(trimmedForm.category_id) && trimmedForm.category_id > 0);
    console.log('Department ID valid?', Number.isInteger(trimmedForm.department_id) && trimmedForm.department_id > 0);

    // Strict validation
    if (!trimmedForm.title || trimmedForm.title.length < 3) {
      console.log('❌ Title invalid');
      return setErr('Title is required (min 3 characters)');
    }
    if (!trimmedForm.description || trimmedForm.description.length < 10) {
      console.log('❌ Description invalid');
      return setErr('Description is required (min 10 characters)');
    }
    if (!Number.isInteger(trimmedForm.category_id) || trimmedForm.category_id <= 0) {
      console.log('❌ Category ID invalid:', trimmedForm.category_id, 'type:', typeof trimmedForm.category_id);
      return setErr('Please select a valid category');
    }
    if (!Number.isInteger(trimmedForm.department_id) || trimmedForm.department_id <= 0) {
      console.log('❌ Department ID invalid:', trimmedForm.department_id, 'type:', typeof trimmedForm.department_id);
      return setErr('Please select a valid department');
    }

    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(trimmedForm).forEach(([k, v]) => {
        console.log(`Appending to FormData: ${k} = ${v} (type: ${typeof v})`);
        fd.append(k, v);
      });
      files.forEach(f => fd.append('attachments', f));

      console.log('FormData ready, sending request...');
      const { data } = await api.post('/reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      console.log('Response:', data);
      setOk(`Report submitted! Your Report ID: ${data.report_id}`);
      setTimeout(() => navigate('/my-reports'), 2000);
    } catch (e) {
      console.error('Submission error:', e);
      setErr(e.response?.data?.error || 'Failed to submit. Try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <h1 className="pg-title">📝 Report an Issue</h1>
        <p className="pg-sub">Your identity is protected. Reports are submitted anonymously using your ANON-ID.</p>
        <div className="card" style={{ maxWidth: 700 }}>
          {err && <div className="alert alert-err">{err}</div>}
          {ok && <div className="alert alert-ok">{ok}</div>}
          <form onSubmit={go}>
            <div className="fg">
              <label className="fl label-required">Issue Title</label>
              <input className="fi" placeholder="Short description of the issue" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="grid2">
              <div className="fg">
                <label className="fl label-required">Category</label>
                <select className="fs" value={form.category_id || ''}
                  onChange={e => {
                    const val = e.target.value;
                    const parsed = parseInt(val);
                    console.log(`Category select changed: raw="${val}", parsed=${parsed}, isNaN=${isNaN(parsed)}`);
                    setForm({ ...form, category_id: parsed });
                  }} required>
                  <option value="">Select category</option>
                  {cats.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                </select>
              </div>
              <div className="fg">
                <label className="fl label-required">Department</label>
                <select className="fs" value={form.department_id || ''}
                  onChange={e => {
                    const val = e.target.value;
                    const parsed = parseInt(val);
                    console.log(`Department select changed: raw="${val}", parsed=${parsed}, isNaN=${isNaN(parsed)}`);
                    setForm({ ...form, department_id: parsed });
                  }} required>
                  <option value="">Select department</option>
                  {depts.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="fg">
              <label className="fl label-required">Detailed Description</label>
              <textarea className="ft" rows={5}
                placeholder="Describe the problem in detail — where it is, when it started, how severe it is..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="fg">
              <label className="fl">Attachments (optional)</label>
              <input type="file" multiple accept="image/*,.pdf"
                onChange={e => setFiles(Array.from(e.target.files))}
                style={{ display: 'block', fontSize: 13.5, marginTop: 4 }} />
              <p className="text-sm text-gray" style={{ marginTop: 4 }}>Images or PDF · Max 5 files · 5MB each</p>
              {files.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {files.map(f => <span key={f.name} className="tag">📎 {f.name}</span>)}
                </div>
              )}
            </div>
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? 'Submitting...' : '📤 Submit Report'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Cancel</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
