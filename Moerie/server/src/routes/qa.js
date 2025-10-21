// contains all endpoints for functions related to QA App functionality

const express = require('express');
const mysql = require('mysql2');
const DB_CONFIG = require('../config/db-config');
const { authenticate } = require('./middleware');
const mysqlPool = mysql.createPool(DB_CONFIG).promise();

const router = express.Router();


router.get('/reports', authenticate, async (req, res) => {
  try {
    const { agent_id, tag, status, from, to } = req.query;
    
  
    if (agent_id && (isNaN(agent_id) || !Number.isInteger(Number(agent_id)))) {
      return res.status(400).json({ 
        error: 'agent_id must be a valid integer.' 
      });
    }

    
    let query = 'SELECT * FROM reports WHERE 1=1';
    const params = [];
    
    if (agent_id) {
      query += ' AND agent_id = ?';
      params.push(agent_id);
    }
    
    if (tag) {
      query += ' AND tag = ?';
      params.push(tag);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (from) {
      query += ' AND created_at >= ?';
      params.push(from);
    }
    
    if (to) {
      query += ' AND created_at <= ?';
      params.push(to);
    }
    
    
    const [reports] = await mysqlPool.execute(query, params);
    
    
    const reportsWithTickets = await Promise.all(
      reports.map(async (report) => {
        const [tickets] = await mysqlPool.execute(
          `SELECT * FROM tickets WHERE report_id = ?`,
          [report.id]
        );
        
        return {
          ...report,
          tickets: tickets
        };
      })
    );
    
    
    return res.json(reportsWithTickets);
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to retrieve reports' 
    });
  }
});

router.get('/reports/:agentId', authenticate, async (req, res) => {
  try {
    const { agentId } = req.params;
    
    
    if (isNaN(agentId) || !Number.isInteger(Number(agentId))) {
      return res.status(400).json({ 
        error: 'agentId must be a valid integer.' 
      });
    }
    
    const [reports] = await mysqlPool.execute(
      `SELECT * FROM reports WHERE agent_id = ?`,
      [agentId]
    );
    
    
    const reportsWithTickets = await Promise.all(
      reports.map(async (report) => {
        const [tickets] = await mysqlPool.execute(
          `SELECT * FROM tickets WHERE report_id = ?`,
          [report.id]
        );
        
        return {
          ...report,
          tickets: tickets
        };
      })
    );
    
    
    return res.json(reportsWithTickets);
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to retrieve reports' 
    });
  }
});

router.post('/report', authenticate, async (req, res) => {
  try {
    const { name, agent_id, tag } = req.body;
    
    
    if (!name || !agent_id) {
      return res.status(400).json({ 
        error: 'Missing required fields. Please provide name and agent_id.' 
      });
    }
    
    if (isNaN(agent_id) || !Number.isInteger(Number(agent_id))) {
      return res.status(400).json({ 
        error: 'agent_id must be a valid integer.' 
      });
    }
    
    const [result] = await mysqlPool.execute(
      `INSERT INTO reports (name, agent_id, tag) VALUES (?, ?, ?)`,
      [name, agent_id, tag || null]
    );
    
    
    return res.status(201).json({ 
      message: 'Report created successfully',
      id: result.insertId 
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to create report' 
    });
  }
});

router.get('/report/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ 
        error: 'Report ID must be a valid integer.' 
      });
    }
    
    const [reports] = await mysqlPool.execute(
      `SELECT * FROM reports WHERE id = ?`,
      [id]
    );
    
    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    return res.json(reports[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve report' });
  }
});

router.put('/report/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(updateData);

    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ 
        error: 'Report ID must be a valid integer.' 
      });
    }

    const [existingReport] = await mysqlPool.execute(
      `SELECT * FROM reports WHERE id = ?`,
      [id]
    );

    if (existingReport.length === 0) {
      return res.status(404).json({ 
        error: 'Report not found' 
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        error: 'No update data provided.' 
      });
    }

    const connection = await mysqlPool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Build dynamic update query from provided fields (no field allowlist)
      const updateFields = [];
      const updateValues = [];

      for (const [key, value] of Object.entries(updateData)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }

      updateFields.push('updated_at = NOW()');
      updateValues.push(id);

      const query = `UPDATE reports SET ${updateFields.join(', ')} WHERE id = ?`;

      await connection.execute(query, updateValues);

      await connection.commit();

      const [updatedReport] = await connection.execute(
        `SELECT * FROM reports WHERE id = ?`,
        [id]
      );

      return res.status(200).json({ 
        message: 'Report updated successfully',
        report: updatedReport[0]
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to update report' 
    });
  }
});

