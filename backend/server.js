require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');

const app = express();

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB
});

// -------------------- ROUTES --------------------

// 🌾 Homepage (FARMEASY landing)
app.get('/', (req, res) => {
  res.render('home');
});

// 👨‍🌾 Register Farmer (form page)
app.get('/register', (req, res) => {
  res.render('register');
});

// 👨‍🌾 Save Farmer registration
app.post('/register', async (req, res) => {
  try {
    const { name, phone, email, state, address } = req.body;
    const conn = await pool.getConnection();

    const [result] = await conn.query(
      'INSERT INTO farmers (name, phone, email, state, address) VALUES (?, ?, ?, ?, ?)',
      [name, phone, email, state, address]
    );

    conn.release();
    const farmerId = result.insertId;

    // Redirect to dashboard after registration
    res.redirect(`/dashboard/${farmerId}`);
  } catch (err) {
    console.error('❌ Register error:', err);
    res.status(500).send('Error registering farmer');
  }
});

// 📊 Dashboard
app.get('/dashboard/:id', async (req, res) => {
  const farmerId = req.params.id;
  const conn = await pool.getConnection();

  try {
    // Farmer details
    const [farmers] = await conn.query('SELECT * FROM farmers WHERE id = ?', [farmerId]);
    if (!farmers || farmers.length === 0) {
      conn.release();
      return res.status(404).send('Farmer not found');
    }
    const farmer = farmers[0];

    // Crop summary
    const [crops] = await conn.query(
      'SELECT id, name, category, quantity_kg, IFNULL(quantity_kg, 0) AS remaining_qty FROM crops WHERE farmer_id = ? ORDER BY created_at DESC',
      [farmerId]
    );

    // Sales summary (placeholder)
    const [salesRows] = await conn.query(
      'SELECT COUNT(*) AS total_sales FROM crops WHERE farmer_id = ?',
      [farmerId]
    );
    const sales = salesRows[0] || { total_sales: 0 };

    conn.release();

    res.render('dashboard', { farmer, crops, sales });
  } catch (err) {
    conn.release();
    console.error('❌ Dashboard error:', err);
    res.status(500).send('Error loading dashboard');
  }
});

// 🧑‍🌾 Profile page
app.get('/profile/:id', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM farmers WHERE id = ?', [req.params.id]);
    conn.release();

    if (rows.length === 0) return res.status(404).send('Farmer not found');
    res.render('profile', { farmer: rows[0] });
  } catch (err) {
    console.error('❌ Profile error:', err);
    res.status(500).send('Error loading profile');
  }
});

// 🌾 Add Crop (form)
app.get('/add-crop', (req, res) => {
  const farmer_id = req.query.farmer_id;
  res.render('add_crop', { farmer_id });
});

// 🌾 Save Crop
app.post('/add-crop', async (req, res) => {
  try {
    const { farmer_id, name, category, quantity_kg, price_per_kg } = req.body;
    const conn = await pool.getConnection();

    await conn.query(
      'INSERT INTO crops (farmer_id, name, category, quantity_kg, price_per_kg) VALUES (?, ?, ?, ?, ?)',
      [farmer_id, name, category, quantity_kg, price_per_kg]
    );

    conn.release();
    res.redirect(`/dashboard/${farmer_id}`);
  } catch (err) {
    console.error('❌ Add Crop error:', err);
    res.status(500).send('Error adding crop');
  }
});

// 💰 Sales page (placeholder)
app.get('/sales/:id', async (req, res) => {
  try {
    res.render('sales', { sales: [] });
  } catch (err) {
    console.error('❌ Sales error:', err);
    res.status(500).send('Error loading sales');
  }
});

// ------------------------------------------------

// 🧠 Smart Port Handling
const DEFAULT_PORT = process.env.PORT || 8080;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('❌ Server error:', err);
    }
  });
};

startServer(DEFAULT_PORT);