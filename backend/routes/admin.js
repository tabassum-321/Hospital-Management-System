const express     = require('express');
const jwt         = require('jsonwebtoken');
const User        = require('../models/User');
const Appointment = require('../models/Appointment');
const router      = express.Router();

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ message: 'Invalid token' }); }
};

// Admin check
const adminOnly = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user || user.role !== 'admin')
    return res.status(403).json({ message: 'Admin access required' });
  next();
};

// GET /api/admin/stats — dashboard stats
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [totalPatients, totalDoctors, totalAppointments, pendingToday, confirmedToday] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: today, status: 'pending' }),
      Appointment.countDocuments({ date: today, status: 'confirmed' }),
    ]);
    res.json({ success: true, totalPatients, totalDoctors, totalAppointments, pendingToday, confirmedToday });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/appointments — all appointments with optional filters
router.get('/appointments', auth, adminOnly, async (req, res) => {
  try {
    const { status, date, department, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status)     filter.status = status;
    if (date)       filter.date = date;
    if (department) filter.department = department;
    const appointments = await Appointment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Appointment.countDocuments(filter);
    res.json({ success: true, appointments, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/doctors — add a new doctor account
router.post('/doctors', auth, adminOnly, async (req, res) => {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const doctor = await User.create({ ...req.body, role: 'doctor' });
    res.status(201).json({ success: true, doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/appointments/:id — update any appointment
router.put('/appointments/:id', auth, adminOnly, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!appt) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, appointment: appt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/reports/monthly — monthly appointment report
router.get('/reports/monthly', auth, adminOnly, async (req, res) => {
  try {
    const year  = req.query.year || new Date().getFullYear();
    const month = req.query.month; // optional: filter by month too
    const report = await Appointment.aggregate([
      {
        $group: {
          _id: { $substr: ['$date', 0, 7] }, // YYYY-MM
          total:     { $sum: 1 },
          confirmed: { $sum: { $cond: [{ $eq: ['$status','confirmed'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status','completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status','cancelled'] }, 1, 0] } },
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/reports/department — by department
router.get('/reports/department', auth, adminOnly, async (req, res) => {
  try {
    const report = await Appointment.aggregate([
      { $group: { _id: '$department', total: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;