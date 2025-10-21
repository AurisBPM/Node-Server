const express = require("express");
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

server.listen(8080, () => {
  console.log('Server runs on port 8080');
});