import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import ChangePassword from './ChangePassword.jsx';
import PlotBoundaryTracer from './PlotBoundaryTracer'; // Visual perimeter tracer component built in Phase 2

export default function DashboardListings() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('pve_user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('pve_token');
    localStorage.removeItem('pve_user');
    navigate('/login');
  };

  // Inventory and Dashboard Metric States
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal & Management States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTracerListing, setActiveTracerListing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    raw_address: '',
    price: '',
    plot_area: '',
    property_type: 'Plot',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchTenantListings();
  }, []);

  const fetchTenantListings = async () => {
    try {
      setLoading(true);
      // Fetches current listings — apiClient attaches the JWT bearer token
      const response = await apiClient.get('/api/v1/dashboard/listings');
      setListings(response.data.listings || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to sync backoffice property inventory.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/api/v1/dashboard/listings', formData);
      setShowCreateModal(false);
      setFormData({ title: '', raw_address: '', price: '', plot_area: '', property_type: 'Plot', description: '' });
      fetchTenantListings(); // Refresh inventory snapshot grid
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Error executing resource allocation schema write.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyStorefrontLink = (slug) => {
    const publicUrl = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(publicUrl);
    alert('Public interactive storefront link copied to clipboard.');
  };

  if (loading) return <div style={styles.centerText}>Syncing Enterprise Datasets...</div>;
  if (error) return <div style={styles.centerText}>System Error: {error}</div>;

  return (
    <div style={styles.dashboardContainer}>
      {/* Upper Overview Metrics Action Panel bar */}
      <header style={styles.dashboardHeader}>
        <div>
          <h2 style={styles.headerTitle}>Verified Property Inventory</h2>
          <p style={styles.headerSub}>Manage your localized land plots, monitor tracking engagement, and map out geometric boundaries.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {storedUser && <span style={styles.userLabel}>{storedUser.name} · {storedUser.businessName}</span>}
          <button onClick={() => setShowCreateModal(true)} style={styles.primaryActionBtn}>
            + Register New Plot
          </button>
          <button onClick={() => setShowPasswordModal(true)} style={styles.changePasswordBtn}>
            ⚙️ Change Password
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>Log out</button>
        </div>
      </header>

      {showPasswordModal && <ChangePassword onClose={() => setShowPasswordModal(false)} />}

      {/* Main Interactive Inventory Grid Matrix */}
      <div style={styles.gridContainer}>
        {listings.map((item) => (
          <div key={item.id} style={styles.listingCard}>
            <div style={styles.cardHeader}>
              <span style={{...styles.statusBadge, backgroundColor: item.status === 'active' ? '#e8f5e9' : '#fff3e0', color: item.status === 'active' ? '#2e7d32' : '#ef6c00'}}>
                {item.status}
              </span>
              <span style={styles.propertyTypeLabel}>{item.property_type}</span>
            </div>
            <h4 style={styles.cardTitle}>{item.title}</h4>
            <p style={styles.cardAddress}>📍 {item.formatted_address || item.raw_address}</p>
            
            <div style={styles.metaRow}>
              <div><strong>Area:</strong> {item.plot_area || 'N/A'}</div>
              <div><strong>Valuation:</strong> ₹{parseFloat(item.price).toLocaleString('en-IN')}</div>
            </div>

            {/* Interaction Analytics Counter row */}
            <div style={styles.analyticsRow}>
              <span>📈 Views logged: <strong>{item.visit_count || 0}</strong></span>
            </div>

            <div style={styles.cardActions}>
              <button onClick={() => copyStorefrontLink(item.public_slug)} style={styles.secondaryBtn}>
                🔗 Copy Link
              </button>
              <button 
                onClick={() => setActiveTracerListing(item)} 
                disabled={item.status !== 'active'}
                style={{...styles.secondaryBtn, border: '1px solid #2563eb', color: '#2563eb'}}
              >
                🗺️ Trace Perimeter
              </button>
            </div>
          </div>
        ))}
      </div>

      {listings.length === 0 && (
        <div style={styles.emptyContainer}>No active listings cataloged inside this corporate dashboard context yet.</div>
      )}

      {/* 🛠️ MODAL LAYER A: Property Asset Registration Creator Drawer */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Register Real Estate Asset</h3>
            <form onSubmit={handleCreateSubmit} style={styles.formContainer}>
              <input type="text" name="title" placeholder="Listing Title Name (e.g., Omaxe Royal Villa 230)" value={formData.title} onChange={handleInputChange} required style={styles.input} />
              <input type="text" name="raw_address" placeholder="Raw Local Address (e.g., Pakhowal Road, near Canal, Ludhiana)" value={formData.raw_address} onChange={handleInputChange} required style={styles.input} />
              <input type="number" name="price" placeholder="Target Pricing Valuation (INR)" value={formData.price} onChange={handleInputChange} required style={styles.input} />
              <input type="text" name="plot_area" placeholder="Plot Dimensions / Area (e.g., 250 Sq Yards)" value={formData.plot_area} onChange={handleInputChange} style={styles.input} />
              <select name="property_type" value={formData.property_type} onChange={handleInputChange} style={styles.input}>
                <option value="Plot">Plot Land Matrix</option>
                <option value="Villa">Residential Villa</option>
                <option value="Commercial">Commercial Complex</option>
              </select>
              <textarea name="description" placeholder="Comprehensive contextual sales descriptions..." value={formData.description} onChange={handleInputChange} style={{...styles.input, height: '80px'}} />
              
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={submitting} style={styles.submitBtn}>{submitting ? 'Registering...' : 'Add Property Row'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🛠️ MODAL LAYER B: Google Maps satellite plot boundary tracer */}
      {activeTracerListing && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '800px', width: '90%'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
              <h3>Trace Geometry Framework — {activeTracerListing.title}</h3>
              <button onClick={() => setActiveTracerListing(null)} style={styles.cancelBtn}>Close Canvas</button>
            </div>
            <PlotBoundaryTracer 
              listingId={activeTracerListing.id} 
              centerLat={parseFloat(activeTracerListing.lat)} 
              centerLng={parseFloat(activeTracerListing.lng)}
              onSaveSuccess={() => setActiveTracerListing(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  dashboardContainer: { padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  dashboardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #eaeaea', paddingBottom: '16px' },
  headerTitle: { margin: 0, fontSize: '24px', color: '#111' },
  headerSub: { margin: '4px 0 0 0', color: '#666', fontSize: '14px' },
  primaryActionBtn: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  userLabel: { fontSize: '13px', color: '#6b7280' },
  logoutBtn: { backgroundColor: '#fff', color: '#4b5563', border: '1px solid #d1d5db', padding: '9px 16px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' },
  changePasswordBtn: { border: 'none', background: 'none', color: '#4b5563', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
  listingCard: { border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  statusBadge: { fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' },
  propertyTypeLabel: { fontSize: '12px', color: '#666', fontWeight: '500' },
  cardTitle: { margin: '0 0 8px 0', fontSize: '18px', color: '#111' },
  cardAddress: { margin: '0 0 12px 0', fontSize: '13px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  metaRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px', marginBottom: '12px' },
  analyticsRow: { fontSize: '13px', color: '#4b5563', borderTop: '1px solid #f0f0f0', paddingTop: '8px', marginBottom: '16px' },
  cardActions: { display: 'flex', gap: '12px' },
  secondaryBtn: { flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500', textAlign: 'center' },
  emptyContainer: { textAlign: 'center', padding: '48px', color: '#888', fontStyle: 'italic', border: '1px dashed #ccc', borderRadius: '8px', marginTop: '24px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', padding: '24px', borderRadius: '8px', maxWidth: '500px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' },
  formContainer: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' },
  input: { padding: '10px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' },
  cancelBtn: { padding: '8px 16px', border: 'none', backgroundColor: '#eee', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '8px 16px', border: 'none', backgroundColor: '#2563eb', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  centerText: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', fontSize: '16px', color: '#555' }
};