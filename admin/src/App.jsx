import React, { useEffect, useState } from 'react';

// CHANGE THIS ONLY IF YOUR BACKEND IS NOT ON localhost
const API_BASE_URL = 'https://panipuriapp.onrender.com/';
// e.g. const API_BASE_URL = 'http://10.129.217.137:5000';

async function apiRequest(path, method = 'GET', body, token) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // ignore JSON parse errors
  }

  if (!res.ok) {
    const msg = data?.message || `Error ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

const renderEditStatusBadge = (status) => {
  if (status === 'APPROVED') {
    return (
      <span style={{ ...styles.statusBadge, ...styles.statusApproved }}>
        ✓ Approved
      </span>
    );
  }
  if (status === 'PENDING') {
    return (
      <span style={{ ...styles.statusBadge, ...styles.statusPending }}>
        ⏳ Pending
      </span>
    );
  }
  return (
    <span style={{ ...styles.statusBadge, background: '#eee', color: '#999' }}>
      None
    </span>
  );
};

const renderStatusBadge = (status) => {
  if (status === 'APPROVED') {
    return (
      <span style={{ ...styles.statusBadge, ...styles.statusApproved }}>
        ✓ Approved
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span style={{ ...styles.statusBadge, ...styles.statusRejected }}>
        ✕ Rejected
      </span>
    );
  }
  // default / PENDING
  return (
    <span style={{ ...styles.statusBadge, ...styles.statusPending }}>
      ⏳ Pending
    </span>
  );
};

const App = () => {
  const [token, setToken] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Tabs: dashboard | vendors | offers
  const [activeTab, setActiveTab] = useState('dashboard');

  // Vendors
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState('');

  // Offers
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState('');
  const [creatingOffer, setCreatingOffer] = useState(false);
  const [newOffer, setNewOffer] = useState({
    title: '',
    description: '',
    code: '',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderAmount: 0,
    validFrom: '',
    validTo: '',
  });

  // Load token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    const storedUser = localStorage.getItem('adminUser');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setAdminUser(JSON.parse(storedUser));
    }
    setInitializing(false);
  }, []);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const data = await apiRequest(
        '/api/auth/login',
        'POST',
        { emailOrPhone: email, password },
        null
      );

      if (!data.user || data.user.role !== 'admin') {
        throw new Error('This user is not an admin');
      }

      setToken(data.accessToken);
      setAdminUser(data.user);
      localStorage.setItem('adminToken', data.accessToken);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setAdminUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  // Vendors
  const loadVendors = async () => {
    if (!token) return;
    setVendorsError('');
    setVendorsLoading(true);
    try {
      const data = await apiRequest('/api/admin/vendors', 'GET', null, token);
      setVendors(data.vendors || []);
    } catch (err) {
      setVendorsError(err.message || 'Failed to load vendors');
    } finally {
      setVendorsLoading(false);
    }
  };

  const updateVendorStatus = async (id, status) => {
    try {
      await apiRequest(
        `/api/admin/vendors/${id}/status`,
        'PATCH',
        { status },
        token
      );
      setVendors((prev) =>
        prev.map((v) => (v._id === id ? { ...v, vendorStatus: status } : v))
      );
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const approveEdit = async (id) => {
    try {
      await apiRequest(`/api/admin/vendors/${id}/approve-edit`, 'PATCH', {}, token);
      setVendors((prev) =>
        prev.map((v) => (v._id === id ? { ...v, editRequestStatus: 'APPROVED' } : v))
      );
      alert('Edit request approved successfully!');
    } catch (err) {
      alert(err.message || 'Failed to approve edit');
    }
  };

  const rejectEdit = async (id) => {
    try {
      await apiRequest(`/api/admin/vendors/${id}/reject-edit`, 'PATCH', {}, token);
      setVendors((prev) =>
        prev.map((v) => (v._id === id ? { ...v, editRequestStatus: 'NONE' } : v))
      );
      alert('Edit request rejected successfully!');
    } catch (err) {
      alert(err.message || 'Failed to reject edit');
    }
  };

  // Offers
  const loadOffers = async () => {
    if (!token) return;
    setOffersError('');
    setOffersLoading(true);
    try {
      const data = await apiRequest('/api/offers/admin', 'GET', null, token);
      setOffers(data.offers || []);
    } catch (err) {
      setOffersError(err.message || 'Failed to load offers');
    } finally {
      setOffersLoading(false);
    }
  };

  const createOffer = async (e) => {
    e.preventDefault();
    setOffersError('');
    setCreatingOffer(true);
    try {
      const body = {
        title: newOffer.title,
        description: newOffer.description,
        code: newOffer.code,
        discountType: newOffer.discountType,
        discountValue: Number(newOffer.discountValue),
        minOrderAmount: Number(newOffer.minOrderAmount) || 0,
        validFrom: newOffer.validFrom,
        validTo: newOffer.validTo,
        applicableVendors: [], // global offer
      };
      await apiRequest('/api/offers', 'POST', body, token);
      setNewOffer({
        title: '',
        description: '',
        code: '',
        discountType: 'PERCENT',
        discountValue: 10,
        minOrderAmount: 0,
        validFrom: '',
        validTo: '',
      });
      await loadOffers();
    } catch (err) {
      setOffersError(err.message || 'Failed to create offer');
    } finally {
      setCreatingOffer(false);
    }
  };

  // Load vendors & offers when token is available
  useEffect(() => {
    if (token) {
      loadVendors();
      loadOffers();
    }
  }, [token]);

  if (initializing) {
    return <div style={styles.center}>Loading...</div>;
  }

  // Not logged in -> show login
  if (!token || !adminUser) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Master Panipuri Admin</h2>
          <p style={styles.subtitle}>Login as Super Admin</p>

          {loginError && <div style={styles.error}>{loginError}</div>}

          <form onSubmit={handleLogin}>
            <div style={styles.field}>
              <label>Email</label>
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={styles.field}>
              <label>Password</label>
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button style={styles.button} type="submit" disabled={loginLoading}>
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Logged in -> dashboard
  const totalVendors = vendors.length;
  const pendingVendors = vendors.filter((v) => v.vendorStatus === 'PENDING').length;
  const approvedVendors = vendors.filter((v) => v.vendorStatus === 'APPROVED').length;
  const pendingEdits = vendors.filter((v) => v.editRequestStatus === 'PENDING').length;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1>Master Panipuri Admin</h1>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div style={styles.tabs}>
        <button
          style={activeTab === 'dashboard' ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          style={activeTab === 'vendors' ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab('vendors')}
        >
          Vendors
        </button>
        <button
          style={activeTab === 'offers' ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab('offers')}
        >
          Offers
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div style={styles.content}>
          <div style={styles.dashboardGrid}>
            <div style={styles.cardSmall}>
              <div style={styles.cardLabel}>Total Vendors</div>
              <div style={styles.cardValue}>{totalVendors}</div>
            </div>
            <div style={styles.cardSmall}>
              <div style={styles.cardLabel}>Pending Approval</div>
              <div style={styles.cardValue}>{pendingVendors}</div>
            </div>
            <div style={styles.cardSmall}>
              <div style={styles.cardLabel}>Approved Vendors</div>
              <div style={styles.cardValue}>{approvedVendors}</div>
            </div>
            <div style={styles.cardSmall}>
              <div style={styles.cardLabel}>Pending Edits</div>
              <div style={styles.cardValue}>{pendingEdits}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div style={styles.content}>
          <div style={styles.sectionHeader}>
            <h3>Vendors Management</h3>
            <button style={styles.reloadBtn} onClick={loadVendors}>
              Reload
            </button>
          </div>

          {vendorsLoading ? (
            <p>Loading vendors...</p>
          ) : vendorsError ? (
            <div style={styles.error}>{vendorsError}</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr><th>Name</th><th>Email/Phone</th><th>Stall</th><th>Vendor Status</th><th>Edit Request</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v._id}>
                    <td>{v.fullName}</td>
                    <td>{v.email}<br />{v.phone}</td>
                    <td>{v.stallName || '—'}</td>
                    <td>{renderStatusBadge(v.vendorStatus)}</td>
                    <td>{renderEditStatusBadge(v.editRequestStatus)}</td>
                    <td>
                      {v.vendorStatus !== 'APPROVED' && (
                        <button
                          style={{ ...styles.actionBtn, background: '#27ae60', borderWidth: 0 }}
                          onClick={() => updateVendorStatus(v._id, 'APPROVED')}
                        >
                          Approve
                        </button>
                      )}
                      {v.vendorStatus !== 'REJECTED' && (
                        <button
                          style={{ ...styles.actionBtn, background: '#c0392b', borderWidth: 0 }}
                          onClick={() => updateVendorStatus(v._id, 'REJECTED')}
                        >
                          Reject
                        </button>
                      )}

                      {v.editRequestStatus === 'PENDING' && (
                        <>
                          <button
                            style={{ ...styles.actionBtn, background: '#27ae60', borderWidth: 0 }}
                            onClick={() => approveEdit(v._id)}
                          >
                            Approve Edit
                          </button>
                          <button
                            style={{ ...styles.actionBtn, background: '#c0392b', borderWidth: 0 }}
                            onClick={() => rejectEdit(v._id)}
                          >
                            Reject Edit
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'offers' && (
        <div style={styles.content}>
          <div style={styles.sectionHeader}>
            <h3>Manage Offers</h3>
          </div>

          {offersLoading ? (
            <p>Loading offers...</p>
          ) : offersError ? (
            <div style={styles.error}>{offersError}</div>
          ) : (
            <>
              <h4>Create New Offer</h4>
              <form onSubmit={createOffer} style={styles.offerForm}>
                <div style={styles.fieldRow}>
                  <div style={styles.field}>
                    <label>Title</label>
                    <input
                      style={styles.input}
                      value={newOffer.title}
                      onChange={(e) =>
                        setNewOffer({ ...newOffer, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div style={styles.field}>
                    <label>Code</label>
                    <input
                      style={styles.input}
                      value={newOffer.code}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div style={styles.field}>
                  <label>Description</label>
                  <textarea
                    style={{ ...styles.input, minHeight: 60 }}
                    value={newOffer.description}
                    onChange={(e) =>
                      setNewOffer({
                        ...newOffer,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div style={styles.fieldRow}>
                  <div style={styles.field}>
                    <label>Discount Type</label>
                    <select
                      style={styles.input}
                      value={newOffer.discountType}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          discountType: e.target.value,
                        })
                      }
                    >
                      <option value="PERCENT">Percent</option>
                      <option value="FLAT">Flat</option>
                      <option value="FREE_PLATE">Free Plate</option>
                      <option value="CASHBACK">Cashback</option>
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label>Discount Value</label>
                    <input
                      style={styles.input}
                      type="number"
                      value={newOffer.discountValue}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          discountValue: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div style={styles.field}>
                    <label>Min Order Amount</label>
                    <input
                      style={styles.input}
                      type="number"
                      value={newOffer.minOrderAmount}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          minOrderAmount: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div style={styles.fieldRow}>
                  <div style={styles.field}>
                    <label>Valid From</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={newOffer.validFrom}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          validFrom: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div style={styles.field}>
                    <label>Valid To</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={newOffer.validTo}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          validTo: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <button
                  style={styles.button}
                  type="submit"
                  disabled={creatingOffer}
                >
                  {creatingOffer ? 'Creating...' : 'Create Offer'}
                </button>
              </form>

              <h4>Existing Offers</h4>
              {/* Add your offers list/table here if needed */}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  center: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff7e6',
  },
  container: {
    minHeight: '100vh',
    background: '#fff7e6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: '#fff',
    padding: 24,
    borderRadius: 12,
    border: '1px solid #ffd9a3',
    minWidth: 340,
  },
  subtitle: {
    color: '#555',
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  fieldRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  input: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #ffd9a3',
    fontFamily: 'inherit',
    fontSize: 14,
  },
  button: {
    width: '100%',
    padding: '10px 0',
    borderRadius: 8,
    border: 'none',
    background: '#ff8a00',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
  error: {
    background: '#ffe2e0',
    color: '#c0392b',
    padding: '6px 8px',
    borderRadius: 6,
    marginBottom: 8,
    fontSize: 14,
  },
  page: {
    padding: 20,
    background: '#fff7e6',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 16,
    alignItems: 'center',
  },
  logoutBtn: {
    border: 'none',
    background: '#e74c3c',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: 6,
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    padding: '8px 12px',
    borderRadius: 20,
    border: '1px solid #ffd9a3',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 14,
  },
  tabBtnActive: {
    background: '#ff8a00',
    color: '#fff',
    borderColor: '#ff8a00',
  },
  content: {
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #ffd9a3',
    marginTop: 4,
  },
  dashboardGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardSmall: {
    flex: '0 0 160px',
    background: '#fff7e6',
    borderRadius: 10,
    padding: 12,
    border: '1px solid #ffd9a3',
  },
  cardLabel: {
    fontSize: 12,
    color: '#777',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#333',
    marginTop: 4,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  actionBtn: {
    border: 'none',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    marginRight: 4,
  },
  reloadBtn: {
    border: 'none',
    background: '#ff8a00',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: 6,
    cursor: 'pointer',
  },
  offerForm: {
    marginTop: 8,
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  statusApproved: {
    background: '#e8f8f1',
    color: '#1e8449',
    border: '1px solid #1e8449',
  },
  statusPending: {
    background: '#fff9e6',
    color: '#b9770e',
    border: '1px solid #f1c40f',
  },
  statusRejected: {
    background: '#fdecea',
    color: '#c0392b',
    border: '1px solid #c0392b',
  },
};

export default App;