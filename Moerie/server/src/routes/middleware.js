require('dotenv').config();

module.exports = {
    authenticate: (req, res, next) => {
      try {
        const supportKey = req.headers['x-support-key'];
        const validKey = process.env.SUPPORT_KEY;
        
        if (!supportKey || !validKey || supportKey !== validKey) {
          return res.status(401).json({ error: 'Invalid support key' });
        }
        
        next();
      } catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
      }
    },
  };