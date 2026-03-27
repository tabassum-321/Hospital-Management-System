// ===== routes/doctors.js =====
const express = require('express');
const User    = require('../models/User');
const Doctor  = require('../models/Doctor');
const router  = express.Router();

// GET /api/doctors  — list all doctors
router.get('/', async (req, res) => {
  try {
    const { department } = req.query;
    const filter = { role: 'doctor', isActive: true };
    const users = await User.find(filter).select('-password');
    res.json({ success: true, doctors: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/doctors/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await User.findById(req.params.id).select('-password');
    if (!doc) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ success: true, doctor: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;


// ===== routes/patients.js — save to separate file =====
// GET /api/patients — admin only would list all patients
// For simplicity shown here as combined export below
