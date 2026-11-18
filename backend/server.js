require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { connectDB, isFallback } = require('./config/db');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for now to prevent CORS issues
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Grok-API-Key']
}));
app.options('*', cors()); // Explicitly handle OPTIONS requests for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/interviews', require('./routes/interviews'));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: isFallback() ? 'json-fallback' : 'mongodb'
  });
});

const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

// Root Route
app.get('/', (req, res) => {
  res.send('AI-Powered Interview Prep API is running...');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

connectDB();

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
    console.log(`📡 Health endpoint: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