router.post('/tickets', authenticate, async (req, res) => {
  try {
    const { tickets } = req.body;
    
    if (!Array.isArray(tickets)) {
      return res.status(400).json({ 
        error: 'tickets must be an array.' 
      });
    }
    
    if (tickets.length === 0) {
      return res.status(400).json({ 
        error: 'tickets array cannot be empty.' 
      });
    }
    
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (!ticket.id || !ticket.report_id) {
        return res.status(400).json({ 
          error: `Ticket at index ${i} is missing required fields. Each ticket must have id and report_id.` 
        });
      }
    }
    
    const insertPromises = tickets.map(ticket => 
      mysqlPool.execute(
        `INSERT INTO tickets (id, report_id, subject) VALUES (?, ?, ?)`,
        [ticket.id, ticket.report_id, ticket.subject || null]
      )
    );
    
    const results = await Promise.all(insertPromises);
    
    
    return res.status(201).json({ 
      message: `${tickets.length} tickets created successfully`,
      createdCount: tickets.length 
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to create tickets' 
    });
  }
});

router.get('/tickets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ 
        error: 'Ticket ID must be a valid integer.' 
      });
    }
    
    const [tickets] = await mysqlPool.execute(
      `SELECT * FROM tickets WHERE id = ?`,
      [id]
    );
    
    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    return res.json(tickets[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve ticket' });
  }
});

router.get('/tickets', authenticate, async (req, res) => {
  try {
    const { report_id } = req.query;

    if (!report_id) {
      return res.status(400).json({ error: 'report_id query parameter is required.' });
    }

    if (isNaN(report_id) || !Number.isInteger(Number(report_id))) {
      return res.status(400).json({ error: 'report_id must be a valid integer.' });
    }

    const [tickets] = await mysqlPool.execute(
      `SELECT * FROM tickets WHERE report_id = ?`,
      [report_id]
    );

    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve tickets' });
  }
});

router.put('/tickets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(updateData);
    
    
    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ 
        error: 'Ticket ID must be a valid integer.' 
      });
    }
    
    const [existingTicket] = await mysqlPool.execute(
      `SELECT * FROM tickets WHERE id = ?`,
      [id]
    );
    
    if (existingTicket.length === 0) {
      return res.status(404).json({ 
        error: 'Ticket not found' 
      });
    }
    
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        error: 'No update data provided.' 
      });
    }
    
    const updateFields = [];
    const updateValues = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    }
    
    updateFields.push('updated_at = NOW()');
    
    updateValues.push(id);
    
    const query = `UPDATE tickets SET ${updateFields.join(', ')} WHERE id = ?`;
    
    
    const [result] = await mysqlPool.execute(query, updateValues);
    
    
    const [updatedTicket] = await mysqlPool.execute(
      `SELECT * FROM tickets WHERE id = ?`,
      [id]
    );
    
    return res.status(200).json({ 
      message: 'Ticket updated successfully',
      ticket: updatedTicket[0]
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to update ticket' 
    });
  }
});

router.delete('/report/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    
    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ 
        error: 'Report ID must be a valid integer.' 
      });
    }
    
    const [existingReport] = await mysqlPool.execute(
      `SELECT * FROM reports WHERE id = ?`,
      [id]
    );
    
    if (existingReport.length === 0) {
      return res.status(404).json({ 
        error: 'Report not found' 
      });
    }
    
    const [ticketsToDelete] = await mysqlPool.execute(
      `SELECT COUNT(*) as count FROM tickets WHERE report_id = ?`,
      [id]
    );
    
    const ticketCount = ticketsToDelete[0].count;
    
    const connection = await mysqlPool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [ticketDeleteResult] = await connection.execute(
        `DELETE FROM tickets WHERE report_id = ?`,
        [id]
      );
      
      const [reportDeleteResult] = await connection.execute(
        `DELETE FROM reports WHERE id = ?`,
        [id]
      );
      
      
      await connection.commit();
      
      
      return res.status(200).json({ 
        message: 'Report and associated tickets deleted successfully',
        deletedReportId: id,
        deletedTicketsCount: ticketCount
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to delete report' 
    });
  }
});

router.delete('/tickets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    
    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ 
        error: 'Ticket ID must be a valid integer.' 
      });
    }
    
    const [existingTicket] = await mysqlPool.execute(
      `SELECT * FROM tickets WHERE id = ?`,
      [id]
    );
    
    if (existingTicket.length === 0) {
      return res.status(404).json({ 
        error: 'Ticket not found' 
      });
    }
    
    const [result] = await mysqlPool.execute(
      `DELETE FROM tickets WHERE id = ?`,
      [id]
    );
    
    
    return res.status(200).json({ 
      message: 'Ticket deleted successfully',
      deletedTicketId: id
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to delete ticket' 
    });
  }
});

module.exports = router;