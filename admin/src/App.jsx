import React, { useEffect, useState } from 'react';

// 👇 CHANGE THIS ONLY IF YOUR BACKEND IS NOT ON localhost
const API_BASE_URL = 'http://10.214.234.137:5000';
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

// Status badge helper
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
        { emailOrPhone: email, password }, // matches backend
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
  const rejectedVendors = vendors.filter((v) => v.vendorStatus === 'REJECTED').length;

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h2>Master Panipuri Admin</h2>
          <p style={{ margin: 0, color: '#555' }}>
            Logged in as {adminUser.fullName} ({adminUser.email})
          </p>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'dashboard' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'vendors' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveTab('vendors')}
        >
          Vendors
        </button>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'offers' ? styles.tabBtnActive : {}),
          }}
          onClick={() => setActiveTab('offers')}
        >
          Offers
        </button>
      </div>

      <div style={styles.content}>
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            <h3>Overview</h3>
            <div style={styles.dashboardGrid}>
              <div style={styles.cardSmall}>
                <div style={styles.cardLabel}>Total Vendors</div>
                <div style={styles.cardValue}>{totalVendors}</div>
              </div>
              <div style={styles.cardSmall}>
                <div style={styles.cardLabel}>Pending Vendors</div>
                <div style={styles.cardValue}>{pendingVendors}</div>
              </div>
              <div style={styles.cardSmall}>
                <div style={styles.cardLabel}>Approved Vendors</div>
                <div style={styles.cardValue}>{approvedVendors}</div>
              </div>
              <div style={styles.cardSmall}>
                <div style={styles.cardLabel}>Rejected Vendors</div>
                <div style={styles.cardValue}>{rejectedVendors}</div>
              </div>
              <div style={styles.cardSmall}>
                <div style={styles.cardLabel}>Active Offers</div>
                <div style={styles.cardValue}>{offers.length}</div>
              </div>
            </div>
            <p style={{ marginTop: 16, color: '#555' }}>
              Use the tabs above to approve vendors and manage offers.
            </p>
          </div>
        )}

        {/* Vendors */}
        {activeTab === 'vendors' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3>Vendors</h3>
              <button style={styles.reloadBtn} onClick={loadVendors}>
                Reload Vendors
              </button>
            </div>

            {vendorsLoading && <div>Loading vendors...</div>}
            {vendorsError && <div style={styles.error}>{vendorsError}</div>}

            {!vendorsLoading && !vendors.length && <div>No vendors found.</div>}

            {!vendorsLoading && vendors.length > 0 && (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Stall</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v._id}>
                      <td>{v.fullName}</td>
                      <td>
                        <div>{v.email}</div>
                        <div>{v.phone}</div>
                      </td>
                      <td>{renderStatusBadge(v.vendorStatus)}</td>
                      <td>
                        {v.stallName ? (
                          <>
                            <div>{v.stallName}</div>
                            <div style={{ fontSize: 12, color: '#777' }}>
                              {v.stallIsOpen ? 'Open' : 'Closed'}
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: 12, color: '#999' }}>
                            No stall yet
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          style={{ ...styles.actionBtn, background: '#2ecc71' }}
                          onClick={() => updateVendorStatus(v._id, 'APPROVED')}
                        >
                          Approve
                        </button>
                        <button
                          style={{ ...styles.actionBtn, background: '#e74c3c' }}
                          onClick={() => updateVendorStatus(v._id, 'REJECTED')}
                        >
                          Reject
                        </button>
                        <button
                          style={{ ...styles.actionBtn, background: '#f1c40f' }}
                          onClick={() => updateVendorStatus(v._id, 'PENDING')}
                        >
                          Pending
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Offers */}
        {activeTab === 'offers' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3>Offers</h3>
              <button style={styles.reloadBtn} onClick={loadOffers}>
                Reload Offers
              </button>
            </div>

            {offersLoading && <div>Loading offers...</div>}
            {offersError && <div style={styles.error}>{offersError}</div>}

            {!offersLoading && offers.length > 0 && (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min Amount</th>
                    <th>Valid</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((o) => (
                    <tr key={o._id}>
                      <td>{o.code}</td>
                      <td>{o.title}</td>
                      <td>{o.discountType}</td>
                      <td>{o.discountValue}</td>
                      <td>{o.minOrderAmount}</td>
                      <td>
                        {o.validFrom?.slice(0, 10)} - {o.validTo?.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!offersLoading && !offers.length && (
              <div>No offers created yet.</div>
            )}

            {/* Create offer form */}
            <div style={{ marginTop: 24 }}>
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
            </div>
          </div>
        )}
      </div>
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
