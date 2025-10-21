const express = require("express");
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const splitAgentsRoute = require("./src/routes/split-agents");
const qaRoute = require("./src/routes/qa");

const server = express();

// Configure CORS to allow requests from Zendesk apps
server.use(cors({
  origin: function (origin, callback) {
    console.log('CORS Request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://1167845.apps.zdusercontent.com',
      'https://1167762.apps.zdusercontent.com',
      'https://moeriehelp.zendesk.com',
      // Allow HTTPS requests to your VPS
      'https://72.60.18.202:8080',
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));

server.use(express.json()); 
server.use(express.urlencoded({ extended: true })); 

// Test endpoint
server.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Routes
server.use('/', splitAgentsRoute);
server.use('/', qaRoute);

// HTTPS Server Configuration
try {
  // Load SSL certificates
  const httpsOptions = {
    key: fs.readFileSync('./ssl/private.key'),
    cert: fs.readFileSync('./ssl/certificate.crt')
  };

  // Create HTTPS server
  const httpsServer = https.createServer(httpsOptions, server);

  // Start HTTPS server
  httpsServer.listen(8080, () => {
    console.log('🔒 HTTPS Server runs on port 8080');
    console.log('Server is accessible at: https://72.60.18.202:8080');
    console.log('⚠️  Note: Self-signed certificate - browsers will show security warning');
  });

} catch (error) {
  console.log('⚠️  SSL certificates not found, falling back to HTTP');
  console.log('Error:', error.message);
  
  // Fallback to HTTP server
  server.listen(8080, () => {
    console.log('🌐 HTTP Server runs on port 8080');
    console.log('Server is accessible at: http://72.60.18.202:8080');
  });
}