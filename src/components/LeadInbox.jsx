import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

const TABS = [
  { key: 'all', label: 'All Leads' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'closed', label: 'Closed' },
  { key: 'lost', label: 'Lost' },
];

const STATUS_STYLE = {
  new: { bg: '#dcfce7', color: '#166534' },
  contacted: { bg: '#dbeafe', color: '#1e40af' },
  qualified: { bg: '#fef3c7', color: '#92400e' },
  closed: { bg: '#f1f5f9', color: '#475569' },
  lost: { bg: '#fee2e2', color: '#b91c1c' },
};

function scoreColor(score) {
  if (score >= 60) return '#b45309'; // hot
  if (score >= 30) return '#0c1b2e'; // warm
  return '#94a3b8'; // cold
}

function waLink(phone, listingTitle) {
  const digits = (phone || '').replace(/\D/g, '');
  const msg = encodeURIComponent(
    listingTitle ? `Hi! Following up on your interest in "${listingTitle}" on PropertyPro.` : 'Hi! Following up on your PropertyPro enquiry.'
  );
  return `https://wa.me/${digits}?text=${msg}`;
}

export default function LeadInbox({ onClose }) {
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({ all: 0, new: 0, contacted: 0, qualified: 0, closed: 0, lost: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadLeads = useCallback((status) => {
    setLoading(true);
    setError(null);
    return apiClient
      .get('/api/v1/dashboard/leads', { params: status && status !== 'all' ? { status } : {} })
      .then((r) => {
        setLeads(r.data.leads || []);
        setCounts(r.data.counts || {});
      })
      .catch((err) => {
        setError(err.response?.data?.error?.message || 'Failed to load leads.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadLeads(activeTab); }, [activeTab, loadLeads]);

  const handleStatusChange = async (leadId, newStatus) => {
    setUpdatingId(leadId);
    try {
      await apiClient.patch(`/api/v1/dashboard/leads/${leadId}/status`, { status: newStatus });
      await loadLeads(activeTab);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update lead status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="pve-modal-wrap" style={S.overlay}>
      <div className="pve-modal" style={S.modal}>
        <div style={S.stripe} />

        <div style={S.head}>
          <div>
            <p style={S.eyebrow}>Buyer Interest</p>
            <h3 style={S.title}>Lead Inbox</h3>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        <div style={S.tabs}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{ ...S.tab, ...(activeTab === t.key ? S.tabActive : {}) }}
            >
              {t.label} {counts[t.key] != null ? `(${counts[t.key]})` : ''}
            </button>
          ))}
        </div>

        {error && <div style={S.banner}>{error}</div>}

        <div style={S.body}>
          {loading ? (
            <div style={S.loading}>Loading…</div>
          ) : leads.length === 0 ? (
            <div style={S.empty}>
              <span style={{ fontSize: '30px' }}>📭</span>
              <p style={{ margin: '10px 0 0', color: '#94a3b8', fontSize: '13px' }}>
                No leads in this view yet. Callback requests from your public listings will appear here.
              </p>
            </div>
          ) : (
            <div style={S.list}>
              {leads.map((lead) => {
                const pill = STATUS_STYLE[lead.status] || STATUS_STYLE.new;
                return (
                  <div key={lead.id} style={S.row}>
                    <div style={S.rowMain}>
                      <div style={S.rowTop}>
                        <span style={S.leadName}>{lead.name || 'Unnamed lead'}</span>
                        <span style={{ ...S.scorePill, color: scoreColor(lead.score) }}>● {lead.score}</span>
                      </div>
                      <div style={S.leadMeta}>
                        {lead.phone}
                        {lead.listing && (
                          <> &nbsp;·&nbsp; {lead.listing.title} — {lead.listing.address}</>
                        )}
                      </div>
                      <div style={S.leadMeta}>
                        {new Date(lead.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={S.rowActions}>
                      <span style={{ ...S.statusPill, backgroundColor: pill.bg, color: pill.color }}>
                        {lead.status.toUpperCase()}
                      </span>
                      <a
                        href={waLink(lead.phone, lead.listing?.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={S.waBtn}
                      >
                        WhatsApp
                      </a>
                      <select
                        value={lead.status}
                        disabled={updatingId === lead.id}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        style={S.statusSelect}
                      >
                        {['new', 'contacted', 'qualified', 'closed', 'lost'].map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(6,12,24,0.68)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 400, padding: '20px', backdropFilter: 'blur(8px)',
  },
  modal: {
    backgroundColor: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '760px',
    boxShadow: '0 24px 72px rgba(6,12,24,0.30)', overflow: 'hidden', maxHeight: '86vh',
    display: 'flex', flexDirection: 'column',
  },
  stripe: { height: '4px', background: 'linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)', flexShrink: 0 },
  head: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '22px 26px 14px', borderBottom: '1px solid #f1f5f9', flexShrink: 0,
  },
  eyebrow: { margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1.5px' },
  title: { margin: 0, fontSize: '19px', fontWeight: '800', color: '#0c1b2e' },
  closeBtn: {
    width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', border: 'none',
    cursor: 'pointer', fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  tabs: { display: 'flex', gap: '4px', padding: '14px 26px 0', flexWrap: 'wrap', flexShrink: 0 },
  tab: {
    padding: '8px 14px', borderRadius: '9px', fontSize: '12.5px', fontWeight: '600',
    color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer',
  },
  tabActive: { background: '#0c1b2e', color: '#fff' },
  banner: { margin: '14px 26px 0', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', backgroundColor: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7' },
  body: { padding: '16px 26px 22px', overflowY: 'auto' },
  loading: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' },
  empty: { padding: '40px 20px', textAlign: 'center' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px',
    padding: '14px 16px', borderRadius: '12px', border: '1px solid #eef2f7', backgroundColor: '#fafbfd',
  },
  rowMain: { minWidth: 0, flex: 1 },
  rowTop: { display: 'flex', alignItems: 'center', gap: '10px' },
  leadName: { fontSize: '14.5px', fontWeight: '700', color: '#0c1b2e' },
  scorePill: { fontSize: '12px', fontWeight: '700' },
  leadMeta: { fontSize: '12px', color: '#64748b', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rowActions: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  statusPill: { fontSize: '10.5px', fontWeight: '700', padding: '4px 10px', borderRadius: '999px', whiteSpace: 'nowrap' },
  waBtn: {
    padding: '7px 12px', borderRadius: '8px', border: 'none', background: '#0c1b2e', color: '#fff',
    fontWeight: '700', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap',
  },
  statusSelect: { fontSize: '12px', padding: '6px 8px', borderRadius: '8px', border: '1.5px solid #e2e8f0', color: '#0c1b2e', background: '#fff' },
};
