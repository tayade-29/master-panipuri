const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(
  cors({
    origin: '*', // dev only; later you can restrict
  })
);
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Master Panipuri API running');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/stalls', require('./routes/stalls'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/loyalty', require('./routes/loyalty')); // 👈 add this
app.use('/api/offers', require('./routes/offers'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/admin', require('./routes/admin'));




const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
