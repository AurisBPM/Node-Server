const express = require("express");
const cors = require('cors');
const splitAgentsRoute = require("./src/routes/split-agents");
const qaRoute = require("./src/routes/qa");

const server = express();

// Configure CORS to allow requests from Zendesk
server.use(cors());

server.use(express.json()); 
server.use(express.urlencoded({ extended: true })); 

// Add Access-Control-Allow-Origin header
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes
server.use('/', splitAgentsRoute);
server.use('/', qaRoute);

server.listen(8080, () => {
  console.log('Server runs on port 8080');
});