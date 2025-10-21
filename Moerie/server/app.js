const express = require("express");
const cors = require('cors');
const splitAgentsRoute = require("./src/routes/split-agents");
const qaRoute = require("./src/routes/qa");

const server = express();

// Configure CORS to allow requests from Zendesk
server.use(cors({
  origin: [
    'https://1167845.apps.zdusercontent.com',
    'https://1167762.apps.zdusercontent.com',
    'https://moeriehelp.zendesk.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));

server.use(express.json()); 
server.use(express.urlencoded({ extended: true })); 

// Routes
server.use('/', splitAgentsRoute);
server.use('/', qaRoute);

server.listen(8080, () => {
  console.log('Server runs on port 8080');
});