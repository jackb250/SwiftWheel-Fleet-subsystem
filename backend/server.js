const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with Credentials
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Session Middleware
app.use(session({
  secret: 'swiftwheels_secret_session_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Auth check middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
};

// --- AUTH ROUTES ---

// Login
app.post('/api/auth/login', (req, res) => {
  const { UserName, Password } = req.body;
  if (!UserName || !Password) {
    return res.status(400).json({ error: 'Username and Password are required.' });
  }

  try {
    const query = db.prepare('SELECT * FROM Users WHERE UserName = ?');
    const user = query.get(UserName);

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const isMatch = bcrypt.compareSync(Password, user.Password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // Store in session
    req.session.user = {
      id: user.id,
      UserName: user.UserName,
      Role: user.Role
    };

    return res.json({ message: 'Login successful', user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out.' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
});

// Check Session Status / Current User
app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'No active session' });
  }
});


// --- VEHICLES CRUD ROUTES ---

// Get all vehicles
app.get('/api/vehicles', requireAuth, (req, res) => {
  const search = req.query.search || '';
  try {
    const stmt = db.prepare(`
      SELECT v.*, u.UserName as Registered_By_Name 
      FROM Vehicle v 
      LEFT JOIN Users u ON v.Registered_By = u.id
      WHERE v.Plate_Number LIKE ? OR v.Brand LIKE ? OR v.Model LIKE ? OR v.Vehicle_Type LIKE ?
    `);
    const searchVal = `%${search}%`;
    const rows = stmt.all(searchVal, searchVal, searchVal, searchVal);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching vehicles.' });
  }
});

// Add a vehicle
app.post('/api/vehicles', requireAuth, (req, res) => {
  const { Plate_Number, Brand, Model, Year, Vehicle_Type, Purchase_Price, Status } = req.body;
  
  if (!Plate_Number || !Brand || !Model || !Year || !Vehicle_Type || !Purchase_Price || !Status) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO Vehicle (Plate_Number, Brand, Model, Year, Vehicle_Type, Purchase_Price, Status, Registered_By)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(Plate_Number, Brand, Model, Number(Year), Vehicle_Type, Number(Purchase_Price), Status, req.session.user.id);
    res.status(201).json({ message: 'Vehicle added successfully', Plate_Number });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Plate number already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database error adding vehicle.' });
  }
});

// Update a vehicle
app.put('/api/vehicles/:plate', requireAuth, (req, res) => {
  const { Brand, Model, Year, Vehicle_Type, Purchase_Price, Status } = req.body;
  const plate = req.params.plate;

  if (!Brand || !Model || !Year || !Vehicle_Type || !Purchase_Price || !Status) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const update = db.prepare(`
      UPDATE Vehicle 
      SET Brand = ?, Model = ?, Year = ?, Vehicle_Type = ?, Purchase_Price = ?, Status = ?
      WHERE Plate_Number = ?
    `);
    const result = update.run(Brand, Model, Number(Year), Vehicle_Type, Number(Purchase_Price), Status, plate);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    
    res.json({ message: 'Vehicle updated successfully', Plate_Number: plate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error updating vehicle.' });
  }
});

// Delete a vehicle
app.delete('/api/vehicles/:plate', requireAuth, (req, res) => {
  const plate = req.params.plate;
  try {
    const del = db.prepare('DELETE FROM Vehicle WHERE Plate_Number = ?');
    const result = del.run(plate);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error deleting vehicle.' });
  }
});


// --- CUSTOMERS CRUD ROUTES ---

// Get all customers
app.get('/api/customers', requireAuth, (req, res) => {
  const search = req.query.search || '';
  try {
    const stmt = db.prepare(`
      SELECT c.*, u.UserName as Registered_By_Name 
      FROM Customer c 
      LEFT JOIN Users u ON c.Registered_By = u.id
      WHERE c.FirstName LIKE ? OR c.LastName LIKE ? OR c.Email LIKE ? OR c.PhoneNumber LIKE ?
    `);
    const searchVal = `%${search}%`;
    const rows = stmt.all(searchVal, searchVal, searchVal, searchVal);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching customers.' });
  }
});

// Add a customer
app.post('/api/customers', requireAuth, (req, res) => {
  const { FirstName, LastName, Email, PhoneNumber, Status } = req.body;

  if (!FirstName || !LastName || !Email || !PhoneNumber || !Status) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO Customer (FirstName, LastName, Email, PhoneNumber, Status, Registered_By)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insert.run(FirstName, LastName, Email, PhoneNumber, Status, req.session.user.id);
    res.status(201).json({ message: 'Customer added successfully' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Database error adding customer.' });
  }
});

// Update a customer
app.put('/api/customers/:id', requireAuth, (req, res) => {
  const { FirstName, LastName, Email, PhoneNumber, Status } = req.body;
  const id = Number(req.params.id);

  if (!FirstName || !LastName || !Email || !PhoneNumber || !Status) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const update = db.prepare(`
      UPDATE Customer 
      SET FirstName = ?, LastName = ?, Email = ?, PhoneNumber = ?, Status = ?
      WHERE id = ?
    `);
    const result = update.run(FirstName, LastName, Email, PhoneNumber, Status, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    res.json({ message: 'Customer updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error updating customer.' });
  }
});

// Delete a customer
app.delete('/api/customers/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  try {
    const del = db.prepare('DELETE FROM Customer WHERE id = ?');
    const result = del.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error deleting customer.' });
  }
});

