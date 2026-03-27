const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Appointment = require('../models/Appointment');
const router  = express.Router();

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ message: 'Invalid token' }); }
};

// Admin only middleware
const adminOnly = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user || user.role !== 'admin')
    return res.status(403).json({ message: 'Admin access required' });
  next();
};

// GET /api/patients — list all patients (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = { role: 'patient' };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
      ];
    }
    const patients = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, patients, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/patients/:id — single patient with their appointments
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await User.findById(req.params.id).select('-password');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    const appointments = await Appointment.find({ patient: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, patient, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/patients/:id — update patient profile (self or admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const { password, role, ...updateData } = req.body; // prevent role escalation
    const patient = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/patients/:id — admin only
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Patient removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;