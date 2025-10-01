const express = require('express');
const router = express.Router();
const emailService = require('../services/EmailService');

router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    console.log('Email request received:', { to: to ? '***' : 'MISSING', subject });
    const result = await emailService.sendEmail(to, subject, html);
    res.json(result);
  } catch (error) {
    console.error('Email failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
