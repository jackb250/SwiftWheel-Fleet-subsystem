import React, { useState, useEffect } from 'react';
import { 
  Car, Users, Percent, FileText, LogIn, LogOut, 
  Search, Plus, Edit, Trash2, Save, X, Printer, Check 
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vehicles');
  const [alerts, setAlerts] = useState([]);

  // Add notification alert
  const addAlert = (message, type = 'success') => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 4000);
  };

  // Check Session on Mount
  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not logged in');
      })
      .then(data => {
        setUser(data.user);
        setAuthLoading(false);
      })
      .catch(() => {
        setUser(null);
        setAuthLoading(false);
      });
  }, []);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0c081d', color: '#fff' }}>
        <div style={{ fontFamily: 'sans-serif', fontSize: '1.2rem', opacity: 0.8 }}>Initializing PMS Subsystem...</div>
      </div>
    );
  }

  return (
    <>
      {/* Alerts Overlay */}
      <div className="alert-container">
        {alerts.map(a => (
          <div key={a.id} className={`alert alert-${a.type}`}>
            <Check size={18} />
            <span>{a.message}</span>
          </div>
        ))}
      </div>

      {!user ? (
        <LoginView setUser={setUser} addAlert={addAlert} />
      ) : (
        <div className="app-container">
          <Sidebar user={user} setUser={setUser} activeTab={activeTab} setActiveTab={setActiveTab} addAlert={addAlert} />
          <main className="main-content">
            {activeTab === 'vehicles' && <VehiclesView addAlert={addAlert} />}
            {activeTab === 'customers' && <CustomersView addAlert={addAlert} />}
            {activeTab === 'promotions' && <PromotionsView addAlert={addAlert} />}
            {activeTab === 'reports' && <ReportsView />}
          </main>
        </div>
      )}
    </>
  );
}

/* ==========================================================================
   1. LOGIN COMPONENT
   ========================================================================== */
