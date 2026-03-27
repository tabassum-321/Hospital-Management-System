const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Can be a registered patient or guest
  patient:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  patientName:   { type: String, required: true },
  email:         { type: String },
  phone:         { type: String },
  age:           { type: Number },
  gender:        { type: String },

  doctor:        { type: String, required: true },  // Doctor name string
  doctorRef:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department:    { type: String, required: true },

  date:          { type: String, required: true },
  time:          { type: String, required: true },
  reason:        { type: String },

  status:        { type: String, enum: ['pending','confirmed','completed','cancelled'], default: 'pending' },
  notes:         { type: String },          // Doctor's notes post-visit
  prescription:  { type: String },
  cancelReason:  { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);