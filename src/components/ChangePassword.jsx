import React, { useState } from 'react';
import apiClient from '../api/apiClient';

export default function ChangePassword({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    try {
      setLoading(true);
      setStatusMessage(null);
      setIsError(false);

      // apiClient attaches the JWT — this endpoint is authGuard-protected.
      await apiClient.post('/api/v1/auth/change-password', { currentPassword, newPassword });

      setStatusMessage('✅ Password updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setIsError(true);
      setStatusMessage(`⚠️ ${err.response?.data?.error?.message || 'Something went wrong.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.cardContainer}>
        <div style={styles.headerRow}>
          <h3 style={styles.title}>Change Password</h3>
          <button onClick={onClose} style={styles.closeX}>&times;</button>
        </div>

        {statusMessage && (
          <div style={{ ...styles.banner, backgroundColor: isError ? '#fef2f2' : '#f0fdf4', color: isError ? '#991b1b' : '#166534' }}>
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.formElement}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={styles.textInput} required />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={styles.textInput} required />
          </div>
          <div style={styles.btnRow}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>{loading ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,24,39,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' },
  cardContainer: { backgroundColor: '#fff', borderRadius: '8px', width: '100%', maxWidth: '400px', padding: '20px', boxSizing: 'border-box' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  title: { margin: 0, fontSize: '16px', color: '#111827', fontWeight: '600' },
  closeX: { border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' },
  banner: { padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' },
  formElement: { display: 'flex', flexDirection: 'column', gap: '14px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase' },
  textInput: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' },
  btnRow: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' },
  cancelBtn: { padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px' },
  submitBtn: { padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }
};
