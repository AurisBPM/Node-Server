// contains all endpoints for functions related to Split Agent functionality ( CS  + QA Apps requests )

const express = require('express');
const mysql = require('mysql2');
const DB_CONFIG = require('../config/db-config');
const { authenticate } = require('./middleware');
const mysqlPool = mysql.createPool(DB_CONFIG).promise();

const router = express.Router();



router.get('/agent', authenticate, async (req, res) => {
  try {
    const [agents] = await mysqlPool.execute(
        `SELECT * FROM agents`,
      );
      return res.json(agents);
  } catch (error) {
    return res.status(500).end();
  }
});

router.get('/split-agent/:agentId', authenticate, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { email } = req.query;
    
    let query, params;
    
    if (email) {
      // If email query parameter is provided, search by email
      query = `SELECT * FROM split_agents WHERE email = ?`;
      params = [email];
    } else {
      // Otherwise, search by agentId (existing behavior)
      query = `SELECT * FROM split_agents WHERE code = ?`;
      params = [agentId];
    }
    
    const [splitAgents] = await mysqlPool.execute(query, params);
    
    return res.json(splitAgents);
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to retrieve split agents' 
    });
  }
});


// allows QA app user to add a split agent details, which the agent will then retrieve with Moerie.CS app

router.post('/split-agent', authenticate, async (req, res) => {
  try {
    console.log('Creating split agent:', req);
    console.log('Creating split agent:', req.data);
    const { code, email, tag } = req.body;
    
    if (!code || !email || !tag) {
      return res.status(400).json({ 
        error: 'Missing required fields. Please provide code, email, and tag.' 
      });
    }
    
    const [result] = await mysqlPool.execute(
      `INSERT INTO split_agents (code, email, tag) VALUES (?, ?, ?)`,
      [code, email, tag]
    );
    
    return res.status(201).json({ 
      message: 'Split agent created successfully',
      id: result.insertId 
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to create split agent' 
    });
  }
});

router.delete('/split-agent/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existingRecord] = await mysqlPool.execute(
      `SELECT * FROM split_agents WHERE id = ?`,
      [id]
    );
    
    if (existingRecord.length === 0) {
      return res.status(404).json({ 
        error: 'Split agent not found' 
      });
    }
        const [result] = await mysqlPool.execute(
      `DELETE FROM split_agents WHERE id = ?`,
      [id]
    );
    
    return res.status(200).json({ 
      message: 'Split agent deleted successfully',
      deletedId: id 
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to delete split agent' 
    });
  }
});

router.get('/split-comments', authenticate, async (req, res) => {
  try {
    const { tag, from_date, to_date } = req.query;
    
    if (!tag) {
      return res.status(400).json({ 
        error: 'Tag parameter is required' 
      });
    }
    
    let query = `SELECT * FROM split_comments WHERE tag = ?`;
    let params = [tag];
    
    if (from_date) {
      query += ` AND created_at >= ?`;
      params.push(from_date);
    }
    
    if (to_date) {
      query += ` AND created_at <= ?`;
      params.push(to_date);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const [splitComments] = await mysqlPool.execute(query, params);
    
    return res.json(splitComments);
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to retrieve split comments' 
    });
  }
});

router.post('/split-comment', authenticate, async (req, res) => {
  try {
    const { ticket_id, agent_id, type, tag } = req.body;
    
    console.log('Creating split comment:', { ticket_id, agent_id, type, tag });  
    
    const [result] = await mysqlPool.execute(
      `INSERT INTO split_comments ( ticket_id, agent_id, type, tag, created_at) VALUES ( ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [ ticket_id, agent_id, type, tag]
    );
    
    return res.status(201).json({ 
      message: 'Split comment created successfully',
      id: result.insertId 
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to create split comment' 
    });
  }
});

module.exports = router;