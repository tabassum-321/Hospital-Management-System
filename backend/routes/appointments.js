const express     = require('express');
const jwt         = require('jsonwebtoken');
const Appointment = require('../models/Appointment');
const { sendAppointmentConfirmation, sendStatusUpdate } = require('../config/email');
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

// POST /api/appointments/book  — public (guest or logged-in)
router.post('/book', async (req, res) => {
  try {
    const { patientName, email, phone, age, gender, doctor, department, date, time, reason } = req.body;
    if (!patientName || !doctor || !department || !date || !time)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    // Check for slot conflict
    const conflict = await Appointment.findOne({ doctor, date, time, status: { $ne: 'cancelled' } });
    if (conflict)
      return res.status(400).json({ success: false, message: 'This slot is already booked. Please choose another time.' });

    const appt = await Appointment.create({ patientName, email, phone, age, gender, doctor, department, date, time, reason });
    // Send confirmation email (non-blocking)
    if (email) sendAppointmentConfirmation(appt).catch(()=>{});
    res.status(201).json({ success: true, message: 'Appointment booked successfully!', appointment: appt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/appointments/my  — patient's own appointments
router.get('/my', auth, async (req, res) => {
  try {
    const appts = await Appointment.find({ patient: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, appointments: appts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/appointments/all  — admin
router.get('/all', auth, async (req, res) => {
  try {
    const { status, date, department } = req.query;
    const filter = {};
    if (status)     filter.status = status;
    if (date)       filter.date = date;
    if (department) filter.department = department;
    const appts = await Appointment.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, appointments: appts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/appointments/:id/status  — admin/doctor update status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, notes, cancelReason } = req.body;
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, ...(notes && { notes }), ...(cancelReason && { cancelReason }) },
      { new: true }
    );
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, appointment: appt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/appointments/:id  — cancel
router.delete('/:id', auth, async (req, res) => {
  try {
    await Appointment.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;