// Get interested vehicles for a customer
app.get('/api/customers/:id/interests', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  try {
    const query = db.prepare('SELECT Vehicle_Plate_Number FROM Customer_Interest WHERE Customer_Id = ?');
    const rows = query.all(id);
    res.json(rows.map(r => r.Vehicle_Plate_Number));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching customer interests.' });
  }
});

// Update interested vehicles for a customer
app.post('/api/customers/:id/interests', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const { vehicles } = req.body; // array of plate numbers

  try {
    // Delete existing interests
    const del = db.prepare('DELETE FROM Customer_Interest WHERE Customer_Id = ?');
    del.run(id);

    // Insert new interests
    if (Array.isArray(vehicles) && vehicles.length > 0) {
      const ins = db.prepare('INSERT INTO Customer_Interest (Customer_Id, Vehicle_Plate_Number) VALUES (?, ?)');
      for (const plate of vehicles) {
        ins.run(id, plate);
      }
    }
    res.json({ message: 'Customer interests updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error updating customer interests.' });
  }
});


// --- PROMOTIONS CRUD ROUTES ---

// Get all promotions
app.get('/api/promotions', requireAuth, (req, res) => {
  const search = req.query.search || '';
  try {
    const stmt = db.prepare(`
      SELECT p.*, u.UserName as Created_By_Name 
      FROM Promotion p 
      LEFT JOIN Users u ON p.Created_By = u.id
      WHERE p.Title LIKE ? OR p.Description LIKE ? OR p.Discount_Type LIKE ?
    `);
    const searchVal = `%${search}%`;
    const rows = stmt.all(searchVal, searchVal, searchVal);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching promotions.' });
  }
});

// Add a promotion
app.post('/api/promotions', requireAuth, (req, res) => {
  const { Title, Description, Discount_Type, Discount_Value, Start_Date, End_Date, Status } = req.body;

  if (!Title || !Discount_Type || Discount_Value === undefined || !Start_Date || !End_Date || !Status) {
    return res.status(400).json({ error: 'Required fields are missing.' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO Promotion (Title, Description, Discount_Type, Discount_Value, Start_Date, End_Date, Status, Created_By)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(Title, Description || '', Discount_Type, Number(Discount_Value), Start_Date, End_Date, Status, req.session.user.id);
    res.status(201).json({ message: 'Promotion added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error adding promotion.' });
  }
});

// Update a promotion
app.put('/api/promotions/:id', requireAuth, (req, res) => {
  const { Title, Description, Discount_Type, Discount_Value, Start_Date, End_Date, Status } = req.body;
  const id = Number(req.params.id);

  if (!Title || !Discount_Type || Discount_Value === undefined || !Start_Date || !End_Date || !Status) {
    return res.status(400).json({ error: 'Required fields are missing.' });
  }

  try {
    const update = db.prepare(`
      UPDATE Promotion 
      SET Title = ?, Description = ?, Discount_Type = ?, Discount_Value = ?, Start_Date = ?, End_Date = ?, Status = ?
      WHERE id = ?
    `);
    const result = update.run(Title, Description || '', Discount_Type, Number(Discount_Value), Start_Date, End_Date, Status, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Promotion not found.' });
    }
    res.json({ message: 'Promotion updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error updating promotion.' });
  }
});

// Delete a promotion
app.delete('/api/promotions/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  try {
    const del = db.prepare('DELETE FROM Promotion WHERE id = ?');
    const result = del.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Promotion not found.' });
    }
    res.json({ message: 'Promotion deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error deleting promotion.' });
  }
});

// Get linked vehicles for a promotion
app.get('/api/promotions/:id/vehicles', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  try {
    const query = db.prepare('SELECT Vehicle_Plate_Number, Performance FROM Promotion_Vehicle WHERE Promotion_Id = ?');
    const rows = query.all(id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching promotion vehicles.' });
  }
});

// Update linked vehicles for a promotion
app.post('/api/promotions/:id/vehicles', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const { vehicles } = req.body; // array of { Plate_Number, Performance }

  try {
    // Delete existing links
    const del = db.prepare('DELETE FROM Promotion_Vehicle WHERE Promotion_Id = ?');
    del.run(id);

    // Insert new links
    if (Array.isArray(vehicles) && vehicles.length > 0) {
      const ins = db.prepare('INSERT INTO Promotion_Vehicle (Promotion_Id, Vehicle_Plate_Number, Performance) VALUES (?, ?, ?)');
      for (const v of vehicles) {
        ins.run(id, v.Plate_Number, v.Performance || 'Medium');
      }
    }
    res.json({ message: 'Promotion vehicles updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error updating promotion vehicles.' });
  }
});


// --- MARKETING REPORTS API ---

// Generate Marketing Report
app.get('/api/reports', requireAuth, (req, res) => {
  try {
    const sql = `
      SELECT 
        (c.FirstName || ' ' || c.LastName) AS Customer_Name,
        v.Brand AS Vehicle_Brand,
        v.Model AS Vehicle_Model,
        p.Title AS Promotion_Title,
        p.Discount_Value AS Discount_Value,
        p.Discount_Type AS Discount_Type,
        pv.Performance AS Performance
      FROM Customer c
      JOIN Customer_Interest ci ON c.id = ci.Customer_Id
      JOIN Vehicle v ON ci.Vehicle_Plate_Number = v.Plate_Number
      JOIN Promotion_Vehicle pv ON v.Plate_Number = pv.Vehicle_Plate_Number
      JOIN Promotion p ON pv.Promotion_Id = p.id
    `;
    const stmt = db.prepare(sql);
    const rows = stmt.all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error generating marketing report.' });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`PMS Server running on http://localhost:${PORT}`);
});