function LoginView({ setUser, addAlert }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      addAlert('Please enter both username and password.', 'error');
      return;
    }

    setLoading(true);
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ UserName: username, Password: password }),
      credentials: 'include'
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        return data;
      })
      .then(data => {
        setUser(data.user);
        addAlert(`Welcome back, ${data.user.UserName}!`);
      })
      .catch(err => {
        addAlert(err.message, 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="login-container">
      <div className="glass-card login-card">
        <div className="login-header">
          <div className="login-logo">
            <Car size={28} color="#fff" />
          </div>
          <h2 className="login-title">SwiftWheels</h2>
          <p className="login-subtitle">Promotion & Marketing Subsystem</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input 
              id="username"
              type="text" 
              className="form-control" 
              placeholder="Enter your username" 
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              className="form-control" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. SIDEBAR COMPONENT
   ========================================================================== */
function Sidebar({ user, setUser, activeTab, setActiveTab, addAlert }) {
  const handleLogout = () => {
    fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
      .then(() => {
        setUser(null);
        addAlert('Logged out successfully');
      })
      .catch(() => {
        addAlert('Error logging out', 'error');
      });
  };

  return (
    <aside className="sidebar">
      <div>
        <div className="brand-section">
          <div className="brand-logo">
            <Car size={20} color="#fff" />
          </div>
          <span className="brand-name">SwiftWheels PMS</span>
        </div>
        <ul className="nav-menu">
          <li 
            className={`nav-item ${activeTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicles')}
          >
            <Car />
            <span>Vehicles</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <Users />
            <span>Customers</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'promotions' ? 'active' : ''}`}
            onClick={() => setActiveTab('promotions')}
          >
            <Percent />
            <span>Promotions</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FileText />
            <span>Reports</span>
          </li>
        </ul>
      </div>

      <div className="user-profile-section">
        <div className="user-info">
          <span className="user-name">{user.UserName}</span>
          <span className="user-role">{user.Role}</span>
        </div>
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

/* ==========================================================================
   3. VEHICLES VIEW (CRUD)
   ========================================================================== */
function VehiclesView({ addAlert }) {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState('SUV');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('Available');

  const fetchVehicles = () => {
    fetch(`${API_BASE}/vehicles?search=${encodeURIComponent(search)}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setVehicles(data))
      .catch(() => addAlert('Failed to fetch vehicles', 'error'));
  };

  useEffect(() => {
    fetchVehicles();
  }, [search]);

  const openAddModal = () => {
    setIsEditing(false);
    setPlate('');
    setBrand('');
    setModel('');
    setYear(new Date().getFullYear());
    setType('SUV');
    setPrice('');
    setStatus('Available');
    setShowModal(true);
  };

  const openEditModal = (v) => {
    setIsEditing(true);
    setPlate(v.Plate_Number);
    setBrand(v.Brand);
    setModel(v.Model);
    setYear(v.Year);
    setType(v.Vehicle_Type);
    setPrice(v.Purchase_Price);
    setStatus(v.Status);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!plate || !brand || !model || !year || !type || !price || !status) {
      addAlert('Please fill out all fields.', 'error');
      return;
    }

    const payload = {
      Plate_Number: plate,
      Brand: brand,
      Model: model,
      Year: Number(year),
      Vehicle_Type: type,
      Purchase_Price: Number(price),
      Status: status
    };

    const url = isEditing ? `${API_BASE}/vehicles/${encodeURIComponent(plate)}` : `${API_BASE}/vehicles`;
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Operation failed');
        return data;
      })
      .then(() => {
        addAlert(`Vehicle ${isEditing ? 'updated' : 'added'} successfully!`);
        setShowModal(false);
        fetchVehicles();
      })
      .catch(err => {
        addAlert(err.message, 'error');
      });
  };

  const handleDelete = (plateNumber) => {
    if (!window.confirm(`Are you sure you want to delete vehicle ${plateNumber}?`)) return;

    fetch(`${API_BASE}/vehicles/${encodeURIComponent(plateNumber)}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete');
        return data;
      })
      .then(() => {
        addAlert('Vehicle deleted successfully');
        fetchVehicles();
      })
      .catch(err => {
        addAlert(err.message, 'error');
      });
  };

  return (
    <div>
      <div className="header-container">
        <h1 className="view-title">Vehicles Manager</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add Vehicle</span>
        </button>
      </div>

      <div className="filter-row">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by plate number, brand, model, type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card">
        <div className="table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Plate Number</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Year</th>
                <th>Type</th>
                <th>Purchase Price</th>
                <th>Status</th>
                <th>Registered By</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: '#6e6a94', padding: '30px' }}>
                    No vehicles found.
                  </td>
                </tr>
              ) : (
                vehicles.map(v => (
                  <tr key={v.Plate_Number}>
                    <td style={{ fontWeight: 'bold' }}>{v.Plate_Number}</td>
                    <td>{v.Brand}</td>
                    <td>{v.Model}</td>
                    <td>{v.Year}</td>
                    <td>{v.Vehicle_Type}</td>
                    <td>{v.Purchase_Price.toLocaleString()} RWF</td>
                    <td>
                      <span className={`badge badge-${v.Status.toLowerCase() === 'available' ? 'active' : 'inactive'}`}>
                        {v.Status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#a5a1c9' }}>{v.Registered_By_Name || 'System'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button className="btn-icon" onClick={() => openEditModal(v)} title="Edit Vehicle">
                          <Edit size={16} />
                        </button>
                        <button className="btn-icon" style={{ color: '#fca5a5' }} onClick={() => handleDelete(v.Plate_Number)} title="Delete Vehicle">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DIALOG */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{isEditing ? 'Edit Vehicle Details' : 'Register New Vehicle'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Plate Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. RAA 101 A"
                  value={plate}
                  onChange={e => setPlate(e.target.value)}
                  disabled={isEditing}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Toyota"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Rav4"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="e.g. 2022"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                    <option value="SUV">SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Pickup">Pickup</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Purchase Price (RWF)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="e.g. 25000000"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="Available">Available</option>
                    <option value="Rented">Rented</option>
                    <option value="Sold">Sold</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>{isEditing ? 'Save Changes' : 'Register'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   4. CUSTOMERS VIEW (CRUD + INTEREST MAPPING)
   ========================================================================== */
function CustomersView({ addAlert }) {
  const [customers, setCustomers] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Customer Form state
  const [currentId, setCurrentId] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Active');

  // Customer Interest state
  const [interestPlates, setInterestPlates] = useState([]);

  const fetchCustomers = () => {
    fetch(`${API_BASE}/customers?search=${encodeURIComponent(search)}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(() => addAlert('Failed to fetch customers', 'error'));
  };

  const fetchAllVehicles = () => {
    fetch(`${API_BASE}/vehicles`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setAllVehicles(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCustomers();
    fetchAllVehicles();
  }, [search]);

  const openAddModal = () => {
    setIsEditing(false);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setStatus('Active');
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setIsEditing(true);
    setCurrentId(c.id);
    setFirstName(c.FirstName);
    setLastName(c.LastName);
    setEmail(c.Email);
    setPhone(c.PhoneNumber);
    setStatus(c.Status);
    setShowModal(true);
  };

  const openInterestModal = (c) => {
    setCurrentId(c.id);
    setFirstName(c.FirstName);
    setLastName(c.LastName);
    setInterestPlates([]);
    
    // Fetch current customer interests
    fetch(`${API_BASE}/customers/${c.id}/interests`, { credentials: 'include' })
      .then(res => res.json())
      .then(plates => {
        setInterestPlates(plates);
        setShowInterestModal(true);
      })
      .catch(() => {
        addAlert('Failed to load interests', 'error');
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone || !status) {
      addAlert('All fields are required.', 'error');
      return;
    }

    const payload = {
      FirstName: firstName,
      LastName: lastName,
      Email: email,
      PhoneNumber: phone,
      Status: status
    };

    const url = isEditing ? `${API_BASE}/customers/${currentId}` : `${API_BASE}/customers`;
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Operation failed');
        return data;
      })
      .then(() => {
        addAlert(`Customer ${isEditing ? 'updated' : 'added'} successfully!`);
        setShowModal(false);
        fetchCustomers();
      })
      .catch(err => {
        addAlert(err.message, 'error');
      });
  };

  const handleSaveInterests = (e) => {
    e.preventDefault();
    fetch(`${API_BASE}/customers/${currentId}/interests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicles: interestPlates }),
      credentials: 'include'
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Operation failed');
        return data;
      })
      .then(() => {
        addAlert('Customer vehicle interests updated!');
        setShowInterestModal(false);
      })
      .catch(err => {
        addAlert(err.message, 'error');
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete');
        return data;
      })
      .then(() => {
        addAlert('Customer deleted successfully');
        fetchCustomers();
      })
      .catch(err => {
        addAlert(err.message, 'error');
      });
  };

  const toggleInterest = (plate) => {
    setInterestPlates(prev => 
      prev.includes(plate) ? prev.filter(p => p !== plate) : [...prev, plate]
    );
  };

  return (
    <div>
      <div className="header-container">
        <h1 className="view-title">Customers CRM</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="filter-row">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by customer name, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card">
        <div className="table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Registered At</th>
                <th>Status</th>
                <th>Managed By</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#6e6a94', padding: '30px' }}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 'bold' }}>{c.FirstName} {c.LastName}</td>
                    <td>{c.Email}</td>
                    <td>{c.PhoneNumber}</td>
                    <td>{new Date(c.CreatedAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${c.Status.toLowerCase() === 'active' ? 'active' : c.Status.toLowerCase() === 'inactive' ? 'inactive' : 'blocked'}`}>
                        {c.Status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#a5a1c9' }}>{c.Registered_By_Name || 'System'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openInterestModal(c)}>
                          Interests
                        </button>
                        <button className="btn-icon" onClick={() => openEditModal(c)} title="Edit Customer">
                          <Edit size={16} />
                        </button>
                        <button className="btn-icon" style={{ color: '#fca5a5' }} onClick={() => handleDelete(c.id)} title="Delete Customer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{isEditing ? 'Edit Customer Info' : 'Register Customer'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Jean"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Rwandarugari"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="e.g. jean@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 0788123456"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>{isEditing ? 'Save Changes' : 'Register'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTEREST MAPPING MODAL */}
      {showInterestModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Vehicle Interests</h2>
              <button className="btn-icon" onClick={() => setShowInterestModal(false)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: '#a5a1c9', marginBottom: '16px', fontSize: '0.9rem' }}>
              Select the vehicles that <strong>{firstName} {lastName}</strong> is interested in purchasing or renting:
            </p>
            <form onSubmit={handleSaveInterests}>
              <div className="relation-checklist-grid" style={{ maxHeight: '320px', marginBottom: '24px' }}>
                {allVehicles.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#6e6a94', padding: '16px' }}>
                    No vehicles registered in the system.
                  </div>
                ) : (
                  allVehicles.map(v => (
                    <label key={v.Plate_Number} className="relation-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={interestPlates.includes(v.Plate_Number)}
                        onChange={() => toggleInterest(v.Plate_Number)}
                        style={{ marginRight: '6px', accentColor: '#a855f7' }}
                      />
                      <span>
                        <strong>{v.Plate_Number}</strong> <br/>
                        <span style={{ fontSize: '0.75rem', color: '#a5a1c9' }}>{v.Brand} {v.Model}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInterestModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>Save Interests</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   5. PROMOTIONS VIEW (CRUD + VEHICLE MAPPING + PERFORMANCE)
   ========================================================================== */
function PromotionsView({ addAlert }) {
  const [promotions, setPromotions] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [currentId, setCurrentId] = useState(null);
  const [title, setTitle] = useState('New Year sale');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Active');

  // Mapping state: array of { Plate_Number, Selected: boolean, Performance: string }
  const [mappingList, setMappingList] = useState([]);

  const fetchPromotions = () => {
    fetch(`${API_BASE}/promotions?search=${encodeURIComponent(search)}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setPromotions(data))
      .catch(() => addAlert('Failed to fetch promotions', 'error'));
  };

  const fetchAllVehicles = () => {
    fetch(`${API_BASE}/vehicles`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setAllVehicles(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchPromotions();
    fetchAllVehicles();
  }, [search]);

  const openAddModal = () => {
    setIsEditing(false);
    setTitle('New Year sale');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('');
    setStartDate('');
    setEndDate('');
    setStatus('Active');
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setIsEditing(true);
    setCurrentId(p.id);
    setTitle(p.Title);
    setDescription(p.Description);
    setDiscountType(p.Discount_Type);
    setDiscountValue(p.Discount_Value);
    setStartDate(p.Start_Date);
    setEndDate(p.End_Date);
    setStatus(p.Status);
    setShowModal(true);
  };

  const openMappingModal = (p) => {
    setCurrentId(p.id);
    setTitle(p.Title);
    
    // Fetch currently mapped vehicles for promotion
    fetch(`${API_BASE}/promotions/${p.id}/vehicles`, { credentials: 'include' })
      .then(res => res.json())
      .then(mapped => {
        // Build selection grid state combining all vehicles
        const list = allVehicles.map(v => {
          const mapInfo = mapped.find(m => m.Vehicle_Plate_Number === v.Plate_Number);
          return {
            Plate_Number: v.Plate_Number,
            Brand: v.Brand,
            Model: v.Model,
            Selected: !!mapInfo,
            Performance: mapInfo ? mapInfo.Performance : 'Medium'
          };
        });
        setMappingList(list);
        setShowMappingModal(true);
      })
      .catch(() => {
        addAlert('Failed to load promotions mappings', 'error');
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !discountType || discountValue === '' || !startDate || !endDate || !status) {
      addAlert('Required fields are missing.', 'error');
      return;
    }

    const payload = {
      Title: title,
      Description: description,
      Discount_Type: discountType,
      Discount_Value: Number(discountValue),
      Start_Date: startDate,
      End_Date: endDate,
      Status: status
    };

    const url = isEditing ? `${API_BASE}/promotions/${currentId}` : `${API_BASE}/promotions`;
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Operation failed');
        return data;
      })
      .then(() => {
        addAlert(`Promotion ${isEditing ? 'updated' : 'added'} successfully!`);
        setShowModal(false);
        fetchPromotions();
      })
      .catch(err => {
        addAlert(err.message, 'error');
      });
  };

  const handleSaveMapping = (e) => {
    e.preventDefault();
    // Filter out only selected items
    const selectedVehicles = mappingList
      .filter(item => item.Selected)
      .map(item => ({ Plate_Number: item.Plate_Number, Performance: item.Performance }));

    fetch(`${API_BASE}/promotions/${currentId}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicles: selectedVehicles }),
      credentials: 'include'
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Operation failed');
        return data;
      })
      .then(() => {
        addAlert('Promotion vehicle links and performances updated!');
        setShowMappingModal(false);
      })
      .catch(err => {
        addAlert(err.message, 'error');
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;

    fetch(`${API_BASE}/promotions/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete');
        return data;
      })
      .then(() => {
        addAlert('Promotion deleted successfully');
        fetchPromotions();
      })
      .catch(err => {
        addAlert(err.message, 'error');
      });
  };

  const toggleMappingSelect = (index) => {
    const list = [...mappingList];
    list[index].Selected = !list[index].Selected;
    setMappingList(list);
  };

  const handleMappingPerformanceChange = (index, val) => {
    const list = [...mappingList];
    list[index].Performance = val;
    setMappingList(list);
  };

  const formatDiscount = (val, type) => {
    if (type === 'percentage') return `${val}%`;
    if (type === 'free') return 'Free';
    if (type === 'BUY_ONE_GET_ONE') return 'BOGO';
    return `${val.toLocaleString()} RWF`;
  };

  return (
    <div>
      <div className="header-container">
        <h1 className="view-title">Promotions</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Create Promotion</span>
        </button>
      </div>

      <div className="filter-row">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by promotion title, description, type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card">
        <div className="table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Promotion Title</th>
                <th>Discount Details</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Created By</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#6e6a94', padding: '30px' }}>
                    No promotions found.
                  </td>
                </tr>
              ) : (
                promotions.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 'bold' }}>{p.Title}</td>
                    <td>
                      <span style={{ fontSize: '0.9rem', color: '#ec4899', fontWeight: 'bold' }}>
                        {formatDiscount(p.Discount_Value, p.Discount_Type)}
                      </span> <br/>
                      <span style={{ fontSize: '0.8rem', color: '#a5a1c9' }}>Type: {p.Discount_Type}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {p.Start_Date} to {p.End_Date}
                    </td>
                    <td>
                      <span className={`badge badge-${p.Status.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                        {p.Status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#a5a1c9' }}>{p.Created_By_Name || 'System'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openMappingModal(p)}>
                          Apply to Vehicles
                        </button>
                        <button className="btn-icon" onClick={() => openEditModal(p)} title="Edit Promotion">
                          <Edit size={16} />
                        </button>
                        <button className="btn-icon" style={{ color: '#fca5a5' }} onClick={() => handleDelete(p.id)} title="Delete Promotion">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{isEditing ? 'Modify Promotion Details' : 'Create Promotion Campaign'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Promotion Title</label>
                <select className="form-control" value={title} onChange={e => setTitle(e.target.value)}>
                  <option value="New Year sale">New Year sale</option>
                  <option value="Holiday Price Slash">Holiday Price Slash</option>
                  <option value="Weekend Flash Sale">Weekend Flash Sale</option>
                  <option value="Clearance Discount Offer">Clearance Discount Offer</option>
                  <option value="Seasonal Price Drop">Seasonal Price Drop</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description / Tagline</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  placeholder="Describe the offer details..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select className="form-control" value={discountType} onChange={e => setDiscountType(e.target.value)}>
                    <option value="free">free</option>
                    <option value="percentage">percentage</option>
                    <option value="FLAT_RATE">FLAT_RATE</option>
                    <option value="CASHBACK">CASHBACK</option>
                    <option value="BUY_ONE_GET_ONE">BUY_ONE_GET_ONE</option>
                    <option value="Bundle">Bundle</option>
                    <option value="amount">amount</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Value</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="e.g. 10 or 5000"
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>{isEditing ? 'Save Changes' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAPPING AND PERFORMANCE MODAL */}
      {showMappingModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Apply Promotion & Evaluate</h2>
              <button className="btn-icon" onClick={() => setShowMappingModal(false)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: '#a5a1c9', marginBottom: '16px', fontSize: '0.9rem' }}>
              Select which vehicles are subject to the <strong>"{title}"</strong> campaign and grade their market performance:
            </p>
            <form onSubmit={handleSaveMapping}>
              <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border-glass)', borderRadius: '10px', marginBottom: '24px' }}>
                <table className="glass-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Apply</th>
                      <th>Vehicle Description</th>
                      <th>Promo Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappingList.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: '#6e6a94', padding: '16px' }}>
                          No vehicles available to link.
                        </td>
                      </tr>
                    ) : (
                      mappingList.map((item, index) => (
                        <tr key={item.Plate_Number}>
                          <td>
                            <input 
                              type="checkbox" 
                              checked={item.Selected}
                              onChange={() => toggleMappingSelect(index)}
                              style={{ accentColor: '#a855f7', width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                          </td>
                          <td>
                            <strong>{item.Plate_Number}</strong> <br/>
                            <span style={{ fontSize: '0.8rem', color: '#a5a1c9' }}>{item.Brand} - {item.Model}</span>
                          </td>
                          <td>
                            <select 
                              className="form-control" 
                              style={{ padding: '6px 12px', fontSize: '0.85rem' }} 
                              value={item.Performance}
                              onChange={(e) => handleMappingPerformanceChange(index, e.target.value)}
                              disabled={!item.Selected}
                            >
                              <option value="High">High Performance</option>
                              <option value="Medium">Medium Performance</option>
                              <option value="Low">Low Performance</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMappingModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>Save Applications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   6. REPORTS VIEW
   ========================================================================== */
function ReportsView() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchReport = () => {
    setLoading(true);
    fetch(`${API_BASE}/reports`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setReportData(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const formatDiscount = (val, type) => {
    if (type === 'percentage') return `${val}%`;
    if (type === 'free') return 'Free';
    if (type === 'BUY_ONE_GET_ONE') return 'BOGO';
    return `${val.toLocaleString()} RWF`;
  };

  const filteredData = reportData.filter(row => {
    const term = search.toLowerCase();
    return (
      row.Customer_Name.toLowerCase().includes(term) ||
      row.Vehicle_Brand.toLowerCase().includes(term) ||
      row.Vehicle_Model.toLowerCase().includes(term) ||
      row.Promotion_Title.toLowerCase().includes(term) ||
      row.Performance.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="header-container report-actions">
        <h1 className="view-title">Marketing Interest Report</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={fetchReport}>Refresh</button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      <div className="filter-row report-actions">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search report entries by customer, vehicle, promotion..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card">
        {/* Printable Area Layout Wrapper */}
        <div className="report-header">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>SwiftWheels CRM Intelligence</h2>
          <p className="report-subtitle">Matching Customer Interests with Active Promotion Offerings</p>
          <div className="report-meta">
            <span>Location: Huye City, Southern Province, Rwanda</span>
            <span>Generated: {new Date().toLocaleString()}</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#a5a1c9', padding: '30px' }}>Loading matching engine...</div>
        ) : filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6e6a94', padding: '30px' }}>
            No promotion matches found for customer interests. (Hint: Link a Customer to a Vehicle, and Link that Vehicle to a Promotion!)
          </div>
        ) : (
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Interested Brand</th>
                  <th>Interested Model</th>
                  <th>Promotion Campaign</th>
                  <th>Discount Value</th>
                  <th>Promo Performance Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 'bold' }}>{row.Customer_Name}</td>
                    <td>{row.Vehicle_Brand}</td>
                    <td>{row.Vehicle_Model}</td>
                    <td style={{ color: '#a855f7', fontWeight: 600 }}>{row.Promotion_Title}</td>
                    <td style={{ fontWeight: 'bold', color: '#ec4899' }}>{formatDiscount(row.Discount_Value, row.Discount_Type)}</td>
                    <td>
                      <span className="badge badge-performance">
                        {row.Performance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
