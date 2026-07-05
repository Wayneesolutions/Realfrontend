import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

/**
 * Billing modal, opened from the dashboard top bar (same pattern as
 * ChangePassword.jsx). Loads Razorpay's checkout script on demand — no
 * npm dependency needed, matching how Razorpay recommends integrating
 * client-side.
 */
export default function BillingModal({ onClose }) {
  const storedUser = JSON.parse(localStorage.getItem('pve_user') || 'null');
  const isOwner = storedUser?.role === 'owner';

  const [status, setStatus] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingPlan, setPayingPlan] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    Promise.all([
      apiClient.get('/api/v1/dashboard/billing/status'),
      apiClient.get('/api/v1/public/billing/plans'),
    ])
      .then(([statusRes, plansRes]) => {
        setStatus(statusRes.data.billing);
        setPlans(plansRes.data.plans || []);
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load billing details.' }))
      .finally(() => setLoading(false));
  }, []);

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handlePay = async (planKey) => {
    setPayingPlan(planKey);
    setMessage(null);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setMessage({ type: 'error', text: 'Could not load the payment widget. Check your connection and try again.' });
        return;
      }

      const orderRes = await apiClient.post('/api/v1/dashboard/billing/create-order', { plan: planKey });
      const { order, razorpayKeyId } = orderRes.data;

      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: 'PropertyPro',
        description: `${planKey} plan — 30 days`,
        prefill: { email: storedUser?.email || '' },
        theme: { color: '#0c1b2e' },
        handler: async (response) => {
          try {
            await apiClient.post('/api/v1/dashboard/billing/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setMessage({ type: 'success', text: 'Payment successful! Your plan is now active.' });
            const refreshed = await apiClient.get('/api/v1/dashboard/billing/status');
            setStatus(refreshed.data.billing);
          } catch {
            setMessage({ type: 'error', text: 'Payment succeeded but verification failed. Contact support with your payment ID.' });
          }
        },
        modal: { ondismiss: () => setPayingPlan(null) },
      });

      razorpay.open();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error?.message || 'Failed to start payment.' });
    } finally {
      setPayingPlan(null);
    }
  };

  return (
    <div className="pve-modal-wrap" style={S.overlay}>
      <div className="pve-modal" style={S.modal}>
        <div style={S.stripe} />

        <div style={S.head}>
          <div>
            <p style={S.eyebrow}>Account</p>
            <h3 style={S.title}>Billing &amp; Plan</h3>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {message && (
          <div style={{
            ...S.banner,
            backgroundColor: message.type === 'error' ? '#fff5f5' : '#ecfdf5',
            color: message.type === 'error' ? '#c53030' : '#059669',
            border: `1px solid ${message.type === 'error' ? '#fed7d7' : '#a7f3d0'}`,
          }}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div style={S.loading}>Loading…</div>
        ) : (
          <div style={S.body}>
            {status && (
              <div style={S.currentPlan}>
                <div>
                  <span style={S.currentPlanLabel}>Current Plan</span>
                  <span style={S.currentPlanValue}>{status.plan}</span>
                </div>
                <span style={{
                  ...S.statusPill,
                  ...(status.subscription_status === 'active' ? S.statusActive : S.statusInactive),
                }}>
                  {status.subscription_status}
                </span>
              </div>
            )}
            {status?.current_period_end && (
              <p style={S.periodNote}>
                Valid until {new Date(status.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}

            {!isOwner ? (
              <p style={S.hint}>Only the account owner can manage billing. Ask your owner to renew or change plans.</p>
            ) : (
              <div style={S.planList}>
                {plans.map((p) => (
                  <div key={p.key} style={{ ...S.planRow, ...(p.key === status?.plan ? S.planRowActive : {}) }}>
                    <div>
                      <div style={S.planName}>{p.label}</div>
                      <div style={S.planPrice}>₹{p.priceINR.toLocaleString('en-IN')}/month</div>
                    </div>
                    <button
                      onClick={() => handlePay(p.key)}
                      disabled={payingPlan === p.key}
                      style={{ ...S.payBtn, opacity: payingPlan === p.key ? 0.6 : 1 }}
                    >
                      {payingPlan === p.key ? 'Opening…' : p.key === status?.plan ? 'Renew' : 'Switch & Pay'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
    backgroundColor: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '460px',
    boxShadow: '0 24px 72px rgba(6,12,24,0.30)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto',
  },
  stripe: { height: '4px', background: 'linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)' },
  head: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '22px 26px 16px', borderBottom: '1px solid #f1f5f9',
  },
  eyebrow: { margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1.5px' },
  title: { margin: 0, fontSize: '19px', fontWeight: '800', color: '#0c1b2e' },
  closeBtn: {
    width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', border: 'none',
    cursor: 'pointer', fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  banner: { margin: '16px 26px 0', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500' },
  loading: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' },
  body: { padding: '20px 26px 26px', display: 'flex', flexDirection: 'column', gap: '14px' },

  currentPlan: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafd', borderRadius: '12px', padding: '16px 18px', border: '1px solid #eef2f7' },
  currentPlanLabel: { display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  currentPlanValue: { fontSize: '17px', fontWeight: '800', color: '#0c1b2e', textTransform: 'capitalize' },
  statusPill: { fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '999px', textTransform: 'uppercase' },
  statusActive: { backgroundColor: '#ecfdf5', color: '#059669' },
  statusInactive: { backgroundColor: '#fff7ed', color: '#c2410c' },
  periodNote: { margin: 0, fontSize: '12px', color: '#94a3b8' },
  hint: { margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.6' },

  planList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  planRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
  },
  planRowActive: { borderColor: '#c8a96e', backgroundColor: '#fdfbf6' },
  planName: { fontSize: '14px', fontWeight: '700', color: '#0c1b2e', textTransform: 'capitalize' },
  planPrice: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  payBtn: {
    padding: '9px 16px', borderRadius: '9px', border: 'none',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
  },
};
